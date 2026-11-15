(function () {
  const D = window.GAME_DATA, E = window.Engine, fmt = E.fmt;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const STORE = "forever-goldmaker:v1";

  let base = "data/", houses = [], names = {}, priceCache = {}, lastResult = null;

  // ---------- data loading ----------
  async function getJSON(url) {
    const r = await fetch(url, { cache: "no-cache" });
    if (!r.ok) throw new Error(url + " " + r.status);
    return r.json();
  }

  async function loadIndex() {
    let idx;
    try { idx = await getJSON(base + "houses.json"); }
    catch { base = "demo/"; idx = await getJSON(base + "houses.json"); $("demoBanner").hidden = false; }
    houses = idx.houses.filter(h => h.listings > 0);
    try { names = await getJSON(base + "item-names.json"); } catch { names = {}; }
    renderHouseOptions();
    setFreshness(idx.updated);
  }

  // Friendly ruleset names per house group: shared labels from config.js, then this browser's own labels.
  const RULESETS = ["Normal", "PvP", "RP", "RP-PvP"];
  const LABEL_STORE = "forever-goldmaker:group-labels";
  const localLabels = () => { try { return JSON.parse(localStorage.getItem(LABEL_STORE)) || {}; } catch { return {}; } };
  const groupLabel = g => (window.HOUSE_GROUP_LABELS || {})[g] || localLabels()[g] || null;
  const houseName = h => `${h.faction} · ${groupLabel(h.group) || "Unlabeled (group " + h.group + ")"}`;

  const FACTION_ORDER = { Alliance: 0, Horde: 1, Blackwater: 2 };

  function renderHouseOptions() {
    const sel = $("house"), keep = sel.value;
    houses.sort((a, b) => a.group - b.group || (FACTION_ORDER[a.faction] ?? 9) - (FACTION_ORDER[b.faction] ?? 9) || a.id - b.id);
    sel.innerHTML = houses.map(h =>
      `<option value="${h.id}">${esc(houseName(h))} (${h.listings.toLocaleString()} listings)</option>`
    ).join("");
    if (keep && houses.some(h => String(h.id) === keep)) sel.value = keep;
    renderRealmType();
  }

  // Lets the user name the selected house's group right under the dropdown (saved in this browser).
  function renderRealmType() {
    const h = houses.find(x => String(x.id) === $("house").value);
    const field = $("realmTypeField");
    if (!h || (window.HOUSE_GROUP_LABELS || {})[h.group]) { field.hidden = true; return; }
    field.hidden = false;
    const cur = groupLabel(h.group) || "";
    $("realmType").innerHTML = `<option value="">Not sure (group ${h.group})</option>`
      + RULESETS.map(n => `<option ${n === cur ? "selected" : ""}>${n}</option>`).join("");
  }

  function setGroupLabel(group, value) {
    const labels = localLabels();
    if (value) labels[group] = value; else delete labels[group];
    try { localStorage.setItem(LABEL_STORE, JSON.stringify(labels)); } catch {}
    renderHouseOptions();
  }

  async function prices(houseId) {
    if (!priceCache[houseId]) priceCache[houseId] = await getJSON(`${base}prices-${houseId}.json`);
    return priceCache[houseId];
  }

  function setFreshness(iso) {
    const mins = Math.round((Date.now() - new Date(iso)) / 60000);
    const stale = mins > 120;
    const ago = mins < 60 ? `${mins} min ago` : `${Math.round(mins / 60)} h ago`;
    $("freshness").innerHTML = `<span class="dot ${stale ? "stale" : ""}"></span>Prices updated ${ago}`;
  }

  // ---------- inputs ----------
  function renderProfInputs(state) {
    $("profs").innerHTML = Object.entries(D.professions).map(([key, p]) => {
      const on = state.professions[key] != null;
      const lvl = on ? state.professions[key] : 1;
      return `<label class="prof ${on ? "" : "off"}" data-prof="${key}">
        <input type="checkbox" ${on ? "checked" : ""} aria-label="${p.name}">
        <span>${p.name}<span class="kind">${p.kind}${p.secondary ? " · secondary" : ""}</span></span>
        <input type="number" min="1" max="300" value="${lvl}" aria-label="${p.name} skill">
      </label>`;
    }).join("");
    $("profs").querySelectorAll(".prof").forEach(row => {
      const cb = row.querySelector("input[type=checkbox]");
      const num = row.querySelector("input[type=number]");
      cb.addEventListener("change", () => row.classList.toggle("off", !cb.checked));
      num.addEventListener("input", () => { if (!cb.checked) { cb.checked = true; row.classList.remove("off"); } });
    });
  }

  function readState() {
    const professions = {};
    $("profs").querySelectorAll(".prof").forEach(row => {
      if (row.querySelector("input[type=checkbox]").checked) {
        professions[row.dataset.prof] = clamp(+row.querySelector("input[type=number]").value || 1, 1, 300);
      }
    });
    return {
      house: +$("house").value,
      faction: $("faction").value,
      charLevel: clamp(+$("charLevel").value || 60, 1, 60),
      gold: Math.max(0, +$("budget").value || 0),
      professions
    };
  }

  function applyState(s) {
    if (s.house && houses.some(h => h.id === s.house)) $("house").value = s.house;
    renderRealmType();
    $("faction").value = s.faction || "";
    $("charLevel").value = s.charLevel ?? 60;
    $("budget").value = s.gold ?? 100;
    renderProfInputs(s);
  }

  function stateFromHash() {
    if (!location.hash.includes("p=")) return null;
    const q = new URLSearchParams(location.hash.slice(1));
    const professions = {};
    (q.get("p") || "").split(",").filter(Boolean).forEach(pair => {
      const [k, v] = pair.split(":"); if (D.professions[k]) professions[k] = +v || 1;
    });
    return { house: +q.get("h") || null, faction: q.get("f") || "", charLevel: +q.get("lvl") || 60, gold: +q.get("g") || 0, professions };
  }

  function shareLink(s) {
    const p = Object.entries(s.professions).map(([k, v]) => `${k}:${v}`).join(",");
    return `${location.origin}${location.pathname}#h=${s.house}&f=${s.faction}&lvl=${s.charLevel}&g=${s.gold}&p=${p}`;
  }

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ---------- results ----------
  async function run() {
    const s = readState();
    try { localStorage.setItem(STORE, JSON.stringify(s)); } catch {}
    const p = await prices(s.house);
    const house = houses.find(h => h.id === s.house);
    const faction = s.faction || (house && house.faction !== "Blackwater" ? house.faction : null);
    const res = E.recommend(D, {
      professions: s.professions, charLevel: s.charLevel, faction, budget: s.gold * 10000, prices: p, names
    });
    lastResult = res;
    $("plan").innerHTML = res.plan.map(x => `<li>${esc(x)}</li>`).join("");
    renderCraft(res.crafts, s);
    renderGather(res.gather, s);
    renderFarms(res.farms, faction);
    renderFlips(res.flips);
    $("nCraft").textContent = res.crafts.length;
    $("nGather").textContent = res.gather.unlocked.length;
    $("nFarms").textContent = res.farms.list.length + res.farms.arbitrage.length;
    $("nFlips").textContent = res.flips.length;
  }

  const links = arr => `<span class="links">${arr.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</span>`;
  const warnTags = ws => ws.map(w => `<span class="tag warn">${esc(w)}</span>`).join("");
  const table = (head, rows) => `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;

  function renderCraft(list, s) {
    const el = $("tab-craft");
    const crafting = Object.keys(s.professions).filter(k => D.recipes.some(r => r.prof === k));
    if (!crafting.length) { el.innerHTML = `<p class="empty">Tick a crafting profession (or Mining for smelting) to see what's profitable to make.</p>`; return; }
    if (!list.length) { el.innerHTML = `<p class="empty">Nothing in your recipe list is profitable on this auction house right now (10%+ margin after the AH cut).</p>`; return; }
    el.innerHTML = table(
      `<th>Make</th><th class="num">Mats cost</th><th class="num">Sells for</th><th class="num">Profit each</th><th class="num">Suggested batch</th><th class="num">Batch profit</th>`,
      list.map(c => `<tr>
        <td><span class="name">${esc(c.name)}${c.makesQty > 1 ? ` ×${c.makesQty}` : ""}</span>
          <span class="meta">${esc(D.professions[c.prof].name)} ${c.skill} · ${c.reagents.map(r => `${r.qty}× ${esc(r.name)}${r.source === "vendor" ? " (vendor)" : ""}`).join(", ")}</span>
          ${c.gatherable.length ? `<span class="tag own">You can gather: ${esc(c.gatherable.join(", "))}</span>` : ""}${warnTags(c.warnings)}</td>
        <td class="num">${fmt(c.cost)}</td>
        <td class="num">${fmt(c.revenue)}<span class="meta">${c.listed.toLocaleString()} listed</span></td>
        <td class="num good">${fmt(c.profit)}<span class="meta">${Math.round(c.margin * 100)}%</span></td>
        <td class="num">${c.batch ? c.batch : `<span class="bad">need ${fmt(c.needGold)}</span>`}</td>
        <td class="num good">${c.batch ? fmt(c.batchProfit) : "—"}</td>
      </tr>`).join("")
    ) + `<p class="muted small">Profit is after the 5% AH cut, buying mats at market price. If you gather a mat yourself, that's still its real cost: you could have sold it raw. Batch size is capped by your gold and by how much of the item the market already holds.</p>`;
  }

  function renderGather(g, s) {
    const el = $("tab-gather");
    const gathering = Object.keys(s.professions).filter(k => D.professions[k].kind === "gathering");
    if (!gathering.length) { el.innerHTML = `<p class="empty">Tick Herbalism, Mining, Skinning or Fishing to see what's worth farming. No gathering profession? Check <em>Raw farming</em>.</p>`; return; }
    const row = x => `<tr>
      <td><span class="name">${esc(x.name)}</span><span class="meta">${esc(D.professions[x.prof].name)} ${x.skill}${x.unlocked ? "" : ` · need ${x.skillGap} more skill`}</span>
        <span class="meta">${x.parts.map(p => `${p.avg}× ${esc(p.name)} @ ${p.unit == null ? "no data" : fmt(p.unit)}`).join(" · ")}</span>${warnTags(x.warnings)}</td>
      <td>${esc(x.zones.join(", "))}${x.note ? `<span class="meta">${esc(x.note)}</span>` : ""}</td>
      <td class="num ${x.valuePerGather ? "good" : "muted"}">${x.valuePerGather ? fmt(x.valuePerGather) : "no data"}</td>
      <td>${links(x.links)}</td></tr>`;
    const head = `<th>Farm</th><th>Best zones</th><th class="num">Value per gather</th><th>Maps &amp; routes</th>`;
    el.innerHTML = (g.unlocked.length ? table(head, g.unlocked.map(row).join("")) : `<p class="empty">No sources unlocked yet at your skill.</p>`)
      + (g.nextUp.length ? `<h3 class="subhead">Worth leveling toward</h3>` + table(head, g.nextUp.map(row).join("")) : "")
      + `<p class="muted small">Value per gather = average yield × market price, after the AH cut. Yields are estimates; Forever adds rare "scarce" materials on top. Wowhead's item page shows where it's gathered; GatherMate2 records nodes as you go.</p>`;
  }

  function renderFarms(f, faction) {
    const el = $("tab-farms");
    const part = p => `${esc(p.name)} ${p.rare ? `(${+(p.avg * 100).toFixed(1)}% chance)` : `×${p.avg}`} @ ${p.unit == null ? "no data" : fmt(p.unit)}${p.how && p.how !== "AH" ? ` <em>(${esc(p.how)})</em>` : ""}`;
    let html = "";
    if (f.list.length) {
      html += table(`<th>Farm</th><th>Where</th><th class="num">Value per</th><th>Maps &amp; routes</th>`,
        f.list.map(x => `<tr><td><span class="name">${esc(x.name)}</span>
            <span class="meta">Level ${x.minLevel}+${x.faction ? ` · ${esc(x.faction)} only` : ""} · ${x.parts.map(part).join(" · ")}</span>
            ${x.jackpots.map(j => `<span class="tag own">Jackpot: ${esc(j.name)} ${fmt(j.unit)}</span>`).join("")}
            ${x.note ? `<span class="meta">${esc(x.note)}</span>` : ""}${warnTags(x.warnings)}</td>
          <td>${esc(x.zones.join(", "))}</td>
          <td class="num ${x.valuePerUnit ? "good" : "muted"}">${x.valuePerUnit ? fmt(x.valuePerUnit) : "no data"}<span class="meta">per ${esc(x.unit)}</span></td>
          <td>${links(x.links)}</td></tr>`).join(""));
    } else html += `<p class="empty">No raw farms for your level yet.</p>`;
    if (f.arbitrage.length) {
      html += `<h3 class="subhead">Turn-in arbitrage</h3>` + table(`<th>Turn-in</th><th class="num">Buy inputs</th><th class="num">Sell reward</th><th class="num">Profit</th>`,
        f.arbitrage.map(a => `<tr><td><span class="name">${esc(a.name)}</span><span class="meta">${esc(a.inputs.join(" + "))} → ${esc(a.outputs.join(" + "))} · ${esc(a.npc)}</span>${warnTags(a.warnings)}</td>
          <td class="num">${fmt(a.cost)}</td><td class="num">${fmt(a.revenue)}</td><td class="num good">${fmt(a.profit)}</td></tr>`).join(""));
    }
    html += `<p class="muted small">No profession needed. Each item is valued at its best outlet after fees: the AH, an NPC turn-in, or a vendor. Rare drops are counted at their odds, so a 1% chance at a 7g item adds 7s per attempt.${faction ? ` Showing ${esc(faction)} farms.` : " Pick your faction to hide farms you can't do."}</p>`;
    el.innerHTML = html;
  }

  function renderFlips(list) {
    const el = $("tab-flips");
    if (!list.length) { el.innerHTML = `<p class="empty">No flips right now. Flips need at least 3 days of price history, and an item listed at 30%+ below its 7-day average that you can afford.</p>`; return; }
    el.innerHTML = table(`<th>Item</th><th class="num">Cheapest now</th><th class="num">7-day avg</th><th class="num">Profit per unit</th><th class="num">Buy up to</th>`,
      list.map(f => `<tr><td><span class="name">${esc(f.name)}</span><span class="meta">${f.listed.toLocaleString()} listed · ${f.days} days of history</span>
          <span class="links"><a href="https://www.wowhead.com/forever/item=${f.itemId}" target="_blank" rel="noopener">Wowhead</a></span></td>
        <td class="num">${fmt(f.buyAt)}<span class="meta">${Math.round(f.discount * 100)}% under avg</span></td>
        <td class="num">${fmt(f.avg7)}</td><td class="num good">${fmt(f.unitProfit)}</td><td class="num">${fmt(f.maxBuy)}</td></tr>`).join(""))
      + `<p class="muted small">Risky by nature: prices are an hour old and someone may beat you to it. Only buy listings priced at or below "Buy up to", and check the item still sells at the average before buying many.</p>`;
  }

  // ---------- auction house finder ----------
  function parseMoney(str) {
    const s = String(str).toLowerCase();
    let total = 0, hit = false;
    for (const [re, mult] of [[/(\d+(?:\.\d+)?)\s*g/, 10000], [/(\d+)\s*s/, 100], [/(\d+)\s*c/, 1]]) {
      const m = s.match(re); if (m) { total += parseFloat(m[1]) * mult; hit = true; }
    }
    if (!hit && /^\s*\d+(\.\d+)?\s*$/.test(s)) total = parseFloat(s) * 10000; // bare number = gold
    return Math.round(total);
  }

  function setupFinder() {
    const common = [2447, 765, 785, 2450, 3356, 3821, 8838, 13463, 2770, 2771, 2772, 3858, 10620, 2318, 4234, 2589, 4306, 4338, 14047];
    $("finderItem").innerHTML = common.map(id => `<option value="${id}">${esc(D.items[id].name)}</option>`).join("");
    $("finderGo").addEventListener("click", async () => {
      const id = $("finderItem").value, seen = parseMoney($("finderPrice").value);
      if (!seen) { $("finderOut").innerHTML = `<li>Enter a price like 1g 20s.</li>`; return; }
      const rows = [];
      for (const h of houses) {
        try {
          const p = (await prices(h.id)).items[id];
          if (p) rows.push({ h, diff: Math.abs(p[0] - seen) / seen, min: p[0] });
        } catch {}
      }
      rows.sort((a, b) => a.diff - b.diff);
      $("finderOut").innerHTML = rows.slice(0, 3).map(r => {
        const cur = groupLabel(r.h.group) || "";
        const locked = (window.HOUSE_GROUP_LABELS || {})[r.h.group];
        return `<li><a href="#" data-house="${r.h.id}">${esc(houseName(r.h))}</a>: cheapest ${fmt(r.min)}
          ${locked ? "" : `<label class="small muted">This is
            <select data-group="${r.h.group}"><option value="">(pick realm type)</option>${RULESETS.map(n => `<option ${n === cur ? "selected" : ""}>${n}</option>`).join("")}</select></label>`}</li>`;
      }).join("") || `<li>No house lists that item right now.</li>`;
      $("finderOut").querySelectorAll("a").forEach(a => a.addEventListener("click", e => {
        e.preventDefault(); $("house").value = a.dataset.house; run();
      }));
      $("finderOut").querySelectorAll("select[data-group]").forEach(sel => sel.addEventListener("change", () => {
        setGroupLabel(sel.dataset.group, sel.value);
        $("finderOut").querySelectorAll("a").forEach(a => { a.textContent = houseName(houses.find(h => h.id == a.dataset.house)); });
      }));
    });
  }

  // ---------- boot ----------
  async function boot() {
    try { await loadIndex(); }
    catch (e) { $("plan").innerHTML = `<li class="bad">Couldn't load auction data (${esc(e.message)}).</li>`; return; }
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE)); } catch {}
    const initial = stateFromHash() || saved || { house: window.DEFAULT_HOUSE_ID, charLevel: 60, gold: 100, professions: { herbalism: 150, alchemy: 150 } };
    applyState(initial);
    setupFinder();

    document.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => {
      document.querySelectorAll(".tabs button").forEach(x => x.classList.toggle("active", x === b));
      document.querySelectorAll(".tab").forEach(t => t.hidden = t.id !== "tab-" + b.dataset.tab);
    }));
    $("go").addEventListener("click", run);
    $("house").addEventListener("change", () => { renderRealmType(); run(); });
    $("realmType").addEventListener("change", () => {
      const h = houses.find(x => String(x.id) === $("house").value);
      if (h) setGroupLabel(h.group, $("realmType").value);
    });
    $("share").addEventListener("click", async () => {
      const link = shareLink(readState());
      try { await navigator.clipboard.writeText(link); $("shareMsg").textContent = "Link copied. Send it to a friend, or bookmark it."; }
      catch { $("shareMsg").textContent = link; }
    });
    run();
  }
  boot();
})();
