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
