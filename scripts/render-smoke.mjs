// Renders the sheet through Vite's SSR pipeline to prove the component tree
// executes without throwing, and sanity-checks the new UI actually shows up.
import { createServer } from "vite";
import { renderToString } from "react-dom/server";
import { createElement } from "react";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
try {
  const { default: CharacterSheet } = await server.ssrLoadModule("/src/App.jsx");
  const html = renderToString(createElement(CharacterSheet));

  const expectations = [
    ["character name", "Dr. Lucien Harrow"],
    ["short rest button", "Short Rest"],
    ["long rest button", "Long Rest"],
    ["save indicator", "Auto-saves to this browser"],
    ["export control", "Export"],
    ["damage control", "Damage"],
    ["heal control", "Heal"],
    ["hit dice tracker", "Hit Dice"],
    ["status section", "Status"],
    ["concentration toggle", "Concentrating"],
    ["condition chip", "Frightened"],
    ["poison immunity chip", "Poisoned"],
    ["exhaustion tracker", "Exhaustion"],
    ["exhaustion label", "No exhaustion"],
    ["haste toggle", "Haste: doubles speed"],
    ["sigil svg", "cs-sigil-ring"],
    ["hp bar class", "cs-hp-fill"],
    ["tab classes", "cs-tab cs-btn"],
  ];

  let failures = 0;
  for (const [label, needle] of expectations) {
    const ok = html.includes(needle);
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  }

  // The Amulet of Health is attuned by default, so CON reads 19 (not its base 14)
  // and max HP is 51 + 4x12 = 99 on the very first load.
  const conRaised = /CON<\/span>[\s\S]{0,400}?>19</.test(html);
  if (!conRaised) failures++;
  console.log(`${conRaised ? "PASS" : "FAIL"}  amulet raises CON to 19 by default`);
  const maxHp = /\/ (<!-- -->)?99/.test(html);
  if (!maxHp) failures++;
  console.log(`${maxHp ? "PASS" : "FAIL"}  max HP is 99 with the amulet attuned`);

  // Death saves and the concentration prompt are conditional - they must NOT be
  // in the initial render (full HP, not concentrating).
  for (const [label, needle] of [["death saves hidden at full HP", "Death Saves"],
                                 ["conc prompt hidden", "Concentration check"]]) {
    const ok = !html.includes(needle);
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  }

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"} · ${html.length} bytes rendered`);
  process.exitCode = failures === 0 ? 0 : 1;
} finally {
  await server.close();
}
