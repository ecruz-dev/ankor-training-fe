import * as React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { SPORT_OPTIONS } from "../constants";
import { createTeam } from "../services/teamsService";
import TeamFormFields from "../components/TeamFormFields";
import { createInitialTeamForm, type TeamFormState } from "../utils/teamForm";
import { validateTeamForm } from "../utils/validation";

export default function NewTeamPage() {
  const navigate = useNavigate();
  const { orgId } = useAuth();
  const [form, setForm] = React.useState<TeamFormState>(createInitialTeamForm());
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

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

    if (!orgId) {
      setSubmitError("Missing org_id. Please sign in again.");
      return;
    }

    try {
      setSaving(true);
      const created = await createTeam({
        org_id: orgId,
        name: form.name.trim(),
        sport_id: form.sportId.trim() || null,
        is_active: form.isActive,
      });

      if (created?.id) {
        navigate(`/teams/${created.id}`);
      } else {
        navigate("/teams");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create team.";
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
              New Team
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a new team for your organization.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate("/teams")}>
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
