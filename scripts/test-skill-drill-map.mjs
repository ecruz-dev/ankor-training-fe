#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function readDotEnv() {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        if (index === -1) return [line, ""];
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
        return [key, value];
      }),
  );
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (!current.startsWith("--")) continue;

    const key = current.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    i += 1;
  }
  return args;
}

function usage() {
  return `Usage:
  npm run test:skill-drill-map -- --org-id <orgId> --skill-id <skillId> --drill-id <drillId> --token <accessToken>

Options:
  --base-url <url>       Defaults to VITE_BACKEND_URL from .env, then http://localhost:8000
  --token <jwt>          Defaults to API_TOKEN, SUPABASE_ACCESS_TOKEN, or ACCESS_TOKEN
  --email <email>        Optional; used with --password to get a fresh Supabase access token
  --password <password>  Optional; defaults to SUPABASE_PASSWORD
  --org-id <uuid>        Defaults to ORG_ID
  --skill-id <uuid>      Defaults to SKILL_ID
  --drill-id <uuid>      Defaults to DRILL_ID
  --keep-changes         Do not restore the drill to its original mapped/unmapped state
`;
}

function requireValue(name, value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  throw new Error(`Missing ${name}.\n\n${usage()}`);
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

function tagId(tag) {
  if (typeof tag === "string") return tag;
  if (tag && typeof tag === "object") {
    return tag.id ?? tag.skill_id ?? tag.skillId ?? null;
  }
  return null;
}

function drillHasSkill(drill, skillId) {
  const tags = drill?.skill_tags ?? drill?.tags ?? drill?.drill_tags ?? [];
  return Array.isArray(tags) && tags.some((tag) => tagId(tag) === skillId);
}

function unwrapDrill(json) {
  return json?.drill ?? json?.data ?? json;
}

async function request({
  baseUrl,
  token,
  orgId,
  method,
  path,
  body,
  includeOrgId = true,
}) {
  const url = new URL(`${baseUrl}${path}`);
  if (includeOrgId && !url.searchParams.has("org_id")) {
    url.searchParams.set("org_id", orgId);
  }

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = text;
  }

  if (!res.ok || json?.ok === false) {
    const reason =
      typeof json?.error === "string"
        ? json.error
        : typeof json === "string" && json
          ? json
          : `${res.status} ${res.statusText}`;
    throw new Error(`${method} ${url.pathname} failed: ${reason}`);
  }

  return json;
}

async function signInWithPassword({ env, args }) {
  const email = args.email || env.SUPABASE_EMAIL || env.EMAIL;
  const password = args.password || env.SUPABASE_PASSWORD || env.PASSWORD;
  if (!email || !password) return null;

  const supabaseUrl = requireValue("VITE_SUPABASE_URL", env.VITE_SUPABASE_URL);
  const anonKey = requireValue("VITE_SUPABASE_ANON_KEY", env.VITE_SUPABASE_ANON_KEY);
  const supabase = createClient(supabaseUrl, anonKey);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Supabase sign-in failed: ${error.message}`);
  }
  if (!data.session?.access_token || !data.user?.id) {
    throw new Error("Supabase sign-in did not return a usable session.");
  }

  return {
    token: data.session.access_token,
    userId: data.user.id,
  };
}

async function getDefaultOrgId({ baseUrl, token, userId }) {
  const json = await request({
    baseUrl,
    token,
    orgId: null,
    method: "POST",
    path: "/functions/v1/api/auth/login",
    body: { user_id: userId },
    includeOrgId: false,
  });

  const user = json?.user ?? json?.data ?? json;
  return user?.default_org_id ?? user?.defaultOrgId ?? null;
}

async function getDrill(ctx) {
  return unwrapDrill(
    await request({
      ...ctx,
      method: "GET",
      path: `/functions/v1/api/drills/${ctx.drillId}`,
    }),
  );
}

async function patchDrillTags(ctx, payload) {
  return unwrapDrill(
    await request({
      ...ctx,
      method: "PATCH",
      path: `/functions/v1/api/drills/${ctx.drillId}`,
      body: payload,
    }),
  );
}

async function listDrillsForSkill(ctx) {
  const query = new URLSearchParams({
    org_id: ctx.orgId,
    skill_tags: ctx.skillId,
    limit: "100",
    offset: "0",
  });

  const json = await request({
    ...ctx,
    method: "GET",
    path: `/functions/v1/api/drills/list?${query.toString()}`,
  });

  return json?.items ?? json?.data ?? [];
}

async function assertState(ctx, expected, label) {
  const drill = await getDrill(ctx);
  const actual = drillHasSkill(drill, ctx.skillId);
  if (actual !== expected) {
    throw new Error(
      `${label}: expected drill ${ctx.drillId} skill mapping to be ${expected}, got ${actual}.`,
    );
  }

  const filtered = await listDrillsForSkill(ctx);
  const inFilteredList = filtered.some((item) => item?.id === ctx.drillId);
  if (inFilteredList !== expected) {
    throw new Error(
      `${label}: expected filtered drills list membership to be ${expected}, got ${inFilteredList}.`,
    );
  }
}

async function main() {
  const env = { ...readDotEnv(), ...process.env };
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = normalizeBaseUrl(
    args["base-url"] || env.VITE_BACKEND_URL || "http://localhost:8000",
  );
  const session =
    args.token || env.API_TOKEN || env.SUPABASE_ACCESS_TOKEN || env.ACCESS_TOKEN
      ? null
      : await signInWithPassword({ env, args });
  const token =
    args.token ||
    env.API_TOKEN ||
    env.SUPABASE_ACCESS_TOKEN ||
    env.ACCESS_TOKEN ||
    session?.token;
  const orgId =
    args["org-id"] ||
    env.ORG_ID ||
    (session?.userId
      ? await getDefaultOrgId({ baseUrl, token, userId: session.userId })
      : null);

  const ctx = {
    baseUrl,
    token: requireValue("token", token),
    orgId: requireValue("org id", orgId),
    skillId: requireValue("skill id", args["skill-id"] || env.SKILL_ID),
    drillId: requireValue("drill id", args["drill-id"] || env.DRILL_ID),
  };

  const keepChanges = Boolean(args["keep-changes"]);
  const initial = await getDrill(ctx);
  const initiallyMapped = drillHasSkill(initial, ctx.skillId);

  console.log(
    `Initial mapping: drill ${ctx.drillId} ${
      initiallyMapped ? "has" : "does not have"
    } skill ${ctx.skillId}`,
  );

  try {
    await patchDrillTags(ctx, {
      add_tag_ids: [ctx.skillId],
      remove_tag_ids: [],
    });
    await assertState(ctx, true, "after add_tag_ids");
    console.log("PASS add_tag_ids maps the skill to the drill.");

    await patchDrillTags(ctx, {
      add_tag_ids: [],
      remove_tag_ids: [ctx.skillId],
    });
    await assertState(ctx, false, "after remove_tag_ids");
    console.log("PASS remove_tag_ids unmaps the skill from the drill.");
  } finally {
    if (!keepChanges) {
      await patchDrillTags(ctx, {
        add_tag_ids: initiallyMapped ? [ctx.skillId] : [],
        remove_tag_ids: initiallyMapped ? [] : [ctx.skillId],
      });
      await assertState(ctx, initiallyMapped, "after restore");
      console.log("PASS restored original mapping state.");
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
