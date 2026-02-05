// src/services/athleteService.ts
// Fetch wrapper for /functions/v1/api/athletes/* endpoints.

import { apiFetch } from "../../../shared/api/apiClient";

export type AthleteTeam = {
  id: string;
  name: string;
};

export type AthleteListItem = {
  id: string;
  org_id: string | null;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  cell_number: string | null;
  parent_email?: string | null;
  parent_full_name?: string | null;
  parent_mobile_phone?: string | null;
  relationship?: string | null;
  gender?: string | null;
  age?: number | null;
  username?: string | null;
  graduation_year: number | null;
  teams: AthleteTeam[];
};

export type AthletesListResponse =
  | { ok: true; count?: number; items?: AthleteListItem[]; data?: AthleteListItem[] }
  | { ok: false; error: string };

export type AthleteDetailResponse =
  | { ok: true; athlete?: AthleteListItem; data?: AthleteListItem }
  | { ok: false; error: string };

export type CreateAthleteInput = {
  org_id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  full_name?: string | null;
  cell_number?: string | null;
  phone?: string | null;
  parent_email?: string | null;
  parent_full_name?: string | null;
  parent_mobile_phone?: string | null;
  relationship?: string | null;
  username: string;
  graduation_year?: number | string | null;
  team_id?: string | null;
  age?: number | string | null;
  gender?: string | null;
};

export type CreateAthleteResponse =
  | { ok: true; athlete?: AthleteListItem; data?: AthleteListItem }
  | { ok: false; error: string };

export type UpdateAthleteInput = {
  email?: string | null;
  password?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  cell_number?: string | null;
  phone?: string | null;
  parent_email?: string | null;
  parent_full_name?: string | null;
  parent_mobile_phone?: string | null;
  relationship?: string | null;
  username?: string | null;
  graduation_year?: number | string | null;
  team_id?: string | null;
  age?: number | string | null;
  gender?: string | null;
};

export type UpdateAthleteResponse =
  | { ok: true; athlete?: AthleteListItem; data?: AthleteListItem }
  | { ok: false; error: string };

export type ListAthletesParams = {
  orgId: string;
  name?: string;
  email?: string;
  teamId?: string;
  limit?: number;
  offset?: number;
};

const DEFAULT_BASE_URL =
  ((typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_BACKEND_URL) as string) ||
  "http://localhost:8000";

function buildListQuery(params: ListAthletesParams) {
  const u = new URLSearchParams();
  u.set("org_id", params.orgId);
  if (params.name?.trim()) u.set("name", params.name.trim());
  if (params.email?.trim()) u.set("email", params.email.trim());
  if (params.teamId?.trim()) u.set("team_id", params.teamId.trim());
  if (Number.isFinite(params.limit)) u.set("limit", String(params.limit));
  if (Number.isFinite(params.offset)) u.set("offset", String(params.offset));
  return u.toString();
}

function normalizeGraduationYear(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function normalizeAge(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function normalizeTeams(raw: any): AthleteTeam[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((team) => ({
      id: typeof team?.id === "string" ? team.id : "",
      name: typeof team?.name === "string" ? team.name : "",
    }))
    .filter((team) => team.id || team.name);
}

function normalizeAthlete(raw: any): AthleteListItem {
  const normalizeOptionalString = (value: unknown) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  };

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

  const parent = raw?.parent;
  const parentFullName =
    normalizeOptionalString(raw?.parent_full_name) ??
    normalizeOptionalString(parent?.full_name) ??
    normalizeOptionalString(parent?.name);
  const parentEmail =
    normalizeOptionalString(raw?.parent_email) ??
    normalizeOptionalString(parent?.email);
  const parentMobilePhone =
    normalizeOptionalString(raw?.parent_mobile_phone) ??
    normalizeOptionalString(parent?.phone_number) ??
    normalizeOptionalString(parent?.phone) ??
    normalizeOptionalString(parent?.mobile_phone) ??
    normalizeOptionalString(parent?.cell_number);
  const relationship =
    normalizeOptionalString(raw?.relationship) ??
    normalizeOptionalString(parent?.relationship);

  return {
    id: typeof raw?.id === "string" ? raw.id : "",
    org_id: typeof raw?.org_id === "string" ? raw.org_id : null,
    user_id:
      typeof raw?.user_id === "string"
        ? raw.user_id
        : typeof raw?.userId === "string"
          ? raw.userId
          : null,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    email: typeof raw?.email === "string" ? raw.email.trim() : null,
    phone: typeof raw?.phone === "string" ? raw.phone.trim() : null,
    cell_number:
      typeof raw?.cell_number === "string" ? raw.cell_number.trim() : null,
    parent_email: parentEmail,
    parent_full_name: parentFullName,
    parent_mobile_phone: parentMobilePhone,
    relationship,
    gender: typeof raw?.gender === "string" ? raw.gender.trim() : null,
    age: normalizeAge(raw?.age),
    username:
      typeof raw?.username === "string" && raw.username.trim()
        ? raw.username.trim()
        : null,
    graduation_year: normalizeGraduationYear(raw?.graduation_year),
    teams: normalizeTeams(raw?.teams),
  };
}

export function athleteLabel(
  athlete: Pick<AthleteListItem, "full_name" | "first_name" | "last_name">,
) {
  return (
    athlete.full_name ||
    [athlete.first_name, athlete.last_name].filter(Boolean).join(" ") ||
    "Unnamed athlete"
  );
}

/**
 * GET /functions/v1/api/athletes/list?org_id=...
 */
export async function listAthletes(
  params: ListAthletesParams,
  baseUrl = DEFAULT_BASE_URL,
): Promise<{ items: AthleteListItem[]; count?: number }> {
  if (!params.orgId?.trim()) {
    throw new Error("orgId is required.");
  }

  const qs = buildListQuery(params);
  const url = `${baseUrl}/functions/v1/api/athletes/list?${qs}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId: params.orgId ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | AthletesListResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to load athletes.");
  }

  const rawItems = (data.items ?? (data as any).data ?? []) as unknown[];
  const items = rawItems.map((item) => normalizeAthlete(item)).filter((a) => a.id);
  const countRaw = (data as any)?.count;
  const count =
    typeof countRaw === "number"
      ? countRaw
      : Number.isFinite(Number(countRaw))
        ? Number(countRaw)
        : undefined;

  return { items, count };
}

function normalizeCreatePayload(input: CreateAthleteInput) {
  if (!input.org_id?.trim()) throw new Error("org_id is required.");
  if (!input.email?.trim()) throw new Error("email is required.");
  if (!input.password?.trim()) throw new Error("password is required.");
  if (!input.first_name?.trim()) throw new Error("first_name is required.");
  if (!input.last_name?.trim()) throw new Error("last_name is required.");
  if (!input.username?.trim()) throw new Error("username is required.");

  const graduationYear = normalizeGraduationYear(input.graduation_year);
  const age = normalizeAge(input.age);
  const teamId = input.team_id?.trim() || null;
  const gender = input.gender?.trim() || null;
  const fullNameInput = input.full_name?.trim() || "";
  const derivedFullName = [input.first_name, input.last_name]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ");
  const fullName = fullNameInput || derivedFullName || null;

  const normalizeOptionalString = (value: unknown) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = String(value).trim();
    return trimmed ? trimmed : null;
  };

  const parentEmail = normalizeOptionalString(input.parent_email);
  const parentFullName = normalizeOptionalString(input.parent_full_name);
  const parentMobilePhone = normalizeOptionalString(input.parent_mobile_phone);
  const relationship = normalizeOptionalString(input.relationship);

  const basePayload = {
    org_id: input.org_id.trim(),
    email: input.email.trim(),
    password: input.password.trim(),
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    cell_number: input.cell_number?.trim() || null,
    phone: input.phone?.trim() || null,
    username: input.username.trim(),
    graduation_year: graduationYear,
  };

  const withTeam = teamId ? { ...basePayload, team_id: teamId } : basePayload;
  const withAge = age !== null ? { ...withTeam, age } : withTeam;
  const withGender = gender ? { ...withAge, gender } : withAge;
  const withFullName = fullName ? { ...withGender, full_name: fullName } : withGender;
  const withParentEmail =
    parentEmail !== undefined && parentEmail !== null
      ? { ...withFullName, parent_email: parentEmail }
      : withFullName;
  const withParentFullName =
    parentFullName !== undefined && parentFullName !== null
      ? { ...withParentEmail, parent_full_name: parentFullName }
      : withParentEmail;
  const withParentMobilePhone =
    parentMobilePhone !== undefined && parentMobilePhone !== null
      ? { ...withParentFullName, parent_mobile_phone: parentMobilePhone }
      : withParentFullName;
  const withRelationship =
    relationship !== undefined && relationship !== null
      ? { ...withParentMobilePhone, relationship }
      : withParentMobilePhone;

  return withRelationship;
}

function normalizeUpdatePayload(input: UpdateAthleteInput) {
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

  const email = normalizeRequiredString(input.email, "email");
  if (email !== undefined) payload.email = email;

  const firstName = normalizeRequiredString(input.first_name, "first_name");
  if (firstName !== undefined) payload.first_name = firstName;

  const lastName = normalizeRequiredString(input.last_name, "last_name");
  if (lastName !== undefined) payload.last_name = lastName;

  const fullName = normalizeOptionalString(input.full_name);
  if (fullName !== undefined) payload.full_name = fullName;

  const username = normalizeRequiredString(input.username, "username");
  if (username !== undefined) payload.username = username;

  const password = normalizeOptionalString(input.password);
  if (password !== undefined) payload.password = password;

  const cellNumber = normalizeOptionalString(input.cell_number);
  if (cellNumber !== undefined) payload.cell_number = cellNumber;

  const phone = normalizeOptionalString(input.phone);
  if (phone !== undefined) payload.phone = phone;

  const parentEmail = normalizeOptionalString(input.parent_email);
  if (parentEmail !== undefined) payload.parent_email = parentEmail;

  const parentFullName = normalizeOptionalString(input.parent_full_name);
  if (parentFullName !== undefined) payload.parent_full_name = parentFullName;

  const parentMobilePhone = normalizeOptionalString(input.parent_mobile_phone);
  if (parentMobilePhone !== undefined) {
    payload.parent_mobile_phone = parentMobilePhone;
  }

  const relationship = normalizeOptionalString(input.relationship);
  if (relationship !== undefined) payload.relationship = relationship;

  if (input.graduation_year !== undefined) {
    const graduationYear = normalizeGraduationYear(input.graduation_year);
    payload.graduation_year = graduationYear;
  }

  const teamId = normalizeOptionalString(input.team_id);
  if (teamId !== undefined) payload.team_id = teamId;

  if (input.age !== undefined) {
    payload.age = normalizeAge(input.age);
  }

  const gender = normalizeOptionalString(input.gender);
  if (gender !== undefined) payload.gender = gender;

  return payload;
}

/**
 * POST /functions/v1/api/athletes
 */
export async function createAthlete(
  input: CreateAthleteInput,
  baseUrl = DEFAULT_BASE_URL,
): Promise<AthleteListItem> {
  const payload = normalizeCreatePayload(input);
  const url = `${baseUrl}/functions/v1/api/athletes`;

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId: payload.org_id ?? null,
  });

  const data = (await res.json().catch(() => undefined)) as
    | CreateAthleteResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if (!data?.ok) {
    throw new Error((data as any)?.error || "Failed to create athlete.");
  }

  const raw = (data as any)?.athlete ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from athlete create endpoint.");
  }

  return normalizeAthlete(raw);
}

/**
 * GET /functions/v1/api/athletes/:id
 */
export async function getAthleteById(
  athleteId: string,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<AthleteListItem> {
  if (!athleteId?.trim()) {
    throw new Error("athleteId is required.");
  }

  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options;
  const url = `${baseUrl}/functions/v1/api/athletes/${athleteId}`;

  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | AthleteDetailResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to load athlete.");
  }

  const raw = (data as any)?.athlete ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from athlete detail endpoint.");
  }

  return normalizeAthlete(raw);
}

/**
 * PATCH /functions/v1/api/athletes/:id
 */
export async function updateAthlete(
  athleteId: string,
  input: UpdateAthleteInput,
  options: { orgId?: string | null; baseUrl?: string } = {},
): Promise<AthleteListItem> {
  if (!athleteId?.trim()) {
    throw new Error("athleteId is required.");
  }

  const { orgId = null, baseUrl = DEFAULT_BASE_URL } = options;
  const payload = normalizeUpdatePayload(input);
  const url = `${baseUrl}/functions/v1/api/athletes/${athleteId}`;

  const res = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    orgId,
  });

  const data = (await res.json().catch(() => undefined)) as
    | UpdateAthleteResponse
    | undefined;

  if (!res.ok) {
    const reason = (data as any)?.error || `${res.status} ${res.statusText}`;
    throw new Error(reason);
  }
  if ((data as any)?.ok === false) {
    throw new Error((data as any)?.error || "Failed to update athlete.");
  }

  const raw = (data as any)?.athlete ?? (data as any)?.data ?? data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response from athlete update endpoint.");
  }

  return normalizeAthlete(raw);
}
