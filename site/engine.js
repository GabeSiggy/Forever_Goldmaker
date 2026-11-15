/*
 * Recommendation engine. Pure functions, no DOM. Works in the browser (window.Engine) and Node (tests).
 *
 * input = {
 *   professions: { herbalism: 225, alchemy: 240, ... },   // skill levels; missing = not trained
 *   charLevel: 52,
 *   budget: 1500000,                                      // copper
 *   prices: { items: { id: [min, market, qty, listings] }, avg7: { id: [avg, days] } },
 *   names:  { id: "Item name" }                           // optional, from the API name cache
 * }
 */
(function (root) {
  const AH_CUT = 0.05;          // Auction house cut on sales (vanilla rules)
  const MIN_MARGIN = 0.10;      // ignore crafts under 10% margin
  const FLIP_DISCOUNT = 0.70;   // flip when cheapest listing <= 70% of 7-day average
  const FLIP_MIN_DAYS = 3;      // need this many days of history before trusting the average

  function makeMarket(data, prices, names, itemInfo) {
    const items = prices.items || {};
    const avg7 = prices.avg7 || {};
    const nameOf = id => (data.items[id] && data.items[id].name) || (names && names[id]) || `Item #${id}`;

    // What it costs to get one unit: NPC vendor if sold there, otherwise AH market price.
    function buyCost(id) {
      const meta = data.items[id];
      if (meta && meta.vendor != null) return { price: meta.vendor, source: "vendor" };
      const p = items[id];
      if (!p) return null;
      return { price: p[1], source: "ah" };
    }

    // Realistic sale price for one unit before the AH cut: the market price, damped if it just spiked.
    function sellPrice(id) {
      const p = items[id];
      if (!p) return null;
      let price = p[1];
      const h = avg7[id];
      if (h && h[1] >= 2) price = Math.min(price, Math.round(h[0] * 1.25));
      return price;
    }

    function depth(id) { const p = items[id]; return p ? p[2] : 0; }

    // Best value of one unit you already hold, after fees: sell on the AH, turn it in, or vendor it.
    function unitValue(id, faction) {
      const meta = data.items[id] || {};
      const options = [];
      const ah = meta.noAH ? null : sellPrice(id);
      if (ah != null) options.push({ value: ah * (1 - AH_CUT), how: "AH" });
      for (const c of data.conversions || []) {
        if (!factionOk(c.faction, faction) || c.inputs.length !== 1 || c.inputs[0][0] !== Number(id)) continue;
        let out = 0, ok = true;
        for (const [oid, oq] of c.outputs) { const p = sellPrice(oid); if (p == null) ok = false; else out += p * oq * (1 - AH_CUT); }
        if (ok) options.push({ value: out / c.inputs[0][1], how: `turn in ${c.inputs[0][1]} for ${c.outputs.map(o => nameOf(o[0])).join(" + ")}` });
      }
      if (meta.sell) options.push({ value: meta.sell, how: "vendor" });
      if (!options.length) return null;
      return options.sort((a, b) => b.value - a.value)[0];
    }

    // Quality / item level / type: from game-data.js (q, ilvl, cls) if set, else from the API cache.
    function infoOf(id) {
      const meta = data.items[id];
      if (meta && meta.q != null) return { q: meta.q, ilvl: meta.ilvl, cls: meta.cls, equip: 1 };
      const a = itemInfo && itemInfo[id];
      return a ? { q: a[1], ilvl: a[2], cls: a[3], equip: a[4] } : null;
    }

    // Expected value of disenchanting one item, after the AH cut on the mats. null = can't be disenchanted / unknown.
    function deValue(id, faction) {
      const de = data.disenchant, inf = infoOf(id);
      if (!de || !inf || !inf.equip || inf.q < 2 || inf.q > 4 || inf.ilvl == null || (inf.cls !== 2 && inf.cls !== 4)) return null;
      const b = de.brackets.find(x => inf.ilvl <= x.maxIlvl);
      if (!b) return null;
      let outcomes;
      if (inf.q === 2) {
        const o = de.odds[inf.cls === 2 ? "weapon" : "armor"];
        outcomes = [[b.dust[0], (o.dust + (b.shard ? 0 : o.shard)) * b.dust[1]], [b.essence[0], o.essence * b.essence[1]]];
        if (b.shard) outcomes.push([b.shard, o.shard]);
      } else if (inf.q === 3) outcomes = b.rare;
      else outcomes = b.epic;
      if (!outcomes) return null;
      let value = 0, priced = 0;
      const parts = outcomes.map(([mid, avg]) => {
        const v = unitValue(mid, faction);
        if (v) { value += v.value * avg; priced++; }
        return { id: mid, name: nameOf(mid), avg, unit: v ? v.value : null };
      });
      if (!priced) return null;
      return { value, skill: b.skill, ilvl: inf.ilvl, quality: inf.q, parts };
    }

    return { buyCost, sellPrice, depth, nameOf, unitValue, infoOf, deValue, items, avg7 };
  }

  function factionOk(required, mine) { return !required || !mine || required === mine; }

  function valueParts(yields, m, faction) {
    return yields.map(([id, avg]) => {
      const v = m.unitValue(id, faction);
      return { id, name: m.nameOf(id), avg, unit: v ? v.value : null, how: v ? v.how : null,
               value: v ? v.value * avg : 0, rare: avg <= 0.05 };
    });
  }

  function craftSuggestions(data, input, m) {
    const out = [];
    for (const r of data.recipes) {
      const lvl = input.professions[r.prof];
      if (lvl == null || lvl < r.skill) continue;
      const [productId, makesQty] = r.makes;
      const unitSell = m.sellPrice(productId);
      let cost = 0, missing = [];
      const reagents = r.reagents.map(([id, qty]) => {
        const c = m.buyCost(id);
        if (!c) missing.push(m.nameOf(id)); else cost += c.price * qty;
        return { id, name: m.nameOf(id), qty, unit: c ? c.price : null, source: c ? c.source : null };
      });
      if (missing.length) continue; // can't price the mats right now
      const de = m.deValue(productId, input.faction);
      const enchSkill = input.professions.enchanting;
      const canDE = de && enchSkill != null && enchSkill >= de.skill;
      const sellRevenue = unitSell != null ? unitSell * makesQty * (1 - AH_CUT) : null;
      const deRevenue = de ? de.value * makesQty : null;
      let outlet = "sell", revenue = sellRevenue;
      if (canDE && (revenue == null || deRevenue > revenue)) { outlet = "disenchant"; revenue = deRevenue; }
      if (revenue == null) continue;
      const profit = revenue - cost;
      const margin = cost > 0 ? profit / cost : 1;
      if (profit <= 0 || margin < MIN_MARGIN) continue;

      // How many to make: limited by gold on hand and by how much the market can absorb.
      const listed = m.depth(productId);
      const marketCap = Math.max(5, Math.min(40, Math.ceil(listed * 0.25)));
      const affordable = cost > 0 ? Math.floor(input.budget / cost) : marketCap;
      const batch = Math.min(marketCap, affordable);
      const gatherable = r.reagents
        .filter(([id]) => data.sources.some(s => input.professions[s.prof] >= s.skill && s.yields.some(y => y[0] === id)))
        .map(([id]) => m.nameOf(id));

      out.push({
        type: "craft", prof: r.prof, skill: r.skill,
        itemId: productId, name: m.nameOf(productId), makesQty,
        cost, revenue, profit, margin, listed, batch, marketCap,
        batchProfit: profit * batch,
        needGold: batch === 0 ? cost : 0,
        reagents, gatherable, outlet, de, sellRevenue, deRevenue,
        deHint: de && !canDE && deRevenue > (sellRevenue || 0) && deRevenue > cost
          ? `Worth ${fmt(deRevenue)} disenchanted (needs Enchanting ${de.skill})` : null,
        warnings: [r.cooldown, r.requires, r.note, r.verify ? "Recipe not yet verified for Forever" : null].filter(Boolean)
      });
    }
    out.sort((a, b) => (b.batchProfit - a.batchProfit) || (b.profit - a.profit));
    return out;
  }

  function gatherSuggestions(data, input, m) {
    const out = [];
    for (const s of data.sources) {
      const lvl = input.professions[s.prof];
      if (lvl == null) continue;
      const parts = valueParts(s.yields, m, input.faction);
      const valuePerGather = parts.reduce((t, p) => t + p.value, 0);
      const primary = s.yields[0][0];
      out.push({
        type: "gather", prof: s.prof, skill: s.skill, name: s.name,
        unlocked: lvl >= s.skill, skillGap: Math.max(0, s.skill - lvl),
        valuePerGather, parts, zones: s.zones, note: s.note,
        primaryId: primary, listed: m.depth(primary),
        links: routeLinks(s.name, s.zones, primary, s.prof),
        warnings: s.verify ? ["Not yet verified for Forever"] : []
      });
    }
    const unlocked = out.filter(o => o.unlocked).sort((a, b) => b.valuePerGather - a.valuePerGather);
    // Worth leveling toward: the next few locked sources that beat your current best.
    const best = unlocked[0] ? unlocked[0].valuePerGather : 0;
    const nextUp = out.filter(o => !o.unlocked && o.valuePerGather > best && o.skillGap <= 50)
      .sort((a, b) => a.skillGap - b.skillGap).slice(0, 3);
    return { unlocked, nextUp };
  }

  function farmSuggestions(data, input, m) {
    const farms = [
      ...(data.mobFarms || []).map(f => ({ ...f, unit: f.unit || "kill" })),
      ...(data.rawFarms || [])
    ];
    const out = farms
      .filter(f => input.charLevel >= f.minLevel && factionOk(f.faction, input.faction))
      .map(f => {
        const parts = valueParts(f.yields, m, input.faction);
        return {
          type: "farm", name: f.name, unit: f.unit, minLevel: f.minLevel, faction: f.faction || null,
          zones: f.zones, note: f.note, parts,
          valuePerUnit: parts.reduce((t, p) => t + p.value, 0),
          jackpots: parts.filter(p => p.rare && p.unit && p.unit >= 10000).sort((a, b) => b.unit - a.unit),
          links: routeLinks(f.name.replace(/\s*\(.*\)/, ""), f.zones, f.yields[0][0], "farm"),
          warnings: f.verify ? ["Drop rates are estimates"] : []
        };
      })
      .sort((a, b) => b.valuePerUnit - a.valuePerUnit);

    // Turn-in arbitrage: buy the inputs on the AH, hand them in, sell the reward.
    const arbitrage = [];
    for (const c of data.conversions || []) {
      if (!factionOk(c.faction, input.faction)) continue;
      let cost = 0, ok = true;
      for (const [id, q] of c.inputs) {
        if ((data.items[id] || {}).noAH) { ok = false; break; }
        const b = m.buyCost(id); if (!b) { ok = false; break; } cost += b.price * q;
      }
      if (!ok) continue;
      let revenue = 0;
      for (const [id, q] of c.outputs) { const p = m.sellPrice(id); if (p == null) { ok = false; break; } revenue += p * q * (1 - AH_CUT); }
      if (!ok || revenue <= cost) continue;
      arbitrage.push({ type: "conversion", name: c.name, npc: c.npc, cost, revenue, profit: revenue - cost,
        inputs: c.inputs.map(([id, q]) => `${q}× ${m.nameOf(id)}`), outputs: c.outputs.map(([id, q]) => `${q}× ${m.nameOf(id)}`),
        warnings: c.verify ? ["Turn-in not yet verified for Forever"] : [] });
    }
    arbitrage.sort((a, b) => b.profit - a.profit);
    return { list: out, arbitrage };
  }

  function disenchantSuggestions(data, input, m, limit = 30) {
    const ench = input.professions.enchanting;
    const out = [];
    for (const [id, p] of Object.entries(m.items)) {
      const de = m.deValue(id, input.faction);
      if (!de) continue;
      const buy = p[0];
      const profit = de.value - buy;
      if (profit <= 0 || profit < buy * 0.10) continue;
      out.push({
        type: "disenchant", itemId: Number(id), name: m.nameOf(id), buyAt: buy, listed: p[2],
        deValue: de.value, profit, margin: buy ? profit / buy : 1, skill: de.skill, ilvl: de.ilvl,
        quality: de.quality, parts: de.parts,
        canDE: ench != null && ench >= de.skill, affordable: buy <= input.budget
      });
    }
    out.sort((a, b) => (b.canDE - a.canDE) || (b.affordable - a.affordable) || (b.profit - a.profit));
    return out.slice(0, limit);
  }

  function flipSuggestions(data, input, m, limit = 25) {
    const out = [];
    for (const [id, p] of Object.entries(m.items)) {
      const h = m.avg7[id];
      if (!h || h[1] < FLIP_MIN_DAYS) continue;
      const [min, , qty, listings] = p;
      const avg = h[0];
      if (min > avg * FLIP_DISCOUNT || min > input.budget || listings < 1) continue;
      const unitProfit = avg * (1 - AH_CUT) - min;
      if (unitProfit <= 0) continue;
      out.push({
        type: "flip", itemId: Number(id), name: m.nameOf(id), buyAt: min, avg7: avg,
        unitProfit, discount: 1 - min / avg, listed: qty, days: h[1],
        maxBuy: Math.round(avg * FLIP_DISCOUNT)
      });
    }
    out.sort((a, b) => b.unitProfit * Math.min(5, b.listed) - a.unitProfit * Math.min(5, a.listed));
    return out.slice(0, limit);
  }

  function routeLinks(name, zones, itemId, prof) {
    const q = s => encodeURIComponent(s);
    const zone = zones && zones[0] ? zones[0].replace(/\s*\(.*\)/, "") : "";
    const links = [
      { label: "Wowhead map", url: `https://www.wowhead.com/forever/item=${itemId}` },
      { label: "Route videos", url: `https://www.youtube.com/results?search_query=${q(`WoW Forever ${name} farm route ${zone}`)}` }
    ];
    if (prof === "herbalism") links.push({ label: "wow.gg herb zones", url: "https://wow.gg/professions/forever/herbalism" });
    return links;
  }

  /** Top-level: everything the UI shows, plus a one-paragraph plan. */
  function recommend(data, input) {
    const m = makeMarket(data, input.prices, input.names, input.itemInfo);
    const crafts = craftSuggestions(data, input, m);
    const gather = gatherSuggestions(data, input, m);
    const farms = farmSuggestions(data, input, m);
    const flips = flipSuggestions(data, input, m);
    const disenchant = disenchantSuggestions(data, input, m);
    return { crafts, gather, farms, flips, disenchant, plan: buildPlan(input, crafts, gather, farms, flips, disenchant) };
  }

  function buildPlan(input, crafts, gather, farms, flips, disenchant = []) {
    const mobs = farms.list;
    const steps = [];
    const affordable = crafts.filter(c => c.batch > 0);
    const topGather = gather.unlocked[0];
    if (affordable[0]) {
      const c = affordable[0];
      steps.push(`Craft ${c.batch}× ${c.name} for about ${fmt(c.batchProfit)} profit (${fmt(c.profit)} each, ${Math.round(c.margin * 100)}% margin).`);
    } else if (crafts[0]) {
      steps.push(`Your best craft is ${crafts[0].name} (${fmt(crafts[0].profit)} each), but you need ${fmt(crafts[0].cost)} for mats. Farm first.`);
    }
    const unit = { herbalism: "herb node", mining: "vein", skinning: "skin", fishing: "catch" };
    if (topGather && topGather.valuePerGather > 0) {
      steps.push(`Gather ${topGather.name} in ${topGather.zones.slice(0, 2).join(" or ")} (about ${fmt(topGather.valuePerGather)} per ${unit[topGather.prof] || "gather"}).`);
    }
    const topFarm = mobs.find(f => f.valuePerUnit > 0);
    if (topFarm && (!topGather || topFarm.valuePerUnit * 3 > topGather.valuePerGather)) {
      steps.push(`Raw farm: ${topFarm.name} in ${topFarm.zones[0]} (about ${fmt(topFarm.valuePerUnit)} per ${topFarm.unit}${topFarm.jackpots[0] ? `, with a ${Math.round(topFarm.jackpots[0].avg * 100)}% shot at ${topFarm.jackpots[0].name} worth ${fmt(topFarm.jackpots[0].unit)}` : ""}).`);
    }
    if (farms.arbitrage[0]) {
      const a = farms.arbitrage[0];
      const where = /bags/.test(a.npc || "") ? "convert them in your bags" : `hand them in at ${a.npc}`;
      steps.push(`Conversion: buy ${a.inputs.join(" + ")} for ${fmt(a.cost)}, ${where}, and sell ${a.outputs.join(" + ")} for ${fmt(a.revenue)}.`);
    }
    const de = disenchant.find(d => d.canDE && d.affordable);
    if (de) steps.push(`Disenchant: buy ${de.name} at ${fmt(de.buyAt)} and disenchant it for about ${fmt(de.deValue)} in mats (${fmt(de.profit)} profit each).`);
    if (flips[0]) steps.push(`Flip check: ${flips[0].name} is listed at ${fmt(flips[0].buyAt)} vs a 7-day average of ${fmt(flips[0].avg7)}.`);
    if (gather.nextUp[0]) steps.push(`Level ${gather.nextUp[0].prof[0].toUpperCase() + gather.nextUp[0].prof.slice(1)} ${gather.nextUp[0].skillGap} more points to unlock ${gather.nextUp[0].name} (${fmt(gather.nextUp[0].valuePerGather)} per gather).`);
    if (!steps.length) steps.push("No prices yet for your professions on this auction house. Try again after the next hourly update.");
    return steps;
  }

  function fmt(copper) {
    if (copper == null || isNaN(copper)) return "?";
    const neg = copper < 0; let c = Math.round(Math.abs(copper));
    const g = Math.floor(c / 10000), s = Math.floor((c % 10000) / 100); c = c % 100;
    const str = g ? `${g.toLocaleString()}g ${s}s` : s ? `${s}s ${c}c` : `${c}c`;
    return (neg ? "-" : "") + str;
  }

  const Engine = { recommend, fmt, makeMarket, AH_CUT };
  if (typeof module !== "undefined" && module.exports) module.exports = Engine;
  root.Engine = Engine;
})(typeof window !== "undefined" ? window : globalThis);
