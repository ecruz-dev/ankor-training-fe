import * as React from "react";
import { Box, Stack, Typography, Button, IconButton, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { Skill } from "../../../skills/services/skillsService";
import type { ScorecardSubskillRow } from "../../types";

type ScorecardSubskillsGridProps = {
  subskills: ScorecardSubskillRow[];
  activeCategoryName: string | null;
  skills: Skill[];
  skillTitleById: Record<string, string>;
  skillsLoading: boolean;
  skillsError: string | null;
  onAddSubskill: () => void;
  onDeleteSubskill: (id: string) => void;
  onRowUpdate: (newRow: ScorecardSubskillRow, oldRow: ScorecardSubskillRow) => ScorecardSubskillRow;
};

export default function ScorecardSubskillsGrid({
  subskills,
  activeCategoryName,
  skills,
  skillTitleById,
  skillsLoading,
  skillsError,
  onAddSubskill,
  onDeleteSubskill,
  onRowUpdate,
}: ScorecardSubskillsGridProps) {
  const skillOptions = React.useMemo(
    () =>
      skills.map((skill) => ({
        value: skill.id,
        label: skillTitleById[skill.id] ?? skill.title,
      })),
    [skills, skillTitleById],
  );

  const columns = React.useMemo<GridColDef<ScorecardSubskillRow>[]>(
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
        field: "skill_id",
        headerName: "Skill",
        flex: 1,
        editable: true,
        type: "singleSelect",
        valueOptions: skillOptions,
        valueFormatter: (params) =>
          params.value ? skillTitleById[String(params.value)] ?? "" : "",
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
            aria-label="Delete subskill"
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onDeleteSubskill(String(params.id));
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [onDeleteSubskill, skillOptions, skillTitleById],
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Subskills / Skills
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activeCategoryName
              ? `Category: ${activeCategoryName || "Untitled Category"}`
              : "Select a category to manage its subskills."}
          </Typography>
        </Box>

        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onAddSubskill}
          disabled={skillsLoading || Boolean(skillsError)}
        >
          Add Subskill
        </Button>
      </Stack>

      <Box sx={{ height: 360, width: "100%" }}>
        <DataGrid
          rows={subskills}
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
            console.error("Subskill row update error", error)
          }
          loading={skillsLoading}
        />
      </Box>

      <Typography variant="caption" color="text.secondary">
        Each category must have at least one subskill with an associated{" "}
        <strong>Skill</strong>. Use this grid to define the specific skills
        and rubric rows.
      </Typography>
      {skillsError && (
        <Typography mt={1} variant="caption" color="error">
          Failed to load skills: {skillsError}
        </Typography>
      )}
    </Paper>
  );
}
