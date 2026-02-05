import * as React from "react";
import type { ScorecardTemplateListRow } from "../types";
import { MOCK_SCORECARD_TEMPLATES } from "../data/mockScorecardTemplates";
import { filterScorecardTemplates } from "../utils/scorecardTemplatesList";

type UseScorecardTemplatesListResult = {
  rows: ScorecardTemplateListRow[];
  searchText: string;
  setSearchText: (value: string) => void;
};

export default function useScorecardTemplatesList(): UseScorecardTemplatesListResult {
  const [searchText, setSearchText] = React.useState("");

  const rows = React.useMemo(
    () => filterScorecardTemplates(MOCK_SCORECARD_TEMPLATES, searchText),
    [searchText],
  );

  return { rows, searchText, setSearchText };
}
