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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { ScorecardCategoryRow } from "../../types";

type ScorecardCategoriesListProps = {
  categories: ScorecardCategoryRow[];
  activeCategoryId: string | null;
  onAddCategory: () => void;
  onDeleteCategory: (id: string) => void;
  onRowClick: (id: string) => void;
  onRowUpdate: (newRow: ScorecardCategoryRow, oldRow: ScorecardCategoryRow) => ScorecardCategoryRow;
};

export default function ScorecardCategoriesList({
  categories,
  activeCategoryId,
  onAddCategory,
  onDeleteCategory,
  onRowClick,
  onRowUpdate,
}: ScorecardCategoriesListProps) {
  const handleFieldChange = React.useCallback(
    (
      row: ScorecardCategoryRow,
      field: keyof ScorecardCategoryRow,
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
    (row: ScorecardCategoryRow, value: string) => {
      if (value.trim() === "") return;
      const parsed = Number(value);
      if (Number.isNaN(parsed)) return;
      onRowUpdate({ ...row, position: parsed }, row);
    },
    [onRowUpdate],
  );

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} gap={1}>
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

      <List disablePadding>
        {categories.length === 0 && (
          <Box sx={{ py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              No categories yet. Add one to get started.
            </Typography>
          </Box>
        )}

        {categories.map((category, index) => {
          const isActive = category.id === activeCategoryId;

          return (
            <ListItem key={category.id} disableGutters sx={{ mb: 2 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  width: "100%",
                  borderColor: isActive ? "primary.main" : "divider",
                  bgcolor: isActive ? "action.selected" : "background.paper",
                }}
              >
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    gap={1}
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {category.name?.trim() || `Category ${index + 1}`}
                      </Typography>
                      {isActive && (
                        <Typography variant="caption" color="primary.main">
                          Active
                        </Typography>
                      )}
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button
                        size="small"
                        variant={isActive ? "contained" : "outlined"}
                        onClick={() => onRowClick(category.id)}
                      >
                        {isActive ? "Selected" : "Select"}
                      </Button>
                      <IconButton
                        aria-label="Delete category"
                        size="small"
                        onClick={() => onDeleteCategory(category.id)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <TextField
                    label="Name"
                    fullWidth
                    value={category.name}
                    onChange={(event) =>
                      handleFieldChange(category, "name", event.target.value)
                    }
                  />
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    minRows={2}
                    value={category.description}
                    onChange={(event) =>
                      handleFieldChange(category, "description", event.target.value)
                    }
                  />
                  <TextField
                    label="Position"
                    type="number"
                    fullWidth
                    value={category.position}
                    inputProps={{ min: 1 }}
                    onChange={(event) =>
                      handlePositionChange(category, event.target.value)
                    }
                  />
                </Stack>
              </Paper>
            </ListItem>
          );
        })}
      </List>

      <Typography variant="caption" color="text.secondary">
        Tip: Each template should have at least one category. Re-order them by
        adjusting the Position field.
      </Typography>
    </Paper>
  );
}
