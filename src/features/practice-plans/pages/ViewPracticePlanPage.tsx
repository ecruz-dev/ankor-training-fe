import * as React from "react";
import {
  Box,
  Chip,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  Paper,
  Stack,
  TextField,
  Typography,
  Button,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate, useParams } from "react-router-dom";

import AnchorIcon from "@mui/icons-material/Anchor";
import SearchIcon from "@mui/icons-material/Search";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

import { getPlanById } from "../services/practicePlanService";
import { useAuth } from "../../../app/providers/AuthProvider";
import { getDrillMediaPlay } from "../../drills/services/drillsService";
import DrillsPlayDialog from "../../drills/components/list/DrillsPlayDialog";

type PlanSegment = {
  id: string;
  drillId: string;
  drillName?: string;
  durationMin: number;
  notes: string;
  planItemId?: string;
};

const DEFAULT_DURATION_MIN = 10;

function uid() {
  // works in modern browsers; safe fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis.crypto;
  return c?.randomUUID?.() ?? `seg_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function formatHeaderTimestamp(iso: string) {
  // Similar to: DECEMBER 18, 2025 AT 11:19 AM
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "2-digit",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
  return `${date} at ${time}`.toUpperCase();
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function resolvePlanItemId(item: Record<string, unknown>): string | undefined {
  const raw = (item as any).id ?? (item as any).item_id ?? (item as any).plan_item_id;
  return typeof raw === "string" ? raw : undefined;
}

function resolvePlanItemDrillId(item: Record<string, unknown>): string {
  const raw = (item as any).drill_id ?? (item as any).drillId;
  return typeof raw === "string" ? raw : "";
}

function resolvePlanItemDrillName(item: Record<string, unknown>): string {
  const raw =
    (item as any).drill_name ??
    (item as any).drillName ??
    (item as any).title ??
    (item as any).name;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return "Unknown drill";
}

function resolvePlanItemNotes(item: Record<string, unknown>): string {
  const raw = (item as any).notes ?? (item as any).instructions ?? (item as any).title;
  return typeof raw === "string" ? raw : "";
}

function resolvePlanItemDurationMin(item: Record<string, unknown>): number {
  const durationMin = toFiniteNumber(
    (item as any).duration_min ??
      (item as any).durationMin ??
      (item as any).duration_minutes ??
      (item as any).durationMinutes,
  );
  if (durationMin !== null) return Math.max(0, durationMin);

  const durationSec = toFiniteNumber(
    (item as any).duration_seconds ?? (item as any).durationSeconds,
  );
  if (durationSec !== null) return Math.max(0, Math.ceil(durationSec / 60));

  return DEFAULT_DURATION_MIN;
}

function normalizePlanSegments(items: unknown[]): PlanSegment[] {
  const normalized = items
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const typed = item as Record<string, unknown>;
      const position = toFiniteNumber(
        (typed as any).position ?? (typed as any).order ?? (typed as any).section_order,
      );
      const planItemId = resolvePlanItemId(typed);

      return {
        position: position ?? index + 1,
        segment: {
          id: planItemId ?? uid(),
          planItemId,
          drillId: resolvePlanItemDrillId(typed),
          drillName: resolvePlanItemDrillName(typed),
          durationMin: resolvePlanItemDurationMin(typed),
          notes: resolvePlanItemNotes(typed),
        },
      };
    })
    .filter((entry): entry is { position: number; segment: PlanSegment } => Boolean(entry))
    .sort((a, b) => a.position - b.position)
    .map((entry) => entry.segment);

  return normalized;
}

function SegmentRow({
  index,
  drillName,
  durationMin,
  notes,
  onPlay,
}: {
  index: number;
  drillName: string;
  durationMin: number;
  notes: string;
  onPlay: (evt: React.MouseEvent<HTMLElement>) => void;
}) {
  return (
    <Box>
      <ListItemButton
        alignItems="flex-start"
        disableRipple
        sx={{
          py: 1.25,
          cursor: "default",
          "&:hover": { bgcolor: "transparent" },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, mt: 0.4 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              color: "text.disabled",
              userSelect: "none",
            }}
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>
        </ListItemIcon>

        <Box sx={{ width: 64, pt: 0.2 }}>
          <Typography variant="body2" fontWeight={800}>
            {index + 1}
          </Typography>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={900} noWrap>
            {drillName}
          </Typography>
          {notes ? (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
              {notes}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              No notes
            </Typography>
          )}
        </Box>

        <Box sx={{ width: 92, textAlign: "right", pt: 0.2 }}>
          <Typography variant="body2" fontWeight={800}>
            {durationMin}m
          </Typography>
        </Box>

        <Button size="small" variant="outlined" onClick={onPlay} sx={{ ml: 1, flexShrink: 0 }}>
          Play
        </Button>
      </ListItemButton>

      <Divider />
    </Box>
  );
}

export default function ViewPracticePlanPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { id: planId } = useParams();
  const { profile } = useAuth();
  const orgId = profile?.default_org_id?.trim() || null;

  // plan header
  const [planName, setPlanName] = React.useState("");
  const [updatedAt, setUpdatedAt] = React.useState(() => new Date().toISOString());
  const [planLoading, setPlanLoading] = React.useState(true);
  const [planError, setPlanError] = React.useState<string | null>(null);

  // segments
  const [segments, setSegments] = React.useState<PlanSegment[]>([]);
  const [segmentSearch, setSegmentSearch] = React.useState("");

  const [playState, setPlayState] = React.useState<{
    open: boolean;
    drillName: string | null;
    loading: boolean;
    error: string | null;
    playUrl: string | null;
  }>({
    open: false,
    drillName: null,
    loading: false,
    error: null,
    playUrl: null,
  });
  const playRequestIdRef = React.useRef(0);

  React.useEffect(() => {
    if (!planId) {
      setPlanError("Missing plan id.");
      setPlanLoading(false);
      return;
    }
    if (!orgId) {
      setPlanError("Missing org_id. Please sign in again.");
      setPlanLoading(false);
      return;
    }

    let active = true;
    setPlanLoading(true);
    setPlanError(null);

    getPlanById(planId, { orgId })
      .then((plan) => {
        if (!active) return;
        setPlanName(plan.name?.trim() || "Untitled plan");
        setUpdatedAt(plan.updated_at || plan.created_at || new Date().toISOString());
        const nextSegments = normalizePlanSegments(plan.items ?? []);
        setSegments(nextSegments);
      })
      .catch((err: any) => {
        if (!active) return;
        setPlanError(err?.message || "Failed to load plan.");
        setSegments([]);
      })
      .finally(() => {
        if (active) setPlanLoading(false);
      });

    return () => {
      active = false;
    };
  }, [planId, orgId]);

  const totalDuration = React.useMemo(
    () => segments.reduce((sum, s) => sum + (Number.isFinite(s.durationMin) ? s.durationMin : 0), 0),
    [segments]
  );

  const filteredSegments = React.useMemo(() => {
    const q = segmentSearch.trim().toLowerCase();
    if (!q) return segments;

    return segments.filter((s) => {
      const label = s.drillName ?? "";
      return label.toLowerCase().includes(q) || s.notes.toLowerCase().includes(q);
    });
  }, [segments, segmentSearch]);

  const headerChip = segments.length === 0 ? "Draft" : "In progress";
  const emptyMessage = segmentSearch.trim()
    ? "No drills match your search."
    : "No drills added yet.";

  function openPlay(seg: PlanSegment) {
    if (!seg.drillId?.trim()) {
      setPlayState({
        open: true,
        drillName: seg.drillName ?? "Drill video",
        loading: false,
        error: "Missing drill id.",
        playUrl: null,
      });
      return;
    }

    const resolvedOrgId = orgId?.trim() || "";
    if (!resolvedOrgId) {
      setPlayState({
        open: true,
        drillName: seg.drillName ?? "Drill video",
        loading: false,
        error: "Missing org_id.",
        playUrl: null,
      });
      return;
    }

    setPlayState({
      open: true,
      drillName: seg.drillName ?? "Drill video",
      loading: true,
      error: null,
      playUrl: null,
    });

    const requestId = ++playRequestIdRef.current;
    void getDrillMediaPlay(seg.drillId, { orgId: resolvedOrgId })
      .then((response) => {
        if (playRequestIdRef.current !== requestId) return;
        setPlayState((prev) => ({
          ...prev,
          playUrl: response.play_url,
          loading: false,
        }));
      })
      .catch((err: any) => {
        if (playRequestIdRef.current !== requestId) return;
        setPlayState((prev) => ({
          ...prev,
          error: err?.message || "Failed to load drill video.",
          loading: false,
        }));
      });
  }

  function closePlay() {
    playRequestIdRef.current += 1;
    setPlayState({
      open: false,
      drillName: null,
      loading: false,
      error: null,
      playUrl: null,
    });
  }

  return (
    <Box>
      {/* Header (no AppBar; your HomeLayout already has one) */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <AnchorIcon sx={{ mt: 0.5 }} />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={800}>
              {formatHeaderTimestamp(updatedAt)}
            </Typography>

            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={1}
              alignItems={isMobile ? "flex-start" : "center"}
              sx={{ mt: 0.25 }}
            >
              <TextField
                value={planName}
                size="small"
                variant="standard"
                inputProps={{ style: { fontWeight: 900, fontSize: 20 }, readOnly: true }}
                sx={{ minWidth: 220, maxWidth: 420 }}
              />
              <Chip size="small" label={headerChip} sx={{ textTransform: "capitalize" }} />
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              Read-only view
            </Typography>

            {planLoading && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Loading plan...
              </Typography>
            )}
            {planError && (
              <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
                {planError}
              </Typography>
            )}
          </Box>

          {/* (Optional) Back */}
          <Button variant="text" onClick={() => navigate(-1)} sx={{ alignSelf: "flex-start" }}>
            Back
          </Button>
        </Stack>
      </Paper>

      {/* Segments card */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={900} sx={{ flex: 1 }}>
            Segments: {segments.length}
          </Typography>
        </Stack>

        <TextField
          fullWidth
          size="small"
          value={segmentSearch}
          onChange={(e) => setSegmentSearch(e.target.value)}
          placeholder="Search"
          disabled={planLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1.5 }}
        />

        {/* Table header (like screenshot) */}
        <Box sx={{ display: "flex", gap: 1, px: 1.5, pb: 0.75, color: "text.secondary" }}>
          <Box sx={{ width: 40 }} />
          <Box sx={{ width: 64 }}>
            <Typography variant="caption" fontWeight={900}>
              SEGMENT
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" fontWeight={900}>
              DRILL NAME
            </Typography>
          </Box>
          <Box sx={{ width: 92, textAlign: "right" }}>
            <Typography variant="caption" fontWeight={900}>
              DURATION
            </Typography>
          </Box>
        </Box>

        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          {planLoading ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Loading plan...
              </Typography>
            </Box>
          ) : planError ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="error">
                {planError}
              </Typography>
            </Box>
          ) : filteredSegments.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {emptyMessage}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filteredSegments.map((seg) => {
                const idx = segments.findIndex((x) => x.id === seg.id);
                const drillLabel = seg.drillName ?? "Unknown drill";
                return (
                  <SegmentRow
                    key={seg.id}
                    index={idx}
                    drillName={drillLabel}
                    durationMin={seg.durationMin}
                    notes={seg.notes}
                    onPlay={(e) => {
                      e.stopPropagation();
                      openPlay(seg);
                    }}
                  />
                );
              })}
            </List>
          )}
        </Paper>
      </Paper>

      {/* Total Duration */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>
          Total Duration
        </Typography>
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={900}>
            {totalDuration} Minutes
          </Typography>
        </Paper>
      </Paper>

      <DrillsPlayDialog
        open={playState.open}
        drillName={playState.drillName}
        loading={playState.loading}
        error={playState.error}
        playUrl={playState.playUrl}
        onClose={closePlay}
      />
    </Box>
  );
}
