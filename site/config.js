/*
 * Blizzard's API doesn't say which ruleset (Normal, PvP, RP, RP-PvP) each auction house belongs to.
 * Houses come in groups of three (Alliance, Horde, Blackwater). Once you know which group is yours
 * (use "Which auction house am I on?" on the site), label it here so friends see a friendly name.
 */
window.HOUSE_GROUP_LABELS = {
  // 1: "Normal",
  // 2: "PvP",
};

// Default auction house for new visitors (a house id from data/houses.json), or null.
window.DEFAULT_HOUSE_ID = null;
