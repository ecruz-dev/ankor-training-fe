import {
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Stack,
  Typography,
  Chip,
  Button,
} from "@mui/material";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import EventIcon from "@mui/icons-material/Event";
import type { Skill } from "../../services/skillsService";
import { formatDate } from "../../utils/formatters";
import { pickPrimarySkillVideo, pickSkillThumbnailUrl } from "../../utils/media";

const CARD_HEIGHT = 420;
const MEDIA_HEIGHT = 190;

type SkillsCardGridProps = {
  skills: Skill[];
  onOpenPlay: (skill: Skill) => void;
  onView: (skillId: string) => void;
  onEdit?: (skillId: string) => void;
  canEdit?: boolean;
};

export default function SkillsCardGrid({
  skills,
  onOpenPlay,
  onView,
  onEdit,
  canEdit,
}: SkillsCardGridProps) {
  const allowEdit = Boolean(canEdit && onEdit);

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
      }}
    >
      {skills.map((skill) => {
        const title = skill.title?.trim() || "Untitled skill";
        const category = skill.category?.trim() || "General";
        const level = skill.level?.trim() || "Unknown";
        const status = skill.status?.trim() || "unknown";
        const visibility = skill.visibility?.trim() || "unknown";
        const thumbnailUrl = pickSkillThumbnailUrl(skill.media ?? []);
        const hasVideo = Boolean(pickPrimarySkillVideo(skill.media ?? [])?.url);
        const description = skill.description?.trim();

        return (
          <Card
            key={skill.id}
            sx={{ height: CARD_HEIGHT, display: "flex", flexDirection: "column" }}
          >
            <CardActionArea
              onClick={() => onOpenPlay(skill)}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                minHeight: 0,
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  height: MEDIA_HEIGHT,
                  width: "100%",
                  overflow: "hidden",
                  bgcolor: "grey.900",
                  flexShrink: 0,
                }}
              >
                {thumbnailUrl ? (
                  <Box
                    component="img"
                    src={thumbnailUrl}
                    alt={`${title} thumbnail`}
                    loading="lazy"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "grey.300",
                      fontSize: 12,
                      letterSpacing: 0.5,
                    }}
                  >
                    No preview
                  </Box>
                )}

                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.65) 100%)",
                  }}
                />

                <PlayCircleOutlineIcon
                  sx={{
                    position: "absolute",
                    inset: 0,
                    margin: "auto",
                    color: "common.white",
                    fontSize: 54,
                    opacity: hasVideo ? 0.9 : 0.35,
                    zIndex: 1,
                  }}
                />

                <Chip
                  label={category}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    bgcolor: "rgba(0,0,0,0.6)",
                    color: "common.white",
                    zIndex: 1,
                  }}
                />

                <Chip
                  label={level}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: "rgba(0,0,0,0.6)",
                    color: "common.white",
                    zIndex: 1,
                  }}
                />
              </Box>

              <CardContent
                sx={{
                  flex: 1,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                  overflow: "hidden",
                  minHeight: 0,
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    minHeight: "3.5em",
                  }}
                >
                  {title}
                </Typography>

                {description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      minHeight: "4.5em",
                    }}
                  >
                    {description}
                  </Typography>
                )}

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip size="small" label={status} color="default" />
                  <Chip size="small" label={visibility} variant="outlined" />
                </Stack>

                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box
                    sx={{
                      color: "text.secondary",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <EventIcon fontSize="inherit" />
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{ minWidth: 0 }}
                  >
                    Updated {formatDate(skill.updated_at)}
                  </Typography>
                </Stack>

                <Box sx={{ flexGrow: 1 }} />
              </CardContent>
            </CardActionArea>
            <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
              <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onView(skill.id)}
                  sx={{ flex: 1 }}
                >
                  View
                </Button>
                {allowEdit && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => onEdit?.(skill.id)}
                    sx={{ flex: 1 }}
                  >
                    Edit
                  </Button>
                )}
              </Stack>
            </CardActions>
          </Card>
        );
      })}
    </Box>
  );
}
