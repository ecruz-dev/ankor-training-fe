import * as React from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { createCoach } from "../services/coachService";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewCoachPage() {
  const navigate = useNavigate();
  const { orgId } = useAuth();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [cellNumber, setCellNumber] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      nextErrors.full_name = "Full name is required.";
    }
    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!emailRegex.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!password.trim()) {
      nextErrors.password = "Password is required.";
    }
    if (!confirmPassword.trim()) {
      nextErrors.confirm_password = "Confirm your password.";
    } else if (password.trim() !== confirmPassword.trim()) {
      nextErrors.confirm_password = "Passwords do not match.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!orgId) {
      setSubmitError("Missing org_id. Please sign in again.");
      return;
    }

    try {
      setSaving(true);
      await createCoach({
        org_id: orgId,
        full_name: fullName.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim() || null,
        cell_number: cellNumber.trim() || null,
      });

      navigate("/coaches");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create coach.";
      setSubmitError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack
        spacing={3}
        component="form"
        onSubmit={handleSubmit}
        sx={{ maxWidth: 960, width: "100%", mx: "auto" }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              New Coach
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a coach account for your organization.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate("/coaches")}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </Stack>
        </Stack>

        {submitError && (
          <Typography color="error" variant="body2">
            {submitError}
          </Typography>
        )}

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Coach Details
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                label="Full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                error={Boolean(errors.full_name)}
                helperText={errors.full_name}
                required
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={Boolean(errors.email)}
                helperText={errors.email}
                required
                fullWidth
              />
              <TextField
                label="Phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                helperText="Optional"
                fullWidth
              />
              <TextField
                label="Cell number"
                value={cellNumber}
                onChange={(event) => setCellNumber(event.target.value)}
                helperText="Optional"
                fullWidth
              />
            </Box>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Account
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={Boolean(errors.password)}
                helperText={errors.password}
                required
                fullWidth
              />
              <TextField
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                error={Boolean(errors.confirm_password)}
                helperText={errors.confirm_password}
                required
                fullWidth
              />
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
