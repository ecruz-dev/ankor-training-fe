import { Box, Divider, Stack } from "@mui/material";
import SkillsEmptyState from "../components/list/SkillsEmptyState";
import SkillsFilters from "../components/list/SkillsFilters";
import SkillsGrid from "../components/list/SkillsGrid";
import SkillsListHeader from "../components/list/SkillsListHeader";
import SkillsStats from "../components/list/SkillsStats";
import useSkillsList from "../hooks/useSkillsList";
import type { Skill } from "../services/skillsService";

type SkillsPageProps = {
  data?: Skill[];
};

export default function SkillsPage({ data }: SkillsPageProps) {
  const {
    filtered,
    countsByCategory,
    query,
    category,
    categories,
    setQuery,
    clearQuery,
    setCategory,
  } = useSkillsList(data);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <SkillsListHeader />
        <SkillsFilters
          query={query}
          category={category}
          categories={categories}
          onQueryChange={setQuery}
          onClearQuery={clearQuery}
          onCategoryChange={setCategory}
        />
      </Stack>

      <SkillsStats total={filtered.length} countsByCategory={countsByCategory} />

      <Divider sx={{ mb: 2 }} />

      {filtered.length === 0 ? (
        <SkillsEmptyState />
      ) : (
        <SkillsGrid skills={filtered} />
      )}
    </Box>
  );
}
