// src/services/guardianService.ts
// Fetch wrapper for /functions/v1/api/guardians/* endpoints.

import { apiFetch } from "../../../shared/api/apiClient";

export type GuardianAthlete = {
  athlete_id: string;
  relationship: string | null;
};

export type GuardianListItem = {
  id: string;
  org_id: string | null;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  athletes: GuardianAthlete[];
};

export type GuardiansListResponse =
  | { ok: true; count?: number; items?: GuardianListItem[]; data?: GuardianListItem[] }
  | { ok: false; error: string };

export type CreateGuardianInput = {
  org_id: string;
  athlete_ids: string[];
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  country?: string | null;
  relationship?: string | null;
};

export type CreateGuardianResponse =
  | { ok: true; guardian?: GuardianListItem; data?: GuardianListItem }
  | { ok: false; error: string };

export type GuardianDetailResponse =
  | { ok: true; guardian?: GuardianListItem; data?: GuardianListItem }
  | { ok: false; error: string };

export type GuardianAthleteUpdate = {
  athlete_id: string;
  relationship?: string | null;
};

export type UpdateGuardianInput = {
  full_name?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  country?: string | null;
  add_athletes?: GuardianAthleteUpdate[];
  remove_athlete_ids?: string[];
};

export type UpdateGuardianResponse =
  | { ok: true; guardian?: GuardianListItem; data?: GuardianListItem }
  | { ok: false; error: string };

export type ListGuardiansParams = {
  orgId: string;
  name?: string;
  limit?: number;
  offset?: number;
};

const DEFAULT_BASE_URL =
  ((typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_BACKEND_URL) as string) ||
  "http://localhost:8000";

function buildListQuery(params: ListGuardiansParams) {
  const u = new URLSearchParams();
  u.set("org_id", params.orgId);
  if (params.name?.trim()) u.set("name", params.name.trim());
  if (Number.isFinite(params.limit)) u.set("limit", String(params.limit));
  if (Number.isFinite(params.offset)) u.set("offset", String(params.offset));
  return u.toString();
}

function normalizeGuardianAthlete(raw: any): GuardianAthlete {
  return {
    athlete_id: typeof raw?.athlete_id === "string" ? raw.athlete_id : "",
    relationship:
      typeof raw?.relationship === "string" && raw.relationship.trim()
        ? raw.relationship.trim()
        : null,
  };
}

function normalizeGuardian(raw: any): GuardianListItem {
  const firstName =
    typeof raw?.first_name === "string" && raw.first_name.trim()
      ? raw.first_name.trim()
      : null;
  const lastName =
    typeof raw?.last_name === "string" && raw.last_name.trim()
      ? raw.last_name.trim()
      : null;

  let fullName =
    typeof raw?.full_name === "string" && raw.full_name.trim()
      ? raw.full_name.trim()
      : null;

  if (!fullName) {
    const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
    fullName = combined ? combined : null;
  }

  const phone =
    typeof raw?.phone === "string" && raw.phone.trim()
      ? raw.phone.trim()
      : typeof raw?.cell_number === "string" && raw.cell_number.trim()
        ? raw.cell_number.trim()
        : null;

  const rawAthletes = Array.isArray(raw?.athletes) ? raw.athletes : [];
  const athletes = rawAthletes
    .map((item: any) => normalizeGuardianAthlete(item))
    .filter((item: GuardianAthlete) => item.athlete_id);

  return {
    id: typeof raw?.id === "string" ? raw.id : "",
    org_id: typeof raw?.org_id === "string" ? raw.org_id : null,
    user_id: typeof raw?.user_id === "string" ? raw.user_id : null,
    full_name: fullName,
    email:
      typeof raw?.email === "string" && raw.email.trim()
        ? raw.email.trim()
        : null,
    phone,
    address_line1:
      typeof raw?.address_line1 === "string" && raw.address_line1.trim()
        ? raw.address_line1.trim()
        : null,
    address_line2:
      typeof raw?.address_line2 === "string" && raw.address_line2.trim()
        ? raw.address_line2.trim()
        : null,
    city:
      typeof raw?.city === "string" && raw.city.trim() ? raw.city.trim() : null,
    region:
      typeof raw?.region === "string" && raw.region.trim()
        ? raw.region.trim()
        : null,
    postal_code:
      typeof raw?.postal_code === "string" && raw.postal_code.trim()
        ? raw.postal_code.trim()
        : null,
    country:
      typeof raw?.country === "string" && raw.country.trim()
        ? raw.country.trim()
        : null,
    athletes,
  };
}

function normalizeCreatePayload(input: CreateGuardianInput) {
  if (!input.org_id?.trim()) throw new Error("org_id is required.");
  if (!input.full_name?.trim()) throw new Error("full_name is required.");
  if (!input.email?.trim()) throw new Error("email is required.");
  if (!input.password?.trim()) throw new Error("password is required.");

  const athleteIds = (input.athlete_ids ?? [])
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
  if (athleteIds.length === 0) {
    throw new Error("athlete_ids is required.");
  }

  const normalizeOptionalString = (value: unknown) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = String(value).trim();
    return trimmed ? trimmed : null;
  };

  const payload: Record<string, unknown> = {
    org_id: input.org_id.trim(),
    athlete_ids: athleteIds,
    full_name: input.full_name.trim(),
    email: input.email.trim(),
    password: input.password.trim(),
  };

  const phone = normalizeOptionalString(input.phone);
  if (phone !== undefined) payload.phone = phone;

  const addressLine1 = normalizeOptionalString(input.address_line1);
  if (addressLine1 !== undefined) payload.address_line1 = addressLine1;

  const addressLine2 = normalizeOptionalString(input.address_line2);
  if (addressLine2 !== undefined) payload.address_line2 = addressLine2;

  const city = normalizeOptionalString(input.city);
  if (city !== undefined) payload.city = city;

  const region = normalizeOptionalString(input.region);
  if (region !== undefined) payload.region = region;

  const postalCode = normalizeOptionalString(input.postal_code);
  if (postalCode !== undefined) payload.postal_code = postalCode;

  const country = normalizeOptionalString(input.country);
  if (country !== undefined) payload.country = country;

  const relationship = normalizeOptionalString(input.relationship);
  if (relationship !== undefined) payload.relationship = relationship;

  return payload;
}

function normalizeUpdatePayload(input: UpdateGuardianInput) {
  const payload: Record<string, unknown> = {};

  const normalizeRequiredString = (value: unknown, field: string) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = String(value).trim();
    if (!trimmed) {
      throw new Error(`${field} is required.`);
    }
    return trimmed;
  };

  const normalizeOptionalString = (value: unknown) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = String(value).trim();
    return trimmed ? trimmed : null;
  };

  const fullName = normalizeRequiredString(input.full_name, "full_name");
  if (fullName !== undefined) payload.full_name = fullName;

  const phone = normalizeOptionalString(input.phone);
  if (phone !== undefined) payload.phone = phone;

  const addressLine1 = normalizeOptionalString(input.address_line1);
  if (addressLine1 !== undefined) payload.address_line1 = addressLine1;

  const addressLine2 = normalizeOptionalString(input.address_line2);
  if (addressLine2 !== undefined) payload.address_line2 = addressLine2;

  const city = normalizeOptionalString(input.city);
  if (city !== undefined) payload.city = city;

  const region = normalizeOptionalString(input.region);
  if (region !== undefined) payload.region = region;

  const postalCode = normalizeOptionalString(input.postal_code);
  if (postalCode !== undefined) payload.postal_code = postalCode;

  const country = normalizeOptionalString(input.country);
  if (country !== undefined) payload.country = country;

  if (input.add_athletes !== undefined) {
    const addAthletes = (input.add_athletes ?? [])
      .map((entry) => {
        const athleteId = String(entry?.athlete_id ?? "").trim();
        if (!athleteId) return null;
        const relationship = normalizeOptionalString(entry?.relationship);
        return relationship === undefined
          ? { athlete_id: athleteId }
          : { athlete_id: athleteId, relationship };
      })
      .filter(Boolean);
    if (addAthletes.length === 0) {
      throw new Error("add_athletes is required.");
    }
    payload.add_athletes = addAthletes;
  }

  if (input.remove_athlete_ids !== undefined) {
    const removeAthleteIds = (input.remove_athlete_ids ?? [])
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);
    if (removeAthleteIds.length === 0) {
      throw new Error("remove_athlete_ids is required.");
    }
    payload.remove_athlete_ids = removeAthleteIds;
  }

  return payload;
}

export function guardianLabel(
  guardian: Pick<GuardianListItem, "full_name" | "email">,
) {
  return guardian.full_name || guardian.email || "Unnamed parent";
}

/**
 * GET /functions/v1/api/guardians/:id
 */
export async function getGuardianById(
  guardianId: string,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<GuardianListItem> {
  if (!guardianId?.trim()) {
    throw new Error("guardianId is required.");
  }

  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options;
  const url = `${baseUrl}/functions/v1/api/guardians/${guardianId.trim()}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | GuardianDetailResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to load guardian.");
  }

  const raw = (data as any)?.guardian ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from guardian detail endpoint.");
  }

  return normalizeGuardian(raw);
}

/**
 * GET /functions/v1/api/guardians/list?org_id=...
 */
export async function listGuardians(
  params: ListGuardiansParams,
  baseUrl = DEFAULT_BASE_URL,
): Promise<{ items: GuardianListItem[]; count?: number }> {
  if (!params.orgId?.trim()) {
    throw new Error("orgId is required.");
  }

  const qs = buildListQuery(params);
  const url = `${baseUrl}/functions/v1/api/guardians/list?${qs}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId: params.orgId ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | GuardiansListResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to load guardians.");
  }

  const rawItems = (data.items ?? (data as any).data ?? []) as unknown[];
  const items = rawItems
    .map((item) => normalizeGuardian(item))
    .filter((g) => g.id);
  const countRaw = (data as any)?.count;
  const count =
    typeof countRaw === "number"
      ? countRaw
      : Number.isFinite(Number(countRaw))
        ? Number(countRaw)
        : undefined;

  return { items, count };
}

/**
 * POST /functions/v1/api/guardians
 */
export async function createGuardian(
  input: CreateGuardianInput,
  baseUrl = DEFAULT_BASE_URL,
): Promise<GuardianListItem> {
  const payload = normalizeCreatePayload(input);
  const url = `${baseUrl}/functions/v1/api/guardians`;

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId: payload.org_id as string,
  });

  const data = (await res.json().catch(() => undefined)) as
    | CreateGuardianResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to create guardian.");
  }

  const raw = (data as any)?.guardian ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from guardian create endpoint.");
  }

  return normalizeGuardian(raw);
}

/**
 * PATCH /functions/v1/api/guardians/:id
 */
export async function updateGuardian(
  guardianId: string,
  input: UpdateGuardianInput,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<GuardianListItem> {
  if (!guardianId?.trim()) {
    throw new Error("guardianId is required.");
  }

  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options;
  const payload = normalizeUpdatePayload(input);
  const url = `${baseUrl}/functions/v1/api/guardians/${guardianId.trim()}`;

  const res = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | UpdateGuardianResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to update guardian.");
  }

  const raw = (data as any)?.guardian ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from guardian update endpoint.");
  }

  return normalizeGuardian(raw);
}
