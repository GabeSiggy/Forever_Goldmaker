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

  function makeMarket(data, prices, names) {
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

    return { buyCost, sellPrice, depth, nameOf, items, avg7 };
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
      if (unitSell == null || missing.length) continue; // can't price it right now
      const revenue = unitSell * makesQty * (1 - AH_CUT);
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
        reagents, gatherable,
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
      const parts = s.yields.map(([id, avg]) => {
        const p = m.sellPrice(id);
        return { id, name: m.nameOf(id), avg, unit: p, value: p != null ? p * avg * (1 - AH_CUT) : 0 };
      });
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

  function mobSuggestions(data, input, m) {
    return (data.mobFarms || [])
      .filter(f => input.charLevel >= f.minLevel)
      .map(f => {
        const parts = f.yields.map(([id, avg]) => {
          const p = m.sellPrice(id);
          return { id, name: m.nameOf(id), avg, unit: p, value: p != null ? p * avg * (1 - AH_CUT) : 0 };
        });
        return {
          type: "mob", name: f.name, minLevel: f.minLevel, zones: f.zones, parts,
          valuePerKill: parts.reduce((t, p) => t + p.value, 0),
          links: routeLinks(f.name.replace(/\s*\(.*\)/, ""), f.zones, f.yields[0][0], "farm")
        };
      })
      .sort((a, b) => b.valuePerKill - a.valuePerKill);
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
    const m = makeMarket(data, input.prices, input.names);
    const crafts = craftSuggestions(data, input, m);
    const gather = gatherSuggestions(data, input, m);
    const mobs = mobSuggestions(data, input, m);
    const flips = flipSuggestions(data, input, m);
    return { crafts, gather, mobs, flips, plan: buildPlan(input, crafts, gather, mobs, flips) };
  }

  function buildPlan(input, crafts, gather, mobs, flips) {
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
    } else if (mobs[0] && mobs[0].valuePerKill > 0) {
      steps.push(`Farm ${mobs[0].name} in ${mobs[0].zones[0]} (about ${fmt(mobs[0].valuePerKill)} per kill).`);
    }
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
