// src/pages/DrillsDetailPage.tsx
import * as React from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CheckIcon from "@mui/icons-material/Check";
import BoltIcon from "@mui/icons-material/Bolt";
import { useNavigate, useParams } from "react-router-dom";
import { toYouTubeEmbedUrl } from "../utils/youtube";

// ---- Types -------------------------------------------------------------------
type DrillDetail = {
  id: string;
  title: string;
  database: string;
  segment?: string;
  skillTags?: string[];
  descriptiveTags?: string[];
  solo?: boolean;
  iconUrl?: string;
  videoUrl?: string;
};

// ---- Demo / fallback data (replace with real fetch) --------------------------
const FALLBACK_DRILL: DrillDetail = {
  id: "snake-gbs",
  title: "Snake GBs (Defensemen)",
  database: "Backyard Database",
  segment: "GBs",
  skillTags: ["Goose GBs", "Move It After Pick Up", "Protect It After Pick Up"],
  descriptiveTags: ["Solo GB Drill"],
  solo: true,
  videoUrl: "https://www.youtube.com/watch?reload=9&v=dj_3z78gK6I",
};

// ---- Page --------------------------------------------------------------------
export default function DrillsDetailPage() {
  const { id } = useParams(); // e.g., /drills/:id
  const navigate = useNavigate();

  // TODO: fetch detail by id from your API/Supabase.
  // const { data } = useDrillQuery(id)
  const drill: DrillDetail = FALLBACK_DRILL; // fallback for now

  const embedUrl = toYouTubeEmbedUrl(drill.videoUrl || undefined);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Hero */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          pt: 3,
          pb: 6,
        }}
      >
        <Box sx={{ maxWidth: 1040, mx: "auto", px: 2 }}>
          <Button
            onClick={() => navigate(-1)}
            startIcon={<ArrowBackIosNewIcon fontSize="small" />}
            sx={{ color: "primary.contrastText", mb: 2 }}
          >
            Back
          </Button>

          <Stack alignItems="center" spacing={1}>
            <Avatar
              src={drill.iconUrl}
              sx={{
                width: 88,
                height: 88,
                bgcolor: "background.paper",
                color: "text.primary",
                border: "4px solid rgba(255,255,255,0.65)",
                fontSize: 36,
              }}
            >
              {/* Anchor emoji to match your UI if there's no icon */}
              ⚓
            </Avatar>

            <Typography variant="h5" fontWeight={700} align="center">
              {drill.title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              {drill.database}
            </Typography>
          </Stack>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ maxWidth: 1040, mx: "auto", mt: -4, px: 2 }}>
        {/* Details card */}
        <Card elevation={1} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              Details
            </Typography>
            <Grid container spacing={2}>
              <DetailItem label="Segment" value={drill.segment ?? "—"} />
              <DetailItem label="Source Database" value={drill.database} />
              <DetailItem
                label="Solo"
                value={
                  drill.solo ? (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <CheckIcon fontSize="small" />
                    </Stack>
                  ) : (
                    "—"
                  )
                }
              />
              <Grid item xs={12} md={6}>
                <Label text="Skill Library Tag" />
                <Stack direction="row" flexWrap="wrap" gap={1} mt={0.5}>
                  {(drill.skillTags ?? []).map((t) => (
                    <Chip
                      key={t}
                      size="small"
                      icon={<BoltIcon fontSize="small" />}
                      label={t}
                      variant="outlined"
                    />
                  ))}
                  {(!drill.skillTags || drill.skillTags.length === 0) && (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Label text="Descriptive Tags" />
                <Stack direction="row" flexWrap="wrap" gap={1} mt={0.5}>
                  {(drill.descriptiveTags ?? []).map((t) => (
                    <Chip key={t} size="small" label={t} variant="outlined" />
                  ))}
                  {(!drill.descriptiveTags ||
                    drill.descriptiveTags.length === 0) && (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Video */}
        {embedUrl && (
          <Card elevation={1}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              {/* Responsive 16:9 container */}
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  paddingTop: "56.25%", // 16:9
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                <Box
                  component="iframe"
                  src={embedUrl}
                  title={drill.title}
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
            </CardContent>
          </Card>
        )}

        {!embedUrl && (
          <Card elevation={1}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Video unavailable.
              </Typography>
            </CardContent>
          </Card>
        )}

        <Divider sx={{ my: 4 }} />
        {/* (Optional) Future sections: Coaching Points, Equipment, Setup, etc. */}
      </Box>
    </Box>
  );
}

// ---- Small building blocks ---------------------------------------------------
function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Grid item xs={12} md={3}>
      <Label text={label} />
      <Typography variant="body2" component="div" mt={0.5}>
        {value}
      </Typography>
    </Grid>
  );
}

function Label({ text }: { text: string }) {
  return (
    <Typography
      variant="caption"
      sx={{ display: "block", color: "text.secondary", fontWeight: 600 }}
    >
      {text}
    </Typography>
  );
}
