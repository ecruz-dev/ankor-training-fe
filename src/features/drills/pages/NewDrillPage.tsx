import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import {
  createDrill,
  listDrillSegments,
  listDrillTags,
  type DrillTag,
} from "../services/drillsService";
import DrillFormFields from "../components/DrillFormFields";
import {
  normalizeTagOptions,
  toSegmentOptions,
  type SegmentOption,
} from "../utils/options";
import { createInitialDrillForm, type DrillFormState } from "../utils/drillForm";
import { extractYouTubeId } from "../utils/youtube";
import { validateDrillForm } from "../utils/validation";

export default function NewDrillPage() {
  const [form, setForm] = React.useState<DrillFormState>(
    createInitialDrillForm(),
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [segmentOptions, setSegmentOptions] = React.useState<SegmentOption[]>([]);
  const [segmentsLoading, setSegmentsLoading] = React.useState(false);
  const [segmentsError, setSegmentsError] = React.useState<string | null>(null);
  const [tagOptions, setTagOptions] = React.useState<DrillTag[]>([]);
  const [tagsLoading, setTagsLoading] = React.useState(false);
  const [tagsError, setTagsError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const orgId = profile?.default_org_id?.trim() || null;
  const userId = user?.id ?? null;

  const youtubeId = React.useMemo(() => {
    if (!form.youtubeUrl.trim()) return null;
    return extractYouTubeId(form.youtubeUrl.trim());
  }, [form.youtubeUrl]);

  React.useEffect(() => {
    let active = true;

    const loadSegments = async () => {
      setSegmentsLoading(true);
      setSegmentsError(null);
      if (!orgId) {
        setSegmentsLoading(false);
        setSegmentsError("Missing org_id. Please sign in again.");
        setSegmentOptions([]);
        return;
      }
      try {
        const segments = await listDrillSegments({ orgId });
        if (!active) return;
        setSegmentOptions(toSegmentOptions(segments));
      } catch (err) {
        if (!active) return;
        setSegmentsError(
          err instanceof Error ? err.message : "Failed to load segments.",
        );
        setSegmentOptions([]);
      } finally {
        if (active) setSegmentsLoading(false);
      }
    };

    const loadTags = async () => {
      setTagsLoading(true);
      setTagsError(null);
      if (!orgId) {
        setTagsLoading(false);
        setTagsError("Missing org_id. Please sign in again.");
        setTagOptions([]);
        return;
      }
      try {
        const tags = await listDrillTags({ orgId });
        if (!active) return;
        setTagOptions(normalizeTagOptions(tags));
      } catch (err) {
        if (!active) return;
        setTagsError(err instanceof Error ? err.message : "Failed to load tags.");
        setTagOptions([]);
      } finally {
        if (active) setTagsLoading(false);
      }
    };

    void loadSegments();
    void loadTags();

    return () => {
      active = false;
    };
  }, [orgId]);

  const handleChange = (field: keyof DrillFormState) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors = validateDrillForm(form, youtubeId);

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!orgId) {
      setSubmitError("Missing org_id. Please sign in again.");
      return;
    }
    if (!userId) {
      setSubmitError("Missing user id. Please sign in again.");
      return;
    }

    const toOptionalNumber = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const n = Number(trimmed);
      return Number.isFinite(n) ? n : null;
    };

    try {
      setSaving(true);
      const payload = {
        org_id: orgId,
        segment_id: form.segmentId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        min_players: toOptionalNumber(form.minPlayers),
        max_players: toOptionalNumber(form.maxPlayers),
        min_age: toOptionalNumber(form.minAge),
        max_age: toOptionalNumber(form.maxAge),
        created_by: userId,
        skill_tags: form.skillTags.map((tag) => tag.id),
        media: form.youtubeUrl.trim()
          ? [
              {
                type: "video",
                url: form.youtubeUrl.trim(),
                title: form.name.trim() || null,
              },
            ]
          : [],
      };

      const result = await createDrill(payload);
      const newId = (result as any)?.drill?.id;
      if (newId) navigate(`/drills/${newId}`);
      else navigate("/drills");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save drill.";
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
              New Drill
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add a drill to your library.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate("/drills")}>
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

        <DrillFormFields
          form={form}
          errors={errors}
          segmentOptions={segmentOptions}
          segmentsLoading={segmentsLoading}
          segmentsError={segmentsError}
          tagOptions={tagOptions}
          tagsLoading={tagsLoading}
          tagsError={tagsError}
          youtubeId={youtubeId}
          onFieldChange={handleChange}
          onSkillTagsChange={(value) =>
            setForm((prev) => ({ ...prev, skillTags: value }))
          }
        />
      </Stack>
    </Box>
  );
}
