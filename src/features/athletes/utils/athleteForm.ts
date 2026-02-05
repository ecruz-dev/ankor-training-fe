import type { AthleteListItem } from "../services/athleteService";

export type AthleteFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  cellNumber: string;
  username: string;
  graduationYear: string;
};

export function createInitialAthleteForm(
  overrides: Partial<AthleteFormState> = {},
): AthleteFormState {
  return {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    cellNumber: "",
    username: "",
    graduationYear: "",
    ...overrides,
  };
}

export function toAthleteFormState(athlete: AthleteListItem): AthleteFormState {
  return {
    firstName: athlete.first_name ?? "",
    lastName: athlete.last_name ?? "",
    email: athlete.email ?? "",
    password: "",
    cellNumber: athlete.cell_number ?? athlete.phone ?? "",
    username: athlete.username ?? "",
    graduationYear:
      athlete.graduation_year !== null && athlete.graduation_year !== undefined
        ? String(athlete.graduation_year)
        : "",
  };
}
