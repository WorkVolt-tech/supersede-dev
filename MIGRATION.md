# SuperSede → Vite/React/Cloudflare migration

## What's built so far

**Ported unchanged from the vanilla game (zero DOM coupling, verified):**
`src/game/classCombat.js`, `enemyAI.js`, `elementalBonuses.js`, `elementalKeystones.js`,
`reputation.js`, `skillsRegistry.js`, `leveling.js`, `classes.js`, `elementsTree.js`.
Pure functions, same inputs/outputs as the original. `src/data/ch1/` is Ch1's
real node/config/item data, also unchanged.

**Core engine (new):**
- `src/lib/supabaseClient.js` — Supabase client via Vite env vars
- `src/store/usePlayerStore.js`, `useInventoryStore.js` — Zustand stores
- `src/hooks/useStoryEngine.js` — chapter-agnostic story navigation (replaces
  three near-duplicate `goTo()` implementations)
- `src/components/story/StoryNode.jsx`, `ChoiceList.jsx` — real JSX instead
  of `innerHTML` templating

**Puzzle system:**
- `src/components/puzzle/DragPuzzle.jsx` — generic, config-driven drag-tile
  puzzle (Framer Motion spring physics). New puzzles = new config, not new
  code. `src/data/ch3/keypadPuzzle.js` is real Ch3 content (the cipher
  puzzle), reworked from text-input to drag tiles.

**Inventory:**
- `src/components/inventory/InventoryScreen.jsx` — drag items onto equipment
  slots to equip, drag back out to unequip. Equip rules (slot `accepts`
  lists, two-handed weapons clearing offhand) ported exactly from the
  vanilla `inventory.js`, now in `src/store/useInventoryStore.js`.

**Vehicle drive:**
- `src/components/vehicle/VehicleCanvas.jsx` — canvas-based (kept canvas on
  purpose — better performance than DOM sprites for a shooter with many
  moving entities). Movement patterns (zigzag/dive/swarm/straight) and the
  Hunter Captain boss trigger ported from `vehicle2.js`'s exact math.
- Sprite system: `src/game/spriteManifest.js` + `src/hooks/useSprites.js` +
  `src/game/drawSprite.js`. Drop a PNG/WEBP at the paths listed in
  `public/sprites/README.md` and it's used automatically — falls back to
  simple drawn shapes for anything not provided yet.

**Darkest Dungeon-style combat (new):**
- `src/game/formation.js` — pure rank/formation logic: rank-restricted
  skill usability and targeting, position-shifting (push/shove), a
  speed-based turn order queue recomputed each round.
- `src/components/combat/Formation.jsx`, `TurnQueue.jsx` — ranked rows for
  both sides, drag-to-reposition your own party, legal-target highlighting
  when a skill is selected.
- `src/pages/CombatDemoPage.jsx` — proves the whole loop: rank-gated
  skills, rank-gated targeting, a shove/position-shift skill, and real
  turn progression.
- Deliberately decoupled from *who* is in your formation — solo hero +
  temporary story ally works today; a future multiplayer "borrow another
  player's character" system is a separate, much larger undertaking
  (needs real backend sync) and hasn't been started.

## Demo pages

`src/App.jsx` currently renders whichever demo was built most recently.
Swap the import to try a different one:
- `pages/ChapterPage.jsx` — real story navigation using Ch1 content (needs a real Supabase player)
- `pages/PuzzleDemoPage.jsx` — the drag-tile cipher puzzle
- `pages/InventoryDemoPage.jsx` — drag-and-drop equip (mock items, no account needed)
- `pages/CombatDemoPage.jsx` — DD-style ranked combat (mock party, no account needed)

## Chapter 2 — now wired up

- `src/data/ch2/` — nodes, config, items, and all 10 zone-*.js files, ported
  unchanged.
- `src/components/combat/CombatScreen.jsx` — the real single-enemy combat
  screen (was the single biggest missing piece). Wires the already-ported
  `classCombat.js` hooks (onCombatStart/onPlayerAttack/onPlayerHit/
  onActiveSkill/onTurnEnd/onKill/onCombatEnd) and `enemyAI.js`'s
  resolveEnemyTurn/initEnemyState dispatcher to real React state. This is
  what makes Ch1's combat nodes, Ch2's 9 fights, AND the Twin Judges boss
  (via its bespoke 7-scenario AI in enemyAI.js) all actually playable —
  same component for all of them.
- `src/components/hub/DistrictHubCh2.jsx` — the 10-zone hub. Same open
  question as the vanilla build: no real lock condition exists in the
  data, so all zones are open from the start.
- `src/pages/Ch2ChapterPage.jsx` — ties it together: elements-attempted
  tracking (new state, written on first zone entry), and computes
  `judgeCtx` (moral score + elements attempted) for the Twin Judges fight.
- `src/components/story/StoryNode.jsx` now dispatches `combat`/`boss`/`end`
  node types to CombatScreen, not just story choices — this also makes
  Ch1's existing combat nodes work for the first time in the React build.
- `src/components/story/ChoiceList.jsx` now gates choices with `requires`
  (Ch2's "hand over 2 medical packs" style choices), checking real
  inventory via `useInventoryStore`.
- `route()` node support (for `pre_boss_gate`) and alliance-tag tracking
  were already generic in `useStoryEngine.js` from earlier work — no
  changes needed there.

**Worth knowing:** CombatScreen calls every classCombat.js hook, but I
verified each hook's actual return shape while wiring this (a couple
didn't match my first guess — `onPlayerHit` returns `dmgMult`/
`reflectAmount`, not a flat damage number; `onTurnEnd` returns
`damageToEnemy`/`healToPlayer` for DoT/regen, not a dbUpdates object) and
corrected those. It's a real, working v1 — not yet verified against every
one of the ~2,250 lines of class-specific logic Ch1's old engine had
spread across its UI, so specific class skills are worth play-testing
individually rather than assumed fully correct.

## What's not built yet

1. `combat-fx.js`/`avatar.js` — these do touch the DOM directly in the
   vanilla version; need a small React wrapper (likely a ref-based
   imperative escape hatch). CombatScreen works without them, just with
   less visual flair (no particle/hit-flash FX yet).
2. Real auth + routing (React Router) — garage/book/vehicle-drive pages
   aren't connected yet; `App.jsx` currently hardcodes which page loads.
3. Ch3 data/chapter-specific logic (the other puzzle types, class-mirror).
4. Multiplayer pawn-borrowing for the DD party system.
5. Book page-flip transition between chapters.
6. Spare/Execute branching for Ch2's villain-path fight (Tam).
7. Code-splitting — bundle is one large chunk; fine for now, worth
   splitting by route once more chapters are in.

## Deploying (GitHub → Cloudflare Pages, no terminal)

1. Unzip this project. Upload its contents to a new GitHub repo via the
   web UI (repo page → "uploading an existing file" → drag the folder in).
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git
   → pick the repo.
3. Build command: `npm run build`. Output directory: `dist`.
4. Add environment variables before deploying: `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (same values as `.env.local`).
5. Save and Deploy. Future updates: re-upload changed files to GitHub the
   same way — Cloudflare rebuilds automatically.
