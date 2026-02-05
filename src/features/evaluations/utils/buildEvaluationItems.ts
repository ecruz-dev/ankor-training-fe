import type { EvaluationItemInput } from '../api/evaluationsApi'
import type {
  Athlete,
  EvaluationsState,
  ScorecardSubskill,
  SubskillEvaluationsState,
} from '../types'

type BuildEvaluationItemsArgs = {
  athletes: Athlete[]
  evaluations: EvaluationsState
  subskillEvaluations: SubskillEvaluationsState
  subskillsByCategory: Record<string, ScorecardSubskill[]>
}

function normalizeRating(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return null
  return numeric
}

export function buildEvaluationItems({
  athletes,
  evaluations,
  subskillEvaluations,
  subskillsByCategory,
}: BuildEvaluationItemsArgs): EvaluationItemInput[] {
  const items: EvaluationItemInput[] = []

  athletes.forEach((athlete) => {
    const athleteId = athlete.id
    const categoryScoresForAthlete = evaluations[athleteId] || {}
    const subskillScoresForAthlete = subskillEvaluations[athleteId] || {}

    for (const [categoryId, rawCatScore] of Object.entries(
      categoryScoresForAthlete,
    )) {
      const catScore = normalizeRating(rawCatScore)
      if (catScore === null) continue

      const subskills = subskillsByCategory[categoryId] || []
      const subskillRatingsForCategory = subskillScoresForAthlete[categoryId] || {}

      subskills.forEach((sub) => {
        const subskillKey = sub.skill_id ?? sub.id
        const explicitSubRating =
          subskillRatingsForCategory[subskillKey] ??
          subskillRatingsForCategory[sub.id]
        const rawRating =
          explicitSubRating !== undefined ? explicitSubRating : catScore
        const rating = normalizeRating(rawRating)
        if (rating === null) return

        items.push({
          athlete_id: athleteId,
          skill_id: sub.skill_id ?? sub.id,
          rating,
          comments: null,
        })
      })
    }

    for (const [categoryId, subskillsRatings] of Object.entries(
      subskillScoresForAthlete,
    )) {
      if (categoryScoresForAthlete[categoryId] !== undefined) continue

      const subskills = subskillsByCategory[categoryId] || []
      const subskillRatings = subskillsRatings as Record<string, number | null>

      subskills.forEach((sub) => {
        const subskillKey = sub.skill_id ?? sub.id
        const rating = normalizeRating(
          subskillRatings[subskillKey] ?? subskillRatings[sub.id],
        )
        if (rating === null) return

        items.push({
          athlete_id: athleteId,
          skill_id: sub.skill_id ?? sub.id,
          rating,
          comments: null,
        })
      })
    }
  })

  return items
}
