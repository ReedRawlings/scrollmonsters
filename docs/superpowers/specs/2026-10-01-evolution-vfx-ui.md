# Creature evolution VFX and UI handoff

This brief covers the playable first test: Octopus, Reptile, Tengu and Axolotl, plus Mollusc as their new capturable ingredient. The game supplies temporary attack drawings, existing effect sheets and a functional capture selector. Reed owns the custom evolution presentation and separate bestiary UI. Values below describe the prototype unless explicitly marked as proposed art direction.

## Scope and recipes

| Captured pair, in either order | Evolution | Added party maximum HP and immediate healing | Other party benefit |
| --- | --- | --- | --- |
| Cat and Mollusc | Octopus | 8 | 15% more damage against slowed targets |
| Salamander and Beast | Reptile | 12 | 6% more party damage |
| Owl and Storm Lizard | Tengu | 4 | 6% more party attack speed |
| Frog and Mollusc | Axolotl | 12 | 10% incoming damage reduction; retains Frog's flat +1 hit damage and purchased Chorus |

Base creatures currently do not add maximum HP individually. These are evolution bonuses on top of the existing 40 HP and Tough Hide upgrades. A full per-base HP contribution system remains outside this first test. All values need playtesting.

The prototype adds one base creature, for eleven playable bases. Bamboo remains the planned twelfth. There are no second-stage fusions or duplicate evolved species within a party.

## Capture and evolution UI

After the existing 2.5-second capture channel, combat pauses if there is a valid recipe or the party is full. Show every eligible fusion involving the newly captured creature and one existing teammate. Otherwise an ordinary capture with space completes as before.

Each fusion option needs both parent portraits and names, the result portrait and name, an ability summary, the added HP and role bonus, and inherited upgrades. Explain that the existing teammate is replaced and the captured creature is consumed. A capture fusion preserves the team's occupied slot count; it does not remove two already recruited teammates in this first implementation.

Offer Recruit when there is space. Offer Leave creature in every choice screen, including a full party with no recipe. Leaving resolves the den's choice without modifying the team. Completing the capture unlocks the base species even if it is immediately merged or left. Capture commits one choice for that den round and dismisses other released choices from the round.

Keep the three-creature cap. Do not allow an evolved creature to become a fusion ingredient. Keep movement, damage, cooldowns, capture progress, XP choice processing and attack effects paused while selecting. Prevent the capture's final input from confirming a choice: the placeholder locks input for 370 ms. Support keyboard 1–3 and touch; do not rely on hover. Escape does not silently select or discard a creature.

The current selector commits immediately when an option is selected. A future animated reveal may hold combat after this transaction; the animation must not grant stats, trigger capture again or repeat the merge. Allow skipping an animation without skipping the committed result. Reduced-motion presentation should use a short fade and clear result text instead of shaking, spinning or repeated flashes.

## Proposed evolution sequence

These timings are art recommendations, not a required delay in the prototype.

| Moment | Duration | Required visual |
| --- | --- | --- |
| Selection confirmation | 100–150 ms | Highlight the chosen recipe; dim other choices |
| Parent convergence | 250–350 ms | Both portraits or silhouettes move toward a shared center; two trails preserve their colors |
| Fusion core | 150–250 ms | Compact pulse or cocoon conceals the transition |
| Result reveal | 250–350 ms | Result silhouette fills, followed by a single burst and expanding ring |
| Stat acknowledgement | 350–500 ms | Evolution name, HP and role bonus appear; inherited upgrades remain readable |
| Party placement | 250–400 ms | Result portrait moves into the replaced party slot; that slot flashes once |

Recommended reusable assets: Merge_Trail, Merge_Core, Merge_Reveal, Merge_Ring, Evolved_Slot_Glow and Recipe_Discovered. The effect can be shared across all four results using tint and silhouette. A separate final-form animation is unnecessary for this test.

Keep battlefield effects separate from screen-space effects. UI portraits must use the full 38×38 faceset rather than a cropped sprite frame. The creature sheets use 16×16 frames except Tengu, which uses 16×28. Match the existing nearest-neighbor pixel rendering.

## Ability effect inventory

All ranges below are world pixels, not source image dimensions. Export effects with padding and a documented origin so the renderer can scale the visible portion to the actual hit area.

| Creature | Effect needed | Gameplay timing and geometry | Current substitute |
| --- | --- | --- | --- |
| Mollusc | Ink landing splat and puddle loop | Base radius 44; 3-second life; damage immediately and each second; slows ordinary enemies | Purple translucent disk with an outlined edge |
| Octopus | Directional tentacle sweep | Base radius 140; roughly 160-degree forward arc; 0.3-second visual | Purple arc |
| Octopus | Rear sweep variant | Backhand Sweep adds the matching arc behind; reuse and rotate the forward effect | Second purple arc |
| Octopus | Ink splat and puddle | Base radius 48; pool placed along each sweep; 3-second life | Shared ink disk |
| Octopus | Inked-hit accent | Squeezing Grip boosts tentacle damage against inked targets | Ordinary damage numbers |
| Reptile | Charge start and movement trail | Up to 245 units at 430 units/second; trail segments every 0.12 seconds | Existing movement plus orange disks |
| Reptile | Burning ground loop | Base radius 30; 3-second life; ticks every 0.6 seconds | Orange translucent disk |
| Reptile | Heavy bite impact | Charge endpoint; radius 70; short 0.4-second accent | Existing earth impact tinted orange |
| Reptile | Burning-target detonation | Explosive Bite splashes nearby targets within 75 units | Damage behavior only; new art needed |
| Reptile | Second-charge cue | Double Charge adds one shorter charge, at most 130 units | Same temporary fire trail |
| Tengu | Charged feather projectile | 380 units/second; 1.3-second life; pierces up to three targets | Existing feather tinted cyan |
| Tengu | Lightning connection and contact spark | Links to nearby enemies on feather impacts; base jump range 130; link visible 0.25 seconds | Straight cyan links |
| Tengu | Thunder warning and strike | Purchased or inherited thunder upgrade; every third volley; radius 60; 0.65-second warning | Cyan circle, then existing thunder sheet |
| Axolotl | Protective bubble or shield pulse | Base pulse interval 8 seconds; one shared, non-stacking shield | Existing water impact and player shield ring |
| Axolotl | Bubble break and ink ring | On a blocked hit; base radius 100; 0.45-second expanding ring, then ink pool | Purple expanding ring and ink disk |
| Axolotl | Rally accent | Bubble Rally grants 3 seconds of +30% party speed after a block | Stat behavior only; new art needed |

Mollusc and Axolotl also place ink on their attack cycle. The temporary version places the pool immediately; a cosmetic traveling spit must not introduce an undocumented damage delay.

The evolved dash uses the same visual vocabulary: Octopus sweeps at the endpoint; Reptile leaves three fire patches along the route; Tengu chains lightning near the endpoint; Axolotl grants a shield and places ink. Mollusc places ink at the endpoint. Reuse these effects rather than commissioning separate dash sheets.

## Effect delivery and readability

Suggested deliverable for each effect: transparent PNG sheet plus frame width, frame height, frame count, frames per second, looping flag, anchor and intended visible diameter. Use deterministic frame order and untrimmed cells. Export start, loop and end separately when a pool's lifetime varies.

Distinguish friendly ink/fire from orange hostile warnings with both shape and color. Persistent pools should remain translucent enough to read approaching attacks. Attack flashes belong above actors; pools belong beneath them in final presentation. Avoid full-screen white flashes. Do not let visual variation change damage timing or targeting.

Use bounded pools: the current implementation caps each creature's ground effects at eight, Tengu projectiles at forty, lightning links at sixty-four, and delayed strikes at eight. Multiple projectiles can hit the same target, so contact sparks need coalescing or a small visual budget. All world effects should freeze with combat and clear on restart.

The fifteen new upgrade cards currently borrow existing icons. Custom icons are useful for Mollusc's three upgrades and the three upgrades on each evolution, but are not required to test the mechanics.

## Integration contract

`SurvivorEvolution.recipes` contains the four implemented recipes. `scene.creatures.evolution.catalog()` returns their descriptions, party bonuses, upgrades, discovery state and whether the current party owns an ingredient. `available` means an ingredient is owned; it does not mean the player can merge immediately. The only actionable choices come from the pending capture.

`scene.creatures.evolution.preview()` returns the pending captured species, `canRecruit`, eligible recipe IDs, partner IDs and inherited upgrade ranks. It returns null outside a capture choice. `choose(recipeId)`, `choose('recruit')` and `choose('leave')` perform the guarded transaction and return whether it succeeded. A repeated call after resolution returns false.

Use `scene.events.on('reward', callback)` for presentation. The event's `kind` identifies:

- `mergeoffer`: capture preview data, emitted when the selector opens.
- `merge`: emitted once after the transaction. Includes `parents`, `result`, `inherited`, `partyBonus`, `x` and `y`.
- `abilityfx`: selected accents for Octopus sweep, Reptile bite, Axolotl shield and shield break. Includes creature, effect, position and relevant radius/angle.

Continuous effects are exposed through the evolution object's `zones`, `projectiles`, `links`, `casts` and `fx` collections. These contain gameplay state; presentation should read them without mutating them. Additional presentation events can be added when final effects are integrated.

Discovery is saved separately under `scrollmonsters-evolutions-v1`. Evolved forms never enter the starter unlock list. `render_game_to_text` exposes evolution state inside `creatures.evolution`; individual evolved stats are in `creatures.allies`. Restart resets run bonuses and effects while preserving recipe discoveries.

## Upgrade inheritance

Purchased ranks are copied onto the evolution and removed from the consumed species' run upgrade counters, so reacquiring a parent does not duplicate that investment. Whole-party upgrades remain in place.

| Evolution | Inherited behavior |
| --- | --- |
| Octopus | Cat damage, sweep reach/arc and knockback; Mollusc ink damage, area and life; Silk Ripper continues to burst friendly webs |
| Reptile | Beast charge damage, speed and Quake; Salamander fire damage, attack speed, area, life and Wildfire; Blazing Charge becomes stronger trail damage |
| Tengu | Owl damage, speed, feather count, splinters and marks; Storm damage, speed, chain count/range and thunder strikes; Conductive Feathers strengthens chained damage |
| Axolotl | Frog pulse speed and Chorus; Mollusc damage, area and life; Sheltering Silk still places a web when Spider is present |

Old Frog Power ranks have no active effect, consistent with the existing removal of that upgrade. Tengu converts the old hit-count thunder trigger into the evolution's every-third-volley trigger. Unique evolution upgrades become available from level-ups and packs; consumed parents' choices stop appearing.

## Twenty minute run

The Guardian appears once at 9:30. While a boss is active, ambient waves slow to one spawn attempt every 2.4 seconds and den defenders tick at 15% speed. Extra mouse swarms and new ambient specialists/elites are suppressed. Existing enemies remain in the world. After the first boss dies, its pack drops and pressure resumes following a ten-second grace period.

The Ancient Guardian appears at 19:00 with a separate creature skin, 4,000 HP, wider aimed volleys and denser ring volleys. The test ends when it dies; the displayed target duration is 20:00. If it survives past 20:00, the fight continues while ordinary ambient spawns stop. If the first Guardian is still alive at 19:00, it retreats without a defeat reward before the final boss appears, keeping only one boss active.

Additional den rounds become eligible at 5:30, 8:00, 11:30, 14:00 and 16:30. They favor compatible ingredients, wait while bosses are active, and wait for room when four unbroken dens already exist. Existing 0:30 and 2:30 recruitment rounds remain. Later HP, damage and wave tuning needs human playtesting with evolved parties.

## Future roster decisions

These are approved directions to retain for the later roster pass, not implemented recipes in this test:

- Frog + Mouse → Heart.
- Storm Lizard + Salamander → Kappa, replacing the second Reptile option.
- Cat + Spider → Cyclope from `Actor/Monsters/Cyclope`.
- Beast + Bear → MonkeyBoxerBlue from `Actor/Monsters/Feral/Tier3/MonkeyBoxerBlue`.
- Bear + Bamboo → Panda; Bamboo + Mole → Mushroom.
- Mouse + Owl → Spirit; Mole + Spider → Trapdoor Spider.

All player companions should remain creature focused. There is no Gladiator evolution. The future bestiary should be separate from starter selection, show possible combinations and undiscovered forms, and distinguish discovering a recipe from unlocking a base starter. Final bestiary layout, custom merge animation and commissioned ability VFX remain Reed's presentation work.
