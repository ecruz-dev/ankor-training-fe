import * as React from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import AthleteFormFields from "../components/AthleteFormFields";
import {
  getAthleteById,
  type AthleteListItem,
} from "../services/athleteService";
import {
  createInitialAthleteForm,
  toAthleteFormState,
  type AthleteFormState,
} from "../utils/athleteForm";

export default function AthleteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const athleteId = id ?? "";
  const navigate = useNavigate();
  const { orgId, loading: authLoading } = useAuth();
  const [form, setForm] = React.useState<AthleteFormState>(
    createInitialAthleteForm(),
  );
  const [athlete, setAthlete] = React.useState<AthleteListItem | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    initializedRef.current = false;
    setForm(createInitialAthleteForm());
    setLoadError(null);
  }, [athleteId]);

  React.useEffect(() => {
    let active = true;

    const loadAthlete = async () => {
      if (authLoading) return;
      if (!athleteId) {
        setLoadError("Missing athlete id in route.");
        return;
      }
      if (!orgId) {
        setLoadError("Missing org_id. Please sign in again.");
        return;
      }

      setLoading(true);
      setLoadError(null);
      try {
        const result = await getAthleteById(athleteId, { orgId });
        if (!active) return;
        setAthlete(result);
      } catch (err) {
        if (!active) return;
        setAthlete(null);
        setLoadError(
          err instanceof Error ? err.message : "Failed to load athlete.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadAthlete();

    return () => {
      active = false;
    };
  }, [athleteId, authLoading, orgId]);

  React.useEffect(() => {
    if (!athlete || initializedRef.current) return;
    setForm(toAthleteFormState(athlete));
    initializedRef.current = true;
  }, [athlete]);

  const handleChange =
    (_field: keyof AthleteFormState) =>
    (_event: React.ChangeEvent<HTMLInputElement>) => {};

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack spacing={3} sx={{ maxWidth: 1200, width: "100%", mx: "auto" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Athlete Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View athlete details.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate("/athletes")}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate(`/athletes/${athleteId}/edit`)}
              disabled={!athleteId}
            >
              Edit
            </Button>
          </Stack>
        </Stack>

        {loading && (
          <Typography variant="body2" color="text.secondary">
            Loading athlete details...
          </Typography>
        )}

        {loadError && (
          <Typography color="error" variant="body2">
            {loadError}
          </Typography>
        )}

        <TextField
          label="User ID"
          value={athlete?.user_id ?? ""}
          fullWidth
          InputProps={{ readOnly: true }}
        />

        <AthleteFormFields
          form={form}
          errors={{}}
          onFieldChange={handleChange}
          showPassword={false}
          showUsername={false}
          readOnly
        />
      </Stack>
    </Box>
  );
}
