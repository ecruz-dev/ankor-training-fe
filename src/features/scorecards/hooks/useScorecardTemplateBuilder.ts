import * as React from "react";
import {
  listSkills,
  skillLabel,
  type Skill,
} from "../../skills/services/skillsService";
import { createScorecardTemplate } from "../services/scorecardService";
import { DEBUG_SPORT_ID } from "../constants";
import { useAuth } from "../../../app/providers/AuthProvider";
import type {
  ScorecardCategoryRow,
  ScorecardLocationState,
  ScorecardSubskillRow,
  ScorecardTemplateDraft,
} from "../types";
import {
  buildCreateTemplatePayload,
  validateTemplateBeforeSave,
} from "../utils/scorecardTemplateForm";

type UseScorecardTemplateBuilderParams = {
  templateId?: string;
  locationState?: ScorecardLocationState | null;
  onSaved: () => void;
};

type UseScorecardTemplateBuilderResult = {
  template: ScorecardTemplateDraft;
  isSaving: boolean;
  categories: ScorecardCategoryRow[];
  activeCategoryId: string | null;
  activeCategory: ScorecardCategoryRow | null;
  subskills: ScorecardSubskillRow[];
  visibleSubskills: ScorecardSubskillRow[];
  skills: Skill[];
  skillsLoading: boolean;
  skillsError: string | null;
  skillTitleById: Record<string, string>;
  setTemplateField: (
    field: keyof ScorecardTemplateDraft,
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  toggleTemplateActive: (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => void;
  addCategory: () => void;
  deleteCategory: (id: string) => void;
  handleCategoryRowClick: (id: string) => void;
  updateCategoryRow: (newRow: ScorecardCategoryRow, oldRow: ScorecardCategoryRow) => ScorecardCategoryRow;
  addSubskill: () => void;
  deleteSubskill: (id: string) => void;
  updateSubskillRow: (newRow: ScorecardSubskillRow, oldRow: ScorecardSubskillRow) => ScorecardSubskillRow;
  saveTemplate: () => Promise<void>;
};

const getInitialIsActive = (stateRow?: ScorecardLocationState["row"]) => {
  if (!stateRow) return true;
  if (typeof stateRow.isActive === "boolean") return stateRow.isActive;
  if (typeof (stateRow as any).is_active === "boolean") {
    return Boolean((stateRow as any).is_active);
  }
  return true;
};

export default function useScorecardTemplateBuilder({
  templateId,
  locationState,
  onSaved,
}: UseScorecardTemplateBuilderParams): UseScorecardTemplateBuilderResult {
  const { profile, user, loading } = useAuth();
  const resolvedOrgId = profile?.default_org_id?.trim() || "";
  const resolvedUserId = user?.id?.trim() || "";
  const [template, setTemplate] = React.useState<ScorecardTemplateDraft>({
    id: templateId ?? "new",
    name: locationState?.row?.name ?? "",
    description: locationState?.row?.description ?? "",
    isActive: getInitialIsActive(locationState?.row),
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [categories, setCategories] = React.useState<ScorecardCategoryRow[]>([]);
  const [activeCategoryId, setActiveCategoryId] = React.useState<string | null>(
    null,
  );
  const [subskills, setSubskills] = React.useState<ScorecardSubskillRow[]>([]);
  const [skills, setSkills] = React.useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = React.useState(false);
  const [skillsError, setSkillsError] = React.useState<string | null>(null);

  const skillTitleById = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of skills) {
      map[s.id] = skillLabel(s);
    }
    return map;
  }, [skills]);

  React.useEffect(() => {
    if (loading) return;
    if (!resolvedOrgId) {
      setSkillsError("Missing org_id for this account.");
      return;
    }
    setSkillsLoading(true);
    setSkillsError(null);
    listSkills({ orgId: resolvedOrgId, sportId: DEBUG_SPORT_ID || undefined })
      .then(setSkills)
      .catch((err) => setSkillsError(err?.message || "Failed to load skills"))
      .finally(() => setSkillsLoading(false));
  }, [loading, resolvedOrgId]);

  React.useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  const activeCategory = React.useMemo(
    () => categories.find((category) => category.id === activeCategoryId) || null,
    [categories, activeCategoryId],
  );

  const visibleSubskills = React.useMemo(
    () =>
      activeCategoryId
        ? subskills.filter((row) => row.category_id === activeCategoryId)
        : [],
    [subskills, activeCategoryId],
  );

  const setTemplateField =
    (field: keyof ScorecardTemplateDraft) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setTemplate((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const toggleTemplateActive = (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    setTemplate((prev) => ({
      ...prev,
      isActive: checked,
    }));
  };

  const addCategory = () => {
    const nextIndex = categories.length + 1;
    const newId = `new-cat-${Date.now()}-${nextIndex}`;

    const newCategory: ScorecardCategoryRow = {
      id: newId,
      template_id: template.id,
      name: `Category ${nextIndex}`,
      description: "",
      position: nextIndex,
    };

    setCategories((prev) => [...prev, newCategory]);
    setActiveCategoryId(newId);
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((row) => row.id !== id));
    setSubskills((prev) => prev.filter((row) => row.category_id !== id));
    if (activeCategoryId === id) setActiveCategoryId(null);
  };

  const handleCategoryRowClick = (id: string) => {
    setActiveCategoryId(id);
  };

  const updateCategoryRow = React.useCallback(
    (newRow: ScorecardCategoryRow, oldRow: ScorecardCategoryRow) => {
      const updatedRow: ScorecardCategoryRow = {
        ...oldRow,
        ...newRow,
        position: Number.isNaN(Number(newRow.position))
          ? oldRow.position
          : Number(newRow.position),
      };

      setCategories((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? updatedRow : row)),
      );

      return updatedRow;
    },
    [],
  );

  const addSubskill = () => {
    if (!activeCategoryId) {
      alert("Select a category first to add subskills.");
      return;
    }

    const currentCountForCategory = subskills.filter(
      (row) => row.category_id === activeCategoryId,
    ).length;

    setSubskills((prev) => [
      ...prev,
      {
        id: `new-sub-${Date.now()}`,
        category_id: activeCategoryId,
        name: "",
        description: "",
        position: currentCountForCategory + 1,
        skill_id: "",
      },
    ]);
  };

  const deleteSubskill = (id: string) => {
    setSubskills((prev) => prev.filter((row) => row.id !== id));
  };

  const updateSubskillRow = React.useCallback(
    (newRow: ScorecardSubskillRow, oldRow: ScorecardSubskillRow) => {
      const updatedRow: ScorecardSubskillRow = {
        ...oldRow,
        ...newRow,
        position: Number.isNaN(Number(newRow.position))
          ? oldRow.position
          : Number(newRow.position),
      };

      setSubskills((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? updatedRow : row)),
      );

      return updatedRow;
    },
    [],
  );

  const saveTemplate = async () => {
    const message = validateTemplateBeforeSave({
      template,
      categories,
      subskills,
      orgId: resolvedOrgId,
      createdBy: resolvedUserId,
      sportId: DEBUG_SPORT_ID || undefined,
    });
    if (message) {
      alert(message);
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildCreateTemplatePayload({
        template,
        categories,
        subskills,
        orgId: resolvedOrgId,
        createdBy: resolvedUserId,
        sportId: DEBUG_SPORT_ID || undefined,
      });
      await createScorecardTemplate(payload);
      onSaved();
    } catch (err: any) {
      console.error("Create template failed", err);
      alert(err?.message || "Failed to create template.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    template,
    isSaving,
    categories,
    activeCategoryId,
    activeCategory,
    subskills,
    visibleSubskills,
    skills,
    skillsLoading,
    skillsError,
    skillTitleById,
    setTemplateField,
    toggleTemplateActive,
    addCategory,
    deleteCategory,
    handleCategoryRowClick,
    updateCategoryRow,
    addSubskill,
    deleteSubskill,
    updateSubskillRow,
    saveTemplate,
  };
}
