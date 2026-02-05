import type { SkillFormState } from "./skillForm";

export type SkillFormErrors = Record<string, string>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateSkillForm(form: SkillFormState): SkillFormErrors {
  const nextErrors: SkillFormErrors = {};

  if (!form.title.trim()) nextErrors.title = "Skill title is required.";
  if (!form.category.trim()) nextErrors.category = "Category is required.";
  if (!form.level.trim()) nextErrors.level = "Level is required.";
  if (!form.visibility.trim()) nextErrors.visibility = "Visibility is required.";
  if (!form.status.trim()) nextErrors.status = "Status is required.";

  const sportId = form.sportId.trim();
  if (sportId && !UUID_RE.test(sportId)) {
    nextErrors.sportId = "Sport id must be a valid UUID.";
  }

  return nextErrors;
}
