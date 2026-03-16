import * as React from 'react'
import { ensureValidSession } from '../../../shared/auth/authClient'
import {
  decodeBase64ToInt16,
  downsampleTo16k,
  encodeInt16ToBase64,
  float32ToInt16,
  pcm16ToFloat32,
} from '../voice/audio'
import { getVoiceAgentWebSocketUrl } from '../voice/config'
import type {
  VoiceAgentContext,
  VoiceAgentStatus,
  VoiceClientMessage,
  VoiceConversationMessage,
  VoiceServerMessage,
  VoiceStateSummary,
} from '../voice/types'

const DEFAULT_SUMMARY: VoiceStateSummary = {
  missingFields: [],
  ambiguousFields: [],
  readyForConfirmation: false,
}

const MAX_MESSAGES = 80
const RECONNECT_DELAYS_MS = [1000, 2000, 5000, 10000, 15000]

type UseVoiceAgentOptions = {
  orgId: string | null
  teamId: string | null
  coachId: string | null
  locale?: string
  enabled?: boolean
}

type PlaybackChunk = {
  floats: Float32Array
  sampleRate: number
}

type StopRecordingOptions = {
  notifyServer: boolean
}

function createConversationMessage(
  role: VoiceConversationMessage['role'],
  text: string,
  source: VoiceConversationMessage['source'],
): VoiceConversationMessage {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    role,
    text,
    source,
    createdAt: new Date().toISOString(),
  }
}

function appendConversationMessage(
  previous: VoiceConversationMessage[],
  message: VoiceConversationMessage,
) {
  const next = [...previous, message]
  return next.slice(-MAX_MESSAGES)
}

function normalizeStateField(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value.map((item) => normalizeStateField(item)).filter(Boolean).join(', ')
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const preferred = [record.label, record.field, record.name, record.value].find(
      (item) => typeof item === 'string' && item.trim(),
    )
    if (typeof preferred === 'string') return preferred
    try {
      return JSON.stringify(record)
    } catch {
      return 'Unknown field'
    }
  }
  return 'Unknown field'
}

function normalizeSummary(summary?: Record<string, unknown>): VoiceStateSummary {
  const missingFields = Array.isArray(summary?.missing_fields)
    ? summary.missing_fields.map((item) => normalizeStateField(item))
    : []
  const ambiguousFields = Array.isArray(summary?.ambiguous_fields)
    ? summary.ambiguous_fields.map((item) => normalizeStateField(item))
    : []

  return {
    missingFields,
    ambiguousFields,
    readyForConfirmation: Boolean(summary?.ready_for_confirmation),
  }
}

function getAudioContextClass() {
  if (typeof window === 'undefined') return null
  return (
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ??
    null
  )
}

export function useVoiceAgent({
  orgId,
  teamId,
  coachId,
  locale = 'en-US',
  enabled = true,
}: UseVoiceAgentOptions) {
  const wsUrl = React.useMemo(() => getVoiceAgentWebSocketUrl(), [])
  const sessionContext = React.useMemo<VoiceAgentContext | null>(() => {
    const nextOrgId = orgId?.trim() || ''
    if (!nextOrgId) return null

    return {
      orgId: nextOrgId,
      teamId: teamId?.trim() || null,
      coachId: coachId?.trim() || null,
      locale: locale.trim() || 'en-US',
    }
  }, [coachId, locale, orgId, teamId])
  const sessionContextKey = React.useMemo(
    () => JSON.stringify(sessionContext),
    [sessionContext],
  )

  const socketRef = React.useRef<WebSocket | null>(null)
  const reconnectTimerRef = React.useRef<number | null>(null)
  const shouldReconnectRef = React.useRef(false)
  const manualDisconnectRef = React.useRef(false)
  const connectingRef = React.useRef(false)
  const authCompleteRef = React.useRef(false)
  const sessionContextKeyRef = React.useRef<string | null>(null)
  const audioContextRef = React.useRef<AudioContext | null>(null)
  const micStreamRef = React.useRef<MediaStream | null>(null)
  const sourceNodeRef = React.useRef<MediaStreamAudioSourceNode | null>(null)
  const processorNodeRef = React.useRef<ScriptProcessorNode | null>(null)
  const playbackQueueRef = React.useRef<PlaybackChunk[]>([])
  const playbackBusyRef = React.useRef(false)
  const reconnectAttemptRef = React.useRef(0)
  const audioSequenceRef = React.useRef(0)

  const [status, setStatus] = React.useState<VoiceAgentStatus>(() =>
    wsUrl ? 'idle' : 'unconfigured',
  )
  const [error, setError] = React.useState<string | null>(null)
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [summary, setSummary] = React.useState<VoiceStateSummary>(DEFAULT_SUMMARY)
  const [partialTranscript, setPartialTranscript] = React.useState('')
  const [finalTranscript, setFinalTranscript] = React.useState('')
  const [messages, setMessages] = React.useState<VoiceConversationMessage[]>([])
  const [isRecording, setIsRecording] = React.useState(false)
  const [isReady, setIsReady] = React.useState(false)

  const isConfigured = Boolean(wsUrl)
  const audioContextClass = React.useMemo(() => getAudioContextClass(), [])
  const isMicSupported = Boolean(
    audioContextClass &&
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices?.getUserMedia,
  )

  const appendMessage = React.useCallback(
    (
      role: VoiceConversationMessage['role'],
      text: string,
      source: VoiceConversationMessage['source'],
    ) => {
      const trimmed = text.trim()
      if (!trimmed) return
      setMessages((previous) =>
        appendConversationMessage(
          previous,
          createConversationMessage(role, trimmed, source),
        ),
      )
    },
    [],
  )

  const ensureAudioContext = React.useCallback(async () => {
    if (!audioContextClass) {
      throw new Error('Web Audio is not available in this browser.')
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new audioContextClass()
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }

    return audioContextRef.current
  }, [audioContextClass])

  const playNextChunk = React.useCallback(async () => {
    if (playbackQueueRef.current.length === 0) {
      playbackBusyRef.current = false
      return
    }

    playbackBusyRef.current = true

    try {
      const audioContext = await ensureAudioContext()
      const nextChunk = playbackQueueRef.current.shift()
      if (!nextChunk) {
        playbackBusyRef.current = false
        return
      }

      const buffer = audioContext.createBuffer(
        1,
        nextChunk.floats.length,
        nextChunk.sampleRate,
      )
      buffer.copyToChannel(nextChunk.floats, 0, 0)

      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(audioContext.destination)
      source.onended = () => {
        void playNextChunk()
      }
      source.start()
    } catch (err: any) {
      playbackBusyRef.current = false
      setError(err?.message || 'Failed to play audio from the voice agent.')
    }
  }, [ensureAudioContext])

  const enqueuePlayback = React.useCallback(
    (base64: string, sampleRate = 16000) => {
      const pcm16 = decodeBase64ToInt16(base64)
      playbackQueueRef.current.push({
        floats: pcm16ToFloat32(pcm16),
        sampleRate,
      })

      if (!playbackBusyRef.current) {
        void playNextChunk()
      }
    },
    [playNextChunk],
  )

  const clearReconnectTimer = React.useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const sendRaw = React.useCallback((payload: VoiceClientMessage) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false
    }

    socket.send(JSON.stringify(payload))
    return true
  }, [])

  const resetLocalSessionState = React.useCallback(() => {
    setSummary(DEFAULT_SUMMARY)
    setPartialTranscript('')
    setFinalTranscript('')
  }, [])

  const sendSessionInit = React.useCallback(
    (options?: { resetFirst?: boolean; announceReset?: boolean }) => {
      if (!sessionContext || !authCompleteRef.current) {
        return false
      }

      if (options?.resetFirst) {
        sendRaw({ type: 'session_control', action: 'reset' })
        resetLocalSessionState()
        if (options.announceReset) {
          appendMessage(
            'system',
            'Voice session restarted with the latest evaluation context.',
            'event',
          )
        }
      }

      const sent = sendRaw({
        type: 'session_init',
        org_id: sessionContext.orgId,
        team_id: sessionContext.teamId,
        coach_id: sessionContext.coachId,
        evaluation_flow: 'create_evaluation',
        locale: sessionContext.locale,
      })

      if (!sent) return false

      sessionContextKeyRef.current = sessionContextKey
      setIsReady(true)
      setStatus('connected')
      return true
    },
    [
      appendMessage,
      resetLocalSessionState,
      sendRaw,
      sessionContext,
      sessionContextKey,
    ],
  )

  const stopRecordingInternal = React.useCallback(
    ({ notifyServer }: StopRecordingOptions = { notifyServer: true }) => {
      if (processorNodeRef.current) {
        processorNodeRef.current.disconnect()
        processorNodeRef.current.onaudioprocess = null
        processorNodeRef.current = null
      }

      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect()
        sourceNodeRef.current = null
      }

      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop())
        micStreamRef.current = null
      }

      if (notifyServer) {
        sendRaw({ type: 'client_event', name: 'end_of_utterance' })
      }

      setIsRecording(false)
    },
    [sendRaw],
  )

  const disconnectInternal = React.useCallback(
    (options?: { manual?: boolean; suppressReconnect?: boolean }) => {
      clearReconnectTimer()
      stopRecordingInternal({ notifyServer: false })
      playbackQueueRef.current = []
      playbackBusyRef.current = false
      authCompleteRef.current = false
      sessionContextKeyRef.current = null
      setIsReady(false)
      setSessionId(null)

      if (options?.manual) {
        manualDisconnectRef.current = true
      }

      if (options?.suppressReconnect) {
        shouldReconnectRef.current = false
      }

      const socket = socketRef.current
      socketRef.current = null

      if (socket) {
        socket.onopen = null
        socket.onmessage = null
        socket.onerror = null
        socket.onclose = null

        if (
          socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING
        ) {
          socket.close()
        }
      }
    },
    [clearReconnectTimer, stopRecordingInternal],
  )

  const connect = React.useCallback(async () => {
    if (!enabled) return
    if (!wsUrl) {
      setStatus('unconfigured')
      setError('ANKOR_VOICE_AGENT_URL is missing.')
      return
    }
    if (!sessionContext) {
      setStatus('idle')
      setError('Organization context is required before the voice agent can connect.')
      return
    }

    const currentSocket = socketRef.current
    if (
      connectingRef.current ||
      currentSocket?.readyState === WebSocket.OPEN ||
      currentSocket?.readyState === WebSocket.CONNECTING
    ) {
      return
    }

    connectingRef.current = true
    clearReconnectTimer()
    manualDisconnectRef.current = false
    setError(null)
    setStatus(reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting')

    try {
      const session = await ensureValidSession()
      const accessToken = session?.accessToken?.trim()

      if (!accessToken) {
        throw new Error('Missing Supabase access token.')
      }

      const socket = new WebSocket(wsUrl)
      socketRef.current = socket

      socket.onopen = () => {
        if (socketRef.current !== socket) return
        setStatus('authenticating')
        socket.send(
          JSON.stringify({
            type: 'auth',
            access_token: accessToken,
          }),
        )
      }

      socket.onmessage = (event) => {
        if (socketRef.current !== socket) return

        let message: VoiceServerMessage

        try {
          message = JSON.parse(event.data) as VoiceServerMessage
        } catch {
          setError('Received an invalid response from the voice agent.')
          appendMessage(
            'error',
            'Received an invalid response from the voice agent.',
            'event',
          )
          return
        }

        switch (message.type) {
          case 'auth_ok': {
            authCompleteRef.current = true
            reconnectAttemptRef.current = 0
            setSessionId(message.session_id || null)
            setError(null)
            appendMessage('system', 'Voice agent connected.', 'event')
            sendSessionInit()
            break
          }

          case 'auth_error': {
            authCompleteRef.current = false
            setIsReady(false)
            setStatus('error')
            setError(message.message || 'Voice agent authentication failed.')
            appendMessage(
              'error',
              message.message || 'Voice agent authentication failed.',
              'event',
            )
            break
          }

          case 'state_update': {
            setSummary(
              normalizeSummary(
                message.summary as Record<string, unknown> | undefined,
              ),
            )
            break
          }

          case 'partial_transcript': {
            setPartialTranscript(message.text || '')
            break
          }

          case 'final_transcript': {
            const transcript = message.text || ''
            setPartialTranscript('')
            setFinalTranscript(transcript)
            appendMessage('user', transcript, 'transcript')
            break
          }

          case 'agent_message': {
            appendMessage('agent', message.text || '', 'text')
            break
          }

          case 'agent_audio_chunk': {
            if (message.data) {
              enqueuePlayback(message.data, message.sample_rate_hz || 16000)
            }
            break
          }

          case 'tool_call': {
            appendMessage('system', `Tool call: ${message.name}`, 'event')
            break
          }

          case 'tool_result': {
            appendMessage('system', `Tool result: ${message.name}`, 'event')
            break
          }

          case 'error': {
            const nextError = message.message || 'Voice agent error.'
            setError(nextError)
            appendMessage(
              'error',
              message.code ? `${message.code}: ${nextError}` : nextError,
              'event',
            )
            break
          }

          case 'pong':
          default:
            break
        }
      }

      socket.onerror = () => {
        if (socketRef.current !== socket) return
        setError('Voice agent socket error.')
      }

      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null
        }

        authCompleteRef.current = false
        sessionContextKeyRef.current = null
        setIsReady(false)
        stopRecordingInternal({ notifyServer: false })

        if (!shouldReconnectRef.current || manualDisconnectRef.current) {
          setStatus('disconnected')
          return
        }

        const attemptIndex = Math.min(
          reconnectAttemptRef.current,
          RECONNECT_DELAYS_MS.length - 1,
        )
        const delay = RECONNECT_DELAYS_MS[attemptIndex]
        reconnectAttemptRef.current += 1
        setStatus('reconnecting')
        appendMessage(
          'system',
          `Voice agent disconnected. Retrying in ${Math.round(delay / 1000)}s.`,
          'event',
        )
        clearReconnectTimer()
        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectTimerRef.current = null
          void connect()
        }, delay)
      }
    } catch (err: any) {
      setStatus('error')
      setError(err?.message || 'Failed to connect to the voice agent.')

      if (shouldReconnectRef.current && !manualDisconnectRef.current) {
        const attemptIndex = Math.min(
          reconnectAttemptRef.current,
          RECONNECT_DELAYS_MS.length - 1,
        )
        const delay = RECONNECT_DELAYS_MS[attemptIndex]
        reconnectAttemptRef.current += 1
        clearReconnectTimer()
        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectTimerRef.current = null
          void connect()
        }, delay)
      }
    } finally {
      connectingRef.current = false
    }
  }, [
    appendMessage,
    clearReconnectTimer,
    enabled,
    enqueuePlayback,
    sendSessionInit,
    sessionContext,
    stopRecordingInternal,
    wsUrl,
  ])

  const disconnect = React.useCallback(() => {
    shouldReconnectRef.current = false
    reconnectAttemptRef.current = 0
    disconnectInternal({ manual: true, suppressReconnect: true })
    setStatus('disconnected')
  }, [disconnectInternal])

  const reconnect = React.useCallback(async () => {
    shouldReconnectRef.current = true
    reconnectAttemptRef.current = 0
    disconnectInternal({ manual: false, suppressReconnect: false })
    await connect()
  }, [connect, disconnectInternal])

  const resetSession = React.useCallback(() => {
    if (!isReady) return false
    return sendSessionInit({ resetFirst: true, announceReset: true })
  }, [isReady, sendSessionInit])

  const sendText = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return false

      if (!isReady) {
        setError('Voice agent is not connected yet.')
        return false
      }

      await ensureAudioContext().catch(() => null)

      const sent = sendRaw({ type: 'input_text', text: trimmed })
      if (!sent) {
        setError('Voice agent is not connected yet.')
        return false
      }

      appendMessage('user', trimmed, 'text')
      return true
    },
    [appendMessage, ensureAudioContext, isReady, sendRaw],
  )

  const startRecording = React.useCallback(async () => {
    if (!isReady) {
      throw new Error('Voice agent is not connected yet.')
    }
    if (!isMicSupported) {
      throw new Error('Microphone streaming is not supported in this browser.')
    }
    if (isRecording) {
      return
    }

    try {
      const audioContext = await ensureAudioContext()
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      const sourceNode = audioContext.createMediaStreamSource(stream)
      const processorNode = audioContext.createScriptProcessor(2048, 1, 1)

      processorNode.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0)
        const downsampled = downsampleTo16k(input, audioContext.sampleRate)
        const pcm16 = float32ToInt16(downsampled)

        sendRaw({
          type: 'input_audio_chunk',
          data: encodeInt16ToBase64(pcm16),
          sample_rate_hz: 16000,
          channels: 1,
          format: 'pcm16le',
          seq: audioSequenceRef.current,
          timestamp_ms: Date.now(),
        })

        audioSequenceRef.current += 1
      }

      sourceNode.connect(processorNode)
      processorNode.connect(audioContext.destination)

      micStreamRef.current = stream
      sourceNodeRef.current = sourceNode
      processorNodeRef.current = processorNode
      setError(null)
      setIsRecording(true)
    } catch (err: any) {
      stopRecordingInternal({ notifyServer: false })
      setError(err?.message || 'Failed to access the microphone.')
      throw err
    }
  }, [ensureAudioContext, isMicSupported, isReady, isRecording, sendRaw])

  React.useEffect(() => {
    shouldReconnectRef.current = enabled

    if (!enabled) {
      disconnectInternal({ manual: true, suppressReconnect: true })
      setStatus(isConfigured ? 'idle' : 'unconfigured')
      return
    }

    if (!isConfigured) {
      disconnectInternal({ manual: true, suppressReconnect: true })
      setStatus('unconfigured')
      setError('ANKOR_VOICE_AGENT_URL is missing.')
      return
    }

    if (!sessionContext) {
      disconnectInternal({ manual: true, suppressReconnect: true })
      setStatus('idle')
      return
    }

    void connect()

    return () => {
      shouldReconnectRef.current = false
      disconnectInternal({ manual: true, suppressReconnect: true })
    }
  }, [connect, disconnectInternal, enabled, isConfigured, sessionContext])

  React.useEffect(() => {
    if (!isReady || !authCompleteRef.current || !sessionContext) {
      return
    }

    if (sessionContextKeyRef.current === sessionContextKey) {
      return
    }

    sendSessionInit({ resetFirst: true, announceReset: true })
  }, [isReady, sendSessionInit, sessionContext, sessionContextKey])

  React.useEffect(() => {
    return () => {
      stopRecordingInternal({ notifyServer: false })
      playbackQueueRef.current = []
      playbackBusyRef.current = false

      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined)
        audioContextRef.current = null
      }
    }
  }, [stopRecordingInternal])

  return {
    wsUrl,
    isConfigured,
    isMicSupported,
    status,
    error,
    sessionId,
    summary,
    partialTranscript,
    finalTranscript,
    messages,
    isRecording,
    isReady,
    connect,
    disconnect,
    reconnect,
    resetSession,
    sendText,
    startRecording,
    stopRecording: () => stopRecordingInternal({ notifyServer: true }),
  }
}
