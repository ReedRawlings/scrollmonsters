# Woodland Expedition

Open `survivors.html` for the five-minute expedition. The title screen also offers the short two-minute trial (`survivors.html?trial`). Existing campaign gameplay and saves remain separate.

## Starter collection and party

Cat is available initially. Completing a creature capture permanently unlocks that creature as a starter in this browser, even if the run later ends in defeat. The title's Starter button cycles through unlocked Cat, Owl, Beast, Frog, Mouse, Mole and Bear. Captures recorded in older local run histories migrate to unlocks. Storage key: `scrollmonsters-starters-v1`; no campaign currencies or upgrades are changed.

The starter replaces Cat, rather than adding a free extra creature. Upgrade choices only include creatures currently recruited. Each of two nest rounds grants one companion, for a maximum of three. Destroying a nest locks that round's choice, then releases a creature for 2.5 seconds of proximity capture. Other nests remain hostile but cannot grant that round's second recruit. Options exclude already recruited or pending creatures.

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

`survivor-runs.html` reviews the last 50 local runs and exports one/all as JSON. Records include mode, starter, party, phase, upgrades, incoming damage, creature damage, shield activity, shrine completion, nest choices, boss events and five-second checkpoints. Interrupted runs remain marked unfinished. Build `woodland-creatures-v12` distinguishes the new expedition. History uses `scrollmonsters-survivor-runs-v1`; there is no server upload.

## Verification

With a server on port 5174:

- `node scripts/check-expedition.cjs` — five-minute timeline, three-creature party, support, shrine, starter persistence/migration/UI, marks, boss finish, mobile start.
- `node scripts/check-survivors.cjs` — short-trial movement, combat, leveling, history/export and touch regressions.
- `node scripts/check-survivor-encounters.cjs` — nest timing, exclusive captures, abilities, group targeting, growth, boss patterns and reset in the trial.

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

Every new species is capturable through the existing two habitat rounds and unlocks as a starter after capture. First-round attacker habitats rotate each run, excluding the starter. The second round excludes owned/pending recruits and prioritizes Frog if unowned. Three-member limit and one recruit per round remain. Habitats use existing stump/rock art with creature tokens and burrow/mound/den labels.

- Mouse enemies: 2HP,95px/s,4 contact damage. Packs of up to6 arrive together from35s, then every22–30s until the finale, respecting120-enemy cap. Companion summons3 temporary mice every2.8s for2 damage each. Upgrades add damage, helpers, summon speed; Feeding Frenzy gives helpers a second target after a kill. Max24 living helpers,2.5s lifetime.
- Bear enemies: 28HP,32px/s,9 contact damage; one-second warning precedes a12-damage85px slam. Enter regular waves at60s, maximum3 in the regular-wave mix. Companion holds position toward nearby threats, slams for5 damage in90px every2.1s and staggers for0.35s. Upgrades add damage, area, speed and stagger; Safe Ground reduces incoming damage25% within100px of the Bear, including projectile and contact damage. It complements Frog's one-hit shields.
- Mole enemies: 12HP,40px/s; lock a58px eruption onto the player's current position with1.25s warning,9 damage. Regular waves introduce them at120s, at most2 in that mix and3 simultaneously pending hostile eruptions. Companion targets dense groups for8 damage in65px after0.7s, every2.8s. Upgrades add damage, radius, speed, one aftershock and two-second slowing terrain.

New attackers receive Frog's damage and haste support; damage totals appear in run summaries/history and end-screen ally damage. Hostile warnings are orange, friendly strike circles cyan. Bear/Mole regular spawns and Mouse packs stop for the boss finale at270s; surviving/nest Moles fire less frequently. Existing enemy counts from habitats can exceed regular-wave type limits, within the shared total cap.

`node scripts/check-creatures.cjs` covers capture/unlocks/starters/party cap, companion damage and upgrades, enemy warnings/dodging, Bear protection, Mouse packs, pause and saved unlocks. Build `woodland-creatures-v12`.

## Dash, fields, bestiary and XP display

Space or Shift (or touch Dash button) dashes in the last movement direction for0.18s at620px/s, with a3s cooldown. Dash grants no invulnerability and stops at solid scenery. The HUD shows current/required XP, next level and a gold progress bar. There is no permanent currency.

Title field selection switches Woodland/Desert. Desert uses existing sand, palms and rocks with the same current encounter layout and timing. Bestiary reveals captured creatures and their roles; uncaptured entries display???.

Guardian now chases at85px/s, fires aimed245px/s and ring165px/s attacks with1.15s recovery, and adds three ground eruptions every fourth volley with1.15s warnings. Existing explosion and fireball art animates attacks. Guardian eruptions clear on defeat. Build `expedition-expansion-v14`; `scripts/check-expansion.cjs` covers these changes.
