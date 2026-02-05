// src/features/evaluations/api/types.ts

// ---------- List row for grid ----------

export type EvaluationListRow = {
  id: string
  org_id: string
  scorecard_template_id: string | null
  scorecard_template_name: string | null
  team_name: string | null
  coach_id: string | null
  notes: string | null
  created_at: string
}

// ---------- Payload for bulk create ----------

export type EvaluationItemInput = {
  /** subskill/skill id (mapped to evaluation_items.subskill_id in DB) */
  skill_id: string
  rating: number
  comments?: string | null
}

export type EvaluationInput = {
  org_id: string
  scorecard_template_id: string
  /** athlete receiving this evaluation (used in evaluation_items.athlete_id) */
  athlete_id: string
  /** team that this evaluation belongs to (maps to evaluations.teams_id) */
  team_id: string | null
  coach_id: string
  notes?: string | null
  evaluation_items: EvaluationItemInput[]
}

// ---------- Payload for bulk update ----------

export type EvaluationUpdateInput = EvaluationInput & {
  /** existing evaluation id to update */
  id: string
}

// ---------- Response types for bulk create / update ----------

export type EvaluationItemRecord = {
  id: string
  evaluation_id: string
  athlete_id: string
  subskill_id: string
  rating: number
  comment: string | null
  recommended_skill_id: string | null
  created_at: string
}

export type EvaluationRecord = {
  id: string
  org_id: string
  sport_id: string | null
  template_id: string | null
  teams_id: string | null
  coach_id: string | null
  notes: string | null
  created_at: string
  evaluation_items: EvaluationItemRecord[]
}

export type RpcBulkCreateEvaluationsResponse =
  | { ok: true; count: number; data: EvaluationRecord[] }
  | { ok: false; error: string }

// same shape for update; alias for clarity
export type RpcBulkUpdateEvaluationsResponse = RpcBulkCreateEvaluationsResponse

// ---------- List evaluations types ----------

export type EvaluationListItem = {
  id: string
  org_id: string
  coach_id: string | null
  notes: string | null
  created_at: string
  scorecard_template_id: string | null
  scorecard_template_name: string | null
  team_name: string | null
}

export type ListEvaluationsHttpPayload =
  | { data: EvaluationListItem[] | null; error: string | null }
  | EvaluationListItem[]

// ---------- Latest evaluations ----------

export type LatestEvaluationRow = {
  evaluation_id: string
  date: string
  scorecard_name: string
  coach_name: string
  athlete_id: string
  athlete_full_name: string
  athletes_name?: string | null
}

export type LatestEvaluationsResponse =
  | { ok: true; count: number; data: LatestEvaluationRow[] }
  | { ok: false; error: string }

// ---------- Improvement skills ----------

export type EvaluationImprovementSkillRow = {
  evaluation_id: string
  skill_id: string
  skill_name: string
  rating: number | null
}

export type EvaluationImprovementSkillsResponse =
  | { ok: true; count: number; data: EvaluationImprovementSkillRow[] }
  | { ok: false; error: string }

// ---------- Skill videos ----------

export type EvaluationSkillVideoRow = {
  evaluation_id: string
  skill_id: string
  title: string
  object_path: string
  rating: number | null
}

export type EvaluationSkillVideosResponse =
  | { ok: true; count: number; data: EvaluationSkillVideoRow[] }
  | { ok: false; error: string }

// ---------- Subskill ratings ----------

export type EvaluationSubskillRatingItem = {
  id: string
  name: string
  score: number | null
}

export type EvaluationSubskillRatingsCategory = {
  id: string
  name: string
  subskills: EvaluationSubskillRatingItem[]
}

export type EvaluationSubskillRatingsResponse =
  | { ok: true; count: number; data: EvaluationSubskillRatingsCategory[] }
  | { ok: false; error: string }

// ---------- Workout progress ----------

export type EvaluationWorkoutProgressRow = {
  id: string
  org_id: string
  evaluation_id: string
  athlete_id: string
  progress: number | null
  level: number | null
  maxWorkoutReps: number | null
}

export type EvaluationWorkoutProgressResponse =
  | { ok: true; count: number; data: EvaluationWorkoutProgressRow[] }
  | { ok: false; error: string }

export type EvaluationWorkoutProgressUpdateResponse =
  | { ok: true; data: EvaluationWorkoutProgressRow }
  | { ok: false; error: string }

// ---------- Workout drills ----------

export type EvaluationWorkoutDrillItem = {
  id: string
  title: string
  duration: string | number | null
  thumbnailUrl: string | null
}

export type EvaluationWorkoutDrillLevel = {
  level: number | null
  title: string | null
  targetReps: number | null
  drills: EvaluationWorkoutDrillItem[]
}

export type EvaluationWorkoutDrillsResponse =
  | { ok: true; count: number; data: EvaluationWorkoutDrillLevel[] }
  | { ok: false; error: string }

// ---------- Evaluation detail ----------

export type EvaluationDetailItem = {
  id: string
  evaluation_id: string
  athlete_id: string
  athlete_first_name: string | null
  athlete_last_name: string | null
  subskill_id: string
  rating: number | null
  comment: string | null
  created_at: string
}

export type EvaluationDetailAthlete = {
  id: string
  first_name: string | null
  last_name: string | null
}

export type EvaluationDetailCategory = {
  id: string
  template_id: string
  name: string
  description: string | null
  position: number | null
}

export type EvaluationDetailRow = {
  id: string
  org_id: string
  template_id: string | null
  template_name: string | null
  coach_id: string | null
  teams_id: string | null
  team_name: string | null
  notes: string | null
  created_at: string
  evaluation_items: EvaluationDetailItem[]
  athletes: EvaluationDetailAthlete[]
  categories: EvaluationDetailCategory[]
}

// ---------- Matrix update ops ----------

export type EvaluationMatrixUpsertRatingOp = {
  type: 'upsert_rating'
  athlete_id: string
  subskill_id: string
  /**
   * If rating is null, backend deletes the evaluation_item for this
   * (evaluation, athlete, subskill). Otherwise it upserts.
   */
  rating: number | null
  comments?: string | null
}

export type EvaluationMatrixRemoveAthleteOp = {
  type: 'remove_athlete'
  athlete_id: string
}

export type EvaluationMatrixOperation =
  | EvaluationMatrixUpsertRatingOp
  | EvaluationMatrixRemoveAthleteOp

export type EvaluationMatrixUpdatePayload = {
  operations: EvaluationMatrixOperation[]

  // Optional header updates (backend supports them)
  org_id?: string
  template_id?: string
  team_id?: string | null
  coach_id?: string
  notes?: string | null
}

// ---------- Submit evaluation ----------

export type SubmitEvaluationResponse =
  | { ok: true; evaluation?: unknown; data?: unknown; message?: string }
  | { ok: false; error: string }
