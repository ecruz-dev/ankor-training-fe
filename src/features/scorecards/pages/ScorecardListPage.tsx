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
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import {
  listScorecardTemplatesPage,
  type ScorecardTemplateRow,
} from "../services/scorecardService";
import { SPORT_LOOKUP } from "../../teams/constants";

const PAGE_SIZE = 10;

const formatDateTime = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
};

const statusChip = (isActive: boolean) => (
  <Chip
    size="small"
    label={isActive ? "Active" : "Inactive"}
    color={isActive ? "success" : "default"}
    variant={isActive ? "filled" : "outlined"}
  />
);

export default function ScorecardListPage() {
  const navigate = useNavigate();
  const { orgId, loading: authLoading } = useAuth();
  const [searchText, setSearchText] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [rows, setRows] = React.useState<ScorecardTemplateRow[]>([]);
  const [totalCount, setTotalCount] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handle = setTimeout(() => {
      setSearchQuery(searchText.trim());
      setPage(1);
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
      setRows([]);
      setTotalCount(0);
      setLoadError("Missing org_id for this account.");
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    setLoadError(null);

    listScorecardTemplatesPage({
      orgId: resolvedOrgId,
      q: searchQuery,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    })
      .then(({ items, count }) => {
        if (!active) return;
        setRows(items ?? []);
        setTotalCount(typeof count === "number" ? count : items.length);
      })
      .catch((err: any) => {
        if (!active) return;
        setRows([]);
        setTotalCount(0);
        setLoadError(err?.message || "Failed to load scorecard templates.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, orgId, page, searchQuery]);

  const total = typeof totalCount === "number" ? totalCount : rows.length;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 0;

  React.useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

  const headerLabel = isLoading && rows.length === 0
    ? "Loading scorecards..."
    : total > 0
      ? `${total} template${total === 1 ? "" : "s"}`
      : "No scorecard templates";

  const emptyMessage = searchText.trim()
    ? `No scorecards match "${searchText.trim()}".`
    : "No scorecard templates found.";

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack spacing={2} sx={{ maxWidth: 1100, mx: "auto" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Scorecard Templates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {headerLabel}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/scorecards/new")}
          >
            New template
          </Button>
        </Stack>

        <TextField
          fullWidth
          size="small"
          placeholder="Search scorecards by name or description..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 520 }}
        />

        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          {isLoading && rows.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Loading scorecards...
              </Typography>
            </Box>
          ) : loadError && rows.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="error">
                {loadError}
              </Typography>
            </Box>
          ) : rows.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {emptyMessage}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {rows.map((row, idx) => {
                const created = formatDateTime(row.created_at);
                const updated = formatDateTime(row.updated_at);
                const timeLabel =
                  updated && updated !== created
                    ? `Updated ${updated}`
                    : created
                      ? `Created ${created}`
                      : "";
                const sportLabel = row.sport_id
                  ? SPORT_LOOKUP[row.sport_id] ?? "Unknown sport"
                  : "";

                return (
                  <React.Fragment key={row.id}>
                    <ListItem disablePadding>
                      <ListItemButton
                        alignItems="flex-start"
                        sx={{ py: 1.5 }}
                        onClick={() => navigate(`/scorecards/${row.id}/edit`)}
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
                              {row.name}
                            </Typography>
                            {statusChip(row.is_active)}
                          </Stack>

                          <Typography variant="body2" color="text.secondary">
                            {row.description?.trim() || "No description."}
                          </Typography>

                          {sportLabel && (
                            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                              <Chip size="small" label={sportLabel} variant="outlined" />
                            </Stack>
                          )}

                          {timeLabel && (
                            <Typography variant="caption" color="text.secondary">
                              {timeLabel}
                            </Typography>
                          )}

                          {row.created_by && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
                            >
                              Created by {row.created_by}
                            </Typography>
                          )}
                        </Stack>

                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          sx={{ alignSelf: "center", ml: 2 }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/scorecards/${row.id}/edit`);
                            }}
                          >
                            Edit
                          </Button>
                        </Stack>
                      </ListItemButton>
                    </ListItem>
                    {idx < rows.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}

              {loadError && rows.length > 0 && (
                <Box sx={{ px: 2, pb: 1 }}>
                  <Typography variant="body2" color="error">
                    {loadError}
                  </Typography>
                </Box>
              )}
            </List>
          )}
        </Paper>

        {totalPages > 1 && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Typography variant="caption" color="text.secondary">
              Showing {rangeStart}-{rangeEnd} of {total}
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
              disabled={isLoading}
            />
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
