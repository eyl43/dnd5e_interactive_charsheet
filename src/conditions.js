// The 5e conditions, with the short-form rules text that actually matters at the table.
export const CONDITIONS = [
  { name: "Blinded",      glyph: "◍", desc: "Can't see, auto-fails checks needing sight. Attacks against you have advantage; your attacks have disadvantage." },
  { name: "Charmed",      glyph: "❦", desc: "Can't attack the charmer or target them with harmful effects. The charmer has advantage on social checks against you." },
  { name: "Deafened",     glyph: "◑", desc: "Can't hear and auto-fails any ability check that requires hearing." },
  { name: "Frightened",   glyph: "☠", desc: "Disadvantage on checks and attacks while the source is in line of sight. Can't willingly move closer to it." },
  { name: "Grappled",     glyph: "⛓", desc: "Speed becomes 0, no bonuses to speed. Ends if the grappler is incapacitated or you're moved out of reach." },
  { name: "Incapacitated",glyph: "✖", desc: "Can't take actions or reactions. Ends Bladesong immediately." },
  { name: "Invisible",    glyph: "◌", desc: "Impossible to see without special senses. Attacks against you have disadvantage; your attacks have advantage." },
  { name: "Paralyzed",    glyph: "⌇", desc: "Incapacitated, can't move or speak, auto-fails STR/DEX saves. Attacks have advantage; hits within 5 ft are critical." },
  { name: "Petrified",    glyph: "◼", desc: "Turned to stone: incapacitated, weight x10, resistance to all damage, immune to poison and disease." },
  { name: "Poisoned",     glyph: "☣", desc: "Disadvantage on attack rolls and ability checks.", immune: "Strange Metabolism" },
  { name: "Prone",        glyph: "↧", desc: "Movement costs double to crawl. Disadvantage on attacks; attacks within 5 ft have advantage, ranged have disadvantage." },
  { name: "Restrained",   glyph: "✷", desc: "Speed 0. Attacks against you have advantage, your attacks have disadvantage, disadvantage on DEX saves." },
  { name: "Stunned",      glyph: "✦", desc: "Incapacitated, can't move, speaks falteringly. Auto-fails STR/DEX saves; attacks against you have advantage." },
  { name: "Unconscious",  glyph: "☾", desc: "Incapacitated, drops what it's holding, falls prone, auto-fails STR/DEX saves. Hits within 5 ft are critical." },
];

// Conditions that shut down Bladesong (the spell ends if you become incapacitated).
export const INCAPACITATING = new Set(["Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"]);

export const EXHAUSTION_LEVELS = [
  "No exhaustion",
  "1 - Disadvantage on ability checks",
  "2 - Speed halved",
  "3 - Disadvantage on attack rolls and saving throws",
  "4 - Hit point maximum halved",
  "5 - Speed reduced to 0",
  "6 - Death",
];
