import * as React from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import {
  createScorecardTemplate,
  type ScorecardCategory,
  type ScorecardSubskillRow,
} from "../services/scorecardService";
import { listSkills, type Skill } from "../../skills/services/skillsService";

type TemplateState = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  sport_id: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value?: string | null) => !!value && UUID_RE.test(value);

const sanitizeText = (value: string) => value.trim();

const formatCategoryName = (idx: number) => `Category ${idx + 1}`;

const coerceNumber = (value: unknown, fallback: number) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export default function NewScorecardPage() {
  const navigate = useNavigate();
  const { orgId, loading: authLoading } = useAuth();
  const templateId = "new-template";

  const [template, setTemplate] = React.useState<TemplateState>({
    id: "",
    name: "",
    description: "",
    isActive: true,
    sport_id: null,
  });
  const [categories, setCategories] = React.useState<ScorecardCategory[]>([]);
  const [subskills, setSubskills] = React.useState<ScorecardSubskillRow[]>([]);
  const [activeCategoryId, setActiveCategoryId] = React.useState<string | null>(
    null,
  );

  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const [skills, setSkills] = React.useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = React.useState(false);
  const [skillsError, setSkillsError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading) return;
    if (!orgId?.trim()) return;

    let active = true;
    setSkillsLoading(true);
    setSkillsError(null);

    listSkills({
      orgId,
      sportId: template.sport_id ?? undefined,
      limit: 200,
      offset: 0,
    })
      .then((items) => {
        if (!active) return;
        setSkills(items ?? []);
      })
      .catch((err: any) => {
        if (!active) return;
        setSkills([]);
        setSkillsError(err?.message || "Failed to load skills.");
      })
      .finally(() => {
        if (active) setSkillsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, orgId, template.sport_id]);

  const skillLabelById = React.useMemo(() => {
    const map: Record<string, string> = {};
    skills.forEach((skill) => {
      map[skill.id] = skill.title || skill.category || "Skill";
    });
    return map;
  }, [skills]);

  const activeCategory = React.useMemo(
    () => categories.find((cat) => cat.id === activeCategoryId) ?? null,
    [categories, activeCategoryId],
  );

  const visibleSubskills = React.useMemo(
    () =>
      activeCategoryId
        ? subskills.filter((s) => s.category_id === activeCategoryId)
        : [],
    [subskills, activeCategoryId],
  );

  const handleTemplateChange =
    (field: keyof TemplateState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setTemplate((prev) => ({ ...prev, [field]: value }));
    };

  const handleToggleActive = () => {
    setTemplate((prev) => ({ ...prev, isActive: !prev.isActive }));
  };

  const handleAddCategory = () => {
    const nextPosition = categories.length + 1;
    const newCategory: ScorecardCategory = {
      id: `new-cat-${Date.now()}`,
      template_id: templateId,
      name: formatCategoryName(categories.length),
      description: "",
      position: nextPosition,
    };
    setCategories((prev) => [...prev, newCategory]);
    setActiveCategoryId(newCategory.id);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
    setSubskills((prev) => prev.filter((sub) => sub.category_id !== categoryId));
    setActiveCategoryId((prev) => {
      if (prev !== categoryId) return prev;
      const remaining = categories.filter((cat) => cat.id !== categoryId);
      return remaining[0]?.id ?? null;
    });
  };

  const handleCategoryUpdate = (
    categoryId: string,
    field: keyof ScorecardCategory,
    value: string,
  ) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        if (field === "position") {
          return { ...cat, position: coerceNumber(value, cat.position) };
        }
        return { ...cat, [field]: value };
      }),
    );
  };

  const handleAddSubskill = () => {
    if (!activeCategoryId) return;
    const existing = subskills.filter((s) => s.category_id === activeCategoryId);
    const nextPosition = existing.length + 1;
    const newSubskill: ScorecardSubskillRow = {
      id: `new-sub-${Date.now()}`,
      category_id: activeCategoryId,
      skill_id: "",
      name: "New subskill",
      description: "",
      position: nextPosition,
      rating_min: 1,
      rating_max: 5,
      created_at: null,
    };
    setSubskills((prev) => [...prev, newSubskill]);
  };

  const handleDeleteSubskill = (subskillId: string) => {
    setSubskills((prev) => prev.filter((sub) => sub.id !== subskillId));
  };

  const handleSubskillUpdate = (
    subskillId: string,
    field: keyof ScorecardSubskillRow,
    value: string,
  ) => {
    setSubskills((prev) =>
      prev.map((sub) => {
        if (sub.id !== subskillId) return sub;
        if (field === "position") {
          return { ...sub, position: coerceNumber(value, sub.position) };
        }
        if (field === "rating_min") {
          return { ...sub, rating_min: coerceNumber(value, sub.rating_min) };
        }
        if (field === "rating_max") {
          return { ...sub, rating_max: coerceNumber(value, sub.rating_max) };
        }
        return { ...sub, [field]: value };
      }),
    );
  };

  const validateBeforeSave = () => {
    if (!template.name.trim()) {
      return "Template name is required.";
    }
    if (!orgId?.trim()) {
      return "Missing org_id.";
    }
    if (categories.length === 0) {
      return "You must add at least one category.";
    }
    const missing: string[] = [];
    categories.forEach((cat) => {
      const catSubskills = subskills.filter((s) => s.category_id === cat.id);
      const valid = catSubskills.filter((s) => isUuid(s.skill_id ?? ""));
      if (valid.length === 0) {
        missing.push(cat.name || "Untitled Category");
      }
    });
    if (missing.length > 0) {
      return `Each category must have at least one subskill with a valid Skill. Missing for: ${missing.join(
        ", ",
      )}`;
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateBeforeSave();
    if (validationError) {
      setSaveError(validationError);
      return;
    }
    if (!orgId?.trim()) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const addCategoryPayload = categories.map((cat, idx) => {
        const catSubskills = subskills
          .filter((sub) => sub.category_id === cat.id)
          .filter((sub) => isUuid(sub.skill_id ?? ""))
          .sort((a, b) => a.position - b.position)
          .map((sub, subIdx) => ({
            name: sanitizeText(sub.name) || "Subskill",
            description: sub.description?.trim() || null,
            position: Number.isFinite(Number(sub.position))
              ? Number(sub.position)
              : subIdx + 1,
            skill_id: (sub.skill_id ?? "").trim(),
            rating_min: Number.isFinite(Number(sub.rating_min))
              ? Number(sub.rating_min)
              : undefined,
            rating_max: Number.isFinite(Number(sub.rating_max))
              ? Number(sub.rating_max)
              : undefined,
          }));

        return {
          name: sanitizeText(cat.name) || `Category ${idx + 1}`,
          description: cat.description?.trim() || null,
          position: Number.isFinite(Number(cat.position))
            ? Number(cat.position)
            : idx + 1,
          subskills: catSubskills,
        };
      });

      const detail = await createScorecardTemplate({
        org_id: orgId,
        sport_id: template.sport_id ?? null,
        name: template.name.trim(),
        description: template.description.trim() || null,
        isActive: template.isActive,
        add_categories: addCategoryPayload,
      });

      const newId = detail.template?.id ?? "";
      if (newId) {
        navigate(`/scorecards/${newId}/edit`, { replace: true });
      } else {
        navigate("/scorecards");
      }
    } catch (err: any) {
      setSaveError(err?.message || "Failed to create scorecard template.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5} sx={{ maxWidth: 1100, mx: "auto" }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => navigate(-1)} size="small">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="h5" fontWeight={700}>
            New Scorecard Template
          </Typography>
        </Stack>

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                label="Template name"
                value={template.name}
                onChange={handleTemplateChange("name")}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <TextField
                label="Description"
                value={template.description}
                onChange={handleTemplateChange("description")}
                fullWidth
                multiline
                minRows={3}
              />
            </Box>
            <Box
              sx={{
                minWidth: { xs: "auto", md: 240 },
                display: "flex",
                flexDirection: "column",
                gap: 2,
                justifyContent: "space-between",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Switch checked={template.isActive} onChange={handleToggleActive} />
                <Typography variant="body2">
                  {template.isActive ? "Active" : "Inactive"}
                </Typography>
              </Stack>
              <Stack spacing={1} direction={{ xs: "column", sm: "row" }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/scorecards")}
                  disabled={isSaving}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={isSaving}
                  fullWidth
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </Stack>
            </Box>
          </Stack>
          {saveError && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {saveError}
            </Typography>
          )}
        </Paper>

        <Divider />

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: 2 }}
          >
            <Typography variant="h6" fontWeight={600}>
              Categories
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddCategory}
            >
              Add Category
            </Button>
          </Stack>

          {categories.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No categories yet. Add one to get started.
            </Typography>
          )}

          <Stack spacing={2}>
            {categories.map((cat, idx) => {
              const isActive = cat.id === activeCategoryId;
              return (
                <Paper
                  key={cat.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderColor: isActive ? "primary.main" : "divider",
                    bgcolor: isActive ? "action.selected" : "background.paper",
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography variant="subtitle1" fontWeight={600}>
                        {cat.name || formatCategoryName(idx)}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Button
                          size="small"
                          variant={isActive ? "contained" : "outlined"}
                          onClick={() => setActiveCategoryId(cat.id)}
                        >
                          {isActive ? "Selected" : "Select"}
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteCategory(cat.id)}
                          aria-label="Delete category"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>

                    <TextField
                      label="Name"
                      value={cat.name}
                      onChange={(event) =>
                        handleCategoryUpdate(cat.id, "name", event.target.value)
                      }
                      fullWidth
                    />
                    <TextField
                      label="Description"
                      value={cat.description ?? ""}
                      onChange={(event) =>
                        handleCategoryUpdate(
                          cat.id,
                          "description",
                          event.target.value,
                        )
                      }
                      fullWidth
                      multiline
                      minRows={2}
                    />
                    <TextField
                      label="Position"
                      type="number"
                      value={cat.position}
                      onChange={(event) =>
                        handleCategoryUpdate(cat.id, "position", event.target.value)
                      }
                      inputProps={{ min: 1 }}
                      fullWidth
                    />
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Subskills / Skills
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeCategory
                  ? `Category: ${activeCategory.name || "Untitled Category"}`
                  : "Select a category to manage its subskills."}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddSubskill}
              disabled={!activeCategoryId}
            >
              Add Subskill
            </Button>
          </Stack>

          {!activeCategoryId && (
            <Typography variant="body2" color="text.secondary">
              Choose a category above to see and edit its subskills.
            </Typography>
          )}

          {activeCategoryId && visibleSubskills.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No subskills yet. Add one to begin defining the rubric.
            </Typography>
          )}

          <Stack spacing={2}>
            {visibleSubskills.map((sub, idx) => (
              <Paper key={sub.id} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      {sub.name || `Subskill ${idx + 1}`}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteSubskill(sub.id)}
                      aria-label="Delete subskill"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>

                  <TextField
                    label="Name"
                    value={sub.name}
                    onChange={(event) =>
                      handleSubskillUpdate(sub.id, "name", event.target.value)
                    }
                    fullWidth
                  />
                  <TextField
                    label="Description"
                    value={sub.description ?? ""}
                    onChange={(event) =>
                      handleSubskillUpdate(
                        sub.id,
                        "description",
                        event.target.value,
                      )
                    }
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <TextField
                    label="Position"
                    type="number"
                    value={sub.position}
                    onChange={(event) =>
                      handleSubskillUpdate(sub.id, "position", event.target.value)
                    }
                    inputProps={{ min: 1 }}
                    fullWidth
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField
                      label="Rating min"
                      type="number"
                      value={sub.rating_min ?? 1}
                      onChange={(event) =>
                        handleSubskillUpdate(
                          sub.id,
                          "rating_min",
                          event.target.value,
                        )
                      }
                      inputProps={{ min: 1 }}
                      fullWidth
                    />
                    <TextField
                      label="Rating max"
                      type="number"
                      value={sub.rating_max ?? 5}
                      onChange={(event) =>
                        handleSubskillUpdate(
                          sub.id,
                          "rating_max",
                          event.target.value,
                        )
                      }
                      inputProps={{ min: 1 }}
                      fullWidth
                    />
                  </Stack>
                  <TextField
                    label="Skill"
                    select
                    value={sub.skill_id ?? ""}
                    onChange={(event) =>
                      handleSubskillUpdate(sub.id, "skill_id", event.target.value)
                    }
                    fullWidth
                    disabled={skillsLoading || !!skillsError}
                    helperText={
                      skillsLoading
                        ? "Loading skills..."
                        : skillsError
                          ? "Skills are unavailable."
                          : undefined
                    }
                  >
                    <MenuItem value="" disabled>
                      Select a skill
                    </MenuItem>
                    {skills.map((skill) => (
                      <MenuItem key={skill.id} value={skill.id}>
                        {skillLabelById[skill.id] ?? skill.title}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
