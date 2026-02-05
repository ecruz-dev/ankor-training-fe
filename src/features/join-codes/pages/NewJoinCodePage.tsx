import * as React from "react";
import {
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { getAllTeams, type Team } from "../../teams/services/teamsService";
import { createJoinCode } from "../services/joinCodeService";

type FormErrors = {
  team_id?: string;
  max_uses?: string;
  expires_at?: string;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const toDateTimeLocalValue = (value: Date) => {
  return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(
    value.getDate(),
  )}T${pad2(value.getHours())}:${pad2(value.getMinutes())}`;
};

const toIsoString = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

export default function NewJoinCodePage() {
  const navigate = useNavigate();
  const { orgId, loading: authLoading } = useAuth();
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = React.useState(false);
  const [teamsError, setTeamsError] = React.useState<string | null>(null);
  const [teamId, setTeamId] = React.useState("");
  const [maxUses, setMaxUses] = React.useState("1");
  const [expiresAt, setExpiresAt] = React.useState(() => {
    const next = new Date();
    next.setDate(next.getDate() + 7);
    next.setHours(0, 0, 0, 0);
    return toDateTimeLocalValue(next);
  });
  const [isActive, setIsActive] = React.useState(true);
  const [disabled, setDisabled] = React.useState(false);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [saving, setSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setTeamId("");
  }, [orgId]);

  React.useEffect(() => {
    if (authLoading) return;
    let active = true;

    const resolvedOrgId = orgId?.trim() || "";
    if (!resolvedOrgId) {
      setTeams([]);
      setTeamsError("Missing org_id. Please sign in again.");
      setTeamsLoading(false);
      return () => {
        active = false;
      };
    }

    setTeamsLoading(true);
    setTeamsError(null);

    getAllTeams({ orgId: resolvedOrgId })
      .then((items) => {
        if (!active) return;
        setTeams(items ?? []);
      })
      .catch((err: any) => {
        if (!active) return;
        setTeams([]);
        setTeamsError(err?.message || "Failed to load teams.");
      })
      .finally(() => {
        if (active) setTeamsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, orgId]);

  const teamOptions = React.useMemo(() => {
    return [...teams].sort((a, b) => a.name.localeCompare(b.name));
  }, [teams]);

  const teamHelperText = teamsError
    ? teamsError
    : teamsLoading
      ? "Loading teams..."
      : teamOptions.length === 0
        ? "No teams available."
        : "Required";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors: FormErrors = {};
    if (!teamId.trim()) nextErrors.team_id = "Team is required.";

    const maxUsesValue = Number(maxUses);
    if (!Number.isFinite(maxUsesValue) || maxUsesValue <= 0) {
      nextErrors.max_uses = "Max uses must be a positive number.";
    }

    const expiresIso = toIsoString(expiresAt);
    if (!expiresIso) {
      nextErrors.expires_at = "Expiration date is required.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!orgId) {
      setSubmitError("Missing org_id. Please sign in again.");
      return;
    }

    try {
      setSaving(true);
      await createJoinCode({
        org_id: orgId,
        team_id: teamId.trim(),
        max_uses: maxUsesValue,
        expires_at: expiresIso,
        is_active: isActive,
        disabled,
      });
      navigate("/easy-join-codes");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create join code.";
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
        sx={{ maxWidth: 900, width: "100%", mx: "auto" }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              New Join Code
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a new join code for a team.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate("/easy-join-codes")}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Saving..." : "Create"}
            </Button>
          </Stack>
        </Stack>

        {submitError && (
          <Typography color="error" variant="body2">
            {submitError}
          </Typography>
        )}

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2}>
            <TextField
              select
              label="Team"
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
              error={Boolean(errors.team_id) || Boolean(teamsError)}
              helperText={errors.team_id || teamHelperText}
              fullWidth
              disabled={teamsLoading}
              required
            >
              {teamOptions.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Max uses"
              type="number"
              value={maxUses}
              onChange={(event) => setMaxUses(event.target.value)}
              error={Boolean(errors.max_uses)}
              helperText={errors.max_uses || "Required"}
              fullWidth
              inputProps={{ min: 1 }}
              required
            />

            <TextField
              label="Expires at (local time)"
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              error={Boolean(errors.expires_at)}
              helperText={errors.expires_at || "Required"}
              fullWidth
              InputLabelProps={{ shrink: true }}
              required
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(event) => setIsActive(event.target.checked)}
                  />
                }
                label="Active"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={disabled}
                    onChange={(event) => setDisabled(event.target.checked)}
                  />
                }
                label="Disabled"
              />
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
