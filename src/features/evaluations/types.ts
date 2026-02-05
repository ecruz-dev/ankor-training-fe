import type {
  ScorecardTemplateRow,
  ScorecardCategory as DbScorecardCategory,
} from '../scorecards/services/scorecardService'

export type TeamOption = {
  id: string
  name: string
}

export type Athlete = {
  id: string
  full_name: string
  team_id: string
  position?: string | null
}

export type ScorecardTemplate = ScorecardTemplateRow
export type ScorecardCategory = DbScorecardCategory

export type ScorecardSubskill = {
  id: string
  category_id: string
  name: string
  description: string | null
  position: number
  rating_min: number
  rating_max: number
  created_at: string
  skill_id?: string | null
}

export type EvaluationsState = Record<string, Record<string, number | null>>

export type SubskillEvaluationsState = Record<
  string,
  Record<string, Record<string, number | null>>
>

export type PastEvaluationRow = {
  id: string
  athlete_id: string
  scorecard_template_name: string
  team_name?: string | null
  final_rating: number | null
  evaluated_at: string
}
