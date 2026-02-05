import * as React from 'react'
import type { SxProps, Theme } from '@mui/material/styles'
import ColorModeSelect from './ColorModeSelect'

type Props = {
  sx?: SxProps<Theme>
}

export default function ColorModeIconDropdown({ sx }: Props) {
  return <ColorModeSelect sx={sx} />
}
