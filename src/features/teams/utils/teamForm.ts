import type { Team } from "../services/teamsService";

export type TeamFormState = {
  name: string;
  sportId: string;
  isActive: boolean;
};

export function createInitialTeamForm(): TeamFormState {
  return {
    name: "",
    sportId: "",
    isActive: true,
  };
}

export function toTeamFormState(team: Team): TeamFormState {
  return {
    name: team.name ?? "",
    sportId: team.sport_id ?? "",
    isActive: team.is_active ?? true,
  };
}
