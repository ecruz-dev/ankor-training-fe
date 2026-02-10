// src/pages/NewEvaluationDetailPage.tsx

import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Stack, Typography, useMediaQuery } from '@mui/material'
import type { GridColDef } from '@mui/x-data-grid'
import { useTheme } from '@mui/material/styles'
import { POSITION_OPTIONS } from '../constants'
import { useAuth } from '../../../app/providers/AuthProvider'
import EvaluationBulkActionsDialog from '../components/EvaluationBulkActionsDialog'
import EvaluationSubskillsDialog from '../components/EvaluationSubskillsDialog'
import NewEvaluationActions from '../components/NewEvaluationActions'
import NewEvaluationDesktopPanel from '../components/NewEvaluationDesktopPanel'
import NewEvaluationFilters from '../components/NewEvaluationFilters'
import NewEvaluationMobilePanel from '../components/NewEvaluationMobilePanel'
import { useEvaluationLookups } from '../hooks/useEvaluationLookups'
import { usePastEvaluations } from '../hooks/usePastEvaluations'
import { useSkillsDialog } from '../hooks/useSkillsDialog'
import { buildEvaluationItems } from '../utils/buildEvaluationItems'
import { mapTeamAthletesToAthletes } from '../utils/mapTeamAthletes'
import type {
  Athlete,
  EvaluationsState,
  ScorecardCategory,
  ScorecardSubskill,
  SubskillEvaluationsState,
} from '../types'

// Services
import {
  listScorecardCategoriesByTemplate,
  listScorecardSubskillsByCategory,
} from '../../scorecards/services/scorecardService'
import { getAthletesByTeam } from '../../teams/services/teamsService'
import { rpcBulkCreateEvaluations } from '../api/evaluationsApi'

// ---------- Component ----------

const pruneEvaluationsForAthletes = (
  prev: EvaluationsState,
  nextAthletes: Athlete[],
): EvaluationsState => {
  const next: EvaluationsState = {}
  nextAthletes.forEach((athlete) => {
    const athleteScores = prev[athlete.id]
    if (athleteScores) next[athlete.id] = athleteScores
  })
  return next
}

const pruneSubskillEvaluationsForAthletes = (
  prev: SubskillEvaluationsState,
  nextAthletes: Athlete[],
): SubskillEvaluationsState => {
  const next: SubskillEvaluationsState = {}
  nextAthletes.forEach((athlete) => {
    const athleteScores = prev[athlete.id]
    if (athleteScores) next[athlete.id] = athleteScores
  })
  return next
}

export default function NewEvaluationDetailPage() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { profile, coachId } = useAuth()
  const orgId = profile?.default_org_id?.trim() || null

  const { scorecards, teams } = useEvaluationLookups(orgId)

  // Data from backend
  const [categoriesByTemplate, setCategoriesByTemplate] = React.useState(
    {} as Record<string, ScorecardCategory[]>,
  )
  const [athletes, setAthletes] = React.useState<Athlete[]>([])
  const [allTeamAthletes, setAllTeamAthletes] = React.useState<Athlete[]>([])
  const [subskillsByCategory, setSubskillsByCategory] = React.useState(
    {} as Record<string, ScorecardSubskill[]>,
  )

  // UI selections
  const [selectedScorecardId, setSelectedScorecardId] =
    React.useState<string>('')
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>('')
  const [selectedAthletes, setSelectedAthletes] = React.useState<Athlete[]>([])
  const [selectedPosition, setSelectedPosition] = React.useState<string>('')

  // Athlete whose past evaluations are shown in the split view
  const [activeAthleteId, setActiveAthleteId] = React.useState<string | null>(
    null,
  )

  
  // Controls visibility of split view
  const [showPastPanel, setShowPastPanel] = React.useState(false)
  const [activeCategoryIndex, setActiveCategoryIndex] = React.useState(0)

  // Evaluations
  const [evaluations, setEvaluations] = React.useState<EvaluationsState>({})
  const [subskillEvaluations, setSubskillEvaluations] =
    React.useState<SubskillEvaluationsState>({})

  // Mobile-only: expanded/collapsed subskills per category
  const [expandedSubskillsByCategory, setExpandedSubskillsByCategory] =
    React.useState<Record<string, boolean>>({})

  // Save state
  const [saving, setSaving] = React.useState(false)

  // Bulk actions dialog state
  const [bulkDialogOpen, setBulkDialogOpen] = React.useState(false)
  const [bulkValue, setBulkValue] = React.useState<number | ''>('')
  const [bulkSelectedAthleteIds, setBulkSelectedAthleteIds] = React.useState<
    string[]
  >([])
  const [bulkCategoryIds, setBulkCategoryIds] = React.useState<string[]>([])

  const { rows: pastEvaluations, loading: loadingPast, error: pastError } =
    usePastEvaluations({
      orgId,
      athleteId: activeAthleteId,
      enabled: showPastPanel,
      limit: 10,
    })

  const resetEvaluationState = React.useCallback(() => {
    setEvaluations({})
    setSubskillEvaluations({})
  }, [])

  const handleSelectedAthletesChange = React.useCallback(
    (_: React.SyntheticEvent, newValue: Athlete[]) => {
      setSelectedAthletes(newValue)
      setEvaluations((prev) => pruneEvaluationsForAthletes(prev, newValue))
      setSubskillEvaluations((prev) =>
        pruneSubskillEvaluationsForAthletes(prev, newValue),
      )
    },
    [],
  )

  const handleTogglePastPanel = React.useCallback(() => {
    setShowPastPanel((prev) => !prev)
  }, [])

  // Keep activeAthleteId in sync with selectedAthletes
  React.useEffect(() => {
    if (selectedAthletes.length === 0) {
      setActiveAthleteId(null)
      return
    }

    setActiveAthleteId((prev) => {
      if (prev && selectedAthletes.some((a) => a.id === prev)) return prev
      return selectedAthletes[0].id
    })
  }, [selectedAthletes])

  // ---------- Derived data ----------

  const activeCategories: ScorecardCategory[] = React.useMemo(
    () =>
      selectedScorecardId ? categoriesByTemplate[selectedScorecardId] ?? [] : [],
    [categoriesByTemplate, selectedScorecardId],
  )

  const {
    skillDialogOpen,
    skillDialogCategory,
    skillDialogSkills,
    localSubskillRatings,
    openSkillsDialog,
    closeSkillsDialog,
    saveSkillsDialog,
    handleSkillRatingChange,
  } = useSkillsDialog({
    activeCategories,
    subskillsByCategory,
    setSubskillsByCategory,
    evaluations,
    setEvaluations,
    subskillEvaluations,
    setSubskillEvaluations,
    orgId,
  })

  const hasScorecardSelected = Boolean(selectedScorecardId)
  const hasSelectedAthletes = selectedAthletes.length > 0
  const hasActiveCategories = activeCategories.length > 0
  const canRenderMatrix = hasScorecardSelected && hasSelectedAthletes
  const hasEvaluationContext = canRenderMatrix && hasActiveCategories
  const isPositionFilterDisabled = allTeamAthletes.length === 0

  React.useEffect(() => {
    if (activeCategories.length === 0) {
      setActiveCategoryIndex(0)
      return
    }
    setActiveCategoryIndex((prev) =>
      Math.min(prev, activeCategories.length - 1),
    )
  }, [activeCategories])

  const skipMobileCategoryResetRef = React.useRef(false)

  const moveToNextAthlete = React.useCallback(() => {
    if (!activeAthleteId) return
    let idx = selectedAthletes.findIndex((a) => a.id === activeAthleteId)
    if (idx < 0) return
    idx = idx + 1;
    const next = selectedAthletes[idx % selectedAthletes.length]
    console.log(`IDX = ${idx}`)
    if (!next) return
    skipMobileCategoryResetRef.current = true
    setActiveAthleteId(next.id)
  }, [activeAthleteId, selectedAthletes])

  React.useEffect(() => {
    if (!isMobile) return
    if (skipMobileCategoryResetRef.current) {
      skipMobileCategoryResetRef.current = false
      return
    }
    setActiveCategoryIndex(0)
  }, [activeAthleteId, isMobile])

  // ---------- Columns + Rows ----------

  const columns: GridColDef[] = React.useMemo(() => {
    const baseColumns: GridColDef[] = [
      { field: 'categoryName', headerName: 'Category', flex: 1.4, sortable: false },
    ]

    const athleteColumns: GridColDef[] = selectedAthletes.map((athlete) => ({
      field: athlete.id,
      headerName: athlete.full_name,
      flex: 1,
      sortable: false,
      editable: true,
      type: 'number',
      valueParser: (value) => {
        const num = Number(value)
        return Number.isNaN(num) ? null : num
      },
    }))

    return [...baseColumns, ...athleteColumns]
  }, [selectedAthletes])

  const rows = React.useMemo(
    () =>
      activeCategories.map((cat) => {
        const scoresByAthlete = selectedAthletes.reduce<Record<string, number | null>>(
          (acc, athlete) => {
            const evalForAthlete = evaluations[athlete.id] ?? {}
            acc[athlete.id] = evalForAthlete[cat.id] ?? null
            return acc
          },
          {},
        )

        return { id: cat.id, categoryName: cat.name, ...scoresByAthlete }
      }),
    [activeCategories, selectedAthletes, evaluations],
  )

  const totalCategories = activeCategories.length
  const currentCategory =
    totalCategories > 0
      ? activeCategories[Math.min(activeCategoryIndex, totalCategories - 1)]
      : null

  const currentSubskills =
    currentCategory != null ? subskillsByCategory[currentCategory.id] : undefined

  const hasNextCategory = activeCategoryIndex < totalCategories - 1
  const hasPreviousCategory = activeCategoryIndex > 0

  // Mobile helper: lazy-load subskills only when needed
  const ensureMobileSubskillsLoaded = React.useCallback(
    async (categoryId: string) => {
      if (!isMobile) return
      if (subskillsByCategory[categoryId] !== undefined) return

      try {
        const skills = await listScorecardSubskillsByCategory({
          categoryId,
          orgId,
          limit: 200,
          offset: 0,
        })

        setSubskillsByCategory((prev) => ({
          ...prev,
          [categoryId]: (skills ?? []) as ScorecardSubskill[],
        }))
      } catch (err) {
        console.error('Failed to lazy-load subskills (mobile)', err)
        setSubskillsByCategory((prev) => ({ ...prev, [categoryId]: [] }))
      }
    },
    [isMobile, subskillsByCategory, orgId],
  )

  const setMobileCategoryScoreAndRollout = React.useCallback(
    (athleteId: string, categoryId: string, score: number | null) => {
      setEvaluations((prev) => ({
        ...prev,
        [athleteId]: { ...(prev[athleteId] ?? {}), [categoryId]: score },
      }))

      setSubskillEvaluations((prev) => {
        const prevForAthlete = prev[athleteId] ?? {}
        const { [categoryId]: _removed, ...restCats } = prevForAthlete
        return { ...prev, [athleteId]: restCats }
      })
    },
    [],
  )

  const handleMobileSubskillRatingChange = React.useCallback(
    (
      athleteId: string,
      categoryId: string,
      subskillId: string,
      rating: number | null,
    ) => {
      const baseline = evaluations[athleteId]?.[categoryId] ?? null

      setSubskillEvaluations((prev) => {
        const prevForAthlete = prev[athleteId] ?? {}
        const prevForCat = prevForAthlete[categoryId] ?? {}
        const nextForCat: Record<string, number | null> = { ...prevForCat }

        if (rating == null) {
          delete nextForCat[subskillId]
        } else if (baseline != null && Number(rating) === Number(baseline)) {
          delete nextForCat[subskillId]
        } else {
          nextForCat[subskillId] = rating
        }

        const nextForAthlete: Record<string, Record<string, number | null>> = {
          ...prevForAthlete,
        }

        if (Object.keys(nextForCat).length === 0) {
          delete nextForAthlete[categoryId]
        } else {
          nextForAthlete[categoryId] = nextForCat
        }

        return { ...prev, [athleteId]: nextForAthlete }
      })
    },
    [evaluations],
  )

  const mobileExpanded =
    currentCategory ? !!expandedSubskillsByCategory[currentCategory.id] : false

  const mobileCategoryScore =
    activeAthleteId && currentCategory
      ? evaluations[activeAthleteId]?.[currentCategory.id] ?? null
      : null
  const mobileSaveDisabled = !activeAthleteId || !hasEvaluationContext

  const currentSubskillRatings = React.useMemo(() => {
    if (!activeAthleteId || !currentCategory) return {}
    return subskillEvaluations[activeAthleteId]?.[currentCategory.id] ?? {}
  }, [activeAthleteId, currentCategory, subskillEvaluations])

  const handleMobileCategoryScoreChange = React.useCallback(
    (newValue: number | null) => {
      if (!activeAthleteId || !currentCategory) return
      void ensureMobileSubskillsLoaded(currentCategory.id)

      setMobileCategoryScoreAndRollout(activeAthleteId, currentCategory.id, newValue)

      if (newValue !== null) moveToNextAthlete()
    },
    [
      activeAthleteId,
      currentCategory,
      ensureMobileSubskillsLoaded,
      moveToNextAthlete,
      setMobileCategoryScoreAndRollout,
    ],
  )

  const handleToggleMobileSubskills = React.useCallback(() => {
    if (!currentCategory) return
    const nextExpanded = !mobileExpanded
    setExpandedSubskillsByCategory((prev) => ({
      ...prev,
      [currentCategory.id]: nextExpanded,
    }))
    if (nextExpanded) void ensureMobileSubskillsLoaded(currentCategory.id)
  }, [currentCategory, ensureMobileSubskillsLoaded, mobileExpanded])

  const handleMobileSubskillChange = React.useCallback(
    (subskillId: string, rating: number | null) => {
      if (!activeAthleteId || !currentCategory) return
      handleMobileSubskillRatingChange(
        activeAthleteId,
        currentCategory.id,
        subskillId,
        rating,
      )
    },
    [activeAthleteId, currentCategory, handleMobileSubskillRatingChange],
  )

  const handlePreviousCategory = React.useCallback(() => {
    setActiveCategoryIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  const handleNextCategory = React.useCallback(() => {
    setActiveCategoryIndex((prev) => Math.min(prev + 1, totalCategories - 1))
    if (hasNextCategory) moveToNextAthlete()
  }, [hasNextCategory, moveToNextAthlete, totalCategories])

  React.useEffect(() => {
    if (!isMobile || !currentCategory) return
    if (!expandedSubskillsByCategory[currentCategory.id]) return
    void ensureMobileSubskillsLoaded(currentCategory.id)
  }, [
    isMobile,
    currentCategory?.id,
    expandedSubskillsByCategory,
    ensureMobileSubskillsLoaded,
  ])

  const processRowUpdate = React.useCallback(
    (newRow: any, oldRow: any) => {
      let changedField: string | null = null
      let newValue: number | null = null
      for (const key in newRow) {
        if (newRow[key] !== oldRow[key]) {
          changedField = key
          newValue = newRow[key]
          break
        }
      }

      if (!changedField) return newRow

      const athlete = selectedAthletes.find((a) => a.id === changedField)
      if (!athlete) return newRow

      const categoryId = String(newRow.id)
      const athleteId = athlete.id

      setEvaluations((prev) => ({
        ...prev,
        [athleteId]: { ...(prev[athleteId] ?? {}), [categoryId]: newValue },
      }))

      if (newValue !== null && newValue < 3) {
        openSkillsDialog(athleteId, categoryId)
      }

      return newRow
    },
    [selectedAthletes, openSkillsDialog],
  )

  // ---------- Bulk actions ----------

  const handleOpenBulkDialog = React.useCallback(
    (_athleteField: string) => {
      setBulkDialogOpen(true)
      setBulkValue('')
      setBulkSelectedAthleteIds(selectedAthletes.map((a) => a.id))
      setBulkCategoryIds(activeCategories.map((cat) => cat.id))
    },
    [selectedAthletes, activeCategories],
  )

  const handleToggleBulkAthlete = (athleteId: string) => {
    setBulkSelectedAthleteIds((prev) =>
      prev.includes(athleteId)
        ? prev.filter((id) => id !== athleteId)
        : [...prev, athleteId],
    )
  }

  const handleBulkSelectAll = () => {
    setBulkSelectedAthleteIds(selectedAthletes.map((a) => a.id))
  }

  const handleBulkClearAll = () => {
    setBulkSelectedAthleteIds([])
  }

  const handleApplyBulkEvaluation = () => {
    if (
      bulkValue === '' ||
      bulkSelectedAthleteIds.length === 0 ||
      bulkCategoryIds.length === 0
    ) {
      setBulkDialogOpen(false)
      return
    }

    const numericValue = Number(bulkValue)
    if (Number.isNaN(numericValue)) return

    setEvaluations((prev) => {
      const next: EvaluationsState = { ...prev }

      bulkSelectedAthleteIds.forEach((athleteId) => {
        const prevForAthlete = next[athleteId] ?? {}
        const updatedForAthlete: Record<string, number | null> = {
          ...prevForAthlete,
        }

        bulkCategoryIds.forEach((categoryId) => {
          updatedForAthlete[categoryId] = numericValue
        })

        next[athleteId] = updatedForAthlete
      })

      return next
    })

    setBulkDialogOpen(false)
    setBulkCategoryIds([])
  }


  const loadCategoriesAndSubskills = React.useCallback(
    async (scorecardId: string) => {
      try {
        let categories = categoriesByTemplate[scorecardId]

        if (!categories) {
          const fetchedCategories = await listScorecardCategoriesByTemplate({
            scorecardTemplateId: scorecardId,
            orgId,
            limit: 200,
            offset: 0,
          })

          categories = (fetchedCategories ?? []) as ScorecardCategory[]

          setCategoriesByTemplate((prev) => ({
            ...prev,
            [scorecardId]: categories!,
          }))
        }

        if (!categories || categories.length === 0) return

        const toFetch = categories.filter((cat) => !subskillsByCategory[cat.id])
        if (toFetch.length === 0) return

        const results = await Promise.allSettled(
          toFetch.map((cat) =>
            listScorecardSubskillsByCategory({
              categoryId: cat.id,
              orgId,
              limit: 200,
              offset: 0,
            }).then((subskills) => ({
              categoryId: cat.id,
              subskills: subskills ?? [],
            })),
          ),
        )

        setSubskillsByCategory((prev) => {
          const next = { ...prev }
          for (const r of results) {
            if (r.status === 'fulfilled') {
              const { categoryId, subskills } = r.value
              next[categoryId] = subskills as ScorecardSubskill[]
            }
          }
          return next
        })
      } catch (err) {
        console.error('Failed to load scorecard categories/subskills', err)
      }
    },
    [categoriesByTemplate, subskillsByCategory, orgId],
  )

  const loadTeamAthletes = React.useCallback(
    async (teamId: string) => {
      try {
        const athletesResponse = await getAthletesByTeam(teamId, { orgId })
        const mapped = mapTeamAthletesToAthletes(athletesResponse ?? [])

        setAllTeamAthletes(mapped)
        setAthletes(mapped)
        setSelectedAthletes(mapped)
      } catch (err) {
        console.error('Failed to load athletes for team', err)
        setAllTeamAthletes([])
        setAthletes([])
        setSelectedAthletes([])
      }
    },
    [orgId],
  )

  const handleScorecardChange = React.useCallback(
    (newId: string) => {
      setSelectedScorecardId(newId)
      resetEvaluationState()

      if (!newId) return
      void loadCategoriesAndSubskills(newId)
    },
    [loadCategoriesAndSubskills, resetEvaluationState],
  )

  const handleTeamChange = React.useCallback(
    (teamId: string) => {
      setSelectedTeamId(teamId)
      resetEvaluationState()
      setSelectedPosition('')
      setAllTeamAthletes([])

      if (!teamId) {
        setAthletes([])
        setSelectedAthletes([])
        return
      }

      void loadTeamAthletes(teamId)
    },
    [loadTeamAthletes, resetEvaluationState],
  )

  const handlePositionChange = React.useCallback(
    (positionValue: string) => {
      setSelectedPosition(positionValue)
      resetEvaluationState()

      if (!positionValue) {
        setAthletes(allTeamAthletes)
        setSelectedAthletes(allTeamAthletes)
        return
      }

      const filtered = allTeamAthletes.filter(
        (a) =>
          a.position && a.position.toLowerCase() === positionValue.toLowerCase(),
      )

      setAthletes(filtered)
      setSelectedAthletes(filtered)
    },
    [allTeamAthletes, resetEvaluationState],
  )

  // ---------- Save (same behavior) ----------

  const handleSaveEvaluations = async () => {
    if (!hasEvaluationContext) {
      console.warn('Nothing to save: missing scorecard, athletes, or categories')
      return
    }

    if (!orgId) {
      console.warn('Missing org_id from profile.')
      return
    }
    if (!coachId) {
      console.warn('Missing coach id from profile.')
      return
    }

    try {
      setSaving(true)

      const evaluationItems = buildEvaluationItems({
        athletes: selectedAthletes,
        evaluations,
        subskillEvaluations,
        subskillsByCategory,
      })

      if (evaluationItems.length === 0) {
        console.warn('Nothing to save: no changed cells to persist')
        return
      }

      const payload = {
        evaluations: [
          {
            org_id: orgId,
            scorecard_template_id: selectedScorecardId,
            team_id: selectedTeamId || null,
            coach_id: coachId,
            notes: null,
            evaluation_items: evaluationItems,
          },
        ],
      }

      const result = await rpcBulkCreateEvaluations(payload as any, { orgId })

      if (!result.ok) {
        console.error('Bulk create evaluations failed:', result.error)
      } else {
       const newEvaluationId = result.data?.[0]?.id

      if (newEvaluationId) {      
        navigate(`/evaluations/${newEvaluationId}/edit`, { replace: true })
      } else {
        console.warn('Saved but could not find created evaluation id in result:', result)
      }

      }
    } catch (err) {
      console.error('Failed to save evaluations', err)
    } finally {
      setSaving(false)
    }
  }

  // ---------- UI ----------

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h5" fontWeight={700}>
          New evaluation
        </Typography>

        <NewEvaluationFilters
          scorecards={scorecards}
          teams={teams}
          athletes={athletes}
          selectedScorecardId={selectedScorecardId}
          selectedTeamId={selectedTeamId}
          selectedPosition={selectedPosition}
          selectedAthletes={selectedAthletes}
          positionOptions={POSITION_OPTIONS}
          isPositionDisabled={isPositionFilterDisabled}
          onScorecardChange={handleScorecardChange}
          onTeamChange={handleTeamChange}
          onPositionChange={handlePositionChange}
          onAthletesChange={handleSelectedAthletesChange}
        />

        <NewEvaluationActions
          showPastPanel={showPastPanel}
          onTogglePastPanel={handleTogglePastPanel}
          disablePastPanelToggle={!hasSelectedAthletes}
          onSave={handleSaveEvaluations}
          saving={saving}
          disableSave={!hasEvaluationContext}
        />

        {isMobile ? (
          <NewEvaluationMobilePanel
            isReady={hasEvaluationContext}
            selectedAthletes={selectedAthletes}
            activeAthleteId={activeAthleteId}
            onAthleteChange={setActiveAthleteId}
            currentCategory={currentCategory}
            activeCategoryIndex={activeCategoryIndex}
            totalCategories={totalCategories}
            mobileCategoryScore={mobileCategoryScore}
            onCategoryScoreChange={handleMobileCategoryScoreChange}
            subskillsExpanded={mobileExpanded}
            onToggleSubskills={handleToggleMobileSubskills}
            currentSubskills={currentSubskills}
            subskillRatings={currentSubskillRatings}
            onSubskillRatingChange={handleMobileSubskillChange}
            hasPreviousCategory={hasPreviousCategory}
            hasNextCategory={hasNextCategory}
            onPreviousCategory={handlePreviousCategory}
            onNextCategory={handleNextCategory}
            onSave={handleSaveEvaluations}
            saving={saving}
            disableSave={mobileSaveDisabled}
            showPastPanel={showPastPanel}
            pastEvaluations={pastEvaluations}
            loadingPast={loadingPast}
            pastError={pastError}
          />
        ) : (
          <NewEvaluationDesktopPanel
            canRenderMatrix={canRenderMatrix}
            rows={rows}
            columns={columns}
            processRowUpdate={processRowUpdate}
            onOpenBulkDialog={handleOpenBulkDialog}
            selectedAthletes={selectedAthletes}
            onAthleteChange={setActiveAthleteId}
            onOpenSkillsDialog={openSkillsDialog}
            showPastPanel={showPastPanel}
            pastEvaluations={pastEvaluations}
            loadingPast={loadingPast}
            pastError={pastError}
            activeAthleteId={activeAthleteId}
          />
        )}
      </Stack>

      {/* Low-score skills dialog */}
      <EvaluationSubskillsDialog
        open={skillDialogOpen}
        categoryName={skillDialogCategory?.name ?? null}
        categoryDescription={skillDialogCategory?.description ?? null}
        skills={skillDialogSkills}
        ratings={localSubskillRatings}
        onRatingChange={handleSkillRatingChange}
        onCancel={closeSkillsDialog}
        onSave={saveSkillsDialog}
      />

      {/* Bulk actions dialog */}
      <EvaluationBulkActionsDialog
        open={bulkDialogOpen}
        categories={activeCategories}
        selectedCategoryIds={bulkCategoryIds}
        onCategoryIdsChange={setBulkCategoryIds}
        bulkValue={bulkValue}
        onBulkValueChange={setBulkValue}
        athletes={selectedAthletes}
        selectedAthleteIds={bulkSelectedAthleteIds}
        onToggleAthlete={handleToggleBulkAthlete}
        onSelectAll={handleBulkSelectAll}
        onClearAll={handleBulkClearAll}
        onCancel={() => {
          setBulkDialogOpen(false)
          setBulkCategoryIds([])
        }}
        onApply={handleApplyBulkEvaluation}
      />
    </Box>
  )
}
