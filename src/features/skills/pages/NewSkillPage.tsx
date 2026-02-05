import * as React from "react";
import { Box, Stack, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { createSkill } from "../services/skillsService";
import SkillFormFields from "../components/SkillFormFields";
import {
  DEBUG_SPORT_ID,
  SKILL_LEVEL_OPTIONS,
  SKILL_STATUS_OPTIONS,
  SKILL_VISIBILITY_OPTIONS,
} from "../constants";
import { createInitialSkillForm, type SkillFormState } from "../utils/skillForm";
import { validateSkillForm } from "../utils/validation";

export default function NewSkillPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const orgId = profile?.default_org_id?.trim() || null;
  const [form, setForm] = React.useState<SkillFormState>(() =>
    createInitialSkillForm(DEBUG_SPORT_ID || null),
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const handleChange = (field: keyof SkillFormState) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors = validateSkillForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!orgId) {
      setSubmitError("Missing org_id. Please sign in again.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        org_id: orgId,
        sport_id: form.sportId.trim() || null,
        category: form.category.trim(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        level: form.level.trim(),
        visibility: form.visibility.trim(),
        status: form.status.trim(),
      };
      const result = await createSkill(payload);
      const newId =
        (result as any)?.skill?.id ?? (result as any)?.data?.id ?? null;
      if (newId) navigate(`/skills/${newId}`);
      else navigate("/skills");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save skill.";
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
        sx={{ maxWidth: 1400, width: "100%", mx: "auto" }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              New Skill
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add a skill to your library.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate("/skills")}>
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

        <SkillFormFields
          form={form}
          errors={errors}
          levelOptions={SKILL_LEVEL_OPTIONS}
          visibilityOptions={SKILL_VISIBILITY_OPTIONS}
          statusOptions={SKILL_STATUS_OPTIONS}
          onFieldChange={handleChange}
        />
      </Stack>
    </Box>
  );
}
