import * as React from "react";
import type { Skill } from "../services/skillsService";
import { FILTER_ALL } from "../constants";
import { SAMPLE_SKILLS } from "../data/sampleSkills";
import { buildCategoryCounts, filterSkills, getCategoryOptions } from "../utils/skillsList";

type UseSkillsListResult = {
  skills: Skill[];
  filtered: Skill[];
  categories: string[];
  countsByCategory: Array<{ category: string; count: number }>;
  query: string;
  category: string;
  setQuery: (value: string) => void;
  clearQuery: () => void;
  setCategory: (value: string) => void;
};

export default function useSkillsList(data?: Skill[]): UseSkillsListResult {
  const skills = data ?? SAMPLE_SKILLS;
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState(FILTER_ALL);

  const categories = React.useMemo(() => getCategoryOptions(skills), [skills]);

  const filtered = React.useMemo(
    () => filterSkills(skills, { query, category }),
    [skills, query, category],
  );

  const countsByCategory = React.useMemo(
    () => buildCategoryCounts(filtered),
    [filtered],
  );

  const clearQuery = React.useCallback(() => setQuery(""), []);

  return {
    skills,
    filtered,
    categories,
    countsByCategory,
    query,
    category,
    setQuery,
    clearQuery,
    setCategory,
  };
}
