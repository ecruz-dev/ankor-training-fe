import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import {
  createDrillMediaUploadUrl,
  createDrillMedia,
  listDrillSegments,
  listDrillTags,
  getDrilById,
  updateDrill,
  type DrillTag,
  type DrillItem,
  type DrillMedia,
} from "../services/drillsService";
import DrillFormFields from "../components/DrillFormFields";
import DrillRecordingControls from "../components/DrillRecordingControls";
import {
  normalizeTagOptions,
  toSegmentOptions,
  type SegmentOption,
} from "../utils/options";
import { extractYouTubeId } from "../utils/youtube";
import { createInitialDrillForm, type DrillFormState } from "../utils/drillForm";
import { validateDrillForm } from "../utils/validation";

const mergeTagOptions = (primary: DrillTag[], secondary: DrillTag[]) => {
  if (secondary.length === 0) return primary;

  const byId = new Map(primary.map((tag) => [tag.id, tag]));
  const merged = [...primary];
  let changed = false;

  for (const tag of secondary) {
    if (!tag?.id) continue;
    const existing = byId.get(tag.id);
    if (!existing) {
      merged.push(tag);
      byId.set(tag.id, tag);
      changed = true;
      continue;
    }
    if (
      existing.name &&
      existing.name === existing.id &&
      tag.name &&
      tag.name !== existing.name
    ) {
      const index = merged.findIndex((item) => item.id === tag.id);
      if (index >= 0) {
        merged[index] = tag;
        byId.set(tag.id, tag);
        changed = true;
      }
    }
  }

  return changed ? merged : primary;
};

const toStringValue = (value: number | null | undefined) =>
  Number.isFinite(value) ? String(value) : "";

const pickPrimaryVideoUrl = (media: DrillMedia[] | null | undefined) => {
  if (!Array.isArray(media)) return "";
  const primary =
    media.find((item) => item.type === "video" && item.url) ??
    media.find((item) => item.url);
  return primary?.url ?? "";
};

const mapSkillTags = (
  raw: Array<string | DrillTag> | null | undefined,
  options: DrillTag[],
  extraOptions: DrillTag[] = [],
) => {
  const byId = new Map(
    [...extraOptions, ...options].map((tag) => [tag.id, tag]),
  );
  return (raw ?? [])
    .map((entry) => {
      if (typeof entry === "string") {
        const id = entry.trim();
        if (!id) return null;
        return byId.get(id) ?? { id, name: id };
      }
      if (!entry || typeof entry !== "object") return null;
      const id = entry.id?.trim();
      if (!id) return null;
      const match = byId.get(id);
      if (match) return match;
      const name = entry.name?.trim() || id;
      return { id, name };
    })
    .filter((tag): tag is DrillTag => Boolean(tag?.id && tag.name));
};

const syncSkillTagNames = (selected: DrillTag[], options: DrillTag[]) => {
  if (selected.length === 0 || options.length === 0) return selected;

  const byId = new Map(options.map((tag) => [tag.id, tag]));
  let changed = false;

  const next = selected.map((tag) => {
    const match = byId.get(tag.id);
    if (!match || match.name === tag.name) return tag;
    changed = true;
    return match;
  });

  return changed ? next : selected;
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

export default function EditDrillPage() {
  const { id } = useParams<{ id: string }>();
  const drillId = id ?? "";
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
  const [drillItem, setDrillItem] = React.useState<DrillItem | null>(null);
  const [drillLoading, setDrillLoading] = React.useState(false);
  const [drillError, setDrillError] = React.useState<string | null>(null);
  const [recording, setRecording] = React.useState(false);
  const [recordingError, setRecordingError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(null);
  const [recordedUrl, setRecordedUrl] = React.useState<string | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const recordedChunksRef = React.useRef<Blob[]>([]);
  const liveVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const initializedRef = React.useRef(false);
  const navigate = useNavigate();
  const { profile } = useAuth();
  const orgId = profile?.default_org_id?.trim() || null;

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
        setTagOptions((prev) => mergeTagOptions(normalizeTagOptions(tags), prev));
      } catch (err) {
        if (!active) return;
        setTagsError(err instanceof Error ? err.message : "Failed to load tags.");
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

  React.useEffect(() => {
    let active = true;

    const loadDrill = async () => {
      if (!drillId) {
        setDrillError("Missing drill id in route.");
        return;
      }

      setDrillLoading(true);
      setDrillError(null);
      try {
        const drill = await getDrilById(drillId, { orgId });
        if (!active) return;
        setDrillItem(drill);
      } catch (err) {
        if (!active) return;
        setDrillError(err instanceof Error ? err.message : "Failed to load drill.");
        setDrillItem(null);
      } finally {
        if (active) setDrillLoading(false);
      }
    };

    void loadDrill();

    return () => {
      active = false;
    };
  }, [drillId]);

  React.useEffect(() => {
    initializedRef.current = false;
    setForm(createInitialDrillForm());
    setRecordedUrl(null);
  }, [drillId]);

  React.useEffect(() => {
    if (!drillItem || initializedRef.current) return;
    const segmentId = drillItem.segment_id ?? drillItem.segment?.id ?? "";

    setForm({
      name: drillItem.name ?? "",
      description: drillItem.description ?? "",
      segmentId,
      minPlayers: toStringValue(drillItem.min_players),
      maxPlayers: toStringValue(drillItem.max_players),
      minAge: toStringValue(drillItem.min_age),
      maxAge: toStringValue(drillItem.max_age),
      youtubeUrl: pickPrimaryVideoUrl(drillItem.media),
      skillTags: mapSkillTags(drillItem.skill_tags, tagOptions),
    });
    initializedRef.current = true;
  }, [drillItem, tagOptions]);

  React.useEffect(() => {
    if (!drillItem?.skill_tags?.length) return;
    setTagOptions((prev) => mergeTagOptions(prev, drillItem.skill_tags ?? []));
  }, [drillItem]);

  React.useEffect(() => {
    if (tagOptions.length === 0) return;
    setForm((prev) => {
      const nextSkillTags = syncSkillTagNames(prev.skillTags, tagOptions);
      if (nextSkillTags === prev.skillTags) return prev;
      return { ...prev, skillTags: nextSkillTags };
    });
  }, [tagOptions]);

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
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!drillId) {
      setSubmitError("Missing drill id in route.");
      return;
    }

    if (!drillItem) {
      setSubmitError("Drill details are not loaded yet.");
      return;
    }

    const selectedTagIds = new Set(form.skillTags.map((tag) => tag.id));
    const existingTagIds = new Set(drillItem.skill_tags.map((tag) => tag.id));
    const add_tag_ids = Array.from(selectedTagIds).filter(
      (id) => !existingTagIds.has(id),
    );
    const remove_tag_ids = Array.from(existingTagIds).filter(
      (id) => !selectedTagIds.has(id),
    );

    setSaving(true);
    try {
      const updated = await updateDrill(
        drillId,
        {
        name: form.name,
        description: form.description,
        segment_id: form.segmentId,
        min_players: form.minPlayers,
        max_players: form.maxPlayers,
        min_age: form.minAge,
        max_age: form.maxAge,
        add_tag_ids,
        remove_tag_ids,
        },
        { orgId },
      );
      setDrillItem(updated);
      setSubmitError(null);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to update drill.",
      );
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
    if (!drillId) {
      setUploadError("Missing drill id in route.");
      return;
    }
    if (!orgId) {
      setUploadError("Missing org_id. Please sign in again.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadedUrl(null);

    const contentType = blob.type || "video/webm";
    const fileName = `drill-${drillId}-${Date.now()}.${pickFileExtension(
      contentType,
    )}`;

    try {
      const upload = await createDrillMediaUploadUrl({
        org_id: orgId,
        drill_id: drillId,
        media_type: "video",
        file_name: fileName,
        content_type: contentType,
        content_length: blob.size,
      });

      const uploadUrl = pickUploadUrl(upload);
      if (!uploadUrl) {
        throw new Error("Upload URL missing from response.");
      }

      const fields = (upload as any)?.fields as Record<string, string> | undefined;
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

      await createDrillMedia({
        drill_id: drillId,
        org_id: orgId,
        type: "video",
        url: publicUrl,
        title: form.name.trim() || null,
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

  const startRecording = async () => {
    if (recording || uploading) return;
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

  const canRecord = Boolean(drillId) && Boolean(orgId);

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
              Edit Drill
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update drill details and upload media.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate("/drills")}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Saving..." : "Update"}
            </Button>
          </Stack>
        </Stack>

        {drillLoading && (
          <Typography variant="body2" color="text.secondary">
            Loading drill details...
          </Typography>
        )}

        {drillError && (
          <Typography color="error" variant="body2">
            {drillError}
          </Typography>
        )}

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
          videoExtras={
            <DrillRecordingControls
              canRecord={canRecord}
              recording={recording}
              uploading={uploading}
              recordingError={recordingError}
              uploadError={uploadError}
              uploadedUrl={uploadedUrl}
              recordedUrl={recordedUrl}
              onStart={startRecording}
              onStop={stopRecording}
              videoRef={liveVideoRef}
            />
          }
        />
      </Stack>
    </Box>
  );
}
