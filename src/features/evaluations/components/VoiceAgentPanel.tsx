import * as React from 'react'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import GraphicEqIcon from '@mui/icons-material/GraphicEq'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import RefreshIcon from '@mui/icons-material/Refresh'
import WifiOffIcon from '@mui/icons-material/WifiOff'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useVoiceAgent } from '../hooks/useVoiceAgent'

type VoiceAgentPanelProps = {
  orgId: string | null
  teamId: string | null
  teamName?: string | null
  coachId: string | null
}

function formatStatusLabel(status: ReturnType<typeof useVoiceAgent>['status']) {
  switch (status) {
    case 'connected':
      return 'Connected'
    case 'authenticating':
      return 'Authenticating'
    case 'connecting':
      return 'Connecting'
    case 'reconnecting':
      return 'Reconnecting'
    case 'disconnected':
      return 'Disconnected'
    case 'error':
      return 'Error'
    case 'unconfigured':
      return 'Not configured'
    case 'idle':
    default:
      return 'Idle'
  }
}

function getStatusColor(status: ReturnType<typeof useVoiceAgent>['status']) {
  switch (status) {
    case 'connected':
      return 'success' as const
    case 'authenticating':
    case 'connecting':
    case 'reconnecting':
      return 'warning' as const
    case 'error':
    case 'unconfigured':
      return 'error' as const
    case 'disconnected':
      return 'default' as const
    case 'idle':
    default:
      return 'info' as const
  }
}

export default function VoiceAgentPanel({
  orgId,
  teamId,
  teamName,
  coachId,
}: VoiceAgentPanelProps) {
  const [draft, setDraft] = React.useState('')
  const {
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
    disconnect,
    reconnect,
    resetSession,
    sendText,
    startRecording,
    stopRecording,
  } = useVoiceAgent({
    orgId,
    teamId,
    coachId,
    locale: 'en-US',
    enabled: true,
  })

  const handleSend = React.useCallback(async () => {
    const sent = await sendText(draft)
    if (sent) {
      setDraft('')
    }
  }, [draft, sendText])

  const handleDraftKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Enter' || event.shiftKey) return
      event.preventDefault()
      void handleSend()
    },
    [handleSend],
  )

  const handleMicClick = React.useCallback(async () => {
    try {
      if (isRecording) {
        stopRecording()
        return
      }

      await startRecording()
    } catch (err: any) {
      console.error('Voice agent microphone error', err)
    }
  }, [isRecording, startRecording, stopRecording])

  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <AutoAwesomeIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>
                AI voice agent
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Text is wired first. Once connected, the same socket handles microphone streaming,
              live transcripts, and returned PCM audio playback.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              color={getStatusColor(status)}
              label={formatStatusLabel(status)}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => void reconnect()}
              disabled={!isConfigured || !orgId}
            >
              Reconnect
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<WifiOffIcon />}
              onClick={disconnect}
              disabled={status === 'disconnected' || status === 'idle'}
            >
              Disconnect
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={resetSession}
              disabled={!isReady}
            >
              Reset session
            </Button>
          </Stack>
        </Stack>

        {!isConfigured ? (
          <Alert severity="warning">
            Missing <code>ANKOR_VOICE_AGENT_URL</code>. Add it to the frontend env before using
            the agent.
          </Alert>
        ) : null}

        {!orgId ? (
          <Alert severity="warning">
            Missing organization context. The evaluation page needs a valid org before the voice
            agent can initialize a session.
          </Alert>
        ) : null}

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            label={teamId ? `Team: ${teamName || 'Selected team'}` : 'Team: all teams'}
            variant="outlined"
          />
          <Chip
            size="small"
            label={coachId ? 'Coach context synced' : 'Coach context missing'}
            color={coachId ? 'success' : 'default'}
            variant="outlined"
          />
          <Chip size="small" label="Locale: en-US" variant="outlined" />
          {sessionId ? (
            <Chip size="small" label={`Session ${sessionId.slice(0, 8)}`} variant="outlined" />
          ) : null}
        </Stack>

        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          divider={
            <Divider
              flexItem
              orientation="vertical"
              sx={{ display: { xs: 'none', lg: 'block' } }}
            />
          }
        >
          <Stack spacing={1.25} sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              State update
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {summary.missingFields.length > 0 ? (
                summary.missingFields.map((field) => (
                  <Chip
                    key={`missing-${field}`}
                    size="small"
                    color="warning"
                    label={`Missing: ${field}`}
                  />
                ))
              ) : (
                <Chip size="small" label="No missing fields" variant="outlined" />
              )}
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {summary.ambiguousFields.length > 0 ? (
                summary.ambiguousFields.map((field) => (
                  <Chip
                    key={`ambiguous-${field}`}
                    size="small"
                    color="info"
                    label={`Ambiguous: ${field}`}
                  />
                ))
              ) : (
                <Chip size="small" label="No ambiguous fields" variant="outlined" />
              )}
            </Stack>
            {summary.readyForConfirmation ? (
              <Alert severity="success">
                The agent says the evaluation draft is ready for confirmation.
              </Alert>
            ) : (
              <Typography variant="body2" color="text.secondary">
                The agent will surface missing or unclear fields here as it builds the evaluation.
              </Typography>
            )}
          </Stack>

          <Stack spacing={1.25} sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Live captions
            </Typography>
            <Box
              sx={{
                minHeight: 108,
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                p: 1.5,
                bgcolor: 'background.default',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {partialTranscript ||
                  finalTranscript ||
                  'Start with text, then stream microphone audio for live transcripts.'}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              WebSocket: {wsUrl || 'not configured'}
            </Typography>
          </Stack>
        </Stack>

        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            p: 1.5,
            minHeight: 220,
            maxHeight: 320,
            overflowY: 'auto',
            bgcolor: 'background.default',
          }}
        >
          <Stack spacing={1.25}>
            {messages.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                The agent conversation will appear here after the socket authenticates and you send
                an <code>input_text</code> or microphone stream.
              </Typography>
            ) : (
              messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    alignSelf:
                      message.role === 'user'
                        ? 'flex-end'
                        : message.role === 'agent'
                        ? 'flex-start'
                        : 'stretch',
                    maxWidth: message.role === 'system' ? '100%' : '82%',
                    px: 1.25,
                    py: 1,
                    borderRadius: 2,
                    bgcolor:
                      message.role === 'user'
                        ? 'primary.main'
                        : message.role === 'agent'
                        ? 'background.paper'
                        : message.role === 'error'
                        ? 'error.light'
                        : 'action.hover',
                    color:
                      message.role === 'user'
                        ? 'primary.contrastText'
                        : message.role === 'error'
                        ? 'error.contrastText'
                        : 'text.primary',
                    border: message.role === 'agent' ? 1 : 0,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="caption" sx={{ opacity: 0.72 }}>
                    {message.role === 'user'
                      ? 'You'
                      : message.role === 'agent'
                      ? 'Agent'
                      : message.role === 'error'
                      ? 'Error'
                      : 'Session'}
                  </Typography>
                  <Typography variant="body2">{message.text}</Typography>
                </Box>
              ))
            )}
          </Stack>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleDraftKeyDown}
            label="Send text to the voice agent"
            placeholder="Create an evaluation for athlete..."
            disabled={!isReady}
          />
          <Stack direction={{ xs: 'row', md: 'column' }} spacing={1}>
            <Button
              variant="contained"
              onClick={() => void handleSend()}
              disabled={!isReady || !draft.trim()}
            >
              Send text
            </Button>
            <Button
              variant={isRecording ? 'contained' : 'outlined'}
              color={isRecording ? 'error' : 'primary'}
              startIcon={isRecording ? <MicOffIcon /> : <MicIcon />}
              onClick={() => void handleMicClick()}
              disabled={!isReady || !isMicSupported}
            >
              {isRecording ? 'Stop mic' : 'Start mic'}
            </Button>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <GraphicEqIcon color={isRecording ? 'error' : 'disabled'} fontSize="small" />
          <Typography variant="caption" color="text.secondary">
            {isMicSupported
              ? isRecording
                ? 'Streaming PCM16LE mono 16kHz audio to the backend.'
                : 'Microphone ready. Stop speaking to send end_of_utterance.'
              : 'Microphone capture is not supported in this browser.'}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  )
}
