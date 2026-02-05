import * as React from 'react'
import { Button, Chip, Paper, Stack } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import type { EvaluationListRow } from '../../api/evaluationsApi'
import { formatDateTime } from '../../utils/formatDateTime'
import { getEvaluationStatusUi } from '../../utils/evaluationStatus'

type EvaluationsListTableProps = {
  rows: EvaluationListRow[]
  loading: boolean
  onView: (id: string) => void
  onEdit: (id: string) => void
}

export default function EvaluationsListTable({
  rows,
  loading,
  onView,
  onEdit,
}: EvaluationsListTableProps) {
  const columns = React.useMemo<GridColDef<EvaluationListRow>[]>(
    () => [
      {
        field: 'created_at',
        headerName: 'Created',
        flex: 1,
        minWidth: 160,
        valueFormatter: (p) => formatDateTime(p.value as string | null),
      },
      {
        field: 'team_name',
        headerName: 'Team',
        flex: 1,
        minWidth: 160,
      },
      {
        field: 'scorecard_template_name',
        headerName: 'Scorecard',
        flex: 1.2,
        minWidth: 200,
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 140,
        sortable: true,
        renderCell: (params) => {
          const ui = getEvaluationStatusUi((params.value as string | null) ?? null)
          return <Chip size="small" label={ui.label} color={ui.color} />
        },
      },
      {
        field: 'notes',
        headerName: 'Notes',
        flex: 1.5,
        minWidth: 240,
      },
      {
        field: 'id',
        headerName: 'Evaluation ID',
        flex: 1.4,
        minWidth: 240,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        filterable: false,
        width: 200,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const row = params.row as EvaluationListRow

          return (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={(event) => {
                  event.stopPropagation()
                  onView(row.id)
                }}
              >
                View
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit(row.id)
                }}
              >
                Edit
              </Button>
            </Stack>
          )
        },
      },
    ],
    [onEdit, onView],
  )

  return (
    <Paper sx={{ height: 560, p: 1 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        disableRowSelectionOnClick
        hideFooterSelectedRowCount
        density="compact"
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10, page: 0 } },
        }}
        onRowClick={(params) => {
          const row = params.row as EvaluationListRow
          onView(row.id)
        }}
      />
    </Paper>
  )
}
