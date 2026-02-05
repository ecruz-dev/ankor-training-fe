import { Box, Stack, Paper, Typography, Pagination } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { isAdminRole } from "../../../shared/auth/roles";
import DrillsCardGrid from "../components/list/DrillsCardGrid";
import DrillsFiltersPanel from "../components/list/DrillsFiltersPanel";
import DrillsListHeader from "../components/list/DrillsListHeader";
import DrillsPlayDialog from "../components/list/DrillsPlayDialog";
import { LEVEL_OPTIONS } from "../constants";
import useDrillsList from "../hooks/useDrillsList";

export default function DrillsPage() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const {
    query,
    filters,
    drills,
    loading,
    loadError,
    page,
    totalCount,
    totalPages,
    segmentOptions,
    segmentsLoading,
    segmentsError,
    tagOptions,
    tagsLoading,
    tagsError,
    tagLabelById,
    playState,
    setQuery,
    setPage,
    updateFilterField,
    toggleTag,
    toggleLevel,
    clearAll,
    openPlay,
    closePlay,
  } = useDrillsList();
  const canEdit = !authLoading && isAdminRole(profile?.role);

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5} sx={{ maxWidth: 1200, mx: "auto" }}>
        <DrillsListHeader
          totalCount={totalCount}
          onCreate={() => navigate("/drills/new")}
          onClear={clearAll}
        />

        {loadError && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography color="error" variant="body2">
              {loadError}
            </Typography>
          </Paper>
        )}

        {loading && drills.length === 0 && !loadError && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Loading drills...
            </Typography>
          </Paper>
        )}

        <DrillsFiltersPanel
          query={query}
          filters={filters}
          segmentOptions={segmentOptions}
          segmentsLoading={segmentsLoading}
          segmentsError={segmentsError}
          tagOptions={tagOptions}
          tagsLoading={tagsLoading}
          tagsError={tagsError}
          levelOptions={LEVEL_OPTIONS}
          onQueryChange={setQuery}
          onFilterChange={updateFilterField}
          onToggleTag={toggleTag}
          onToggleLevel={toggleLevel}
        />

        {!loading && drills.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6">No drills match your filters.</Typography>
            <Typography variant="body2" color="text.secondary">
              Try clearing filters or searching a different term.
            </Typography>
          </Paper>
        ) : (
          <DrillsCardGrid
            drills={drills}
            tagLabelById={tagLabelById}
            onOpenPlay={openPlay}
            onView={(drillId) => navigate(`/drills/${drillId}`)}
            onEdit={(drillId) => navigate(`/drills/${drillId}/edit`)}
            canEdit={canEdit}
          />
        )}

        {totalPages > 1 && (
          <Stack alignItems="center" sx={{ pt: 1 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
              disabled={loading}
            />
          </Stack>
        )}
      </Stack>

      <DrillsPlayDialog
        open={playState.open}
        drillName={playState.drill?.name}
        loading={playState.loading}
        error={playState.error}
        playUrl={playState.url}
        onClose={closePlay}
      />
    </Box>
  );
}
