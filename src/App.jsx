import { useState } from "react";

// Stat/speed deltas applied per active mutagen
const MUTAGEN_EFFECTS = {
  Celerity:       { DEX: 3, STR: -3 },
  Sagacity:       { INT: 3, WIS: -3 },
  Rapidity:       { speed: 10, INT: -3 },
  Reconstruction: { speed: -10 },
};

const CHAR = {
  name: "Dr. Lucien Harrow",
  race: "Custom Lineage",
  classes: "Blood Hunter (Mutant) 7 / Bladesinger Wizard 5",
  level: 12,
  background: "Sage",
  alignment: "Chaotic Good",
  profBonus: 4,
  hp: { max: 75, current: 75, temp: 0 },
  hitDice: "7d8 + 5d6",
  hemocraftDie: "1d6",
  speed: 30,
  stats: {
    STR: { base: 8,  mod: -1, save: -1, prof: false },
    DEX: { base: 19, mod: 4,  save: 8,  prof: true  },
    CON: { base: 14, mod: 2,  save: 6,  prof: false },
    INT: { base: 18, mod: 4,  save: 4,  prof: true  },
    WIS: { base: 10, mod: 0,  save: 0,  prof: false },
    CHA: { base: 8,  mod: -1, save: -1, prof: false },
  },
  skills: [
    { name: "Acrobatics",     stat: "DEX", prof: true  },
    { name: "Arcana",         stat: "INT", prof: true  },
    { name: "Athletics",      stat: "STR", prof: false },
    { name: "Deception",      stat: "CHA", prof: false },
    { name: "History",        stat: "INT", prof: false },
    { name: "Insight",        stat: "WIS", prof: false },
    { name: "Intimidation",   stat: "CHA", prof: false },
    { name: "Investigation",  stat: "INT", prof: true  },
    { name: "Medicine",       stat: "WIS", prof: false },
    { name: "Nature",         stat: "INT", prof: false },
    { name: "Perception",     stat: "WIS", prof: true  },
    { name: "Performance",    stat: "CHA", prof: true  },
    { name: "Persuasion",     stat: "CHA", prof: false },
    { name: "Religion",       stat: "INT", prof: false },
    { name: "Sleight of Hand",stat: "DEX", prof: false },
    { name: "Stealth",        stat: "DEX", prof: true  },
    { name: "Survival",       stat: "WIS", prof: false },
  ],
  weapons: [
    {
      name: "Scythe Whip (HB) (w/ Crimson Rite)",
      atk: "+8 / +10 mutagen, check if tattoo active (+1)",
      damage: "1d8 + 4 (+6 if celerity active) slashing + 1d6 rite (cold/lightning) (Dueling)",
      notes: "Finesse, Dueling style (+2 included). Bonus action: transform into whip form (1d4, +5ft reach) or back",
    },
    {
      name: "Silver Pistol",
      atk: "+8 / +10 mutagen, check if tattoo active (+1)",
      damage: "1d10 + 4  piercing (+6 if celerity active)",
      notes: "Ammunition (range 30/90), loading ignored (Gunner feat), create 2 bullets by taking necrotic damage equal to one hemocraft die, special property: Parry: Shoot pistol in response to attack to avoid damage and make the enemy potentially vulnerable to the next attack ",
    },
  ],
  cantrips: [
    {
      name: "Booming Blade",
      action: "Action",
      desc: "Melee attack + 2d8 thunder on hit; 3d8 thunder if target willingly moves (lvl 12)",
      fullDesc: "Cast time: 1 action · Range: Self (5 ft) · Duration: 1 round\nComponents: S, M (a melee weapon worth 1+ sp)\n\nBrandish a weapon and make one melee attack against a creature within 5 ft. On a hit: weapon's normal damage, and the target is sheathed in booming energy until the start of your next turn. If the target willingly moves 1 or more feet before then, it takes 3d8 thunder damage and the spell ends.\n\nLevel 12 scaling (11th–16th level): +2d8 thunder on hit, +3d8 thunder if the target moves.",
    },
    {
      name: "Green-Flame Blade",
      action: "Action",
      desc: "Melee attack + 2d8 fire; {intMod} + 2d8 fire leaps to an adjacent creature (lvl 12)",
      fullDesc: "Cast time: 1 action · Range: Self (5 ft) · Duration: Instantaneous\nComponents: S, M (a melee weapon worth 1+ sp)\n\nBrandish a weapon and make one melee attack against a creature within 5 ft. On a hit: weapon's normal damage plus 2d8 fire damage. Green fire then leaps to a different creature of your choice within 5 ft of the target, dealing {intMod} + 2d8 fire damage.\n\nLevel 12 scaling (11th–16th level): 2d8 fire on primary target, {intMod} + 2d8 fire on secondary target.",
    },
    {
      name: "Prestidigitation",
      action: "Action",
      desc: "Minor magical tricks and sensory effects",
      fullDesc: "Cast time: 1 action · Range: 10 ft · Duration: Up to 1 hour\nComponents: V, S\n\nCreate one of the following magical effects:\n· A harmless sensory effect (shower of sparks, puff of wind, faint music, odd odor)\n· Instantaneously light or snuff a small flame\n· Clean or soil an object no larger than 1 cubic foot\n· Chill, warm, or flavor up to 1 cubic foot of nonliving material for 1 hour\n· Create a small nonmagical mark or symbol on an object or surface, lasting 1 hour\n· Create a small illusory image fitting in your hand, lasting until end of your next turn\n\nUp to 3 effects can be active at once. Casting again lets you dismiss an existing effect.",
    },
    {
      name: "Mage Hand",
      action: "Action",
      desc: "Spectral hand manipulates objects at 30 ft",
      fullDesc: "Cast time: 1 action · Range: 30 ft · Duration: 1 minute\nComponents: V, S\n\nA spectral, floating hand appears at a point you choose within range. As a bonus action, you can control the hand to:\n· Pick up, move, or manipulate an object weighing 10 lbs or less\n· Open or close an unlocked door or container\n· Retrieve an item from an open container\n· Pour the contents from a vial\n\nThe hand cannot attack, activate magic items, or carry more than 10 lbs. It vanishes if it goes more than 30 ft from you or if you recast the spell.",
    },
  ],
  spells: {
    "1st": {
      slots: 4,
      list: [
        {
          name: "Shield", action: "Reaction", ritual: false,
          desc: "+5 AC reaction (including triggering attack); immune to Magic Missile until next turn",
          fullDesc: "Cast time: 1 reaction (when hit by an attack or targeted by Magic Missile)\nRange: Self · Duration: Until the start of your next turn\nComponents: V, S\n\nAn invisible barrier of magical force springs into existence. You gain +5 bonus to AC — including against the triggering attack, potentially turning a hit into a miss. You are also immune to Magic Missile for the duration.\n\nNote: The +5 applies before the triggering attack resolves. Cast this after you see the roll but before damage is applied.",
        },
        {
          name: "Absorb Elements", action: "Reaction", ritual: false,
          desc: "Reaction: resistance to triggering elemental damage; +1d6 of that type on next melee hit",
          fullDesc: "Cast time: 1 reaction (when you take acid, cold, fire, lightning, or thunder damage)\nRange: Self · Duration: 1 round\nComponents: S\n\nCapture some of the incoming elemental energy, lessening its effect on you. Until the start of your next turn, you have resistance to the triggering damage type (this halves the triggering damage as well). Also, the first time you hit with a melee attack on your next turn, the target takes an extra 1d6 damage of the triggering type.",
        },
        {
          name: "Find Familiar", action: "1 Hour", ritual: true,
          desc: "Summon hextech drone (owl) — telepathic link, can deliver touch spells through it",
          fullDesc: "Cast time: 1 hour (can be cast as a ritual) · Range: 10 ft · Duration: Until dismissed\nComponents: V, S, M (10 gp of charcoal, incense, and herbs consumed)\n\nSummon a spirit in the form of your hextech drone (owl). The familiar obeys your commands and has its own turn in combat.\n\nAbilities:\n· Telepathic communication within 100 ft\n· See and hear through its senses as an action (until start of your next turn)\n· Deliver touch spells through the familiar if within 100 ft (uses your attack roll if applicable)\n· Dismiss to a pocket dimension as an action; recall within 30 ft as a bonus action\n\nThe familiar cannot attack. If reduced to 0 HP it vanishes; re-summon with the ritual. Only one familiar at a time.",
        },
        {
          name: "Silvery Barbs", action: "Reaction", ritual: false,
          desc: "Reaction: force reroll on a success, grant advantage to an ally on next d20",
          fullDesc: "Cast time: 1 reaction (when a creature you can see within 60 ft succeeds on an attack roll, ability check, or saving throw)\nRange: 60 ft · Duration: Instantaneous\nComponents: V\n\nYou magically distract the triggering creature and redirect its momentary fortune. The creature must reroll the d20 and use the lower result.\n\nThen choose a different creature you can see within 60 ft (can be yourself). That creature has advantage on its next attack roll, ability check, or saving throw made within the next minute.",
        },
        {
          name: "Feather Fall", action: "Reaction", ritual: false,
          desc: "Reaction: slow up to 5 falling creatures to safe speed, no fall damage",
          fullDesc: "Cast time: 1 reaction (when you or a creature within 60 ft falls)\nRange: 60 ft · Duration: 1 minute\nComponents: V, M (a small feather or piece of down)\n\nChoose up to 5 falling creatures within range. Each chosen creature's rate of descent slows to 60 ft per round — slow enough to avoid all falling damage. A creature that lands while under this effect takes no damage from the fall and can land on its feet.\n\nSpell ends when the duration expires or all chosen creatures have landed.",
        },
      ],
    },
    "2nd": {
      slots: 3,
      list: [
        {
          name: "Mirror Image", action: "Action", ritual: false,
          desc: "3 illusory duplicates, no concentration — attackers may hit a duplicate instead",
          fullDesc: "Cast time: 1 action · Range: Self · Duration: 1 minute\nComponents: V, S · No concentration required\n\n3 illusory duplicates of yourself accompany you. When a creature targets you with an attack, roll 1d20 to determine if the attack hits a duplicate instead:\n· 3 duplicates present → hits duplicate on 6+\n· 2 duplicates present → hits duplicate on 8+\n· 1 duplicate present → hits duplicate on 11+\n\nDuplicate AC = {mirrorAC}. A hit destroys the duplicate. Duplicates are immune to effects not requiring attack rolls (spells, AoE, grapple, etc.). Spell ends when all 3 duplicates are destroyed or duration expires.",
        },
        {
          name: "Misty Step", action: "Bonus", ritual: false,
          desc: "Bonus action: teleport up to 30 ft to a visible unoccupied space",
          fullDesc: "Cast time: 1 bonus action · Range: Self · Duration: Instantaneous\nComponents: V\n\nBriefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space you can see. No other movement required. You can teleport through obstacles as long as you can see your destination.\n\nNote: Requires a verbal component only — usable while restrained (but not silenced).",
        },
        {
          name: "Web", action: "Action", ritual: false, conc: true,
          desc: "Concentration, 1 hr: 20-ft cube of sticky webs, difficult terrain, restrain on failed DEX save",
          fullDesc: "Cast time: 1 action · Range: 60 ft · Duration: 1 hour (concentration)\nComponents: V, S, M (a bit of spiderweb)\n\nFill a 20-ft cube from a point within range with thick sticky webs. The area is difficult terrain and lightly obscured.\n\nEach creature that enters the area or starts its turn there must make a DEX saving throw (DC {dc}) or be Restrained. A Restrained creature can use its action to make a STR or DEX check against your spell DC to free itself.\n\nWebs are flammable: a 5-ft section ignites when exposed to fire, burning for 1 round and dealing 2d4 fire damage to any Restrained creature that starts its turn there. The web burns away.",
        },
      ],
    },
    "3rd": {
      slots: 2,
      list: [
        {
          name: "Haste", action: "Action", ritual: false, conc: true,
          desc: "Concentration, 1 min: dbl speed, +2 AC, adv. DEX saves, extra action — lethargy on end",
          fullDesc: "Cast time: 1 action · Range: 30 ft · Duration: 1 minute (concentration)\nComponents: V, S, M (a shaving of licorice root)\n\nChoose a willing creature. For the duration:\n· Speed doubled\n· +2 bonus to AC\n· Advantage on DEX saving throws\n· Gains one additional action per turn — usable only for: Attack (one weapon attack only), Dash, Disengage, Hide, or Use an Object\n\nWhen the spell ends (including if concentration breaks), the target cannot move or take actions until after its next turn — overwhelmed by lethargy. Plan accordingly.",
        },
        {
          name: "Counterspell", action: "Reaction", ritual: false,
          desc: "Reaction: automatically counter spells ≤3rd level; roll INT check vs. higher-level spells",
          fullDesc: "Cast time: 1 reaction (when a creature within 60 ft casts a spell)\nRange: 60 ft · Duration: Instantaneous\nComponents: S\n\nAttempt to interrupt a spell as it is being cast.\n· Spell is 3rd level or lower → automatically fails and has no effect\n· Spell is 4th level or higher → make a spellcasting ability check (INT): DC = 10 + the spell's level. On success: spell fails. On failure: spell resolves normally.\n\nCasting at a higher spell slot: if you upcast Counterspell, you automatically counter spells up to the slot level used (4th slot → counters up to 4th level, etc.).",
        },
        {
          name: "Slow", action: "Action", ritual: false, conc: true,
          desc: "Concentration, 1 min: up to 6 creatures — halved speed, −2 AC/DEX saves, limited actions, WIS save",
          fullDesc: "Cast time: 1 action · Range: 120 ft · Duration: 1 minute (concentration)\nComponents: V, S, M (a drop of molasses)\n\nChoose up to 6 creatures in a 40-ft cube within range. Each makes a WIS saving throw (DC {dc}) or is affected:\n· Speed halved\n· −2 penalty to AC and DEX saving throws\n· Cannot use reactions\n· On their turn: may take only an action or a bonus action (not both)\n· No more than one melee or ranged attack per turn\n· When casting a spell with 1-action cast time: roll 1d20 — on 11 or lower, the spell fails and the slot is wasted\n\nAffected creature repeats the WIS save at the end of each of its turns — success ends the effect for that creature.",
        },
        {
          name: "Fireball", action: "Action", ritual: false,
          desc: "8d6 fire in 20-ft radius, DEX save for half — spreads around corners",
          fullDesc: "Cast time: 1 action · Range: 150 ft · Duration: Instantaneous\nComponents: V, S, M (a tiny ball of bat guano and sulfur)\n\nA bright streak flashes to a point you choose within range and blossoms into a 20-ft radius sphere of roaring flame. Each creature in the sphere makes a DEX saving throw (DC {dc}):\n· Failed save: 8d6 fire damage (avg ~28)\n· Successful save: half damage\n\nThe fire spreads around corners. Nonmagical flammable objects that are not worn or carried are ignited. A solid obstruction (wall, pillar) can block the spread in that direction.",
        },
      ],
    },
  },
  features: [
    // ── Character Level 1 ──────────────────────────────────────────
    { name: "Hunter's Bane",          source: "Blood Hunter 1",     action: "Passive",  desc: "Advantage on INT checks to recall info about fey, fiends, and undead. Advantage on tracking them." },
    { name: "Blood Maledict",         source: "Blood Hunter 1",     action: "Bonus",    desc: "(2/short rest) Invoke a blood curse as a bonus action. Before a curse affects its target you may amplify it, dealing necrotic damage equal to your hemocraft die (1d6) — this damage cannot be reduced or mitigated." },
    { name: "Blood Curse of the Eyeless", source: "Blood Hunter 1", action: "Reaction", desc: "Reaction: when a creature you can see makes an attack roll, roll your hemocraft die and subtract the result from the attack. Amplify: the subtraction applies to ALL attacks the creature makes until the end of its next turn." },
    { name: "Darkvision",             source: "Custom Lineage 1",   action: "Passive",  desc: "See in dim light within 60 ft as if bright light, and in darkness as if dim light. Can't discern color in darkness." },
    { name: "Gunner",                 source: "Feat (Level 1)",     action: "Passive",  desc: "+1 DEX (already included in stats). Proficiency with firearms. Ignore the loading property of firearms. Being within 5 ft of a hostile creature does not impose disadvantage on ranged attack rolls." },
    // ── Character Level 2 ──────────────────────────────────────────
    { name: "Fighting Style: Dueling", source: "Blood Hunter 2",   action: "Passive",  desc: "+2 damage when wielding a melee weapon in one hand and no other weapons." },
    { name: "Crimson Rite",           source: "Blood Hunter 2",     action: "Bonus",    desc: "Bonus action: sacrifice HP (1d6 necrotic) to imbue your weapon with elemental energy — adding 1d6 elemental damage on each hit. Lasts until you rest or drop the weapon. Currently attuned: Cold and Lightning." },
    // ── Character Level 5 ──────────────────────────────────────────
    { name: "Extra Attack",           source: "Blood Hunter 5",     action: "Passive",  desc: "Attack twice, instead of once, when you take the Attack action on your turn." },
    // ── Character Level 6 ──────────────────────────────────────────
    { name: "Brand of Castigation",  source: "Blood Hunter 6",      action: "Passive",  desc: "When you hit a creature with a weapon attack, you can brand it. A branded creature takes INT modifier psychic damage (+4 or +5) each time it deals damage to you. You always know the direction of a branded creature on the same plane." },
    // ── Character Level 7 (Blood Hunter 7) ────────────────────────
    { name: "Strange Metabolism",     source: "Mutant Order 7",     action: "Passive",  desc: "Your body can sustain 2 mutagens simultaneously. Imbibing a third requires you to choose which active one ends. Imbibing a mutagen takes an action and costs no HP." },
    { name: "Blood Curse of the Fallen Puppet", source: "Blood Hunter 7", action: "Reaction", desc: "Reaction: when a creature you can see drops to 0 HP, force it to immediately make one melee weapon attack against a target of your choice. Amplify: the creature also moves up to half its speed before attacking, and gains a bonus to the attack roll equal to your INT modifier (+4 or +5)." },
    // ── Character Level 8 (Wizard 1) ──────────────────────────────
    { name: "Arcane Recovery",        source: "Wizard 1",           action: "Special",  desc: "Once per day when you finish a short rest, recover expended spell slots with a combined level of up to half your Wizard level (rounded up). Slots recovered: up to 3 levels total (e.g. one 3rd-level, or one 2nd + one 1st)." },
    // ── Character Level 9 (Wizard 2 — Bladesinger) ────────────────
    { name: "Bladesong",              source: "Bladesinger 2",      action: "Bonus",    desc: "Bonus action: begin the Bladesong for 1 minute. While active: +INT modifier to AC (already reflected above when toggled), +10 ft speed, advantage on Acrobatics checks, and +INT modifier to concentration saving throws. Ends early if you don armor, are incapacitated, or use two hands to make an attack. 4 uses per long rest." },
  ],
  mutagens: [
    { name: "Celerity",       benefit: "+3 DEX",                                  drawback: "-3 STR"       },
    { name: "Sagacity",       benefit: "+3 INT",                                  drawback: "-3 WIS"       },
    { name: "Rapidity",       benefit: "+10 ft speed, Dash as bonus action",      drawback: "-3 INT"       },
    { name: "Reconstruction", benefit: "Regen prof. bonus HP/turn when below half", drawback: "-10 speed"  },
  ],
  equipment: [
    "Scythe Whip (Homebrew)",
    "Silver Pistol (Homebrew)",
    "Studded Leather Armor",
    "Eldritch Claw Tattoo (uncommon, attunement)",
    "Component Pouch / Arcane Focus",
    "Spellbook (Form of floating arcane dodecahedron, can unfold like an onion to reveal new spells",
    "Explorer's Pack",
    "Alchemist's Supplies",
  ],
  consumables: [
    { name: "Potion of Healing, Greater (x2)",  rarity: "Uncommon", desc: "Heal 4d4+4 HP" },
    { name: "Dust of Disappearance",            rarity: "Uncommon", desc: "Invisibility for 2d4 min, 10ft radius, no concentration" },
    { name: "Keoghtom's Ointment",              rarity: "Uncommon", desc: "5 doses, recover 2d8 + 2 hit points" },
    { name: "Scroll of Revivify",               rarity: "Uncommon", desc: "Revives a PC" },
  ],
};

const formatMod = (n) => (n >= 0 ? `+${n}` : `${n}`);

function StatBlock({ name, effectiveBase, effectiveMod, effectiveSave, saveProficient, changed }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      background: changed
        ? "linear-gradient(180deg, rgba(196,92,62,0.18) 0%, rgba(20,16,14,0.4) 100%)"
        : "linear-gradient(180deg, rgba(139,28,28,0.15) 0%, rgba(20,16,14,0.4) 100%)",
      border: `1px solid ${changed ? "rgba(196,92,62,0.6)" : "rgba(139,28,28,0.5)"}`,
      borderRadius: 4, padding: "10px 6px", minWidth: 72, position: "relative",
      transition: "all 0.25s ease",
    }}>
      <span style={{ fontSize: 10, letterSpacing: 2, color: changed ? "#c45c3e" : "#d4a82a", textTransform: "uppercase", fontFamily: "'Cinzel', serif" }}>{name}</span>
      <span style={{ fontSize: 28, fontWeight: 700, color: "#e8dcc4", fontFamily: "'Cinzel', serif", lineHeight: 1.1, marginTop: 4 }}>{effectiveBase}</span>
      <span style={{ fontSize: 14, color: changed ? "#c45c3e" : "#a89070", fontFamily: "'Fira Code', monospace", marginTop: 2 }}>{formatMod(effectiveMod)}</span>
      <div style={{ marginTop: 6, fontSize: 11, color: saveProficient ? "#d4a82a" : "#9a8060", letterSpacing: 1, textTransform: "uppercase" }}>
        Save {formatMod(effectiveSave)}{saveProficient ? " ★" : ""}
      </div>
    </div>
  );
}

function Section({ title, children, accent, right }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
        borderBottom: `1px solid ${accent || "rgba(139,28,28,0.4)"}`, paddingBottom: 6,
        justifyContent: "space-between",
      }}>
        <span style={{
          fontSize: 11, letterSpacing: 3, textTransform: "uppercase",
          color: accent || "#8b1c1c", fontFamily: "'Cinzel', serif", fontWeight: 700,
        }}>{title}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

function PipTracker({ total, remaining, onSet, color = "#a0b8e8", onReset }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          onClick={(e) => { e.stopPropagation(); onSet(i < remaining ? i : i + 1); }}
          style={{
            width: 13, height: 13, borderRadius: "50%", cursor: "pointer",
            background: i < remaining ? color : "transparent",
            border: `1px solid ${i < remaining ? color : "rgba(139,28,28,0.35)"}`,
            boxShadow: i < remaining ? `0 0 5px ${color}66` : "none",
            transition: "all 0.15s", flexShrink: 0,
          }}
        />
      ))}
      <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: "#7a6a56", marginLeft: 2 }}>
        {remaining}/{total}
      </span>
      {onReset && (
        <button
          onClick={(e) => { e.stopPropagation(); onReset(); }}
          style={{
            background: "rgba(139,28,28,0.18)", border: "1px solid rgba(139,28,28,0.35)",
            color: "#c4b49a", fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: 1,
            textTransform: "uppercase", padding: "2px 6px", borderRadius: 2, cursor: "pointer", marginLeft: 4,
          }}
        >Rest</button>
      )}
    </div>
  );
}

function Tag({ children, color }) {
  return (
    <span style={{
      display: "inline-block", fontSize: 9, letterSpacing: 1, textTransform: "uppercase",
      background: color || "rgba(139,28,28,0.25)", color: "#e8dcc4", padding: "2px 8px",
      borderRadius: 2, fontFamily: "'Fira Code', monospace", marginRight: 4, marginBottom: 2,
    }}>{children}</span>
  );
}

const ACTION_STYLES = {
  "Action":   { bg: "rgba(139,28,28,0.3)",   border: "rgba(180,60,60,0.55)",  color: "#f0a0a0" },
  "Bonus":    { bg: "rgba(120,90,10,0.35)",  border: "rgba(212,168,42,0.55)", color: "#f0d060" },
  "Reaction": { bg: "rgba(30,70,160,0.3)",   border: "rgba(90,140,255,0.5)",  color: "#a0c0ff" },
  "Passive":  { bg: "rgba(50,44,38,0.5)",    border: "rgba(100,90,75,0.4)",   color: "#9a8060" },
  "1 Hour":   { bg: "rgba(90,40,140,0.3)",   border: "rgba(160,90,255,0.45)", color: "#c8a0ff" },
  "Special":  { bg: "rgba(20,80,70,0.35)",   border: "rgba(50,160,140,0.5)",  color: "#80d8c8" },
};

function ActionBadge({ type }) {
  const s = ACTION_STYLES[type] || ACTION_STYLES["Passive"];
  return (
    <span style={{
      fontSize: 8, letterSpacing: 1, textTransform: "uppercase",
      fontFamily: "'Fira Code', monospace",
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      padding: "2px 6px", borderRadius: 2, whiteSpace: "nowrap",
      verticalAlign: "middle", flexShrink: 0,
    }}>{type}</span>
  );
}

function ConcBadge() {
  return (
    <span style={{
      fontSize: 8, letterSpacing: 1, textTransform: "uppercase",
      fontFamily: "'Fira Code', monospace",
      background: "rgba(20,90,100,0.35)", border: "1px solid rgba(60,190,200,0.45)", color: "#80e0e8",
      padding: "2px 6px", borderRadius: 2, whiteSpace: "nowrap",
      verticalAlign: "middle", flexShrink: 0,
    }}>Conc</span>
  );
}

const MAX_MUTAGENS = 2; // Strange Metabolism

export default function CharacterSheet() {
  const [activeMutagens, setActiveMutagens] = useState(new Set(["Celerity", "Sagacity"]));
  const [bladesongActive, setBladesongActive] = useState(false);
  const [tattooMaulActive, setTattooMaulActive] = useState(false);
  const [shieldActive, setShieldActive] = useState(false);
  const [bulletCount, setBulletCount] = useState(0);
  const [bloodCurseUses, setBloodCurseUses] = useState(CHAR.profBonus);
  const [expandedSpells, setExpandedSpells] = useState(new Set());
  const [expandedFeatures, setExpandedFeatures] = useState(new Set());
  const [currentHp, setCurrentHp] = useState(CHAR.hp.current);
  const [tempHp, setTempHp] = useState(CHAR.hp.temp);
  const [tab, setTab] = useState("combat");
  const [spellSlots, setSpellSlots] = useState(
    Object.fromEntries(Object.entries(CHAR.spells).map(([lvl, d]) => [lvl, d.slots]))
  );
  const [bladesongUsesLeft, setBladesongUsesLeft] = useState(4);
  const [mutageNDoses, setMutageNDoses] = useState(4);
  const [lore, setLore] = useState({
    history: "Dr. Lucien Harrow had, for most of his life, known that he was the prime example for why certain rules and regulations were written. However, his widespread research success and influence on politics and academic funding encouraged officials and deans alike to turn a blind eye to blatant violations of safety and code of conduct. Currently at the height of his career, he holds a senior position at the Thalmurian Institute of Magic, where he is renowned for breakthroughs in applied arcanotech, battlefield thaumaturgy, and most recently amplified moonglow. His patents single handedly funded great portions of the city watch and private consortium research. His grants filled university coffers, encouraging academic tourism from across the continent.  His famously dry, unenthusiastic lectures on inventions of generational importance packed auditoriums and encouraged the construction of two separate expansions for standing-room only attendees. Although scholars who attended were often left confused as to whether they had been instructed or insulted, all were eager to return for greater insight into the professor’s work. The university, as a result, had no choice but to turn a blind eye to what board members found to be distasteful, ethically indefensible, yet incredibly profitable methods. Harrow’s reputation as the premier Thalmurian tracker was stranger still. Inside the city, he was also considered the foremost living authority on pursuit of beasts, fugitives, the occult, and, more often than not, people. He possessed an unnerving intelligence and a talent for deduction. Many of his coworkers often admitted that conversations with Harrow often felt more like dissections. When the noble houses or city government wanted problems solved without a public spectacle, Harrow was the man for the job. He always accepted, as long as the suspect could be ‘harvested’ for research. The city constables often ignored missing organs from the deceased. Harrow’s graduate students knew him as a tyrant of perfection.He was wholly uninterested in morale, and was well known for graduating only 10% of the students who entered his lab.Nobody ever left his tutelage completely intact, in either the physical, magical, or mental sense.Public morality was a cute theater for the professor, and political office to be elaborate mechanisms of control for which there were far more direct solutions.Yet despite his unyielding personality, many were still hungry for every word that the professor would offer.Perhaps he only considered his peers, which there were precious few, to be worth his time and consideration. Very little is known about Harrow’s formative years before the university.It is known that he began as a graduate student at the Thalmurian Institute directly after serving as an imperial architecti in the first Thalmurian- Mageocracy conflict.However, the history books are crystal clear about the accounts of widespread cruelty inflicted by the Mageocracy on and off the battlefield.Rumors mention that Harrow perfected his hemocracy here on the blood - rich battlefields.It is one of the few research discoveries that he has kept to himself.His success in the university and field have made him a legendary fighter.Despite his contempt for hubris, some of his graduate students have whispered that Harrow proudly displays a clipping of the bounty the Mageocracy has placed on his head.But it seems he feels no pride in his talents. *When something flees beneath the ground, they call the doctor when they want it found.*",
    personality:  "Laconic, pessimistic, 'nam level boomer' vibe",
    ideals:       "To protect Thalmuria at all costs",
    bonds:        "Other qualified people",
    flaws:        "Many",
    notes:        "",
  });

  const tabs = [
    { id: "combat",   label: "Combat"   },
    { id: "spells",   label: "Spells"   },
    { id: "features", label: "Features" },
    { id: "gear",     label: "Gear"     },
    { id: "lore",     label: "Lore"     },
  ];

  // ── Mutagen helpers ──────────────────────────────────────────────────────
  const toggleMutagen = (name) => {
    setActiveMutagens(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else if (next.size < MAX_MUTAGENS) {
        next.add(name);
      }
      return next;
    });
  };

  const toggleSpell   = (n) => setExpandedSpells(prev => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s; });
  const toggleFeature = (n) => setExpandedFeatures(prev => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s; });

  const getMutStatBonus = (stat) =>
    [...activeMutagens].reduce((sum, n) => sum + (MUTAGEN_EFFECTS[n]?.[stat] ?? 0), 0);

  const getSpeedBonus = () =>
    [...activeMutagens].reduce((sum, n) => sum + (MUTAGEN_EFFECTS[n]?.speed ?? 0), 0);

  const getEffectiveBase = (stat) => CHAR.stats[stat].base + getMutStatBonus(stat);
  const getEffectiveMod  = (stat) => Math.floor((getEffectiveBase(stat) - 10) / 2);
  const getEffectiveSave = (stat) => {
    const mod = getEffectiveMod(stat);
    return CHAR.stats[stat].prof ? mod + CHAR.profBonus : mod;
  };

  // ── Derived quick-stats ──────────────────────────────────────────────────
  const dexMod   = getEffectiveMod("DEX");
  const intMod   = getEffectiveMod("INT");
  const baseSpeed = CHAR.speed + getSpeedBonus();

  const hpPercent = Math.max(0, Math.min(100, (currentHp / CHAR.hp.max) * 100));
  const hpColor   = hpPercent > 75 ? "#4a9e6e" : hpPercent > 50 ? "#c4a030" : hpPercent > 25 ? "#c45c3e" : "#8b1c1c";

  const acBase          = 12 + dexMod + (bladesongActive ? intMod : 0);
  const acEffective     = acBase + (shieldActive ? 5 : 0);
  const acDisplay       = shieldActive ? `${acEffective} ⛨` : `${acEffective}`;
  const spellAtkDisplay = formatMod(intMod + CHAR.profBonus);
  const dcDisplay    = 8 + CHAR.profBonus + intMod;
  const initDisplay  = formatMod(dexMod);
  const effectiveSpeed = bladesongActive ? baseSpeed + 10 : baseSpeed;
  const speedDisplay = bladesongActive ? `${effectiveSpeed} ft ♪` : `${effectiveSpeed} ft`;

  const resolveSpellText = (text) => {
    if (!text) return text;
    return text
      .replace(/\{intMod\}/g, formatMod(intMod))
      .replace(/\{dexMod\}/g, formatMod(dexMod))
      .replace(/\{dc\}/g, dcDisplay)
      .replace(/\{spellAtk\}/g, spellAtkDisplay)
      .replace(/\{mirrorAC\}/g, String(10 + dexMod));
  };

  return (
    <div style={{
      fontFamily: "'EB Garamond', 'Georgia', serif",
      background: "linear-gradient(160deg, #0d0a08 0%, #1a1410 40%, #12100e 100%)",
      color: "#c4b49a", minHeight: "100vh", padding: 0, margin: 0,
      position: "relative", overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Fira+Code:wght@300;400&display=swap" rel="stylesheet" />

      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse at 20% 20%, rgba(139,28,28,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(139,105,20,0.05) 0%, transparent 50%)",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto", padding: "20px 16px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24, padding: "20px 0" }}>
          <div style={{ fontSize: 9, letterSpacing: 6, color: "#8b1c1c", textTransform: "uppercase", fontFamily: "'Cinzel', serif", marginBottom: 8 }}>
            Blood Hunter Mutant 7 · Bladesinger Wizard 5
          </div>
          <h1 style={{
            fontSize: 36, fontFamily: "'Cinzel', serif", fontWeight: 900, color: "#e8dcc4",
            margin: "4px 0", letterSpacing: 3, textTransform: "uppercase",
            textShadow: "0 0 40px rgba(139,28,28,0.4)",
          }}>
            {CHAR.name}
          </h1>
          <div style={{ fontSize: 13, color: "#d4a82a", fontFamily: "'Cinzel', serif", letterSpacing: 2, marginTop: 4 }}>
            Custom Lineage · Level 12 · Feat: Gunner
          </div>
          <div style={{ width: 60, height: 1, background: "linear-gradient(90deg, transparent, #8b1c1c, transparent)", margin: "16px auto 0" }} />
          <button
            onClick={() => {
              setSpellSlots(Object.fromEntries(Object.entries(CHAR.spells).map(([lvl, d]) => [lvl, d.slots])));
              setBladesongUsesLeft(4);
              setMutageNDoses(4);
              setBloodCurseUses(CHAR.profBonus);
            }}
            style={{
              marginTop: 14, background: "rgba(139,28,28,0.15)", border: "1px solid rgba(139,28,28,0.45)",
              color: "#c4b49a", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 3,
              textTransform: "uppercase", padding: "6px 20px", borderRadius: 2, cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.target.style.background = "rgba(139,28,28,0.3)"; e.target.style.color = "#e8dcc4"; }}
            onMouseLeave={(e) => { e.target.style.background = "rgba(139,28,28,0.15)"; e.target.style.color = "#c4b49a"; }}
          >⚭ Long Rest</button>
        </div>

        {/* Mutagen Toggles */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ textAlign: "center", fontSize: 9, letterSpacing: 3, color: "#9a8060", textTransform: "uppercase", fontFamily: "'Cinzel', serif", marginBottom: 8 }}>
            {activeMutagens.size === 0
              ? "No Mutagens Active"
              : `Mutagen${activeMutagens.size > 1 ? "s" : ""} Active (${activeMutagens.size}/${MAX_MUTAGENS}) · Strange Metabolism`}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            {CHAR.mutagens.map((m) => {
              const isActive  = activeMutagens.has(m.name);
              const isFull    = !isActive && activeMutagens.size >= MAX_MUTAGENS;
              return (
                <button
                  key={m.name}
                  onClick={() => toggleMutagen(m.name)}
                  title={isFull ? "Strange Metabolism: max 2 mutagens active" : `${m.benefit} / ${m.drawback}`}
                  style={{
                    background: isActive
                      ? "linear-gradient(180deg, rgba(139,28,28,0.5), rgba(139,28,28,0.2))"
                      : isFull ? "rgba(20,16,14,0.3)" : "rgba(30,25,20,0.6)",
                    border: `1px solid ${isActive ? "#8b1c1c" : isFull ? "#2a2018" : "#44362a"}`,
                    color: isActive ? "#e8dcc4" : isFull ? "#44362a" : "#9a8060",
                    fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 2,
                    textTransform: "uppercase", padding: "7px 18px", borderRadius: 2,
                    cursor: isFull ? "not-allowed" : "pointer", transition: "all 0.25s ease",
                    boxShadow: isActive ? "0 0 16px rgba(139,28,28,0.3), inset 0 0 16px rgba(139,28,28,0.1)" : "none",
                    opacity: isFull ? 0.45 : 1,
                  }}
                >
                  {isActive ? "◆" : "◇"} {m.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Ability Toggles */}
        <div style={{ marginBottom: 20, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setBladesongActive(prev => !prev)}
            style={{
              background: bladesongActive
                ? "linear-gradient(180deg, rgba(80,120,200,0.45), rgba(40,60,140,0.25))"
                : "rgba(30,25,20,0.6)",
              border: `1px solid ${bladesongActive ? "rgba(120,160,240,0.7)" : "#44362a"}`,
              color: bladesongActive ? "#c8d8ff" : "#9a8060",
              fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 2,
              textTransform: "uppercase", padding: "7px 20px", borderRadius: 2,
              cursor: "pointer", transition: "all 0.25s ease",
              boxShadow: bladesongActive
                ? "0 0 20px rgba(100,140,255,0.3), inset 0 0 16px rgba(100,140,255,0.1)"
                : "none",
            }}
          >
            {bladesongActive ? "♪" : "♩"} Bladesong {bladesongActive ? "Active" : "Inactive"}
            {bladesongActive && (
              <span style={{ color: "rgba(180,200,255,0.7)", fontSize: 9, marginLeft: 10 }}>
                +{intMod} AC · +10 spd · adv. Acrobatics · +{intMod} Conc.
              </span>
            )}
          </button>
          <button
            onClick={() => setTattooMaulActive(prev => !prev)}
            style={{
              background: tattooMaulActive
                ? "linear-gradient(180deg, rgba(139,105,20,0.5), rgba(90,70,10,0.25))"
                : "rgba(30,25,20,0.6)",
              border: `1px solid ${tattooMaulActive ? "rgba(212,168,42,0.7)" : "#44362a"}`,
              color: tattooMaulActive ? "#f0d060" : "#9a8060",
              fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 2,
              textTransform: "uppercase", padding: "7px 20px", borderRadius: 2,
              cursor: "pointer", transition: "all 0.25s ease",
              boxShadow: tattooMaulActive
                ? "0 0 20px rgba(212,168,42,0.25), inset 0 0 12px rgba(180,140,30,0.1)"
                : "none",
            }}
          >
            {tattooMaulActive ? "◆" : "◇"} Eldritch Maul {tattooMaulActive ? "Active" : "Inactive"}
            {tattooMaulActive && (
              <span style={{ color: "rgba(212,168,42,0.7)", fontSize: 9, marginLeft: 10 }}>
                +5ft reach · +1d6 force · 1/day
              </span>
            )}
          </button>
          <button
            onClick={() => setShieldActive(prev => !prev)}
            style={{
              background: shieldActive
                ? "linear-gradient(180deg, rgba(180,200,230,0.35), rgba(120,150,200,0.15))"
                : "rgba(30,25,20,0.6)",
              border: `1px solid ${shieldActive ? "rgba(200,220,255,0.7)" : "#44362a"}`,
              color: shieldActive ? "#ddeeff" : "#9a8060",
              fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 2,
              textTransform: "uppercase", padding: "7px 20px", borderRadius: 2,
              cursor: "pointer", transition: "all 0.25s ease",
              boxShadow: shieldActive
                ? "0 0 16px rgba(180,210,255,0.25), inset 0 0 10px rgba(160,190,255,0.1)"
                : "none",
            }}
          >
            {shieldActive ? "⛨" : "◻"} Shield {shieldActive ? "Active" : "Inactive"}
            {shieldActive && (
              <span style={{ color: "rgba(180,210,255,0.7)", fontSize: 9, marginLeft: 10 }}>
                +5 AC · react. to being hit
              </span>
            )}
          </button>
        </div>

        {/* Resource Trackers */}
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginBottom: 20, padding: "10px 16px", background: "rgba(20,16,14,0.4)", border: "1px solid rgba(139,28,28,0.15)", borderRadius: 3 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 9, letterSpacing: 2, color: "#a0b8e8", textTransform: "uppercase", fontFamily: "'Cinzel', serif" }}>Bladesong</span>
            <PipTracker total={4} remaining={bladesongUsesLeft} onSet={setBladesongUsesLeft} color="#a0b8e8" />
          </div>
          <div style={{ width: 1, background: "rgba(139,28,28,0.2)", alignSelf: "stretch" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 9, letterSpacing: 2, color: "#d4a82a", textTransform: "uppercase", fontFamily: "'Cinzel', serif" }}>Mutagen Doses</span>
            <PipTracker total={4} remaining={mutageNDoses} onSet={setMutageNDoses} color="#d4a82a" />
          </div>
        </div>

        {/* Stat Blocks */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
          {Object.entries(CHAR.stats).map(([statName, data]) => {
            const effBase  = getEffectiveBase(statName);
            const effMod   = getEffectiveMod(statName);
            const effSave  = getEffectiveSave(statName);
            const changed  = getMutStatBonus(statName) !== 0;
            return (
              <StatBlock
                key={statName}
                name={statName}
                effectiveBase={effBase}
                effectiveMod={effMod}
                effectiveSave={effSave}
                saveProficient={data.prof}
                changed={changed}
              />
            );
          })}
        </div>

        {/* HP Panel */}
        <div style={{ marginBottom: 20, padding: "14px 16px", background: "rgba(20,16,14,0.5)", border: "1px solid rgba(139,28,28,0.2)", borderRadius: 3 }}>
          {/* Health bar */}
          <div style={{ height: 8, background: "rgba(10,8,6,0.8)", borderRadius: 4, marginBottom: 12, overflow: "hidden", border: "1px solid rgba(139,28,28,0.15)" }}>
            <div style={{
              height: "100%", width: `${hpPercent}%`,
              background: hpColor,
              borderRadius: 4,
              transition: "width 0.35s ease, background 0.35s ease",
              boxShadow: `0 0 10px ${hpColor}55`,
            }} />
          </div>
          {/* HP inputs row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            {/* Current / Max */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 9, letterSpacing: 2, color: "#d4a82a", textTransform: "uppercase", fontFamily: "'Cinzel', serif" }}>HP</span>
              <input
                type="number"
                value={currentHp}
                min={0}
                max={CHAR.hp.max}
                onChange={(e) => setCurrentHp(Math.max(0, Math.min(CHAR.hp.max, Number(e.target.value) || 0)))}
                style={{
                  width: 56, textAlign: "center",
                  background: "rgba(10,8,6,0.8)",
                  border: `1px solid ${hpColor}99`,
                  borderRadius: 2, color: hpColor,
                  fontFamily: "'Fira Code', monospace", fontSize: 20, fontWeight: 700,
                  padding: "2px 4px", outline: "none",
                }}
              />
              <span style={{ color: "#7a6a56", fontSize: 15, fontFamily: "'Fira Code', monospace" }}>/ {CHAR.hp.max}</span>
            </div>
            {/* Temp HP */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, borderLeft: "1px solid rgba(139,28,28,0.2)", paddingLeft: 20 }}>
              <span style={{ fontSize: 9, letterSpacing: 2, color: "#9a8060", textTransform: "uppercase", fontFamily: "'Cinzel', serif" }}>Temp</span>
              <input
                type="number"
                value={tempHp}
                min={0}
                onChange={(e) => setTempHp(Math.max(0, Number(e.target.value) || 0))}
                style={{
                  width: 48, textAlign: "center",
                  background: "rgba(10,8,6,0.8)",
                  border: "1px solid rgba(100,140,200,0.4)",
                  borderRadius: 2, color: "#a0b8d8",
                  fontFamily: "'Fira Code', monospace", fontSize: 18, fontWeight: 700,
                  padding: "2px 4px", outline: "none",
                }}
              />
            </div>
            {/* Dice reference */}
            <div style={{ display: "flex", gap: 16, borderLeft: "1px solid rgba(139,28,28,0.2)", paddingLeft: 20, flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#8b1c1c", textTransform: "uppercase", fontFamily: "'Cinzel', serif" }}>Hemocraft Die</div>
                <div style={{ fontSize: 13, color: "#c4b49a", fontFamily: "'Fira Code', monospace", marginTop: 1 }}>{CHAR.hemocraftDie}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#9a8060", textTransform: "uppercase", fontFamily: "'Cinzel', serif" }}>Hit Dice</div>
                <div style={{ fontSize: 13, color: "#c4b49a", fontFamily: "'Fira Code', monospace", marginTop: 1 }}>{CHAR.hitDice}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8, marginBottom: 24 }}>
          {[
            { label: "AC",         value: acDisplay,             song: bladesongActive, shield: shieldActive },
            { label: "Initiative", value: initDisplay,           song: false,           shield: false        },
            { label: "Speed",      value: speedDisplay,          song: bladesongActive, shield: false        },
            { label: "Prof Bonus", value: `+${CHAR.profBonus}`,  song: false,           shield: false        },
            { label: "Spell DC",   value: dcDisplay,             song: false,           shield: false        },
            { label: "Spell Atk",  value: spellAtkDisplay,       song: false,           shield: false        },
          ].map((s, i) => (
            <div key={i} style={{
              textAlign: "center", padding: "8px 4px",
              background: s.shield ? "rgba(120,150,200,0.18)" : s.song ? "rgba(40,60,140,0.25)" : "rgba(20,16,14,0.5)",
              border: `1px solid ${s.shield ? "rgba(180,210,255,0.45)" : s.song ? "rgba(120,160,240,0.4)" : "rgba(139,28,28,0.2)"}`,
              borderRadius: 3, transition: "all 0.25s ease",
            }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: s.shield ? "#c8deff" : s.song ? "rgba(160,200,255,0.9)" : "#d4a82a", textTransform: "uppercase", fontFamily: "'Cinzel', serif" }}>{s.label}</div>
              <div style={{ fontSize: 14, color: s.shield ? "#ddeeff" : s.song ? "#c8d8ff" : "#e8dcc4", fontFamily: "'Fira Code', monospace", marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Immunities */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 9, letterSpacing: 2, color: "#9a8060", textTransform: "uppercase", fontFamily: "'Cinzel', serif" }}>Immune</span>
          {["Poison Damage", "Poisoned Condition"].map((label) => (
            <span key={label} style={{
              fontSize: 9, letterSpacing: 1, textTransform: "uppercase",
              fontFamily: "'Fira Code', monospace",
              background: "rgba(30,90,30,0.3)", border: "1px solid rgba(60,160,60,0.4)", color: "#80c880",
              padding: "2px 8px", borderRadius: 2,
            }}>{label}</span>
          ))}
          <span style={{ fontSize: 10, color: "#7a6a56", fontFamily: "'EB Garamond', serif", fontStyle: "italic" }}>Strange Metabolism</span>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid rgba(139,28,28,0.3)" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: "10px 8px", border: "none",
                borderBottom: tab === t.id ? "2px solid #8b1c1c" : "2px solid transparent",
                background: tab === t.id ? "rgba(139,28,28,0.1)" : "transparent",
                color: tab === t.id ? "#e8dcc4" : "#9a8060",
                fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* COMBAT TAB */}
        {tab === "combat" && (
          <div>
            <Section title="Weapons">
              {/* ── Scythe Whip ── */}
              {(() => {
                const atkBonus = dexMod + CHAR.profBonus;
                const dmgMod   = dexMod + 2; // Dueling +2
                const lbl = { fontSize: 9, letterSpacing: 1, color: "#d4a82a", textTransform: "uppercase", fontFamily: "'Cinzel', serif", alignSelf: "center" };
                const subLbl = { ...lbl, color: "#9a8060" };
                return (
                  <div style={{
                    padding: "12px", marginBottom: 8,
                    background: "rgba(20,16,14,0.4)",
                    border: `1px solid ${tattooMaulActive ? "rgba(212,168,42,0.35)" : "rgba(139,28,28,0.15)"}`,
                    borderRadius: 3, transition: "border-color 0.25s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontFamily: "'Cinzel', serif", color: "#e8dcc4", fontSize: 14 }}>Scythe Whip (HB)</span>
                      {tattooMaulActive && <span style={{ fontSize: 9, letterSpacing: 2, color: "#d4a82a", fontFamily: "'Cinzel', serif", textTransform: "uppercase" }}>◆ Eldritch Maul</span>}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: "7px 12px", fontSize: 12, marginBottom: 10 }}>
                      <span style={lbl}>Attack</span>
                      <span style={{ fontFamily: "'Fira Code', monospace", color: "#e8dcc4", fontSize: 17, fontWeight: 700 }}>{formatMod(atkBonus)} to hit</span>

                      <span style={lbl}>Damage</span>
                      <div style={{ fontFamily: "'Fira Code', monospace", lineHeight: 1.65 }}>
                        <div style={{ color: "#c4b49a" }}>1d8 + {dmgMod} slashing</div>
                        <div style={{ color: "#c4b49a" }}>+ 1d6 cold / lightning <span style={{ color: "#8b1c1c", fontSize: 10 }}>(Crimson Rite)</span></div>
                        {tattooMaulActive && <div style={{ color: "#d4a82a" }}>+ 1d6 force <span style={{ color: "#9a8060", fontSize: 10 }}>(Eldritch Maul)</span></div>}
                      </div>

                      <span style={subLbl}>Whip Form</span>
                      <span style={{ fontFamily: "'Fira Code', monospace", color: "#a89070" }}>1d4 + {dmgMod} slashing · +5ft reach{tattooMaulActive ? " (+5 Maul = 15ft)" : ""}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#8a7864", fontStyle: "italic", borderTop: "1px solid rgba(139,28,28,0.1)", paddingTop: 6 }}>
                      Finesse · Dueling +2 included · Bonus action: transform form
                    </div>
                  </div>
                );
              })()}

              {/* ── Silver Pistol ── */}
              {(() => {
                const atkBonus = dexMod + CHAR.profBonus;
                const dmgMod   = dexMod;
                const lbl = { fontSize: 9, letterSpacing: 1, color: "#d4a82a", textTransform: "uppercase", fontFamily: "'Cinzel', serif", alignSelf: "center" };
                const subLbl = { ...lbl, color: "#9a8060" };
                const btnStyle = {
                  background: "rgba(139,28,28,0.2)", border: "1px solid rgba(139,28,28,0.35)",
                  color: "#e8dcc4", fontFamily: "'Fira Code', monospace", fontSize: 18,
                  width: 28, height: 28, borderRadius: 2, cursor: "pointer", padding: 0, lineHeight: 1,
                };
                return (
                  <div style={{ padding: "12px", marginBottom: 8, background: "rgba(20,16,14,0.4)", border: "1px solid rgba(139,28,28,0.15)", borderRadius: 3 }}>
                    <div style={{ fontFamily: "'Cinzel', serif", color: "#e8dcc4", fontSize: 14, marginBottom: 10 }}>Silver Pistol</div>
                    <div style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: "7px 12px", fontSize: 12, marginBottom: 10 }}>
                      <span style={lbl}>Attack</span>
                      <span style={{ fontFamily: "'Fira Code', monospace", color: "#e8dcc4", fontSize: 17, fontWeight: 700 }}>{formatMod(atkBonus)} to hit</span>

                      <span style={lbl}>Damage</span>
                      <span style={{ fontFamily: "'Fira Code', monospace", color: "#c4b49a" }}>1d10 + {dmgMod} piercing</span>

                      <span style={subLbl}>Range</span>
                      <span style={{ fontFamily: "'Fira Code', monospace", color: "#a89070" }}>30 / 90 ft</span>
                    </div>

                    {/* Bullet tracker */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "8px 10px", background: "rgba(10,8,6,0.4)", border: "1px solid rgba(139,28,28,0.2)", borderRadius: 3 }}>
                      <span style={{ fontSize: 9, letterSpacing: 2, color: "#d4a82a", textTransform: "uppercase", fontFamily: "'Cinzel', serif", flex: 1 }}>Bullets</span>
                      <button onClick={() => setBulletCount(c => Math.max(0, c - 1))} style={btnStyle}>−</button>
                      <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 20, color: "#e8dcc4", minWidth: 28, textAlign: "center" }}>{bulletCount}</span>
                      <button onClick={() => setBulletCount(c => c + 1)} style={btnStyle}>+</button>
                      <span style={{ fontSize: 10, color: "#9a8060", fontFamily: "'Cinzel', serif", marginLeft: 4 }}>Create 1: take {CHAR.hemocraftDie} necrotic (unreduceable)</span>
                    </div>

                    {/* Parry */}
                    <div style={{ padding: "10px 12px", background: "rgba(139,28,28,0.08)", border: "1px solid rgba(139,28,28,0.25)", borderRadius: 3 }}>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 2, color: "#c45c3e", textTransform: "uppercase", marginBottom: 6 }}>
                        Parry — Legendary Reaction
                      </div>
                      <div style={{ fontSize: 12, color: "#a89070", lineHeight: 1.65 }}>
                        While holding the Silver Pistol in at least one hand, expend 1 bullet as a reaction to negate all incoming damage from one attack. On a <strong style={{ color: "#d4a82a" }}>natural 20</strong>, the attacker is stunned until the end of their next turn. Bullets may be stored. Damage from bullet creation ({CHAR.hemocraftDie} necrotic) cannot be reduced or mitigated by any means.
                      </div>
                    </div>

                    <div style={{ fontSize: 11, color: "#8a7864", fontStyle: "italic", borderTop: "1px solid rgba(139,28,28,0.1)", paddingTop: 6, marginTop: 8 }}>
                      Ignores loading (Gunner) · No disadv. in melee (Gunner)
                    </div>
                  </div>
                );
              })()}
            </Section>

            <Section title="Eldritch Claw Tattoo" accent="#d4a82a">
              <div style={{
                padding: "10px 12px",
                background: tattooMaulActive ? "rgba(139,105,20,0.14)" : "rgba(139,105,20,0.08)",
                border: `1px solid ${tattooMaulActive ? "rgba(212,168,42,0.5)" : "rgba(139,105,20,0.25)"}`,
                borderRadius: 3, transition: "all 0.25s",
              }}>
                <div style={{ fontSize: 13, color: "#c4b49a", lineHeight: 1.6 }}>
                  <strong style={{ color: "#e8dcc4" }}>Passive:</strong> Unarmed strikes are magical, +1 to hit and damage.<br />
                  <strong style={{ color: tattooMaulActive ? "#f0d060" : "#e8dcc4" }}>
                    Eldritch Maul (1/day, 1 min){tattooMaulActive ? " — ACTIVE" : ":"}
                  </strong>{" "}
                  All melee attacks gain +5ft reach and deal +1d6 force damage on a hit.
                </div>
                <div style={{ marginTop: 6 }}>
                  <Tag color="rgba(139,105,20,0.3)">Attunement</Tag>
                  <Tag color="rgba(139,105,20,0.3)">Uncommon</Tag>
                  <Tag color={tattooMaulActive ? "rgba(212,168,42,0.4)" : "rgba(139,105,20,0.3)"}>
                    {tattooMaulActive ? "◆ Maul Active" : "1/Day Activation"}
                  </Tag>
                </div>
              </div>
            </Section>

            <Section title="Nova Round Breakdown">
              <div style={{ padding: "12px", background: "rgba(139,28,28,0.08)", border: "1px solid rgba(139,28,28,0.2)", borderRadius: 3, fontSize: 13, lineHeight: 1.8, color: "#a89070" }}>
                <div style={{ color: "#d4a82a", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>
                  FULL BUFF — BLADESONG + HASTE + CELERITY + SAGACITY + ELDRITCH MAUL
                </div>
                3 attacks (Extra Attack + Haste)<br />
                Each: 1d8+7 slashing + 1d6 rite + 1d6 force (Maul)<br />
                Hit bonus: +10 | AC: 25 base / 30 w/ Shield<br />
                Avg damage/round: ~58.5 (three hits)<br />
                <span style={{ color: "#9a8060", fontStyle: "italic" }}>+ Reach 15ft during Eldritch Maul activation</span>
              </div>
            </Section>

            <Section title="Skills">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px", fontSize: 12 }}>
                {CHAR.skills.map((s, i) => {
                  const effMod = getEffectiveMod(s.stat);
                  const total  = s.prof ? effMod + CHAR.profBonus : effMod;
                  const changed = getMutStatBonus(s.stat) !== 0;
                  const songAdv = bladesongActive && s.name === "Acrobatics";
                  return (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", padding: "3px 4px",
                      color: songAdv ? "#c8d8ff" : s.prof ? "#c4b49a" : "#9a8060",
                      borderBottom: "1px solid rgba(139,28,28,0.07)",
                      background: songAdv ? "rgba(80,120,200,0.08)" : undefined,
                    }}>
                      <span>
                        {s.prof ? "★ " : "  "}{s.name}{" "}
                        <span style={{ fontSize: 9, color: "#7a6a56" }}>({s.stat})</span>
                        {songAdv && <span style={{ fontSize: 9, color: "rgba(140,180,255,0.8)", marginLeft: 4 }}>ADV ♪</span>}
                      </span>
                      <span style={{ fontFamily: "'Fira Code', monospace", color: changed ? "#c45c3e" : songAdv ? "#c8d8ff" : s.prof ? "#c4b49a" : "#9a8060" }}>{formatMod(total)}</span>
                    </div>
                  );
                })}
              </div>
            </Section>
          </div>
        )}

        {/* SPELLS TAB */}
        {tab === "spells" && (
          <div>
            <Section title="Cantrips">
              {CHAR.cantrips.map((c) => {
                const open = expandedSpells.has(c.name);
                return (
                  <div
                    key={c.name}
                    onClick={() => toggleSpell(c.name)}
                    style={{
                      padding: "8px 12px", marginBottom: 4, cursor: "pointer",
                      background: open ? "rgba(139,105,20,0.12)" : "rgba(20,16,14,0.3)",
                      borderLeft: `2px solid ${open ? "rgba(212,168,42,0.6)" : "rgba(139,105,20,0.4)"}`,
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#e8dcc4", fontFamily: "'Cinzel', serif", fontSize: 13 }}>{c.name}</span>
                        {c.action && <ActionBadge type={c.action} />}
                        {c.conc && <ConcBadge />}
                      </div>
                      <span style={{ color: "#7a6a56", fontSize: 10 }}>{open ? "▲" : "▼"}</span>
                    </div>
                    <div style={{ color: "#9a8060", fontSize: 12, marginTop: 2 }}>{resolveSpellText(c.desc)}</div>
                    {open && (
                      <div style={{
                        marginTop: 10, padding: "10px 12px",
                        background: "rgba(10,8,6,0.4)", borderRadius: 2,
                        fontSize: 12, color: "#a89070", lineHeight: 1.75,
                        whiteSpace: "pre-line",
                        borderTop: "1px solid rgba(139,105,20,0.2)",
                      }}>
                        {resolveSpellText(c.fullDesc)}
                      </div>
                    )}
                  </div>
                );
              })}
            </Section>
            {Object.entries(CHAR.spells).map(([level, data]) => (
              <Section key={level} title={`${level} Level`} right={
                <PipTracker
                  total={data.slots}
                  remaining={spellSlots[level]}
                  onSet={(v) => setSpellSlots(prev => ({ ...prev, [level]: v }))}
                  color="#8ab4d8"
                />
              }>
                {data.list.map((sp) => {
                  const open = expandedSpells.has(sp.name);
                  return (
                    <div
                      key={sp.name}
                      onClick={() => toggleSpell(sp.name)}
                      style={{
                        padding: "8px 12px", marginBottom: 4, cursor: "pointer",
                        background: open ? "rgba(139,28,28,0.12)" : "rgba(20,16,14,0.3)",
                        borderLeft: `2px solid ${open ? "rgba(139,28,28,0.6)" : "rgba(139,28,28,0.4)"}`,
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#e8dcc4", fontFamily: "'Cinzel', serif", fontSize: 13 }}>{sp.name}</span>
                          {sp.action && <ActionBadge type={sp.action} />}
                          {sp.conc && <ConcBadge />}
                          {sp.ritual && <Tag color="rgba(139,105,20,0.3)">Ritual</Tag>}
                        </div>
                        <span style={{ color: "#7a6a56", fontSize: 10 }}>{open ? "▲" : "▼"}</span>
                      </div>
                      <div style={{ color: "#9a8060", fontSize: 12, marginTop: 2 }}>{resolveSpellText(sp.desc)}</div>
                      {open && (
                        <div style={{
                          marginTop: 10, padding: "10px 12px",
                          background: "rgba(10,8,6,0.4)", borderRadius: 2,
                          fontSize: 12, color: "#a89070", lineHeight: 1.75,
                          whiteSpace: "pre-line",
                          borderTop: "1px solid rgba(139,28,28,0.2)",
                        }}>
                          {resolveSpellText(sp.fullDesc)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </Section>
            ))}
          </div>
        )}

        {/* FEATURES TAB */}
        {tab === "features" && (
          <div>
            <Section title="Mutagens — Click to Toggle">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {CHAR.mutagens.map((m) => {
                  const isActive = activeMutagens.has(m.name);
                  const isFull   = !isActive && activeMutagens.size >= MAX_MUTAGENS;
                  return (
                    <div
                      key={m.name}
                      onClick={() => toggleMutagen(m.name)}
                      title={isFull ? "Strange Metabolism: max 2 mutagens active" : undefined}
                      style={{
                        padding: "10px 12px",
                        background: isActive ? "rgba(139,28,28,0.18)" : "rgba(20,16,14,0.3)",
                        border: `1px solid ${isActive ? "rgba(139,28,28,0.5)" : "rgba(60,50,40,0.3)"}`,
                        borderRadius: 3,
                        cursor: isFull ? "not-allowed" : "pointer",
                        opacity: isFull ? 0.45 : 1,
                        transition: "all 0.25s ease",
                        userSelect: "none",
                      }}
                    >
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: isActive ? "#e8dcc4" : "#9a8060", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: isActive ? "#8b1c1c" : "#44362a" }}>{isActive ? "◆" : "◇"}</span>
                        {m.name}
                      </div>
                      <div style={{ fontSize: 11, marginTop: 4, color: isActive ? "#d4a82a" : "#7a6a56" }}>↑ {m.benefit}</div>
                      <div style={{ fontSize: 11, color: isActive ? "#8b4444" : "#7a6a56" }}>↓ {m.drawback}</div>
                    </div>
                  );
                })}
              </div>

              {/* Live Active Effects Summary */}
              {activeMutagens.size > 0 && (
                <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(10,8,6,0.5)", border: "1px solid rgba(139,28,28,0.2)", borderRadius: 3 }}>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "#8b1c1c", textTransform: "uppercase", fontFamily: "'Cinzel', serif", marginBottom: 8 }}>
                    Active Effects
                  </div>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    {["STR","DEX","CON","INT","WIS","CHA"].map(stat => {
                      const bonus = getMutStatBonus(stat);
                      if (bonus === 0) return null;
                      const effBase = getEffectiveBase(stat);
                      const effMod  = getEffectiveMod(stat);
                      return (
                        <div key={stat} style={{ fontFamily: "'Fira Code', monospace", fontSize: 11 }}>
                          <span style={{ color: "#9a8060" }}>{stat} </span>
                          <span style={{ color: "#7a6a56" }}>{CHAR.stats[stat].base}</span>
                          <span style={{ color: "#9a8060", margin: "0 3px" }}>→</span>
                          <span style={{ color: bonus > 0 ? "#d4a82a" : "#8b4444" }}>{effBase} ({formatMod(effMod)})</span>
                        </div>
                      );
                    })}
                    {getSpeedBonus() !== 0 && (
                      <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 11 }}>
                        <span style={{ color: "#9a8060" }}>Speed </span>
                        <span style={{ color: "#7a6a56" }}>{CHAR.speed}</span>
                        <span style={{ color: "#9a8060", margin: "0 3px" }}>→</span>
                        <span style={{ color: getSpeedBonus() > 0 ? "#d4a82a" : "#8b4444" }}>{CHAR.speed + getSpeedBonus()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Section>

            <Section title="Class Features">
              {CHAR.features.map((f) => {
                const open = expandedFeatures.has(f.name);
                return (
                  <div
                    key={f.name}
                    onClick={() => toggleFeature(f.name)}
                    style={{
                      padding: "10px 12px", marginBottom: 6, cursor: "pointer",
                      background: open ? "rgba(139,28,28,0.1)" : "rgba(20,16,14,0.3)",
                      border: `1px solid ${open ? "rgba(139,28,28,0.35)" : "rgba(139,28,28,0.1)"}`,
                      borderRadius: 3, transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "'Cinzel', serif", color: "#e8dcc4", fontSize: 14 }}>{f.name}</span>
                        {f.action && <ActionBadge type={f.action} />}
                        <Tag>{f.source}</Tag>
                      </div>
                      <span style={{ color: "#7a6a56", fontSize: 10 }}>{open ? "▲" : "▼"}</span>
                    </div>
                    {open && (
                      <div style={{ fontSize: 12, color: "#a89070", marginTop: 8, lineHeight: 1.6 }}>{f.desc}</div>
                    )}
                  </div>
                );
              })}
            </Section>

            <Section title="Blood Curses">
              {/* Uses tracker */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "10px 14px", background: "rgba(139,28,28,0.1)", border: "1px solid rgba(139,28,28,0.3)", borderRadius: 3 }}>
                <span style={{ fontSize: 9, letterSpacing: 2, color: "#8b1c1c", textTransform: "uppercase", fontFamily: "'Cinzel', serif", flex: 1 }}>
                  Uses Remaining · Prof. Bonus / Long Rest
                </span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {Array.from({ length: CHAR.profBonus }).map((_, i) => (
                    <div
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setBloodCurseUses(i < bloodCurseUses ? i : i + 1); }}
                      style={{
                        width: 14, height: 14, borderRadius: "50%", cursor: "pointer",
                        background: i < bloodCurseUses ? "#8b1c1c" : "transparent",
                        border: `1px solid ${i < bloodCurseUses ? "#8b1c1c" : "rgba(139,28,28,0.4)"}`,
                        transition: "all 0.15s",
                        boxShadow: i < bloodCurseUses ? "0 0 6px rgba(139,28,28,0.5)" : "none",
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 14, color: "#e8dcc4", minWidth: 24, textAlign: "center" }}>{bloodCurseUses}/{CHAR.profBonus}</span>
              </div>
              {CHAR.features.filter(f => f.name.startsWith("Blood Curse")).map((f) => {
                const open = expandedFeatures.has(f.name);
                return (
                  <div
                    key={f.name}
                    onClick={() => toggleFeature(f.name)}
                    style={{
                      padding: "10px 12px", marginBottom: 6, cursor: "pointer",
                      background: open ? "rgba(139,28,28,0.14)" : "rgba(139,28,28,0.06)",
                      border: `1px solid ${open ? "rgba(139,28,28,0.45)" : "rgba(139,28,28,0.2)"}`,
                      borderRadius: 3, transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "'Cinzel', serif", color: "#e8dcc4", fontSize: 14 }}>{f.name}</span>
                        {f.action && <ActionBadge type={f.action} />}
                      </div>
                      <span style={{ color: "#7a6a56", fontSize: 10 }}>{open ? "▲" : "▼"}</span>
                    </div>
                    {open && (
                      <div style={{ fontSize: 12, color: "#a89070", marginTop: 8, lineHeight: 1.6 }}>{f.desc}</div>
                    )}
                  </div>
                );
              })}
            </Section>
          </div>
        )}

        {/* GEAR TAB */}
        {tab === "gear" && (
          <div>
            <Section title="Equipment">
              <div style={{ display: "grid", gap: 3 }}>
                {CHAR.equipment.map((item, i) => (
                  <div key={i} style={{ padding: "6px 12px", fontSize: 13, color: "#a89070", background: "rgba(20,16,14,0.3)", borderLeft: "2px solid rgba(139,105,20,0.3)" }}>
                    {item}
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Consumables" accent="#d4a82a">
              {CHAR.consumables.map((c, i) => (
                <div key={i} style={{ padding: "8px 12px", marginBottom: 4, background: "rgba(139,105,20,0.05)", border: "1px solid rgba(139,105,20,0.15)", borderRadius: 3 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'Cinzel', serif", color: "#e8dcc4", fontSize: 13 }}>{c.name}</span>
                    <Tag color={
                      c.rarity === "Rare"   ? "rgba(139,28,28,0.35)"  :
                      c.rarity === "Common" ? "rgba(80,70,60,0.4)"    :
                                              "rgba(139,105,20,0.25)"
                    }>{c.rarity}</Tag>
                  </div>
                  <div style={{ fontSize: 12, color: "#9a8060", marginTop: 2 }}>{c.desc}</div>
                </div>
              ))}
            </Section>
          </div>
        )}

        {/* LORE TAB */}
        {tab === "lore" && (() => {
          const textareaStyle = {
            width: "100%", boxSizing: "border-box",
            background: "rgba(10,8,6,0.6)", border: "1px solid rgba(139,28,28,0.25)",
            borderRadius: 3, color: "#c4b49a", fontFamily: "'EB Garamond', Georgia, serif",
            fontSize: 14, lineHeight: 1.7, padding: "10px 12px", resize: "vertical",
            outline: "none", transition: "border-color 0.2s",
          };
          const fields = [
            { key: "history",     label: "History & Background", rows: 10,
              placeholder: "Where did Lucien come from? What drove them to become a Blood Hunter? Describe their past, formative events, and the road that led here..." },
            { key: "personality", label: "Personality Traits",   rows: 4,
              placeholder: "How does Lucien carry themselves? Mannerisms, quirks, habits..." },
            { key: "ideals",      label: "Ideals",               rows: 3,
              placeholder: "What principles guide Lucien's choices?" },
            { key: "bonds",       label: "Bonds",                rows: 3,
              placeholder: "Who or what does Lucien care about above all else?" },
            { key: "flaws",       label: "Flaws",                rows: 3,
              placeholder: "What weaknesses, vices, or fears hold Lucien back?" },
            { key: "notes",       label: "Session Notes",        rows: 6,
              placeholder: "Anything else — DM secrets learned, NPCs met, loose threads..." },
          ];
          return (
            <div>
              {fields.map(({ key, label, rows, placeholder }) => (
                <Section key={key} title={label}>
                  <textarea
                    rows={rows}
                    value={lore[key]}
                    placeholder={placeholder}
                    onChange={(e) => setLore(prev => ({ ...prev, [key]: e.target.value }))}
                    onFocus={(e) => e.target.style.borderColor = "rgba(139,28,28,0.6)"}
                    onBlur={(e)  => e.target.style.borderColor = "rgba(139,28,28,0.25)"}
                    style={textareaStyle}
                  />
                </Section>
              ))}
            </div>
          );
        })()}

        {/* Footer */}
        <div style={{
          marginTop: 32, paddingTop: 16,
          borderTop: "1px solid rgba(139,28,28,0.2)",
          textAlign: "center", fontSize: 9, letterSpacing: 3, color: "#44362a",
          fontFamily: "'Cinzel', serif", textTransform: "uppercase",
        }}>
          A Hunter Must Hunt · Blood Hunter 7 / Bladesinger 5
        </div>
      </div>
    </div>
  );
}
