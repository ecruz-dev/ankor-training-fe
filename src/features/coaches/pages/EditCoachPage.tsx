import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import {
  getCoachById,
  updateCoach,
  type CoachListItem,
} from "../services/coachService";

type LocationState = {
  coach?: CoachListItem;
};

export default function EditCoachPage() {
  const { id } = useParams<{ id: string }>();
  const coachId = id ?? "";
  const { state } = useLocation() as { state?: LocationState };
  const routeCoach = state?.coach ?? null;
  const navigate = useNavigate();
  const { orgId, loading: authLoading } = useAuth();
  const [coach, setCoach] = React.useState<CoachListItem | null>(routeCoach);
  const [fullName, setFullName] = React.useState(routeCoach?.full_name ?? "");
  const [email, setEmail] = React.useState(routeCoach?.email ?? "");
  const [phone, setPhone] = React.useState(routeCoach?.phone ?? "");
  const [cellNumber, setCellNumber] = React.useState(routeCoach?.cell_number ?? "");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [toastOpen, setToastOpen] = React.useState(false);

  React.useEffect(() => {
    setCoach(routeCoach);
    setFullName(routeCoach?.full_name ?? "");
    setEmail(routeCoach?.email ?? "");
    setPhone(routeCoach?.phone ?? "");
    setCellNumber(routeCoach?.cell_number ?? "");
    setErrors({});
    setSubmitError(null);
    setLoadError(null);
    setToastOpen(false);
  }, [coachId, routeCoach]);

  React.useEffect(() => {
    let active = true;

    const loadCoach = async () => {
      if (authLoading) return;
      if (!coachId) {
        setLoadError("Missing coach id in route.");
        return;
      }
      if (!orgId) {
        setLoadError("Missing org_id. Please sign in again.");
        return;
      }

      setLoading(true);
      setLoadError(null);
      try {
        const result = await getCoachById(coachId, { orgId });
        if (!active) return;
        setCoach(result);
        setFullName(result.full_name ?? "");
        setEmail(result.email ?? "");
        setPhone(result.phone ?? "");
        setCellNumber(result.cell_number ?? "");
      } catch (err) {
        if (!active) return;
        if (!routeCoach) {
          setCoach(null);
          setLoadError(err instanceof Error ? err.message : "Failed to load coach.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadCoach();

    return () => {
      active = false;
    };
  }, [coachId, authLoading, orgId, routeCoach]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      nextErrors.full_name = "Full name is required.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!coachId) {
      setSubmitError("Missing coach id in route.");
      return;
    }
    if (!orgId) {
      setSubmitError("Missing org_id. Please sign in again.");
      return;
    }

    try {
      setSaving(true);
      const updated = await updateCoach(
        coachId,
        {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          cell_number: cellNumber.trim() || null,
        },
        { orgId },
      );

      setCoach(updated);
      setFullName(updated.full_name ?? "");
      setEmail(updated.email ?? "");
      setPhone(updated.phone ?? "");
      setCellNumber(updated.cell_number ?? "");
      setSubmitError(null);
      setToastOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update coach.";
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
              Edit Coach
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update coach details.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate("/coaches")}>
              Back
            </Button>
            <Button type="submit" variant="contained" disabled={saving || loading}>
              {saving ? "Saving..." : "Update"}
            </Button>
          </Stack>
        </Stack>

        {loading && (
          <Typography variant="body2" color="text.secondary">
            Loading coach details...
          </Typography>
        )}

        {loadError && (
          <Typography color="error" variant="body2">
            {loadError}
          </Typography>
        )}

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
                label="User ID"
                value={coach?.user_id ?? ""}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Email"
                type="email"
                value={email}
                helperText="Email cannot be edited here."
                fullWidth
                InputProps={{ readOnly: true }}
              />
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
      </Stack>

      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Coach record saved successfully.
        </Alert>
      </Snackbar>
    </Box>
  );
}
