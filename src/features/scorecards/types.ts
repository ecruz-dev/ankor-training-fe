export type ScorecardTemplateDraft = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
};

export type ScorecardTemplateListRow = {
  id: string;
  org_id: string | null;
  sport_id: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type ScorecardCategoryRow = {
  id: string;
  template_id: string;
  name: string;
  description: string;
  position: number;
};

export type ScorecardSubskillRow = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  position: number;
  skill_id: string;
};

export type ScorecardLocationState = {
  row?: Partial<ScorecardTemplateDraft>;
};
