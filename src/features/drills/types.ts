export type DrillFilters = {
  tags: Set<string>;
  segmentId: string;
  levels: Set<string>;
  minAge: string;
  maxAge: string;
  minPlayers: string;
  maxPlayers: string;
};

export type DrillCard = {
  id: string;
  name: string;
  segment?: string | null;
  tags?: string[];
  level?: string | null;
  min_players?: number | null;
  max_players?: number | null;
  duration_min?: number | null;
  created_at: string;
  video_url: string;
  thumbnail_url?: string | null;
};

export type DrillFilterField =
  | "segmentId"
  | "minAge"
  | "maxAge"
  | "minPlayers"
  | "maxPlayers";
