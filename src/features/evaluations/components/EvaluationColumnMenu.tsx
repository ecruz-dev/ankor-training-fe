import {
  GridColumnMenuContainer,
  GridColumnMenuFilterItem,
  GridColumnMenuHideItem,
  GridColumnMenuColumnsItem,
  type GridColumnMenuProps,
} from '@mui/x-data-grid'
import { ListItemIcon, ListItemText, MenuItem } from '@mui/material'
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck'

type EvaluationColumnMenuProps = GridColumnMenuProps & {
  onBulkActions?: (field: string) => void
}

export default function EvaluationColumnMenu(props: EvaluationColumnMenuProps) {
  const { hideMenu, colDef, onBulkActions, ...other } = props

  const handleBulkActionsClick = () => {
    onBulkActions?.(String(colDef.field))
    hideMenu?.()
  }

  return (
    <GridColumnMenuContainer hideMenu={hideMenu} colDef={colDef} {...other}>
      <GridColumnMenuFilterItem colDef={colDef} onClick={hideMenu} />
      <GridColumnMenuHideItem colDef={colDef} onClick={hideMenu} />
      <GridColumnMenuColumnsItem colDef={colDef} onClick={hideMenu} />

      <MenuItem onClick={handleBulkActionsClick}>
        <ListItemIcon sx={{ minWidth: 32 }}>
          <PlaylistAddCheckIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Bulk actions" />
      </MenuItem>
    </GridColumnMenuContainer>
  )
}
