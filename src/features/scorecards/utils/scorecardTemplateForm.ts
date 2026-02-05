import type { CreateScorecardTemplateInput } from "../services/scorecardService";
import type {
  ScorecardCategoryRow,
  ScorecardSubskillRow,
  ScorecardTemplateDraft,
} from "../types";
import { UUID_RE } from "../constants";

type ValidateParams = {
  template: ScorecardTemplateDraft;
  categories: ScorecardCategoryRow[];
  subskills: ScorecardSubskillRow[];
  orgId: string;
  createdBy: string;
  sportId?: string;
};

type BuildPayloadParams = {
  template: ScorecardTemplateDraft;
  categories: ScorecardCategoryRow[];
  subskills: ScorecardSubskillRow[];
  orgId: string;
  createdBy: string;
  sportId?: string;
};

export const isValidUuid = (value: string) => UUID_RE.test(value);

export const validateTemplateBeforeSave = ({
  template,
  categories,
  subskills,
  orgId,
  createdBy,
  sportId,
}: ValidateParams): string | null => {
  if (!template.name.trim()) return "Template name is required.";

  if (!orgId) return "Missing org_id.";
  if (!createdBy) return "Missing createdBy.";
  if (!isValidUuid(orgId)) return "org_id must be a valid UUID.";
  if (!isValidUuid(createdBy)) return "createdBy must be a valid UUID.";
  if (sportId && !isValidUuid(sportId)) {
    return "sport_id must be a valid UUID (if provided).";
  }

  if (categories.length === 0) {
    return "You must add at least one category to this template.";
  }

  const errs: string[] = [];
  for (const category of categories) {
    const categorySubskills = subskills.filter(
      (row) => row.category_id === category.id,
    );
    const validSubs = categorySubskills.filter(
      (row) => row.skill_id && isValidUuid(row.skill_id),
    );
    if (validSubs.length === 0) {
      errs.push(category.name || "Untitled Category");
    }
  }

  if (errs.length > 0) {
    return `Each category must have at least one subskill with a valid Skill.\nMissing for: ${errs.join(
      ", ",
    )}`;
  }

  return null;
};

export const buildCreateTemplatePayload = ({
  template,
  categories,
  subskills,
  orgId,
  createdBy,
  sportId,
}: BuildPayloadParams): CreateScorecardTemplateInput => {
  const sortedCategories = [...categories].sort(
    (a, b) => a.position - b.position,
  );

  const mappedCats = sortedCategories.map((category) => {
    const categorySubskills = subskills
      .filter((row) => row.category_id === category.id)
      .filter((row) => row.skill_id && isValidUuid(row.skill_id))
      .sort((a, b) => a.position - b.position)
      .map((row) => ({
        name: row.name?.trim() || "",
        description: row.description?.trim() || null,
        position: row.position,
        skill_id: row.skill_id,
      }));

    return {
      name: category.name?.trim() || "",
      description: category.description?.trim() || null,
      position: category.position,
      subskills: categorySubskills,
    };
  });

  return {
    createdBy,
    org_id: orgId,
    sport_id: sportId || null,
    name: template.name.trim(),
    description: template.description?.trim() || null,
    isActive: Boolean(template.isActive),
    categories: mappedCats,
  };
};
