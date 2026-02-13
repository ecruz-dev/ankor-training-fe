import * as React from "react";
import {
  listSkills,
  skillLabel,
  type Skill,
} from "../../skills/services/skillsService";
import {
  createScorecardTemplate,
  getScorecardTemplateDetail,
  updateScorecardTemplate,
} from "../services/scorecardService";
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
  buildUpdateTemplatePayload,
  isValidUuid,
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
  templateLoading: boolean;
  templateError: string | null;
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
  const { profile, user, loading, orgId } = useAuth();
  const resolvedOrgId =
    orgId?.trim() || profile?.default_org_id?.trim() || "";
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
  const [templateLoading, setTemplateLoading] = React.useState(false);
  const [templateError, setTemplateError] = React.useState<string | null>(null);
  const loadedTemplateIdRef = React.useRef<string | null>(null);
  const initialCategoryIdsRef = React.useRef<string[]>([]);
  const initialSubskillIdsRef = React.useRef<string[]>([]);
  const initialCategoryMapRef = React.useRef<Record<string, ScorecardCategoryRow>>({});
  const initialSubskillMapRef = React.useRef<Record<string, ScorecardSubskillRow>>({});

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
    if (loading) return;
    if (!resolvedOrgId) {
      setTemplateError("Missing org_id for this account.");
      return;
    }
    if (!templateId || templateId === "new") return;
    if (!isValidUuid(templateId)) return;
    if (loadedTemplateIdRef.current === templateId) return;

    loadedTemplateIdRef.current = templateId;
    let active = true;

    const loadTemplate = async () => {
      setTemplateLoading(true);
      setTemplateError(null);
      try {
        const detail = await getScorecardTemplateDetail(templateId, {
          orgId: resolvedOrgId,
        });

        if (!active) return;

        if (detail.template) {
          setTemplate((prev) => ({
            ...prev,
            id: templateId,
            name: detail.template?.name ?? prev.name,
            description: detail.template?.description ?? prev.description,
            isActive:
              typeof detail.template?.is_active === "boolean"
                ? detail.template.is_active
                : prev.isActive,
          }));
        }

        const mappedCategories: ScorecardCategoryRow[] = (detail.categories ?? []).map(
          (cat) => ({
            id: cat.id,
            template_id: cat.template_id,
            name: cat.name ?? "",
            description: cat.description ?? "",
            position: cat.position,
          }),
        );

        const mappedSubskills: ScorecardSubskillRow[] = (detail.subskills ?? []).map(
          (sub) => ({
            id: sub.id,
            category_id: sub.category_id,
            name: sub.name ?? "",
            description: sub.description ?? "",
            position: sub.position,
            skill_id: sub.skill_id ?? "",
          }),
        );

        setCategories(mappedCategories);
        setSubskills(mappedSubskills);
        initialCategoryIdsRef.current = mappedCategories
          .map((cat) => cat.id)
          .filter((id) => isValidUuid(id));
        initialSubskillIdsRef.current = mappedSubskills
          .map((sub) => sub.id)
          .filter((id) => isValidUuid(id));
        initialCategoryMapRef.current = mappedCategories.reduce<Record<string, ScorecardCategoryRow>>(
          (acc, cat) => {
            acc[cat.id] = cat;
            return acc;
          },
          {},
        );
        initialSubskillMapRef.current = mappedSubskills.reduce<Record<string, ScorecardSubskillRow>>(
          (acc, sub) => {
            acc[sub.id] = sub;
            return acc;
          },
          {},
        );
      } catch (err) {
        console.error("Failed to load scorecard template details", err);
        if (active) {
          loadedTemplateIdRef.current = null;
          setTemplateError(
            err instanceof Error
              ? err.message
              : "Failed to load scorecard template.",
          );
        }
      } finally {
        if (active) setTemplateLoading(false);
      }
    };

    void loadTemplate();

    return () => {
      active = false;
    };
  }, [loading, resolvedOrgId, templateId]);

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
      const isEditing =
        templateId && templateId !== "new" && isValidUuid(templateId);

      if (isEditing) {
        const currentCategoryIds = new Set(
          categories.map((cat) => cat.id).filter((id) => isValidUuid(id)),
        );

        const categoryEdited = (cat: ScorecardCategoryRow) => {
          const initial = initialCategoryMapRef.current[cat.id];
          if (!initial) return false;
          return (
            cat.name.trim() !== initial.name.trim() ||
            (cat.description ?? "") !== (initial.description ?? "") ||
            Number(cat.position) !== Number(initial.position)
          );
        };

        const categoriesToReplace = new Set<string>();
        categories.forEach((cat) => {
          if (isValidUuid(cat.id) && categoryEdited(cat)) {
            categoriesToReplace.add(cat.id);
          }
        });

        const removedCategoryIds = initialCategoryIdsRef.current.filter(
          (id) => !currentCategoryIds.has(id) || categoriesToReplace.has(id),
        );

        const categoryIdsToAdd = new Set<string>();
        const addCategories = categories.filter((cat) => {
          if (!isValidUuid(cat.id)) {
            categoryIdsToAdd.add(cat.id);
            return true;
          }
          if (categoriesToReplace.has(cat.id)) {
            categoryIdsToAdd.add(cat.id);
            return true;
          }
          return false;
        });

        const currentSubskillById: Record<string, ScorecardSubskillRow> = {};
        subskills.forEach((sub) => {
          currentSubskillById[sub.id] = sub;
        });

        const subskillEdited = (sub: ScorecardSubskillRow) => {
          const initial = initialSubskillMapRef.current[sub.id];
          if (!initial) return false;
          return (
            sub.name.trim() !== initial.name.trim() ||
            (sub.description ?? "") !== (initial.description ?? "") ||
            Number(sub.position) !== Number(initial.position) ||
            (sub.skill_id ?? "").trim() !== (initial.skill_id ?? "").trim() ||
            sub.category_id !== initial.category_id
          );
        };

        const editedSubskillIds = new Set<string>();
        subskills.forEach((sub) => {
          if (isValidUuid(sub.id) && subskillEdited(sub)) {
            editedSubskillIds.add(sub.id);
          }
        });

        const categoryIdsToRemoveOrReplace = new Set<string>(removedCategoryIds);

        const removedSubskillIds = initialSubskillIdsRef.current.filter((id) => {
          const current = currentSubskillById[id];
          if (!current) return true;
          if (editedSubskillIds.has(id)) return true;
          if (categoryIdsToRemoveOrReplace.has(current.category_id)) return true;
          return false;
        });

        const addSubskills = subskills.filter((sub) => {
          const isNew = !isValidUuid(sub.id);
          const isEdited = isValidUuid(sub.id) && editedSubskillIds.has(sub.id);
          if (!isNew && !isEdited) return false;
          if (categoryIdsToAdd.has(sub.category_id)) return false;
          if (categoryIdsToRemoveOrReplace.has(sub.category_id)) return false;
          return true;
        });

        const payload = buildUpdateTemplatePayload({
          template,
          subskills,
          orgId: resolvedOrgId,
          sportId: DEBUG_SPORT_ID || undefined,
          addCategories,
          addSubskills,
          removeCategoryIds: removedCategoryIds,
          removeSubskillIds: removedSubskillIds,
        });

        await updateScorecardTemplate(templateId, payload);
      } else {
        const payload = buildCreateTemplatePayload({
          template,
          categories,
          subskills,
          orgId: resolvedOrgId,
          createdBy: resolvedUserId,
          sportId: DEBUG_SPORT_ID || undefined,
        });
        await createScorecardTemplate(payload);
      }
      onSaved();
    } catch (err: any) {
      console.error("Save template failed", err);
      alert(err?.message || "Failed to save template.");
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
    templateLoading,
    templateError,
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
