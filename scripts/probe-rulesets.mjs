#!/usr/bin/env node
// One-off diagnostic: figure out which auction houses belong to which ruleset (Normal / PvP / RP / RP-PvP).
//
// For every ruleset the API lists, it fetches the house list and each house's data, then prints a small
// fingerprint (listing count + cheapest/market price of a few common items). If a house's fingerprint
// differs between rulesets, the API is serving ruleset-specific data and we can map houses to rulesets.
// If every ruleset returns identical data, the API doesn't tell us and we label by in-game price match.
//
// Env: BLIZZARD_CLIENT_ID / BLIZZARD_CLIENT_SECRET, REGION (default us),
//      RULESET_IDS (comma list, default: every ruleset in the index), MOCK_DIR (tests),
//      GITHUB_STEP_SUMMARY (set by Actions; the report is also written there).

import fs from "node:fs/promises";
import path from "node:path";
import { aggregateListings, normalizeAuctions } from "./lib/aggregate.mjs";

const REGION = (process.env.REGION || "us").toLowerCase();
const MOCK_DIR = process.env.MOCK_DIR;
const API = `https://${REGION}.api.blizzard.com`;
const DYNAMIC = `dynamic-forever-${REGION}`;
const PROBE_ITEMS = { 2589: "Linen Cloth", 2447: "Peacebloom", 765: "Silverleaf", 2770: "Copper Ore" };

let token = null;
const out = [];
const say = (s = "") => { out.push(s); console.log(s); };

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

/** GET with namespace. Returns { status, body }; never throws on HTTP errors so one bad ruleset can't stop the probe. */
async function api(pathOrHref, namespace = DYNAMIC) {
  if (MOCK_DIR) {
    const clean = new URL(pathOrHref, "https://x").pathname.replace(/^\/+|\/+$/g, "").replace(/\//g, "_");
    try { return { status: 200, body: JSON.parse(await fs.readFile(path.join(MOCK_DIR, clean + ".json"), "utf8")) }; }
    catch { return { status: 404, body: null }; }
  }
  const url = new URL(pathOrHref.startsWith("http") ? pathOrHref : API + pathOrHref);
  url.searchParams.set("namespace", namespace);
  url.searchParams.set("locale", "en_US");
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if ((res.status === 429 || res.status >= 500) && attempt < 3) {
      await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    return { status: res.status, body: res.ok ? await res.json() : null };
  }
}

async function resolveList(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (field.href) return (await api(field.href)).body?.auctions || [];
  return [];
}

/** Short, readable description of a house response (without dumping thousands of listings). */
function describeShape(obj) {
  return Object.entries(obj).map(([k, v]) => {
    if (Array.isArray(v)) return `${k}[${v.length}]`;
    if (v && typeof v === "object") return `${k}=${JSON.stringify(v).slice(0, 120)}`;
    return `${k}=${JSON.stringify(v)}`;
  }).join(", ");
}

async function fingerprint(rulesetId, houseId) {
  const house = (await api(`/data/wow/ruleset/${rulesetId}/auctions/${houseId}`)).body;
  if (!house) return { missing: true };
  let raw = await resolveList(house.auctions);
  let commodities = await resolveList(house.commodities);
  if (!commodities.length) commodities = (await api(`/data/wow/ruleset/${rulesetId}/auctions/${houseId}/commodities`)).body?.auctions || [];
  raw = raw.concat(commodities);
  const items = aggregateListings(normalizeAuctions(raw));
  const prices = Object.keys(PROBE_ITEMS).map(id => items[id] ? `${items[id][0]}/${items[id][1]}` : "-");
  return { shape: describeShape(house), listings: raw.length, fp: `${raw.length}|${prices.join("|")}`, prices };
}

async function main() {
  token = await getToken();

  const idx = (await api("/data/wow/ruleset/index")).body;
  say("== Ruleset index ==");
  say(JSON.stringify(idx));
  const fromIndex = (idx?.rulesets || []).map(r => ({ id: r.id, name: r.name || `ruleset ${r.id}` }));
  const rulesets = process.env.RULESET_IDS
    ? process.env.RULESET_IDS.split(",").map(s => ({ id: Number(s), name: `ruleset ${s}` }))
    : fromIndex;
  if (!rulesets.length) throw new Error("No rulesets found. Set RULESET_IDS=1,2,3,4 to probe by id.");

  const houseSets = {};     // ruleset id -> sorted house ids
  const fps = {};           // house id -> { ruleset id -> fingerprint }
  for (const rs of rulesets) {
    say(`\n== Ruleset ${rs.id}: ${rs.name} ==`);
    const index = await api(`/data/wow/ruleset/${rs.id}/auctions/`);
    if (!index.body) { say(`  house list: HTTP ${index.status} (no data)`); continue; }
    const list = (index.body.auctions || []).map(h => ({ id: h.id, name: h.name || `House ${h.id}` })).sort((a, b) => a.id - b.id);
    houseSets[rs.id] = list.map(h => h.id);
    say(`  index keys: ${describeShape(index.body)}`);
    say(`  first entry: ${JSON.stringify((index.body.auctions || [])[0])}`);
    say(`  ${list.length} houses: ${list.map(h => h.id).join(",")}`);
    for (const h of list) {
      const f = await fingerprint(rs.id, h.id);
      (fps[h.id] ||= {})[rs.id] = f;
      if (f.missing) say(`  house ${h.id} (${h.name}): not found under this ruleset`);
      else say(`  house ${h.id} (${h.name}): ${f.listings} listings, [${Object.values(PROBE_ITEMS).join(" | ")}] = ${f.prices.join(" | ")}  {${f.shape}}`);
    }
  }

  say("\n== Do the house lists differ between rulesets? ==");
  const sigs = new Set(Object.values(houseSets).map(a => a.join(",")));
  say(sigs.size <= 1 ? "  No: every ruleset returns the same house ids." : "  YES: rulesets return different house ids:");
  if (sigs.size > 1) for (const [rid, ids] of Object.entries(houseSets)) say(`  ruleset ${rid}: ${ids.join(",")}`);

  say("\n== Does each house's data differ between rulesets? ==");
  let differing = 0, total = 0;
  for (const [hid, byRs] of Object.entries(fps)) {
    const found = Object.entries(byRs).filter(([, f]) => !f.missing);
    const distinct = new Set(found.map(([, f]) => f.fp));
    total++;
    if (distinct.size > 1) {
      differing++;
      say(`  house ${hid}: DIFFERENT across rulesets -> ${found.map(([r, f]) => `ruleset ${r}: ${f.fp}`).join("  ;  ")}`);
    } else {
      say(`  house ${hid}: same in all ${found.length} ruleset(s) that return it`);
    }
  }

  say("\n== Verdict ==");
  const answering = Object.keys(houseSets).length;
  if (answering < 2) {
    say(`  Only ${answering} ruleset(s) returned a house list, so there is nothing to compare. Check the HTTP status lines above, or set RULESET_IDS.`);
  } else if (differing > 0) {
    say(`  ${differing} of ${total} houses return ruleset-specific data. Compare the lines above: the ruleset whose listings are populated for a house is that house's ruleset.`);
  } else {
    say("  The API returns identical data for every ruleset, so it does NOT say which house belongs to which ruleset. Label groups by matching in-game prices.");
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, "## Ruleset probe\n\n```\n" + out.join("\n") + "\n```\n");
  }
}

main().catch(err => { console.error(err); process.exit(1); });
