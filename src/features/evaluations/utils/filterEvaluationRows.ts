import type { EvaluationListRow } from '../api/evaluationsApi'

export function filterEvaluationRows(
  rows: EvaluationListRow[],
  search: string,
): EvaluationListRow[] {
  if (!search.trim()) return rows
  const term = search.toLowerCase()

  return rows.filter((row) => {
    return (
      row.team_name?.toLowerCase().includes(term) ||
      row.scorecard_template_name?.toLowerCase().includes(term) ||
      row.notes?.toLowerCase().includes(term) ||
      String((row as any).status ?? '').toLowerCase().includes(term) ||
      row.id.toLowerCase().includes(term)
    )
  })
}
