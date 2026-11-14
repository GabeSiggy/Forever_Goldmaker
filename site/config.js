/*
 * Blizzard's API doesn't say which ruleset (Normal, PvP, RP, RP-PvP) each auction house belongs to.
 * Houses come in groups of three (Alliance, Horde, Blackwater). Use "Which auction house am I on?"
 * on the site to match your house, then pick your realm type: that labels the group in your browser.
 * To label it for everyone, copy the group number into the list below.
 * Labels here win over browser labels. Use: "Normal", "PvP", "RP" or "RP-PvP".
 */
window.HOUSE_GROUP_LABELS = {
  // 1: "Normal",
  // 2: "PvP",
  // 3: "RP",
  // 4: "RP-PvP",
};

// Default auction house for new visitors (a house id from data/houses.json), or null.
window.DEFAULT_HOUSE_ID = null;
