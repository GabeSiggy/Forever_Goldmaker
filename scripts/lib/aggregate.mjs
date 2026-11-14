// Pure functions: turn raw auction listings into per-item price stats, and roll them into history.

/**
 * listings: array of { itemId, unitPrice (copper), quantity }
 * returns { [itemId]: [min, market, qty, listings] }
 *   market = average unit price of the cheapest 15% of units (same idea TSM/forevermastery use),
 *   after dropping listings priced > 10x the cheapest-15% average (troll/outlier listings).
 */
export function aggregateListings(listings) {
  const byItem = new Map();
  for (const l of listings) {
    if (!l.unitPrice || l.unitPrice <= 0 || !l.quantity) continue;
    let arr = byItem.get(l.itemId);
    if (!arr) byItem.set(l.itemId, (arr = []));
    arr.push(l);
  }
  const out = {};
  for (const [itemId, arr] of byItem) {
    arr.sort((a, b) => a.unitPrice - b.unitPrice);
    const totalQty = arr.reduce((s, l) => s + l.quantity, 0);
    const market = cheapestShareAvg(arr, totalQty, 0.15);
    out[itemId] = [arr[0].unitPrice, Math.round(market), totalQty, arr.length];
  }
  return out;
}

function cheapestShareAvg(sorted, totalQty, share) {
  const target = Math.max(1, Math.ceil(totalQty * share));
  let taken = 0, sum = 0;
  for (const l of sorted) {
    const take = Math.min(l.quantity, target - taken);
    sum += take * l.unitPrice;
    taken += take;
    if (taken >= target) break;
  }
  return sum / taken;
}

/** Normalize Blizzard auction entries (commodities use unit_price; items use buyout for the whole stack). */
export function normalizeAuctions(entries = []) {
  const out = [];
  for (const a of entries) {
    const itemId = a.item?.id;
    const quantity = a.quantity ?? 1;
    let unitPrice = a.unit_price;
    if (unitPrice == null && a.buyout != null) unitPrice = Math.round(a.buyout / quantity);
    if (itemId && unitPrice) out.push({ itemId, unitPrice, quantity });
  }
  return out;
}

/**
 * history: { days: { [itemId]: [[dayNumber, avgMarket, samples], ...] } }
 * Adds this snapshot's market prices into today's running average; keeps `keepDays` days.
 */
export function updateHistory(history, items, now = new Date(), keepDays = 14) {
  const day = Math.floor(now.getTime() / 86400000);
  const h = history && history.days ? history : { days: {} };
  for (const [id, stats] of Object.entries(items)) {
    const market = stats[1];
    const series = h.days[id] || (h.days[id] = []);
    const last = series[series.length - 1];
    if (last && last[0] === day) {
      last[1] = Math.round((last[1] * last[2] + market) / (last[2] + 1));
      last[2] += 1;
    } else {
      series.push([day, market, 1]);
    }
  }
  for (const id of Object.keys(h.days)) {
    h.days[id] = h.days[id].filter(p => p[0] > day - keepDays);
    if (!h.days[id].length) delete h.days[id];
  }
  return h;
}

/** Collapse history into { [itemId]: [avg7d, daysOfData] } for the website. */
export function summarizeHistory(history, now = new Date()) {
  const day = Math.floor(now.getTime() / 86400000);
  const out = {};
  for (const [id, series] of Object.entries(history.days || {})) {
    const recent = series.filter(p => p[0] > day - 7);
    if (!recent.length) continue;
    const avg = recent.reduce((s, p) => s + p[1], 0) / recent.length;
    out[id] = [Math.round(avg), recent.length];
  }
  return out;
}

/** "Alliance Auction House" -> "Alliance"; Blackwater is the neutral house. */
export function factionFromName(name = "") {
  if (/alliance/i.test(name)) return "Alliance";
  if (/horde/i.test(name)) return "Horde";
  if (/blackwater|neutral/i.test(name)) return "Blackwater";
  return "Unknown";
}
