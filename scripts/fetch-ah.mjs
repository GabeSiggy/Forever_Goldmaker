#!/usr/bin/env node
// Pulls every WoW Forever auction house in a region from Blizzard's Game Data API and writes
// compact price files for the website. No dependencies (Node 18+).
//
// Env:
//   BLIZZARD_CLIENT_ID / BLIZZARD_CLIENT_SECRET  (from https://develop.battle.net)
//   REGION        us | eu | kr | tw          (default us)
//   RULESET_ID    ruleset to list houses from (default: first one the API returns)
//   OUT_DIR       where to write JSON          (default site/data)
//   SITE_URL      your published site URL; used to carry price history + item names between runs
//   MOCK_DIR      read API responses from local JSON files instead of the network (tests)
//
// Forever API notes (unofficial as of Nov 2026, see README): realms don't exist; auction houses hang
// off rulesets under the dynamic-forever-{region} namespace.

import fs from "node:fs/promises";
import path from "node:path";
import { aggregateListings, normalizeAuctions, updateHistory, summarizeHistory, factionFromName } from "./lib/aggregate.mjs";

const REGION = (process.env.REGION || "us").toLowerCase();
const OUT_DIR = process.env.OUT_DIR || "site/data";
const SITE_URL = (process.env.SITE_URL || "").replace(/\/$/, "");
const MOCK_DIR = process.env.MOCK_DIR;
const MAX_NAME_LOOKUPS = Number(process.env.MAX_NAME_LOOKUPS || 250);
const API = `https://${REGION}.api.blizzard.com`;
const DYNAMIC = `dynamic-forever-${REGION}`;
const STATIC = `static-forever-${REGION}`;

let token = null;

async function getToken() {
  if (MOCK_DIR) return "mock";
  const id = process.env.BLIZZARD_CLIENT_ID, secret = process.env.BLIZZARD_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Set BLIZZARD_CLIENT_ID and BLIZZARD_CLIENT_SECRET");
  const res = await fetch("https://oauth.battle.net/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  if (!res.ok) throw new Error(`OAuth failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

/** GET an API path (or absolute href) with a namespace. Returns parsed JSON, or null on 404. */
async function api(pathOrHref, namespace, { retries = 3 } = {}) {
  if (MOCK_DIR) return mockApi(pathOrHref);
  const url = new URL(pathOrHref.startsWith("http") ? pathOrHref : API + pathOrHref);
  url.searchParams.set("namespace", namespace);
  url.searchParams.set("locale", "en_US");
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 404) return null;
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    throw new Error(`GET ${url.pathname} -> ${res.status}`);
  }
}

async function mockApi(p) {
  const clean = new URL(p, "https://x").pathname.replace(/^\/+|\/+$/g, "").replace(/\//g, "_");
  try { return JSON.parse(await fs.readFile(path.join(MOCK_DIR, clean + ".json"), "utf8")); }
  catch { return null; }
}

/** Some responses inline arrays, some return { href } links. Resolve either. */
async function resolveList(field, namespace) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (field.href) {
    const body = await api(field.href, namespace);
    return body?.auctions || [];
  }
  return [];
}

async function readPrevious(name) {
  // Prefer a local copy (local runs), then the published site (GitHub Actions runs).
  try { return JSON.parse(await fs.readFile(path.join(OUT_DIR, name), "utf8")); } catch {}
  if (!SITE_URL || MOCK_DIR) return null;
  try {
    const res = await fetch(`${SITE_URL}/data/${name}`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

async function main() {
  token = await getToken();
  const now = process.env.NOW ? new Date(process.env.NOW) : new Date(); // NOW: tests only

  // 1. Pick a ruleset to read the house list from. (As of launch every ruleset returns the same houses.)
  let rulesetId = process.env.RULESET_ID;
  if (!rulesetId) {
    const idx = await api("/data/wow/ruleset/index", DYNAMIC);
    rulesetId = idx?.rulesets?.[0]?.id ?? 2;
  }

  // 2. House index (the trailing slash matters on this endpoint).
  const index = await api(`/data/wow/ruleset/${rulesetId}/auctions/`, DYNAMIC);
  const houses = (index?.auctions || []).map(h => ({ id: h.id, name: h.name || h.key?.name || `House ${h.id}` }));
  if (!houses.length) throw new Error("No auction houses returned. The Forever API may have changed; see README.");
  houses.sort((a, b) => a.id - b.id);

  await fs.mkdir(OUT_DIR, { recursive: true });
  const names = (await readPrevious("item-names.json")) || {};
  const houseMeta = [];
  const seenCounts = new Map();

  // Group = the Nth house of each faction (by id). Live data lists ids in runs of the same faction
  // (110-112 Alliance, 113-115 Horde, 116-118 Blackwater, ...), so ids alone can't be chunked in threes.
  const factionRank = new Map();
  for (let i = 0; i < houses.length; i++) {
    const h = houses[i];
    const group = (factionRank.get(factionFromName(h.name)) || 0) + 1;
    factionRank.set(factionFromName(h.name), group);
    const house = await api(`/data/wow/ruleset/${rulesetId}/auctions/${h.id}`, DYNAMIC);
    let raw = [];
    if (house) {
      raw = raw.concat(await resolveList(house.auctions, DYNAMIC));
      let commodities = await resolveList(house.commodities, DYNAMIC);
      if (!commodities.length) {
        const c = await api(`/data/wow/ruleset/${rulesetId}/auctions/${h.id}/commodities`, DYNAMIC);
        commodities = c?.auctions || [];
      }
      raw = raw.concat(commodities);
    }
    const items = aggregateListings(normalizeAuctions(raw));
    const prevHistory = await readPrevious(`history-${h.id}.json`);
    const history = updateHistory(prevHistory, items, now);
    const avg7 = summarizeHistory(history, now);

    await fs.writeFile(path.join(OUT_DIR, `prices-${h.id}.json`),
      JSON.stringify({ houseId: h.id, updated: now.toISOString(), items, avg7 }));
    await fs.writeFile(path.join(OUT_DIR, `history-${h.id}.json`), JSON.stringify(history));

    for (const [id, s] of Object.entries(items)) seenCounts.set(id, (seenCounts.get(id) || 0) + s[3]);
    houseMeta.push({
      id: h.id, name: h.name, faction: factionFromName(h.name), group,
      listings: raw.length, items: Object.keys(items).length
    });
    console.log(`house ${h.id} (${h.name}, group ${group}): ${raw.length} listings, ${Object.keys(items).length} items`);
  }

  // 3. Look up names for the most-listed unknown items (the Forever item API only covers some items).
  const unknown = [...seenCounts.entries()].filter(([id]) => !(id in names)).sort((a, b) => b[1] - a[1]);
  for (const [id] of unknown.slice(0, MAX_NAME_LOOKUPS)) {
    try {
      const item = await api(`/data/wow/item/${id}`, STATIC);
      names[id] = item?.name ?? null;
    } catch { /* leave for next run */ }
  }

  await fs.writeFile(path.join(OUT_DIR, "item-names.json"), JSON.stringify(names));
  await fs.writeFile(path.join(OUT_DIR, "houses.json"),
    JSON.stringify({ region: REGION, rulesetId: Number(rulesetId), updated: now.toISOString(), houses: houseMeta }, null, 1));
  console.log(`done: ${houseMeta.length} houses, ${Object.keys(names).length} item names cached`);
}

main().catch(err => { console.error(err); process.exit(1); });
