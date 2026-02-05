import * as React from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { SPORT_OPTIONS } from "../constants";
import { getTeamById, type Team } from "../services/teamsService";
import TeamFormFields from "../components/TeamFormFields";
import {
  createInitialTeamForm,
  toTeamFormState,
  type TeamFormState,
} from "../utils/teamForm";

const formatDateTime = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
};

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const teamId = id ?? "";
  const navigate = useNavigate();
  const { orgId, loading: authLoading } = useAuth();
  const [team, setTeam] = React.useState<Team | null>(null);
  const [form, setForm] = React.useState<TeamFormState>(
    createInitialTeamForm(),
  );
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    initializedRef.current = false;
    setForm(createInitialTeamForm());
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

  const handleChange =
    (_field: keyof TeamFormState) =>
    (_event: React.ChangeEvent<HTMLInputElement>) => {};

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack spacing={3} sx={{ maxWidth: 1100, width: "100%", mx: "auto" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Team Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View team details.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate("/teams")}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate(`/teams/${teamId}/edit`)}
              disabled={!teamId}
            >
              Edit
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
        <TextField
          label="Created"
          value={formatDateTime(team?.created_at ?? null)}
          fullWidth
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="Updated"
          value={formatDateTime(team?.updated_at ?? null)}
          fullWidth
          InputProps={{ readOnly: true }}
        />

        <TeamFormFields
          form={form}
          errors={{}}
          sportOptions={SPORT_OPTIONS}
          onFieldChange={handleChange}
          onActiveChange={() => {}}
          readOnly
        />
      </Stack>
    </Box>
  );
}
