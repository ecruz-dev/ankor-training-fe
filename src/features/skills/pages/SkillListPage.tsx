import { Box, Stack, Paper, Typography, Pagination } from "@mui/material";
import SkillsCardGrid from "../components/list/SkillsCardGrid";
import SkillsFiltersPanel from "../components/list/SkillsFiltersPanel";
import SkillsListHeader from "../components/list/SkillsListHeader";
import { useNavigate } from "react-router-dom";
import SkillsPlayDialog from "../components/list/SkillsPlayDialog";
import useSkillsListPage from "../hooks/useSkillsListPage";
import { useAuth } from "../../../app/providers/AuthProvider";
import { isAdminRole } from "../../../shared/auth/roles";

export default function SkillListPage() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const {
    query,
    filters,
    skills,
    loading,
    loadError,
    page,
    totalCount,
    totalPages,
    categoryOptions,
    playState,
    setQuery,
    setPage,
    updateFilter,
    clearAll,
    openPlay,
    closePlay,
  } = useSkillsListPage();
  const canEdit = !authLoading && isAdminRole(profile?.role);

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5} sx={{ maxWidth: 1200, mx: "auto" }}>
        <SkillsListHeader
          totalCount={totalCount}
          onCreate={() => navigate("/skills/new")}
          onClear={clearAll}
        />

        {loadError && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography color="error" variant="body2">
              {loadError}
            </Typography>
          </Paper>
        )}

        {loading && skills.length === 0 && !loadError && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Loading skills...
            </Typography>
          </Paper>
        )}

        <SkillsFiltersPanel
          query={query}
          filters={filters}
          categoryOptions={categoryOptions}
          onQueryChange={setQuery}
          onCategoryChange={(value) => updateFilter("category", value)}
        />

        {!loading && skills.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6">No skills match your filters.</Typography>
            <Typography variant="body2" color="text.secondary">
              Try clearing filters or searching a different term.
            </Typography>
          </Paper>
        ) : (
          <SkillsCardGrid
            skills={skills}
            onOpenPlay={openPlay}
            onView={(skillId) => navigate(`/skills/${skillId}`)}
            onEdit={(skillId) => navigate(`/skills/${skillId}/edit`)}
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

      <SkillsPlayDialog
        open={playState.open}
        skillName={playState.skill?.title?.trim() || undefined}
        loading={playState.loading}
        error={playState.error}
        playUrl={playState.url}
        onClose={closePlay}
      />
    </Box>
  );
}
