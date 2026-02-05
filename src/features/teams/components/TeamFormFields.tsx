import * as React from "react";
import {
  Chip,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { TeamFormState } from "../utils/teamForm";

type SportOption = { id: string; label: string };

type TeamFormFieldsProps = {
  form: TeamFormState;
  errors: Record<string, string>;
  sportOptions: SportOption[];
  onFieldChange: (
    field: keyof TeamFormState,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onActiveChange: (value: boolean) => void;
  readOnly?: boolean;
};

export default function TeamFormFields({
  form,
  errors,
  sportOptions,
  onFieldChange,
  onActiveChange,
  readOnly = false,
}: TeamFormFieldsProps) {
  const sportMatch = sportOptions.find((option) => option.id === form.sportId);
  const sportHelper =
    errors.sportId || (sportMatch ? `Sport: ${sportMatch.label}` : "Optional");

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          Team info
        </Typography>
        <TextField
          label="Team name"
          value={form.name}
          onChange={onFieldChange("name")}
          required
          fullWidth
          error={Boolean(errors.name)}
          helperText={errors.name}
          InputProps={{ readOnly }}
        />
        <TextField
          label="Sport id"
          value={form.sportId}
          onChange={onFieldChange("sportId")}
          fullWidth
          error={Boolean(errors.sportId)}
          helperText={sportHelper}
          InputProps={{ readOnly }}
        />

        {sportOptions.length > 0 && !readOnly && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {sportOptions.map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                size="small"
                variant={option.id === form.sportId ? "filled" : "outlined"}
                onClick={() =>
                  onFieldChange("sportId")({
                    target: { value: option.id },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              />
            ))}
          </Stack>
        )}
        {sportMatch && readOnly && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label={sportMatch.label} size="small" variant="filled" />
          </Stack>
        )}

        <FormControlLabel
          control={
            <Switch
              checked={form.isActive}
              onChange={(_, checked) => onActiveChange(checked)}
              disabled={readOnly}
            />
          }
          label={form.isActive ? "Active team" : "Inactive team"}
        />
      </Stack>
    </Paper>
  );
}
