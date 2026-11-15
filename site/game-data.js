/*
 * Forever Goldmaker: starter game data.
 *
 * Baseline: original (vanilla) item IDs, recipes, skill levels and zones. WoW Forever keeps the
 * vanilla professions and zones but adds 600+ new recipes, "scarce" gathering materials and
 * some moved recipes. Entries with `verify: true` are ones we're less sure carried over unchanged.
 * Every number here is editable; the site re-reads this file on load.
 *
 * Prices are never stored here except vendor prices (`vendor`, in copper) for reagents
 * you buy from an NPC (vials, thread, salt). Everything else comes from the live AH data.
 */
window.GAME_DATA = {
  version: "2026-11-13-baseline",

  professions: {
    alchemy:        { name: "Alchemy",        kind: "crafting" },
    blacksmithing:  { name: "Blacksmithing",  kind: "crafting" },
    enchanting:     { name: "Enchanting",     kind: "crafting" },
    engineering:    { name: "Engineering",    kind: "crafting" },
    leatherworking: { name: "Leatherworking", kind: "crafting" },
    tailoring:      { name: "Tailoring",      kind: "crafting" },
    herbalism:      { name: "Herbalism",      kind: "gathering" },
    mining:         { name: "Mining",         kind: "gathering" },
    skinning:       { name: "Skinning",       kind: "gathering" },
    cooking:        { name: "Cooking",        kind: "crafting", secondary: true },
    firstaid:       { name: "First Aid",      kind: "crafting", secondary: true },
    fishing:        { name: "Fishing",        kind: "gathering", secondary: true }
  },

  // id -> { name, vendor?: copper price to buy from an NPC }
  items: {
    // Herbs
    2447: { name: "Peacebloom" }, 765: { name: "Silverleaf" }, 2449: { name: "Earthroot" },
    785: { name: "Mageroyal" }, 2450: { name: "Briarthorn" }, 2452: { name: "Swiftthistle" },
    3820: { name: "Stranglekelp" }, 2453: { name: "Bruiseweed" }, 3355: { name: "Wild Steelbloom" },
    3369: { name: "Grave Moss" }, 3356: { name: "Kingsblood" }, 3357: { name: "Liferoot" },
    3818: { name: "Fadeleaf" }, 3821: { name: "Goldthorn" }, 3358: { name: "Khadgar's Whisker" },
    3819: { name: "Wintersbite" }, 4625: { name: "Firebloom" }, 8831: { name: "Purple Lotus" },
    8836: { name: "Arthas' Tears" }, 8838: { name: "Sungrass" }, 8839: { name: "Blindweed" },
    8845: { name: "Ghost Mushroom" }, 8846: { name: "Gromsblood" }, 13464: { name: "Golden Sansam" },
    13463: { name: "Dreamfoil" }, 13465: { name: "Mountain Silversage" }, 13466: { name: "Plaguebloom" },
    13467: { name: "Icecap" }, 13468: { name: "Black Lotus" },
    // Ores, bars, stones, gems
    2770: { name: "Copper Ore" }, 2771: { name: "Tin Ore" }, 2775: { name: "Silver Ore" },
    2772: { name: "Iron Ore" }, 2776: { name: "Gold Ore" }, 3858: { name: "Mithril Ore" },
    7911: { name: "Truesilver Ore" }, 10620: { name: "Thorium Ore" }, 11370: { name: "Dark Iron Ore" },
    2840: { name: "Copper Bar" }, 3576: { name: "Tin Bar" }, 2841: { name: "Bronze Bar" },
    2842: { name: "Silver Bar" }, 3575: { name: "Iron Bar" }, 3577: { name: "Gold Bar" },
    3859: { name: "Steel Bar" }, 3860: { name: "Mithril Bar" }, 6037: { name: "Truesilver Bar" },
    12359: { name: "Thorium Bar" }, 11371: { name: "Dark Iron Bar" }, 3857: { name: "Coal" },
    2835: { name: "Rough Stone" }, 2836: { name: "Coarse Stone" }, 2838: { name: "Heavy Stone" },
    7912: { name: "Solid Stone" }, 12365: { name: "Dense Stone" },
    774: { name: "Malachite" }, 818: { name: "Tigerseye" }, 1210: { name: "Shadowgem" },
    1206: { name: "Moss Agate" }, 1705: { name: "Lesser Moonstone" }, 1529: { name: "Jade" },
    3864: { name: "Citrine" }, 7909: { name: "Aquamarine" }, 7910: { name: "Star Ruby" },
    12361: { name: "Blue Sapphire" }, 12799: { name: "Large Opal" }, 12364: { name: "Huge Emerald" },
    12800: { name: "Azerothian Diamond" }, 12363: { name: "Arcane Crystal" }, 12360: { name: "Arcanite Bar" },
    // Leather & hides
    2318: { name: "Light Leather" }, 2319: { name: "Medium Leather" }, 4234: { name: "Heavy Leather" },
    4304: { name: "Thick Leather" }, 8170: { name: "Rugged Leather" },
    783: { name: "Light Hide" }, 4232: { name: "Medium Hide" }, 4235: { name: "Heavy Hide" },
    8169: { name: "Thick Hide" }, 8171: { name: "Rugged Hide" },
    4231: { name: "Cured Light Hide" }, 4233: { name: "Cured Medium Hide" }, 4236: { name: "Cured Heavy Hide" },
    8172: { name: "Cured Thick Hide" },
    // Cloth
    2589: { name: "Linen Cloth" }, 2592: { name: "Wool Cloth" }, 4306: { name: "Silk Cloth" },
    4338: { name: "Mageweave Cloth" }, 14047: { name: "Runecloth" }, 14256: { name: "Felcloth" },
    2996: { name: "Bolt of Linen Cloth" }, 2997: { name: "Bolt of Woolen Cloth" }, 4305: { name: "Bolt of Silk Cloth" },
    4339: { name: "Bolt of Mageweave" }, 14048: { name: "Bolt of Runecloth" }, 14342: { name: "Mooncloth" },
    // Elemental / enchanting
    7068: { name: "Elemental Fire" }, 7067: { name: "Elemental Earth" }, 7070: { name: "Elemental Water" },
    7069: { name: "Elemental Air" }, 7078: { name: "Essence of Fire" }, 7076: { name: "Essence of Earth" },
    7080: { name: "Essence of Water" }, 7082: { name: "Essence of Air" }, 12808: { name: "Essence of Undeath" },
    12803: { name: "Living Essence" },
    10940: { name: "Strange Dust" }, 11176: { name: "Dream Dust" }, 16204: { name: "Illusion Dust" },
    10938: { name: "Lesser Magic Essence" }, 14344: { name: "Large Brilliant Shard" },
    // Fish & food
    6358: { name: "Oily Blackmouth" }, 13422: { name: "Stonescale Eel" }, 13758: { name: "Raw Redgill" },
    13759: { name: "Raw Nightfin Snapper" }, 13755: { name: "Winter Squid" }, 21071: { name: "Raw Sagefish" },
    18255: { name: "Runn Tum Tuber" },
    // Vendor reagents (approximate NPC prices, copper)
    3371: { name: "Empty Vial", vendor: 20 }, 3372: { name: "Leaded Vial", vendor: 100 },
    8925: { name: "Crystal Vial", vendor: 1600 }, 18256: { name: "Imbued Vial", vendor: 8000 },
    2320: { name: "Coarse Thread", vendor: 10 }, 2321: { name: "Fine Thread", vendor: 100 },
    8343: { name: "Heavy Silken Thread", vendor: 2000 }, 14341: { name: "Rune Thread", vendor: 5000 },
    4289: { name: "Salt", vendor: 50 }, 4470: { name: "Simple Wood", vendor: 38 },
    159: { name: "Refreshing Spring Water", vendor: 25 }, 3713: { name: "Soothing Spices", vendor: 160 },
    2678: { name: "Mild Spices", vendor: 10 }, 17034: { name: "Maple Seed", vendor: 50 },
    8150: { name: "Deeprock Salt" },
    // Crafted products
    118: { name: "Minor Healing Potion" }, 2454: { name: "Elixir of Lion's Strength" },
    5997: { name: "Elixir of Minor Defense" }, 2455: { name: "Minor Mana Potion" },
    2459: { name: "Swiftness Potion" }, 858: { name: "Lesser Healing Potion" },
    3383: { name: "Elixir of Wisdom" }, 929: { name: "Healing Potion" }, 3385: { name: "Lesser Mana Potion" },
    6370: { name: "Blackmouth Oil" }, 5634: { name: "Free Action Potion" }, 1710: { name: "Greater Healing Potion" },
    3827: { name: "Mana Potion" }, 3825: { name: "Elixir of Fortitude" }, 8949: { name: "Elixir of Agility" },
    3928: { name: "Superior Healing Potion" }, 9155: { name: "Arcane Elixir" },
    9187: { name: "Elixir of Greater Agility" }, 9206: { name: "Elixir of Giants" },
    9264: { name: "Elixir of Shadow Power" }, 13442: { name: "Mighty Rage Potion" },
    13443: { name: "Superior Mana Potion" }, 13446: { name: "Major Healing Potion" },
    13444: { name: "Major Mana Potion" }, 13452: { name: "Elixir of the Mongoose" },
    13454: { name: "Greater Arcane Elixir" }, 13457: { name: "Greater Fire Protection Potion" },
    13458: { name: "Greater Nature Protection Potion" }, 13456: { name: "Greater Frost Protection Potion" },
    13423: { name: "Stonescale Oil" }, 13510: { name: "Flask of the Titans" },
    13511: { name: "Flask of Distilled Wisdom" }, 13512: { name: "Flask of Supreme Power" },
    2862: { name: "Rough Sharpening Stone" }, 2863: { name: "Coarse Sharpening Stone" },
    2871: { name: "Heavy Sharpening Stone" }, 7964: { name: "Solid Sharpening Stone" },
    12404: { name: "Dense Sharpening Stone" }, 12643: { name: "Dense Weightstone" },
    3478: { name: "Coarse Grinding Stone" }, 3486: { name: "Heavy Grinding Stone" },
    7966: { name: "Solid Grinding Stone" }, 12644: { name: "Dense Grinding Stone" },
    4357: { name: "Rough Blasting Powder" }, 4364: { name: "Coarse Blasting Powder" },
    4377: { name: "Heavy Blasting Powder" }, 10505: { name: "Solid Blasting Powder" },
    15992: { name: "Dense Blasting Powder" }, 15994: { name: "Thorium Widget" },
    15993: { name: "Thorium Grenade" }, 18641: { name: "Dense Dynamite" }, 4390: { name: "Iron Grenade" },
    2304: { name: "Light Armor Kit" }, 2313: { name: "Medium Armor Kit" }, 4265: { name: "Heavy Armor Kit" },
    8173: { name: "Thick Armor Kit" }, 15564: { name: "Rugged Armor Kit" },
    4238: { name: "Linen Bag" }, 10050: { name: "Mageweave Bag" }, 14046: { name: "Runecloth Bag" },
    11287: { name: "Lesser Magic Wand" }, 20744: { name: "Minor Wizard Oil" }, 20747: { name: "Lesser Mana Oil" },
    20748: { name: "Brilliant Mana Oil" }, 20749: { name: "Brilliant Wizard Oil" },
    1251: { name: "Linen Bandage" }, 2581: { name: "Heavy Linen Bandage" }, 3531: { name: "Heavy Wool Bandage" },
    6451: { name: "Heavy Silk Bandage" }, 8545: { name: "Heavy Mageweave Bandage" },
    14529: { name: "Runecloth Bandage" }, 14530: { name: "Heavy Runecloth Bandage" },
    13931: { name: "Nightfin Soup" }, 13928: { name: "Grilled Squid" }, 18254: { name: "Runn Tum Tuber Surprise" },
    21072: { name: "Smoked Sagefish" },
    // Raw-farm loot. `sell` = vendor sell price (copper); `noAH: true` = can't be listed (quest items).
    6367: { name: "Big Iron Fishing Pole", sell: 2133 }, 13545: { name: "Shellfish", noAH: true },
    13546: { name: "Bloodbelly Fish" }, 7973: { name: "Big-mouth Clam" }, 7974: { name: "Zesty Clam Meat" },
    5500: { name: "Iridescent Pearl" }, 7971: { name: "Black Pearl" }, 13926: { name: "Golden Pearl" }
  },

  /*
   * Gathering sources. `skill` = profession skill needed. `yields` = average items per gather
   * (estimates; Forever's node depletion may differ, so tune these after a few farming sessions).
   * `zones` lists the best zones in rough order. Herb zones cross-checked against wow.gg's Forever
   * herbalism page (Nov 2026).
   */
  sources: [
    // Herbalism
    { prof: "herbalism", skill: 1,   name: "Peacebloom", yields: [[2447, 2]], zones: ["The Barrens", "Durotar", "Mulgore", "Tirisfal Glades", "Elwynn Forest"] },
    { prof: "herbalism", skill: 1,   name: "Silverleaf", yields: [[765, 2]], zones: ["Durotar", "The Barrens", "Mulgore", "Loch Modan"] },
    { prof: "herbalism", skill: 15,  name: "Earthroot", yields: [[2449, 2]], zones: ["The Barrens", "Durotar", "Tirisfal Glades", "Dun Morogh"] },
    { prof: "herbalism", skill: 50,  name: "Mageroyal", yields: [[785, 2], [2452, 0.2]], zones: ["The Barrens", "Ashenvale", "Darkshore", "Westfall"] },
    { prof: "herbalism", skill: 70,  name: "Briarthorn", yields: [[2450, 2], [2452, 0.2]], zones: ["The Barrens", "Duskwood", "Ashenvale", "Westfall"] },
    { prof: "herbalism", skill: 85,  name: "Stranglekelp", yields: [[3820, 2]], zones: ["Stranglethorn Vale", "Wetlands", "Ashenvale", "Darkshore"], note: "Underwater along coasts" },
    { prof: "herbalism", skill: 100, name: "Bruiseweed", yields: [[2453, 2]], zones: ["Stonetalon Mountains", "The Barrens", "Hillsbrad Foothills", "Wetlands"] },
    { prof: "herbalism", skill: 115, name: "Wild Steelbloom", yields: [[3355, 2]], zones: ["Arathi Highlands", "Stonetalon Mountains", "Stranglethorn Vale", "Wetlands"] },
    { prof: "herbalism", skill: 120, name: "Grave Moss", yields: [[3369, 2]], zones: ["Duskwood", "Desolace", "Wetlands", "Arathi Highlands"] },
    { prof: "herbalism", skill: 125, name: "Kingsblood", yields: [[3356, 2]], zones: ["Stranglethorn Vale", "Wetlands", "Ashenvale", "Hillsbrad Foothills"] },
    { prof: "herbalism", skill: 150, name: "Liferoot", yields: [[3357, 2]], zones: ["Stranglethorn Vale", "Wetlands", "Arathi Highlands", "Alterac Mountains"] },
    { prof: "herbalism", skill: 160, name: "Fadeleaf", yields: [[3818, 2]], zones: ["Arathi Highlands", "Swamp of Sorrows", "Alterac Mountains", "Stranglethorn Vale"] },
    { prof: "herbalism", skill: 170, name: "Goldthorn", yields: [[3821, 2]], zones: ["Stranglethorn Vale", "Arathi Highlands", "Swamp of Sorrows", "Alterac Mountains"] },
    { prof: "herbalism", skill: 185, name: "Khadgar's Whisker", yields: [[3358, 2]], zones: ["Stranglethorn Vale", "Arathi Highlands", "Swamp of Sorrows", "Alterac Mountains"] },
    { prof: "herbalism", skill: 195, name: "Wintersbite", yields: [[3819, 2]], zones: ["Alterac Mountains"] },
    { prof: "herbalism", skill: 205, name: "Firebloom", yields: [[4625, 2]], zones: ["Tanaris", "Searing Gorge", "Badlands"] },
    { prof: "herbalism", skill: 210, name: "Purple Lotus", yields: [[8831, 2]], zones: ["Azshara", "The Hinterlands", "Tanaris", "Feralas"] },
    { prof: "herbalism", skill: 220, name: "Arthas' Tears", yields: [[8836, 2]], zones: ["Western Plaguelands", "Eastern Plaguelands", "Felwood"] },
    { prof: "herbalism", skill: 230, name: "Sungrass", yields: [[8838, 2]], zones: ["Azshara", "The Hinterlands", "Feralas", "Eastern Plaguelands"] },
    { prof: "herbalism", skill: 235, name: "Blindweed", yields: [[8839, 2]], zones: ["Swamp of Sorrows", "Un'Goro Crater"] },
    { prof: "herbalism", skill: 245, name: "Ghost Mushroom", yields: [[8845, 2]], zones: ["The Hinterlands", "Desolace"], note: "Mostly in caves" },
    { prof: "herbalism", skill: 250, name: "Gromsblood", yields: [[8846, 2]], zones: ["Felwood", "Desolace"] },
    { prof: "herbalism", skill: 260, name: "Golden Sansam", yields: [[13464, 2], [13468, 0.01]], zones: ["Un'Goro Crater", "Azshara", "Eastern Plaguelands", "Felwood"] },
    { prof: "herbalism", skill: 270, name: "Dreamfoil", yields: [[13463, 2], [13468, 0.01]], zones: ["Azshara", "Eastern Plaguelands", "Un'Goro Crater", "Felwood"] },
    { prof: "herbalism", skill: 280, name: "Mountain Silversage", yields: [[13465, 2], [13468, 0.01]], zones: ["Winterspring", "Un'Goro Crater", "Azshara", "Burning Steppes"] },
    { prof: "herbalism", skill: 285, name: "Plaguebloom", yields: [[13466, 2], [13468, 0.01]], zones: ["Eastern Plaguelands", "Western Plaguelands"] },
    { prof: "herbalism", skill: 290, name: "Icecap", yields: [[13467, 2], [13468, 0.01]], zones: ["Winterspring"] },
    { prof: "herbalism", skill: 300, name: "Black Lotus", yields: [[13468, 1]], zones: ["Burning Steppes", "Winterspring", "Eastern Plaguelands", "Silithus"], note: "Rare spawn; contested" },

    // Mining (yields: ore + stone + small gem chances)
    { prof: "mining", skill: 1,   name: "Copper Vein", yields: [[2770, 3], [2835, 0.6], [774, 0.04], [818, 0.03], [1210, 0.02]], zones: ["Durotar", "Elwynn Forest", "Dun Morogh", "Mulgore", "Tirisfal Glades", "Westfall", "Loch Modan"] },
    { prof: "mining", skill: 65,  name: "Tin Vein", yields: [[2771, 3], [2836, 0.6], [1210, 0.03], [1206, 0.03], [1705, 0.02]], zones: ["The Barrens", "Redridge Mountains", "Wetlands", "Hillsbrad Foothills", "Stonetalon Mountains", "Ashenvale"] },
    { prof: "mining", skill: 75,  name: "Silver Vein", yields: [[2775, 2], [1206, 0.05], [1705, 0.05]], zones: ["The Barrens", "Redridge Mountains", "Wetlands", "Hillsbrad Foothills"], note: "Rare spawn in tin areas" },
    { prof: "mining", skill: 125, name: "Iron Deposit", yields: [[2772, 3], [2838, 0.6], [1529, 0.04], [3864, 0.03], [1705, 0.03]], zones: ["Arathi Highlands", "Desolace", "Stranglethorn Vale", "Badlands", "Thousand Needles", "Dustwallow Marsh"] },
    { prof: "mining", skill: 155, name: "Gold Vein", yields: [[2776, 2], [3864, 0.05], [1529, 0.05]], zones: ["Arathi Highlands", "Stranglethorn Vale", "Badlands", "Desolace"], note: "Rare spawn in iron/mithril areas" },
    { prof: "mining", skill: 175, name: "Mithril Deposit", yields: [[3858, 3], [7912, 0.6], [3864, 0.03], [7909, 0.03], [7910, 0.02]], zones: ["Badlands", "Tanaris", "Searing Gorge", "The Hinterlands", "Felwood", "Feralas", "Burning Steppes"] },
    { prof: "mining", skill: 230, name: "Truesilver Deposit", yields: [[7911, 2], [7909, 0.05], [7910, 0.05]], zones: ["Tanaris", "Searing Gorge", "Badlands", "The Hinterlands", "Un'Goro Crater"], note: "Rare spawn in mithril areas" },
    { prof: "mining", skill: 230, name: "Dark Iron Deposit", yields: [[11370, 3]], zones: ["Searing Gorge", "Burning Steppes", "Blackrock Depths"] },
    { prof: "mining", skill: 245, name: "Small Thorium Vein", yields: [[10620, 3], [12365, 0.6], [7910, 0.03], [12361, 0.02], [12799, 0.02]], zones: ["Un'Goro Crater", "Felwood", "Searing Gorge", "Burning Steppes", "Winterspring", "Western Plaguelands"] },
    { prof: "mining", skill: 275, name: "Rich Thorium Vein", yields: [[10620, 4], [12365, 0.8], [12363, 0.04], [12361, 0.03], [12364, 0.02], [12800, 0.02], [12799, 0.03]], zones: ["Un'Goro Crater", "Winterspring", "Burning Steppes", "Eastern Plaguelands", "Silithus", "Azshara"] },

    // Skinning (per beast skinned; zones by mob level)
    { prof: "skinning", skill: 1,   name: "Low-level beasts (1-20)", yields: [[2318, 1.5], [783, 0.08]], zones: ["The Barrens", "Westfall", "Darkshore", "Loch Modan", "Silverpine Forest"] },
    { prof: "skinning", skill: 100, name: "Beasts lvl 20-30", yields: [[2319, 1.5], [4232, 0.08]], zones: ["Hillsbrad Foothills", "Wetlands", "Ashenvale", "Stonetalon Mountains", "Duskwood"] },
    { prof: "skinning", skill: 200, name: "Beasts lvl 30-40", yields: [[4234, 1.5], [4235, 0.08]], zones: ["Arathi Highlands", "Desolace", "Stranglethorn Vale", "Thousand Needles", "Dustwallow Marsh"] },
    { prof: "skinning", skill: 250, name: "Beasts lvl 40-50", yields: [[4304, 1.5], [8169, 0.08]], zones: ["Feralas", "Tanaris", "The Hinterlands", "Azshara", "Searing Gorge"] },
    { prof: "skinning", skill: 285, name: "Beasts lvl 50-60", yields: [[8170, 1.6], [8171, 0.08]], zones: ["Un'Goro Crater", "Winterspring", "Burning Steppes", "Silithus", "Eastern Plaguelands"] },

    // Fishing (per catch)
    { prof: "fishing", skill: 100, name: "Oily Blackmouth (schools)", yields: [[6358, 1]], zones: ["The Barrens coast", "Westfall coast", "Darkshore", "Wetlands"], verify: true },
    { prof: "fishing", skill: 250, name: "Stonescale Eel (swarms)", yields: [[13422, 1]], zones: ["Azshara", "Feralas coast", "Tanaris coast", "Un'Goro Crater"], verify: true },
    { prof: "fishing", skill: 225, name: "Nightfin / Redgill (night, inland)", yields: [[13759, 0.5], [13758, 0.5]], zones: ["Felwood", "Western Plaguelands", "Azshara", "Winterspring"], verify: true },
    { prof: "fishing", skill: 250, name: "Winter Squid (winter months)", yields: [[13755, 1]], zones: ["Azshara", "Feralas", "Tanaris"], verify: true }
  ],

  /*
   * Mob farms anyone can do (no profession needed): cloth and elementals. `minLevel` = character level
   * that can farm the area comfortably. `yields` are rough per-kill averages.
   */
  mobFarms: [
    { name: "Linen Cloth (humanoids lvl 5-15)", minLevel: 8, yields: [[2589, 0.35]], zones: ["Westfall (Defias)", "Silverpine Forest", "The Barrens (Quilboar)"] },
    { name: "Wool Cloth (humanoids lvl 15-25)", minLevel: 18, yields: [[2592, 0.35]], zones: ["Redridge Mountains", "Hillsbrad Foothills", "Stonetalon Mountains"] },
    { name: "Silk Cloth (humanoids lvl 25-35)", minLevel: 28, yields: [[4306, 0.35]], zones: ["Stranglethorn Vale", "Arathi Highlands", "Desolace"] },
    { name: "Mageweave (humanoids lvl 35-48)", minLevel: 40, yields: [[4338, 0.4]], zones: ["Tanaris (Wastewander)", "Feralas (Gordunni)", "The Hinterlands"] },
    { name: "Runecloth (humanoids lvl 48-60)", minLevel: 52, yields: [[14047, 0.45]], zones: ["Winterspring (Winterfall)", "Eastern Plaguelands", "Felwood", "Burning Steppes"] },
    { name: "Felcloth (Felwood satyrs)", minLevel: 52, yields: [[14256, 0.12], [14047, 0.4]], zones: ["Felwood (Jadefire satyrs)", "Azshara satyrs"] },
    { name: "Elemental Fire (fire elementals)", minLevel: 45, yields: [[7068, 0.3], [7078, 0.01]], zones: ["Searing Gorge", "Burning Steppes", "Un'Goro Crater (Fire Plume Ridge)"] },
    { name: "Elemental Earth (earth elementals)", minLevel: 38, yields: [[7067, 0.3]], zones: ["Badlands", "Searing Gorge", "Desolace"] },
    { name: "Elemental Water (water elementals)", minLevel: 40, yields: [[7070, 0.3], [7080, 0.01]], zones: ["Dustwallow Marsh", "Azshara", "Felwood"] },
    { name: "Elemental Air (air elementals)", minLevel: 35, yields: [[7069, 0.3]], zones: ["Arathi Highlands", "Azshara", "Silithus"] },
    { name: "Essence of Undeath / Living Essence", minLevel: 55, yields: [[12808, 0.1], [12803, 0.05]], zones: ["Eastern Plaguelands", "Western Plaguelands", "Un'Goro Crater"] }
  ],

  /*
   * Raw farms anyone can do: lootable objects, containers and rare drops. Each entry is valued per
   * `unit` (trap, clam, kill). Loot that's better turned in than sold is valued through `conversions`.
   * `faction` limits a farm to one side. Rates are community estimates: tune them as you farm.
   */
  rawFarms: [
    { name: "Shellfish Traps", unit: "trap", minLevel: 33, faction: "Horde",
      yields: [[13545, 0.8], [6367, 0.01]], zones: ["Desolace (underwater, west of Shadowprey Village)"],
      note: "Shellfish and the Big Iron Fishing Pole only drop while you're on Fish in a Bucket. Traps can spawn a lvl 33-36 crawler.",
      verify: true },
    { name: "Big-mouth Clams", unit: "clam", minLevel: 35,
      yields: [[7974, 1], [5500, 0.05], [7971, 0.05], [13926, 0.02]],
      zones: ["Dustwallow Marsh (Muckshell Makrura)", "Desolace coast", "Tanaris coast", "Feralas coast"],
      note: "Clams drop from coastal makrura and murlocs. Opening needs no profession.", verify: true }
  ],

  /*
   * Conversions: hand items to an NPC (or vendor) for something else. Used two ways:
   * 1) to value farmed loot (5 Shellfish are worth one Bloodbelly Fish), and
   * 2) as arbitrage when the inputs are cheaper on the AH than the output sells for.
   */
  conversions: [
    { name: "Fish in a Bucket (repeatable)", npc: "Jinar'Zillen, Shadowprey Village (Desolace)", faction: "Horde",
      inputs: [[13545, 5]], outputs: [[13546, 1]], verify: true }
  ],

  /*
   * Recipes. skill = skill to learn/craft. makes = [itemId, qtyProduced]. reagents = [[itemId, qty], ...].
   * `cooldown` and `requires` are shown as warnings. `verify: true` = may have changed in Forever.
   */
  recipes: [
    // Mining (smelting)
    { prof: "mining", skill: 1,   makes: [2840, 1], reagents: [[2770, 1]] },
    { prof: "mining", skill: 65,  makes: [3576, 1], reagents: [[2771, 1]] },
    { prof: "mining", skill: 65,  makes: [2841, 2], reagents: [[2840, 1], [3576, 1]] },
    { prof: "mining", skill: 75,  makes: [2842, 1], reagents: [[2775, 1]] },
    { prof: "mining", skill: 125, makes: [3575, 1], reagents: [[2772, 1]] },
    { prof: "mining", skill: 155, makes: [3577, 1], reagents: [[2776, 1]] },
    { prof: "mining", skill: 165, makes: [3859, 1], reagents: [[3575, 1], [3857, 1]] },
    { prof: "mining", skill: 175, makes: [3860, 1], reagents: [[3858, 1]] },
    { prof: "mining", skill: 230, makes: [6037, 1], reagents: [[7911, 1]] },
    { prof: "mining", skill: 230, makes: [11371, 1], reagents: [[11370, 8]], requires: "Black Forge (Blackrock Depths)" },
    { prof: "mining", skill: 250, makes: [12359, 1], reagents: [[10620, 1]] },

    // Blacksmithing
    { prof: "blacksmithing", skill: 1,   makes: [2862, 1], reagents: [[2835, 1]] },
    { prof: "blacksmithing", skill: 65,  makes: [2863, 1], reagents: [[2836, 1]] },
    { prof: "blacksmithing", skill: 75,  makes: [3478, 1], reagents: [[2836, 2]] },
    { prof: "blacksmithing", skill: 125, makes: [2871, 1], reagents: [[2838, 1]] },
    { prof: "blacksmithing", skill: 125, makes: [3486, 1], reagents: [[2838, 3]] },
    { prof: "blacksmithing", skill: 200, makes: [7964, 1], reagents: [[7912, 1]] },
    { prof: "blacksmithing", skill: 200, makes: [7966, 1], reagents: [[7912, 4]] },
    { prof: "blacksmithing", skill: 250, makes: [12404, 1], reagents: [[12365, 1]] },
    { prof: "blacksmithing", skill: 250, makes: [12644, 1], reagents: [[12365, 4]] },
    { prof: "blacksmithing", skill: 260, makes: [12643, 1], reagents: [[12365, 1], [14047, 1]] },

    // Alchemy
    { prof: "alchemy", skill: 1,   makes: [118, 1],  reagents: [[2447, 1], [765, 1], [3371, 1]], verify: true, note: "Forever moved some Healing Potions out of Alchemy" },
    { prof: "alchemy", skill: 1,   makes: [2454, 1], reagents: [[2449, 1], [765, 1], [3371, 1]] },
    { prof: "alchemy", skill: 1,   makes: [5997, 1], reagents: [[765, 2], [3371, 1]] },
    { prof: "alchemy", skill: 25,  makes: [2455, 1], reagents: [[785, 1], [765, 1], [3371, 1]] },
    { prof: "alchemy", skill: 55,  makes: [858, 1],  reagents: [[765, 1], [2450, 1], [3371, 1]], verify: true, note: "Forever moved some Healing Potions out of Alchemy" },
    { prof: "alchemy", skill: 60,  makes: [2459, 1], reagents: [[2452, 1], [2450, 1], [3371, 1]] },
    { prof: "alchemy", skill: 80,  makes: [6370, 1], reagents: [[6358, 2]] },
    { prof: "alchemy", skill: 90,  makes: [3383, 1], reagents: [[785, 1], [2450, 2], [3371, 1]] },
    { prof: "alchemy", skill: 110, makes: [929, 1],  reagents: [[2453, 1], [2450, 1], [3372, 1]], verify: true, note: "Forever moved some Healing Potions out of Alchemy" },
    { prof: "alchemy", skill: 120, makes: [3385, 1], reagents: [[785, 1], [3820, 1], [3371, 1]] },
    { prof: "alchemy", skill: 150, makes: [5634, 1], reagents: [[6370, 2], [3820, 1], [3372, 1]] },
    { prof: "alchemy", skill: 155, makes: [1710, 1], reagents: [[3357, 1], [3356, 1], [3372, 1]], verify: true, note: "Forever moved some Healing Potions out of Alchemy" },
    { prof: "alchemy", skill: 160, makes: [3827, 1], reagents: [[3820, 1], [3356, 1], [3372, 1]] },
    { prof: "alchemy", skill: 175, makes: [3825, 1], reagents: [[3355, 1], [3821, 1], [3372, 1]] },
    { prof: "alchemy", skill: 185, makes: [8949, 1], reagents: [[3820, 1], [3821, 1], [3372, 1]] },
    { prof: "alchemy", skill: 215, makes: [3928, 1], reagents: [[8838, 1], [3358, 1], [8925, 1]], verify: true, note: "Forever moved some Healing Potions out of Alchemy" },
    { prof: "alchemy", skill: 235, makes: [9155, 1], reagents: [[8839, 1], [3821, 1], [8925, 1]] },
    { prof: "alchemy", skill: 240, makes: [9187, 1], reagents: [[8838, 1], [3821, 1], [8925, 1]] },
    { prof: "alchemy", skill: 245, makes: [9206, 1], reagents: [[8838, 1], [8846, 1], [8925, 1]] },
    { prof: "alchemy", skill: 250, makes: [9264, 1], reagents: [[8845, 3], [8925, 1]] },
    { prof: "alchemy", skill: 250, makes: [13423, 1], reagents: [[13422, 1], [3372, 1]] },
    { prof: "alchemy", skill: 255, makes: [13442, 1], reagents: [[8846, 3], [8925, 1]] },
    { prof: "alchemy", skill: 260, makes: [13443, 1], reagents: [[8838, 2], [8839, 2], [8925, 1]] },
    { prof: "alchemy", skill: 275, makes: [13446, 1], reagents: [[13464, 2], [13465, 1], [8925, 1]], verify: true, note: "Forever moved some Healing Potions out of Alchemy" },
    { prof: "alchemy", skill: 275, makes: [12360, 1], reagents: [[12359, 1], [12363, 1]], cooldown: "Transmute cooldown" },
    { prof: "alchemy", skill: 280, makes: [13452, 1], reagents: [[13465, 2], [13466, 2], [8925, 1]] },
    { prof: "alchemy", skill: 285, makes: [13454, 1], reagents: [[13463, 3], [13465, 1], [8925, 1]] },
    { prof: "alchemy", skill: 290, makes: [13457, 1], reagents: [[7068, 1], [13463, 1], [8925, 1]] },
    { prof: "alchemy", skill: 290, makes: [13458, 1], reagents: [[7067, 1], [13463, 1], [8925, 1]] },
    { prof: "alchemy", skill: 290, makes: [13456, 1], reagents: [[7070, 1], [13463, 1], [8925, 1]] },
    { prof: "alchemy", skill: 295, makes: [13444, 1], reagents: [[13463, 3], [13467, 2], [8925, 1]] },
    { prof: "alchemy", skill: 300, makes: [13510, 1], reagents: [[8846, 30], [13423, 10], [13468, 1], [8925, 1]], requires: "Alchemy Lab (Blackrock Spire)" },
    { prof: "alchemy", skill: 300, makes: [13511, 1], reagents: [[13463, 30], [13467, 10], [13468, 1], [8925, 1]], requires: "Alchemy Lab (Blackrock Spire)" },
    { prof: "alchemy", skill: 300, makes: [13512, 1], reagents: [[13463, 30], [13465, 10], [13468, 1], [8925, 1]], requires: "Alchemy Lab (Blackrock Spire)" },

    // Tailoring
    { prof: "tailoring", skill: 1,   makes: [2996, 1], reagents: [[2589, 2]] },
    { prof: "tailoring", skill: 45,  makes: [4238, 1], reagents: [[2996, 3], [2320, 3]] },
    { prof: "tailoring", skill: 75,  makes: [2997, 1], reagents: [[2592, 3]] },
    { prof: "tailoring", skill: 125, makes: [4305, 1], reagents: [[4306, 4]] },
    { prof: "tailoring", skill: 175, makes: [4339, 1], reagents: [[4338, 5]] },
    { prof: "tailoring", skill: 240, makes: [10050, 1], reagents: [[4339, 4], [8343, 2]] },
    { prof: "tailoring", skill: 250, makes: [14048, 1], reagents: [[14047, 5]] },
    { prof: "tailoring", skill: 250, makes: [14342, 1], reagents: [[14256, 2]], cooldown: "Mooncloth cooldown", requires: "Moonwell" },
    { prof: "tailoring", skill: 260, makes: [14046, 1], reagents: [[14048, 5], [8170, 2], [14341, 1]] },

    // Leatherworking
    { prof: "leatherworking", skill: 1,   makes: [2304, 1], reagents: [[2318, 1]] },
    { prof: "leatherworking", skill: 35,  makes: [4231, 1], reagents: [[783, 1], [4289, 1]] },
    { prof: "leatherworking", skill: 100, makes: [2319, 1], reagents: [[2318, 4]], verify: true },
    { prof: "leatherworking", skill: 100, makes: [2313, 1], reagents: [[2319, 4], [2320, 1]] },
    { prof: "leatherworking", skill: 100, makes: [4233, 1], reagents: [[4232, 1], [4289, 1]] },
    { prof: "leatherworking", skill: 150, makes: [4234, 1], reagents: [[2319, 5]], verify: true },
    { prof: "leatherworking", skill: 150, makes: [4265, 1], reagents: [[4234, 5], [2321, 1]] },
    { prof: "leatherworking", skill: 150, makes: [4236, 1], reagents: [[4235, 1], [4289, 3]] },
    { prof: "leatherworking", skill: 200, makes: [8172, 1], reagents: [[8169, 1], [8150, 1]] },
    { prof: "leatherworking", skill: 200, makes: [8173, 1], reagents: [[4304, 5], [8343, 1]] },
    { prof: "leatherworking", skill: 250, makes: [8170, 1], reagents: [[4304, 6]], verify: true },
    { prof: "leatherworking", skill: 250, makes: [15564, 1], reagents: [[8170, 5]] },

    // Engineering
    { prof: "engineering", skill: 1,   makes: [4357, 1], reagents: [[2835, 1]] },
    { prof: "engineering", skill: 75,  makes: [4364, 1], reagents: [[2836, 1]] },
    { prof: "engineering", skill: 125, makes: [4377, 1], reagents: [[2838, 1]] },
    { prof: "engineering", skill: 175, makes: [10505, 1], reagents: [[7912, 2]] },
    { prof: "engineering", skill: 175, makes: [4390, 3], reagents: [[3575, 1], [4377, 1], [4306, 1]] },
    { prof: "engineering", skill: 250, makes: [15992, 1], reagents: [[12365, 2]] },
    { prof: "engineering", skill: 260, makes: [15994, 1], reagents: [[12359, 3], [14047, 1]] },
    { prof: "engineering", skill: 260, makes: [15993, 3], reagents: [[15994, 1], [15992, 3], [14047, 3]] },
    { prof: "engineering", skill: 270, makes: [18641, 2], reagents: [[15992, 2], [14047, 3]] },

    // Enchanting (sellable products only)
    { prof: "enchanting", skill: 10,  makes: [11287, 1], reagents: [[4470, 1], [10938, 1]] },
    { prof: "enchanting", skill: 45,  makes: [20744, 1], reagents: [[10940, 2], [17034, 1], [3371, 1]], verify: true },
    { prof: "enchanting", skill: 250, makes: [20747, 1], reagents: [[11176, 3], [8831, 2], [8925, 1]], verify: true },
    { prof: "enchanting", skill: 300, makes: [20748, 1], reagents: [[14344, 2], [8831, 3], [18256, 1]], verify: true },
    { prof: "enchanting", skill: 300, makes: [20749, 1], reagents: [[14344, 2], [8831, 3], [18256, 1]], verify: true },

    // First Aid
    { prof: "firstaid", skill: 1,   makes: [1251, 1], reagents: [[2589, 1]] },
    { prof: "firstaid", skill: 40,  makes: [2581, 1], reagents: [[2589, 2]] },
    { prof: "firstaid", skill: 115, makes: [3531, 1], reagents: [[2592, 2]] },
    { prof: "firstaid", skill: 180, makes: [6451, 1], reagents: [[4306, 2]] },
    { prof: "firstaid", skill: 240, makes: [8545, 1], reagents: [[4338, 2]] },
    { prof: "firstaid", skill: 260, makes: [14529, 1], reagents: [[14047, 1]] },
    { prof: "firstaid", skill: 290, makes: [14530, 1], reagents: [[14047, 2]] },

    // Cooking
    { prof: "cooking", skill: 80,  makes: [21072, 1], reagents: [[21071, 1], [2678, 1]], verify: true },
    { prof: "cooking", skill: 240, makes: [13928, 1], reagents: [[13755, 1], [3713, 1]] },
    { prof: "cooking", skill: 250, makes: [13931, 1], reagents: [[13759, 1], [159, 1]] },
    { prof: "cooking", skill: 275, makes: [18254, 1], reagents: [[18255, 1], [3713, 1]] }
  ]
};
