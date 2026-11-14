# Forever Goldmaker

A free website for you and your friends that reads every **WoW Forever** auction house hourly and tells each player:

- **Craft & sell:** which recipes they can make at their skill level are profitable after the 5% AH cut, and how many to make with the gold they have.
- **Gather:** which herb, ore, skin or fish is worth the most per node at their skill, with the best zones, a Wowhead map link and route videos. It also shows nodes just above their skill that are worth leveling toward.
- **Farm mobs:** cloth and elemental farms for their character level (no profession needed).
- **Flips:** items listed 30%+ under their 7-day average that they can afford.

Everything runs on GitHub for free. An hourly GitHub Action pulls Blizzard's auction data and publishes the site to GitHub Pages. There's no server to maintain.

## Setup (about 15 minutes)

1. **Blizzard API key.** Go to <https://develop.battle.net>, log in with Battle.net, open *API Access* and create a client. Copy the **Client ID** and **Client Secret**.
2. **GitHub repo.** Create a new repository and push this folder to its `main` branch.
3. **Secrets.** In the repo, go to *Settings → Secrets and variables → Actions* and add:
   - `BLIZZARD_CLIENT_ID`
   - `BLIZZARD_CLIENT_SECRET`
   - Optional variable (*Variables* tab): `REGION` = `us` (default) or `eu`
4. **Pages.** Go to *Settings → Pages → Source* and choose **GitHub Actions**.
5. **First run.** Go to *Actions → "Update AH prices and deploy site" → Run workflow*. When it finishes, your site is live at `https://<you>.github.io/<repo>/`, and it refreshes every hour after that.
6. **Label your auction house.** Blizzard's API doesn't say which ruleset (Normal, PvP, RP) a house belongs to. Open the site, expand **"Which auction house am I on?"**, type a price you see in game, and it will match your house. Then put a friendly name in `site/config.js` (e.g. `1: "Normal"`) and set `DEFAULT_HOUSE_ID`.

Send friends the link. Each person's professions, level and gold are saved in their own browser. **Copy share link** gives a link with their setup built in.

## How it works

```
GitHub Action (hourly)
  scripts/fetch-ah.mjs ──► Blizzard API (dynamic-forever-us)
     │  every auction house: listings + commodities
     ▼
  site/data/prices-<house>.json   min, market price, quantity per item, 7-day average
  site/data/houses.json           house list (faction, group)
  site/data/item-names.json       names for items not in game-data.js
     ▼
GitHub Pages ──► site/index.html + engine.js (all calculations run in the browser)
```

- **Market price** is the average of the cheapest 15% of units, with outlier listings excluded.
- **History** is a daily average per item, kept for 14 days. Each run reads the previous history back from the live site, so nothing gets committed every hour. Flips appear after 3 days of history.
- **No dependencies.** It needs only Node 18+ (Actions uses Node 22).

## About the WoW Forever API (important)

WoW Forever launched on Nov 4, 2026. Blizzard's API serves its auction data, but the API is **not officially documented yet** (endpoints are based on community findings, Nov 2026):

- Realms don't exist. Auction houses hang off **rulesets**: `/data/wow/ruleset/{id}/auctions/` (the trailing slash matters), then `/data/wow/ruleset/{id}/auctions/{houseId}` and `.../commodities`, with namespace `dynamic-forever-{region}`.
- At launch, every ruleset returned the same 15 houses (5 groups of Alliance / Horde / Blackwater). The script reads them once.
- The item endpoint (`static-forever-{region}`) has no names for many items. The script caches what it can and the site falls back to `Item #id`.

If Blizzard changes these endpoints, the Action will fail loudly. The fix is usually a path or namespace change near the top of `scripts/fetch-ah.mjs`.

## Game data: please improve it

`site/game-data.js` holds the recipes, gathering sources, yields and zones. It's a **vanilla baseline** (item IDs, skill levels and zones from the original game). Forever's herb zones were cross-checked against wow.gg's Forever page and matched. But Forever added 600+ new recipes and "scarce" gathering mats, and moved some Healing Potions out of Alchemy. Entries marked `verify: true` show a warning on the site.

To add a recipe, add one line under `recipes` (use Wowhead for IDs):

```js
{ prof: "alchemy", skill: 250, makes: [ITEM_ID, 1], reagents: [[HERB_ID, 2], [8925, 1]] },
```

Yields per node are estimates. Tune them after a few farming sessions.

## Local development

```bash
# Run the full pipeline with fake API data (no keys needed), writes site/demo/
node scripts/make-mock.mjs test/mock 0 && MOCK_DIR=test/mock OUT_DIR=site/demo node scripts/fetch-ah.mjs
node test/engine.test.mjs        # engine + data integrity checks
cd site && python3 -m http.server 8000   # open http://localhost:8000
```

The site uses `site/data/` when it exists and falls back to `site/demo/` with a "demo prices" banner.

Real data, locally: `BLIZZARD_CLIENT_ID=... BLIZZARD_CLIENT_SECRET=... node scripts/fetch-ah.mjs`

## Ideas for v2

- **In-game scan import.** Forever's AH addons (Auctioneer Forever, auxForever, Hammerprice) save scans to SavedVariables. A small uploader could merge fresher prices.
- **Scarce materials** (Pyrite, Frilled Lichen, Pristine Leather, ...) once their item IDs are known.
- **Discord bot** that posts the top flips and crafts for your house each morning.
