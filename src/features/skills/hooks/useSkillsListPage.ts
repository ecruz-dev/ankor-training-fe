import * as React from "react";
import {
  getSkillMediaPlay,
  listSkillsPage,
  type Skill,
} from "../services/skillsService";
import { DEBUG_SPORT_ID, PAGE_SIZE } from "../constants";
import { getCategoryOptions } from "../utils/skillsList";
import type { SkillListFilters } from "../types";
import { useAuth } from "../../../app/providers/AuthProvider";

type PlayState = {
  open: boolean;
  skill: Skill | null;
  url: string | null;
  loading: boolean;
  error: string | null;
};

const createEmptyFilters = (): SkillListFilters => ({
  category: "",
});

export default function useSkillsListPage() {
  const { profile, loading: authLoading } = useAuth();
  const [query, setQuery] = React.useState("");
  const [filters, setFilters] = React.useState<SkillListFilters>(
    createEmptyFilters(),
  );
  const [skills, setSkills] = React.useState<Skill[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [playState, setPlayState] = React.useState<PlayState>({
    open: false,
    skill: null,
    url: null,
    loading: false,
    error: null,
  });
  const playRequestIdRef = React.useRef(0);

  const categoryOptions = React.useMemo(
    () => getCategoryOptions(skills),
    [skills],
  );

  React.useEffect(() => {
    let active = true;

    const loadSkills = async () => {
      if (authLoading) {
        return;
      }

      const resolvedOrgId = profile?.default_org_id?.trim();
      if (!resolvedOrgId) {
        setLoadError("Missing org_id for this account.");
        return;
      }

      setLoading(true);
      setLoadError(null);
      try {
        const result = await listSkillsPage({
          orgId: resolvedOrgId,
          sportId: DEBUG_SPORT_ID || undefined,
          q: query,
          category: filters.category || undefined,
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        });
        if (!active) return;
        setSkills(result.items);
        setTotalCount(result.count ?? result.items.length);
      } catch (err) {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : "Failed to load skills.");
        setSkills([]);
        setTotalCount(0);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadSkills();

    return () => {
      active = false;
    };
  }, [
    authLoading,
    profile,
    query,
    filters.category,
    page,
  ]);

  const openPlay = React.useCallback(
    (skill: Skill) => {
      setPlayState({
        open: true,
        skill,
        url: null,
        loading: true,
        error: null,
      });

      const requestId = ++playRequestIdRef.current;
      const resolvedOrgId = profile?.default_org_id?.trim();

      void (async () => {
        try {
          const response = await getSkillMediaPlay(skill.id, {
            orgId: resolvedOrgId,
          });
          if (playRequestIdRef.current !== requestId) return;
          setPlayState((prev) => ({
            ...prev,
            url: response.play_url,
            loading: false,
          }));
        } catch (err) {
          if (playRequestIdRef.current !== requestId) return;
          setPlayState((prev) => ({
            ...prev,
            error:
              err instanceof Error
                ? err.message
                : "Failed to load skill video.",
            loading: false,
          }));
        }
      })();
    },
    [profile],
  );

  const closePlay = React.useCallback(() => {
    playRequestIdRef.current += 1;
    setPlayState({
      open: false,
      skill: null,
      url: null,
      loading: false,
      error: null,
    });
  }, []);

  const setQueryValue = React.useCallback((value: string) => {
    setQuery(value);
    setPage(1);
  }, []);

  const updateFilter = React.useCallback(
    (field: keyof SkillListFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
      setPage(1);
    },
    [],
  );

  const clearAll = React.useCallback(() => {
    setQuery("");
    setFilters(createEmptyFilters());
    setPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    query,
    filters,
    skills,
    loading,
    loadError,
    page,
    totalCount,
    totalPages,
    categoryOptions,
    playState,
    setPage,
    setQuery: setQueryValue,
    updateFilter,
    clearAll,
    openPlay,
    closePlay,
  };
}
