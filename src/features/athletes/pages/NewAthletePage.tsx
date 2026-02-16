import * as React from "react";
import { Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { createAthlete } from "../services/athleteService";
import AthleteFormFields from "../components/AthleteFormFields";
import {
  createInitialAthleteForm,
  type AthleteFormState,
} from "../utils/athleteForm";
import { validateAthleteForm } from "../utils/validation";
import { getAllTeams, type Team } from "../../teams/services/teamsService";
import { listPositions, type Position } from "../services/positionsService";

export default function NewAthletePage() {
  const navigate = useNavigate();
  const { orgId, loading: authLoading } = useAuth();
  const [form, setForm] = React.useState<AthleteFormState>(
    createInitialAthleteForm(),
  );
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = React.useState(false);
  const [teamsError, setTeamsError] = React.useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = React.useState("");
  const [positions, setPositions] = React.useState<Position[]>([]);
  const [positionsLoading, setPositionsLoading] = React.useState(false);
  const [positionsError, setPositionsError] = React.useState<string | null>(null);
  const [selectedPositionId, setSelectedPositionId] = React.useState("");
  const [age, setAge] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [parentFullName, setParentFullName] = React.useState("");
  const [parentEmail, setParentEmail] = React.useState("");
  const [parentMobilePhone, setParentMobilePhone] = React.useState("");
  const [relationship, setRelationship] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSelectedTeamId("");
    setSelectedPositionId("");
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
        setTeams(items);
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

  React.useEffect(() => {
    if (authLoading) return;
    let active = true;

    const resolvedOrgId = orgId?.trim() || "";
    if (!resolvedOrgId) {
      setPositions([]);
      setPositionsError("Missing org_id. Please sign in again.");
      setPositionsLoading(false);
      return () => {
        active = false;
      };
    }

    setPositionsLoading(true);
    setPositionsError(null);

    listPositions({ orgId: resolvedOrgId, limit: 50, offset: 0 })
      .then(({ items }) => {
        if (!active) return;
        setPositions(items);
      })
      .catch((err: any) => {
        if (!active) return;
        setPositions([]);
        setPositionsError(err?.message || "Failed to load positions.");
      })
      .finally(() => {
        if (active) setPositionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, orgId]);

  const teamOptions = React.useMemo(() => {
    return [...teams].sort((a, b) => a.name.localeCompare(b.name));
  }, [teams]);

  const positionOptions = React.useMemo(() => {
    return [...positions].sort((a, b) => a.name.localeCompare(b.name));
  }, [positions]);

  const teamHelperText = teamsError
    ? teamsError
    : teamsLoading
      ? "Loading teams..."
      : teamOptions.length === 0
        ? "No teams available."
        : "Optional";

  const positionHelperText = positionsError
    ? positionsError
    : positionsLoading
      ? "Loading positions..."
      : positionOptions.length === 0
        ? "No positions available."
        : "Optional";

  const handleChange = (field: keyof AthleteFormState) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const toOptionalNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors = validateAthleteForm(form, {
      requirePassword: true,
      requireUsername: true,
    });
    const trimmedPassword = form.password.trim();
    const trimmedConfirm = confirmPassword.trim();
    if (!trimmedConfirm) {
      nextErrors.confirm_password = "Confirm your password.";
    } else if (trimmedPassword !== trimmedConfirm) {
      nextErrors.confirm_password = "Passwords do not match.";
    }
    const trimmedAge = age.trim();
    const ageValue = toOptionalNumber(age);
    if (trimmedAge && ageValue === null) {
      nextErrors.age = "Age must be a number.";
    } else if (ageValue !== null && ageValue <= 0) {
      nextErrors.age = "Age must be greater than 0.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!orgId) {
      setSubmitError("Missing org_id. Please sign in again.");
      return;
    }

    try {
      setSaving(true);
      const created = await createAthlete({
        org_id: orgId,
        email: form.email.trim(),
        password: form.password.trim(),
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        full_name: [form.firstName, form.lastName].filter(Boolean).join(" ").trim(),
        cell_number: form.cellNumber.trim() || null,
        username: form.username.trim(),
        graduation_year: toOptionalNumber(form.graduationYear),
        team_id: selectedTeamId.trim() || null,
        position_id: selectedPositionId.trim() || null,
        age: ageValue,
        gender: gender.trim() || null,
        parent_email: parentEmail.trim() || null,
        parent_full_name: parentFullName.trim() || null,
        parent_mobile_phone: parentMobilePhone.trim() || null,
        relationship: relationship.trim() || null,
      });

      if (created?.id) {
        navigate(`/athletes/${created.id}/edit`);
      } else {
        navigate("/athletes");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create athlete.";
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
        sx={{ maxWidth: 1200, width: "100%", mx: "auto" }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              New Athlete
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add an athlete to your organization.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate("/athletes")}>
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

        <AthleteFormFields
          form={form}
          errors={errors}
          onFieldChange={handleChange}
          showPassword
          passwordLabel="Password (required)"
          passwordRequired
          showConfirmPassword
          confirmPassword={confirmPassword}
          onConfirmPasswordChange={(event) => setConfirmPassword(event.target.value)}
          confirmPasswordLabel="Confirm password (required)"
          confirmPasswordRequired
        >
          <TextField
            label="Age"
            type="number"
            value={age}
            onChange={(event) => setAge(event.target.value)}
            error={Boolean(errors.age)}
            helperText={errors.age}
            fullWidth
            inputProps={{ min: 1, max: 120 }}
          />
          <TextField
            select
            label="Gender"
            value={gender}
            onChange={(event) => setGender(event.target.value)}
            error={Boolean(errors.gender)}
            helperText={errors.gender || "Optional"}
            fullWidth
          >
            <MenuItem value="">Prefer not to say</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="nonbinary">Non-binary</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
          <TextField
            select
            label="Position"
            value={selectedPositionId}
            onChange={(event) => setSelectedPositionId(event.target.value)}
            error={Boolean(positionsError) || Boolean(errors.position_id)}
            helperText={errors.position_id || positionHelperText}
            fullWidth
            disabled={positionsLoading}
          >
            <MenuItem value="">No position</MenuItem>
            {positionOptions.map((pos) => (
              <MenuItem key={pos.id} value={pos.id}>
                {pos.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Team"
            value={selectedTeamId}
            onChange={(event) => setSelectedTeamId(event.target.value)}
            error={Boolean(teamsError) || Boolean(errors.team_id)}
            helperText={errors.team_id || teamHelperText}
            fullWidth
            disabled={teamsLoading}
          >
            <MenuItem value="">No team</MenuItem>
            {teamOptions.map((team) => (
              <MenuItem key={team.id} value={team.id}>
                {team.name}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Typography variant="subtitle2" color="text.secondary">
              Parent/Guardian
            </Typography>
          </Box>
          <TextField
            label="Parent full name"
            value={parentFullName}
            onChange={(event) => setParentFullName(event.target.value)}
            error={Boolean(errors.parent_full_name)}
            helperText={errors.parent_full_name || "Optional"}
            fullWidth
          />
          <TextField
            label="Parent email"
            type="email"
            value={parentEmail}
            onChange={(event) => setParentEmail(event.target.value)}
            error={Boolean(errors.parent_email)}
            helperText={errors.parent_email || "Optional"}
            fullWidth
          />
          <TextField
            label="Parent mobile phone"
            value={parentMobilePhone}
            onChange={(event) => setParentMobilePhone(event.target.value)}
            error={Boolean(errors.parent_mobile_phone)}
            helperText={errors.parent_mobile_phone || "Optional"}
            fullWidth
          />
          <TextField
            label="Relationship"
            value={relationship}
            onChange={(event) => setRelationship(event.target.value)}
            error={Boolean(errors.relationship)}
            helperText={errors.relationship || "Optional"}
            fullWidth
          />
        </AthleteFormFields>
      </Stack>
    </Box>
  );
}
