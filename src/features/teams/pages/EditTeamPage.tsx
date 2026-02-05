import * as React from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { SPORT_OPTIONS } from "../constants";
import { getTeamById, updateTeam, type Team } from "../services/teamsService";
import TeamFormFields from "../components/TeamFormFields";
import {
  createInitialTeamForm,
  toTeamFormState,
  type TeamFormState,
} from "../utils/teamForm";
import { validateTeamForm } from "../utils/validation";

export default function EditTeamPage() {
  const { id } = useParams<{ id: string }>();
  const teamId = id ?? "";
  const navigate = useNavigate();
  const { orgId, loading: authLoading } = useAuth();
  const [team, setTeam] = React.useState<Team | null>(null);
  const [form, setForm] = React.useState<TeamFormState>(
    createInitialTeamForm(),
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    initializedRef.current = false;
    setForm(createInitialTeamForm());
    setErrors({});
    setSubmitError(null);
    setLoadError(null);
  }, [teamId]);

  React.useEffect(() => {
    let active = true;

    const loadTeam = async () => {
      if (authLoading) return;
      if (!teamId) {
        setLoadError("Missing team id in route.");
        return;
      }
      if (!orgId) {
        setLoadError("Missing org_id. Please sign in again.");
        return;
      }

      setLoading(true);
      setLoadError(null);
      try {
        const result = await getTeamById(teamId, { orgId });
        if (!active) return;
        setTeam(result);
      } catch (err) {
        if (!active) return;
        setTeam(null);
        setLoadError(err instanceof Error ? err.message : "Failed to load team.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadTeam();

    return () => {
      active = false;
    };
  }, [authLoading, orgId, teamId]);

  React.useEffect(() => {
    if (!team || initializedRef.current) return;
    setForm(toTeamFormState(team));
    initializedRef.current = true;
  }, [team]);

  const handleChange = (field: keyof TeamFormState) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleActiveChange = (value: boolean) => {
    setForm((prev) => ({ ...prev, isActive: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors = validateTeamForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!teamId) {
      setSubmitError("Missing team id in route.");
      return;
    }
    if (!orgId) {
      setSubmitError("Missing org_id. Please sign in again.");
      return;
    }

    try {
      setSaving(true);
      const updated = await updateTeam(
        teamId,
        {
          name: form.name.trim(),
          sport_id: form.sportId.trim() || null,
          is_active: form.isActive,
        },
        { orgId },
      );
      setTeam(updated);
      setSubmitError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update team.";
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
        sx={{ maxWidth: 1100, width: "100%", mx: "auto" }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Edit Team
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update team details.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate("/teams")}>
              Back
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(`/teams/${teamId}`)}
              disabled={!teamId}
            >
              View
            </Button>
            <Button type="submit" variant="contained" disabled={saving || loading}>
              {saving ? "Saving..." : "Update"}
            </Button>
          </Stack>
        </Stack>

        {loading && (
          <Typography variant="body2" color="text.secondary">
            Loading team details...
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

        <TextField
          label="Team ID"
          value={team?.id ?? ""}
          fullWidth
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="Organization ID"
          value={team?.org_id ?? ""}
          fullWidth
          InputProps={{ readOnly: true }}
        />

        <TeamFormFields
          form={form}
          errors={errors}
          sportOptions={SPORT_OPTIONS}
          onFieldChange={handleChange}
          onActiveChange={handleActiveChange}
        />
      </Stack>
    </Box>
  );
}
