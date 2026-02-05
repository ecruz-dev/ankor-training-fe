export const FILTER_ALL = "all";
export const STATS_LIMIT = 6;
export const COACHING_POINTS_LIMIT = 4;
export const PAGE_SIZE = 12;
export const DEBUG_SPORT_ID =
  ((typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_DEBUG_SPORT_ID) as string) ||
  "";

export const SKILL_LEVEL_OPTIONS = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
  { id: "all", label: "All" },
];

export const SKILL_VISIBILITY_OPTIONS = [
  { id: "public", label: "Public" },
  { id: "org", label: "Organization" },
  { id: "private", label: "Private" },
];

export const SKILL_STATUS_OPTIONS = [
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "draft", label: "Draft" },
];
