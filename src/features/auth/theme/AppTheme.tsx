import * as React from 'react'
import { createTheme, ThemeProvider, type PaletteMode } from '@mui/material/styles'

type ColorModeContextValue = {
  mode: PaletteMode
  toggleColorMode: () => void
}

const ColorModeContext = React.createContext<ColorModeContextValue>({
  mode: 'light',
  toggleColorMode: () => {},
})

const STORAGE_KEY = 'ankor-theme-mode'

const getInitialMode = (): PaletteMode => {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

export default function AppTheme({
  children,
  disableCustomTheme,
}: {
  children: React.ReactNode
  disableCustomTheme?: boolean
}) {
  const [mode, setMode] = React.useState<PaletteMode>(getInitialMode)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  const colorMode = React.useMemo(
    () => ({
      mode,
      toggleColorMode: () =>
        setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
    }),
    [mode],
  )

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: { mode },
      }),
    [mode],
  )

  if (disableCustomTheme) {
    return <>{children}</>
  }

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export function useColorMode() {
  return React.useContext(ColorModeContext)
}
