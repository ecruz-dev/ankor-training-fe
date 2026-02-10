// src/pages/EditEvaluationsPage.tsx

import * as React from "react";
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
  Snackbar,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "../../../app/providers/AuthProvider";
import EvaluationBulkActionsDialog from "../components/EvaluationBulkActionsDialog";
import EvaluationColumnMenu from "../components/EvaluationColumnMenu";
import EvaluationSubskillsDialog from "../components/EvaluationSubskillsDialog";
import { useEvaluationLookups } from "../hooks/useEvaluationLookups";
import { useSkillsDialog } from "../hooks/useSkillsDialog";
import { getRatingScale } from "../utils/getRatingScale";
import { mapTeamAthletesToAthletes } from "../utils/mapTeamAthletes";
import type {
  Athlete,
  EvaluationsState,
  ScorecardCategory,
  ScorecardSubskill,
  SubskillEvaluationsState,
} from "../types";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useNavigate, useParams } from "react-router-dom"; 
// ≡ƒö╣ Services
import {
  listScorecardCategoriesByTemplate,
  listScorecardSubskillsByCategory,
} from "../../scorecards/services/scorecardService";
import { getAthletesByTeam } from "../../teams/services/teamsService";
import {
  getEvaluationById,
  rpcBulkUpdateEvaluations,
  submitEvaluation,
  type EvaluationMatrixOperation,
} from "../api/evaluationsApi";

// ---------- Component ----------


export default function EditEvaluationsPage() {
const { id } = useParams<{ id: string }>(); // evaluation id from route
const navigate = useNavigate();


  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { profile, coachId } = useAuth();
  const orgId = profile?.default_org_id?.trim() || null;

  const { scorecards, teams } = useEvaluationLookups(orgId);

  // ≡ƒö╣ Data from backend
  const [categoriesByTemplate, setCategoriesByTemplate] = React.useState<
    Record<string, ScorecardCategory[]>
  >({});
  const [athletes, setAthletes] = React.useState<Athlete[]>([]);
  const [subskillsByCategory, setSubskillsByCategory] = React.useState<
    Record<string, ScorecardSubskill[]>
  >({});

  // ≡ƒö╣ UI selections
  const [selectedScorecardId, setSelectedScorecardId] =
    React.useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>("");
  const [selectedAthletes, setSelectedAthletes] = React.useState<Athlete[]>([]);

  // Γ£à Mobile: active athlete/category controls
  const [activeAthleteId, setActiveAthleteId] = React.useState<string | null>(
    null,
  );
  const [activeCategoryIndex, setActiveCategoryIndex] = React.useState(0);
  const [expandedSubskillsByCategory, setExpandedSubskillsByCategory] =
    React.useState<Record<string, boolean>>({});

  // ≡ƒö╣ Evaluations
  const [evaluations, setEvaluations] = React.useState<EvaluationsState>({});
  const [subskillEvaluations, setSubskillEvaluations] =
    React.useState<SubskillEvaluationsState>({});

  // ≡ƒö╣ Original snapshot (for diffing)
  const [originalAthleteIds, setOriginalAthleteIds] = React.useState<string[]>(
    [],
  );
  const [originalSubskillEvaluations, setOriginalSubskillEvaluations] =
    React.useState<SubskillEvaluationsState>({});

  // ≡ƒö╣ Save / detail state
  const [saving, setSaving] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);


  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const [toastSeverity, setToastSeverity] = React.useState<
    "success" | "error" | "info" | "warning"
  >("success");

  const showToast = React.useCallback(
    (
      message: string,
      severity: "success" | "error" | "info" | "warning" = "success",
    ) => {
      setToastMessage(message);
      setToastSeverity(severity);
      setToastOpen(true);
    },
    [],
  );


  // ≡ƒö╣ Bulk actions dialog state
  const [bulkDialogOpen, setBulkDialogOpen] = React.useState(false);
  const [bulkValue, setBulkValue] = React.useState<number | "">("");
  const [bulkSelectedAthleteIds, setBulkSelectedAthleteIds] = React.useState<
    string[]
  >([]);
  const [bulkSourceAthleteId, setBulkSourceAthleteId] =
    React.useState<string | null>(null);
  const [bulkCategoryIds, setBulkCategoryIds] = React.useState<string[]>([]);

  // ---------- Load existing evaluation detail ----------

  React.useEffect(() => {
    if (!id) {
      setDetailError("Missing evaluation id in route");
      return;
    }
    if (!orgId) {
      return;
    }

    async function loadDetail() {
      try {
        setLoadingDetail(true);
        setDetailError(null);

        const detail = await getEvaluationById(id, { orgId });

        const templateId = detail.template_id ?? "";
        setSelectedScorecardId(templateId);
        setSelectedTeamId(detail.teams_id ?? "");

        const categories = (detail.categories ?? []) as ScorecardCategory[];
        setCategoriesByTemplate((prev) => ({
          ...prev,
          [templateId]: categories,
        }));

        // Map athletes from detail
        const mappedAthletes: Athlete[] = (detail.athletes ?? []).map((a) => {
          const fullName =
            [a.first_name, a.last_name].filter(Boolean).join(" ") ||
            "Unnamed athlete";

          return {
            id: a.id,
            full_name: fullName,
            team_id: detail.teams_id ?? "",
          };
        });

        setAthletes(mappedAthletes);
        setSelectedAthletes(mappedAthletes);
        setOriginalAthleteIds(mappedAthletes.map((a) => a.id));

        // Γ£à keep mobile active athlete in sync
        setActiveAthleteId(mappedAthletes[0]?.id ?? null);

        // Load subskills per category
        const subskillResults = await Promise.allSettled(
          categories.map((cat) =>
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
        );

        const nextSubskillsByCategory: Record<string, ScorecardSubskill[]> = {};
        const subskillToCategory = new Map<string, string>();

        for (const r of subskillResults) {
          if (r.status === "fulfilled") {
            const { categoryId, subskills } = r.value;
            const casted = subskills as ScorecardSubskill[];
            nextSubskillsByCategory[categoryId] = casted;
            casted.forEach((sub) => {
              const subskillKey = sub.skill_id ?? sub.id;
              subskillToCategory.set(subskillKey, sub.category_id);
            });
          }
        }

        setSubskillsByCategory((prev) => ({
          ...prev,
          ...nextSubskillsByCategory,
        }));

        // Build evaluation matrix + subskill maps from items
        const evalState: EvaluationsState = {};
        const subskillEvalState: SubskillEvaluationsState = {};

        (detail.evaluation_items ?? []).forEach((item) => {
          const categoryId = subskillToCategory.get(item.subskill_id);
          if (!categoryId) return;

          if (!evalState[item.athlete_id]) {
            evalState[item.athlete_id] = {};
          }
          const prev = evalState[item.athlete_id][categoryId];
          if (prev == null) {
            evalState[item.athlete_id][categoryId] = item.rating ?? null;
          } else if (item.rating != null) {
            evalState[item.athlete_id][categoryId] =
              (Number(prev) + Number(item.rating)) / 2;
          }

          if (!subskillEvalState[item.athlete_id]) {
            subskillEvalState[item.athlete_id] = {};
          }
          const byCat = subskillEvalState[item.athlete_id][categoryId] ?? {};
          byCat[item.subskill_id] = item.rating ?? null;
          subskillEvalState[item.athlete_id][categoryId] = byCat;
        });

        setEvaluations(evalState);
        setSubskillEvaluations(subskillEvalState);
        setOriginalSubskillEvaluations(subskillEvalState);
      } catch (err) {
        console.error("Failed to load evaluation detail", err);
        setDetailError("Failed to load evaluation");
      } finally {
        setLoadingDetail(false);
      }
    }

    loadDetail();
  }, [id, orgId]);

  // ---------- Derived data ----------

  const activeScorecard = React.useMemo(
    () => scorecards.find((s) => s.id === selectedScorecardId) ?? null,
    [scorecards, selectedScorecardId],
  );

  const activeCategories: ScorecardCategory[] = React.useMemo(
    () =>
      selectedScorecardId
        ? categoriesByTemplate[selectedScorecardId] ?? []
        : [],
    [categoriesByTemplate, selectedScorecardId],
  );

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
    subskillEvaluations,
    setSubskillEvaluations,
    orgId,
  });

  // Γ£à keep category index safe when categories change
  React.useEffect(() => {
    if (activeCategories.length === 0) {
      setActiveCategoryIndex(0);
      return;
    }
    setActiveCategoryIndex((prev) => Math.min(prev, activeCategories.length - 1));
  }, [activeCategories]);

  // Γ£à keep activeAthleteId in sync with selection (mobile + general)
  React.useEffect(() => {
    if (selectedAthletes.length === 0) {
      setActiveAthleteId(null);
      return;
    }
    setActiveAthleteId((prev) => {
      if (prev && selectedAthletes.some((a) => a.id === prev)) return prev;
      return selectedAthletes[0].id;
    });
  }, [selectedAthletes]);

  // ---------- Mobile helpers ----------

  const currentCategory =
    activeCategories.length > 0
      ? activeCategories[
          Math.min(activeCategoryIndex, activeCategories.length - 1)
        ]
      : null;

  const currentSubskills =
    currentCategory != null ? subskillsByCategory[currentCategory.id] : undefined;

  const hasNextCategory = activeCategoryIndex < activeCategories.length - 1;
  const hasPreviousCategory = activeCategoryIndex > 0;

  const skipMobileCategoryResetRef = React.useRef(false);

  const moveToNextAthlete = React.useCallback(() => {
    if (!activeAthleteId) return;
    const idx = selectedAthletes.findIndex((a) => a.id === activeAthleteId);
    if (idx < 0) return;
    const next = selectedAthletes[idx + 1];
    if (!next) return;
    skipMobileCategoryResetRef.current = true;
    setActiveAthleteId(next.id);
  }, [activeAthleteId, selectedAthletes]);

  React.useEffect(() => {
    if (!isMobile) return;
    if (skipMobileCategoryResetRef.current) {
      skipMobileCategoryResetRef.current = false;
      return;
    }
    setActiveCategoryIndex(0);
  }, [activeAthleteId, isMobile]);

  const ensureMobileSubskillsLoaded = React.useCallback(
    async (categoryId: string) => {
      if (!isMobile) return;
      if (subskillsByCategory[categoryId] !== undefined) return;

      try {
        const skills = await listScorecardSubskillsByCategory({
          categoryId,
          orgId,
          limit: 200,
          offset: 0,
        });

        setSubskillsByCategory((prev) => ({
          ...prev,
          [categoryId]: (skills ?? []) as ScorecardSubskill[],
        }));
      } catch (err) {
        console.error("Failed to lazy-load subskills (mobile)", err);
        setSubskillsByCategory((prev) => ({ ...prev, [categoryId]: [] }));
      }
    },
    [isMobile, subskillsByCategory, orgId],
  );

  const setMobileCategoryScoreAndRollout = React.useCallback(
    (athleteId: string, categoryId: string, score: number | null) => {
      setEvaluations((prev) => ({
        ...prev,
        [athleteId]: { ...(prev[athleteId] ?? {}), [categoryId]: score },
      }));

      // clear subskill overrides for this category (baseline becomes the default)
      setSubskillEvaluations((prev) => {
        const prevForAthlete = prev[athleteId] ?? {};
        const { [categoryId]: _removed, ...restCats } = prevForAthlete;
        return { ...prev, [athleteId]: restCats };
      });
    },
    [],
  );

  const handleMobileSubskillRatingChange = React.useCallback(
    (
      athleteId: string,
      categoryId: string,
      subskillId: string,
      rating: number | null,
    ) => {
      const baseline = evaluations[athleteId]?.[categoryId] ?? null;

      setSubskillEvaluations((prev) => {
        const prevForAthlete = prev[athleteId] ?? {};
        const prevForCat = prevForAthlete[categoryId] ?? {};
        const nextForCat: Record<string, number | null> = { ...prevForCat };

        if (rating == null) {
          delete nextForCat[subskillId];
        } else if (baseline != null && Number(rating) === Number(baseline)) {
          delete nextForCat[subskillId];
        } else {
          nextForCat[subskillId] = rating;
        }

        const nextForAthlete: Record<string, Record<string, number | null>> = {
          ...prevForAthlete,
        };

        if (Object.keys(nextForCat).length === 0) {
          delete nextForAthlete[categoryId];
        } else {
          nextForAthlete[categoryId] = nextForCat;
        }

        return { ...prev, [athleteId]: nextForAthlete };
      });
    },
    [evaluations],
  );

  const mobileExpanded =
    currentCategory ? !!expandedSubskillsByCategory[currentCategory.id] : false;

  const mobileCategoryScore =
    activeAthleteId && currentCategory
      ? evaluations[activeAthleteId]?.[currentCategory.id] ?? null
      : null;

  React.useEffect(() => {
    if (!isMobile || !currentCategory) return;
    if (!expandedSubskillsByCategory[currentCategory.id]) return;
    void ensureMobileSubskillsLoaded(currentCategory.id);
  }, [
    isMobile,
    currentCategory?.id,
    expandedSubskillsByCategory,
    ensureMobileSubskillsLoaded,
  ]);

  // ---------- Columns & rows ----------

  const columns: GridColDef[] = React.useMemo(() => {
    const baseColumns: GridColDef[] = [
      {
        field: "categoryName",
        headerName: "Category",
        flex: 1.4,
        sortable: false,
      },
    ];

    const athleteColumns: GridColDef[] = selectedAthletes.map((athlete) => ({
      field: athlete.id,
      headerName: athlete.full_name,
      flex: 1,
      sortable: false,
      editable: true,
      type: "number",
      valueParser: (value) => {
        const num = Number(value);
        return Number.isNaN(num) ? null : num;
      },
    }));

    return [...baseColumns, ...athleteColumns];
  }, [selectedAthletes]);

  const rows = React.useMemo(
    () =>
      activeCategories.map((cat) => {
        const scoresByAthlete = selectedAthletes.reduce<
          Record<string, number | null>
        >((acc, athlete) => {
          const evalForAthlete = evaluations[athlete.id] ?? {};
          acc[athlete.id] = evalForAthlete[cat.id] ?? null;
          return acc;
        }, {});

        return {
          id: cat.id,
          categoryName: cat.name,
          ...scoresByAthlete,
        };
      }),
    [activeCategories, selectedAthletes, evaluations],
  );

  // ---------- Cell edit handler ----------

  const processRowUpdate = React.useCallback(
    (newRow: any, oldRow: any) => {
      let changedField: string | null = null;
      let newValue: number | null = null;

      for (const key in newRow) {
        if (newRow[key] !== oldRow[key]) {
          changedField = key;
          newValue = newRow[key];
          break;
        }
      }

      if (!changedField) return newRow;

      const athlete = selectedAthletes.find((a) => a.id === changedField);
      if (!athlete) return newRow;

      const categoryId = String(newRow.id);
      const athleteId = athlete.id;

      setEvaluations((prev) => ({
        ...prev,
        [athleteId]: {
          ...(prev[athleteId] ?? {}),
          [categoryId]: newValue,
        },
      }));

      if (newValue !== null && newValue < 3) {
        openSkillsDialog(athleteId, categoryId);
      }

      return newRow;
    },
    [selectedAthletes, openSkillsDialog],
  );

  // ---------- Bulk actions handlers ----------

  const handleOpenBulkDialog = React.useCallback(
    (athleteField: string) => {
      setBulkSourceAthleteId(athleteField);
      setBulkDialogOpen(true);
      setBulkValue("");
      setBulkSelectedAthleteIds(selectedAthletes.map((a) => a.id));
      setBulkCategoryIds(activeCategories.map((c) => c.id));
    },
    [selectedAthletes, activeCategories],
  );

  const handleToggleBulkAthlete = (athleteId: string) => {
    setBulkSelectedAthleteIds((prev) =>
      prev.includes(athleteId)
        ? prev.filter((id) => id !== athleteId)
        : [...prev, athleteId],
    );
  };

  const handleBulkSelectAll = () => {
    setBulkSelectedAthleteIds(selectedAthletes.map((a) => a.id));
  };

  const handleBulkClearAll = () => {
    setBulkSelectedAthleteIds([]);
  };

  const handleApplyBulkEvaluation = () => {
    if (
      bulkValue === "" ||
      bulkSelectedAthleteIds.length === 0 ||
      bulkCategoryIds.length === 0
    ) {
      setBulkDialogOpen(false);
      return;
    }

    const numericValue = Number(bulkValue);
    if (Number.isNaN(numericValue)) return;

    setEvaluations((prev) => {
      const next: EvaluationsState = { ...prev };

      bulkSelectedAthleteIds.forEach((athleteId) => {
        const prevForAthlete = next[athleteId] ?? {};
        const updatedForAthlete: Record<string, number | null> = {
          ...prevForAthlete,
        };

        bulkCategoryIds.forEach((categoryId) => {
          updatedForAthlete[categoryId] = numericValue;
        });

        next[athleteId] = updatedForAthlete;
      });

      return next;
    });

    setBulkDialogOpen(false);
  };

  // ---------- Other handlers ----------

  const handleScorecardChange = (newId: string) => {
    setSelectedScorecardId(newId);
    setEvaluations({});
    setSubskillEvaluations({});

    if (!newId) return;

    (async () => {
      try {
        let categories = categoriesByTemplate[newId];

        if (!categories) {
          const fetchedCategories = await listScorecardCategoriesByTemplate({
            scorecardTemplateId: newId,
            orgId,
            limit: 200,
            offset: 0,
          });

          categories = (fetchedCategories ?? []) as ScorecardCategory[];

          setCategoriesByTemplate((prev) => ({
            ...prev,
            [newId]: categories!,
          }));
        }

        if (!categories || categories.length === 0) {
          return;
        }

        const toFetch = categories.filter((cat) => !subskillsByCategory[cat.id]);
        if (toFetch.length === 0) return;

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
        );

        setSubskillsByCategory((prev) => {
          const next = { ...prev };
          for (const r of results) {
            if (r.status === "fulfilled") {
              const { categoryId, subskills } = r.value;
              next[categoryId] = subskills as ScorecardSubskill[];
            }
          }
          return next;
        });
      } catch (err) {
        console.error("Failed to load scorecard categories/subskills", err);
      }
    })();
  };

  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId);
    setEvaluations({});
    setSubskillEvaluations({});

    if (!teamId) {
      setAthletes([]);
      setSelectedAthletes([]);
      return;
    }

    (async () => {
      try {
        const athletesResponse = await getAthletesByTeam(teamId, { orgId });
        const mapped = mapTeamAthletesToAthletes(athletesResponse ?? []);

        setAthletes(mapped);
        setSelectedAthletes(mapped);
      } catch (err) {
        console.error("Failed to load athletes for team", err);
        setAthletes([]);
        setSelectedAthletes([]);
      }
    })();
  };

  // ≡ƒö╣ Save (matrix PATCH) in "operations: [ ... ]" shape
  const handleSaveEvaluations = async () => {
    if (!id) {
      console.warn("No evaluation id provided in route");
      return;
    }

    if (
      !selectedScorecardId ||
      selectedAthletes.length === 0 ||
      activeCategories.length === 0
    ) {
      console.warn(
        "Nothing to save: missing scorecard, athletes, or categories",
      );
      return;
    }

    if (!orgId) {
      console.warn("Missing org_id from profile.");
      return;
    }
    if (!coachId) {
      console.warn("Missing coach id from profile.");
      return;
    }

    try {
      setSaving(true);

      const operations: EvaluationMatrixOperation[] = [];

      // 1) Removed athletes -> remove_athlete
      const currentAthleteIds = new Set(selectedAthletes.map((a) => a.id));
      originalAthleteIds.forEach((athleteId) => {
        if (!currentAthleteIds.has(athleteId)) {
          operations.push({
            type: "remove_athlete",
            athlete_id: athleteId,
          });
        }
      });

      // 2) Upsert ratings per (athlete, subskill)
      selectedAthletes.forEach((athlete) => {
        const athleteId = athlete.id;

        activeCategories.forEach((cat) => {
          const categoryId = cat.id;
          const subskills = subskillsByCategory[categoryId] || [];

          subskills.forEach((sub) => {
            const subskillId = sub.skill_id ?? sub.id;

            const currentSubskillRating =
              subskillEvaluations[athleteId]?.[categoryId]?.[subskillId];

            const categoryScore = evaluations[athleteId]?.[categoryId];

            // Prefer explicit subskill rating; fallback to category score
            const currentRating = currentSubskillRating ?? categoryScore ?? null;

            const previousRating =
              originalSubskillEvaluations[athleteId]?.[categoryId]?.[
                subskillId
              ] ?? null;

            // Case 1: nothing before, nothing now -> no-op
            if (currentRating == null && previousRating == null) {
              return;
            }

            // Case 2: there WAS a rating, now cleared -> send rating: null to delete
            if (currentRating == null && previousRating != null) {
              operations.push({
                type: "upsert_rating",
                athlete_id: athleteId,
                subskill_id: subskillId,
                rating: null,
                comments: null,
              });
              return;
            }

            // Case 3: we have a rating now -> upsert (insert or update)
            if (currentRating != null) {
              const ratingNum = Number(currentRating);
              if (Number.isNaN(ratingNum)) return;

              operations.push({
                type: "upsert_rating",
                athlete_id: athleteId,
                subskill_id: subskillId,
                rating: ratingNum,
                comments: null,
              });
            }
          });
        });
      });

      if (operations.length === 0) {
        console.warn("Nothing to save: no matrix operations built");
        return;
      }

      const payload = {
        org_id: orgId,
        template_id: selectedScorecardId,
        team_id: selectedTeamId || null,
        coach_id: coachId,
        notes: null,
        operations,
      };

      const updated = await rpcBulkUpdateEvaluations(id, payload, { orgId });

      console.log("Evaluation updated successfully:", updated.id);
      // TODO: toast / navigate back if you want
    } catch (err) {
      console.error("Failed to update evaluation", err);
    } finally {
      setSaving(false);
    }
  };
  const handleSubmitEvaluation = async () => {
    if (!id) {
      console.warn("No evaluation id provided in route");
      return;
    }

    try {
      setSubmitting(true);
      await submitEvaluation(id, { orgId });

      showToast("Evaluation has been completed successfully.", "success");

      // Navigate to evaluations list page after a short delay (so user sees the toast)
      window.setTimeout(() => {
        navigate("/evaluations", { replace: true });
      }, 900);
    } catch (err) {
      console.error("Failed to submit evaluation", err);
      showToast("Failed to submit evaluation.", "error");
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h5" fontWeight={700}>
          Edit evaluation
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
          <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
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

            {/* 2. Pick Athletes (multi-select) */}
            <Autocomplete
              multiple
              size="small"
              options={athletes}
              getOptionLabel={(option) => option.full_name}
              value={selectedAthletes}
              onChange={(_, newValue) => {
                setSelectedAthletes(newValue);
                setEvaluations((prev) => {
                  const next: EvaluationsState = {};
                  newValue.forEach((a) => {
                    if (prev[a.id]) next[a.id] = prev[a.id];
                  });
                  return next;
                });
                setSubskillEvaluations((prev) => {
                  const next: SubskillEvaluationsState = {};
                  newValue.forEach((a) => {
                    if (prev[a.id]) next[a.id] = prev[a.id];
                  });
                  return next;
                });
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
                      ? "All team athletes selected by default"
                      : "Select athletes"
                  }
                />
              )}
              sx={{ flex: 1, minWidth: 260 }}
            />
          </Stack>

          <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
            Edit the evaluation matrix. Rows are categories, columns are athletes.
            If a score is less than 3, you&apos;ll see the key subskills for that
            category.
          </Typography>
        </Paper>

        {/* Save button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
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
            {saving ? "SavingΓÇª" : "Update evaluation"}
          </Button>
           <Button
              variant="contained"
              color="success"
              onClick={handleSubmitEvaluation}
              disabled={
                submitting ||
                saving ||
                !id ||
                !selectedScorecardId ||
                selectedAthletes.length === 0 ||
                activeCategories.length === 0
              }
            >
              {submitting ? "SubmittingΓÇª" : "Submit evaluation"}
            </Button>
        </Box>

        {/* Step 3: Mobile view OR Matrix Category ├ù Athletes */}
        {isMobile ? (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Mobile evaluations
            </Typography>

            {!selectedScorecardId ||
            selectedAthletes.length === 0 ||
            activeCategories.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Select a scorecard, team, and athletes to start editing ratings.
              </Typography>
            ) : (
              <Stack
                direction="row"
                spacing={2}
                sx={{ alignItems: "stretch", overflowX: "auto", pb: 1 }}
              >
                <Box sx={{ minWidth: 180, flexShrink: 0 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Athletes
                  </Typography>
                  <Paper variant="outlined" sx={{ maxHeight: 440, overflow: "auto" }}>
                    <List dense disablePadding>
                      {selectedAthletes.map((athlete) => (
                        <ListItemButton
                          key={athlete.id}
                          selected={athlete.id === activeAthleteId}
                          onClick={() => setActiveAthleteId(athlete.id)}
                        >
                          <ListItemText primary={athlete.full_name} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Paper>
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {currentCategory ? (
                    <Stack spacing={2} sx={{ height: "100%" }}>
                      <Box>
                        <Typography
                          variant="overline"
                          color="text.secondary"
                          sx={{ display: "block" }}
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

                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          Category rating (baseline)
                        </Typography>

                        <ToggleButtonGroup
                          size="small"
                          exclusive
                          value={mobileCategoryScore}
                          onChange={(_, newValue: number | null) => {
                            if (!activeAthleteId || !currentCategory) return;
                            void ensureMobileSubskillsLoaded(currentCategory.id);

                            setMobileCategoryScoreAndRollout(
                              activeAthleteId,
                              currentCategory.id,
                              newValue,
                            );

                            if (newValue !== null) moveToNextAthlete();
                          }}
                          aria-label="Category rating baseline"
                          disabled={!activeAthleteId}
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <ToggleButton
                              key={val}
                              value={val}
                              sx={{ borderRadius: "50%", width: 36, height: 36, m: 0.5 }}
                            >
                              {val}
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      </Box>

                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          if (!currentCategory) return;
                          const nextExpanded =
                            !expandedSubskillsByCategory[currentCategory.id];
                          setExpandedSubskillsByCategory((prev) => ({
                            ...prev,
                            [currentCategory.id]: nextExpanded,
                          }));
                          if (nextExpanded) void ensureMobileSubskillsLoaded(currentCategory.id);
                        }}
                        endIcon={mobileExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        disabled={!currentCategory}
                      >
                        {mobileExpanded ? "Hide subskills" : "Show subskills"}
                      </Button>

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
                                  {};

                                const baseline =
                                  (activeAthleteId &&
                                    evaluations[activeAthleteId]?.[currentCategory.id]) ??
                                  null;

                                const subskillId = skill.skill_id ?? skill.id;
                                const ratingValue =
                                  (overridesForAthlete as Record<string, number | null>)[
                                    subskillId
                                  ] ??
                                  baseline ??
                                  null;

                                const ratingScale = getRatingScale(skill.rating_min, skill.rating_max);

                                return (
                                  <Paper key={subskillId} variant="outlined" sx={{ p: 1.5 }}>
                                    <Typography variant="body2" fontWeight={600}>
                                      {skill.name}
                                    </Typography>
                                    {skill.description && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: "block", mb: 0.5 }}
                                      >
                                        {skill.description}
                                      </Typography>
                                    )}

                                    <ToggleButtonGroup
                                      size="small"
                                      exclusive
                                      value={ratingValue}
                                      onChange={(_, newValue: number | null) => {
                                        if (!activeAthleteId) return;
                                        handleMobileSubskillRatingChange(
                                          activeAthleteId,
                                          currentCategory.id,
                                          subskillId,
                                          newValue,
                                        );
                                      }}
                                      aria-label={`${skill.name} rating`}
                                      disabled={!activeAthleteId}
                                    >
                                      {ratingScale.map((val) => (
                                        <ToggleButton
                                          key={val}
                                          value={val}
                                          sx={{
                                            borderRadius: "50%",
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
                                );
                              })}
                          </Stack>
                        )}
                      </Collapse>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 1,
                          mt: "auto",
                        }}
                      >
                        <Button
                          variant="outlined"
                          startIcon={<ChevronLeftIcon />}
                          disabled={!hasPreviousCategory}
                          onClick={() =>
                            setActiveCategoryIndex((prev) => Math.max(prev - 1, 0))
                          }
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
                            {saving ? "Saving..." : "Update"}
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
        ) : (
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
                  const field = params.field as string;
                  if (selectedAthletes.some((a) => a.id === field)) {
                    setActiveAthleteId(field);
                  }
                }}
                onCellDoubleClick={(params) => {
                  const field = params.field as string;
                  if (!selectedAthletes.some((a) => a.id === field)) return;
                  openSkillsDialog(field, String(params.id));
                }}
              />
            ) : (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  px: 2,
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Select a scorecard and at least one athlete to render the
                  evaluation matrix.
                </Typography>
              </Box>
            )}
          </Paper>
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
          setBulkDialogOpen(false);
          setBulkCategoryIds([]);
        }}
        onApply={handleApplyBulkEvaluation}
      />
    </Box>
  );
}
