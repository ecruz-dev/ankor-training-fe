import * as React from "react";
import type { ScorecardTemplateListRow } from "../types";
import { filterScorecardTemplates } from "../utils/scorecardTemplatesList";
import { listScorecardTemplates } from "../services/scorecardService";
import { useAuth } from "../../../app/providers/AuthProvider";

type UseScorecardTemplatesListResult = {
  rows: ScorecardTemplateListRow[];
  loading: boolean;
  error: string | null;
  searchText: string;
  setSearchText: (value: string) => void;
};

export default function useScorecardTemplatesList(): UseScorecardTemplatesListResult {
  const { profile, loading: authLoading } = useAuth();
  const [searchText, setSearchText] = React.useState("");
  const [templates, setTemplates] = React.useState<ScorecardTemplateListRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    const loadTemplates = async () => {
      if (authLoading) return;
      const orgId = profile?.default_org_id?.trim();
      if (!orgId) {
        setTemplates([]);
        setError("Missing org_id for this account.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await listScorecardTemplates({
          orgId,
          limit: 200,
          offset: 0,
        });
        if (!active) return;
        setTemplates(result ?? []);
      } catch (err) {
        if (!active) return;
        setTemplates([]);
        setError(
          err instanceof Error ? err.message : "Failed to load scorecard templates.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadTemplates();

    return () => {
      active = false;
    };
  }, [authLoading, profile]);

  const rows = React.useMemo(() => {
    const filtered = filterScorecardTemplates(templates, searchText);
    return [...filtered].sort((a, b) => {
      const aTime = new Date(a.updated_at || a.created_at).getTime();
      const bTime = new Date(b.updated_at || b.created_at).getTime();
      return bTime - aTime;
    });
  }, [templates, searchText]);

  return { rows, loading: authLoading || loading, error, searchText, setSearchText };
}
