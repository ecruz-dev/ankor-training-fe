import type { ChangeEvent } from "react";
import {
  Box,
  Stack,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Paper,
} from "@mui/material";
import type { ScorecardTemplateDraft } from "../../types";

type ScorecardTemplateFormCardProps = {
  template: ScorecardTemplateDraft;
  isSaving: boolean;
  onChange: (
    field: keyof ScorecardTemplateDraft,
  ) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onToggleActive: (
    event: ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => void;
  onCancel: () => void;
  onSave: () => void;
};

export default function ScorecardTemplateFormCard({
  template,
  isSaving,
  onChange,
  onToggleActive,
  onCancel,
  onSave,
}: ScorecardTemplateFormCardProps) {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        <Box flex={1}>
          <TextField
            label="Template Name"
            required
            fullWidth
            value={template.name}
            onChange={onChange("name")}
            placeholder="e.g. Midfield Evaluation - U15"
            sx={{ mb: 2 }}
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
            value={template.description}
            onChange={onChange("description")}
            placeholder="Short description of when and how this template is used."
          />
        </Box>

        <Box
          sx={{
            minWidth: 220,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={template.isActive}
                onChange={onToggleActive}
                color="primary"
              />
            }
            label={template.isActive ? "Active" : "Inactive"}
          />

          <Stack direction="row" spacing={2} mt={2}>
            <Button
              variant="outlined"
              onClick={onCancel}
              fullWidth
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={onSave}
              fullWidth
              disabled={isSaving || !template.name.trim()}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
