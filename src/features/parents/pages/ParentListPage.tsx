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
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import {
  guardianLabel,
  listGuardians,
  type GuardianListItem,
} from "../services/guardianService";

const joinParts = (parts: Array<string | null | undefined>) =>
  parts.filter(Boolean).join(" | ");

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
};

const formatAddress = (guardian: GuardianListItem) => {
  const line1 = guardian.address_line1?.trim() ?? "";
  const line2 = guardian.address_line2?.trim() ?? "";
  const city = guardian.city?.trim() ?? "";
  const region = guardian.region?.trim() ?? "";
  const postal = guardian.postal_code?.trim() ?? "";
  const country = guardian.country?.trim() ?? "";

  const cityRegion = [city, region].filter(Boolean).join(", ");
  const cityRegionPostal = [cityRegion, postal].filter(Boolean).join(" ");
  const parts = [line1, line2, cityRegionPostal, country].filter(Boolean);
  return parts.join(", ");
};

const formatAthletesSummary = (athletes: GuardianListItem["athletes"]) => {
  if (!athletes || athletes.length === 0) return "";
  const relationships = Array.from(
    new Set(
      athletes
        .map((athlete) => athlete.relationship?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const count = athletes.length;
  if (relationships.length === 0) {
    return `${count}`;
  }
  return `${count} (${relationships.join(", ")})`;
};

export default function ParentListPage() {
  const { orgId, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchText, setSearchText] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [rows, setRows] = React.useState<GuardianListItem[]>([]);
  const [totalCount, setTotalCount] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);

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
  }, [orgId]);

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
    const offset = Math.max(0, (page - 1) * pageSize);

    listGuardians({
      orgId: resolvedOrgId,
      name: query || undefined,
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
        setLoadError(err?.message || "Failed to load parents.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, orgId, searchQuery, page, pageSize]);

  const displayRows = React.useMemo(() => {
    return [...rows].sort((a, b) =>
      guardianLabel(a).localeCompare(guardianLabel(b)),
    );
  }, [rows]);

  const total = totalCount ?? null;
  const showing = displayRows.length;
  const startIndex = showing > 0 ? (page - 1) * pageSize + 1 : 0;
  const endIndex = showing > 0 ? startIndex + showing - 1 : 0;
  const countLabel =
    total !== null ? `${startIndex}-${endIndex} of ${total}` : `${showing}`;

  const totalPages = total !== null ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const hasNextPage = total !== null ? page < totalPages : rows.length === pageSize;
  const pageCount =
    total !== null ? totalPages : Math.max(1, page + (hasNextPage ? 1 : 0));

  React.useEffect(() => {
    if (total !== null && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, total, totalPages]);

  const openParent = React.useCallback(
    (parent: GuardianListItem) => {
      if (!parent.id) return;
      navigate(`/parents/${parent.id}`, { state: { parent } });
    },
    [navigate],
  );

  const editParent = React.useCallback(
    (parent: GuardianListItem) => {
      if (!parent.id) return;
      navigate(`/parents/${parent.id}/edit`, { state: { parent } });
    },
    [navigate],
  );

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
            Parents
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {countLabel} parents
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/parents/new")}
        >
          New parent
        </Button>
      </Stack>

      <TextField
        fullWidth
        size="small"
        placeholder="Search parent name..."
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
              Loading parents...
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
                ? `No parents match "${searchText.trim()}".`
                : "No parents found."}
            </Typography>
          </Box>
        ) : (
          <Box>
            <List disablePadding>
              {displayRows.map((row, idx) => {
                const name = guardianLabel(row);
                const lineOne = joinParts([row.email, row.phone]);
                const address = formatAddress(row);
                const athleteSummary = formatAthletesSummary(row.athletes);
                const lineTwo = joinParts([
                  address,
                  athleteSummary ? `Athletes: ${athleteSummary}` : null,
                ]);

                return (
                  <React.Fragment key={row.id}>
                    <ListItem disablePadding>
                      <ListItemButton
                        alignItems="flex-start"
                        sx={{ py: 1.5 }}
                        onClick={() => openParent(row)}
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
                              openParent(row);
                            }}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={(event) => {
                              event.stopPropagation();
                              editParent(row);
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
