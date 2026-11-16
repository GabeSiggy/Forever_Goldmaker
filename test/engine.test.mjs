import fs from "node:fs"; import vm from "node:vm"; import assert from "node:assert";
const ctx = { window: {} }; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ["site/game-data.js", "site/engine.js"]) vm.runInContext(fs.readFileSync(f, "utf8"), ctx);
const D = ctx.window.GAME_DATA, E = ctx.window.Engine;
const prices = JSON.parse(fs.readFileSync("site/demo/prices-110.json"));
const names = JSON.parse(fs.readFileSync("site/demo/item-names.json"));
const itemInfo = JSON.parse(fs.readFileSync("site/demo/item-info.json"));

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
// Disenchanting
const ench = E.recommend(D, { professions: { enchanting: 300 }, charLevel: 60, budget: 1000 * 10000, prices, names, itemInfo });
console.log("DE:", ench.disenchant.length, ench.disenchant.slice(0, 3).map(d => `${d.name} buy ${E.fmt(d.buyAt)} -> ${E.fmt(d.deValue)}`));
assert(ench.disenchant.length > 0 && ench.disenchant.every(d => d.deValue > d.buyAt));
const m = E.makeMarket(D, prices, names, itemInfo);
const green = Object.keys(itemInfo).find(id => itemInfo[id] && itemInfo[id][1] === 2 && itemInfo[id][2] >= 56 && itemInfo[id][3] === 4);
const dv = m.deValue(green);
console.log("green ilvl", itemInfo[green][2], "DE parts:", dv.parts.map(p => `${p.avg} ${p.name}`), "skill", dv.skill);
assert(Math.abs(dv.parts[0].avg - 0.75 * 1.5) < 1e-9 || Math.abs(dv.parts[0].avg - 0.75 * 3.5) < 1e-9);
// Craft-to-DE: a recipe whose product is a green should pick disenchanting when it pays more
const D3 = { ...D, items: { ...D.items, 99999: { name: "Test Green Bracers", q: 2, ilvl: 58, cls: 4 } },
  recipes: [{ prof: "tailoring", skill: 1, makes: [99999, 1], reagents: [[2589, 1]] }] };
const c3 = E.recommend(D3, { professions: { tailoring: 300, enchanting: 300 }, charLevel: 60, budget: 1e7, prices, names, itemInfo }).crafts;
console.log("craft-DE:", c3.map(c => `${c.name} via ${c.outlet} ${E.fmt(c.revenue)}`)); assert(c3[0].outlet === "disenchant");
const c4 = E.recommend(D3, { professions: { tailoring: 300 }, charLevel: 60, budget: 1e7, prices, names, itemInfo }).crafts;
assert(c4.length === 0); // no AH price and no enchanting -> nothing to sell into
// Essence combine arbitrage shows up when the gap exists
const essArb = ench.farms.arbitrage.filter(a => /Essence/.test(a.name)).map(a => `${a.name} +${E.fmt(a.profit)}`);
console.log("essence arb:", essArb);
// Not-disenchantable items: enchanter wands (by id and by name) and user-flagged items
const wandPrices = { items: { ...prices.items, 11288: [100, 120, 50, 10], 55555: [100, 120, 50, 10], 30001: [100, 120, 5, 2] }, avg7: prices.avg7 };
const wandInfo = { ...itemInfo, 11288: ["Greater Magic Wand", 2, 13, 2, 1], 55555: ["Brilliant Wand", 2, 60, 2, 1], 30001: ["Cheap Green", 2, 58, 4, 1] };
const mw = E.makeMarket(D, wandPrices, {}, wandInfo);
assert(mw.deValue(11288) === null && mw.deValue(55555) === null && mw.deValue(30001) !== null);
assert(mw.deValue(30001).skill === 1);
const flagged = E.recommend(D, { professions: { enchanting: 1 }, charLevel: 60, budget: 1e7, prices: wandPrices, names: {}, itemInfo: wandInfo, noDE: [30001] });
assert(!flagged.disenchant.some(d => d.itemId === 30001 || d.itemId === 11288));
console.log("noDE OK; enchanting 1 can DE ilvl 58:", E.recommend(D, { professions: { enchanting: 1 }, charLevel: 60, budget: 1e7, prices: wandPrices, names: {}, itemInfo: wandInfo }).disenchant.some(d => d.itemId === 30001 && d.canDE));
console.log("fmt:", E.fmt(1234567), E.fmt(950), E.fmt(-20050));
console.log("ALL OK");
