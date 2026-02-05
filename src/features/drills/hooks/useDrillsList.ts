import * as React from "react";
import {
  listDrills,
  listDrillSegments,
  listDrillTags,
  getDrillMediaPlay,
  type DrillTag,
} from "../services/drillsService";
import type { DrillCard, DrillFilterField } from "../types";
import type { SegmentOption } from "../utils/options";
import { normalizeTagOptions, toSegmentOptions } from "../utils/options";
import { createEmptyFilters, toOptionalNumber, toDrillCard } from "../utils/drillsList";
import { PAGE_SIZE } from "../constants";
import { useAuth } from "../../../app/providers/AuthProvider";

type PlayState = {
  open: boolean;
  drill: DrillCard | null;
  url: string | null;
  loading: boolean;
  error: string | null;
};

export default function useDrillsList() {
  const { profile, loading: authLoading } = useAuth();
  const [query, setQuery] = React.useState("");
  const [filters, setFilters] = React.useState(createEmptyFilters());
  const [drills, setDrills] = React.useState<DrillCard[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [segmentOptions, setSegmentOptions] = React.useState<SegmentOption[]>([]);
  const [segmentsLoading, setSegmentsLoading] = React.useState(false);
  const [segmentsError, setSegmentsError] = React.useState<string | null>(null);
  const [tagOptions, setTagOptions] = React.useState<DrillTag[]>([]);
  const [tagsLoading, setTagsLoading] = React.useState(false);
  const [tagsError, setTagsError] = React.useState<string | null>(null);
  const [playState, setPlayState] = React.useState<PlayState>({
    open: false,
    drill: null,
    url: null,
    loading: false,
    error: null,
  });
  const playRequestIdRef = React.useRef(0);

  const selectedTagIds = React.useMemo(
    () => Array.from(filters.tags),
    [filters.tags],
  );
  const selectedLevels = React.useMemo(
    () => Array.from(filters.levels),
    [filters.levels],
  );
  const tagLabelById = React.useMemo(() => {
    const map = new Map<string, string>();
    tagOptions.forEach((tag) => map.set(tag.id, tag.name));
    return map;
  }, [tagOptions]);

  React.useEffect(() => {
    let active = true;

    const loadDrills = async () => {
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
        const result = await listDrills({
          orgId: resolvedOrgId,
          name: query,
          skillTagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
          segmentIds: filters.segmentId ? [filters.segmentId] : undefined,
          levels: selectedLevels.length > 0 ? selectedLevels : undefined,
          minAge: toOptionalNumber(filters.minAge),
          maxAge: toOptionalNumber(filters.maxAge),
          minPlayers: toOptionalNumber(filters.minPlayers),
          maxPlayers: toOptionalNumber(filters.maxPlayers),
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        });
        if (!active) return;
        setDrills(result.items.map(toDrillCard));
        setTotalCount(result.count ?? result.items.length);
      } catch (err) {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : "Failed to load drills.");
        setDrills([]);
        setTotalCount(0);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadDrills();

    return () => {
      active = false;
    };
  }, [
    query,
    selectedTagIds,
    selectedLevels,
    filters.segmentId,
    filters.minAge,
    filters.maxAge,
    filters.minPlayers,
    filters.maxPlayers,
    page,
    profile,
    authLoading,
  ]);

  React.useEffect(() => {
    let active = true;

    const loadSegments = async () => {
      if (authLoading) {
        return;
      }
      const resolvedOrgId = profile?.default_org_id?.trim();
      if (!resolvedOrgId) {
        setSegmentsError("Missing org_id for this account.");
        return;
      }

      setSegmentsLoading(true);
      setSegmentsError(null);
      try {
        const segments = await listDrillSegments({ orgId: resolvedOrgId });
        if (!active) return;
        setSegmentOptions(toSegmentOptions(segments));
      } catch (err) {
        if (!active) return;
        setSegmentsError(
          err instanceof Error ? err.message : "Failed to load segments.",
        );
        setSegmentOptions([]);
      } finally {
        if (active) setSegmentsLoading(false);
      }
    };

    const loadTags = async () => {
      if (authLoading) {
        return;
      }
      const resolvedOrgId = profile?.default_org_id?.trim();
      if (!resolvedOrgId) {
        setTagsError("Missing org_id for this account.");
        return;
      }

      setTagsLoading(true);
      setTagsError(null);
      try {
        const tags = await listDrillTags({ orgId: resolvedOrgId });
        if (!active) return;
        setTagOptions(normalizeTagOptions(tags));
      } catch (err) {
        if (!active) return;
        setTagsError(err instanceof Error ? err.message : "Failed to load tags.");
        setTagOptions([]);
      } finally {
        if (active) setTagsLoading(false);
      }
    };

    void loadSegments();
    void loadTags();

    return () => {
      active = false;
    };
  }, [profile, authLoading]);

  const openPlay = React.useCallback((drill: DrillCard) => {
    setPlayState({
      open: true,
      drill,
      url: null,
      loading: true,
      error: null,
    });

    const requestId = ++playRequestIdRef.current;
    const resolvedOrgId = profile?.default_org_id?.trim();

    void (async () => {
      try {
        const response = await getDrillMediaPlay(drill.id, { orgId: resolvedOrgId });
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
          error: err instanceof Error ? err.message : "Failed to load drill video.",
          loading: false,
        }));
      }
    })();
  }, [profile]);

  const closePlay = React.useCallback(() => {
    playRequestIdRef.current += 1;
    setPlayState({
      open: false,
      drill: null,
      url: null,
      loading: false,
      error: null,
    });
  }, []);

  const setQueryValue = React.useCallback((value: string) => {
    setQuery(value);
    setPage(1);
  }, []);

  const updateFilterField = React.useCallback(
    (field: DrillFilterField, value: string) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
      setPage(1);
    },
    [],
  );

  const toggleTag = React.useCallback((tagId: string) => {
    setFilters((prev) => {
      const next = new Set(prev.tags);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return { ...prev, tags: next };
    });
    setPage(1);
  }, []);

  const toggleLevel = React.useCallback((levelId: string) => {
    setFilters((prev) => {
      const next = new Set(prev.levels);
      if (next.has(levelId)) next.delete(levelId);
      else next.add(levelId);
      return { ...prev, levels: next };
    });
    setPage(1);
  }, []);

  const clearAll = React.useCallback(() => {
    setQuery("");
    setFilters(createEmptyFilters());
    setPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    query,
    filters,
    drills,
    loading,
    loadError,
    page,
    totalCount,
    totalPages,
    segmentOptions,
    segmentsLoading,
    segmentsError,
    tagOptions,
    tagsLoading,
    tagsError,
    tagLabelById,
    playState,
    setPage,
    setQuery: setQueryValue,
    updateFilterField,
    toggleTag,
    toggleLevel,
    clearAll,
    openPlay,
    closePlay,
  };
}
