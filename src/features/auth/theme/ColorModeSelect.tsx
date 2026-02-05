import * as React from 'react'
import { IconButton, Tooltip } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useColorMode } from './AppTheme'

type Props = {
  sx?: SxProps<Theme>
}

export default function ColorModeSelect({ sx }: Props) {
  const { mode, toggleColorMode } = useColorMode()
  const isDark = mode === 'dark'

  return (
    <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton
        onClick={toggleColorMode}
        color="inherit"
        aria-label="toggle color mode"
        sx={sx}
      >
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  )
}
