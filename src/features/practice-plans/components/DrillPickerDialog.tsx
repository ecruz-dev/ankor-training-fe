import * as React from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";

import { listDrills, type DrillItem } from "../../drills/services/drillsService";

export type Position = "Attack" | "Midfield" | "Defense" | "Goalie" | "FOGO" | "Any";

export type DialogDrill = {
  id: string;
  name: string;
  category: string;
  defaultDurationMin: number;
  positions: Position[];
};

type DrillPickerDialogProps = {
  open: boolean;
  orgId: string;
  onClose: () => void;
  onAddDrill: (drill: DialogDrill, durationMin: number) => void;
  missingOrgIdMessage?: string;
};

const POSITION_ORDER: Position[] = ["Attack", "Midfield", "Defense", "Goalie", "FOGO", "Any"];

const POSITION_ALIASES: Record<string, Position> = {
  attack: "Attack",
  midfield: "Midfield",
  defense: "Defense",
  defence: "Defense",
  goalie: "Goalie",
  goalkeeper: "Goalie",
  fogo: "FOGO",
  faceoff: "FOGO",
  "face-off": "FOGO",
  any: "Any",
};

const DEFAULT_DURATION_MIN = 10;
const DRILLS_PAGE_SIZE = 10;

function normalizePosition(raw: string): Position | null {
  const trimmed = raw.trim().toLowerCase();
  return POSITION_ALIASES[trimmed] ?? null;
}

function extractPositions(tags: DrillItem["skill_tags"]): Position[] {
  const positions = new Set<Position>();

  if (Array.isArray(tags)) {
    for (const tag of tags) {
      const label =
        typeof tag === "string"
          ? tag
          : tag && typeof tag === "object"
            ? String((tag as any).name ?? (tag as any).label ?? (tag as any).title ?? "")
            : "";
      const normalized = label ? normalizePosition(label) : null;
      if (normalized) positions.add(normalized);
    }
  }

  if (positions.size === 0) positions.add("Any");
  return Array.from(positions);
}

function toDialogDrill(item: DrillItem): DialogDrill {
  const name = item.name?.trim() || "Untitled drill";
  const duration = Number.isFinite(item.duration_min)
    ? Math.max(0, Number(item.duration_min))
    : DEFAULT_DURATION_MIN;

  return {
    id: item.id,
    name,
    category: item.segment?.name?.trim() || "General",
    defaultDurationMin: duration,
    positions: extractPositions(item.skill_tags),
  };
}

export default function DrillPickerDialog({
  open,
  orgId,
  onClose,
  onAddDrill,
  missingOrgIdMessage = "Missing org_id.",
}: DrillPickerDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [drillSearch, setDrillSearch] = React.useState("");
  const [category, setCategory] = React.useState("All");
  const [position, setPosition] = React.useState<Position | "All">("All");
  const [maxDuration, setMaxDuration] = React.useState<number | "">("");
  const [drills, setDrills] = React.useState<DialogDrill[]>([]);
  const [drillsLoading, setDrillsLoading] = React.useState(false);
  const [drillsError, setDrillsError] = React.useState<string | null>(null);
  const [drillsPage, setDrillsPage] = React.useState(1);
  const [drillsTotalCount, setDrillsTotalCount] = React.useState(0);
  const [durationById, setDurationById] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;
    setDrillsPage(1);
    setDurationById({});
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const resolvedOrgId = orgId?.trim() || "";
    if (!resolvedOrgId) {
      setDrillsError(missingOrgIdMessage);
      setDrillsTotalCount(0);
      return;
    }

    let active = true;
    setDrillsLoading(true);
    setDrillsError(null);

    const name = drillSearch.trim();

    listDrills({
      orgId: resolvedOrgId,
      name: name ? name : undefined,
      limit: DRILLS_PAGE_SIZE,
      offset: (drillsPage - 1) * DRILLS_PAGE_SIZE,
    })
      .then(({ items, count }) => {
        if (!active) return;
        setDrills(items.map(toDialogDrill));
        setDrillsTotalCount(count ?? items.length);
      })
      .catch((err: any) => {
        if (!active) return;
        setDrills([]);
        setDrillsTotalCount(0);
        setDrillsError(err?.message || "Failed to load drills.");
      })
      .finally(() => {
        if (active) setDrillsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, drillsPage, drillSearch, orgId, missingOrgIdMessage]);

  React.useEffect(() => {
    if (!open || drills.length === 0) return;
    setDurationById((prev) => {
      const next = { ...prev };
      for (const drill of drills) {
        if (next[drill.id] === undefined) {
          next[drill.id] = String(drill.defaultDurationMin);
        }
      }
      return next;
    });
  }, [open, drills]);

  const categoryOptions = React.useMemo(() => {
    const categories = new Set<string>();
    for (const drill of drills) {
      const label = drill.category?.trim();
      if (label) categories.add(label);
    }
    const options = ["All", ...Array.from(categories).sort((a, b) => a.localeCompare(b))];
    if (category !== "All" && !options.includes(category)) {
      options.splice(1, 0, category);
    }
    return options;
  }, [drills, category]);

  const positionOptions = React.useMemo(() => {
    const positions = new Set<Position>();
    for (const drill of drills) {
      for (const pos of drill.positions) positions.add(pos);
    }
    if (positions.size === 0) positions.add("Any");
    const ordered = POSITION_ORDER.filter((pos) => positions.has(pos));
    const options = ["All", ...ordered];
    if (position !== "All" && !options.includes(position)) {
      options.splice(1, 0, position);
    }
    return options;
  }, [drills, position]);

  const availableDrills = React.useMemo(() => {
    return drills.filter((d) => {
      if (category !== "All" && d.category !== category) return false;
      if (position !== "All" && !d.positions.includes(position) && !d.positions.includes("Any")) {
        return false;
      }
      if (maxDuration !== "" && d.defaultDurationMin > maxDuration) return false;
      return true;
    });
  }, [category, position, maxDuration, drills]);

  const totalDrillPages = Math.max(1, Math.ceil(drillsTotalCount / DRILLS_PAGE_SIZE));

  const resolveDurationMin = React.useCallback(
    (drill: DialogDrill) => {
      const raw = durationById[drill.id];
      if (raw === undefined || raw.trim() === "") {
        return drill.defaultDurationMin;
      }
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed >= 0) {
        return parsed;
      }
      return drill.defaultDurationMin;
    },
    [durationById],
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add drills</DialogTitle>
      <DialogContent>
        <Stack spacing={1.25} sx={{ mt: 0.5 }}>
          <TextField
            fullWidth
            size="small"
            value={drillSearch}
            onChange={(e) => {
              setDrillSearch(e.target.value);
              setDrillsPage(1);
            }}
            placeholder="Search drills"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Stack direction={isMobile ? "column" : "row"} spacing={1}>
            <FormControl size="small" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setDrillsPage(1);
                }}
              >
                {categoryOptions.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Position</InputLabel>
              <Select
                label="Position"
                value={position}
                onChange={(e) => {
                  setPosition(e.target.value as Position | "All");
                  setDrillsPage(1);
                }}
              >
                {positionOptions.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Max (min)"
              value={maxDuration}
              onChange={(e) => {
                const v = e.target.value;
                setMaxDuration(v === "" ? "" : Math.max(0, Number(v)));
                setDrillsPage(1);
              }}
              inputProps={{ inputMode: "numeric" }}
              fullWidth
            />
          </Stack>

          <Paper variant="outlined" sx={{ overflow: "hidden" }}>
            {drillsLoading ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Loading drills...
                </Typography>
              </Box>
            ) : drillsError ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="error">
                  {drillsError}
                </Typography>
              </Box>
            ) : availableDrills.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No drills match your filters.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    py: 0.75,
                    color: "text.secondary",
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" fontWeight={800}>
                      DRILL
                    </Typography>
                  </Box>
                  <Box sx={{ width: 96, textAlign: "right" }}>
                    <Typography variant="caption" fontWeight={800}>
                      TIME (MIN)
                    </Typography>
                  </Box>
                  <Box sx={{ width: 72 }} />
                </Box>
                <List disablePadding>
                  {availableDrills.map((d) => (
                    <React.Fragment key={d.id}>
                      <ListItemButton
                        onClick={() => onAddDrill(d, resolveDurationMin(d))}
                        sx={{ py: 1.25, alignItems: "center" }}
                      >
                        <ListItemText
                          sx={{ flex: 1, mr: 1 }}
                          primary={<Typography fontWeight={900}>{d.name}</Typography>}
                          secondary={
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                              <Typography variant="caption" color="text.secondary">
                                {d.category}
                              </Typography>
                              <Chip
                                size="small"
                                label={d.positions.includes("Any") ? "Any" : d.positions.join(", ")}
                              />
                            </Stack>
                          }
                          secondaryTypographyProps={{ component: "div" }}
                        />
                        <TextField
                          size="small"
                          type="number"
                          value={durationById[d.id] ?? String(d.defaultDurationMin)}
                          onChange={(e) =>
                            setDurationById((prev) => ({ ...prev, [d.id]: e.target.value }))
                          }
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          inputProps={{ min: 0, step: 1, inputMode: "numeric", "aria-label": "Time (min)" }}
                          sx={{ width: 96, mr: 1 }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddDrill(d, resolveDurationMin(d));
                          }}
                        >
                          Add
                        </Button>
                      </ListItemButton>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}
          </Paper>

          {totalDrillPages > 1 && (
            <Stack alignItems="center" sx={{ pt: 1 }}>
              <Pagination
                count={totalDrillPages}
                page={drillsPage}
                onChange={(_, value) => setDrillsPage(value)}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
                disabled={drillsLoading}
              />
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setDrillSearch("");
            setCategory("All");
            setPosition("All");
            setMaxDuration("");
            setDrillsPage(1);
          }}
        >
          Reset filters
        </Button>
        <Button onClick={onClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
