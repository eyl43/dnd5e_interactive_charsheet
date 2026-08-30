# DND 5e Interactive Character Sheet

An interactive character sheet for Dr. Lucien Harrow, a Blood Hunter (Mutant) 7 / Bladesinger Wizard 7, character level 14.
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

What persists: current and temp HP, conditions, exhaustion, concentration, death saves, hit dice, spell slots, Bladesong and Blood Maledict uses, mutagen doses, active mutagens, attuned items, the buff toggles, the weapon form, the chosen fifth mutagen formula, bullet count, Arcane Recovery, and every lore field.
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
- Hit dice are tracked as two pools, 7d8 from Blood Hunter and 7d6 from Wizard.
- Death saves appear on their own once you drop to 0 HP, and disappear when you are healed.

The status panel tracks all fourteen conditions, plus exhaustion and concentration.

- Conditions are click-to-toggle, and each one shows its rules text on hover.
- Poisoned is marked immune and cannot be toggled, since Strange Metabolism rules it out.
- Exhaustion is applied for real: level 2 halves speed, level 4 halves your HP maximum, level 5 drops speed to 0.
- Concentration tracks what you are concentrating on and shows your save bonus, including the Bladesong INT bonus.
- Taking damage while concentrating raises the concentration check with its DC already worked out.
- Becoming incapacitated warns you that Bladesong ends.

## Buff toggles

The buttons under the header are the buffs that change your numbers, and every toggle recalculates the sheet live.

| Toggle | What it applies |
| --- | --- |
| Bladesong | +INT to AC, +10 ft speed, advantage on Acrobatics, +INT to concentration saves |
| Eldritch Maul | +5 ft reach and +1d6 force on melee attacks, shown on the weapon cards |
| Shield | +5 AC |
| Haste | Speed doubled, +2 AC, advantage on DEX saving throws, one extra limited action |
| Greater Invisibility | Advantage on your attacks, disadvantage on attacks against you |
| Fire Shield | Warm resists cold and burns attackers for 2d8 fire, chill resists fire and freezes them for 2d8 cold |

Haste and Greater Invisibility are both concentration spells, so the sheet wires them together.
Starting either one ends the other, and losing concentration ends both.
Fire Shield needs no concentration and runs alongside anything.
Dropping Haste, whether deliberately or by losing concentration, raises the lethargy reminder, since you cannot move or act until after your next turn.

Order of operations for speed: the Bladesong bonus applies first, then Haste doubles the total, then exhaustion halves it.
So Bladesong plus Haste is (30 + 10) x 2 = 80 ft.

## Mutagens

Formulas follow the current Order of the Mutant text, where side effects impose disadvantage rather than draining ability scores.
Celerity is +3 DEX with disadvantage on WIS saves, Sagacity is +3 INT with disadvantage on CHA saves, and Rapidity is +10 ft speed with disadvantage on INT checks.
Reconstruction is the one whose side effect is still a hard number, at -10 ft of speed.

Blood Hunter 7 knows five formulas and concocts two mutagens per rest.
The first four are fixed in the `CHAR` object; the fifth is chosen in the Features tab from the full catalogue of twenty formulas and saved with the rest of the sheet.
Formulas marked with a green diamond grant damage resistance, which is the only on-demand resistance this character has.

Strange Metabolism carries a second ability beyond poison immunity: once per long rest, a bonus action negates the side effect of one mutagen affecting you for 1 minute.
The control sits under the mutagen toggles and offers one button per active mutagen.
A negated side effect is struck through wherever it appears, and where the side effect is a real number, such as Reconstruction's speed penalty, the sheet adds the movement back.

## Weapon forms

The Scythe Whip card has a Scythe / Whip toggle, since transforming it is a bonus action you take mid-fight.
Scythe form is 1d8 at 5 ft, whip form is 1d4 at 10 ft, and Eldritch Maul adds 5 ft on top of whichever form is active.
The card always shows the active form's damage and reach up top, with the other form listed below so you can see the trade before you switch.

## Always-visible panels

Skills sit above the tab bar rather than inside the Combat tab, so they stay readable whichever tab you are on.
The same is true of HP, the buff toggles, the stat blocks, quick stats, and the status panel.
Only weapons, spells, features, gear, and lore are behind tabs.

## Rests

**Short Rest** ends Bladesong, Shield, and concentration, and restores both Blood Maledict uses.
Spend hit dice yourself from the health panel.

**Long Rest** restores HP to full, refills spell slots, Bladesong uses, mutagen doses, and Blood Maledict uses, returns 7 hit dice (half your level, larger dice first), resets Arcane Recovery, clears every condition, removes one level of exhaustion, and drops all active toggles.

## Attunement and max HP

The Amulet of Health is attuned by default, which sets CON to 19.
Max HP is derived rather than hardcoded, so that attunement is what puts you at 115 rather than 87.
Un-attuning it in the Gear tab drops max HP back to 87 and pulls current HP down with it, and the same clamp applies when exhaustion 4 halves your maximum.

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

## Levelling up

`BLOOD_HUNTER_LEVEL` and `WIZARD_LEVEL`, declared just above `CHAR`, are the single source of truth for anything that scales with level.
Character level, proficiency bonus, the hit dice pools, Bladesong uses, and Arcane Recovery are all computed from them.

So a level-up is: bump the class level, add the rolled hit points to `hp.baseHpFromDice` and `hp.current`, add any new spells and features, and adjust the spell slot counts.
The Combat tab's attack routine computes itself from whatever toggles are active, so damage numbers never need updating by hand.
