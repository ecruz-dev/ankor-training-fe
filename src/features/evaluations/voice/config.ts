const env = import.meta.env as Record<string, string | undefined>

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, '')
}

export function getVoiceAgentBaseUrl() {
  const value =
    env.ANKOR_VOICE_AGENT_URL?.trim() ||
    env.VITE_ANKOR_VOICE_AGENT_URL?.trim() ||
    ''

  return value ? trimTrailingSlashes(value) : null
}

export function getVoiceAgentWebSocketUrl() {
  const baseUrl = getVoiceAgentBaseUrl()
  if (!baseUrl) return null

  try {
    const url = new URL(baseUrl)

    if (url.protocol === 'https:') {
      url.protocol = 'wss:'
    } else if (url.protocol === 'http:') {
      url.protocol = 'ws:'
    } else if (url.protocol !== 'wss:' && url.protocol !== 'ws:') {
      return null
    }

    const normalizedPath = trimTrailingSlashes(url.pathname)
    url.pathname = normalizedPath.endsWith('/ws/voice')
      ? normalizedPath
      : `${normalizedPath}/ws/voice`
    url.search = ''
    url.hash = ''

    return url.toString()
  } catch {
    return null
  }
}
