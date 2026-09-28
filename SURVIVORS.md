# Woodland Expedition

Open `survivors.html` for the five-minute expedition. The title screen also offers the short two-minute trial (`survivors.html?trial`). Existing campaign gameplay and saves remain separate.

## Starter collection and party

Cat is available initially. Completing a creature capture permanently unlocks that creature as a starter in this browser, even if the run later ends in defeat. The title's Starter button cycles through unlocked Cat, Owl, Beast, Frog, Mouse, Mole and Bear. Captures recorded in older local run histories migrate to unlocks. Storage key: `scrollmonsters-starters-v1`; no campaign currencies or upgrades are changed.

The starter replaces Cat, rather than adding a free extra creature. Upgrade choices only include creatures currently recruited. Each of two nest rounds grants one companion, for a maximum of three (the short trial grants one recruit). Destroying a nest frees its creature without choosing it, so both options can be freed safely. Stay inside a creature's ring for 2.5 seconds to commit that round's choice; leaving the ring loses progress, and pausing freezes it. Completing a capture removes other freed options from that round. Unbroken nests from the chosen round remain hostile but cannot grant another recruit. Second-round options exclude recruited creatures, pending captures, and species still available from an unchosen first round, keeping the two choices independent even when the first capture is delayed.

Support creatures are judged by party contribution, not solo damage. Creature Keeper, Patch Quest and Boneraiser Minions remain design references.

## Expedition schedule

| Time | Event |
| --- | --- |
| 0:00 | Explore and collect XP with chosen starter |
| 0:30 | First mutually exclusive habitat pair, west/east, drawn from shuffled attacker roster |
| 1:00 | Ranged hunters enter regular waves; existing/new enemies gain 20% HP and 8% chase speed |
| 1:30 | Optional shrine opens in the north; hold its circle for six seconds to summon an elite, defeat it for one level's XP; repeat up to three times |
| 2:00 | Extra roaming elite Beast appears, rewarding bonus XP |
| 2:30 | Second nest pair appears to the south: Frog (if unowned) and an unowned attacker from the run's shuffled roster |
| 3:00 | Brief lower-pressure spawn phase; another 20% enemy HP increase |
| 3:30 | Elite charging Beast appears |
| 4:30 | 480-HP Guardian arrives, using aimed shots and circular volleys |
| 5:00 | Regular waves stop. Defeat the Guardian to finish; overtime is allowed |

Spawn intervals vary by phase, with a shared living-enemy cap of 120. Nest defenders continue until their nest is destroyed, up to six per nest: Owl every five seconds, Beast every seven. Additional Cat/Frog nests use bat/owl defenders. First nests have 50 HP; second-round nests have 70. All balance values are provisional.

Shrine elites have 60/140/300 HP, 12/18/26 contact damage, 55/65/78 chase speed and 280/320/360 charge speed. Their stats are fixed per tier rather than multiplied by timed wave scaling. One challenge can be active at a time. Leaving and returning rearms the next summon; partial channel progress decays outside the circle. The first victory also heals up to 12 HP. After three victories the shrine deactivates. Later tiers are intentionally dangerous early in a run.

Nests reuse the Nature tileset stump with creature markers; the shrine uses the Dungeon tileset glowing stone altar.

## Creatures and upgrades

- **Cat:** sweeping melee attack; damage/reach upgrades and Repelling Sweep. Upgraded hits push surviving normal enemies 60 pixels away from the player and stagger them for 0.45 seconds; solid scenery stops the push. Bosses/nests stay fixed.
- **Owl:** piercing feathers; extra projectiles, splitting feathers (splinters deal 33% of current feather damage), damage, and attack speed. Hunter Marks makes other party attacks deal 25% more damage to marked targets for three seconds.
- **Beast:** charges through groups, scoring both its path and optional Quake landing area. Has visible charge trails and impacts, damage and attack-speed upgrades.
- **Frog:** grants a one-hit shield every ten seconds and a constant +10% party damage bonus while recruited. Bubble Rhythm adds 20% base shield pulse rate per rank. Bolstering Croak adds 5 percentage points to the damage bonus per rank. Rallying Chorus grants three seconds of +50% party attack speed on shield pulses, then +15 percentage points per additional rank. Chorus stacks additively with the separate +50% Frenzy pickup and affects player, Cat, Owl and Beast. Shields do not stack; the first pulse arrives one second after recruitment.

Damage/speed ranks reset each run. Owl damage gains +1 per rank; Beast gains +2 charge/+1 Quake damage. Speed intervals use base interval / (1 + 0.2 × rank). Before/after values appear on choices. XP thresholds begin 10,16,22,28…; overflow is retained. Combat pauses during upgrade selection. Healing drops remain separate, at most every 30 seconds while injured.

## Controls

WASD/arrows or touch drag to move; automatic attacks. Choose upgrades by click/tap or 1–3. P/Escape pauses; R restarts; F toggles fullscreen; Enter starts/resumes. End-of-run button returns to starter selection.

## Run history

`survivor-runs.html` reviews up to 50 local runs and exports one/all as JSON. Records include a final summary, event timeline, and compact five-second checkpoints of position, health, XP, party, damage and enemy pressure. Interrupted runs remain marked unfinished. Build `reliability-v26` uses record version 2; older records remain readable. History uses `scrollmonsters-survivor-runs-v1`; there is no server upload.

History is limited to a conservative 2 MiB serialized UTF-16 budget. Older runs are removed first, and browser quota failures retry with less history. If a single run is still too large, its oldest checkpoints and then events are trimmed while retaining the newest summary; exports and the history page report omitted telemetry. Unavailable storage leaves the previous saved history intact and displays an error. Starter unlocks remain in their separate storage key.

## Verification

The maintained current-game suite is `npm run test:survivors`. Install dependencies with `npm install` and Chromium with `npx playwright install chromium`; Python 3 is required for the local server. The runner starts and stops its own server on a free port. Set `GAME_URL` to reuse an existing server. It excludes legacy gameplay.

Individual checks default to a server on port 5174 and also accept `GAME_URL`:

- `node scripts/check-expedition.cjs` — ten-minute timeline, three-creature party, support, shrine, starter persistence, marks and boss finish.
- `node scripts/check-survivors.cjs` — short-trial movement, combat, leveling, history/export and touch regressions.
- `node scripts/check-survivor-encounters.cjs` — nest timing, exclusive captures, abilities, group targeting, growth, boss patterns and reset in the trial.
- `node scripts/check-capture-choice.cjs` — all ten capture paths, choosing after both dens are destroyed, pause/decay, independent delayed rounds, duplicate prevention, and the trial's one-recruit limit.
- `node scripts/check-survivor-reliability.cjs` — desktop/touch pause controls, history byte/count budgets, quota retries, storage failure recovery, compact checkpoints and export.
- `node scripts/check-relic-contracts.cjs` — fully modified Echo damage, rolling Resonance windows and Thunderhead hit counting.

Deterministic hooks: `render_game_to_text()` and `advanceTime(ms)`. Debug scene access requires `?test` (trial tests use `?trial&test`). Full-timeline tests use invulnerability to verify scheduling; they do not establish human difficulty or win rates.

Visual effects reuse the existing SoggySocks Combat, Earth and Water packs for hit flashes, Vortex, Beast charge/Quake, nest dust and Frog shield splashes. Cosmetic bursts share the paused combat clock and a bounded sprite pool. Run `node scripts/check-survivor-fx.cjs` to verify their animation frames and lifecycle.

- `node scripts/check-shrine.cjs` — actual split damage, three escalating summons/rewards, pause/channel/rearm/exhaustion, additional elite and scenery screenshots.

## Expanded woods and XP chests

The map is 1,920 × 1,920 (20% wider and taller), with scaled landmark positions, centered player spawn and updated companion/boss boundaries. Chests use the existing LittleTreasureChest art. First spawn attempt occurs at 20 seconds, then every 25–40 seconds, at random clear positions 260–500 pixels from the player. At most three unopened chests remain. Walk within 38 pixels to open one for 8 XP plus 2 per elapsed minute; opened art clears after 1.2 seconds. Chest rewards use normal level-up choices, and spawn/open events and XP totals appear in local run logs.

`node scripts/check-woods.cjs` covers knockback, solid obstacles, expanded boundaries, chest cap/placement/reward/cleanup/pause/reset.

## Player relics

Expedition relic rewards come from a purple guarded cache appearing at45s (approach and defeat its three Beast guards), the120s roaming elite, and shrine challenge3 alongside its XP reward. These are separate from level-up choices. Choose one of three unequipped relics while combat pauses. Two slots per run; later rewards allow replacement, returning to choices, or leaving the reward. Equipped relics, reward sources and selections are logged. Keys1–3 also select relic offers; replacement uses1–2.

- Wayfarer's Boots: moving for2s charges the next player shot for3 base damage and up to3 enemy hits. Gold ring indicates charge readiness.
- Standing Stone: standing for2s ramps player firing rate to+50%; moving resets it. Violet ring shows buildup.
- Ricochet Stone: each player shot creates at most one60%-damage bounce toward another target within180px. Bounces cannot bounce again.
- Repulsion Charm: player shots push regular enemies60px away, but player firing rate is multiplied by0.7. Bosses/nests remain fixed.
- Slipstream Cloak: passing within42px of a hostile projectile and then clearing it without contact grants+25% movement for2s. Refreshes rather than stacks.
- Bloodroot Pendant: health pickups release6 base damage within80px, plus8px per point of unused healing. Full-health pickups can be consumed for the pulse.

Effects apply to the player, not companion attacks. Relics reset on restart; regular XP chests remain unchanged. `scripts/check-relics.cjs` verifies effect behavior, reward sources, pause, replacement, queued XP, reset and portrait UI. Current build: `woodland-relics-v11`.


## Mouse, Mole and Bear

Every new species is capturable through the existing two habitat rounds and unlocks as a starter after capture. First-round attacker habitats rotate each run, excluding the starter. The second round excludes owned/pending recruits and species still offered by an unchosen first round, and prioritizes Frog if available. Three-member limit and one completed capture per round remain. Habitats use existing stump/rock art with creature tokens and burrow/mound/den labels.

- Mouse enemies: 2HP,95px/s,4 contact damage. Packs of up to6 arrive together from35s, then every22–30s until the finale, respecting120-enemy cap. Companion summons3 temporary mice every2.8s for2 damage each. Upgrades add damage, helpers, summon speed; Feeding Frenzy gives helpers a second target after a kill. Max24 living helpers,2.5s lifetime.
- Bear enemies: 28HP,32px/s,9 contact damage; one-second warning precedes a12-damage85px slam. Enter regular waves at60s, maximum3 in the regular-wave mix. Companion holds position toward nearby threats, slams for5 damage in90px every2.1s and staggers for0.35s. Upgrades add damage, area, speed and stagger; Safe Ground reduces incoming damage25% within100px of the Bear, including projectile and contact damage. It complements Frog's one-hit shields.
- Mole enemies: 12HP,40px/s; lock a58px eruption onto the player's current position with1.25s warning,9 damage. Regular waves introduce them at120s, at most2 in that mix and3 simultaneously pending hostile eruptions. Companion targets dense groups for8 damage in65px after0.7s, every2.8s. Upgrades add damage, radius, speed, one aftershock and two-second slowing terrain.

New attackers receive Frog's damage and haste support; damage totals appear in run summaries/history and end-screen ally damage. Hostile warnings are orange, friendly strike circles cyan. Bear/Mole regular spawns and Mouse packs stop for the boss finale at270s; surviving/nest Moles fire less frequently. Existing enemy counts from habitats can exceed regular-wave type limits, within the shared total cap.

`node scripts/check-creatures.cjs` covers capture/unlocks/starters/party cap, companion damage and upgrades, enemy warnings/dodging, Bear protection, Mouse packs, pause and saved unlocks. Build `woodland-creatures-v12`.

## Dash, fields, bestiary and XP display

Space or Shift (or touch Dash button) dashes in the last movement direction for0.18s at620px/s, with a3s cooldown. Dash grants no invulnerability and stops at solid scenery. The HUD shows current/required XP, next level and a gold progress bar. There is no permanent currency.

Title field selection switches Woodland/Desert. Desert uses existing sand, palms and rocks with the same current encounter layout and timing. Bestiary reveals captured creatures and their roles; uncaptured entries display???.

Guardian now chases at85px/s, fires aimed245px/s and ring165px/s attacks with1.15s recovery, and adds three ground eruptions every fourth volley with1.15s warnings. Existing explosion and fireball art animates attacks. Guardian eruptions clear on defeat. Build `expedition-expansion-v14`; `scripts/check-expansion.cjs` covers these changes.

### Ten-minute relic expansion
Standard expeditions now last ten minutes, with the Guardian arriving at9:30 (1200HP). The two-minute trial remains available. Enemy health/speed increase in fixed minute tiers after5:00; spawn intervals progressively tighten. These do not depend on the player's relic inventory.

Relics have no equipment limit and duplicates stack for the current run. Pause to view collected types/counts in one inventory screen with a Resume button. Pack Sigil rewards alternating attackers. Resonance Bell requires three distinct attackers on the same target within a rolling three-second window; triggering consumes that combination. Echo Fang repeats 40% of the fully modified creature-hit damage after a delay, without applying damage bonuses again or triggering another echo. Guardian's Drum grants shield-block party haste; Hunter's Brand rewards focused creature damage; Spite Seed produces non-chaining kill explosions; Phase Veil grants brief dash invulnerability. Creature combos and dash styles are described below.

Rewards: guarded cache at0:45, another75s after each claim; roaming relic hunter at2:00, then4:00/5:30/7:00/8:30; each shrine challenge awards a relic. Caches stay available until cleared, with no backlog of missed caches. Both biomes currently share these systems. Relics never come from XP level-ups.

### Enemy pressure tuning (v18)
Charging enemy Beasts resist knockback/stagger until their charge ends. Guardian attack frequency is doubled by halving attack phase durations (eruption warning0.575s); damage and projectile speeds are unchanged. Ordinary enemies gently separate when their bodies overlap, with45px/s maximum spacing motion. Charges, elites and committed attack telegraphs are not displaced by this spacing. Player base movement remains160.2px/s.

### Elemental creatures (v19)
The roster now contains10 capturable starter species. Salamander uses Ninja Adventure Lizard; Storm Lizard uses the black Lizard2; Spider uses SpiderRed. A standard expedition's first habitat pair always includes at least one elemental creature, except deterministic test overrides. All remain eligible for subsequent habitat choices; the existing starter-plus-two-captures party limit remains.

- Salamander: targeted fire landing after0.45s, burning every0.6s, base3damage,36radius,3s lifetime,2.6s attack interval. Level-ups improve damage/rate/duration/area and unlock spreading burns. At most6 friendly fire patches, max60radius/6s; spread-created burns do not recursively spread.
- Spider: webs last4s, slow ordinary enemies and amplify creature damage by20%. Level-ups improve vulnerability, placement rate, active count/area, and unlock a burst when3enemies enter. Base2/max4webs,42/max65radius. Bosses/charging Beasts resist web slow.
- Storm Lizard:4damage chaining to3targets within130px per jump,2s attack interval. Level-ups improve shared damage/rate and individual jumps/range. Thunderhead calls a warned strike on every third damaging lightning hit across all targets, including chained and killing hits. Shield-blocked hits, delayed strikes and Echo damage do not advance the counter. Maximum8targets/240px jump range.
- Pair combos are one-time level-up offers when both partners are recruited: Blazing Charge (Salamander+Beast fire trail); Silk Ripper (Spider+Cat swipes detonate webs in their arc); Conductive Feathers (Storm+Owl, two-target lightning from feather hits,1s cooldown); Sheltering Silk (Spider+Frog shield blocks place a web).
- Dash style button appears above Dash when a new creature is recruited. Cycle Normal/Salamander/Spider/Lightning among available companions. Salamander lays3small patches along the completed dash; Spider leaves a starting web; Storm chains lightning near the endpoint. No added invulnerability except the existing Phase Veil relic.

Hostile elemental creatures spawn only as habitat defenders. They stay near their habitat while it exists and attack players within range. Fixed-target1.1s warnings precede fire/web impacts or lightning strikes. Hostile patches are30px radius/2.5s, max2pertype; player webs slow by30%. Shared4-hazard budget includes elemental casts, patches, Mole/Bear ground strikes and Guardian eruptions. Guardian substitutes an aimed volley when there is no room for its3ground strikes. Friendly and hostile outlines use cyan and orange respectively. Neither webs nor fire change collision geometry.

### Shared party progression (v21)
Party Power adds8% base damage per rank to player and creature attacks, including later captures and their ability damage. Party Tempo adds6percentage points to the shared attack-speed bonus per rank. Individual damage/attack-speed choices are removed from offers; legacy counters are retained at zero for compatibility. Creature behaviors, areas, projectiles, combos and support upgrades remain. Spider's Brittle Silk now improves vulnerability only. Frog's party buff and shield rhythm remain support specializations. Derived relic echoes/explosions inherit source damage without applying Party Power twice.

### Exploration update (v22)
Map is2304x2304 (20% larger in each dimension). Dens occupy random clear, separated positions in both waves. Their appearance uses a brief generic notification; dens and both chest types have no text labels or offscreen locators. Capture prompts and shrine interaction information remain.
Map supplies appear near the player at35s and every45s thereafter, cycling XP Magnet, Frenzy, Cleanse; maximum3active supplies,90s lifetime. Magnet attracts all currently dropped XP. Frenzy grants12s of +50% attack speed. Cleanse removes nearby hostile ground hazards and pending ground strikes within300px; it does not damage enemies or erase distant hazards.

### Matching den defenders (v23)
Cat dens now spawn hostile Cats with warned melee swipes. Frog dens spawn hostile Frogs that protect up to3nearby ordinary enemies with a non-stacking one-hit shield every6s. All dens now spawn their own species; capture flow is unchanged.

### Opening balance pass (v25)
Expedition ordinary waves spawn at75% of their previous rate for the first two minutes, returning gradually to100% by minute four. Den defenders and scheduled encounters retain their pacing. Cat swipe, Owl feather and Beast charge/quake base damage are20% lower; attack timing and behavior upgrades are unchanged.
XP rewards start at150%, rising5percentage points per elapsed minute to200% at10minutes. Fractional XP is retained until it forms a whole point. This applies to pickups and chests; shrine rewards still grant exactly one level's XP. Level thresholds remain10 +6 per prior level. Run logs identify this pass as opening-balance-v25.
