import * as React from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import EvaluationColumnMenu from './EvaluationColumnMenu'
import type { Athlete } from '../types'

type NewEvaluationDesktopPanelProps = {
  canRenderMatrix: boolean
  rows: any[]
  columns: GridColDef[]
  processRowUpdate: (newRow: any, oldRow: any) => any
  onOpenBulkDialog: (athleteField: string) => void
  selectedAthletes: Athlete[]
  onAthleteChange: (nextId: string | null) => void
  onOpenSkillsDialog: (athleteId: string, categoryId: string) => void
}

export default function NewEvaluationDesktopPanel({
  canRenderMatrix,
  rows,
  columns,
  processRowUpdate,
  onOpenBulkDialog,
  selectedAthletes,
  onAthleteChange,
  onOpenSkillsDialog,
}: NewEvaluationDesktopPanelProps) {
  const isAthleteField = React.useCallback(
    (field: string) => selectedAthletes.some((athlete) => athlete.id === field),
    [selectedAthletes],
  )

  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="stretch">
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Paper sx={{ height: 520, p: 1 }}>
          {canRenderMatrix ? (
            <DataGrid
              rows={rows}
              columns={columns}
              disableRowSelectionOnClick
              hideFooterSelectedRowCount
              density="compact"
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
              }}
              processRowUpdate={processRowUpdate}
              slots={{ columnMenu: EvaluationColumnMenu }}
              slotProps={{
                columnMenu: { onBulkActions: onOpenBulkDialog } as any,
              }}
              onCellClick={(params) => {
                const field = params.field as string
                if (isAthleteField(field)) onAthleteChange(field)
              }}
              onCellDoubleClick={(params) => {
                const field = params.field as string
                if (!isAthleteField(field)) return
                onOpenSkillsDialog(field, String(params.id))
              }}
            />
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                px: 2,
              }}
            >
              <Typography variant="body1" color="text.secondary">
                Select a scorecard and at least one athlete to render the evaluation matrix.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Stack>
  )
}
