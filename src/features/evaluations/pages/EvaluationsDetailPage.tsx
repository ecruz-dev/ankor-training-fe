import * as React from 'react'
import {
  Box,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Autocomplete,
  Chip,
  Paper,
  Button,
  List,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  ListItemButton,
  useMediaQuery,
  Collapse,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore' // Γ£à added
import ExpandLessIcon from '@mui/icons-material/ExpandLess' // Γ£à added
import { useTheme } from '@mui/material/styles'
import { POSITION_OPTIONS } from '../constants'
import { useAuth } from '../../../app/providers/AuthProvider'
import EvaluationBulkActionsDialog from '../components/EvaluationBulkActionsDialog'
import EvaluationColumnMenu from '../components/EvaluationColumnMenu'
import EvaluationSubskillsDialog from '../components/EvaluationSubskillsDialog'
import PastEvaluationsPanel from '../components/PastEvaluationsPanel'
import { useEvaluationLookups } from '../hooks/useEvaluationLookups'
import { usePastEvaluations } from '../hooks/usePastEvaluations'
import { useSkillsDialog } from '../hooks/useSkillsDialog'
import { buildEvaluationItems } from '../utils/buildEvaluationItems'
import { getRatingScale } from '../utils/getRatingScale'
import { mapTeamAthletesToAthletes } from '../utils/mapTeamAthletes'
import type {
  Athlete,
  EvaluationsState,
  ScorecardCategory,
  ScorecardSubskill,
  SubskillEvaluationsState,
} from '../types'
import { useParams } from 'react-router-dom'

// ≡ƒö╣ Services
import {
  listScorecardCategoriesByTemplate,
  listScorecardSubskillsByCategory,
} from '../../scorecards/services/scorecardService'
import { getAthletesByTeam } from '../../teams/services/teamsService'
import {
  rpcBulkCreateEvaluations,
  getEvaluationById,
} from '../api/evaluationsApi'

// ---------- Component ----------


export default function EvaluationsDetailPage() {
  const { id } = useParams<{ id?: string }>() // evaluation id from route (if present)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { profile, user } = useAuth()
  const orgId = profile?.default_org_id?.trim() || null
  const userId = user?.id ?? null

  const { scorecards, teams } = useEvaluationLookups(orgId)

  // ≡ƒö╣ Data from backend

  // Γ£à CHANGED: use assertion instead of generic to avoid runtime `Record` reference
  const [categoriesByTemplate, setCategoriesByTemplate] = React.useState(
    {} as Record<string, ScorecardCategory[]>,
  )

  const [athletes, setAthletes] = React.useState<Athlete[]>([])
  const [allTeamAthletes, setAllTeamAthletes] = React.useState<Athlete[]>([]) // ≡ƒæê NEW: base list for team

  // Γ£à CHANGED: same here
  const [subskillsByCategory, setSubskillsByCategory] = React.useState(
    {} as Record<string, ScorecardSubskill[]>,
  )

  // ≡ƒö╣ UI selections
  const [selectedScorecardId, setSelectedScorecardId] =
    React.useState<string>('')
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>('')
  const [selectedAthletes, setSelectedAthletes] = React.useState<Athlete[]>([])
  const [selectedPosition, setSelectedPosition] = React.useState<string>('') // ≡ƒæê NEW

  // ≡ƒæë Athlete whose past evaluations are shown in the split view
  const [activeAthleteId, setActiveAthleteId] = React.useState<string | null>(
    null,
  )

  // ≡ƒæë Controls visibility of split view
  const [showPastPanel, setShowPastPanel] = React.useState(false)
  const [activeCategoryIndex, setActiveCategoryIndex] = React.useState(0)

  // ≡ƒö╣ Evaluations
  const [evaluations, setEvaluations] = React.useState<EvaluationsState>({})
  const [subskillEvaluations, setSubskillEvaluations] =
    React.useState<SubskillEvaluationsState>({})

  // Γ£à Mobile-only: expanded/collapsed subskills per category
  const [expandedSubskillsByCategory, setExpandedSubskillsByCategory] =
    React.useState<Record<string, boolean>>({})

  // ≡ƒö╣ Save state
  const [saving, setSaving] = React.useState(false)

  // ≡ƒö╣ Detail loading state
  const [loadingDetail, setLoadingDetail] = React.useState(false)
  const [detailError, setDetailError] = React.useState<string | null>(null)

  // ≡ƒö╣ Bulk actions dialog state
  const [bulkDialogOpen, setBulkDialogOpen] = React.useState(false)
  const [bulkValue, setBulkValue] = React.useState<number | ''>('')
  const [bulkSelectedAthleteIds, setBulkSelectedAthleteIds] = React.useState<
    string[]
  >([])
  const [bulkSourceAthleteId, setBulkSourceAthleteId] =
    React.useState<string | null>(null)
  // Categories to apply the bulk grade to (multi-select)
  const [bulkCategoryIds, setBulkCategoryIds] = React.useState<string[]>([])

  const { rows: pastEvaluations, loading: loadingPast, error: pastError } =
    usePastEvaluations({
      orgId,
      athleteId: activeAthleteId,
      enabled: showPastPanel,
      limit: 10,
    })

  // Keep activeAthleteId in sync with selectedAthletes
  React.useEffect(() => {
    if (selectedAthletes.length === 0) {
      setActiveAthleteId(null)
      return
    }

    setActiveAthleteId((prev) => {
      if (prev && selectedAthletes.some((a) => a.id === prev)) {
        return prev
      }
      return selectedAthletes[0].id
    })
  }, [selectedAthletes])

  // ---------- Derived data ----------

  const activeScorecard = React.useMemo(
    () => scorecards.find((s) => s.id === selectedScorecardId) ?? null,
    [scorecards, selectedScorecardId],
  )

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

  React.useEffect(() => {
    if (activeCategories.length === 0) {
      setActiveCategoryIndex(0)
      return
    }

    setActiveCategoryIndex((prev) =>
      Math.min(prev, activeCategories.length - 1),
    )
  }, [activeCategories])

  // Γ£à NEW: skip resetting category index when we auto-advance athletes after rating
  const skipMobileCategoryResetRef = React.useRef(false)

  // Γ£à NEW: helper to move to next athlete (mobile flow)
  const moveToNextAthlete = React.useCallback(() => {
    if (!activeAthleteId) return
    const idx = selectedAthletes.findIndex((a) => a.id === activeAthleteId)
    if (idx < 0) return

    const next = selectedAthletes[idx + 1]
    if (!next) return // last athlete -> no wrap

    skipMobileCategoryResetRef.current = true
    setActiveAthleteId(next.id)
  }, [activeAthleteId, selectedAthletes])

  // Γ£à CHANGED: reset category index on athlete change ONLY on mobile, and not when auto-advancing
  React.useEffect(() => {
    if (!isMobile) return

    if (skipMobileCategoryResetRef.current) {
      skipMobileCategoryResetRef.current = false
      return
    }

    setActiveCategoryIndex(0)
  }, [activeAthleteId, isMobile])

  // ---------- Columns: fixed category info + dynamic athlete columns ----------

  const columns: GridColDef[] = React.useMemo(() => {
    const baseColumns: GridColDef[] = [
      {
        field: 'categoryName',
        headerName: 'Category',
        flex: 1.4,
        sortable: false,
      },
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

  // ---------- Rows: one row per category, cells per athlete ----------

  const rows = React.useMemo(
    () =>
      activeCategories.map((cat) => {
        const scoresByAthlete = selectedAthletes.reduce<
          Record<string, number | null>
        >((acc, athlete) => {
          const evalForAthlete = evaluations[athlete.id] ?? {}
          acc[athlete.id] = evalForAthlete[cat.id] ?? null
          return acc
        }, {})

        return {
          id: cat.id,
          categoryName: cat.name,
          ...scoresByAthlete,
        }
      }),
    [activeCategories, selectedAthletes, evaluations],
  )

  const currentCategory =
    activeCategories.length > 0
      ? activeCategories[
          Math.min(activeCategoryIndex, activeCategories.length - 1)
        ]
      : null

  const currentSubskills =
    currentCategory != null ? subskillsByCategory[currentCategory.id] : undefined

  const hasNextCategory = activeCategoryIndex < activeCategories.length - 1
  const hasPreviousCategory = activeCategoryIndex > 0

  // Γ£à Mobile helper: lazy-load subskills only when needed (expand or set category rating)
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
        setSubskillsByCategory((prev) => ({
          ...prev,
          [categoryId]: [],
        }))
      }
    },
    [isMobile, subskillsByCategory, orgId],
  )

  // Γ£à Mobile helper: set baseline category score and clear overrides (rollout behavior)
  const setMobileCategoryScoreAndRollout = React.useCallback(
    (athleteId: string, categoryId: string, score: number | null) => {
      setEvaluations((prev) => ({
        ...prev,
        [athleteId]: {
          ...(prev[athleteId] ?? {}),
          [categoryId]: score,
        },
      }))

      // Remove overrides for this category so baseline "rolls out"
      setSubskillEvaluations((prev) => {
        const prevForAthlete = prev[athleteId] ?? {}
        const { [categoryId]: _removed, ...restCats } = prevForAthlete
        return {
          ...prev,
          [athleteId]: restCats,
        }
      })
    },
    [],
  )

  // Γ£à Mobile handler: store ONLY overrides (if equals baseline, remove override)
  const handleMobileSubskillRatingChange = React.useCallback(
    (
      athleteId: string,
      categoryId: string,
      subskillId: string,
      rating: number,
    ) => {
      const baseline = evaluations[athleteId]?.[categoryId] ?? null

      setSubskillEvaluations((prev) => {
        const prevForAthlete = prev[athleteId] ?? {}
        const prevForCat = prevForAthlete[categoryId] ?? {}
        const nextForCat: Record<string, number | null> = { ...prevForCat }

        if (baseline != null && Number(rating) === Number(baseline)) {
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

        return {
          ...prev,
          [athleteId]: nextForAthlete,
        }
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

  const handleSubskillRatingChange = React.useCallback(
    (
      athleteId: string,
      categoryId: string,
      subskillId: string,
      rating: number,
    ) => {
      if (!athleteId) return

      const currentByAthlete = subskillEvaluations[athleteId] ?? {}
      const currentByCategory = currentByAthlete[categoryId] ?? {}
      const nextByCategory = { ...currentByCategory, [subskillId]: rating }

      setSubskillEvaluations((prev) => ({
        ...prev,
        [athleteId]: {
          ...(prev[athleteId] ?? {}),
          [categoryId]: nextByCategory,
        },
      }))

      const subskills = subskillsByCategory[categoryId] ?? []
      const numericRatings = subskills
        .map((sub) => nextByCategory[sub.skill_id ?? sub.id])
        .filter(
          (val) =>
            val !== null && val !== undefined && !Number.isNaN(Number(val)),
        )
        .map((val) => Number(val))

      const average =
        numericRatings.length > 0
          ? numericRatings.reduce((sum, val) => sum + val, 0) /
            numericRatings.length
          : null

      setEvaluations((prev) => ({
        ...prev,
        [athleteId]: {
          ...(prev[athleteId] ?? {}),
          [categoryId]: average,
        },
      }))
    },
    [subskillEvaluations, subskillsByCategory],
  )

  // ---------- Edit handler (uses processRowUpdate) ----------

  const processRowUpdate = React.useCallback(
    (newRow: any, oldRow: any) => {
      // Find the changed field (athleteId)
      let changedField: string | null = null
      let newValue: number | null = null
      for (const key in newRow) {
        if (newRow[key] !== oldRow[key]) {
          changedField = key
          newValue = newRow[key]
          break // Assume single cell edit
        }
      }

      if (!changedField) {
        return newRow
      }

      const athlete = selectedAthletes.find((a) => a.id === changedField)
      if (!athlete) {
        return newRow
      }

      const categoryId = String(newRow.id)
      const athleteId = athlete.id

      // Update evaluations state
      setEvaluations((prev) => ({
        ...prev,
        [athleteId]: {
          ...(prev[athleteId] ?? {}),
          [categoryId]: newValue,
        },
      }))

      // If score < 3, open skills modal for that category
      if (newValue !== null && newValue < 3) {
        openSkillsDialog(athleteId, categoryId)
      }

      return newRow
    },
    [selectedAthletes, openSkillsDialog],
  )

  // ---------- Bulk actions handlers ----------

  const handleOpenBulkDialog = React.useCallback(
    (athleteField: string) => {
      setBulkSourceAthleteId(athleteField)
      setBulkDialogOpen(true)
      setBulkValue('')
      // default: all visible athletes selected
      setBulkSelectedAthleteIds(selectedAthletes.map((a) => a.id))
      // default: all visible categories selected
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

        // Apply to all selected categories
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

  // ---------- Other handlers ----------

  const handleScorecardChange = (newId: string) => {
    setSelectedScorecardId(newId)
    setEvaluations({})
    setSubskillEvaluations({})
    // optionally clear subskills cache when switching templates
    // setSubskillsByCategory({})

    if (!newId) return

    ;(async () => {
      try {
        // 1) Get categories for this template (from cache or API)
        let categories = categoriesByTemplate[newId]

        if (!categories) {
          const fetchedCategories = await listScorecardCategoriesByTemplate({
            scorecardTemplateId: newId,
            orgId,
            limit: 200,
            offset: 0,
          })

          categories = (fetchedCategories ?? []) as ScorecardCategory[]

          setCategoriesByTemplate((prev) => ({
            ...prev,
            [newId]: categories!,
          }))
        }

        if (!categories || categories.length === 0) {
          return
        }

        // 2) For each category, prefetch subskills if not already loaded
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
    })()
  }

  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId)
    setEvaluations({})
    setSubskillEvaluations({})
    setSelectedPosition('') // ≡ƒæê reset position filter when changing team
    setAllTeamAthletes([])

    if (!teamId) {
      setAthletes([])
      setSelectedAthletes([])
      return
    }

    ;(async () => {
      try {
        const athletesResponse = await getAthletesByTeam(teamId, { orgId })
        const mapped = mapTeamAthletesToAthletes(athletesResponse ?? [])

        setAllTeamAthletes(mapped) // ≡ƒæê base list
        setAthletes(mapped)
        setSelectedAthletes(mapped)
      } catch (err) {
        console.error('Failed to load athletes for team', err)
        setAllTeamAthletes([])
        setAthletes([])
        setSelectedAthletes([])
      }
    })()
  }

  const handlePositionChange = (positionValue: string) => {
    setSelectedPosition(positionValue)
    setEvaluations({})
    setSubskillEvaluations({})

    if (!positionValue) {
      // All positions
      setAthletes(allTeamAthletes)
      setSelectedAthletes(allTeamAthletes)
      return
    }

    const filtered = allTeamAthletes.filter(
      (a) =>
        a.position &&
        a.position.toLowerCase() === positionValue.toLowerCase(),
    )

    setAthletes(filtered)
    setSelectedAthletes(filtered)
  }

  // ≡ƒö╣ Build payload using ONLY changed cells
  const handleSaveEvaluations = async () => {
    if (
      !selectedScorecardId ||
      selectedAthletes.length === 0 ||
      activeCategories.length === 0
    ) {
      console.warn('Nothing to save: missing scorecard, athletes, or categories')
      return
    }

    if (!orgId) {
      console.warn('Missing org_id from profile.')
      return
    }
    if (!userId) {
      console.warn('Missing user id from session.')
      return
    }

    try {
      setSaving(true)

      // ----- Build evaluation_items from matrix + subskills, only for changed cells -----
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

      // ----- Final payload: one evaluation with many items -----
      const payload = {
        evaluations: [
          {
            org_id: orgId,
            scorecard_template_id: selectedScorecardId,
            team_id: selectedTeamId || null,
            coach_id: userId,
            notes: null, // bind to a TextField later if needed
            evaluation_items: evaluationItems,
          },
        ],
      }

      const result = await rpcBulkCreateEvaluations(payload as any, { orgId })

      if (!result.ok) {
        console.error('Bulk create evaluations failed:', result.error)
      } else {
        console.log('Evaluations saved successfully. Count:', result.count)
        // TODO: toast / navigate if desired
      }
    } catch (err) {
      console.error('Failed to save evaluations', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h5" fontWeight={700}>
          {id ? 'Evaluation detail' : 'Evaluations'}
        </Typography>

        {loadingDetail && (
          <Typography variant="body2" color="text.secondary">
            Loading evaluationΓÇª
          </Typography>
        )}
        {detailError && (
          <Typography variant="body2" color="error">
            {detailError}
          </Typography>
        )}

        {/* Step 1 & 2: Filters / Selections */}
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2} direction={{ xs: 'column', md: 'row' }}>
            {/* 1. Pick Scorecard */}
            <TextField
              select
              size="small"
              label="Scorecard template"
              value={selectedScorecardId}
              onChange={(e) => handleScorecardChange(e.target.value)}
              sx={{ minWidth: 260 }}
            >
              {scorecards.map((sc) => (
                <MenuItem key={sc.id} value={sc.id}>
                  {sc.name}
                </MenuItem>
              ))}
            </TextField>

            {/* 1.5 Filter by Team (auto-selects athletes) */}
            <TextField
              select
              size="small"
              label="Filter by team"
              value={selectedTeamId}
              onChange={(e) => handleTeamChange(e.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">All teams</MenuItem>
              {teams.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name}
                </MenuItem>
              ))}
            </TextField>

            {/* 1.75 Filter by Position */}
            <TextField
              select
              size="small"
              label="Filter by position"
              value={selectedPosition}
              onChange={(e) => handlePositionChange(e.target.value)}
              sx={{ minWidth: 200 }}
              disabled={allTeamAthletes.length === 0}
            >
              <MenuItem value="">All positions</MenuItem>
              {POSITION_OPTIONS.map((pos) => (
                <MenuItem key={pos.value} value={pos.value}>
                  {pos.label}
                </MenuItem>
              ))}
            </TextField>

            {/* 2. Pick Athletes (multi-select) */}
            <Autocomplete
              multiple
              size="small"
              options={athletes}
              getOptionLabel={(option) => option.full_name}
              value={selectedAthletes}
              onChange={(_, newValue) => {
                setSelectedAthletes(newValue)
                setEvaluations((prev) => {
                  const next: EvaluationsState = {}
                  newValue.forEach((a) => {
                    if (prev[a.id]) next[a.id] = prev[a.id]
                  })
                  return next
                })
                setSubskillEvaluations((prev) => {
                  const next: SubskillEvaluationsState = {}
                  newValue.forEach((a) => {
                    if (prev[a.id]) next[a.id] = prev[a.id]
                  })
                  return next
                })
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.full_name}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Athletes to evaluate"
                  placeholder={
                    selectedTeamId
                      ? 'All team athletes selected by default'
                      : 'Select athletes'
                  }
                />
              )}
              sx={{ flex: 1, minWidth: 260 }}
            />
          </Stack>

          <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
            Flow: 1) Pick a scorecard ΓåÆ 2) Choose a team to auto-select its
            athletes ΓåÆ (optional) filter by position ΓåÆ 3) Adjust athletes if
            needed ΓåÆ 4) Fill scores in the matrix below. Rows are categories,
            columns are athletes. If a score is less than 3, you&apos;ll see
            the key subskills for that category.
          </Typography>
        </Paper>

        {/* ≡ƒö╣ Actions row: Past evaluations toggle + Save button */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            variant={showPastPanel ? 'outlined' : 'text'}
            size="small"
            onClick={() => setShowPastPanel((prev) => !prev)}
            disabled={selectedAthletes.length === 0}
          >
            {showPastPanel ? 'Hide past evaluations' : 'Past evaluations'}
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveEvaluations}
            disabled={
              saving ||
              !selectedScorecardId ||
              selectedAthletes.length === 0 ||
              activeCategories.length === 0
            }
          >
            {saving ? 'SavingΓÇª' : 'Save evaluations'}
          </Button>
        </Box>

        {/* Step 3: Matrix + optional Past Evaluations split view */}
        {isMobile && (
          <Stack spacing={2}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Mobile evaluations
              </Typography>

              {!selectedScorecardId ||
              selectedAthletes.length === 0 ||
              activeCategories.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Select a scorecard, team, and athletes to start rating
                  subskills.
                </Typography>
              ) : (
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    alignItems: 'stretch',
                    overflowX: 'auto',
                    pb: 1,
                  }}
                >
                  <Box sx={{ minWidth: 180, flexShrink: 0 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Athletes
                    </Typography>
                    <Paper variant="outlined" sx={{ maxHeight: 440, overflow: 'auto' }}>
                      <List dense disablePadding>
                        {selectedAthletes.map((athlete) => (
                          <ListItemButton
                            key={athlete.id}
                            selected={athlete.id === activeAthleteId}
                            onClick={() => setActiveAthleteId(athlete.id)}
                          >
                            <ListItemText
                              primary={athlete.full_name}
                              secondary={athlete.position ? athlete.position : undefined}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Paper>
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {currentCategory ? (
                      <Stack spacing={2} sx={{ height: '100%' }}>
                        <Box>
                          <Typography
                            variant="overline"
                            color="text.secondary"
                            sx={{ display: 'block' }}
                          >
                            Category {activeCategoryIndex + 1} of {activeCategories.length}
                          </Typography>
                          <Typography variant="h6" sx={{ mb: 0.5 }}>
                            {currentCategory.name}
                          </Typography>
                          {currentCategory.description && (
                            <Typography variant="body2" color="text.secondary">
                              {currentCategory.description}
                            </Typography>
                          )}
                        </Box>

                        {/* Γ£à Mobile baseline category rating (rollout) */}
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mb: 0.5 }}
                          >
                            Category rating (baseline)
                          </Typography>

                          <ToggleButtonGroup
                            size="small"
                            exclusive
                            value={mobileCategoryScore}
                            onChange={(_, newValue: number | null) => {
                              if (!activeAthleteId || !currentCategory) return
                              void ensureMobileSubskillsLoaded(currentCategory.id)

                              setMobileCategoryScoreAndRollout(
                                activeAthleteId,
                                currentCategory.id,
                                newValue,
                              )

                              // Γ£à NEW: if a rating is chosen, auto-advance to next athlete
                              if (newValue !== null) {
                                moveToNextAthlete()
                              }
                            }}
                            aria-label="Category rating baseline"
                            disabled={!activeAthleteId}
                          >
                            {[1, 2, 3, 4, 5].map((val) => (
                              <ToggleButton
                                key={val}
                                value={val}
                                sx={{ borderRadius: '50%', width: 36, height: 36, m: 0.5 }}
                              >
                                {val}
                              </ToggleButton>
                            ))}
                          </ToggleButtonGroup>
                        </Box>

                        {/* Γ£à Expand/collapse + lazy-load */}
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            if (!currentCategory) return
                            const nextExpanded = !expandedSubskillsByCategory[currentCategory.id]
                            setExpandedSubskillsByCategory((prev) => ({
                              ...prev,
                              [currentCategory.id]: nextExpanded,
                            }))
                            if (nextExpanded) void ensureMobileSubskillsLoaded(currentCategory.id)
                          }}
                          endIcon={mobileExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          disabled={!currentCategory}
                        >
                          {mobileExpanded ? 'Hide subskills' : 'Show subskills'}
                        </Button>

                        {/* Γ£à Collapsed subskills list */}
                        <Collapse in={mobileExpanded} timeout="auto" unmountOnExit>
                          {currentSubskills === undefined ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Loading subskills for this category...
                            </Typography>
                          ) : currentSubskills.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              No subskills defined for this category yet.
                            </Typography>
                          ) : (
                            <Stack spacing={1.5} sx={{ mt: 1 }}>
                              {currentSubskills
                                .slice()
                                .sort((a, b) => a.position - b.position)
                                .map((skill) => {
                                  const overridesForAthlete =
                                    (activeAthleteId &&
                                      subskillEvaluations[activeAthleteId]?.[
                                        currentCategory.id
                                      ]) ??
                                    {}

                                  const baseline =
                                    (activeAthleteId &&
                                      evaluations[activeAthleteId]?.[currentCategory.id]) ??
                                    null

                                  // Γ£à Display override if exists, else baseline
                                  const subskillId = skill.skill_id ?? skill.id
                                  const ratingValue =
                                    (overridesForAthlete as Record<string, number | null>)[
                                      subskillId
                                    ] ??
                                    baseline ??
                                    null

                                  const ratingScale = getRatingScale(skill.rating_min, skill.rating_max)

                                  return (
                                    <Paper key={subskillId} variant="outlined" sx={{ p: 1.5 }}>
                                      <Typography variant="body2" fontWeight={600}>
                                        {skill.name}
                                      </Typography>
                                      {skill.description && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{ display: 'block', mb: 0.5 }}
                                        >
                                          {skill.description}
                                        </Typography>
                                      )}
                                      <ToggleButtonGroup
                                        size="small"
                                        exclusive
                                        value={ratingValue}
                                        onChange={(_, newValue: number | null) => {
                                          if (newValue !== null && activeAthleteId) {
                                            handleMobileSubskillRatingChange(
                                              activeAthleteId,
                                              currentCategory.id,
                                              subskillId,
                                              Number(newValue),
                                            )
                                          }
                                        }}
                                        aria-label={`${skill.name} rating`}
                                        disabled={!activeAthleteId}
                                      >
                                        {ratingScale.map((val) => (
                                          <ToggleButton
                                            key={val}
                                            value={val}
                                            sx={{
                                              borderRadius: '50%',
                                              width: 36,
                                              height: 36,
                                              m: 0.5,
                                            }}
                                          >
                                            {val}
                                          </ToggleButton>
                                        ))}
                                      </ToggleButtonGroup>
                                    </Paper>
                                  )
                                })}
                            </Stack>
                          )}
                        </Collapse>

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 1,
                            mt: 'auto',
                          }}
                        >
                          <Button
                            variant="outlined"
                            startIcon={<ChevronLeftIcon />}
                            disabled={!hasPreviousCategory}
                            onClick={() => setActiveCategoryIndex((prev) => Math.max(prev - 1, 0))}
                          >
                            Previous
                          </Button>
                          {hasNextCategory ? (
                            <Button
                              variant="contained"
                              endIcon={<ChevronRightIcon />}
                              onClick={() =>
                                setActiveCategoryIndex((prev) =>
                                  Math.min(prev + 1, activeCategories.length - 1),
                                )
                              }
                              disabled={!activeAthleteId}
                            >
                              Next
                            </Button>
                          ) : (
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handleSaveEvaluations}
                              disabled={
                                saving ||
                                !selectedScorecardId ||
                                !activeAthleteId ||
                                activeCategories.length === 0
                              }
                            >
                              {saving ? 'Saving...' : 'Save'}
                            </Button>
                          )}
                        </Box>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Select a scorecard to load categories.
                      </Typography>
                    )}
                  </Box>
                </Stack>
              )}
            </Paper>

            {showPastPanel && (
              <PastEvaluationsPanel
                layout="stack"
                athletes={selectedAthletes}
                activeAthleteId={activeAthleteId}
                onAthleteChange={setActiveAthleteId}
                loading={loadingPast}
                error={pastError}
                evaluations={pastEvaluations}
              />
            )}
          </Stack>
        )}

        {!isMobile && (
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            alignItems="stretch"
          >
            {/* LEFT PANEL: Matrix Category ├ù Athletes */}
            <Box sx={{ flex: showPastPanel ? 2 : 1, minWidth: 0 }}>
              <Paper sx={{ height: 520, p: 1 }}>
                {selectedScorecardId && selectedAthletes.length > 0 ? (
                  <DataGrid
                    rows={rows}
                    columns={columns}
                    disableRowSelectionOnClick
                    hideFooterSelectedRowCount
                    density="compact"
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 10, page: 0 } },
                    }}
                    processRowUpdate={processRowUpdate}
                    slots={{ columnMenu: EvaluationColumnMenu }}
                    slotProps={{
                      columnMenu: {
                        onBulkActions: handleOpenBulkDialog,
                      } as any,
                    }}
                    onCellClick={(params) => {
                      const field = params.field as string
                      if (selectedAthletes.some((a) => a.id === field)) {
                        setActiveAthleteId(field)
                      }
                    }}
                    onCellDoubleClick={(params) => {
                      const field = params.field as string

                      // Only react to athlete columns, not the Category column
                      if (!selectedAthletes.some((a) => a.id === field)) {
                        return
                      }

                      const athleteId = field
                      const categoryId = String(params.id) // row.id is the category id

                      openSkillsDialog(athleteId, categoryId)
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      px: 2,
                    }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      Select a scorecard and at least one athlete (via team filter
                      or athlete picker) to render the evaluation matrix.
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>

            {/* RIGHT PANEL: Past evaluations list (mock) */}
            {showPastPanel && (
              <Box
                sx={{
                  flex: 1,
                  minWidth: { xs: '100%', lg: 320 },
                  maxWidth: { lg: 400 },
                }}
              >
                <PastEvaluationsPanel
                  layout="side"
                  athletes={selectedAthletes}
                  activeAthleteId={activeAthleteId}
                  onAthleteChange={setActiveAthleteId}
                  loading={loadingPast}
                  error={pastError}
                  evaluations={pastEvaluations}
                />
              </Box>
            )}
          </Stack>
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

