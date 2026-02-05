import * as React from "react";
import {
  Paper,
  Stack,
  Typography,
  TextField,
  Grid,
  MenuItem,
} from "@mui/material";
import type { SkillFormState } from "../utils/skillForm";

type SelectOption = { id: string; label: string };

type SkillFormFieldsProps = {
  form: SkillFormState;
  errors: Record<string, string>;
  levelOptions: SelectOption[];
  visibilityOptions: SelectOption[];
  statusOptions: SelectOption[];
  onFieldChange: (
    field: keyof SkillFormState,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  videoExtras?: React.ReactNode;
};

export default function SkillFormFields({
  form,
  errors,
  levelOptions,
  visibilityOptions,
  statusOptions,
  onFieldChange,
  videoExtras,
}: SkillFormFieldsProps) {
  return (
    <>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={700}>
            Basics
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Skill title"
              value={form.title}
              onChange={onFieldChange("title")}
              required
              fullWidth
              error={Boolean(errors.title)}
              helperText={errors.title}
            />
            <TextField
              label="Category"
              value={form.category}
              onChange={onFieldChange("category")}
              required
              fullWidth
              error={Boolean(errors.category)}
              helperText={errors.category}
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={onFieldChange("description")}
              multiline
              minRows={4}
              fullWidth
            />
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={700}>
            Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                label="Level"
                value={form.level}
                onChange={onFieldChange("level")}
                required
                fullWidth
                error={Boolean(errors.level)}
                helperText={errors.level}
              >
                <MenuItem value="" disabled>
                  Select level
                </MenuItem>
                {levelOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                label="Visibility"
                value={form.visibility}
                onChange={onFieldChange("visibility")}
                required
                fullWidth
                error={Boolean(errors.visibility)}
                helperText={errors.visibility}
              >
                <MenuItem value="" disabled>
                  Select visibility
                </MenuItem>
                {visibilityOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                label="Status"
                value={form.status}
                onChange={onFieldChange("status")}
                required
                fullWidth
                error={Boolean(errors.status)}
                helperText={errors.status}
              >
                <MenuItem value="" disabled>
                  Select status
                </MenuItem>
                {statusOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Sport id"
                value={form.sportId}
                onChange={onFieldChange("sportId")}
                fullWidth
                error={Boolean(errors.sportId)}
                helperText={errors.sportId || "Optional UUID to scope the skill."}
              />
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      {videoExtras ? (
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Video
            </Typography>
            {videoExtras}
          </Stack>
        </Paper>
      ) : null}
    </>
  );
}
