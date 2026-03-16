export type VoiceAgentStatus =
  | 'unconfigured'
  | 'idle'
  | 'connecting'
  | 'authenticating'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error'

export type VoiceStateSummary = {
  missingFields: string[]
  ambiguousFields: string[]
  readyForConfirmation: boolean
}

export type VoiceConversationRole = 'user' | 'agent' | 'system' | 'error'

export type VoiceConversationMessage = {
  id: string
  role: VoiceConversationRole
  text: string
  createdAt: string
  source: 'text' | 'transcript' | 'event'
}

export type VoiceAgentContext = {
  orgId: string
  teamId: string | null
  coachId: string | null
  locale: string
}

export type VoiceAuthMessage = {
  type: 'auth'
  access_token: string
}

export type VoiceSessionInitMessage = {
  type: 'session_init'
  org_id: string
  team_id: string | null
  coach_id: string | null
  evaluation_flow: 'create_evaluation'
  locale: string
}

export type VoiceInputTextMessage = {
  type: 'input_text'
  text: string
}

export type VoiceInputAudioChunkMessage = {
  type: 'input_audio_chunk'
  data: string
  sample_rate_hz: 16000
  channels: 1
  format: 'pcm16le'
  seq?: number
  timestamp_ms?: number
}

export type VoiceClientEventMessage = {
  type: 'client_event'
  name: 'end_of_utterance'
}

export type VoiceSessionControlMessage = {
  type: 'session_control'
  action: 'reset'
}

export type VoiceClientMessage =
  | VoiceAuthMessage
  | VoiceSessionInitMessage
  | VoiceInputTextMessage
  | VoiceInputAudioChunkMessage
  | VoiceClientEventMessage
  | VoiceSessionControlMessage

export type VoiceAuthOkMessage = {
  type: 'auth_ok'
  session_id: string
}

export type VoiceAuthErrorMessage = {
  type: 'auth_error'
  message: string
}

export type VoicePartialTranscriptMessage = {
  type: 'partial_transcript'
  text: string
}

export type VoiceFinalTranscriptMessage = {
  type: 'final_transcript'
  text: string
}

export type VoiceAgentMessage = {
  type: 'agent_message'
  text: string
}

export type VoiceAgentAudioChunkMessage = {
  type: 'agent_audio_chunk'
  data: string
  sample_rate_hz?: number
  channels?: number
  format?: 'pcm16le'
  seq?: number
}

export type VoiceStateUpdateMessage = {
  type: 'state_update'
  summary?: {
    missing_fields?: unknown[]
    ambiguous_fields?: unknown[]
    ready_for_confirmation?: boolean
  }
}

export type VoiceToolCallMessage = {
  type: 'tool_call'
  name: string
  args?: Record<string, unknown>
}

export type VoiceToolResultMessage = {
  type: 'tool_result'
  name: string
  result?: Record<string, unknown>
}

export type VoiceErrorMessage = {
  type: 'error'
  code?: string
  message: string
}

export type VoicePongMessage = {
  type: 'pong'
  id: string
}

export type VoiceServerMessage =
  | VoiceAuthOkMessage
  | VoiceAuthErrorMessage
  | VoicePartialTranscriptMessage
  | VoiceFinalTranscriptMessage
  | VoiceAgentMessage
  | VoiceAgentAudioChunkMessage
  | VoiceStateUpdateMessage
  | VoiceToolCallMessage
  | VoiceToolResultMessage
  | VoiceErrorMessage
  | VoicePongMessage
