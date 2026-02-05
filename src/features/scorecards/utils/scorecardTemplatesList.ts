import type { ScorecardTemplateListRow } from "../types";

export const filterScorecardTemplates = (
  rows: ScorecardTemplateListRow[],
  searchText: string,
) => {
  const q = searchText.trim().toLowerCase();
  if (!q) return rows;

  return rows.filter((row) => {
    return (
      row.name.toLowerCase().includes(q) ||
      (row.description ?? "").toLowerCase().includes(q) ||
      (row.created_by ?? "").toLowerCase().includes(q)
    );
  });
};
