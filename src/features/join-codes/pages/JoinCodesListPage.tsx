import * as React from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { getAllTeams, type Team } from "../../teams/services/teamsService";
import { listJoinCodes, type JoinCode } from "../services/joinCodeService";

const formatDateTime = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
};

const joinParts = (parts: Array<string | null | undefined>) =>
  parts.filter(Boolean).join(" | ");

const getUsageLabel = (code: JoinCode) => {
  const used =
    typeof code.uses_count === "number"
      ? code.uses_count
      : typeof code.used_count === "number"
        ? code.used_count
        : 0;
  const max = typeof code.max_uses === "number" ? code.max_uses : null;
  if (max === null) return `${used} uses`;
  return `${used}/${max} uses`;
};

const isExpired = (code: JoinCode) => {
  if (!code.expires_at) return false;
  const d = new Date(code.expires_at);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
};

const statusChip = (code: JoinCode) => {
  if (code.disabled) {
    return <Chip size="small" label="Disabled" variant="outlined" />;
  }
  if (!code.is_active) {
    return <Chip size="small" label="Inactive" variant="outlined" />;
  }
  if (isExpired(code)) {
    return <Chip size="small" label="Expired" color="warning" variant="outlined" />;
  }
  return <Chip size="small" label="Active" color="success" />;
};

export default function JoinCodesListPage() {
  const navigate = useNavigate();
  const { orgId, loading: authLoading } = useAuth();
  const [searchText, setSearchText] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [rows, setRows] = React.useState<JoinCode[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = React.useState(false);
  const [teamsError, setTeamsError] = React.useState<string | null>(null);

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

    listJoinCodes({ orgId: resolvedOrgId })
      .then((result) => {
        if (!active) return;
        setRows(result.items ?? []);
      })
      .catch((err: any) => {
        if (!active) return;
        setRows([]);
        setLoadError(err?.message || "Failed to load join codes.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, orgId]);

  React.useEffect(() => {
    if (authLoading) return;
    let active = true;

    const resolvedOrgId = orgId?.trim() || "";
    if (!resolvedOrgId) {
      setTeams([]);
      setTeamsError("Missing org_id. Please sign in again.");
      setTeamsLoading(false);
      return () => {
        active = false;
      };
    }

    setTeamsLoading(true);
    setTeamsError(null);

    getAllTeams({ orgId: resolvedOrgId })
      .then((items) => {
        if (!active) return;
        setTeams(items ?? []);
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

  const teamMap = React.useMemo(() => {
    const map = new Map<string, string>();
    teams.forEach((team) => {
      if (team.id) map.set(team.id, team.name);
    });
    return map;
  }, [teams]);

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((code) => {
      const teamName = code.team_id ? teamMap.get(code.team_id) ?? "" : "";
      const fields = [
        code.code,
        code.org_id ?? "",
        code.team_id ?? "",
        teamName,
      ]
        .join(" ")
        .toLowerCase();
      return fields.includes(q);
    });
  }, [rows, searchQuery, teamMap]);

  const displayRows = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [filtered]);

  const headerLabel =
    isLoading && displayRows.length === 0
      ? "Loading join codes..."
      : `${displayRows.length} join code${displayRows.length === 1 ? "" : "s"}`;

  const handleCopy = async (code: string) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // ignore clipboard errors
    }
  };

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
            Easy Join Codes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {headerLabel}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/easy-join-codes/new")}
        >
          New join code
        </Button>
      </Stack>

      <TextField
        fullWidth
        size="small"
        placeholder="Search by code, team, or org ID..."
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
              Loading join codes...
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
                ? `No join codes match "${searchText.trim()}".`
                : "No join codes found."}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {displayRows.map((code, idx) => {
              const teamName = code.team_id
                ? teamMap.get(code.team_id) ?? "Unknown team"
                : "No team";
              const usageLabel = getUsageLabel(code);
              const expiresLabel = code.expires_at
                ? `Expires ${formatDateTime(code.expires_at)}`
                : "No expiration";
              const createdLabel = code.created_at
                ? `Created ${formatDateTime(code.created_at)}`
                : "";
              const teamLabel = teamsLoading
                ? "Loading team..."
                : teamsError
                  ? "Team unavailable"
                  : teamName;
              const detailLine = joinParts([usageLabel, expiresLabel, createdLabel]);

              return (
                <React.Fragment key={code.code}>
                  <ListItem sx={{ py: 1.5 }}>
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
                          sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
                        >
                          {code.code}
                        </Typography>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          {statusChip(code)}
                          <Tooltip title="Copy join code">
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(code.code)}
                            >
                              <ContentCopyIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>

                      <Typography variant="body2" color="text.secondary">
                        Team: {teamLabel}
                      </Typography>

                      {detailLine && (
                        <Typography variant="body2" color="text.secondary">
                          {detailLine}
                        </Typography>
                      )}

                      {code.org_id && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
                        >
                          Org: {code.org_id}
                        </Typography>
                      )}

                      {code.team_id && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
                        >
                          Team ID: {code.team_id}
                        </Typography>
                      )}
                    </Stack>
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
