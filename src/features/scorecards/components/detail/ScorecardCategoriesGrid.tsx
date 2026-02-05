import * as React from "react";
import { Box, Stack, Typography, Button, IconButton, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { DataGrid, type GridColDef, type GridRowParams } from "@mui/x-data-grid";
import type { ScorecardCategoryRow } from "../../types";

type ScorecardCategoriesGridProps = {
  categories: ScorecardCategoryRow[];
  activeCategoryId: string | null;
  onAddCategory: () => void;
  onDeleteCategory: (id: string) => void;
  onRowClick: (id: string) => void;
  onRowUpdate: (newRow: ScorecardCategoryRow, oldRow: ScorecardCategoryRow) => ScorecardCategoryRow;
};

export default function ScorecardCategoriesGrid({
  categories,
  activeCategoryId,
  onAddCategory,
  onDeleteCategory,
  onRowClick,
  onRowUpdate,
}: ScorecardCategoriesGridProps) {
  const columns = React.useMemo<GridColDef<ScorecardCategoryRow>[]>(
    () => [
      { field: "name", headerName: "Name", flex: 1, editable: true },
      { field: "description", headerName: "Description", flex: 2, editable: true },
      {
        field: "position",
        headerName: "Position",
        width: 120,
        type: "number",
        editable: true,
      },
      {
        field: "actions",
        headerName: "",
        width: 70,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <IconButton
            aria-label="Delete category"
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onDeleteCategory(String(params.id));
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [onDeleteCategory],
  );

  const handleRowClick = React.useCallback(
    (params: GridRowParams) => {
      onRowClick(String(params.id));
    },
    [onRowClick],
  );

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={600}>
          Categories
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onAddCategory}
        >
          Add Category
        </Button>
      </Stack>

      <Box sx={{ height: 360, width: "100%" }}>
        <DataGrid
          rows={categories}
          columns={columns}
          getRowId={(row) => row.id}
          disableRowSelectionOnClick
          hideFooterSelectedRowCount
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 5, page: 0 } },
          }}
          processRowUpdate={onRowUpdate}
          onProcessRowUpdateError={(error) =>
            console.error("Category row update error", error)
          }
          onRowClick={handleRowClick}
          getRowClassName={(params) =>
            params.id === activeCategoryId ? "active-category-row" : ""
          }
          sx={{
            "& .active-category-row": {
              bgcolor: (theme) => `${theme.palette.action.selected} !important`,
            },
          }}
        />
      </Box>

      <Typography variant="caption" color="text.secondary">
        Tip: Each template should have at least one category. Re-order them by
        adjusting the <strong>Position</strong> column.
      </Typography>
    </Paper>
  );
}
