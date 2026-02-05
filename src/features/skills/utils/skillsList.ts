import type { Skill } from "../services/skillsService";
import type { SkillCategoryCount, SkillFilters } from "../types";
import { FILTER_ALL } from "../constants";
import { normalizeText } from "./formatters";

export const getCategoryOptions = (skills: Skill[]) => {
  const unique = new Set<string>();
  skills.forEach((skill) => {
    if (skill.category) unique.add(skill.category);
  });
  return Array.from(unique).sort();
};

export const filterSkills = (skills: Skill[], filters: SkillFilters) => {
  const q = normalizeText(filters.query);

  return skills.filter((skill) => {
    const matchesQuery =
      !q ||
      normalizeText(skill.title).includes(q) ||
      normalizeText(skill.category).includes(q) ||
      normalizeText(skill.description).includes(q) ||
      normalizeText(
        Array.isArray(skill.coaching_points)
          ? skill.coaching_points.join(" ")
          : "",
      ).includes(q);

    const matchesCategory =
      filters.category === FILTER_ALL || skill.category === filters.category;

    return matchesQuery && matchesCategory;
  });
};

export const buildCategoryCounts = (
  skills: Skill[],
): SkillCategoryCount[] => {
  const map = new Map<string, number>();
  for (const skill of skills) {
    map.set(skill.category, (map.get(skill.category) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, count }));
};
