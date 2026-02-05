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
  getSkillById,
  getSkillMediaPlay,
  type Skill,
} from "../services/skillsService";
import { formatDate } from "../utils/formatters";
import { pickPrimarySkillMedia } from "../utils/media";
import { toYouTubeEmbedUrl } from "../../drills/utils/youtube";
import { useAuth } from "../../../app/providers/AuthProvider";

export default function SkillDetailViewPage() {
  const { id } = useParams<{ id: string }>();
  const skillId = id ?? "";
  const [skill, setSkill] = React.useState<Skill | null>(null);
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

    const loadSkill = async () => {
      if (authLoading) {
        return;
      }
      if (!skillId) {
        setError("Missing skill id in route.");
        return;
      }
      if (!orgId) {
        setError("Missing org_id. Please sign in again.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getSkillById(skillId, { orgId });
        if (!active) return;
        setSkill(response);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load skill.");
        setSkill(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadSkill();

    return () => {
      active = false;
    };
  }, [authLoading, skillId, orgId]);

  const primaryMedia = React.useMemo(
    () => pickPrimarySkillMedia(skill?.media ?? []),
    [skill?.media],
  );
  const primaryUrl = primaryMedia?.url ?? "";
  const embedUrl = React.useMemo(() => {
    if (!primaryMedia || primaryMedia.type !== "video") return null;
    return toYouTubeEmbedUrl(primaryUrl);
  }, [primaryMedia, primaryUrl]);

  React.useEffect(() => {
    let active = true;
    const isVideo = primaryMedia?.type === "video";

    if (authLoading) {
      return () => {
        active = false;
      };
    }
    if (!skillId || !isVideo || embedUrl) {
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
        const response = await getSkillMediaPlay(skillId, { orgId });
        if (!active) return;
        setPlayUrl(response.play_url);
      } catch (err) {
        if (!active) return;
        setPlayError(
          err instanceof Error ? err.message : "Failed to load skill video.",
        );
        setPlayUrl(null);
      } finally {
        if (active) setPlayLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [authLoading, embedUrl, orgId, primaryMedia, skillId]);

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5} sx={{ maxWidth: 1100, mx: "auto" }}>
        <Button
          startIcon={<ArrowBackIosNewIcon fontSize="small" />}
          onClick={() => navigate("/skills")}
          sx={{ alignSelf: "flex-start" }}
        >
          Back to skills
        </Button>

        {loading && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Loading skill...
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

        {skill && (
          <>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="h4" fontWeight={700}>
                  {skill.title?.trim() || "Untitled skill"}
                </Typography>
                <Chip size="small" label={skill.status || "unknown"} variant="outlined" />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {skill.category || "General"}
                {skill.level ? ` | ${skill.level}` : ""}
              </Typography>
            </Stack>

            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Details
              </Typography>
              <Grid container spacing={2}>
                <DetailItem label="Category" value={skill.category || "-"} />
                <DetailItem label="Level" value={skill.level || "-"} />
                <DetailItem label="Visibility" value={skill.visibility || "-"} />
                <DetailItem label="Status" value={skill.status || "-"} />
                <DetailItem label="Sport id" value={skill.sport_id || "-"} />
                <DetailItem
                  label="Created"
                  value={skill.created_at ? formatDate(skill.created_at) : "-"}
                />
                <DetailItem
                  label="Updated"
                  value={skill.updated_at ? formatDate(skill.updated_at) : "-"}
                />
              </Grid>
            </Paper>

            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {skill.description?.trim() || "No description available."}
              </Typography>
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
                  alt={primaryMedia.title ?? skill.title}
                  sx={{
                    width: "100%",
                    maxHeight: 480,
                    objectFit: "cover",
                    borderRadius: 2,
                  }}
                />
              )}
              {primaryMedia && primaryMedia.type === "video" && (
                <>
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
                        title={skill.title}
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
                </>
              )}
              {playError && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {playError}
                </Typography>
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
