// Renders the sheet with buffs and weapon forms already active, to confirm the
// derived numbers - AC, speed, DEX save advantage, weapon damage and reach - come
// out right.
import { createServer } from "vite";
import { renderToString } from "react-dom/server";
import { createElement } from "react";

const store = new Map();
globalThis.window = {
  localStorage: {
    get length() { return store.size; },
    key: (i) => [...store.keys()][i] ?? null,
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
};

const seed = (state) => {
  store.clear();
  for (const [k, v] of Object.entries(state)) {
    store.set(`lucien-harrow/v1/${k}`, JSON.stringify(v));
  }
};

const results = [];
const check = (label, ok) => results.push([label, ok]);

// Slice one stat block out of the rendered sheet, so a marker can be attributed to the
// right stat instead of matching one belonging to a neighbour.
const STAT_ORDER = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
const statBlock = (html, stat) => {
  const start = html.indexOf(`>${stat}</span>`);
  if (start === -1) return "";
  const next = STAT_ORDER[STAT_ORDER.indexOf(stat) + 1];
  const end = next ? html.indexOf(`>${next}</span>`, start) : -1;
  return html.slice(start, end === -1 ? start + 900 : end);
};

const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
try {
  const { default: CharacterSheet } = await server.ssrLoadModule("/src/App.jsx");
  const render = () => renderToString(createElement(CharacterSheet));

  // Baseline: default mutagens (Celerity +3 DEX, Sagacity +3 INT), amulet attuned.
  // DEX 22 (+6), so AC = 12 + 6 = 18 and speed is an unmodified 30 ft.
  seed({});
  let html = render();
  check("baseline AC is 18", html.includes(">18<"));
  check("baseline speed is 30 ft", html.includes("30 ft"));
  check("no DEX save advantage without Haste", !html.includes("ADV ⏵⏵"));

  // Haste alone: +2 AC (20), speed doubled (60 ft), advantage on DEX saves.
  seed({ hasteActive: true });
  html = render();
  check("Haste AC is 20", html.includes("20 ⏵⏵"));
  check("Haste doubles speed to 60 ft", html.includes("60 ft ⏵⏵"));
  check("Haste grants DEX save advantage", html.includes("ADV ⏵⏵"));

  // Haste + Bladesong: AC = 12 + 6 DEX + 5 INT + 2 Haste = 25.
  // Speed = (30 + 10 Bladesong) doubled = 80 ft.
  seed({ hasteActive: true, bladesongActive: true });
  html = render();
  check("Haste + Bladesong AC is 25", html.includes("25 ⏵⏵"));
  check("Haste doubles the Bladesong speed to 80 ft", html.includes("80 ft ♪ ⏵⏵"));

  // Haste + Shield: the reaction stacks on top for 25.
  seed({ hasteActive: true, shieldActive: true });
  html = render();
  check("Haste + Shield AC is 25", html.includes("25 ⛨ ⏵⏵"));

  // Exhaustion 2 halves speed, and it applies after Haste doubles it: 60 -> 30.
  seed({ hasteActive: true, exhaustion: 2 });
  html = render();
  check("exhaustion 2 halves the hasted speed", html.includes("30 ft ⏵⏵"));

  // Turning Haste on takes your concentration.
  seed({ hasteActive: true, concentration: { active: true, spell: "Haste" } });
  html = render();
  check("Haste occupies concentration", html.includes('value="Haste"'));

  // Scythe form: 1d8 + 8 (DEX 22 with Celerity, +2 Dueling) at 5 ft.
  seed({});
  html = render();
  check("scythe form rolls 1d8", /1d8[\s\S]{0,40}?8[\s\S]{0,40}?slashing/.test(html));
  check("scythe form reaches 5 ft", /5(<!-- -->)? ft/.test(html));
  check("whip form offered as the alternative", html.includes("Whip Form"));

  // Whip form: 1d4 instead, and 5 ft more reach.
  seed({ whipForm: true });
  html = render();
  check("whip form rolls 1d4", /1d4[\s\S]{0,40}?8[\s\S]{0,40}?slashing/.test(html));
  check("whip form reaches 10 ft", /10(<!-- -->)? ft/.test(html));
  check("scythe form offered as the alternative", html.includes("Scythe Form"));

  // Eldritch Maul adds 5 ft on top of whichever form is active.
  seed({ whipForm: true, tattooMaulActive: true });
  html = render();
  check("whip plus maul reaches 15 ft", /15(<!-- -->)? ft/.test(html));

  // Attack routine, computed live. Scythe 1d8 (avg 4.5) + 8 damage mod (DEX 6 + Dueling 2)
  // + 1d6 rite (3.5) = 16 per attack, two attacks, plus 2d8 (9) from Booming Blade = 41.
  seed({});
  html = render();
  check("routine averages 41.0 unbuffed", html.includes("~41.0 per round"));
  check("routine counts 2 attacks unbuffed", html.includes("across 2 attacks"));
  check("routine names Booming Blade", html.includes("Booming Blade"));
  check("routine offers Haste as an upgrade", html.includes("Haste would add a third attack"));

  // Haste adds a third attack, Maul adds 1d6 force (3.5) to each: 3 x 19.5 + 9 = 67.5.
  seed({ hasteActive: true, tattooMaulActive: true });
  html = render();
  check("routine averages 67.5 with Haste and Maul", html.includes("~67.5 per round"));
  check("routine counts 3 attacks with Haste", html.includes("across 3 attacks"));
  check("routine drops the Haste suggestion once active", !html.includes("Haste would add a third attack"));

  // Whip form trades the d8 for a d4: 3 x 17.5 + 9 = 61.5, at 15 ft with Maul.
  seed({ hasteActive: true, tattooMaulActive: true, whipForm: true });
  html = render();
  check("routine averages 61.5 in whip form", html.includes("~61.5 per round"));
  check("routine reports 15 ft reach in whip form with Maul", html.includes("reach 15 ft"));

  // Greater Invisibility takes concentration, so switching it on ends Haste, and it
  // marks advantage on both weapon attack lines.
  seed({ greaterInvisActive: true });
  html = render();
  check("Greater Invisibility marks advantage on attacks", (html.match(/ADV ◌/g) ?? []).length === 2);
  check("Greater Invisibility shows as active", html.includes("adv. attacks · disadv. against you"));

  // Fire Shield is a three-state control feeding the resistance chips.
  seed({ fireShield: "warm" });
  html = render();
  check("warm Fire Shield resists cold", html.includes("Resist Cold"));
  check("warm Fire Shield reports its retaliation", html.includes("2d8 fire to melee attackers"));
  seed({ fireShield: "chill" });
  html = render();
  check("chill Fire Shield resists fire", html.includes("Resist Fire"));
  seed({});
  html = render();
  check("no Fire Shield means no resistance chip", !html.includes("Resist Cold") && !html.includes("Resist Fire"));

  // Mutagen side effects are disadvantage-based, not stat penalties. With Celerity and
  // Sagacity active, STR must still read 8 and WIS must still read 10.
  seed({});
  html = render();
  check("Celerity no longer drains STR", /STR<\/span>[\s\S]{0,400}?>8</.test(html));
  check("Sagacity no longer drains WIS", /WIS<\/span>[\s\S]{0,400}?>10</.test(html));
  check("Celerity still grants +3 DEX", /DEX<\/span>[\s\S]{0,400}?>22</.test(html));
  check("Sagacity still grants +3 INT", /INT<\/span>[\s\S]{0,400}?>21</.test(html));

  // Celerity and Sagacity put WIS and CHA saves at disadvantage, marked on the stat blocks.
  check("WIS save marked DIS by Celerity", statBlock(html, "WIS").includes("DIS ◆"));
  check("CHA save marked DIS by Sagacity", statBlock(html, "CHA").includes("DIS ◆"));
  check("DIS marker names its source", html.includes("Celerity: disadvantage on WIS saving throws"));
  check("STR carries no DIS marker", !statBlock(html, "STR").includes("DIS ◆"));
  check("DEX carries no DIS marker", !statBlock(html, "DEX").includes("DIS ◆"));

  // Negating a side effect must clear its DIS marker too.
  seed({ suppressedMutagen: "Celerity", metabolismUsed: true });
  html = render();
  check("negating Celerity clears the WIS DIS marker", !statBlock(html, "WIS").includes("DIS ◆"));
  check("Sagacity's CHA DIS marker survives", statBlock(html, "CHA").includes("DIS ◆"));

  // Advantage and disadvantage on the same save cancel out. Potency disadvantages DEX
  // saves, Haste advantages them.
  seed({ fifthFormula: "Potency", mutagens: { __type: "Set", values: ["Potency"] }, hasteActive: true });
  html = render();
  const dexBlock = statBlock(html, "DEX");
  check("DEX save shows the advantage marker", dexBlock.includes("ADV ⏵⏵"));
  check("DEX save shows the disadvantage marker", dexBlock.includes("DIS ◆"));
  check("DEX save notes the two cancel out", dexBlock.includes("= flat"));

  // Strange Metabolism offers a suppression button per active mutagen, and reports
  // the negation once one is chosen.
  check("metabolism offers a suppression choice", html.includes("negate a side effect"));
  seed({ suppressedMutagen: "Celerity", metabolismUsed: true });
  html = render();
  check("metabolism reports the negated mutagen", html.includes("side effect negated"));
  seed({ metabolismUsed: true });
  html = render();
  check("spent metabolism is shown as spent", html.includes("Strange Metabolism spent"));

  // Reconstruction's -10 ft speed is part of its side effect, so suppressing it
  // restores the lost movement: 20 ft back up to 30 ft.
  seed({ mutagens: { __type: "Set", values: ["Reconstruction"] } });
  html = render();
  check("Reconstruction costs 10 ft of speed", /20(<!-- -->)? ft/.test(html));
  seed({ mutagens: { __type: "Set", values: ["Reconstruction"] }, suppressedMutagen: "Reconstruction", metabolismUsed: true });
  html = render();
  check("suppressing Reconstruction restores the speed", /30(<!-- -->)? ft/.test(html));

  // Skills render above the tab bar, so they are visible whichever tab is open.
  seed({});
  html = render();
  const skillsIndex = html.indexOf("Acrobatics");
  const tabBarIndex = html.indexOf("cs-tabs");
  check("skills are rendered", skillsIndex !== -1);
  check("skills sit above the tab bar, outside any tab", skillsIndex !== -1 && skillsIndex < tabBarIndex);
  check("skills sit below the status panel heading", html.indexOf("Skills") < html.indexOf("Concentrating"));
} finally {
  await server.close();
}

const failed = results.filter(([, ok]) => !ok);
for (const [label, ok] of results) console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
console.log(`\n${failed.length === 0 ? "ALL CHECKS PASSED" : failed.length + " CHECK(S) FAILED"}`);
process.exitCode = failed.length ? 1 : 0;
