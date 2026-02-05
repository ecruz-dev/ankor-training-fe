import * as React from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { getAllTeams, type Team } from "../services/teamsService";
import { SPORT_LOOKUP } from "../constants";

const formatDateTime = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
};

const joinParts = (parts: Array<string | null | undefined>) =>
  parts.filter(Boolean).join(" | ");

const statusChip = (isActive: boolean) => (
  <Chip
    size="small"
    label={isActive ? "Active" : "Inactive"}
    color={isActive ? "success" : "default"}
    variant={isActive ? "filled" : "outlined"}
  />
);

export default function TeamsPage() {
  const navigate = useNavigate();
  const { orgId, loading: authLoading } = useAuth();
  const [searchText, setSearchText] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [rows, setRows] = React.useState<Team[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handle = setTimeout(() => {
      setSearchQuery(searchText.trim());
    }, 300);

    return () => {
      clearTimeout(handle);
    };
  }, [searchText]);

  React.useEffect(() => {
    if (authLoading) return;
    let active = true;

    const resolvedOrgId = orgId?.trim() || "";
    if (!resolvedOrgId) {
      setIsLoading(false);
      setLoadError("Missing org_id for this account.");
      setRows([]);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    setLoadError(null);

    getAllTeams({ orgId: resolvedOrgId })
      .then((items) => {
        if (!active) return;
        setRows(items ?? []);
      })
      .catch((err: any) => {
        if (!active) return;
        setRows([]);
        setLoadError(err?.message || "Failed to load teams.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, orgId]);

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((team) => {
      const sport = team.sport_id
        ? SPORT_LOOKUP[team.sport_id] ?? "Unknown sport"
        : "";
      return (
        team.name.toLowerCase().includes(q) ||
        (team.org_id ?? "").toLowerCase().includes(q) ||
        sport.toLowerCase().includes(q)
      );
    });
  }, [rows, searchQuery]);

  const displayRows = React.useMemo(() => {
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered]);

  const activeCount = displayRows.filter((team) => team.is_active).length;
  const countLabel = joinParts([
    `${displayRows.length} team${displayRows.length === 1 ? "" : "s"}`,
    `${activeCount} active`,
  ]);

  const headerLabel =
    isLoading && displayRows.length === 0 ? "Loading teams..." : countLabel;

  return (
    <Box sx={{ width: "100%" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Teams
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {headerLabel}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/teams/new")}
        >
          New team
        </Button>
      </Stack>

      <TextField
        fullWidth
        size="small"
        placeholder="Search teams by name, sport, or org ID..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 1.5, maxWidth: 520 }}
      />

      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        {isLoading && displayRows.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Loading teams...
            </Typography>
          </Box>
        ) : loadError && displayRows.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="error">
              {loadError}
            </Typography>
          </Box>
        ) : displayRows.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {searchText.trim()
                ? `No teams match "${searchText.trim()}".`
                : "No teams found."}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {displayRows.map((team, idx) => {
              const sportLabel = team.sport_id
                ? SPORT_LOOKUP[team.sport_id] ?? "Unknown sport"
                : "";
              const sportChipLabel = sportLabel || "No sport";
              const created = formatDateTime(team.created_at ?? undefined);
              const updated = formatDateTime(team.updated_at ?? undefined);
              const timeLabel =
                updated && updated !== created
                  ? `Updated ${updated}`
                  : created
                    ? `Created ${created}`
                    : "";

              return (
                <React.Fragment key={team.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      alignItems="flex-start"
                      onClick={() => navigate(`/teams/${team.id}`)}
                      sx={{ py: 1.5 }}
                    >
                      <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            sx={{ minWidth: 0, flex: 1 }}
                            noWrap
                          >
                            {team.name}
                          </Typography>
                          {statusChip(team.is_active)}
                        </Stack>

                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                          <Chip size="small" label={sportChipLabel} variant="outlined" />
                        </Stack>

                        {timeLabel && (
                          <Typography variant="body2" color="text.secondary">
                            {timeLabel}
                          </Typography>
                        )}

                        {team.org_id && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
                          >
                            Org: {team.org_id}
                          </Typography>
                        )}

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
                        >
                          Team ID: {team.id}
                        </Typography>
                      </Stack>

                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        sx={{ alignSelf: "center", ml: 1 }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/teams/${team.id}`);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/teams/${team.id}/edit`);
                          }}
                        >
                          Edit
                        </Button>
                      </Stack>
                    </ListItemButton>
                  </ListItem>
                  {idx < displayRows.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}

            {loadError && displayRows.length > 0 && (
              <Box sx={{ px: 2, pb: 1 }}>
                <Typography variant="body2" color="error">
                  {loadError}
                </Typography>
              </Box>
            )}
          </List>
        )}
      </Paper>
    </Box>
  );
}
