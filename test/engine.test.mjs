import fs from "node:fs"; import vm from "node:vm"; import assert from "node:assert";
const ctx = { window: {} }; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ["site/game-data.js", "site/engine.js"]) vm.runInContext(fs.readFileSync(f, "utf8"), ctx);
const D = ctx.window.GAME_DATA, E = ctx.window.Engine;
const prices = JSON.parse(fs.readFileSync("site/demo/prices-110.json"));
const names = JSON.parse(fs.readFileSync("site/demo/item-names.json"));

// Data integrity: every id referenced exists in items
const ids = new Set(Object.keys(D.items).map(Number));
for (const r of D.recipes) for (const [id] of [r.makes, ...r.reagents]) assert(ids.has(id), "missing item " + id);
for (const s of D.sources) for (const [id] of s.yields) assert(ids.has(id), "missing item " + id);
for (const f of D.mobFarms) for (const [id] of f.yields) assert(ids.has(id), "missing item " + id);

const res = E.recommend(D, { professions: { herbalism: 290, alchemy: 300 }, charLevel: 60, budget: 500 * 10000, prices, names });
console.log("PLAN:\n - " + res.plan.join("\n - "));
console.log("crafts:", res.crafts.length, res.crafts.slice(0, 4).map(c => `${c.name} ${E.fmt(c.profit)} x${c.batch}`));
console.log("gather:", res.gather.unlocked.slice(0, 4).map(g => `${g.name} ${E.fmt(g.valuePerGather)}`));
console.log("flips:", res.flips.length, res.flips.slice(0, 3).map(f => `${f.name} ${E.fmt(f.buyAt)} vs ${E.fmt(f.avg7)}`));
// sanity checks
for (const c of res.crafts) { assert(c.profit > 0); assert(c.batch * c.cost <= 500 * 10000 + 1); }
const poor = E.recommend(D, { professions: { mining: 120, blacksmithing: 100 }, charLevel: 25, budget: 0, prices, names });
console.log("POOR PLAN:\n - " + poor.plan.join("\n - "));
assert(poor.crafts.every(c => c.batch === 0));
const none = E.recommend(D, { professions: {}, charLevel: 10, budget: 0, prices: { items: {}, avg7: {} }, names: {} });
console.log("EMPTY PLAN:", none.plan);
// Raw farming: Shellfish valued via turn-in, faction filtering, jackpot
const horde = E.recommend(D, { professions: {}, charLevel: 60, faction: "Horde", budget: 100 * 10000, prices, names });
const trap = horde.farms.list.find(f => f.name === "Shellfish Traps");
console.log("TRAP:", E.fmt(trap.valuePerUnit), trap.parts.map(p => `${p.name}: ${E.fmt(p.unit)} via ${p.how}`), "jackpots:", trap.jackpots.map(j => j.name));
assert(trap.parts[0].how.startsWith("turn in 5"));
assert(trap.jackpots.some(j => j.name === "Big Iron Fishing Pole"));
const ally = E.recommend(D, { professions: {}, charLevel: 60, faction: "Alliance", budget: 0, prices, names });
assert(!ally.farms.list.some(f => f.name === "Shellfish Traps"));
console.log("HORDE PLAN:\n - " + horde.plan.join("\n - "));
// Arbitrage with a synthetic AH-buyable conversion
const D2 = { ...D, conversions: [{ name: "Test swap", npc: "Test NPC", inputs: [[2589, 10]], outputs: [[6367, 1]] }] };
const arb = E.recommend(D2, { professions: {}, charLevel: 60, budget: 0, prices, names }).farms.arbitrage;
console.log("ARB:", arb.map(a => `${a.name} ${E.fmt(a.cost)} -> ${E.fmt(a.revenue)}`)); assert(arb.length === 1);
console.log("fmt:", E.fmt(1234567), E.fmt(950), E.fmt(-20050));
console.log("ALL OK");
