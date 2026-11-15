#!/usr/bin/env node
// Writes fake Blizzard API responses (same shape as the Forever endpoints) so the pipeline and site
// can be tested without API keys. Usage: node scripts/make-mock.mjs <outDir> <dayOffset> [crash]
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const [outDir = "test/mock", dayOffset = "0", crash] = process.argv.slice(2);
const ctx = { window: {} };
vm.runInNewContext(await fs.readFile(new URL("../site/game-data.js", import.meta.url), "utf8"), ctx);
const D = ctx.window.GAME_DATA;

// Deterministic pseudo-random so runs are repeatable.
let seed = 42 + Number(dayOffset) * 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const base = {};
const tierOf = {};
for (const s of D.sources) for (const [id] of s.yields) tierOf[id] = Math.min(tierOf[id] ?? 999, s.skill);
for (const f of [...D.mobFarms, ...(D.rawFarms || [])]) for (const [id] of f.yields) tierOf[id] ??= f.minLevel * 5;
for (const id of Object.keys(D.items)) {
  if (D.items[id].vendor != null || D.items[id].noAH) continue;
  const t = tierOf[id];
  if (t != null) base[id] = Math.round(300 + Math.pow(t + 10, 1.6) * 2);
}
Object.assign(base, { 13468: 400000, 12363: 150000, 12800: 90000, 12364: 60000, 14256: 30000, 7078: 60000, 8150: 2000, 6367: 70000, 13546: 9000, 13926: 120000, 7971: 25000, 5500: 6000 });
// Crafted items: priced off their reagents, some profitable, some not.
const cost = id => base[id] ?? D.items[id]?.vendor ?? 1000;
for (let pass = 0; pass < 3; pass++) {
  for (const r of D.recipes) {
    const [id, qty] = r.makes;
    if (base[id] && pass === 0 && tierOf[id] != null) continue;
    const c = r.reagents.reduce((s, [rid, n]) => s + cost(rid) * n, 0) / qty;
    base[id] = Math.round(c * (0.7 + ((id * 9301) % 100) / 100));
  }
}
// Disenchanting mats.
Object.assign(base, { 10940: 400, 11083: 1200, 11137: 2500, 11176: 4500, 16204: 9000, 10938: 1500, 10939: 4200,
  10998: 2000, 11082: 6500, 11134: 4000, 11135: 12500, 11174: 7000, 11175: 22000, 16202: 12000, 16203: 38000,
  10978: 3000, 11084: 9000, 11138: 12000, 11139: 20000, 11177: 25000, 11178: 40000, 14343: 30000, 14344: 70000, 20725: 250000 });
// Gear (non-commodity auctions) for disenchant tests: [id, quality, ilvl, class, price]
const GEAR = [];
for (let i = 0; i < 30; i++) GEAR.push([30000 + i, i % 5 === 0 ? 3 : 2, 15 + (i * 7) % 46, i % 3 === 0 ? 2 : 4, 1500 + ((i * 7919) % 60000)]);
// A few non-dataset items so flips have something to find.
for (let i = 0; i < 20; i++) base[20000 + i] = 5000 + i * 3000;

const houses = [110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 123, 124, 125];
const nameFor = i => ["Alliance", "Horde", "Blackwater"][i % 3] + " Auction House";
await fs.mkdir(outDir, { recursive: true });
const w = (p, body) => fs.writeFile(path.join(outDir, p + ".json"), JSON.stringify(body));

await w("data_wow_ruleset_index", { rulesets: [{ id: 1, name: "PvP" }, { id: 2, name: "Normal" }, { id: 3, name: "Roleplay" }, { id: 15, name: "Roleplay PvP" }] });
await w("data_wow_ruleset_1_auctions", { auctions: houses.map((id, i) => ({ id, name: nameFor(i), key: { href: `https://us.api.blizzard.com/data/wow/ruleset/1/auctions/${id}` } })) });

let aid = 1;
for (const [i, hid] of houses.entries()) {
  if ([112, 115, 118].includes(hid)) { await w(`data_wow_ruleset_1_auctions_${hid}`, { id: hid, name: nameFor(i) }); continue; }
  const houseMult = 0.85 + (i % 5) * 0.08;
  const commodities = [], gear = [];
  for (const [id, p] of Object.entries(base)) {
    if (rand() < 0.08) continue; // not listed this hour
    const n = 2 + Math.floor(rand() * 12);
    for (let k = 0; k < n; k++) {
      let unit = Math.round(p * houseMult * (0.9 + rand() * 0.5));
      if (crash && k === 0 && Number(id) >= 20000 && Number(id) % 3 === 0) unit = Math.round(unit * 0.45);
      commodities.push({ id: aid++, item: { id: Number(id) }, quantity: 1 + Math.floor(rand() * 20), unit_price: unit, time_left: "LONG" });
    }
  }
  for (const [gid, , , , gp] of GEAR) {
    if (rand() < 0.2) continue;
    for (let k = 0; k < 1 + Math.floor(rand() * 3); k++)
      gear.push({ id: aid++, item: { id: gid, bonus_lists: [] }, buyout: Math.round(gp * houseMult * (0.8 + rand() * 0.6)), quantity: 1, time_left: "LONG" });
  }
  gear.push({ id: aid++, item: { id: 20019, context: 0, bonus_lists: [], modifiers: [] }, buyout: 90000, quantity: 1, time_left: "LONG" });
  gear.push({ id: aid++, item: { id: 20019 }, bid: 50000, quantity: 1, time_left: "SHORT" }); // bid-only
  await w(`data_wow_ruleset_1_auctions_${hid}`, {
    id: hid, name: nameFor(i), auctions: gear,
    commodities: { href: `https://us.api.blizzard.com/data/wow/ruleset/1/auctions/${hid}/commodities?namespace=dynamic-forever-us` },
    ruleset: { id: 1 }
  });
  await w(`data_wow_ruleset_1_auctions_${hid}_commodities`, { auctions: commodities });
}
for (let i = 0; i < 20; i += 2) await w(`data_wow_item_${20000 + i}`, { id: 20000 + i, name: `Mock Trade Good ${i}` });
const QN = ["POOR", "COMMON", "UNCOMMON", "RARE", "EPIC"];
for (const [gid, q, ilvl, cls] of GEAR)
  await w(`data_wow_item_${gid}`, { id: gid, name: `Mock ${q === 3 ? "Blue" : "Green"} ${cls === 2 ? "Sword" : "Bracers"} ${ilvl}`,
    quality: { type: QN[q] }, level: ilvl, item_class: { id: cls }, is_equippable: true });
console.log(`mock API written to ${outDir} (${Object.keys(base).length} priced items)`);
