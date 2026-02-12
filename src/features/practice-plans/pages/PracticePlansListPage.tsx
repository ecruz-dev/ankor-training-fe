import * as React from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";

import AddIcon from "@mui/icons-material/Add";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import SearchIcon from "@mui/icons-material/Search";

import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import AutoAwesomeMosaicIcon from "@mui/icons-material/AutoAwesomeMosaic";

import AnchorIcon from "@mui/icons-material/Anchor";

import { listInvited, listPlansByType, type PracticePlan } from "../services/practicePlanService";

type TabKey = "my" | "invited" | "prebuilt";

type PracticePlanRow = {
  id: string;
  name: string;
  updated_at: string; // ISO
};

type TabState<T> = Record<TabKey, T>;

const TAB_META: Array<{
  key: TabKey;
  label: string;
  icon: React.ReactElement;
}> = [
  { key: "my", label: "My Plans", icon: <LibraryBooksIcon /> },
  { key: "invited", label: "Invited", icon: <MailOutlineIcon /> },
  { key: "prebuilt", label: "Prebuilt Plans", icon: <AutoAwesomeMosaicIcon /> },
];

function safeFormatTimestamp(iso: string) {
  try {
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
  } catch {
    return iso;
  }
}

function tabTitle(tab: TabKey) {
  switch (tab) {
    case "my":
      return "My Plans";
    case "invited":
      return "Invited Plans";
    case "prebuilt":
      return "Prebuilt Plans";
    default:
      return "Plans";
  }
}

function normalizePlanRows(plans: PracticePlan[]): PracticePlanRow[] {
  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name?.trim() || "Untitled plan",
    updated_at: plan.updated_at || plan.created_at || "",
  }));
}

export default function PracticePlansListPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const userId = user?.id ?? "";
  const orgId = profile?.default_org_id?.trim() || null;
  const isCoach = (profile?.role ?? "").trim().toLowerCase().includes("coach");

  const [tab, setTab] = React.useState<TabKey>("my");
  const [search, setSearch] = React.useState("");

  const [myPlans, setMyPlans] = React.useState<PracticePlanRow[]>([]);
  const [invitedPlans, setInvitedPlans] = React.useState<PracticePlanRow[]>([]);
  const [prebuiltPlans, setPrebuiltPlans] = React.useState<PracticePlanRow[]>([]);
  const [loadingByTab, setLoadingByTab] = React.useState<TabState<boolean>>({
    my: false,
    invited: false,
    prebuilt: false,
  });
  const [errorByTab, setErrorByTab] = React.useState<TabState<string | null>>({
    my: null,
    invited: null,
    prebuilt: null,
  });

  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = React.useState<PracticePlanRow | null>(null);

  const setTabLoading = (key: TabKey, value: boolean) => {
    setLoadingByTab((prev) => ({ ...prev, [key]: value }));
  };

  const setTabError = (key: TabKey, value: string | null) => {
    setErrorByTab((prev) => ({ ...prev, [key]: value }));
  };

  const setPlansForTab = (key: TabKey, rows: PracticePlanRow[]) => {
    if (key === "my") {
      setMyPlans(rows);
    } else if (key === "invited") {
      setInvitedPlans(rows);
    } else {
      setPrebuiltPlans(rows);
    }
  };

  React.useEffect(() => {
    let active = true;

    const fetchTab = async (
      key: TabKey,
      type: "custom-plans" | "invited-plans" | "prebuild",
      filter: { user_id?: string } = {},
    ) => {
      setTabLoading(key, true);
      setTabError(key, null);
      if (!orgId) {
        setPlansForTab(key, []);
        setTabError(key, "Missing org_id. Please sign in again.");
        setTabLoading(key, false);
        return;
      }

      try {
        const { items } = await listPlansByType({ type, orgId, ...filter });
        if (!active) return;
        setPlansForTab(key, normalizePlanRows(items));
      } catch (err: any) {
        if (!active) return;
        setPlansForTab(key, []);
        setTabError(key, err?.message || "Failed to load plans.");
      } finally {
        if (active) setTabLoading(key, false);
      }
    };

    fetchTab("prebuilt", "prebuild");

    return () => {
      active = false;
    };
  }, [orgId]);

  React.useEffect(() => {
    if (tab !== "my") return;

    let active = true;
    setTabLoading("my", true);
    setTabError("my", null);

    if (!userId) {
      setPlansForTab("my", []);
      setTabError("my", "Missing user id. Please sign in again.");
      setTabLoading("my", false);
      return () => {
        active = false;
      };
    }
    if (!orgId) {
      setPlansForTab("my", []);
      setTabError("my", "Missing org_id. Please sign in again.");
      setTabLoading("my", false);
      return () => {
        active = false;
      };
    }

    listPlansByType({ type: "custom", orgId, user_id: userId })
      .then(({ items }) => {
        if (!active) return;
        setPlansForTab("my", normalizePlanRows(items));
      })
      .catch((err: any) => {
        if (!active) return;
        setPlansForTab("my", []);
        setTabError("my", err?.message || "Failed to load my plans.");
      })
      .finally(() => {
        if (active) setTabLoading("my", false);
      });

    return () => {
      active = false;
    };
  }, [tab, userId, orgId]);

  React.useEffect(() => {
    if (tab !== "invited") return;

    let active = true;
    setTabLoading("invited", true);
    setTabError("invited", null);

    if (!userId) {
      setPlansForTab("invited", []);
      setTabError("invited", "Missing user id. Please sign in again.");
      setTabLoading("invited", false);
      return () => {
        active = false;
      };
    }
    if (!orgId) {
      setPlansForTab("invited", []);
      setTabError("invited", "Missing org_id. Please sign in again.");
      setTabLoading("invited", false);
      return () => {
        active = false;
      };
    }

    listInvited({ user_id: userId, orgId })
      .then(({ items }) => {
        if (!active) return;
        setPlansForTab("invited", normalizePlanRows(items));
      })
      .catch((err: any) => {
        if (!active) return;
        setPlansForTab("invited", []);
        setTabError("invited", err?.message || "Failed to load invited plans.");
      })
      .finally(() => {
        if (active) setTabLoading("invited", false);
      });

    return () => {
      active = false;
    };
  }, [tab, userId, orgId]);

  const rows = React.useMemo(() => {
    const source =
      tab === "my" ? myPlans : tab === "invited" ? invitedPlans : prebuiltPlans;
    const q = search.trim().toLowerCase();

    const searched = !q ? source : source.filter((p) => p.name.toLowerCase().includes(q));

    return [...searched].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
  }, [tab, search, myPlans, invitedPlans, prebuiltPlans]);

  const activeLoading = loadingByTab[tab];
  const activeError = errorByTab[tab];
  const canEdit = tab !== "prebuilt" && (tab !== "invited" || isCoach);

  const openMenu = (evt: React.MouseEvent<HTMLElement>, row: PracticePlanRow) => {
    evt.stopPropagation();
    setMenuAnchorEl(evt.currentTarget);
    setMenuRow(row);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
    setMenuRow(null);
  };

  const onOpenPlan = (row: PracticePlanRow) => {
    closeMenu();
    navigate(`/practice-plans/${row.id}`);
  };

  const onEditPlan = (row: PracticePlanRow) => {
    closeMenu();
    navigate(`/practice-plans/${row.id}/edit`);
  };

  const onDuplicate = () => {
    closeMenu();
  };

  const onDelete = () => {
    closeMenu();
  };

  const onCreate = () => {
    navigate("/practice-plans/new");
  };

  return (
    <Box>
      <Paper square elevation={0} sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Tabs
          value={tab}
          onChange={(_, v: TabKey) => setTab(v)}
          variant="scrollable"
          allowScrollButtonsMobile
          scrollButtons={isMobile ? "auto" : false}
        >
          {TAB_META.map((t) => (
            <Tab
              key={t.key}
              value={t.key}
              icon={t.icon}
              iconPosition="start"
              label={t.label}
              sx={{ textTransform: "none", fontWeight: 700 }}
            />
          ))}
        </Tabs>
      </Paper>

      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, flex: 1 }}>
            {tabTitle(tab)}
          </Typography>

          {tab === "my" && (
            <IconButton
              onClick={onCreate}
              aria-label="create plan"
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: "999px",
              }}
            >
              <AddIcon />
            </IconButton>
          )}
        </Stack>

        <TextField
          fullWidth
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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

        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          {activeLoading ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Loading plans...
              </Typography>
            </Box>
          ) : activeError ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="error">
                {activeError}
              </Typography>
            </Box>
          ) : rows.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No plans found.
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {rows.map((row, idx) => (
                <React.Fragment key={row.id}>
                  <ListItemButton
                    alignItems="flex-start"
                    onClick={() => onOpenPlan(row)}
                    sx={{ py: 1.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 44, mt: 0.5 }}>
                      <AnchorIcon />
                    </ListItemIcon>

                    <ListItemText
                      primary={
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 800, letterSpacing: 0.2 }}
                        >
                          {safeFormatTimestamp(row.updated_at)}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "text.primary" }}>
                          {row.name}
                        </Typography>
                      }
                      secondaryTypographyProps={{ component: "div" }}
                    />

                    <Stack
                      direction={isMobile ? "column" : "row"}
                      spacing={1}
                      sx={{ alignSelf: "center", mr: 1 }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPlan(row);
                        }}
                      >
                        View
                      </Button>
                      {canEdit && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPlan(row);
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </Stack>

                    <IconButton
                      edge="end"
                      aria-label="more"
                      onClick={(e) => openMenu(e, row)}
                      sx={{ alignSelf: "center" }}
                    >
                      <MoreHorizIcon />
                    </IconButton>
                  </ListItemButton>

                  {idx !== rows.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>

        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={closeMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={() => menuRow && onOpenPlan(menuRow)}>Open</MenuItem>
          <MenuItem onClick={onDuplicate}>Duplicate</MenuItem>
          <Divider />
          <MenuItem onClick={onDelete} sx={{ color: "error.main" }}>
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}



