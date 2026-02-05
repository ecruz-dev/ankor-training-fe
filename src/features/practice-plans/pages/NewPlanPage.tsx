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
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";

import AnchorIcon from "@mui/icons-material/Anchor";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SaveIcon from "@mui/icons-material/Save";

import { createPlan } from "../services/practicePlanService";
import DrillPickerDialog, { type DialogDrill } from "../components/DrillPickerDialog";

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
};

function uid() {
  // works in modern browsers; safe fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis.crypto;
  return c?.randomUUID?.() ?? `seg_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function formatHeaderTimestamp(iso: string) {
  // Similar to screenshot “DECEMBER 18, 2025 AT 11:19 AM”
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
  disabledDrag,
}: {
  id: string;
  index: number;
  drillName: string;
  durationMin: number;
  notes: string;
  onOpenMenu: (evt: React.MouseEvent<HTMLElement>) => void;
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

export default function NewPlanPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const resolvedOrgId = profile?.default_org_id?.trim() || "";
  const resolvedUserId = user?.id?.trim() || "";

  // mock “plan header”
  const [planName, setPlanName] = React.useState("Myplan2");
  const [updatedAt] = React.useState(() => new Date().toISOString());
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // segments
  const [segments, setSegments] = React.useState<PlanSegment[]>([]);
  const [segmentSearch, setSegmentSearch] = React.useState("");

  // add drills dialog
  const [addOpen, setAddOpen] = React.useState(false);

  // row menu
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuSegId, setMenuSegId] = React.useState<string | null>(null);

  // edit segment dialog
  const [editOpen, setEditOpen] = React.useState(false);
  const [editDuration, setEditDuration] = React.useState<number>(10);
  const [editNotes, setEditNotes] = React.useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }, // helps avoid accidental drags while scrolling
    })
  );

  const totalDuration = React.useMemo(
    () => segments.reduce((sum, s) => sum + (Number.isFinite(s.durationMin) ? s.durationMin : 0), 0),
    [segments]
  );

  const filteredSegments = React.useMemo(() => {
    const q = segmentSearch.trim().toLowerCase();
    if (!q) return segments;

    return segments.filter((s) => {
      const name = s.drillName ?? "";
      return name.toLowerCase().includes(q) || s.notes.toLowerCase().includes(q);
    });
  }, [segments, segmentSearch]);

  // For sanity: disable drag while searching (dragging a filtered subset gets confusing)
  const dragDisabled = Boolean(segmentSearch.trim());

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
    setEditOpen(true);
  }

  function saveEdit() {
    if (!menuSegId) {
      // menuSegId might be cleared; find by last opened? keep it simple:
      setEditOpen(false);
      return;
    }
    setSegments((prev) =>
      prev.map((s) =>
        s.id === menuSegId
          ? {
              ...s,
              durationMin: Number.isFinite(editDuration) ? Math.max(0, editDuration) : s.durationMin,
              notes: editNotes,
            }
          : s
      )
    );
    setEditOpen(false);
  }

  function removeSegment(segId: string) {
    setSegments((prev) => prev.filter((s) => s.id !== segId));
  }

  async function handleSavePlan() {
    const ownerUserId = resolvedUserId;
    const name = planName.trim();

    if (!ownerUserId) {
      setSaveError("Missing user_id for this account.");
      return;
    }
    if (!resolvedOrgId) {
      setSaveError("Missing org_id for this account.");
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

    setIsSaving(true);
    setSaveError(null);

    try {
      const items = segments.map((seg, index) => ({
        drill_id: seg.drillId,
        duration_min: seg.durationMin,
        notes: seg.notes?.trim() ? seg.notes.trim() : null,
        position: index + 1,
      }));

      const created = await createPlan({
        owner_user_id: ownerUserId,
        org_id: resolvedOrgId,
        type: "custom",
        name,
        estimated_minutes: totalDuration,
        items,
      });

      if (!created?.id) {
        throw new Error("Plan created but no id was returned.");
      }
      navigate(`/practice-plans/${created.id}/edit`);
    } catch (err: any) {
      setSaveError(err?.message || "Failed to create plan.");
    } finally {
      setIsSaving(false);
    }
  }

  // Keep menuSegId stable for Edit dialog
  React.useEffect(() => {
    if (!editOpen) return;
    // do nothing
  }, [editOpen]);

  const canSave =
    Boolean(planName.trim()) &&
    segments.length > 0 &&
    Boolean(resolvedUserId) &&
    Boolean(resolvedOrgId) &&
    !isSaving;
  const headerChip = segments.length === 0 ? "Draft" : "In progress";

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
            </Stack>
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
                    return (
                      <SortableSegmentRow
                        key={seg.id}
                        id={seg.id}
                        index={idx}
                        drillName={seg.drillName ?? "Unknown drill"}
                        durationMin={seg.durationMin}
                        notes={seg.notes}
                        disabledDrag={dragDisabled}
                        onOpenMenu={(e) => openRowMenu(e, seg.id)}
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
        orgId={resolvedOrgId}
        onAddDrill={handleAddDrill}
        missingOrgIdMessage="Missing org_id for this account."
      />

      {/* Edit Segment Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="xs">
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
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={saveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
