import * as React from "react";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import {
  getEvaluationById,
  type EvaluationDetailRow,
} from "../api/evaluationsApi";
import { listScorecardSubskillsByCategory } from "../../scorecards/services/scorecardService";
import type {
  Athlete,
  EvaluationsState,
  ScorecardCategory,
  ScorecardSubskill,
} from "../types";
import { formatDateTime } from "../utils/formatDateTime";

type EvaluationMeta = {
  templateName: string;
  teamName: string;
  createdAt: string;
};

export default function ViewEvaluationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { profile, loading: authLoading } = useAuth();
  const orgId = profile?.default_org_id?.trim() || null;
  const isAthlete = profile?.role === "athlete";

  const [meta, setMeta] = React.useState<EvaluationMeta | null>(null);
  const [categories, setCategories] = React.useState<ScorecardCategory[]>([]);
  const [athletes, setAthletes] = React.useState<Athlete[]>([]);
  const [activeAthleteId, setActiveAthleteId] = React.useState<string | null>(
    null,
  );
  const [evaluations, setEvaluations] = React.useState<EvaluationsState>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading) return;
    if (!id) {
      setError("Missing evaluation id in route.");
      return;
    }
    if (!orgId) {
      setError("Missing org_id. Please sign in again.");
      return;
    }

    let active = true;

    const loadDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const detail: EvaluationDetailRow = await getEvaluationById(id, { orgId });
        if (!active) return;

        setMeta({
          templateName: detail.template_name ?? "Scorecard",
          teamName: detail.team_name ?? "Unassigned team",
          createdAt: detail.created_at ?? "",
        });

        const nextCategories = (detail.categories ?? []) as ScorecardCategory[];
        setCategories(nextCategories);

        const mappedAthletes: Athlete[] = (detail.athletes ?? []).map((ath) => {
          const fullName =
            [ath.first_name, ath.last_name].filter(Boolean).join(" ") ||
            "Unnamed athlete";
          return {
            id: ath.id,
            full_name: fullName,
            team_id: detail.teams_id ?? "",
          };
        });

        setAthletes(mappedAthletes);

        if (nextCategories.length === 0 || mappedAthletes.length === 0) {
          setEvaluations({});
          return;
        }

        const subskillResults = await Promise.allSettled(
          nextCategories.map((cat) =>
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

        const subskillToCategory = new Map<string, string>();

        for (const result of subskillResults) {
          if (result.status !== "fulfilled") continue;
          const { categoryId, subskills } = result.value;
          const casted = subskills as ScorecardSubskill[];
          casted.forEach((sub) => {
            const subskillKey = sub.skill_id ?? sub.id;
            subskillToCategory.set(subskillKey, sub.category_id);
          });
        }

        const evalState: EvaluationsState = {};

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

        });

        setEvaluations(evalState);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Failed to load evaluation.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadDetail();

    return () => {
      active = false;
    };
  }, [authLoading, id, orgId]);

  React.useEffect(() => {
    if (athletes.length === 0) {
      setActiveAthleteId(null);
      return;
    }
    setActiveAthleteId((prev) => {
      if (prev && athletes.some((athlete) => athlete.id === prev)) return prev;
      return athletes[0].id;
    });
  }, [athletes]);

  const columns = React.useMemo<GridColDef[]>(() => {
    const baseColumns: GridColDef[] = [
      {
        field: "categoryName",
        headerName: "Category",
        flex: 1.4,
        sortable: false,
      },
    ];

    const athleteColumns: GridColDef[] = athletes.map((athlete) => ({
      field: athlete.id,
      headerName: athlete.full_name,
      flex: 1,
      sortable: false,
      valueFormatter: (value) =>
        value === null || value === undefined ? "-" : String(value),
    }));

    return [...baseColumns, ...athleteColumns];
  }, [athletes]);

  const rows = React.useMemo(
    () =>
      categories.map((cat) => {
        const scoresByAthlete = athletes.reduce<Record<string, number | null>>(
          (acc, athlete) => {
            const evalForAthlete = evaluations[athlete.id] ?? {};
            acc[athlete.id] = evalForAthlete[cat.id] ?? null;
            return acc;
          },
          {},
        );

        return {
          id: cat.id,
          categoryName: cat.name,
          ...scoresByAthlete,
        };
      }),
    [categories, athletes, evaluations],
  );

  const summaryLabel = meta?.createdAt ? formatDateTime(meta.createdAt) : "";

  const getRatingChip = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return { label: "Not rated", color: "default" as const };
    }
    if (value < 3) {
      return { label: value.toFixed(1), color: "warning" as const };
    }
    return { label: value.toFixed(1), color: "success" as const };
  };

  if (loading || authLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Loading evaluation...
          </Typography>
          <Button variant="outlined" onClick={() => navigate("/evaluations")}>
            Back
          </Button>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h6" color="error">
            {error}
          </Typography>
          <Button variant="outlined" onClick={() => navigate("/evaluations")}>
            Back
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Evaluation Detail
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {meta?.templateName ?? "Scorecard"}
              {summaryLabel ? ` • ${summaryLabel}` : ""}
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate("/evaluations")}>
              Back
            </Button>
            {!isAthlete ? (
              <Button
                variant="contained"
                onClick={() => navigate(`/evaluations/${id}/edit`)}
              >
                Edit evaluation
              </Button>
            ) : null}
          </Stack>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Scorecard
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {meta?.templateName ?? "-"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Team
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {meta?.teamName ?? "-"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Evaluation ID
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {id}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {isMobile ? (
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              {athletes.length > 1 ? (
                <TextField
                  select
                  size="small"
                  label="Athlete"
                  value={activeAthleteId ?? ""}
                  onChange={(event) =>
                    setActiveAthleteId(event.target.value || null)
                  }
                  fullWidth
                >
                  {athletes.map((athlete) => (
                    <MenuItem key={athlete.id} value={athlete.id}>
                      {athlete.full_name}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Athlete
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {athletes[0]?.full_name ?? "-"}
                  </Typography>
                </Stack>
              )}
            </Paper>

            {categories.length > 0 && activeAthleteId ? (
              <Stack spacing={1.5}>
                {categories.map((cat) => {
                  const rating = evaluations[activeAthleteId]?.[cat.id] ?? null;
                  const chip = getRatingChip(rating);
                  return (
                    <Paper key={cat.id} variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={1}>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Typography variant="subtitle1" fontWeight={600}>
                            {cat.name}
                          </Typography>
                          <Chip
                            label={chip.label}
                            color={chip.color}
                            size="small"
                            variant={chip.color === "default" ? "outlined" : "filled"}
                          />
                        </Stack>
                        {cat.description ? (
                          <Typography variant="body2" color="text.secondary">
                            {cat.description}
                          </Typography>
                        ) : null}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            ) : (
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  No evaluation data available.
                </Typography>
              </Paper>
            )}
          </Stack>
        ) : (
          <Paper sx={{ height: 560, p: 1 }}>
            {categories.length > 0 && athletes.length > 0 ? (
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
                  No evaluation data available.
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
