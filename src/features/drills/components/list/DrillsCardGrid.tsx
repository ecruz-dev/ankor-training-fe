import type { ReactNode } from "react";
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
import GroupIcon from "@mui/icons-material/Group";
import EventIcon from "@mui/icons-material/Event";
import type { DrillCard } from "../../types";
import { formatDate } from "../../utils/formatters";
import { playerLabel } from "../../utils/drillsList";

const CARD_HEIGHT = 420;
const MEDIA_HEIGHT = 190;

type DrillsCardGridProps = {
  drills: DrillCard[];
  tagLabelById: Map<string, string>;
  onOpenPlay: (drill: DrillCard) => void;
  onView: (drillId: string) => void;
  onEdit?: (drillId: string) => void;
  canEdit?: boolean;
};

export default function DrillsCardGrid({
  drills,
  tagLabelById,
  onOpenPlay,
  onView,
  onEdit,
  canEdit,
}: DrillsCardGridProps) {
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
      {drills.map((drill) => {
        const drillName = drill.name?.trim() || "Untitled drill";
        const tagLabels = (drill.tags ?? [])
          .map((tag) => tagLabelById.get(tag) ?? tag)
          .map((tag) => tag.trim())
          .filter(Boolean);
        const shownTags = tagLabels.slice(0, 2);
        const overflow = tagLabels.length - shownTags.length;
        const thumbnailUrl = drill.thumbnail_url;

        return (
          <Card
            key={drill.id}
            sx={{ height: CARD_HEIGHT, display: "flex", flexDirection: "column" }}
          >
            <CardActionArea
              onClick={() => onOpenPlay(drill)}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
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
                    alt={`${drillName} thumbnail`}
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
                    opacity: 0.9,
                    zIndex: 1,
                  }}
                />

                <Chip
                  label={drill.segment ?? "General"}
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

                {drill.duration_min ? (
                  <Box
                    sx={{
                      position: "absolute",
                      right: 8,
                      bottom: 8,
                      px: 0.75,
                      py: 0.25,
                      bgcolor: "rgba(0,0,0,0.7)",
                      color: "common.white",
                      borderRadius: 0.75,
                      fontSize: "0.75rem",
                      zIndex: 1,
                    }}
                  >
                    {drill.duration_min} min
                  </Box>
                ) : null}
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
                  {drillName}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  flexWrap="nowrap"
                  sx={{ minHeight: 24, overflow: "hidden" }}
                >
                  <MetaItem
                    icon={<GroupIcon fontSize="inherit" />}
                    label={playerLabel(drill)}
                  />
                  <MetaItem
                    icon={<EventIcon fontSize="inherit" />}
                    label={formatDate(drill.created_at)}
                  />
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="nowrap"
                  alignItems="center"
                  sx={{ minHeight: 32, overflow: "hidden" }}
                >
                  {shownTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{
                        maxWidth: 140,
                        minWidth: 0,
                        flexShrink: 1,
                        ".MuiChip-label": {
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        },
                      }}
                    />
                  ))}

                  {overflow > 0 && (
                    <Chip
                      label={`+${overflow}`}
                      size="small"
                      variant="outlined"
                      sx={{ flexShrink: 0 }}
                    />
                  )}

                  {tagLabels.length === 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ minWidth: 0 }}
                    >
                      No tags
                    </Typography>
                  )}
                </Stack>

                <Box sx={{ flexGrow: 1 }} />
              </CardContent>
            </CardActionArea>
            <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
              <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onView(drill.id)}
                  sx={{ flex: 1 }}
                >
                  View
                </Button>
                {allowEdit && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => onEdit?.(drill.id)}
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

function MetaItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
      <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center" }}>
        {icon}
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        noWrap
        sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {label}
      </Typography>
    </Stack>
  );
}
