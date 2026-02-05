// src/pages/AthletesListPage.tsx
import * as React from "react";
import {
  Avatar,
  Box,
  Button,
  Divider,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import {
  athleteLabel,
  listAthletes,
  type AthleteListItem,
} from "../services/athleteService";
import { useAuth } from "../../../app/providers/AuthProvider";
import { getAllTeams, type Team } from "../../teams/services/teamsService";

const joinParts = (parts: Array<string | null | undefined>) =>
  parts.filter(Boolean).join(" | ");

const formatTeams = (teams: AthleteListItem["teams"]) => {
  const names = teams.map((team) => team.name).filter(Boolean);
  return names.length > 0 ? names.join(", ") : "";
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
};

export default function AthletesListPage() {
  const { orgId, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchText, setSearchText] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [rows, setRows] = React.useState<AthleteListItem[]>([]);
  const [totalCount, setTotalCount] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = React.useState(false);
  const [teamsError, setTeamsError] = React.useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = React.useState("");

  const pageSize = 20;

  React.useEffect(() => {
    const handle = setTimeout(() => {
      setSearchQuery(searchText.trim());
      setPage(1);
    }, 350);

    return () => {
      clearTimeout(handle);
    };
  }, [searchText]);

  React.useEffect(() => {
    setPage(1);
    setSelectedTeamId("");
  }, [orgId]);

  React.useEffect(() => {
    if (authLoading) return;
    let active = true;

    const resolvedOrgId = orgId?.trim() || "";
    if (!resolvedOrgId) {
      setTeams([]);
      setTeamsError("Missing org_id for this account.");
      return () => {
        active = false;
      };
    }

    setTeamsLoading(true);
    setTeamsError(null);

    getAllTeams({ orgId: resolvedOrgId })
      .then((result) => {
        if (!active) return;
        setTeams(result);
      })
      .catch((err: any) => {
        if (!active) return;
        setTeams([]);
        setTeamsError(err?.message || "Failed to load teams.");
      })
      .finally(() => {
        if (active) setTeamsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, orgId]);

  React.useEffect(() => {
    if (!selectedTeamId) return;
    if (teams.some((team) => team.id === selectedTeamId)) return;
    setSelectedTeamId("");
  }, [teams, selectedTeamId]);

  React.useEffect(() => {
    if (authLoading) return;
    let active = true;

    const resolvedOrgId = orgId?.trim() || "";
    if (!resolvedOrgId) {
      setLoadError("Missing org_id for this account.");
      setRows([]);
      setTotalCount(null);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    setLoadError(null);
    setRows([]);
    setTotalCount(null);

    const query = searchQuery.trim();
    const isEmailQuery = query.includes("@");
    const name = query && !isEmailQuery ? query : undefined;
    const email = query && isEmailQuery ? query : undefined;
    const teamId = selectedTeamId.trim() || undefined;
    const offset = Math.max(0, (page - 1) * pageSize);

    listAthletes({
      orgId: resolvedOrgId,
      name,
      email,
      teamId,
      limit: pageSize,
      offset,
    })
      .then((result) => {
        if (!active) return;
        setRows(result.items);
        const count = typeof result.count === "number" ? result.count : null;
        setTotalCount(count);
      })
      .catch((err: any) => {
        if (!active) return;
        setRows([]);
        setTotalCount(null);
        setLoadError(err?.message || "Failed to load athletes.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, orgId, searchQuery, selectedTeamId, page, pageSize]);

  const displayRows = React.useMemo(() => {
    return [...rows].sort((a, b) =>
      athleteLabel(a).localeCompare(athleteLabel(b)),
    );
  }, [rows]);

  const total = totalCount ?? null;
  const showing = displayRows.length;
  const startIndex = showing > 0 ? (page - 1) * pageSize + 1 : 0;
  const endIndex = showing > 0 ? startIndex + showing - 1 : 0;
  const countLabel =
    total !== null
      ? `${startIndex}-${endIndex} of ${total}`
      : `${showing}`;

  const totalPages = total !== null ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const hasNextPage = total !== null ? page < totalPages : rows.length === pageSize;
  const pageCount =
    total !== null ? totalPages : Math.max(1, page + (hasNextPage ? 1 : 0));

  React.useEffect(() => {
    if (total !== null && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, total, totalPages]);

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
            Athletes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {countLabel} athletes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/athletes/new")}
        >
          New athlete
        </Button>
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ mb: teamsError ? 0.5 : 1.5 }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search name or email..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 520 }}
        />
        <TextField
          select
          size="small"
          label="Team"
          value={selectedTeamId}
          onChange={(event) => {
            setSelectedTeamId(event.target.value);
            setPage(1);
          }}
          disabled={teamsLoading || Boolean(teamsError)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">All teams</MenuItem>
          {teams.map((team) => (
            <MenuItem key={team.id} value={team.id}>
              {team.name || "Unnamed team"}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      {teamsError && (
        <Typography variant="caption" color="error" sx={{ display: "block", mb: 1.5 }}>
          Unable to load teams.
        </Typography>
      )}

      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        {isLoading && displayRows.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Loading athletes...
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
                ? `No athletes match "${searchText.trim()}".`
                : "No athletes found."}
            </Typography>
          </Box>
        ) : (
          <Box>
            <List disablePadding>
              {displayRows.map((row, idx) => {
                const name = athleteLabel(row);
                const phone = row.phone || row.cell_number || "";
                const teams = formatTeams(row.teams);
                const lineOne = joinParts([row.email, phone]);
                const lineTwo = joinParts([
                  row.graduation_year ? `Grad ${row.graduation_year}` : null,
                  teams ? `Teams: ${teams}` : null,
                ]);

                return (
                  <React.Fragment key={row.id}>
                    <ListItem disablePadding>
                      <ListItemButton
                        alignItems="flex-start"
                        sx={{ py: 1.5 }}
                        onClick={() => navigate(`/athletes/${row.id}`)}
                      >
                        <ListItemAvatar>
                          <Avatar>{getInitials(name)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight={700}>
                              {name}
                            </Typography>
                          }
                          secondary={
                            <Stack spacing={0.25}>
                              {lineOne && (
                                <Typography variant="body2" color="text.secondary">
                                  {lineOne}
                                </Typography>
                              )}
                              {lineTwo && (
                                <Typography variant="body2" color="text.secondary">
                                  {lineTwo}
                                </Typography>
                              )}
                            </Stack>
                          }
                          secondaryTypographyProps={{ component: "div" }}
                        />
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
                              navigate(`/athletes/${row.id}`);
                            }}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/athletes/${row.id}/edit`);
                            }}
                          >
                            Edit
                          </Button>
                        </Stack>
                      </ListItemButton>
                    </ListItem>
                    {idx < displayRows.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                );
              })}
            </List>

            {loadError && displayRows.length > 0 && (
              <Box sx={{ px: 2, pb: 1 }}>
                <Typography variant="body2" color="error">
                  {loadError}
                </Typography>
              </Box>
            )}

            {displayRows.length > 0 && (
              <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                <Pagination
                  count={pageCount}
                  page={page}
                  onChange={(_, nextPage) => setPage(nextPage)}
                  color="primary"
                />
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
