import type { TeamFormState } from "./teamForm";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateTeamForm(form: TeamFormState) {
  const nextErrors: Record<string, string> = {};

  if (!form.name.trim()) {
    nextErrors.name = "Team name is required.";
  }

  const sportId = form.sportId.trim();
  if (sportId && !UUID_RE.test(sportId)) {
    nextErrors.sportId = "Sport id must be a valid UUID.";
  }

  return nextErrors;
}
