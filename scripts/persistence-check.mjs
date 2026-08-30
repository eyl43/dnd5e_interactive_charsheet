// Exercises the persistence module against a fake localStorage.
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

const results = [];
const check = (label, ok) => { results.push([label, ok]); };

const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
try {
  const P = await server.ssrLoadModule("/src/persistence.js");

  // ── Read path: a Set stored on disk comes back as a real Set ──────────────
  store.set("lucien-harrow/v1/mutagens", JSON.stringify({ __type: "Set", values: ["Celerity", "Rapidity"] }));
  store.set("lucien-harrow/v1/currentHp", "42");
  store.set("lucien-harrow/v1/conditions", JSON.stringify({ __type: "Set", values: ["Prone"] }));

  const Probe = () => {
    const [mutagens] = P.usePersistentState("mutagens", new Set());
    const [hp] = P.usePersistentState("currentHp", 75);
    const [conditions] = P.usePersistentState("conditions", new Set());
    const [missing] = P.usePersistentState("neverWritten", { fallback: true });
    return createElement(
      "div",
      null,
      `isSet=${mutagens instanceof Set} mutagens=${[...mutagens].join(",")} hp=${hp} ` +
      `conditions=${[...conditions].join(",")} fallback=${missing.fallback}`
    );
  };
  const html = renderToString(createElement(Probe));
  check("Set revives as a Set", html.includes("isSet=true"));
  check("Set contents restored", html.includes("mutagens=Celerity,Rapidity"));
  check("number restored", html.includes("hp=42"));
  check("second Set restored", html.includes("conditions=Prone"));
  check("missing key falls back to default", html.includes("fallback=true"));

  // ── Write path: what the hook stores must be what it reads back ──────────
  const roundTrip = (v) => P.deserialize(P.serialize(v), 'NO-FALLBACK');
  const setOut = roundTrip(new Set(['Celerity', 'Sagacity']));
  check('serialize/deserialize preserves a Set', setOut instanceof Set && [...setOut].join(',') === 'Celerity,Sagacity');
  check('stored Set shape matches the reader', P.serialize(new Set(['Prone'])) === JSON.stringify({ __type: 'Set', values: ['Prone'] }));
  const nested = roundTrip({ active: true, spell: 'Web', slots: { '1st': 4 } });
  check('nested objects survive', nested.active === true && nested.spell === 'Web' && nested.slots['1st'] === 4);
  check('empty Set survives', roundTrip(new Set()) instanceof Set);
  check('deserialize of null uses the fallback', P.deserialize(null, 'fb') === 'fb');

  // ── Corrupt data must not take the sheet down ─────────────────────────────
  store.set("lucien-harrow/v1/broken", "{not json");
  const Broken = () => {
    const [v] = P.usePersistentState("broken", "safe-default");
    return createElement("div", null, String(v));
  };
  check("corrupt JSON falls back", renderToString(createElement(Broken)).includes("safe-default"));

  // ── Export / import / clear ───────────────────────────────────────────────
  const exported = P.exportSheet();
  check("export uses the right envelope", exported.format === "dnd5e-charsheet" && exported.version === 1);
  check("export strips the key prefix", Object.hasOwn(exported.data, "currentHp"));
  check("export ignores foreign keys", !Object.keys(exported.data).some((k) => k.includes("/")));

  store.set("unrelated-app-key", "keep me");
  P.clearSheet();
  check("clear wipes namespaced keys", store.size === 1);
  check("clear leaves other apps alone", store.get("unrelated-app-key") === "keep me");

  P.importSheet(exported);
  check("import restores values", store.get("lucien-harrow/v1/currentHp") === "42");
  check("import restores Sets", JSON.parse(store.get("lucien-harrow/v1/mutagens")).values.join(",") === "Celerity,Rapidity");

  let rejected = false;
  try { P.importSheet({ format: "something-else", data: {} }); } catch { rejected = true; }
  check("import rejects a foreign file", rejected);

  // ── Round trip: exported data reads back through the hook ─────────────────
  const roundTripped = renderToString(createElement(Probe));
  check("round trip preserves the Set", roundTripped.includes("mutagens=Celerity,Rapidity"));

  // ── A save that can't be written must not throw ───────────────────────────
  globalThis.window.localStorage.setItem = () => { throw new Error("quota"); };
  let survived = true;
  try { P.clearSheet(); P.importSheet(exported); } catch { survived = false; }
  check("write failures degrade quietly", survived);
} finally {
  await server.close();
}

const failed = results.filter(([, ok]) => !ok);
for (const [label, ok] of results) console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
console.log(`\n${failed.length === 0 ? "ALL CHECKS PASSED" : failed.length + " CHECK(S) FAILED"}`);
process.exitCode = failed.length ? 1 : 0;
