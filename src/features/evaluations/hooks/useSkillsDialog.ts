import * as React from 'react'
import type {
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

export function useSkillsDialog({
  activeCategories,
  subskillsByCategory,
  setSubskillsByCategory,
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
    }
    closeSkillsDialog()
  }, [
    closeSkillsDialog,
    localSubskillRatings,
    setSubskillEvaluations,
    skillDialogAthlete,
    skillDialogCategory,
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
