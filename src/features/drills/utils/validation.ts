import type { DrillFormState } from "./drillForm";

export type DrillFormErrors = Record<string, string>;

export function validateDrillForm(
  form: DrillFormState,
  youtubeId: string | null,
  options: { validateYouTubeUrl?: boolean } = {},
): DrillFormErrors {
  const nextErrors: DrillFormErrors = {};
  const { validateYouTubeUrl = true } = options;

  if (!form.name.trim()) nextErrors.name = "Drill name is required.";
  if (!form.segmentId) nextErrors.segmentId = "Segment is required.";

  const minPlayers = Number(form.minPlayers);
  const maxPlayers = Number(form.maxPlayers);
  if (form.minPlayers && form.maxPlayers && minPlayers > maxPlayers) {
    nextErrors.maxPlayers = "Max players must be greater than min players.";
  }

  const minAge = Number(form.minAge);
  const maxAge = Number(form.maxAge);
  if (form.minAge && form.maxAge && minAge > maxAge) {
    nextErrors.maxAge = "Max age must be greater than min age.";
  }

  if (validateYouTubeUrl && form.youtubeUrl.trim() && !youtubeId) {
    nextErrors.youtubeUrl = "Enter a valid YouTube URL.";
  }

  return nextErrors;
}
