import * as React from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Button,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";

import AnchorIcon from "@mui/icons-material/Anchor";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SaveIcon from "@mui/icons-material/Save";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";

import { getPlanById, updatePlan } from "../services/practicePlanService";
import DrillPickerDialog, { type DialogDrill } from "../components/DrillPickerDialog";
import InviteUsersDialog from "../components/InviteUsersDialog";
import { getDrillMediaPlay } from "../../drills/services/drillsService";
import DrillsPlayDialog from "../../drills/components/list/DrillsPlayDialog";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ---------------------------------------
   Types + Helpers
---------------------------------------- */

type PlanSegment = {
  id: string; // unique row id for DnD
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

      return {
        position: position ?? index + 1,
        segment: {
          id: uid(),
          planItemId: resolvePlanItemId(typed),
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

/* ---------------------------------------
   Sortable row
---------------------------------------- */

function SortableSegmentRow({
  id,
  index,
  drillName,
  durationMin,
  notes,
  onOpenMenu,
  onPlay,
  disabledDrag,
}: {
  id: string;
  index: number;
  drillName: string;
  durationMin: number;
  notes: string;
  onOpenMenu: (evt: React.MouseEvent<HTMLElement>) => void;
  onPlay: (evt: React.MouseEvent<HTMLElement>) => void;
  disabledDrag: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: disabledDrag });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style}>
      <ListItemButton
        alignItems="flex-start"
        sx={{
          py: 1.25,
          cursor: disabledDrag ? "default" : "grab",
          "&:active": { cursor: disabledDrag ? "default" : "grabbing" },
        }}
      >
        {/* Drag handle */}
        <ListItemIcon sx={{ minWidth: 40, mt: 0.4 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              color: "text.secondary",
              userSelect: "none",
            }}
            {...(!disabledDrag ? attributes : {})}
            {...(!disabledDrag ? listeners : {})}
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>
        </ListItemIcon>

        {/* Segment # */}
        <Box sx={{ width: 64, pt: 0.2 }}>
          <Typography variant="body2" fontWeight={800}>
            {index + 1}
          </Typography>
        </Box>

        {/* Drill */}
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

        {/* Duration */}
        <Box sx={{ width: 92, textAlign: "right", pt: 0.2 }}>
          <Typography variant="body2" fontWeight={800}>
            {durationMin}m
          </Typography>
        </Box>

        <Button
          size="small"
          variant="outlined"
          onClick={onPlay}
          sx={{ ml: 1, flexShrink: 0 }}
        >
          Play
        </Button>

        {/* Menu */}
        <IconButton edge="end" onClick={onOpenMenu} sx={{ ml: 0.5, alignSelf: "center" }}>
          <MoreHorizIcon />
        </IconButton>
      </ListItemButton>

      <Divider />
    </Box>
  );
}

/* ---------------------------------------
   Page
---------------------------------------- */

export default function EditPracticePlansPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { id: planId } = useParams();
  const { profile, user } = useAuth();
  const fallbackOrgId = profile?.default_org_id?.trim() || "";

  // plan header
  const [planName, setPlanName] = React.useState("");
  const [updatedAt, setUpdatedAt] = React.useState(() => new Date().toISOString());
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [planLoading, setPlanLoading] = React.useState(true);
  const [planError, setPlanError] = React.useState<string | null>(null);
  const [planOrgId, setPlanOrgId] = React.useState("");
  const [initialItemIds, setInitialItemIds] = React.useState<string[]>([]);

  // segments
  const [segments, setSegments] = React.useState<PlanSegment[]>([]);
  const [segmentSearch, setSegmentSearch] = React.useState("");

  // add drills dialog
  const [addOpen, setAddOpen] = React.useState(false);

  // invite users dialog
  const [inviteOpen, setInviteOpen] = React.useState(false);

  // row menu
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuSegId, setMenuSegId] = React.useState<string | null>(null);

  // edit segment dialog
  const [editOpen, setEditOpen] = React.useState(false);
  const [editSegId, setEditSegId] = React.useState<string | null>(null);
  const [editDuration, setEditDuration] = React.useState<number>(10);
  const [editNotes, setEditNotes] = React.useState<string>("");

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }, // helps avoid accidental drags while scrolling
    })
  );

  React.useEffect(() => {
    if (!planId) {
      setPlanError("Missing plan id.");
      setPlanLoading(false);
      return;
    }

    let active = true;
    setPlanLoading(true);
    setPlanError(null);

    getPlanById(planId, { orgId: fallbackOrgId })
      .then((plan) => {
        if (!active) return;
        setPlanName(plan.name?.trim() || "Untitled plan");
        setUpdatedAt(plan.updated_at || plan.created_at || new Date().toISOString());
        setPlanOrgId(plan.org_id ?? "");
        const nextSegments = normalizePlanSegments(plan.items ?? []);
        setSegments(nextSegments);
        setInitialItemIds(
          nextSegments
            .map((segment) => segment.planItemId)
            .filter((id): id is string => Boolean(id))
        );
      })
      .catch((err: any) => {
        if (!active) return;
        setPlanError(err?.message || "Failed to load plan.");
        setSegments([]);
        setInitialItemIds([]);
      })
      .finally(() => {
        if (active) setPlanLoading(false);
      });

    return () => {
      active = false;
    };
  }, [planId, fallbackOrgId]);


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

  // For sanity: disable drag while searching (dragging a filtered subset gets confusing)
  const dragDisabled = Boolean(segmentSearch.trim());

  function openInviteDialog() {
    setInviteOpen(true);
  }

  function closeInviteDialog() {
    setInviteOpen(false);
  }

  function handleAddDrill(drill: DialogDrill, durationMin: number) {
    setSegments((prev) => [
      ...prev,
      {
        id: uid(),
        drillId: drill.id,
        drillName: drill.name,
        durationMin,
        notes: "",
      },
    ]);
  }

  function handleDragEnd(evt: DragEndEvent) {
    if (dragDisabled) return;

    const { active, over } = evt;
    if (!over || active.id === over.id) return;

    setSegments((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function openRowMenu(evt: React.MouseEvent<HTMLElement>, segId: string) {
    evt.stopPropagation();
    setMenuAnchorEl(evt.currentTarget);
    setMenuSegId(segId);
  }

  function closeRowMenu() {
    setMenuAnchorEl(null);
    setMenuSegId(null);
  }

  function openEditFor(segId: string) {
    const seg = segments.find((s) => s.id === segId);
    if (!seg) return;
    setEditDuration(seg.durationMin);
    setEditNotes(seg.notes);
    setEditSegId(segId);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditSegId(null);
  }

  function saveEdit() {
    if (!editSegId) {
      closeEdit();
      return;
    }
    setSegments((prev) =>
      prev.map((s) =>
        s.id === editSegId
          ? {
              ...s,
              durationMin: Number.isFinite(editDuration) ? Math.max(0, editDuration) : s.durationMin,
              notes: editNotes,
            }
          : s
      )
    );
    closeEdit();
  }

  function removeSegment(segId: string) {
    setSegments((prev) => prev.filter((s) => s.id !== segId));
  }

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

    const orgId = planOrgId.trim() || fallbackOrgId;
    if (!orgId) {
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
    void getDrillMediaPlay(seg.drillId, { orgId })
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

  async function handleSavePlan() {
    const name = planName.trim();
    const trimmedPlanId = planId?.trim();

    if (!trimmedPlanId) {
      setSaveError("Missing plan id.");
      return;
    }
    if (!name) {
      setSaveError("Plan name is required.");
      return;
    }
    if (segments.length === 0) {
      setSaveError("Add at least one drill before saving.");
      return;
    }
    if (segments.some((seg) => !seg.drillId.trim())) {
      setSaveError("Some drills are missing a drill id.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const items = segments.map((seg, index) => ({
        drill_id: seg.drillId,
        duration_min: seg.durationMin,
        notes: seg.notes?.trim() ? seg.notes.trim() : null,
        position: index + 1,
      }));

      await updatePlan(
        trimmedPlanId,
        {
          name,
          estimated_minutes: totalDuration,
          add_items: items,
          remove_item_ids: initialItemIds,
        },
        { orgId: fallbackOrgId },
      );

      const refreshed = await getPlanById(trimmedPlanId, { orgId: fallbackOrgId });
      setPlanName(refreshed.name?.trim() || "Untitled plan");
      setUpdatedAt(refreshed.updated_at || refreshed.created_at || new Date().toISOString());
      setPlanOrgId(refreshed.org_id ?? "");
      const nextSegments = normalizePlanSegments(refreshed.items ?? []);
      setSegments(nextSegments);
      setInitialItemIds(
        nextSegments
          .map((segment) => segment.planItemId)
          .filter((id): id is string => Boolean(id))
      );
      alert("Plan updated.");
    } catch (err: any) {
      setSaveError(err?.message || "Failed to update plan.");
    } finally {
      setIsSaving(false);
    }
  }

  const canSave =
    Boolean(planName.trim()) &&
    segments.length > 0 &&
    Boolean(planId?.trim()) &&
    !isSaving &&
    !planLoading;
  const headerChip = segments.length === 0 ? "Draft" : "In progress";
  const inviteOrgId = planOrgId.trim() || fallbackOrgId;
  const inviteAddedBy = user?.id?.trim() || "";

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

            <Stack direction={isMobile ? "column" : "row"} spacing={1} alignItems={isMobile ? "flex-start" : "center"} sx={{ mt: 0.25 }}>
              <TextField
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                size="small"
                variant="standard"
                inputProps={{ style: { fontWeight: 900, fontSize: 20 } }}
                sx={{ minWidth: 220, maxWidth: 420 }}
              />
              <Chip size="small" label={headerChip} sx={{ textTransform: "capitalize" }} />
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<SaveIcon />}
                onClick={handleSavePlan}
                disabled={!canSave}
              >
                {isSaving ? "Saving..." : "Save Plan"}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<PersonAddAltIcon />}
                onClick={openInviteDialog}
              >
                Invite People
              </Button>
            </Stack>
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
            {saveError && (
              <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
                {saveError}
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

          <IconButton
            onClick={() => {
              setAddOpen(true);
            }}
            aria-label="add drill"
            sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: "999px" }}
          >
            <AddIcon />
          </IconButton>
        </Stack>

        <TextField
          fullWidth
          size="small"
          value={segmentSearch}
          onChange={(e) => setSegmentSearch(e.target.value)}
          placeholder="Search"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1.5 }}
        />

        {dragDisabled && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Drag & drop is disabled while searching.
          </Typography>
        )}

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
          <Box sx={{ width: 44 }} />
        </Box>

        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          {filteredSegments.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No drills added yet. Tap (+) to add drills to this plan.
              </Typography>
            </Box>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={segments.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <List disablePadding>
                  {(segmentSearch.trim() ? filteredSegments : segments).map((seg) => {
                    const idx = segments.findIndex((x) => x.id === seg.id);
                    const drillLabel = seg.drillName ?? "Unknown drill";
                    return (
                      <SortableSegmentRow
                        key={seg.id}
                        id={seg.id}
                        index={idx}
                        drillName={drillLabel}
                        durationMin={seg.durationMin}
                        notes={seg.notes}
                        disabledDrag={dragDisabled}
                        onOpenMenu={(e) => openRowMenu(e, seg.id)}
                        onPlay={(e) => {
                          e.stopPropagation();
                          openPlay(seg);
                        }}
                      />
                    );
                  })}
                </List>
              </SortableContext>
            </DndContext>
          )}
        </Paper>

        {/* Row actions menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={closeRowMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem
            onClick={() => {
              if (!menuSegId) return;
              openEditFor(menuSegId);
              closeRowMenu();
            }}
          >
            Edit duration/notes
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              if (!menuSegId) return;
              removeSegment(menuSegId);
              closeRowMenu();
            }}
            sx={{ color: "error.main" }}
          >
            Remove
          </MenuItem>
        </Menu>
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

      <DrillPickerDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        orgId={planOrgId.trim() || fallbackOrgId}
        onAddDrill={handleAddDrill}
        missingOrgIdMessage="Missing org_id."
      />

      <DrillsPlayDialog
        open={playState.open}
        drillName={playState.drillName}
        loading={playState.loading}
        error={playState.error}
        playUrl={playState.playUrl}
        onClose={closePlay}
      />

      {/* Edit Segment Dialog */}
      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="xs">
        <DialogTitle>Edit segment</DialogTitle>
        <DialogContent>
          <Stack spacing={1.25} sx={{ mt: 0.5 }}>
            <TextField
              label="Duration (minutes)"
              size="small"
              value={editDuration}
              onChange={(e) => setEditDuration(Math.max(0, Number(e.target.value)))}
              inputProps={{ inputMode: "numeric" }}
            />
            <TextField
              label="Notes"
              size="small"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit}>Cancel</Button>
          <Button onClick={saveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <InviteUsersDialog
        open={inviteOpen}
        onClose={closeInviteDialog}
        planId={planId}
        orgId={inviteOrgId}
        addedBy={inviteAddedBy}
      />
    </Box>
  );
}



