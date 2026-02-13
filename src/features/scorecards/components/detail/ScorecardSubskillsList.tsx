import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Paper,
  List,
  ListItem,
  TextField,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { Skill } from "../../../skills/services/skillsService";
import type { ScorecardSubskillRow } from "../../types";

type ScorecardSubskillsListProps = {
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

export default function ScorecardSubskillsList({
  subskills,
  activeCategoryName,
  skills,
  skillTitleById,
  skillsLoading,
  skillsError,
  onAddSubskill,
  onDeleteSubskill,
  onRowUpdate,
}: ScorecardSubskillsListProps) {
  const skillOptions = React.useMemo(
    () =>
      skills.map((skill) => ({
        value: skill.id,
        label: skillTitleById[skill.id] ?? skill.title,
      })),
    [skills, skillTitleById],
  );

  const handleFieldChange = React.useCallback(
    (
      row: ScorecardSubskillRow,
      field: keyof ScorecardSubskillRow,
      value: string,
    ) => {
      onRowUpdate(
        {
          ...row,
          [field]: value,
        },
        row,
      );
    },
    [onRowUpdate],
  );

  const handlePositionChange = React.useCallback(
    (row: ScorecardSubskillRow, value: string) => {
      if (value.trim() === "") return;
      const parsed = Number(value);
      if (Number.isNaN(parsed)) return;
      onRowUpdate({ ...row, position: parsed }, row);
    },
    [onRowUpdate],
  );

  const skillSelectDisabled = skillsLoading || Boolean(skillsError);

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} gap={1}>
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

      <List disablePadding>
        {!activeCategoryName && (
          <Box sx={{ py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Choose a category above to see and edit its subskills.
            </Typography>
          </Box>
        )}

        {activeCategoryName && subskills.length === 0 && (
          <Box sx={{ py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              No subskills yet. Add one to begin defining the rubric.
            </Typography>
          </Box>
        )}

        {activeCategoryName &&
          subskills.map((subskill, index) => (
            <ListItem key={subskill.id} disableGutters sx={{ mb: 2 }}>
              <Paper variant="outlined" sx={{ p: 2, width: "100%" }}>
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    gap={1}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      {subskill.name?.trim() || `Subskill ${index + 1}`}
                    </Typography>
                    <IconButton
                      aria-label="Delete subskill"
                      size="small"
                      onClick={() => onDeleteSubskill(subskill.id)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>

                  <TextField
                    label="Name"
                    fullWidth
                    value={subskill.name}
                    onChange={(event) =>
                      handleFieldChange(subskill, "name", event.target.value)
                    }
                  />
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    minRows={2}
                    value={subskill.description}
                    onChange={(event) =>
                      handleFieldChange(subskill, "description", event.target.value)
                    }
                  />
                  <TextField
                    label="Position"
                    type="number"
                    fullWidth
                    value={subskill.position}
                    inputProps={{ min: 1 }}
                    onChange={(event) =>
                      handlePositionChange(subskill, event.target.value)
                    }
                  />
                  <TextField
                    select
                    label="Skill"
                    fullWidth
                    value={subskill.skill_id || ""}
                    onChange={(event) =>
                      handleFieldChange(subskill, "skill_id", String(event.target.value))
                    }
                    disabled={skillSelectDisabled}
                    helperText={
                      skillSelectDisabled
                        ? "Skills are still loading or unavailable."
                        : undefined
                    }
                  >
                    <MenuItem value="" disabled>
                      Select a skill
                    </MenuItem>
                    {skillOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
              </Paper>
            </ListItem>
          ))}
      </List>

      <Typography variant="caption" color="text.secondary">
        Each category must have at least one subskill with an associated Skill.
        Use this list to define the specific skills and rubric rows.
      </Typography>
      {skillsError && (
        <Typography mt={1} variant="caption" color="error">
          Failed to load skills: {skillsError}
        </Typography>
      )}
    </Paper>
  );
}
