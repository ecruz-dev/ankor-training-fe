import * as React from "react";
import { Box, Paper, Stack, TextField, Typography } from "@mui/material";
import type { AthleteFormState } from "../utils/athleteForm";

type AthleteFormFieldsProps = {
  form: AthleteFormState;
  errors: Record<string, string>;
  onFieldChange: (
    field: keyof AthleteFormState,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword?: boolean;
  passwordLabel?: string;
  passwordRequired?: boolean;
  showUsername?: boolean;
  showConfirmPassword?: boolean;
  confirmPassword?: string;
  onConfirmPasswordChange?: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  confirmPasswordLabel?: string;
  confirmPasswordRequired?: boolean;
  readOnly?: boolean;
  children?: React.ReactNode;
};

export default function AthleteFormFields({
  form,
  errors,
  onFieldChange,
  showPassword = true,
  passwordLabel = "Password",
  passwordRequired = false,
  showUsername = true,
  showConfirmPassword = false,
  confirmPassword = "",
  onConfirmPasswordChange,
  confirmPasswordLabel = "Confirm password",
  confirmPasswordRequired = false,
  readOnly = false,
  children,
}: AthleteFormFieldsProps) {
  const fieldInputProps = readOnly ? { readOnly: true } : undefined;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          <TextField
            label="First name"
            value={form.firstName}
            onChange={onFieldChange("firstName")}
            error={Boolean(errors.first_name)}
            helperText={errors.first_name}
            required
            fullWidth
            InputProps={fieldInputProps}
          />
          <TextField
            label="Last name"
            value={form.lastName}
            onChange={onFieldChange("lastName")}
            error={Boolean(errors.last_name)}
            helperText={errors.last_name}
            required
            fullWidth
            InputProps={fieldInputProps}
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={onFieldChange("email")}
            error={Boolean(errors.email)}
            helperText={errors.email}
            required
            fullWidth
            InputProps={fieldInputProps}
          />
          {showUsername && (
            <TextField
              label="Username"
              value={form.username}
              onChange={onFieldChange("username")}
              error={Boolean(errors.username)}
              helperText={errors.username}
              required
              fullWidth
              InputProps={fieldInputProps}
            />
          )}
          <TextField
            label="Cell number"
            value={form.cellNumber}
            onChange={onFieldChange("cellNumber")}
            error={Boolean(errors.cell_number)}
            helperText={errors.cell_number}
            fullWidth
            InputProps={fieldInputProps}
          />
          <TextField
            label="Graduation year"
            type="number"
            value={form.graduationYear}
            onChange={onFieldChange("graduationYear")}
            error={Boolean(errors.graduation_year)}
            helperText={errors.graduation_year}
            fullWidth
            InputProps={fieldInputProps}
            inputProps={{ min: 1900, max: 2100 }}
          />
          {children}
        </Box>

        {showPassword && (
          <Box>
            <TextField
              label={passwordLabel}
              type="password"
              value={form.password}
              onChange={onFieldChange("password")}
              error={Boolean(errors.password)}
              helperText={errors.password}
              fullWidth
              required={passwordRequired}
              InputProps={fieldInputProps}
            />
            {!passwordRequired && (
              <Typography variant="caption" color="text.secondary">
                Leave blank to keep the current password.
              </Typography>
            )}
            {showConfirmPassword && (
              <TextField
                sx={{ mt: 2 }}
                label={confirmPasswordLabel}
                type="password"
                value={confirmPassword}
                onChange={onConfirmPasswordChange}
                error={Boolean(errors.confirm_password)}
                helperText={errors.confirm_password}
                fullWidth
                required={confirmPasswordRequired}
                InputProps={fieldInputProps}
              />
            )}
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
