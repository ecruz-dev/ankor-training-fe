import type { DrillTag } from "../services/drillsService";

export type DrillFormState = {
  name: string;
  description: string;
  segmentId: string;
  minPlayers: string;
  maxPlayers: string;
  minAge: string;
  maxAge: string;
  youtubeUrl: string;
  skillTags: DrillTag[];
};

export const createInitialDrillForm = (): DrillFormState => ({
  name: "",
  description: "",
  segmentId: "",
  minPlayers: "",
  maxPlayers: "",
  minAge: "",
  maxAge: "",
  youtubeUrl: "",
  skillTags: [],
});
