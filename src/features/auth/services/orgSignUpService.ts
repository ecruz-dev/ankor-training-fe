export type OrgSignupPayload = {
  admin: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    password: string;
  };
  organization: {
    name: string;
    programGender: "girls" | "boys" | "coed";
  };
  teams: { name: string }[];
};

export type OrgSignupResponse =
  | { ok: true; userId: string; orgId: string; profileId: string; teamIds?: string[] }
  | { ok: false; error: string; details?: unknown };

const pickUrl = () =>
  import.meta.env.VITE_ORG_SIGNUP_URL
  ?? (import.meta.env.VITE_SUPABASE_FUNCTIONS_URL
        ? `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL.replace(/\/$/, "")}/org-signup`
        : "http://localhost:54321/functions/v1/org-signup");

export function buildOrgSignupPayload(form: HTMLFormElement): OrgSignupPayload {
  // We only READ from the form; we are NOT sending multipart.
  const fd = new FormData(form);

  const firstName = String(fd.get("adminFirstName") ?? "").trim();
  const lastName  = String(fd.get("adminLastName") ?? "").trim();
  const email     = String(fd.get("adminEmail") ?? "").trim();
  const phone     = String(fd.get("adminPhoneNumber") ?? "").trim() || null;
  const password  = String(fd.get("adminPassword") ?? "").trim();

  const orgName   = String(fd.get("organizationName") ?? "").trim();
  const genderRaw = String(fd.get("gender") ?? "").toLowerCase();
  const programGender = (["girls","boys","coed"].includes(genderRaw) ? genderRaw : "coed") as
    "girls" | "boys" | "coed";

  let teams: { name: string }[] = [];
  const teamsJsonStr = String(fd.get("teamsJson") ?? "");
  if (teamsJsonStr) {
    try {
      const arr = JSON.parse(teamsJsonStr) as Array<{ name?: string }>;
      teams = (arr ?? [])
        .map(r => ({ name: String(r?.name ?? "").trim() }))
        .filter(t => t.name.length > 0);
    } catch { /* ignore bad JSON */ }
  }

  return {
    admin: { firstName, lastName, email, phone, password },
    organization: { name: orgName, programGender },
    teams,
  };
}

export async function submitOrgSignupJson(payload: OrgSignupPayload): Promise<OrgSignupResponse> {
  const url = pickUrl();

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // Only if your edge function requires a JWT:
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (anon && !url.includes("localhost:8000")) {
    headers["apikey"] = anon;
    headers["Authorization"] = `Bearer ${anon}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  return (await res.json()) as OrgSignupResponse;
}
