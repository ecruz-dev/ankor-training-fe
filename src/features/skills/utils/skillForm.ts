export type SkillFormState = {
  title: string;
  category: string;
  description: string;
  level: string;
  visibility: string;
  status: string;
  sportId: string;
};

export const createInitialSkillForm = (sportId: string | null): SkillFormState => ({
  title: "",
  category: "",
  description: "",
  level: "",
  visibility: "public",
  status: "active",
  sportId: sportId ?? "",
});
