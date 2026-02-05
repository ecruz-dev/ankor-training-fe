import * as React from "react";
import { Box, Chip } from "@mui/material";
import { DataGrid, type GridColDef, type GridRowParams } from "@mui/x-data-grid";
import type { ScorecardTemplateListRow } from "../../types";
import { formatDateTime, formatEmptyValue } from "../../utils/formatters";

type ScorecardTemplatesListTableProps = {
  rows: ScorecardTemplateListRow[];
  onRowClick: (id: string) => void;
};

const NoFooter: React.FC = () => null;

export default function ScorecardTemplatesListTable({
  rows,
  onRowClick,
}: ScorecardTemplatesListTableProps) {
  const columns = React.useMemo<GridColDef<ScorecardTemplateListRow>[]>(
    () => [
      { field: "name", headerName: "Name", flex: 1.4, minWidth: 240 },
      {
        field: "is_active",
        headerName: "Active",
        width: 120,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) =>
          params.value ? (
            <Chip size="small" color="success" variant="outlined" label="Active" />
          ) : (
            <Chip size="small" variant="outlined" label="Inactive" />
          ),
      },
      {
        field: "created_by",
        headerName: "Created By",
        flex: 0.8,
        minWidth: 160,
        sortable: false,
        valueFormatter: (params) => formatEmptyValue((params as any)?.value),
      },
      {
        field: "updated_at",
        headerName: "Updated",
        minWidth: 200,
        flex: 1,
        valueFormatter: (params) => formatDateTime((params as any)?.value),
        sortComparator: (a, b) =>
          new Date(String(a)).getTime() - new Date(String(b)).getTime(),
      },
    ],
    [],
  );

  const handleRowClick = React.useCallback(
    (params: GridRowParams) => {
      onRowClick(String(params.id));
    },
    [onRowClick],
  );

  return (
    <Box sx={{ height: 560, width: "100%" }}>
      <DataGrid
        rows={rows ?? []}
        columns={columns ?? []}
        getRowId={(row) => row.id}
        rowSelection={false}
        disableRowSelectionOnClick
        hideFooterSelectedRowCount
        slots={{ footer: NoFooter }}
        onRowClick={handleRowClick}
        sx={{
          borderRadius: 2,
          "& .MuiDataGrid-row:hover": { cursor: "pointer" },
        }}
        initialState={{
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
          sorting: { sortModel: [{ field: "updated_at", sort: "desc" }] },
        }}
        pageSizeOptions={[5, 10, 25]}
      />
    </Box>
  );
}
