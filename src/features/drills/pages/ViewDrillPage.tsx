import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Paper,
  Chip,
  Grid,
  CircularProgress,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useNavigate, useParams } from "react-router-dom";
import {
  getDrilById,
  getDrillMediaPlay,
  type DrillItem,
} from "../services/drillsService";
import { formatDate, formatRange } from "../utils/formatters";
import { pickPrimaryMedia } from "../utils/media";
import { toYouTubeEmbedUrl } from "../utils/youtube";
import { useAuth } from "../../../app/providers/AuthProvider";

export default function ViewDrillPage() {
  const { id } = useParams<{ id: string }>();
  const drillId = id ?? "";
  const [drill, setDrill] = React.useState<DrillItem | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [playUrl, setPlayUrl] = React.useState<string | null>(null);
  const [playLoading, setPlayLoading] = React.useState(false);
  const [playError, setPlayError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const orgId = profile?.default_org_id?.trim() || null;

  React.useEffect(() => {
    let active = true;

    const loadDrill = async () => {
      if (authLoading) {
        return;
      }
      if (!drillId) {
        setError("Missing drill id in route.");
        return;
      }
      if (!orgId) {
        setError("Missing org_id. Please sign in again.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getDrilById(drillId, { orgId });
        if (!active) return;
        setDrill(response);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load drill.");
        setDrill(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadDrill();

    return () => {
      active = false;
    };
  }, [authLoading, drillId, orgId]);

  const primaryMedia = React.useMemo(
    () => pickPrimaryMedia(drill?.media ?? []),
    [drill?.media],
  );
  const primaryUrl = primaryMedia?.url ?? "";
  const embedUrl = React.useMemo(
    () => (primaryUrl ? toYouTubeEmbedUrl(primaryUrl) : null),
    [primaryUrl],
  );

  React.useEffect(() => {
    let active = true;
    const isVideo = primaryMedia?.type === "video";

    if (authLoading) {
      return () => {
        active = false;
      };
    }
    if (!drillId || !isVideo || embedUrl) {
      setPlayUrl(null);
      setPlayError(null);
      setPlayLoading(false);
      return () => {
        active = false;
      };
    }
    if (!orgId) {
      setPlayUrl(null);
      setPlayError("Missing org_id. Please sign in again.");
      setPlayLoading(false);
      return () => {
        active = false;
      };
    }

    setPlayLoading(true);
    setPlayError(null);

    void (async () => {
      try {
        const response = await getDrillMediaPlay(drillId, { orgId });
        if (!active) return;
        setPlayUrl(response.play_url);
      } catch (err) {
        if (!active) return;
        setPlayError(
          err instanceof Error ? err.message : "Failed to load drill video.",
        );
        setPlayUrl(null);
      } finally {
        if (active) setPlayLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [authLoading, drillId, embedUrl, orgId, primaryMedia]);

  const playerLabel = drill
    ? formatRange(drill.min_players, drill.max_players, "players", "Any size")
    : "";
  const ageLabel = drill
    ? formatRange(drill.min_age, drill.max_age, "years", "Any age")
    : "";

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5} sx={{ maxWidth: 1100, mx: "auto" }}>
        <Button
          startIcon={<ArrowBackIosNewIcon fontSize="small" />}
          onClick={() => navigate("/drills")}
          sx={{ alignSelf: "flex-start" }}
        >
          Back to drills
        </Button>

        {loading && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Loading drill...
              </Typography>
            </Stack>
          </Paper>
        )}

        {error && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Paper>
        )}

        {drill && (
          <>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="h4" fontWeight={700}>
                  {drill.name?.trim() || "Untitled drill"}
                </Typography>
                {drill.is_archived && (
                  <Chip size="small" label="Archived" variant="outlined" />
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {drill.segment?.name ?? "General"}{" "}
                {drill.level ? `• ${drill.level}` : ""}
              </Typography>
            </Stack>

            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Details
              </Typography>
              <Grid container spacing={2}>
                <DetailItem label="Segment" value={drill.segment?.name ?? "—"} />
                <DetailItem label="Level" value={drill.level ?? "—"} />
                <DetailItem label="Visibility" value={drill.visibility ?? "—"} />
                <DetailItem
                  label="Duration"
                  value={
                    Number.isFinite(drill.duration_min)
                      ? `${drill.duration_min} min`
                      : "—"
                  }
                />
                <DetailItem label="Players" value={playerLabel} />
                <DetailItem label="Ages" value={ageLabel} />
                <DetailItem
                  label="Created"
                  value={drill.created_at ? formatDate(drill.created_at) : "—"}
                />
                <DetailItem
                  label="Updated"
                  value={drill.updated_at ? formatDate(drill.updated_at) : "—"}
                />
              </Grid>
            </Paper>

            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {drill.description?.trim() || "No description available."}
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Skill tags
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {drill.skill_tags.length > 0 ? (
                  drill.skill_tags.map((tag) => (
                    <Chip key={tag.id} label={tag.name} size="small" />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No tags assigned.
                  </Typography>
                )}
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Media
              </Typography>
              {!primaryMedia && (
                <Typography variant="body2" color="text.secondary">
                  No media available.
                </Typography>
              )}
              {primaryMedia && primaryMedia.type === "image" && (
                <Box
                  component="img"
                  src={primaryMedia.url}
                  alt={primaryMedia.title ?? drill.name}
                  sx={{
                    width: "100%",
                    maxHeight: 480,
                    objectFit: "cover",
                    borderRadius: 2,
                  }}
                />
              )}
              {primaryMedia && primaryMedia.type === "video" && (
                <Box>
                  {embedUrl ? (
                    <Box
                      sx={{
                        position: "relative",
                        width: "100%",
                        paddingTop: "56.25%",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        component="iframe"
                        src={embedUrl}
                        title={drill.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        sx={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          border: 0,
                        }}
                      />
                    </Box>
                  ) : playLoading && !playUrl && !primaryUrl ? (
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      sx={{ minHeight: 240 }}
                    >
                      <CircularProgress />
                    </Stack>
                  ) : playUrl || primaryUrl ? (
                    <Box
                      component="video"
                      src={playUrl ?? primaryUrl}
                      controls
                      playsInline
                      sx={{
                        width: "100%",
                        maxHeight: "70vh",
                        display: "block",
                        borderRadius: 2,
                        bgcolor: "grey.900",
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Video unavailable.
                    </Typography>
                  )}
                  {playError && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {playError}
                    </Typography>
                  )}
                </Box>
              )}
              {primaryMedia &&
                (primaryMedia.type === "document" ||
                  primaryMedia.type === "link") && (
                  <Button
                    variant="outlined"
                    href={primaryMedia.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open {primaryMedia.type === "document" ? "document" : "link"}
                  </Button>
                )}
            </Paper>
          </>
        )}
      </Stack>
    </Box>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Grid item xs={12} sm={6} md={3}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Grid>
  );
}
