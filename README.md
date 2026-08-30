# DND 5e Interactive Character Sheet

An interactive character sheet for Dr. Lucien Harrow, a Blood Hunter (Mutant) 7 / Bladesinger Wizard 5.
Code may need to be heavily modified for other classes.

Live sheet: https://eyl43.github.io/dnd5e_interactive_charsheet/

## Development setup

This is a React + Vite app, so the environment is a local `node_modules` rather than a Python virtualenv.
You need Node 20 or newer.

```bash
npm install     # one-time: creates the local node_modules
npm run dev     # dev server with hot reload at http://localhost:5173/dnd5e_interactive_charsheet/
```

Other scripts:

```bash
npm run lint    # eslint over the whole project
npm run check   # headless render + persistence checks (see scripts/)
npm run build   # production build into dist/
npm run preview # serve the production build locally
```

Pushing to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`.

## Saving between sessions

Everything the sheet tracks during play is written to the browser's `localStorage` as you change it, under the `lucien-harrow/v1/` namespace.
Close the tab, come back next session, and current HP, conditions, spell slots, and the rest are exactly where you left them.

What persists: current and temp HP, conditions, exhaustion, concentration, death saves, hit dice, spell slots, Bladesong and Blood Maledict uses, mutagen doses, active mutagens, attuned items, the Bladesong / Eldritch Maul / Shield toggles, bullet count, Arcane Recovery, and every lore field.
What does not persist: which tab is open and which cards are expanded, since those are just where you happen to be looking.

Saved state lives in one browser on one machine.
Three controls under the header manage it:

- **Export** downloads the whole sheet as a JSON file, which is also how you move it to another browser or keep a backup before a risky session.
- **Import** restores from one of those files and reloads the page.
- **Reset** wipes all saved progress and returns the sheet to its starting values, after a confirmation.

If the browser refuses to store anything, for example in a private window, the sheet still works normally for the session but nothing is saved.

## Tracking health and status

The health panel handles the whole damage pipeline rather than just holding a number.

- Type a number and hit **Damage** (or press Enter) to apply it.
- Temporary HP absorbs damage first, automatically, before current HP is touched.
- **Heal** (or Shift+Enter) heals and clears any death saves.
- Hit dice are tracked as two pools, 7d8 from Blood Hunter and 5d6 from Wizard.
- Death saves appear on their own once you drop to 0 HP, and disappear when you are healed.

The status panel tracks all fourteen conditions, plus exhaustion and concentration.

- Conditions are click-to-toggle, and each one shows its rules text on hover.
- Poisoned is marked immune and cannot be toggled, since Strange Metabolism rules it out.
- Exhaustion is applied for real: level 2 halves speed, level 4 halves your HP maximum, level 5 drops speed to 0.
- Concentration tracks what you are concentrating on and shows your save bonus, including the Bladesong INT bonus.
- Taking damage while concentrating raises the concentration check with its DC already worked out.
- Becoming incapacitated warns you that Bladesong ends.

## Buff toggles

The four buttons under the header are the buffs that change your numbers, and every toggle recalculates the sheet live.

| Toggle | What it applies |
| --- | --- |
| Bladesong | +INT to AC, +10 ft speed, advantage on Acrobatics, +INT to concentration saves |
| Eldritch Maul | +5 ft reach and +1d6 force on melee attacks, shown on the weapon cards |
| Shield | +5 AC |
| Haste | Speed doubled, +2 AC, advantage on DEX saving throws, one extra limited action |

Haste is a concentration spell, so the sheet wires the two together.
Turning Haste on sets your concentration to Haste, and losing concentration drops Haste and raises the lethargy reminder, since you cannot move or act until after your next turn.

Order of operations for speed: the Bladesong bonus applies first, then Haste doubles the total, then exhaustion halves it.
So Bladesong plus Haste is (30 + 10) x 2 = 80 ft.

## Rests

**Short Rest** ends Bladesong, Shield, and concentration, and restores both Blood Maledict uses.
Spend hit dice yourself from the health panel.

**Long Rest** restores HP to full, refills spell slots, Bladesong uses, mutagen doses, and Blood Maledict uses, returns 6 hit dice (half your level, larger dice first), resets Arcane Recovery, clears every condition, removes one level of exhaustion, and drops all active toggles.

## Attunement and max HP

The Amulet of Health is attuned by default, which sets CON to 19.
Max HP is derived rather than hardcoded, so that attunement is what puts you at 99 rather than 75.
Un-attuning it in the Gear tab drops max HP back to 75 and pulls current HP down with it, and the same clamp applies when exhaustion 4 halves your maximum.

## Project layout

```
src/App.jsx          the sheet itself, with the CHAR object holding all character data
src/persistence.js   localStorage persistence, the usePersistentState hook, export/import
src/conditions.js    the 5e condition list and exhaustion table
src/index.css        design tokens, animations, responsive and print styles
scripts/             headless checks run by npm run check
```

To change anything about the character, edit the `CHAR` object near the top of `src/App.jsx`.
Stats, spells, features, and gear all come from there, and the derived numbers such as AC, spell DC, and attack bonuses are calculated from it rather than hardcoded.
