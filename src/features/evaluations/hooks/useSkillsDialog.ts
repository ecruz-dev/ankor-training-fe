import * as React from 'react'
import type {
  EvaluationsState,
  ScorecardCategory,
  ScorecardSubskill,
  SubskillEvaluationsState,
} from '../types'
import { listScorecardSubskillsByCategory } from '../../scorecards/services/scorecardService'

type UseSkillsDialogArgs = {
  activeCategories: ScorecardCategory[]
  subskillsByCategory: Record<string, ScorecardSubskill[]>
  setSubskillsByCategory: React.Dispatch<
    React.SetStateAction<Record<string, ScorecardSubskill[]>>
  >
  evaluations: EvaluationsState
  setEvaluations: React.Dispatch<React.SetStateAction<EvaluationsState>>
  subskillEvaluations: SubskillEvaluationsState
  setSubskillEvaluations: React.Dispatch<
    React.SetStateAction<SubskillEvaluationsState>
  >
  orgId: string | null
}

type UseSkillsDialogResult = {
  skillDialogOpen: boolean
  skillDialogCategory: ScorecardCategory | null
  skillDialogSkills: ScorecardSubskill[]
  localSubskillRatings: Record<string, number | null>
  openSkillsDialog: (athleteId: string, categoryId: string) => void
  closeSkillsDialog: () => void
  saveSkillsDialog: () => void
  handleSkillRatingChange: (skillId: string, rating: number | null) => void
}

const sortSkillsByPosition = (skills: ScorecardSubskill[]) =>
  [...skills].sort((a, b) => a.position - b.position)

const normalizeRating = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const numeric = Number(value)
  return Number.isNaN(numeric) ? null : numeric
}

const computeCategoryScore = ({
  subskills,
  overrides,
  baseline,
}: {
  subskills: ScorecardSubskill[]
  overrides: Record<string, number | null>
  baseline: number | null
}): number | null => {
  if (subskills.length === 0) return baseline

  const ratings: number[] = []

  subskills.forEach((skill) => {
    const key = skill.skill_id ?? skill.id
    const override = overrides[key]
    if (override !== null && override !== undefined) {
      const numeric = normalizeRating(override)
      if (numeric !== null) ratings.push(numeric)
      return
    }

    if (baseline !== null && baseline !== undefined) {
      ratings.push(baseline)
    }
  })

  if (ratings.length === 0) return null
  const total = ratings.reduce((sum, value) => sum + value, 0)
  return total / ratings.length
}

export function useSkillsDialog({
  activeCategories,
  subskillsByCategory,
  setSubskillsByCategory,
  evaluations,
  setEvaluations,
  subskillEvaluations,
  setSubskillEvaluations,
  orgId,
}: UseSkillsDialogArgs): UseSkillsDialogResult {
  const [skillDialogOpen, setSkillDialogOpen] = React.useState(false)
  const [skillDialogCategory, setSkillDialogCategory] =
    React.useState<ScorecardCategory | null>(null)
  const [skillDialogAthlete, setSkillDialogAthlete] =
    React.useState<string | null>(null)
  const [skillDialogSkills, setSkillDialogSkills] = React.useState<
    ScorecardSubskill[]
  >([])
  const [localSubskillRatings, setLocalSubskillRatings] = React.useState<
    Record<string, number | null>
  >({})

  const latestRequestRef = React.useRef(0)

  const loadSkillsForCategory = React.useCallback(
    async (categoryId: string) => {
      const cached = subskillsByCategory[categoryId]
      if (cached) return cached

      try {
        const skills = await listScorecardSubskillsByCategory({
          categoryId,
          orgId,
          limit: 200,
          offset: 0,
        })
        const normalized = (skills ?? []) as ScorecardSubskill[]
        setSubskillsByCategory((prev) => ({
          ...prev,
          [categoryId]: normalized,
        }))
        return normalized
      } catch (err) {
        console.error('listScorecardSubskillsByCategory error:', err)
        return [] as ScorecardSubskill[]
      }
    },
    [orgId, setSubskillsByCategory, subskillsByCategory],
  )

  const openSkillsDialog = React.useCallback(
    (athleteId: string, categoryId: string) => {
      const category = activeCategories.find((c) => c.id === categoryId) ?? null

      setSkillDialogAthlete(athleteId)
      setSkillDialogCategory(category)
      setSkillDialogOpen(true)

      const requestId = latestRequestRef.current + 1
      latestRequestRef.current = requestId

      void (async () => {
        const skills = await loadSkillsForCategory(categoryId)
        if (latestRequestRef.current !== requestId) return
        setSkillDialogSkills(sortSkillsByPosition(skills ?? []))
      })()
    },
    [activeCategories, loadSkillsForCategory],
  )

  const closeSkillsDialog = React.useCallback(() => {
    setSkillDialogOpen(false)
    setLocalSubskillRatings({})
  }, [])

  const saveSkillsDialog = React.useCallback(() => {
    if (skillDialogAthlete && skillDialogCategory) {
      setSubskillEvaluations((prev) => ({
        ...prev,
        [skillDialogAthlete]: {
          ...(prev[skillDialogAthlete] ?? {}),
          [skillDialogCategory.id]: localSubskillRatings,
        },
      }))

      const dialogCategoryId = skillDialogCategory.id
      const dialogSubskills =
        subskillsByCategory[dialogCategoryId] ??
        (skillDialogSkills.length > 0 ? skillDialogSkills : [])

      const baseline =
        normalizeRating(
          evaluations[skillDialogAthlete]?.[dialogCategoryId] ?? null,
        ) ?? null

      const updatedScore = computeCategoryScore({
        subskills: dialogSubskills,
        overrides: localSubskillRatings,
        baseline,
      })

      setEvaluations((prev) => ({
        ...prev,
        [skillDialogAthlete]: {
          ...(prev[skillDialogAthlete] ?? {}),
          [dialogCategoryId]: updatedScore,
        },
      }))
    }
    closeSkillsDialog()
  }, [
    closeSkillsDialog,
    evaluations,
    localSubskillRatings,
    setEvaluations,
    setSubskillEvaluations,
    skillDialogAthlete,
    skillDialogCategory,
    skillDialogSkills,
    subskillsByCategory,
  ])

  const handleSkillRatingChange = React.useCallback(
    (skillId: string, rating: number | null) => {
      setLocalSubskillRatings((prev) => {
        const next = { ...prev }
        if (rating === null) {
          delete next[skillId]
        } else {
          next[skillId] = rating
        }
        return next
      })
    },
    [],
  )

  React.useEffect(() => {
    if (!skillDialogOpen || !skillDialogAthlete || !skillDialogCategory) return
    const currentSubskills =
      subskillEvaluations[skillDialogAthlete]?.[skillDialogCategory.id] ?? {}
    setLocalSubskillRatings(currentSubskills)
  }, [
    skillDialogOpen,
    skillDialogAthlete,
    skillDialogCategory,
    subskillEvaluations,
  ])

  return {
    skillDialogOpen,
    skillDialogCategory,
    skillDialogSkills,
    localSubskillRatings,
    openSkillsDialog,
    closeSkillsDialog,
    saveSkillsDialog,
    handleSkillRatingChange,
  }
}
