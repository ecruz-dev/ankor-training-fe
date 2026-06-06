import * as React from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import {
  listDrills,
  type DrillItem,
} from "../../drills/services/drillsService";
import {
  bulkUpdateSkillDrillMap,
  createSkillMedia,
  createSkillMediaUploadUrl,
  getSkillById,
  getSkillDrillMap,
  updateSkill,
  uploadSkillMediaBatch,
  type Skill,
  type SkillDrillMapItem,
} from "../services/skillsService";
import SkillFormFields from "../components/SkillFormFields";
import SkillRecordingControls from "../components/SkillRecordingControls";
import {
  DEBUG_SPORT_ID,
  SKILL_LEVEL_OPTIONS,
  SKILL_STATUS_OPTIONS,
  SKILL_VISIBILITY_OPTIONS,
} from "../constants";
import { createInitialSkillForm, type SkillFormState } from "../utils/skillForm";
import { validateSkillForm } from "../utils/validation";

type SelectOption = { id: string; label: string };

const DRILL_OPTION_LIMIT = 100;

const ensureOption = (options: SelectOption[], value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return options;
  const exists = options.some(
    (option) => option.id.toLowerCase() === trimmed.toLowerCase(),
  );
  return exists ? options : [...options, { id: trimmed, label: trimmed }];
};

const mergeDrillOptions = (primary: DrillItem[], secondary: DrillItem[]) => {
  if (secondary.length === 0) return primary;

  const byId = new Map(primary.map((drill) => [drill.id, drill]));
  const merged = [...primary];
  let changed = false;

  for (const drill of secondary) {
    if (!drill?.id) continue;
    if (!byId.has(drill.id)) {
      merged.push(drill);
      byId.set(drill.id, drill);
      changed = true;
    }
  }

  return changed ? merged : primary;
};

const drillOptionLabel = (drill: DrillItem) => {
  const name = drill.name?.trim() || "Untitled drill";
  const segment = drill.segment?.name?.trim();
  return segment ? `${name} (${segment})` : name;
};

const mapSkillDrillToDrillItem = (item: SkillDrillMapItem): DrillItem | null => {
  const id = item.drill?.id || item.drill_id;
  if (!id) return null;

  return {
    id,
    org_id: item.drill?.org_id ?? item.org_id ?? null,
    segment_id: null,
    name: item.drill?.name?.trim() || id,
    description: null,
    level: item.drill?.level ?? null,
    min_players: null,
    max_players: null,
    min_age: null,
    max_age: null,
    duration_min: item.drill?.duration_min ?? null,
    visibility: null,
    is_archived: false,
    created_at: item.created_at ?? "",
    updated_at: item.created_at ?? "",
    segment: null,
    skill_tags: [],
    media: [],
  };
};

const pickRecorderMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
};

const pickFileExtension = (contentType: string) => {
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("webm")) return "webm";
  return "webm";
};

const pickUploadUrl = (data: unknown) => {
  if (!data || typeof data !== "object") return "";
  const typed = data as any;
  if (typed.upload && typeof typed.upload === "object") {
    const inner = typed.upload as any;
    if (typeof inner.signed_url === "string") return inner.signed_url;
    if (typeof inner.signedUrl === "string") return inner.signedUrl;
    if (typeof inner.upload_url === "string") return inner.upload_url;
    if (typeof inner.uploadUrl === "string") return inner.uploadUrl;
  }
  if (typeof typed.upload_url === "string") return typed.upload_url;
  if (typeof typed.uploadUrl === "string") return typed.uploadUrl;
  if (typeof typed.signed_url === "string") return typed.signed_url;
  if (typeof typed.signedUrl === "string") return typed.signedUrl;
  if (typed.data && typeof typed.data === "object") {
    const inner = typed.data as any;
    if (typeof inner.upload_url === "string") return inner.upload_url;
    if (typeof inner.uploadUrl === "string") return inner.uploadUrl;
    if (typeof inner.signed_url === "string") return inner.signed_url;
    if (typeof inner.signedUrl === "string") return inner.signedUrl;
  }
  return "";
};

const pickPublicUrl = (data: unknown) => {
  if (!data || typeof data !== "object") return "";
  const typed = data as any;
  if (typed.upload && typeof typed.upload === "object") {
    const inner = typed.upload as any;
    if (typeof inner.public_url === "string") return inner.public_url;
    if (typeof inner.publicUrl === "string") return inner.publicUrl;
  }
  if (typed.media && typeof typed.media === "object") {
    const inner = typed.media as any;
    if (typeof inner.url === "string") return inner.url;
  }
  if (typeof typed.public_url === "string") return typed.public_url;
  if (typeof typed.publicUrl === "string") return typed.publicUrl;
  if (typed.data && typeof typed.data === "object") {
    const inner = typed.data as any;
    if (typeof inner.public_url === "string") return inner.public_url;
    if (typeof inner.publicUrl === "string") return inner.publicUrl;
    if (typeof inner.url === "string") return inner.url;
  }
  return "";
};

const pickStoragePath = (data: unknown) => {
  if (!data || typeof data !== "object") return "";
  const typed = data as any;
  if (typed.upload && typeof typed.upload === "object") {
    const inner = typed.upload as any;
    if (typeof inner.path === "string") return inner.path;
    if (typeof inner.storage_path === "string") return inner.storage_path;
    if (typeof inner.storagePath === "string") return inner.storagePath;
  }
  if (typed.media && typeof typed.media === "object") {
    const inner = typed.media as any;
    if (typeof inner.storage_path === "string") return inner.storage_path;
    if (typeof inner.storagePath === "string") return inner.storagePath;
  }
  if (typeof typed.storage_path === "string") return typed.storage_path;
  if (typeof typed.storagePath === "string") return typed.storagePath;
  if (typed.data && typeof typed.data === "object") {
    const inner = typed.data as any;
    if (typeof inner.storage_path === "string") return inner.storage_path;
    if (typeof inner.storagePath === "string") return inner.storagePath;
  }
  return "";
};

export default function SkillEditPage() {
  const { id } = useParams<{ id: string }>();
  const skillId = id ?? "";
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const orgId = profile?.default_org_id?.trim() || null;
  const [form, setForm] = React.useState<SkillFormState>(() =>
    createInitialSkillForm(DEBUG_SPORT_ID || null),
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [skillItem, setSkillItem] = React.useState<Skill | null>(null);
  const [skillLoading, setSkillLoading] = React.useState(false);
  const [skillError, setSkillError] = React.useState<string | null>(null);
  const [drillOptions, setDrillOptions] = React.useState<DrillItem[]>([]);
  const [selectedDrills, setSelectedDrills] = React.useState<DrillItem[]>([]);
  const [mappedDrillIds, setMappedDrillIds] = React.useState<string[]>([]);
  const [drillsLoading, setDrillsLoading] = React.useState(false);
  const [drillsError, setDrillsError] = React.useState<string | null>(null);
  const [recording, setRecording] = React.useState(false);
  const [recordingError, setRecordingError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(null);
  const [recordedUrl, setRecordedUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const recordedChunksRef = React.useRef<Blob[]>([]);
  const liveVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    initializedRef.current = false;
    setForm(createInitialSkillForm(DEBUG_SPORT_ID || null));
    setErrors({});
    setRecordedUrl(null);
    setUploadedUrl(null);
    setRecording(false);
    setRecordingError(null);
    setUploadError(null);
    setSelectedDrills([]);
    setMappedDrillIds([]);
    setDrillsError(null);
  }, [skillId]);

  React.useEffect(() => {
    let active = true;

    const loadSkill = async () => {
      if (authLoading) {
        return;
      }
      if (!skillId) {
        setSkillError("Missing skill id in route.");
        return;
      }
      if (!orgId) {
        setSkillError("Missing org_id. Please sign in again.");
        return;
      }

      setSkillLoading(true);
      setSkillError(null);
      try {
        const skill = await getSkillById(skillId, { orgId });
        if (!active) return;
        setSkillItem(skill);
      } catch (err) {
        if (!active) return;
        setSkillError(err instanceof Error ? err.message : "Failed to load skill.");
        setSkillItem(null);
      } finally {
        if (active) setSkillLoading(false);
      }
    };

    void loadSkill();

    return () => {
      active = false;
    };
  }, [authLoading, skillId, orgId]);

  React.useEffect(() => {
    let active = true;

    const loadDrills = async () => {
      if (authLoading) return;
      if (!orgId) {
        setDrillsError("Missing org_id. Please sign in again.");
        setDrillOptions([]);
        setSelectedDrills([]);
        setMappedDrillIds([]);
        return;
      }
      if (!skillId) {
        return;
      }

      setDrillsLoading(true);
      setDrillsError(null);
      try {
        const [optionsResult, mappedResult] = await Promise.all([
          listDrills({
            orgId,
            limit: DRILL_OPTION_LIMIT,
            offset: 0,
          }),
          getSkillDrillMap(skillId, { orgId }),
        ]);

        if (!active) return;

        const optionsById = new Map(
          optionsResult.items.map((drill) => [drill.id, drill]),
        );
        const mappedItems = mappedResult.items
          .map((item) => optionsById.get(item.drill_id) ?? mapSkillDrillToDrillItem(item))
          .filter((drill): drill is DrillItem => Boolean(drill?.id));
        setSelectedDrills(mappedItems);
        setMappedDrillIds(mappedItems.map((drill) => drill.id));
        setDrillOptions(mergeDrillOptions(optionsResult.items, mappedItems));
      } catch (err) {
        if (!active) return;
        setDrillOptions([]);
        setSelectedDrills([]);
        setMappedDrillIds([]);
        setDrillsError(
          err instanceof Error ? err.message : "Failed to load drill map.",
        );
      } finally {
        if (active) setDrillsLoading(false);
      }
    };

    void loadDrills();

    return () => {
      active = false;
    };
  }, [authLoading, orgId, skillId]);

  React.useEffect(() => {
    if (!skillItem || initializedRef.current) return;

    setForm({
      title: skillItem.title ?? "",
      category: skillItem.category ?? "",
      description: skillItem.description ?? "",
      level: skillItem.level ?? "",
      visibility: skillItem.visibility ?? "",
      status: skillItem.status ?? "",
      sportId: skillItem.sport_id ?? "",
    });
    initializedRef.current = true;
  }, [skillItem]);

  React.useEffect(() => {
    return () => {
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [recordedUrl]);

  React.useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    if (!recording || !mediaStreamRef.current || !liveVideoRef.current) return;
    liveVideoRef.current.srcObject = mediaStreamRef.current;
    void liveVideoRef.current.play().catch(() => undefined);
  }, [recording]);

  const levelOptions = React.useMemo(
    () => ensureOption(SKILL_LEVEL_OPTIONS, form.level),
    [form.level],
  );
  const visibilityOptions = React.useMemo(
    () => ensureOption(SKILL_VISIBILITY_OPTIONS, form.visibility),
    [form.visibility],
  );
  const statusOptions = React.useMemo(
    () => ensureOption(SKILL_STATUS_OPTIONS, form.status),
    [form.status],
  );
  const hasSkillVideo = React.useMemo(
    () =>
      Boolean(uploadedUrl) ||
      Boolean(
        skillItem?.media?.some(
          (media) => media.type?.toLowerCase() === "video" && media.url,
        ),
      ),
    [skillItem?.media, uploadedUrl],
  );

  const handleChange = (field: keyof SkillFormState) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const syncDrillMap = async () => {
    if (!skillId) {
      throw new Error("Missing skill id in route.");
    }

    const selectedIds = new Set(selectedDrills.map((drill) => drill.id));
    const existingIds = new Set(mappedDrillIds);
    const addIds = Array.from(selectedIds).filter((id) => !existingIds.has(id));
    const removeIds = Array.from(existingIds).filter((id) => !selectedIds.has(id));

    if (addIds.length === 0 && removeIds.length === 0) {
      return;
    }

    if (!orgId) {
      throw new Error("Missing org_id. Please sign in again.");
    }

    await bulkUpdateSkillDrillMap({
      org_id: orgId,
      skill_id: skillId,
      add_drill_ids: addIds,
      remove_drill_ids: removeIds,
      level: 1,
    });

    setMappedDrillIds(Array.from(selectedIds));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors = validateSkillForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!skillId) {
      setSubmitError("Missing skill id in route.");
      return;
    }
    if (!orgId) {
      setSubmitError("Missing org_id. Please sign in again.");
      return;
    }
    if (!skillItem) {
      setSubmitError("Skill details are not loaded yet.");
      return;
    }

    try {
      setSaving(true);
      const updated = await updateSkill(
        skillId,
        {
          title: form.title.trim(),
          category: form.category.trim(),
          description: form.description.trim() || null,
          level: form.level.trim(),
          visibility: form.visibility.trim(),
          status: form.status.trim(),
          sport_id: form.sportId.trim() || null,
        },
        { orgId },
      );
      setSkillItem(updated);
      await syncDrillMap();
      setSubmitError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update skill.";
      setSubmitError(message);
    } finally {
      setSaving(false);
    }
  };

  const stopStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
  };

  const uploadRecordedBlob = async (blob: Blob) => {
    if (!skillId) {
      setUploadError("Missing skill id in route.");
      return;
    }
    if (!orgId) {
      setUploadError("Missing org_id. Please sign in again.");
      return;
    }
    if (hasSkillVideo) {
      setUploadError("Only one video is allowed for each skill.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadedUrl(null);

    const contentType = blob.type || "video/webm";
    const fileName = `skill-${skillId}-${Date.now()}.${pickFileExtension(
      contentType,
    )}`;

    try {
      const upload = await createSkillMediaUploadUrl({
        org_id: orgId,
        skill_id: skillId,
        file_name: fileName,
        content_type: contentType,
        content_length: blob.size,
        title: form.title.trim() || null,
        description: form.description.trim() || null,
        position: 1,
      });

      const uploadUrl = pickUploadUrl(upload);
      if (!uploadUrl) {
        throw new Error("Upload URL missing from response.");
      }

      const fields = (upload as any)?.fields as
        | Record<string, string>
        | undefined;
      let uploadRes: Response;

      if (fields && Object.keys(fields).length > 0) {
        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value);
        });
        formData.append("file", blob, fileName);
        uploadRes = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });
      } else {
        uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: blob,
        });
      }

      if (!uploadRes.ok) {
        throw new Error("Failed to upload video.");
      }

      const publicUrl = pickPublicUrl(upload);
      if (!publicUrl) {
        throw new Error("Upload completed but public URL is missing.");
      }

      const storagePath = pickStoragePath(upload);

      await createSkillMedia({
        skill_id: skillId,
        org_id: orgId,
        storage_path: storagePath || null,
        url: publicUrl,
        title: form.title.trim() || null,
        description: form.description.trim() || null,
        media_type: "video",
        position: 1,
      });

      setUploadedUrl(publicUrl);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload video.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleVideoFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;

    if (!skillId) {
      setUploadError("Missing skill id in route.");
      return;
    }
    if (!orgId) {
      setUploadError("Missing org_id. Please sign in again.");
      return;
    }
    if (hasSkillVideo) {
      setUploadError("Only one video is allowed for each skill.");
      return;
    }
    if (file.type && file.type !== "video/mp4") {
      setUploadError("Please choose an MP4 video file.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadedUrl(null);

    try {
      const result = await uploadSkillMediaBatch({
        org_id: orgId,
        skill_id: skillId,
        file,
        title: form.title.trim() || "Skill video",
      });

      const uploadedItem = result.items.find(
        (item) => item.status === "uploaded",
      );
      const publicUrl =
        uploadedItem?.media?.url || uploadedItem?.upload?.public_url || null;

      if (!uploadedItem || !publicUrl) {
        const reason =
          result.items.find((item) => item.reason)?.reason ||
          "Upload completed but no video URL was returned.";
        throw new Error(reason);
      }

      setUploadedUrl(publicUrl);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload video.",
      );
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    if (recording || uploading) return;
    if (hasSkillVideo) {
      setRecordingError("Only one video is allowed for each skill.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordingError("Recording is not supported in this browser.");
      return;
    }

    setRecordingError(null);
    setUploadError(null);
    setUploadedUrl(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      mediaStreamRef.current = stream;

      recordedChunksRef.current = [];
      const mimeType = pickRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const chunks = recordedChunksRef.current;
        recordedChunksRef.current = [];
        mediaRecorderRef.current = null;
        stopStream();
        setRecording(false);

        const blob = new Blob(chunks, {
          type: recorder.mimeType || "video/webm",
        });

        if (blob.size === 0) {
          setRecordingError("No video was captured.");
          return;
        }

        setRecordedUrl(URL.createObjectURL(blob));
        void uploadRecordedBlob(blob);
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      stopStream();
      setRecordingError(
        err instanceof Error ? err.message : "Unable to start recording.",
      );
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state === "inactive") return;
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const canRecord = Boolean(skillId) && Boolean(orgId) && !hasSkillVideo;

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
              Edit Skill
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update skill details.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate("/skills")}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Saving..." : "Update"}
            </Button>
          </Stack>
        </Stack>

        {skillLoading && (
          <Typography variant="body2" color="text.secondary">
            Loading skill details...
          </Typography>
        )}

        {skillError && (
          <Typography color="error" variant="body2">
            {skillError}
          </Typography>
        )}

        {submitError && (
          <Typography color="error" variant="body2">
            {submitError}
          </Typography>
        )}

        <SkillFormFields
          form={form}
          errors={errors}
          levelOptions={levelOptions}
          visibilityOptions={visibilityOptions}
          statusOptions={statusOptions}
          onFieldChange={handleChange}
          videoExtras={
            <SkillRecordingControls
              canRecord={canRecord}
              videoLimitReached={hasSkillVideo}
              recording={recording}
              uploading={uploading}
              recordingError={recordingError}
              uploadError={uploadError}
              uploadedUrl={uploadedUrl}
              recordedUrl={recordedUrl}
              onStart={startRecording}
              onStop={stopRecording}
              onUploadFile={() => fileInputRef.current?.click()}
              onFileChange={handleVideoFileChange}
              fileInputRef={fileInputRef}
              videoRef={liveVideoRef}
            />
          }
        />

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Drill map
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select drills that train this skill.
              </Typography>
            </Box>
            <Autocomplete
              multiple
              options={drillOptions}
              value={selectedDrills}
              onChange={(_, value) => setSelectedDrills(value)}
              loading={drillsLoading}
              getOptionLabel={drillOptionLabel}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={drillOptionLabel(option)}
                    {...getTagProps({ index })}
                    key={option.id}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Mapped drills"
                  placeholder="Select drills"
                  error={Boolean(drillsError)}
                  helperText={
                    drillsError ||
                    (drillsLoading ? "Loading drills..." : undefined)
                  }
                />
              )}
            />
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
