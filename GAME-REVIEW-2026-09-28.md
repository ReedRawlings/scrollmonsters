# ScrollMonsters review — September 28, 2026

Reviewed the current working tree, including uncommitted changes. The survivor expedition is the main game; the linked rail shooter remains supported legacy gameplay. This was a review, not a gameplay patch. Three independent reviews covered combat/balance, capture/progression, and repository hygiene. Findings below separate reproduced defects from design recommendations.

The highest priorities are the hidden pause-menu controls, missing legacy combat assets, storage growth, and restoring trustworthy tests. The largest design opportunity is making recruitment a clear, deliberate decision that continues to matter throughout the run. Comments are not the main maintenance problem.

## Confirmed defects and behavior mismatches

### 1. [P1] Deleted assets make legacy enemy projectiles invisible

[game.js:33](/Users/reedrawlings/Desktop/ScrollMonsters/game.js:33) still registers 21 removed placeholder SVGs. Hostile projectiles use `enemyShot` at [game.js:2368](/Users/reedrawlings/Desktop/ScrollMonsters/game.js:2368); aiming uses `crosshair` at line 2389. Missing textures are skipped rather than replaced.

**Reproduction:** open `/legacy.html`, enter stage-six combat. Chromium recorded 21 asset 404s. One hostile projectile existed in simulation, but its texture and rendered projectile object were absent. Other missing assets include crosshair, impact, and healing art.

**Fix:** restore every still-consumed asset or replace all consumers before removing the old files. The legacy game is explicitly linked from the current title and README, so it cannot be treated as dead code.

### 2. [P2] Relic inventory clicks activate hidden pause buttons

[survivor-relics.js:54](/Users/reedrawlings/Desktop/ScrollMonsters/survivor-relics.js:54) draws the collection over the existing pause menu. The underlying Resume and Run history buttons created at [survivors.js:348](/Users/reedrawlings/Desktop/ScrollMonsters/survivors.js:348) remain interactive.

**Reproduction:** pause with relics equipped; on the 960×640 game canvas, click `(480,443)` inside the visible inventory. With all 13 relic types, this is near Phase Veil. The browser navigates to `survivor-runs.html` through the obscured button. The run is left unfinished; its checkpoint is not a resumable save.

**Fix:** render a single pause surface or disable underlying controls while the collection is displayed. Verify pointer interactions on blank inventory space as well as visible buttons.

### 3. [P2] Run history eventually stops saving new runs

[survivors.js:121](/Users/reedrawlings/Desktop/ScrollMonsters/survivors.js:121) retains 50 full telemetry records. Every five seconds, `sampleRun()` appends a complete summary and synchronously rewrites the entire history. On storage failure, it only sets an error flag; it never removes older records and retries.

**Evidence:** a minimal ten-minute record generated through the actual methods, without combat events, contained about 289,000 characters. Fifty such records require over 14 million characters. A simulated 5 MiB UTF-16 storage budget failed around the ninth additional run, preserving old history while omitting the current record. This was a quota simulation, not a measurement of the user's browser quota; exact failure timing varies.

**Fix:** keep compact checkpoints, enforce a byte budget, and retry after evicting oldest logs; consider IndexedDB for detailed telemetry. Keep starter unlocks separately. Profile serialization time before claiming a performance improvement.

### 4. [P2] Echo Fang does not echo 40% of the fully modified hit

[survivor-relics.js:35](/Users/reedrawlings/Desktop/ScrollMonsters/survivor-relics.js:35) schedules an echo before Frog, Hunter Marks, and web vulnerability are applied by [survivors.js:146](/Users/reedrawlings/Desktop/ScrollMonsters/survivors.js:146).

**Reproduction:** base-10 Cat hit with Frog, mark, and web bonuses deals 16.5 damage; its echo deals 4 instead of 6.6. The existing party-growth test currently expects the earlier, smaller calculation.

**Fix:** derive the echo from finalized damage, applying scaling once and preventing recursive procs. If pre-support damage is intentional, change the description and design contract explicitly.

### 5. [P2] Resonance Bell uses an inactivity timeout instead of a three-second window

[survivor-relics.js:29](/Users/reedrawlings/Desktop/ScrollMonsters/survivor-relics.js:29) clears collected attackers only when no hit occurred for three seconds. Continuous hits keep old contributors alive indefinitely.

**Reproduction:** Cat at 0s, Owl at 2s, Beast at 4s deals 10, 10, then 14 damage. The bonus triggers although three distinct attackers did not hit within three seconds.

**Fix:** timestamp contributors and expire entries outside the window before checking for three distinct sources.

### 6. [P2] Thunderhead's implementation differs from its description

[survivor-elements.js:33](/Users/reedrawlings/Desktop/ScrollMonsters/survivor-elements.js:33) counts `target.stormHits`. A chain that hits three different targets produces no thunder strike; each target has only one hit. The offer promises a strike every third lightning hit.

**Impact:** enemies that die within one or two hits never trigger the promised horde-clearing effect.

**Fix:** use a Storm-wide counter if the wording is intended, or describe the upgrade as repeated lightning hits on the same target. This is a behavior/description mismatch; the preferred mechanic is a design choice.

### 7. [P3] Rejected zone placement can erase a valid patch

[survivor-elements.js:25](/Users/reedrawlings/Desktop/ScrollMonsters/survivor-elements.js:25) removes the oldest friendly zone when at capacity, then checks whether the new location is blocked or outside bounds. Rejected placement therefore shrinks the active set.

**Fix:** validate the new position before evicting an existing zone. This finding follows directly from control flow; it was not a natural-play frequency measurement.

### 8. [P3] Normal enemy hit-flash state has no visible tint change

[survivors.js:293](/Users/reedrawlings/Desktop/ScrollMonsters/survivors.js:293) sets normal enemies to white tint both while flashing and while idle. White multiplicative tint leaves the source colors unchanged.

**Reproduction:** before and immediately after a hit, the sprite tint was `0xffffff`, while `flash` was correctly set to 0.1.

**Fix:** use a brief fill tint or another distinct hit treatment, then clear it. Player and Owl impact sprites already provide some feedback, but ordinary hit flashing is ineffective.

## Verification and maintenance

**The test suite currently overstates confidence.** Fourteen selected current-game browser scripts produced eight passes and six failures. Most failures are stale fixtures, not evidence of broken gameplay:

| Result | Checks | Meaning |
| --- | --- | --- |
| Pass | starter-grid, opening-balance, enemy-pressure, survivor-fx | Current title interactions, balance boundaries, pressure rules, FX lifecycle |
| Pass | elements, relic-growth, party-growth, matching-dens | Current feature regressions; these passes do not invalidate the independent interaction bugs above |
| Fail | exploration | Expects 2 XP from two pickups; v25 correctly grants 3 |
| Fail | entrypoints | Old click coordinates activate short trial instead of Legacy |
| Fail | survivors | Expects player x=978; current center/speed produce x=1312 |
| Fail | creatures | Expects removed individual Power upgrade offers |
| Fail | expedition | Expects 300-second duration instead of 600 |
| Fail | survivor-encounters | Old coordinates produce a null Beast charge plan outside current targeting range |

Both advertised npm checks also fail against the root URL: [check-phaser.cjs:12](/Users/reedrawlings/Desktop/ScrollMonsters/scripts/check-phaser.cjs:12) and [check-native-ui.cjs:12](/Users/reedrawlings/Desktop/ScrollMonsters/scripts/check-native-ui.cjs:12) expect legacy engine metadata, but the root redirects to survivors. Point them at `/legacy.html`, then expose a separate current-game npm suite.

Of 15 nonbrowser logic checks, three passed and twelve failed. Ten abort because copied VM fixtures omit `URLSearchParams`; combat-scale and player-expansion also have assertion mismatches requiring fixture review. Centralize browser/VM setup, make server URL configuration consistent, and declare Playwright as a development dependency so clean installations reproduce the checks.

All root JavaScript and top-level CJS files passed syntax checks. Separate browser probes verified capture release, partial progress, pause, completion, and starter unlock for all nine non-Cat species without page errors. Desktop and portrait screenshots were inspected; no viewport text overflow was found in the sampled states. An invulnerable ten-minute relic simulation reached victory. These are functional checks, not difficulty or win-rate validation.

The prescribed game harness ran successfully, but its screenshots were black in its default graphics configuration. Dedicated Chromium/Metal captures were inspected instead. No Wildfire crash was established; a suspected destroyed-sprite issue was tested and rejected.

**Comments and obsolete code:** existing survivor comments are sparse and mostly explain useful pooling, collision, or timing constraints. Retain those. Better cleanup targets are:

- `summonOwl()` at [survivors.js:155](/Users/reedrawlings/Desktop/ScrollMonsters/survivors.js:155), which has no production call sites, and the old wild-Owl paths. Update old tests before removing their helper dependency; retain the active captured/ally Owl behavior.
- Unreachable title instructions inside the later pause/end branch at [survivors.js:346](/Users/reedrawlings/Desktop/ScrollMonsters/survivors.js:346).
- Old individual upgrade offer construction followed by central filtering at [survivors.js:179](/Users/reedrawlings/Desktop/ScrollMonsters/survivors.js:179). Separate compatibility counters from active offer definitions; do not blindly remove saved/debug identifiers.
- The unused hit-audio preload, unused bestiary role descriptions, and very long single-line functions/tests. Format source and tests before broader refactoring, keeping behavior changes separate.
- [SURVIVORS.md](/Users/reedrawlings/Desktop/ScrollMonsters/SURVIVORS.md) contradicts itself: five versus ten minutes, 480 versus 1200 boss HP, two relic slots versus unlimited stacking, 1920 versus 2304 map width, cycling seven starters versus a ten-species grid. Consolidate a current specification; retain old changes in the development history. Roadmap inventory counts also need reconciliation.

## Spawn pressure and genre comparisons

The current ambient schedule offers roughly the following enemies per minute when capacity and placement never block it:

| Minute | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ambient enemies | 62 | 82 | 97 | 117 | 176 | 186 | 207 | 233 | 268 | 313 |

These are rate integrals rounded to whole enemies, about 1,741 total. Fixed-step timing, failed placement, the 120-enemy cap, and additional dens/swarms/elites change actual totals. Source: [survivor-expedition.js:64](/Users/reedrawlings/Desktop/ScrollMonsters/survivor-expedition.js:64) and [survivors.js:237](/Users/reedrawlings/Desktop/ScrollMonsters/survivors.js:237).

The opening ambient rate is about 0.88/s and reaches roughly 5.56/s near the end. Notable transitions include about +75% at 2:30, a relief phase at 3:00, and +110% at 3:20. Either cue these as intentional waves or smooth them. Currently they can feel like unexplained difficulty changes.

The shared cap matters more than the headline rate. In the existing stationary, invulnerable ten-minute relic scenario, only 704 enemies spawned, well below theoretical ambient opportunities. Surviving enemies occupy slots, including those away from active combat. Simply doubling rates could mostly increase capped time.

[Vampire Survivors' official description](https://store.steampowered.com/app/1794680/Vampire_Survivors/) emphasizes snowballing against hundreds of monsters and killing thousands. [Brotato's official description](https://store.steampowered.com/app/1942280/Brotato/) specifies distinct 20–90-second waves. Those support different pacing models; neither gives an apples-to-apples enemies-per-second benchmark for your smaller, recruitment-focused game. I would not claim a precise industry-average spawn rate from them.

**Recommendation:** preserve the current cap initially and test deliberate pressure/recovery phases. Reserve some capacity for ambient pursuers; define what happens to distant enemies without teleporting visible threats. Measure nearby living enemies, time to first contact, enemy health entering combat per second, kill throughput, time capped, and pressure during captures. Compare Cat, Spider, and Frog starts on both fields using human runs. Increase fodder density only if weapons clear it quickly and telegraphs stay readable; avoid raising elite/projectile pressure at the same time.

## Capturing and design gaps

**Make the choice intentional.** Destroying a den immediately consumes that round's choice before proximity capture completes. This is documented behavior, not an implementation defect. However, normal auto-targeting and AOE can choose for the player. Let destruction free the creature, then commit the choice when the player completes capture. Clearly communicate that only one option in the pair can join. Add a role and available-combo preview at the creature.

**Support exploration with discoverable clues.** Both pairs can appear across the 2304-square map with only a generic message. The previous removal of labels/locators was deliberate. If keeping that clean exploration style, use species tracks, directional calls, or a brief compass pulse instead of permanent HUD arrows. After discovering a den, retain a small map marker distinguishing available, pending, and locked choices. Record time-to-discovery and missed captures before choosing how much guidance is needed.

**Extend recruitment beyond the opening.** Rounds appear at 0:30 and 2:30, leaving no new scheduled recruitment opportunity in the remaining 7.5 minutes. Existing dens may still be found later. Test one optional rescue around 6–7 minutes offering a replacement, preserving the three-member cap. Decide how invested creature-specific upgrades transfer or refund before implementing replacement.

**Unify capture feedback.** Owl, Beast, and generic companions use separate capture paths; Cat/Frog lack the radial progress arc seen elsewhere. A shared controller should own eligibility, progress/decay, completion, unlock, and presentation. Use a consistent completion burst, chime, and portrait joining the party.

**Give support starters a credible first minute.** A controlled 20-second durable-target probe produced Cat/Owl 133.6 total damage, Storm 116, Frog 83.6 plus two shield pulses, and Spider 76. This suppressed waves and used invulnerability; it is not a tier ranking. Spider's baseline webs do no damage and amplify creature attacks but exclude the player. Before recruiting another attacker, its vulnerability upgrades offer no offensive benefit. Consider a modest innate bite, reduced-strength player amplification, or an earlier guaranteed attacker opportunity. Preserve its support identity.

**Explain and expose the build.** The title grid no longer shows movement/dash help or creature roles. Add brief first-run hints and a role preview. The relic inventory only lists names/counts; let players inspect effects, stack benefits, and key derived stats. Woodland and Desert currently share encounter structure; distinct hazards, roster weights, and objectives would give field selection gameplay meaning.

## Visual and audio feedback

The pixel art, cyan friendly outlines, orange hostile warnings, and readable major lightning effects provide a usable foundation. Prioritize feedback tied to meaningful events over more particles:

1. Fix the ineffective hit flash. Add a subtle enemy recoil or scale response for impactful hits, while keeping committed enemy attacks readable.
2. Add sound. The current survivor code loads one hit sample but contains no playback calls. Use restrained attack/impact variation, XP collection, shield break, dash-ready, capture-complete, and boss-warning cues. Rate-limit repeated sounds and provide volume controls.
3. Give capture its own payoff: a final ring pulse, brief companion pose, a chime, and a portrait entering the party. This should feel more significant than an ordinary kill.
4. Make relic combinations legible: a small distinctive Echo effect, Resonance pulse, and readable Thunderhead warning. Allow effect details in pause so players can connect visuals to their build.
5. Use small camera impulses or brief impact pauses only for major events, with reduced-motion support. Do not obscure dodging with routine shake or full-screen flashes.
6. Reduce HUD competition on portrait screens. The inspected 390×844 viewport displays the 540×820 canvas at about 72% scale, making 9–14px game text quite small. Simplify secondary text, show companion portraits/roles, and enlarge essential touch information. This is a readability recommendation, not observed text clipping.

## Suggested order

1. Repair hidden pause controls and the legacy asset regression.
2. Bound telemetry storage and restore a reliable current/legacy test baseline.
3. Resolve Echo/Resonance/Thunderhead contracts; add focused interaction regressions.
4. Consolidate documentation and format the compressed modules before structural cleanup.
5. Improve capture choice, discovery, and support-starter experience.
6. Add event-driven audio/visual feedback, then tune spawn pressure using human playtest measurements.

Review screenshots and local probe scripts are in [output/review-2026-09-28](/Users/reedrawlings/Desktop/ScrollMonsters/output/review-2026-09-28). This generated directory is gitignored. Production gameplay code was not edited during this review.
