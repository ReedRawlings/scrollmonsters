# Progress log

Survivor-game log, newest at the bottom. Entries for the original campaign (September 9–15) are in [_archive/progress-legacy-campaign.md](_archive/progress-legacy-campaign.md).

## September 19 — survivor Step 1: Woodland Trial

- User correction adopted: creatures earn a slot by party contribution. Support, survivability, and ability augmentation are valid; solo damage or standalone viability is not required.
- Added isolated survivors.html / survivors.js using Phaser and current assets. Two-minute woodland arena, keyboard/touch movement, automatic player shots, Cat route following and sweep, bats, telegraphed Beast charges, solid obstacles, healing drops, rising pressure, pause/restart and results.
- Documented scope and next party-role experiment in SURVIVORS.md; linked from README. Campaign logic and saves remain untouched.
- Verification: supplied web-game client completed deterministic movement; its canvas export was black on this Mac, so visually inspected native browser screenshots from Metal-backed Playwright instead (title, combat, portrait). Improved panel contrast and modal padding after inspection.
- Focused browser checks passed: movement, Cat damage/following, obstacle collision, pause, charge/damage, win/loss/reset, campaign-save isolation, portrait touch drag and release; no browser errors. Keyboard test uses held input to avoid event timing races. Full moving run reached 120 seconds with 92 defeats, 10 HP, and 187 Cat damage. This is a reproducible smoke test, not a difficulty assessment.
- JavaScript syntax and diff whitespace checks passed. Preview at localhost:5174/survivors.html. No deployment.
- Next: human playtest responsiveness/readability/companion presence, then compare a support creature and ability modifier with Cat before adding recruitment and progression.

## September 19 — Owl capture and basic power-ups

- User playtest: 162 defeats; deliberately grouped enemies for Cat's sweep. Requested 40 starting HP, a second attacker captured during play, and basic power-ups.
- Set starting/max HP to 40. At 25s, an 18-HP wild Owl appears near the player; automatic attacks weaken rather than kill it. Capture by staying within its visible ring for 2.5s while combat continues. Leaving drains progress; pause freezes it. Ally Owl fires 4-damage feathers piercing up to three enemies, with its own result damage counter.
- Every eight defeats rotates healing (+8 capped at 40), Frenzy (50% faster party attacks for 12s), Shield (one blocked hit). Pickups last 25s, refresh rather than stack, have distinct icons/labels, and reset with the run. Reused existing Owl, feather, heart and scroll art; shield icon uses Phaser graphics.
- Browser checks passed for natural automatic weakening/capture, capture pause/decay, piercing multiple enemies, health cap, shield consumption/invulnerability, Frenzy expiry and reset, plus previous movement/combat/pause/restart/save-isolation/touch checks. No browser errors. Inspected desktop capture and portrait screenshots; enlarged/replaced tiny heart icon and distinguished pickups.
- Required skill harness run in headed and headless modes; state correct, canvas export remains black on this Mac. Metal browser full-page screenshots verify rendered playfield and new features. Syntax and whitespace checks passed.
- Next playtest: capture readability/difficulty amid enemies and power-up frequency. Party support roles remain valid future additions; no solo viability requirement.

## September 19 — spaced power-up opportunities

- Implemented requested replacement of kill-count power drops: one marked enemy at 40s, 70s, and 100s, awarding Frenzy, Shield, and Frenzy respectively only upon defeat. Existing nearby enemy is marked, or a Beast spawns nearby; gold ring and bounty label identify the target.
- Healing separated: injured player can receive an +8 HP drop from a defeat at most every 30 seconds, starting at 30s. Full health does not generate healing drops.
- Owl capture remains at 25s and verified end to end, including natural automatic weakening, capture progress/decay/pause, recruitment, and piercing damage.
- Browser regression passed: 162 kills produce no power-up drops; exact three event thresholds, no duplicate events, earned rewards, healing throttle, reset and pause. Existing combat, 40 HP, pickup effects, save isolation, and touch checks pass with no browser errors. Inspected bounty screenshot. Required interaction harness completed; existing Mac canvas export limitation covered by Metal screenshots.

## September 19 — XP, run upgrades, and minute-one scaling

- Replaced scheduled reward enemies with persistent XP drops from defeats. XP attracts within 100 pixels and collecting thresholds 10,16,22,28,34,40… pauses combat for three unique upgrade choices. Overflow retained; upgrades reset each run. Six upgrades require 150 collected XP (target pacing, not guaranteed).
- Added Cat damage +1, Cat reach +20%/wider arc with larger slash visual, basic attack speed +20%, +8 maximum/current HP, movement +10%, and +1 Owl projectile. Owl upgrade only eligible after capture. Choice supports buttons/touch and 1–3 keys.
- At 60 seconds existing/future enemies gain 20% HP and 8% chase speed once, preserving current health ratio. Damage and charge timing unchanged. Owl encounter and occasional healing retained.
- Tests passed: natural XP drop/collect/level flow, three choices, time freeze, keyboard/touch selection, upgrade application, Owl eligibility, scaling threshold/current and future enemy stats/no repeat, reset, prior capture/combat/save/touch regressions. Fixed Phaser number-key event names and fixed-screen button hit areas revealed by these tests. Inspected desktop and portrait upgrade screenshots; no browser errors. Skill interaction harness run; syntax and whitespace checks pass.
- Next: human playtest level frequency and strength curve with real XP collection; tune thresholds/scaling from that feedback. Support creatures remain valid party roles.

## September 19 — local run review

- Added automatic local recording with independent survivor history key, latest 50 runs, version/build labels, start/update timestamps and IDs. Stores outcomes including restart, summary stats, upgrades offered/chosen, Owl events, incoming damage positions, healing, minute-one scaling and five-second snapshots. Saves at milestones, checkpoints and page exit; unfinished runs remain reviewable. Storage failure is surfaced in game.
- Added survivor-runs.html review page with safe text rendering, event timelines, checkpoint details, per-run and all-run JSON exports. Linked from title/pause/result menus. No external telemetry or campaign-save writes.
- Verification passed: persisted loss/restart, upgrade and damage events, checkpoints, history rendering and JSON download, plus full prior gameplay/touch suite. Inspected history screenshot; required game harness completed. Syntax/whitespace checks pass.

## September 19 — increase enemy density

- User cleared again with 166 defeats and felt spawn supply was low. Increased spawn curve .8→.5s in minute one and .5→.25s in minute two; raised living cap 90→120. Existing minute-one strength and XP tuning retained for comparison.
- Added run summary/review metrics: total spawned, alive at end, peak alive, and seconds at spawn cap. Build woodland-density-v2 distinguishes logs; older records display not recorded.
- Controlled spawn test yielded 255 (93/162 by minute), with cap test passing. Full gameplay/capture/XP/log export/touch regressions passed, no browser errors. Required interaction harness run; combat screenshot inspected. Syntax/whitespace checks passed. Next: review human run logs for density and extra XP effects.

## September 19 — nest choice, behavior upgrades, Guardian finale

- Implemented fixed Owl and Beast nests among tree groves on west/east sides. 50 HP each, defenders repeatedly spawn until destruction (six per nest, shared 120 cap). Owl defenders telegraph and fire hostile feathers; Beast defenders charge. First nest destroyed irrevocably chooses the recruit; creature is released ready for 2.5s proximity capture. Second nest never grants a companion. Removed automatic 25s Owl appearance.
- Added Beast ally with piercing charge. One-time behavior upgrades: Cat Raking Vortex pulls enemies into sweep; Owl Splinter Feathers forks two projectiles on first impact, without recursive splits; Beast Quake Charge produces endpoint area damage. Creature upgrades only offered after recruitment.
- Guardian reuses campaign DemonCyclop art; appears at 90s with 200 HP, telegraphed aimed triple shots and every-third-volley circular 16-orb attack. Clear spawn location, bright hostile orbs and terrain blocking. Win requires both 120s survival and boss defeat; overtime allowed with instruction in footer.
- New survivor-encounters.js owns encounters/projectiles and reset lifecycle. Logs/history now include nest choice/destruction, Beast captures/damage, hostile shots, boss volleys/defeat; build woodland-nests-v3. Documentation updated.
- New encounter browser suite passed: repeated defenders/firing, stopping on destruction, mutually exclusive capture both directions, capture freeze, natural Owl nest combat/capture (22 HP remaining), pull, feather split, separate shockwave target damage, boss patterns, hostile hit, overtime/win and reset. Existing gameplay/XP/history/touch suite passed with isolated old scenarios adjusted for new rules. Inspected desktop nest/boss and portrait boss screenshots; corrected tree-obstructed and HUD-obscured boss spawn. Required web-game harness completed. Syntax/whitespace checks passed.
- Next human playtest: how rewarding each nest feels, whether defenders/Guardian demand readable movement, and companion balance; all encounter numbers provisional.

## September 19 — nest timing, safer pull, Beast feedback

- Nests now activate, become visible/targetable and start defender clocks at 30 seconds; trees remain as map scenery. Defender intervals Owl 3→5s, Beast 4.5→7s. Activation is logged; build woodland-nests-v4.
- Cat pull validates the full displacement segment (including obstacle correction) against player radius + enemy radius + 24px margin. Unsafe pulls are skipped; safe pulls stagger targets for 0.45s.
- Beast charges leave fading gold streaks, hit bursts and an endpoint impact ring. Quake upgrade retains a larger distinct ring matching area damage. Effects pause/reset with combat.
- Both browser suites passed including new pre-30 absence/activation, slower spawn counts, unsafe vs safe pull and stagger tests. Inspected Beast charge screenshot. Gameplay/touch/history regressions and required skill harness completed. Syntax/whitespace checks passed.

## September 19 — Beast pack targeting

- User Beast run lost at 163s/390 defeats; reported charges wasted on scattered nearest enemies. Replaced nearest-target charge with scoring over target positions and local group centers: number intersected by charge plus Quake landing-area coverage, small Guardian preference and shorter-path tie break. Kept damage/cooldown/range unchanged; corrected final charge timestep to match planned endpoint.
- Logs now record expected path/blast hit counts and boss inclusion per charge; build woodland-beast-targeting-v5.
- Encounter tests passed: closer isolated enemy ignored for farther three-enemy line; all three actually hit for 18 damage; Quake chooses a three-target landing; isolated boss fallback and no-target behavior. Existing encounter regressions passed. Gameplay/history/touch suite and skill harness run; Beast effect screenshot reviewed. Syntax/whitespace checks pass. Next: compare human Beast route to Owl after targeting change; enemy movement may still change actual charge results.

## September 19 — companion damage and attack-speed growth

- User identified static Beast/Owl damage and attack intervals as a progression gap. Added four repeatable, capture-gated upgrades: Owl +1 feather damage and +20% base firing rate; Beast +2 charge/+1 shockwave damage and +20% base charge rate. Damage applies to split feathers and Quake; intervals divide base cooldown by 1+.2*rank. Choices show before/after values. Build woodland-companion-growth-v6; stats included in snapshots/run summaries.
- Tests passed for pre-capture exclusion, repeated upgrade selection, actual damage and cooldown changes (two ranks: Owl 6 damage/.786s, Beast 10 charge/6 shockwave/1.429s), reset, and existing encounter/gameplay/history/touch regressions. Required skill harness run; upgrade card screenshot reviewed. Syntax/whitespace checks pass. Next: assess upgrade availability and companion performance from playtest logs before changing boss balance.

## September 19 — five-minute expedition and collectible starters

- Default survivor mode now runs five minutes; title offers the retained two-minute trial. First capture permanently unlocks that creature as a selectable starter in a separate local save, including migration from recorded Owl/Beast captures. Selected starter replaces Cat; captured starters include Cat, Owl, Beast and Frog.
- Two mutually exclusive nest rounds at 30s and 150s allow a starter plus two recruits. Added support Frog with periodic one-hit shields and an optional haste chorus, and Owl marks that amplify other party members' damage. Creature upgrades remain ownership-gated.
- Added minute-based encounter phases, ranged enemies, a recovery interval, stronger late enemies, optional guarded shrine at 90s (healing and a level), elite at 210s and Guardian at 270s. Regular waves stop at 300s; surviving players must still defeat the Guardian. Logs include party, starter, phases, shrine and support metrics; history and documentation updated.
- Passed all three browser suites: original gameplay/history/touch, encounter regressions, and new expedition tests covering starter UI/persistence/history migration, three-member recruitment limits, support effects, marks, shrine rewards and full five-minute scheduling. Full timeline uses invulnerability and forced boss defeat to verify scheduling, not balance. Required web-game interaction harness completed; desktop/portrait title and party screenshots inspected. JavaScript syntax and whitespace checks passed.
- Next human playtest: five-minute pacing, Frog's value versus an attacking recruit, second recruitment timing and Guardian difficulty across starters. Balance numbers remain provisional.

## September 19 — reuse existing combat effect packs

- Reused existing SoggySocks Combat, Earth and Water sheets: player rock impacts, Owl hit flashes, Cat Raking Vortex whirlwind, Beast charge dust/rocky landing (larger for Quake), nest destruction dust, and Frog shield pulse/block splashes. Existing Ninja Adventure Cat slash and enemy warning graphics remain.
- Added generic cosmetic burst helper using existing sprite pooling and simulation clock; caps added bursts at 80 active effects, freezes on pause and clears on restart. Damage, cooldowns and hit areas unchanged.
- Encounter and full expedition regressions passed, plus focused effect frame-count, pause, expiry, cap and restart checks. Required web-game harness completed; its canvas capture is black on this Mac, so inspected browser screenshots from Metal-backed checks, including all five sheets and in-game Frog pulse. Syntax and whitespace checks passed.
- Next playtest: check visual clarity during crowded late waves; tune effect scale/opacity if needed without changing combat balance.

## September 20 — split damage, escalating shrine, scenery

- User requested 33% split-feather damage, an extra elite, three increasingly dangerous shrine summons each rewarding an upgrade, and existing asset art for shrine/nests.
- Split projectiles now deal 33% of current Owl feather damage (including damage upgrades); primary feathers unchanged. Upgrade description states the penalty.
- Replaced one-time shrine guards with six-second voluntary summons, one active challenge at a time. Tiers use 60/140/300 HP, 12/18/26 contact damage, 55/65/78 chase speed and 280/320/360 charge speed. Each defeat grants one XP threshold; first also retains up-to-12 healing. Leave/re-enter required before another summon, three victories exhaust the shrine. Channel decays outside, pauses with game, respects living cap. Fixed tier stats bypass timed wave buffs. Nearby label previews HP/damage, distant label stays compact. Logged tier activation/rewards and history counts.
- Extra roaming elite at 120s gives bonus XP; existing 210s elite retained. Reused Nature stump + creature token for nests and Dungeon glowing stone altar for shrine. Sprites reset/destroy with encounter owners; damage bars and warnings remain.
- Passed encounter and expedition browser regression suites, new shrine suite for actual 6 vs 1.98 projectile damage, all three tier stats/rewards, channel decay/pause, no duplicate summon/reward, rearm/exhaustion, cap handling, actual 26-damage contact, and both timed elites. Required skill harness completed; browser scenery screenshots inspected (Metal-backed browser screenshots used because harness canvas export is black on this Mac). Syntax/whitespace checks passed.
- Next: human balance test for Owl throughput and whether later shrine tiers create a worthwhile risk/reward decision. No Cat balance changes in this pass.

## September 20 — repelling Cat, larger woodland, XP chests

- Replaced Cat pull behavior with Repelling Sweep: actual upgraded swipe hits push living regular enemies 60px away from player, 0.45s stagger, short collision-checked steps stop at trunks/bounds. Boss/nest positions unaffected. Internal upgrade id remains pull for old log compatibility; offered name/text now describe knockback.
- Map width/height 1600→1920; landmarks/scenery positions scaled 1.2, spawn centered at960,960; boss/Beast boundaries use scene worldSize. Ground details and edge decoration expanded.
- Random XP chests use existing two-frame LittleTreasureChest sheet. First attempt20s, then25–40s, maximum3 unopened, clear positions260–500px from player avoiding objectives. Walk within38px to receive8+2 per elapsed minute XP once. Open animation lingers1.2s. Counts/XP/events recorded in history, pause/reset cleanup included.
- New browser suite passed knockback direction/distance, tree collision, player edge limits, chest cap/clear placement, one-time XP, pause and cleanup/reset. Full expedition and encounter suites passed after relocating old coordinate-based fixtures. Required skill harness completed and Metal browser chest screenshot inspected. No gameplay errors; syntax/whitespace checks passed.
- Next human playtest: knockback feels predictable, larger map travel remains worthwhile, chest frequency/rewards encourage movement without overwhelming upgrade pacing.

## September 20 — broader Frog support and repeatable upgrades

- Interpreted user's party attack bonus as damage: recruited Frog now grants +10% damage to player/Cat/Owl/Beast, including splits/Quake, applied once centrally. Bolstering Croak adds +5 percentage points per rank. Bubble Rhythm continues scaling shield pulse rate, base interval10s.
- Rallying Chorus now repeatable: shield pulses grant3s of +50% attack speed, +15 percentage points per extra rank. Separate chorus timer prevents its rank bonus leaking into Frenzy; both bonuses stack additively and use one shared attack-rate helper across all four attackers. New rank/timer reset each run. Support stats included in snapshots/summaries; build woodland-frog-v10.
- Focused browser test passed all-source base damage (10→11), rank scaling, shield cadence, Chorus rank2 rate1.65, combined Frenzy2.15, independent expiration, ownership gating and reset. Full expedition regression passed. Required skill harness completed and upgrade screenshot inspected; syntax/whitespace checks passed.
- Next playtest: whether Frog's immediate damage support makes it a compelling starter/recruit, and whether repeated Chorus ranks need a cap.

## September20 — player relics

- Implemented six player relics (Boots, Standing Stone, Ricochet, Repulsion, Slipstream, Bloodroot) in survivor-relics.js, with visible active indicators, two run-only slots and native Phaser choice/replacement/skip panels. Keyboard1–3 selects; replacement1–2. Relic rewards queue separately ahead of XP upgrades without losing either. Ownership, choices and source events persist in run logs/history.
- Added purple guarded relic cache at45s, reward on120s elite defeat and final shrine challenge alongside XP. Cache requires defeating three guards before approach opens reward; screen-edge label points to it. Regular XP chests unchanged.
- Focused browser suite passed all effects, three sources, pause, replacement, XP sequencing and reset; desktop and portrait choices inspected. Expedition and encounter regressions passed; required skill harness completed. Updated shrine fixture to handle relic-before-XP ordering. Build woodland-relics-v11.
- Next playtest: cache travel/guard difficulty, relic choice clarity, and whether movement/standing builds feel distinct; all numeric relic values provisional.

## September21 — Mouse, Mole and Bear

- Added survivor-creatures.js for three capturable enemy/companion species using existing MouseBlack, Bear and Mole sprites. All unlock as permanent starters after proximity capture, have ownership-gated upgrades and participate in Frog buffs, party caps, damage logs and result totals. No creature relics added.
- Mouse: fragile fast enemy packs from35s every22–30s; ally summons temporary biting helpers. Damage/count/rate upgrades and kill-chain behavior,24-helper cap and pooled sprite lifecycle.
- Mole: enemy locked-position eruption warning1.25s then9 damage; ally dense-group targeting delayed8-damage area attacks. Damage/area/rate upgrades, aftershock and slowing ground. Hostile concurrent eruption cap3, regular-wave Mole cap2, reduced finale firing.
- Bear: slow28HP blocker, one-second warned12-damage slam; ally positions near player toward threats and slams/staggers. Damage/area/rate/stagger upgrades and Safe Ground25% damage reduction. Protection applies contact/projectile/ground attacks; support logs preserved.
- First expedition habitats shuffle attackers excluding starter; second round prioritizes unowned Frog plus an available attacker. Captures remain one perround,3 total party. Bear uses rock den art, Mouse/Mole stump burrows/mounds with entrances and creature markers. Tests pin the old roster explicitly where testing old scenarios.
- New focused suite passed all captures/starter unlock persistence, party cap, upgrade gating, actual companion damage, Mole group hits/aftershock/slow, Mouse count/kill-chain, Bear stagger/protection, enemy warning/dodge, pack spawn and pause. Existing encounter and full expedition suites passed; required interaction harness completed. Party/den browser screenshots inspected. Syntax and whitespace checks passed.
- Next human playtest: starter pacing, Mouse helper readability, whether Mole pressure remains fair during shrine fights, and whether Bear's protective positioning feels distinct from Beast.

## September21 — relentless elites and stale preview

- Boss/elite immunity now covers normal hit recoil, Cat knockback, Repulsion knockback and Bear stagger. Regular enemies retain existing reactions; damage still applies. Shared unstoppable predicate uses elite flag or boss kind, including shrine and roaming elites.
- Inspected actual in-app preview: loaded script list lacked survivor-creatures.js, confirming stale pre-creature document. Reloaded finished-run screen after adding v13 script cache keys; verified creature module and all current game scripts are loaded, title screen ready, existing unlocks retained. Server was already running (sandboxed curl was inconclusive).
- Added browser regression for seven damage sources, explicit knockback, Bear stagger, boss/roaming/shrine immunity, regular enemy movement and creature textures. Required interaction harness run. Build woodland-relentless-v13.

## September21 — movement dash, Guardian, desert, bestiary and XP display

- Added movement-only dash (Space/Shift/touch button):111.6px over0.18s,3s cooldown, solid-step collision, no invulnerability. Pauses/reset correctly.
- Guardian uses existing Ninja Adventure explosion/fireball sheets, faster245 aimed/165 ring projectiles,1.15s recovery,85 chase speed, and every-fourth three warned ground eruptions. Pending Guardian eruptions clear on defeat.
- Added selectable desert field using existing sand/palm/rock assets, retaining current encounter layout/schedule. Added capture-based seven-entry bestiary, unknown entries shown as???. Title menu offers field/bestiary/history; snapshots/logs include field.
- User clarified XP request means showing progress to next level, NOT currency. Removed all provisional Essence/wallet code before delivery. Added current/required XP → next level label and gold progress bar. gainXP centralizes pickup/chest/shrine XP without currency conversion.
- Expansion browser checks passed dash distance, damage during dash, cooldown/pause/collision, boss eruption/projectile speed and desert field. Full expedition and mobile title-start regressions passed. Required interaction harness completed; inspected bestiary, boss warnings, corrected desert palm selection and6/10XP bar screenshot. Syntax/whitespace checks passed.

## September21 — current game becomes main entry

- Main index.html now redirects to survivor game, preserving query/hash (including field selection). Original index markup preserved as legacy.html; game.js/styles/assets and old save keys untouched.
- Added Legacy button beside Bestiary/History on current title. Current HTML title now ScrollMonsters · Expeditions. README describes new main game; original campaign documentation preserved in LEGACY.md.
- Browser check passed root redirect/query preservation and actual Legacy button navigation; both game titles/screens rendered and inspected. Required game harness passed through root entry. Syntax/whitespace checks passed. No deployment performed.

## September22 — ten-minute expeditions and stackable relics
- Removed two-slot limit; duplicate choices stack. Added Pack Sigil, Resonance Bell (three distinct attackers, pending future dedicated combo system), Echo Fang (delayed damage echo, not a repeated projectile), Guardian's Drum, Hunter's Brand, Spite Seed and Phase Veil. No dash attack/haste relics; Phase Veil alone grants 0.08s dash protection, +0.03/copy capped at 0.18s.
- Existing relics now scale: Boots charged damage, Standing Stone shot speed, Ricochet bounce count, Repulsion reduced firing penalty, Slipstream duration, Bloodroot damage. Collection visible on pause, compact count HUD, stack/new labels on offers. Relic effects cannot recursively echo/explode; pending echoes capped80.
- Recurring caches: first45s, next75s after claiming, guarded by3 time-scaled defenders. Relic hunters at4:00 then every90s through8:30, in addition to existing2:00 hunter. Each of3 shrine clears awards a relic plus existing XP. Same reward systems in both biomes for now; dedicated desert ruins event remains future work.
- Standard expedition600s, Guardian570s/1200HP; early capture timing retained. Enemy mixes continue through9:30, post5min fixed HP/speed tiers and faster spawning. Trial remains120s.
- New browser regression covers effects, duplicate stacks, no-recursion, shield haste expiry, dash invulnerability only with relic, cache recurrence, elite reward, finale timing, pause and reset. Existing expansion suite passed. Required skill harness ran; its WebGL screenshot black as previously; Metal browser screenshots used for visual checks.
- Balance values provisional; invulnerable schedule simulation verifies progression, not difficulty. Creature-specific dash styles and dedicated pair combo upgrades remain future work.

## September22 — movement experiment and roadmap
- User requested10% slower player movement: base178→160.2px/s on both axes; dash unchanged. Cache version17 and run build movement-tuning-v17 distinguish playtest data.
- Added SURVIVORS-ROADMAP.md with implemented/proposed status, creature combos, creature-dependent dashes, biome engagements, evolutions, replayability, and playtest questions.

## September23 — charge commitment and enemy pressure
- Reviewed supplied v16 desert run: won at618.27s,1948kills, Cat/Frog/Mouse,118total damage taken. Guardian lived48.25s and inflicted one logged damaging ring hit. This run predates v17 movement reduction.
- Charging enemy Beasts now share knockback/stagger immunity with elites/bosses; normal Beasts can still be displaced outside a charge.
- Guardian attack clocks advance2x, initial delay halved, ground warning halved to0.575s. Damage/projectile travel speed unchanged. This implements attack frequency, not doubled damage.
- Soft radius-based enemy separation reduces exact overlap. Simultaneous capped steering respects obstacles and leaves committed charges, windups, ranged aiming, elites and stunned enemies stationary relative to this spacing pass. Groups remain valid AOE targets.
- Build enemy-pressure-v18/cache18. Browser regression passed charge immunity/normal recoil, crowded enemy spread, fixed charge position and doubled boss timings. Required skill harness run; Metal screenshot inspected for rendering.

## September23 — elemental roster, combos and dash styles
- Added survivor-elements.js integrated with existing creature/capture/relic systems: Salamander(Lizard), Spider(SpiderRed), Storm Lizard(blackLizard2). Roster/unlocks/bestiary now10; paginated bestiary. One new species guaranteed in first normal expedition habitat pair. Existing party cap3 remains.
- Added friendly capped fire/web zones, lightning chains, all proposed individual upgrade paths,4pair upgrade offers and creature-supplied selectable dash styles. No extra invulnerability. Fire particles and thunder sprites use existing Ninja assets; webs rendered with spokes/rings and fading outlines.
- Hostile variants are habitat defenders only; fixed1.1s warnings, small30px hazards, shared4ground-hazard budget across elemental/Mole/Bear/Guardian. Guardian uses aimed volley if3eruption slots unavailable. No permanent terrain changes.
- New browser suite verifies captures/starters/local save, actual combo level-up offers, damage effects, dash variants/no invulnerability, enemy casts, shared cap, pause and reset. Relic suite and complete ten-minute simulation passed; required skill client ran; Metal screenshots used due known black harness screenshot issue.
- Existing unrelated asset deletions/.DS_Store modifications observed in working tree; left untouched.

## September23 — combat readability
- Replaced ambiguous loss wording with EXPEDITION FAILED; victory EXPEDITION COMPLETE.
- Player/feather projectiles and impact sprites render above actors/scenery. Feathers face travel direction, have larger silhouettes and short cyan trails. Lightning lasts0.38s with layered core, zigzag and hit rings; Conductive Feathers uses gold arcs and an origin impact.
- Damage/upgrade balance unchanged. Creature test suite and skill interaction harness run; dedicated screenshot covers blue and gold lightning. Current Storm damage is additive4→5→6, so relative damage upgrade value already declines. Future balance should compare utility and damage in actual builds before blanket nerfs.

## September24 — shared level-up stats
- Added Party Power8% base damage/rank and Party Tempo6% attack speed/rank, additive within each stat. New captures inherit ranks immediately. Removed individual damage/speed offers centrally; legacy fields kept for historical/debug compatibility.
- Spider vulnerability remains a dedicated utility upgrade, separated from burst damage. Frog support enhancements unchanged. Snapshot and run upgrades include shared stats; build party-growth-v21/cache21.
- Dedicated browser checks cover all10damage sources, late recruit damage, offer exclusions, resets and derived relic damage. Map pickups discussed as future proposals, not added this turn.

## September24 — exploration and map supplies
- Map2304x2304,20% wider/taller, camera/floor/boundaries/obstacle placement scaled; start and starter companions centered. Shrine relocated proportionally.
- Both habitat waves randomly choose clear locations each run, separated from player/obstacles/objectives/other dens. Removed den, XP-chest and relic-cache labels/edge locators, plus old directional objective text. Den waves announce only A den of monsters appears; capture and shrine interaction UI retained.
- Map supplies first35s, then45s intervals cycling magnet/Frenzy/cleanse, maximum3uncollected,90s lifetime. Magnet attracts existing XP across the map at900px/s; Frenzy grants existing12s/50% additive attack-speed effect; cleanse removes hostile ground zones/pending strikes within300px.
- Browser checks passed random placement/clearance, map bounds/center, XP collection, haste, local cleansing versus distant hazards, and announcement. Required interaction harness completed; dedicated map screenshot inspected. Build exploration-v22/cache22. Den coordinates added to run summaries for review.

## September24 — matching den defenders
- Removed Cat→Bat and Frog→Owl placeholders. All10den types spawn their corresponding species.
- Hostile Cats pursue and telegraph a0.65s close-range swipe; Frogs periodically grant non-stacking single-hit shields to up to3nearby ordinary enemies. Bosses/elites excluded. Correct2-frame enemy animation handling for animal sheets; shield/swipe warnings visible.
- Browser regression passed all10spawn mappings, Cat/Frog recruitment, swipe damage/warning and shield consumption. Interaction harness run; enemy screenshot inspected. Build matching-dens-v23/cache23.

## September24 — starter bestiary grid
- Replaced title starter cycling with direct3x3portrait selection and two pages for10creatures. Locked entries remain??? and cannot select; current starter highlighted. Removed explanatory text above selection. Bestiary mode shares the grid.
- Condensed field/start controls and retained trial/history/legacy navigation. Fixed card hit-testing with screen-fixed scroll factor. Browser test exercises actual pointer selection, locked cards, page switching, and starting selected Storm Lizard. Build starter-grid-v24/cache24.

## September24 — gentler opening / faster XP (v25)
- Expedition ordinary spawn rate 75% through120s, interpolates to100% at240s; den defenders and scripted encounters unchanged.
- Cat base swipe3→2.4, Owl feather4→3.2, Beast charge6→4.8 and quake4→3.2. Cadence/geometry and shared upgrades unchanged.
- Collected XP starts at1.5x, +0.05 each elapsed minute capped2x at10min. Fractional rewards bank toward whole XP so HUD stays integer; chest messages/history use actual award. Shrine's one-level reward bypasses multiplier. Level requirements unchanged.
- Browser regression verifies rate boundaries, XP accumulation/growth, exact shrine award, reset and actual Cat attack plus Owl/Beast stats. Required gameplay harness passed; Metal screenshot inspected, no browser errors. Next: human playtest weaker starters and late Owl scaling; this is provisional tuning, not proof of win-rate balance.

## September 28 — full code and design review
- Added GAME-REVIEW-2026-09-28.md with prioritized findings, evidence, capture/spawn/design recommendations, and validation limits. Reviewed existing uncommitted changes; no production gameplay code edited.
- Reproduced hidden pause-menu buttons beneath relic inventory, missing legacy projectile assets, Echo damage scaling mismatch, Resonance window mismatch, Thunderhead target-local counting, and ineffective enemy hit tint. Simulated telemetry quota exhaustion; exact browser failure threshold varies.
- Fourteen selected current-game browser scripts: eight passed, six failed on stale expectations/coordinates. Both advertised npm browser checks target the wrong game; nonbrowser checks also need fixture repair. Capture completion/unlocks passed separate checks for all nine non-Cat recruits.
- Required skill harness ran; default graphics captures were black. Dedicated Chromium/Metal desktop and portrait screenshots were inspected in output/review-2026-09-28. No page errors in those inspection scenarios.
- Next: fix hidden UI/legacy assets/storage, restore reliable tests, resolve relic contracts, then improve deliberate capture choice and sound/visual feedback. Tune density after measuring local enemy pressure and cap occupancy in human playtests.

## September 28 — current-game reliability fixes (v26)
- User excluded legacy work and requested priorities 1–4: pause UI, history storage, current tests, relic behavior and capture choice. Existing unrelated working-tree changes were preserved.
- Relic inventory now owns the pause screen, so covered Resume/History controls are not created underneath. Pointer and touch checks verify blank inventory clicks cannot navigate away; visible Resume and keyboard resume still work.
- Run records use compact checkpoints and version 2. History retains up to 50 records within a 2 MiB UTF-16 serialization budget, evicts oldest runs, and retries quota failures. Oversized individual telemetry is trimmed with omission counts while retaining the summary. Failed writes leave previous saved history intact; starter storage is separate.
- Echo uses finalized hit damage exactly once. Resonance uses per-attacker timestamps in a rolling three-second window. Thunderhead counts damaging lightning hits across targets, excluding shields, echoes and delayed strikes; counters reset each run.
- Den destruction frees both options without committing. All species use a shared capture completion gate; completing the 2.5-second channel locks that round, dismisses pending alternatives, and preserves independent delayed rounds and party limits. Unresolved first-round species are reserved when selecting second-round dens. Shared two-line capture labels fit desktop and portrait screens.
- Added npm run test:survivors with an automatically managed server, shared URL/browser helpers, pinned Playwright dependency and 17 current-game checks. All 17 passed. Restored touch release/upgrade, Frenzy expiry, restart cleanup, hostile charge and actual Hunter Marks coverage; affected checks also passed after those additions. Syntax checks and git diff --check passed.
- Targeted quota tests cover normal byte/count retention, quota retry, oversized run, complete exhaustion, non-quota errors, recovery and JSON export. Capture tests cover all ten species, dual-den destruction, channel pause/decay, loser cleanup, delayed rounds, duplicate prevention, trial limits and mobile labels.
- Required skill harness ran; default/headed capture path still yields black images on this graphics setup. Dedicated Chromium/Metal inventory and capture screenshots were inspected in output/reliability-v26. A headed-only missing favicon request was corrected using the existing Cat portrait.
- Remaining later priorities: sound/hit feedback and measurement-led spawn tuning. Broader historical documentation cleanup and legacy fixes are outside this implementation.

## September 29 — current tree review
- Added `GAME-REVIEW-2026-09-29.md` with current defects, stale code/comments, design gaps, reproduction notes, and priority order. No gameplay implementation was changed.
- Current Survivors suite passed 24/24; all root JavaScript and CJS files passed syntax checks. Chromium/Metal gameplay capture rendered with no page errors. The required web-game client returned valid state but its SwiftShader screenshot was black.
- Legacy browser requested 21 missing placeholder assets; both legacy npm browser checks failed on stale title coordinates, and `check-game.cjs` failed before assertions because its VM sandbox lacks `URLSearchParams`. Current-game follow-ups include preserving starter selection when changing fields, keyboard navigation, relic edge cases, and consolidating obsolete documentation.

## September 30 — surrounding enemy pressure
- Lowered player base movement from 160.2 to 150 units/second, preserving existing movement multipliers.
- Added eight-sector weighted offscreen spawn selection, checking current and next camera bounds, world bounds, minimum player distance and obstacles. Invalid locations are skipped instead of clamped into view.
- Recycle at most two distant ordinary seekers every 0.75 seconds, retaining health/state and spawn/kill accounting. Explicitly placed encounter enemies, elites, bosses, reward enemies, stunned enemies and committed attacks are excluded. Restart resets the recycle timer.
- Added `check-swarm-spawning.cjs` to the suite: directional preference, safe edges, blocked spawning, health/accounting preservation, protected/visible enemies and exact movement. Passed. Updated the existing movement expectation to 150; its keyboard/touch/combat/pause/endings regression passed.
- Required skill harness completed with valid gameplay state; its known SwiftShader black capture persists. Inspected a separate Chromium/Metal gameplay screenshot successfully; no browser errors in the focused check.
- Next: human playtest directional pressure and recycling cadence before changing population targets, approach steering or crowd spacing.
- Full existing suite finished with 23/24 passing on its initial run; the sole failure was the old speed assertion, corrected and independently rerun successfully. All 24 existing checks plus the new spawning check passed across these runs. Syntax and diff whitespace checks passed.

## September 30 — player aiming and shorter protection
- Player now fires continuously toward the mouse in camera space, or the touch movement stick direction. Touch release retains the last aim; fresh runs default downward. Companion targeting is unchanged. Player facing follows aim.
- Damage and shield blocks grant 0.25 seconds of invulnerability; consuming a healing pickup refreshes protection to at least 0.25 seconds. Timer decay now happens before all damage systems, giving contact, projectile and hazard hits the same window.
- Added check-player-aim.cjs to the suite: actual mouse/touch events, target-free firing, aimed impact, touch release, hit/heal protection expiry, contact and restart. Focused browser check passed. Inspected desktop and portrait Metal screenshots; no browser errors.
- Required skill harness completed with valid gameplay state; its known SwiftShader black screenshot remains. The separate Metal desktop and touch captures rendered correctly and were inspected.
- Next: playtest the shorter protection window against crowds and assess whether touch should eventually use a separate aim stick.
- Final verification: all 25 existing suite checks passed, plus the new player-aim browser check (now registered for future full runs). JavaScript syntax and diff whitespace checks passed.

## September 30 — 150 enemies and automatic gesture dash
- Shared live-enemy cap is 150. Wave, den, mouse swarm, shrine and cache paths use the shared cap; spawn() enforces it for scripted elites too. Snapshot exposes enemyCap/enemyCount.
- Removed Dash and Dash-style HUD buttons, cycleDash/dashOptions functionality, and Shift shortcut. Space keeps dash on desktop; player charge bar retains cooldown feedback.
- Phone quick swipe/release (48 game pixels within 300ms) dashes along the swipe. Held drags keep ordinary movement/aim; taps do not dash. Existing mode/cooldown restrictions apply.
- Completed recruitment and allied starter initialization automatically select Salamander/Spider/Storm dash or Normal for other species. In-progress elemental dashes retain their original effect until completion.
- New check-dash-input covers cap/replacement, starter and sequential recruitment selection, absent controls/cycling, Space vs Shift, actual directional touch events, held drags and taps. Passed; mobile Metal screenshot inspected. Required skill client completed; its known black SwiftShader capture persists, with separate Metal capture verified.
- Updated old touch movement tests to hold the drag beyond the swipe threshold and cap assertions to 150. Updated current control documentation. Next: playtest swipe threshold on a physical phone and crowd performance at 150.
- Validation finished: initial full suite passed 25/27; the two old quick-touch expectations were updated to deliberate held drags and both reruns passed. All 27 current checks therefore passed across the full run and targeted reruns. Syntax and diff checks passed; no errors in the new browser check.

## September 30 — larger looping world and event placement
- Expanded both biomes to exactly 4500x4500 world units. Player coordinates continue through repeated tiles; camera bounds, movement/dash boundaries and edge-limited combat were removed. SurvivorWorld keeps one nearest periodic image of simulation bodies and art so collisions, chases, pickups and landmark state persist across joins.
- Greens terrain now uses a periodic dual grid with nine culled layers. Visual QA found and fixed a scaled tile-culling gap; ground/decorative depth and effect/UI layers now remain valid for negative or repeated world coordinates.
- Shrine position is seeded/randomized per run, reserving clear space in forest generation and checking desert collision. Dens use full camera width/height plus 140-unit art clearance, including across wrapping joins; planned and fallback den placements enforce the same rule.
- XP chest first/subsequent attempts are 40–60s; guarded cache first attempt 60s, next cache 90s after claim. XP chests/caches use shared offscreen placement; hidden forest treasure waits until offscreen to reveal.
- Mouse waves request 6,7,8,... units, adding one each scheduled iteration. Group placement retries blocked/offscreen positions; the 150-enemy cap still applies. Swarm members may recycle like ordinary wave enemies.
- Added looping-world browser checks for all four joins, dash crossing, cross-join collision, persistent den HP, seeded shrine variation, desktop/phone den spacing, event timing/visibility and growing mouse counts. Forest corner/phone screenshots inspected after rendering fixes. Updated generator and old size/timing fixtures; generator passed 200 seeds.
- Full suite initially passed 27/28; remaining pack test expected the old 45s cache. Updated to 60s and rerun passed. All 28 checks passed across full run and targeted reruns. Required skill harness completed with gameplay state; known SwiftShader black capture persists, separate Metal screenshots verified. Syntax/diff checks passed.
- Next: physical-phone performance/playfeel checks for the larger world and repeated terrain. Existing user edits and unrelated Finder metadata changes were preserved.
- Desert follow-up passed after multiple positive/negative wraps: clear randomized shrine, separated dens and offscreen cache. Desert Metal screenshot inspected. Bumped current-game script URLs to v34 so browser refresh loads the changed modules together.

## September 30 — double shrine size
- Doubled shrine art from 3x to 6x, including its ground-anchor offset and completion-effect origin.
- Shrine summoning ring and progress fill now use 6x; creature capture rings retain 3x. Activation radius increased from 70 to 140 world units to match the enlarged ring.
- Chromium check passed for sprite/ring/fill scales and progress inside/outside the new radius. Metal gameplay screenshot inspected; no page errors. Required skill harness ran; syntax and whitespace checks passed. Shrine/juice script cache versions bumped to35.

## September 30 — enemy identities and rare variants
- Added survivor-enemies.js to separate hostile visuals from recruited creature roles. Golems replace Bats (5% Forest at 1.25x HP/speed/damage); provisional Energy elite tuning is a separate 1% with 2x HP/damage and normal speed, pending user preference.
- DemonRed replaces hostile Beast; elite DemonGreen renders at precisely 2x normal size. Orange/Black Ninja Mages replace hostile Owl, with 5% Black triple energy-ball spreads and matching aim warnings. Captures/ally sprites remain unchanged.
- RedGladiator replaces hostile Bear with an equipped axe, a one-second warning and 0.7-second spinning attack (one 12-damage hit), preserving ally Bear behavior. Pooled axes hide on death and reset.
- Added targeted browser checks; passing stats/thresholds, projectile spread, elite size, spin damage/pause and cleanup. In-game Metal screenshot inspected. Existing creature regression passed. Full suite and required skill harness underway.
- Additional targeted checks passed for dodging the spin, entering late, one-hit limit, stationary committed attacks, mage projectile damage, and Forest multipliers after late-game scaling. Spin/windup now resist crowd-separation movement.
- Required skill harness ran with valid gameplay state and no console errors; its canvas capture remains black even with Metal. Used the existing browser test helper's full-page Metal screenshot for visual QA instead; all enemy variants, triple orb spread, and equipped spinning axe are visible in output/enemy-variety/showcase.png.
- Final validation: all 28 existing survivor checks passed, plus the new enemy-variety check (29 total across full suite and targeted run). Added enemy-variety to the maintained runner. Syntax and git diff whitespace checks passed. Energy Golem frequency/stats remain explicitly provisional; next step is human playtesting of mage spread pressure and Gladiator spin readability.

## September 30 — shamans, summoned minions and rare Hunters
- Used the three supplied shaman sheets. Yellow/green summon Skeleton characters; blue summons the animal Lion sprite (16x23 frames). Lion contact damage is 10 versus Skeleton's 5. Capturable creatures remain separate.
- Added capped wave selection: shamans from90s, 3%/spawn, minimum25s spacing, maximum2 living; Hunters from120s, 0.5%/spawn, minimum45s spacing, maximum1 living. Both replace normal slots and stop arriving at570s.
- Summons warn for1.2s, then create up to2 minions, with6s cooldown,4 living per owner and12 global. Obstacle/player clearance checked again at completion; caster death cancels pending casts; global enemy cap preserved.
- Hunters approach into view, seek clear line of sight, aim1.5s with final0.4s locked, and fire a fast arrow before3.8s reload. Viewport-aware approach handles narrow phone screens. No shield-knight implementation.
- Targeted browser checks passed for summons, caps, cancellation, pause/reset, damage ratio, rarity/cooldowns, LOS and aim locking. Desktop screenshot inspected. Full regression suite and phone checks underway; required skill harness completed.
- Phone viewport check passed: offscreen Hunter moved into view before aiming and firing. Desktop and phone full-page Metal captures inspected. Skill harness state/input run passed with no errors; its known black canvas-capture issue persists, so visual verification used the existing browser-helper screenshot route.
- Added summoners check to maintained runner. Syntax and whitespace checks passed. New specialist balance remains provisional; next human playtest should assess summoner priority pressure and Hunter frequency/telegraph readability.
- Final validation: full existing suite29/29 passed, plus the new summoners check on desktop and phone (30 total checks across suite and targeted runs). No browser runtime/resource errors in the new test.

## September 30 — reconcile local main with origin/main
- Local main's enemy/world update (1452c5a) diverged from the remote feedback merge (5d706fb). Merged the histories on main without creating a branch or rewriting commits.
- Combined both test lists and retained the high world/UI draw depths with the incoming UI-size setting. Preserved the enlarged shrine while accepting the incoming enlarged creature-capture rings; updated the incoming shrine assertion accordingly.
- Set repository-local pull.rebase=false so later pulls default to merging. Existing branches and worktrees were left intact.
- Validation: all31 combined survivor checks passed, including enemy variants/summoners and incoming feedback coverage. Syntax/whitespace checks passed; merged-game screenshots visually reviewed. Required skill smoke harness ran; known black canvas capture persists, with full-page test screenshots used for visual verification.

## September 30 — giant treasure front-step interaction
- Replaced the slab's fully solid footprint with side/back rubble and chest collision, leaving the central front staircase walkable.
- Removed the 290-unit all-direction auto-open radius. Treasure opens only at the top of the front steps (within 40 units horizontally and 44–76 units in front), using wrapping-world offsets. Added an idempotency guard to prevent duplicate rewards.
- Platform now renders beneath actors; chest depth allows the player to remain visible on the steps.
- Updated the existing Greens browser check to walk through collision from the front for both XP/relic rewards, verify side/back/distant approaches stay closed, and verify one reveal/open event. Passed without browser errors. Inspected Metal screenshots before and after opening; required skill harness ran. Syntax and whitespace checks passed. Greens cache version bumped to39.

## September 30 — companion dash abilities
- Added automatic dash styles for Cat, Owl, Beast, Frog, Mouse, Mole and Bear, completing the ten-companion roster. Cat swipes ahead; Owl strikes and marks; Beast damages along the route; Frog grants a missing shield; Mouse sends up to two helpers; Mole places a delayed eruption; Bear slams and staggers. Existing Salamander, Spider and Storm Lizard effects remain.
- Cat starter now selects its dash when a run starts. The most recently recruited creature still determines dash style. Dash movement, cooldown and Phase Veil invulnerability rules are unchanged.
- Added focused ten-style browser coverage and kept it in the maintained suite. Full survivor suite passed 32/32, including input, capture, relic and expedition checks. The develop-web-game harness confirmed Cat dash state/cooldown with no errors. Its canvas-only screenshot remains black on this host; full-page Metal gameplay capture was inspected instead.
- Next: human playtest damage, radius and Frog shield frequency; these new dash effect values are provisional.

## September 30 — time-based enemy damage
- All incoming enemy damage gains max(0, floor(elapsed / 60) - 2): first +1 at 3:00, then another +1 every minute. Applied at impact to existing enemies, projectiles, special attacks, hazards, elites and bosses, before defensive reduction. Added current bonus to text-state output.
- Added minute-boundary browser regression covering contact from an existing enemy, in-flight projectile, Guardian eruption, fire hazard, reduction, shields, invulnerability and reset; passed. Registered it in the maintained suite.
- Required web-game harness completed; known black canvas capture persists. Inspected the separate Metal gameplay screenshot successfully. Next: human playtest late-run damage with the 0.25-second protection window.
- Existing player aim/invulnerability browser regression also passed; syntax and whitespace checks passed.

## September 30 — Bear, Frog and Spider ability rework
- Bear now emits a narrow expanding cross: 180 reach, 28 width, 10-to-5 radial damage falloff, 0.45s travel, one hit per target. Reaching Tremor adds reach; Heavy Paws returns as a creature-specific damage upgrade. Existing stagger/guard and dash remain.
- Frog now grants +1 flat hit damage to player and companions. Removed Bolstering Croak offers; old frogPower state is inert. Echo damage inherits the bonus exactly once.
- Spider webs now tick for 1 base damage each second while retaining slow, vulnerability, burst and combo behavior. Updated bestiary text and asset cache versions.
- Added browser regression for cross geometry/falloff/upgrades, Frog flat damage and Spider cadence/pause; passed. Inspected full-page Metal screenshot of cross and web effects. Full regression suite and required skill smoke test pending below.
- Validation complete: survivor suite passed 35/35, including ability geometry, all dash styles, shared progression, relic contracts, input, pause and UI feedback. Required skill gameplay harness passed movement/dash state with no errors; its known black canvas-only capture persists, so the full-page Metal screenshot was used for visual verification. Syntax and whitespace checks passed.
- Next: human playtest Bear center-vs-tip damage and Spider/Frog synergy; current damage and reach values are initial tuning.

## September 30 — remove decorative party rings
- Removed the persistent player/Cat foot ellipses and companion outlines for Owl, Beast, Frog and all six additional species. Kept functional shield/status, capture, hostile and attack indicators.
- Bumped affected script cache versions. Syntax/whitespace checks and required gameplay smoke harness passed. Browser capture of player and all ten companions visually checked with no runtime/resource errors; unrelated asset edits preserved.

## October 1 — capture evolution prototype
- Confirmed first four: Octopus (Cat + Mollusc), Reptile (Salamander + Beast), Tengu (Owl + Storm), Axolotl (Frog + Mollusc). Added Mollusc as the eleventh capturable base; Bamboo and the full twelve-base roster remain future work.
- Added survivor-evolution.js with recipe/catalog APIs, paused capture decisions, single-commit merging, inherited upgrades, run HP/role bonuses, evolved attacks/dashes/upgrades, discovery persistence and bounded placeholder effects.
- Added a temporary native capture selector and presentation hooks; Reed owns final evolution/bestiary UI and VFX. Handoff: docs/superpowers/specs/2026-10-01-evolution-vfx-ui.md. Future Beast + Bear uses MonkeyBoxerBlue, never Gladiator.
- Extended normal expeditions to twenty minutes: first Guardian at 570s, much slower boss waves, stronger Ancient Guardian at 1140s, victory on final defeat. Later den rounds favor compatible ingredients and wait for placement space; trial remains two minutes.
- Focused browser checks passed initial recipe orders, cap/leave/recruit behavior, upgrade transfer, all four combat abilities, dash selection, pause, discovery and boss milestones. Full suite revealed old duration expectations plus den-placement exhaustion (fixed with four-unbroken-den cap and retry), and concurrent music UI regressions. Verification continues below.
- Final focused evolution check passed all eight ingredient orders, full-party/leave/recruit choices, all four attacks and dashes, upgrade inheritance, discovery/reset, mouse/touch/keyboard interaction and desktop/portrait/Large UI. All four combat screenshots and portrait selector were visually inspected.
- Twenty-minute expedition timeline and relic-growth long-run checks passed (full run reached final victory at 1200s). Broad suite initial run: 27/35; old duration fixtures have since been updated, den placement exhaustion fixed, and targeted timeline/relic tests passed. Separate determinism and damage-number reruns were still running during final wrap-up. Concurrent music control caused unrelated pause-label and portrait-fit failures; centered the music button without changing its behavior. Full suite is not yet green and should be rerun after concurrent UI work settles.
- Required skill smoke harness completed without reported errors; its known black canvas capture persisted. Visual QA used full-page Metal browser screenshots in output/evolution instead.
- Follow-up: human playtest evolved damage/HP and second-half enemy scaling; Reed's custom bestiary/evolution presentation and VFX; planned Bamboo and remaining recipes. No custom final art generated in this pass.

## October 1 — evolution ability VFX integration
- Read docs/evolution-vfx-integration.md and preserved the existing merge/bestiary presentation. Added survivor-evolution-fx.js, a presentation-only, bounded renderer driven by simulation time, with ground start/loop/end phases, directional sweeps, feather skins, lightning, warnings, impact events and Rally motes.
- Added missing abilityfx emissions without changing attacks, damage or timing; removed superseded native impact bursts and duplicate merge fallback. Missing exported sheets retain geometric fallbacks where applicable. Added manifest-only rebuilding and visible_w validation for the nineteen named ability sheets.
- Existing evolution UI and seeded determinism checks passed; skill smoke harness completed. New comprehensive evolution-fx check is ready to run once all sheets exist.
- Reed confirmed the Phase B exports are not finished yet and requested waiting. At this checkpoint only Tengu_Feather.png and Lightning_Link.png are available; remaining JSON metadata is present. Awaiting the remaining PNG exports before final visual QA.

## October 1 — slower enemy damage growth
- Preserved the initial two-minute grace period; enemy damage now gains +1 at 4:00, +2 at 6:00, +3 at 8:00, and +4 at 10:00. All incoming damage paths still share the bonus. Updated docs, cache version and existing boundary regression.
- Damage regression passed (boundaries, contact, projectile, eruption, fire, reduction, shields, protection and reset). Syntax checks passed. Gameplay harness completed; inspected separate Metal screenshot because harness canvas capture remains black. Unrelated UI_STYLE_GUIDE.md trailing blank line was left untouched.

### Ability export verification
- Loaded the new exports and bumped script cache versions to 47. Seventeen of nineteen PNGs arrived; Fire_Pool_Start and Bite_Impact are still absent. Pixel-alpha inspection found Ink_Splat, Ink_Pool_Start, Ink_Pool_Loop, Ink_Pool_End and Ink_Hit completely transparent. Asked Reed to re-export these seven assets.
- Added transparent-sheet rejection to the manifest builder so blank art cannot silently hide gameplay zones. Fire pools use the valid loop when a start/end sheet is unavailable; missing ink loops retain the old visible geometry. Corrected screenshot fixtures to advance effect lifetimes along with simulation time.
- Evolution gameplay regression passed all eight recipe orders, inheritance, four attacks/dashes, persistence/reset and boss pacing. Partial VFX regression passed available-sheet hooks, pause, contact coalescing, pool bounds/reuse, reduced motion and render-only state preservation. Full nineteen-sheet verification remains pending the seven usable exports.
- Final checks: unchanged check-juice and check-determinism both passed with the usable exports enabled. The skill smoke harness passed; inspected the Metal full-page desktop grass and phone desert screenshots (the skill's canvas capture remains black on this setup). Available fire, sweep, lightning, shield and impact art renders; ink stays visibly represented by the fallback. Full check-evolution-fx remains intentionally strict and cannot pass until the missing/transparent sheets are replaced.
- Subsequent exports: Fire_Pool_Start, Ink_Splat, Ink_Pool_End and Bite_Impact now contain visible pixels and are included in the regenerated manifest (script cache v49). Ink_Pool_Start, Ink_Pool_Loop and Ink_Hit were re-exported but still have alpha range 0–0 and remain excluded. Partial ability check passed including Bite Impact, all fire phases, pause/reset, contact limits, reduced motion and read-only rendering. Inspected refreshed desktop/phone screenshots; skill smoke completed. Full art verification remains blocked only by those three transparent ink PNGs; the visible ink-pool fallback stays active.
- Completed: the final three ink re-exports are valid. All nineteen ability sheets are now included; manifest rebuild reports no missing or blank assets. Bumped script cache to v51. The full, unmodified check-evolution-fx.cjs passed every sheet, ink/fire start-loop-end phases, strike resolution, pause freeze, 12-spark cap, reuse, reset, reduced motion and read-only rendering, with no browser errors. Skill smoke passed; inspected refreshed desktop grass and phone desert screenshots, including the textured ink pools. No export blockers remain.

## October 1 — ten-minute itch demo and folder cleanup
- Follow-up user prompt: clean old docs/specs, unused assets and outdated code comments; package a ten-minute demo with a shortened monster roster centered on evolution. Clarification: runs must remain randomized rather than follow a prescribed recruitment sequence.
- Added `demo.html` and a packaged demo flag. The demo has a 600-second cutoff, five base monsters (Cat, Owl, Frog, Storm Lizard, Mollusc), and three evolutions (Octopus, Tengu, Axolotl). Cat/Owl/Frog start unlocked; the other two unlock as demo starters after capture with separate demo browser storage. Den type/order and positions vary by seed; later dens favor compatible ingredients. Regular demo enemy spawns draw from Bat, Owl, and Beast.
- Added `npm run build:demo`; its 16.7 MiB itch archive contains only the survivor runtime, selected source asset groups, three combat tracks, one menu track, and required licenses. Links inside the archive retain demo mode.
- Removed completed specs, plans, reviews and obsolete roadmaps. Moved campaign GDD/balance/ability notes to `docs/legacy`. Removed unreferenced Ninja Adventure audio/preview art and unused PatternMix colors; retained code-referenced files and licenses. Rewrote README, survivor and asset documentation and updated stale comments.
- `check-demo.cjs` passed on the exact package: 30 seeded starter/den combinations, all five starter-to-evolution paths, and the 10:00 cutoff. The full expedition evolution and expedition checks passed; the entrypoint check passed. The required web-game client completed with no console errors; its canvas-only capture was black on this Mac, so full-page Metal title, evolution and gameplay screenshots were reviewed instead.
- Remaining: human playtest of ten-minute pacing and den discoverability before inviting external players. The legacy `check-game.cjs` VM harness is stale: its context lacks `URLSearchParams`, and supplying that exposes an outdated stage-10 HP assertion. The browser entrypoint check and 132 literal legacy asset references passed.

## October 1 — demo parity corrections
- User specified forest only, Cat as the only starter, and the current Vercel opening as the gameplay reference: golem-looking Bat enemies alone during the first minute. Removed the demo's custom early enemy mix and restored the full game's spawn interval, later enemy selection, enemy art, and specialist wave rules. Demo dens appear at 1:00 so they cannot introduce other enemy types during that minute.
- Demo query parameters cannot select Desert or another starter. Captured creatures remain available in the bestiary and for evolution, without becoming demo starters.
- The initial load previously preloaded all packaged music. Demo music now loads tracks on demand after the first player interaction, and the itch package retains the same soundtrack list as the full game. The full game keeps its original preload behavior.
- Rebuilt the 24.8 MiB itch ZIP (238 files, including the full soundtrack). Packaged browser checks passed for forest/Cat, seeded den variation, first-minute Bat/golem appearance, original opening spawn interval, 1:00 dens, Octopus evolution, 10:00 cutoff, and deferred music. Full expedition and evolution browser checks passed. Required web-game client passed movement/dash with no errors; its canvas-only capture is black on this Mac, so the full-page title and gameplay screenshots were inspected.
- No Vercel or itch deployment was made. Live Vercel behavior was described by the user; exact live URL was not available for direct comparison.
- User flagged an unrequested title caption, "10 MIN · BREAK DENS · EVOLVE," and the missing hidden roster. Removed the caption and restored the five-portrait title grid and arrows. Unfound demo monsters are silhouettes; previewing them does not change the Cat starter. A capture reveals the portrait. Restored the original BEGIN label and changed the demo discovery stamp from NEW STARTER to NEW MONSTER. A diff audit also caught a demo-wide mouse-swarm suppression; swarms now resume after the requested Bat-only first minute. Packaged browser test verified all five portraits, unknown preview, Cat-only start, and reveal after discovery; screenshots were inspected.

## October 1 — guardian ending and starter retries
- User clarified that Cat is only the initial starter. Capturing Owl, Frog, Storm Lizard, or Mollusc unlocks that creature as a demo starter; the player can choose it on the title screen for a later run. Demo unlocks persist in the separate demo save. The prior forced Cat reset on every run was removed.
- The 9:30 guardian is the demo's final encounter. Ambient spawn intervals lengthen from 9:30 to 10:00, then ambient and den defenders stop spawning. The run can pass 10:00 and ends when that guardian dies or the player falls. The full expedition's later Ancient Guardian does not replace a living demo guardian. Defeating the demo guardian no longer triggers the full game's post-boss swarm.
- Rebuilt the 24.8 MiB itch archive. Packaged browser test passed the complete capture-to-unlock-to-retry flow, including UI selection after a page reload, overtime at 10:00, no further spawns, the same guardian after 19:00, and victory on its defeat. Full expedition and evolution checks passed. Required web-game client passed movement/dash and text state with no errors; its canvas-only screenshot remained black on this Mac, so packaged full-page title, unlocked-title, gameplay, and ending screenshots were inspected.

## October 2 — remaining agreed evolution roster
- Recovered the original twelve-recipe plan from this chat after Reed corrected an initial inferred list. Followed the agreed replacements: Frog + Mouse = Heart, Storm + Salamander = Kappa, Cat + Spider = Cyclope, Beast + Bear = MonkeyBoxerBlue. Other additions are Spirit, Panda, Mushroom and Trapdoor Spider. Added Bamboo as base twelve; every base has exactly two paths.
- Added survivor-evolution-roster.js for definitions/combat and wired parent rank transfer, source cleanup, party bonuses, upgrades, dashes, capture/unlocks, world wrapping, placeholder VFX and three-page bestiary. Kept the restricted demo roster and recipes intact. Existing unrelated demo work, cleanup deletions and relic changes preserved.
- First browser passes: all 24 recipe orders and prior evolution regression; eight new forms attacking/dashing with inherited stats; effects-on/off deterministic combat; guardian interception; desktop/touch bestiary paging; demo regression. Final visual/upgrade and regression checks underway.
- Final verification passed: evolution (24 capture orders), evolution-roster (all new attacks/dashes, inherited ranks, every unique upgrade at cap, bounded effects, effects-on/off combat equivalence, guardian interception), evolution-ui, evolution-fx, determinism, juice, and demo. The den shuffle now offers party-wide upgrades in the juice fixture; corrected its expectation to verify flights to every affected slot instead of assuming one recipient.
- Fixed portrait bestiary overflow with three recipes per portrait page and compact role bonuses, while retaining full descriptions/upgrades. Desktop uses four recipes per page. Visually inspected all eight new creatures in combat and desktop/phone bestiary pages. A real touch test selected Heart from the Heart/Spirit/Recruit offer successfully; inspected its screenshot. Skill smoke passed (known black canvas capture; full-page Metal screenshots used for visual QA).
- Current full game is twelve bases and twelve evolutions, with two recipes per base. Runtime/cache version 54. All eight additions have three evolved upgrades, inherited parent ranks, party HP/role benefits and dashes. Bespoke final VFX remain an art follow-up; the playable build uses existing sheets plus temporary silk/spore/spike geometry. Balance tuning through normal runs remains useful; no blocking implementation work remains.

## October 2 — tenfold combat units and Grasslands player
- User requested 10× HP/damage so percentage upgrades show visibly different integer popups, then requested the Pixelarium Grasslands playable character and its roll for dash.
- Scaled damage sources, flat ranks, Frog support, party/enemy/den/prop/boss HP, evolution HP, healing and enemy damage growth. Kept percentages, timing, range and collision unchanged; adjusted Bloodroot's excess-healing radius coefficient to preserve its footprint. Historical run records retain their original values; new run build tags distinguish the change.
- Added selected four-direction idle/walk and two lateral roll sheets under assets/player/grasslands, retaining the supplied license. Added simulation-driven survivor-player.js, replaced the player portrait, and included assets in the demo builder. Vertical rolls use the last lateral roll facing because the pack has no front/back rolls.
- New combat differential test passed against a pre-change fixture for base and upgraded creature/evolution attacks, dashes, enemy HP, bosses, Frog, healing, Bloodroot radius and Echo Fang. Explicit check: 30 damage with +8% leaves 67.6 HP out of 100 and displays 32. Player tests passed movement, directional art, roll frames, pause, distance/cooldown, wall collision and desktop/phone portraits. Screenshots visually inspected. Full regression run underway; updating fixtures that still encode old combat units.

- Final checks: combat-units, player-character, packaged demo, enemy-damage-growth, enemy-variety, summoners, player-aim, relic-growth (full run), party-growth, matching-dens, trial survivors, creatures, companion-rework, expedition (full timeline), survivor-encounters, relic-contracts, upgrade-packs and beats passed. Initial full sweep plus focused fixture reruns passes 33/41 checks. Eight unchanged checks fail identically against the saved pre-change runtime: opening-balance (spawn-rate expectation), dash-input (capture/evolution expectation), elements and capture-choice (Spider now offers evolution), exploration and feedback (old den headline), ui-foundation (upgrade pool expectation), and juice (existing owlPierce icon missing). These were not changed as part of combat units/player art.
- Skill smoke passed with the expected active roll and 400 HP in text state. Canvas-only export is black on this Mac; full-page Metal screenshots of idle, roll with a 32-damage popup, and phone HUD were inspected successfully. Character artwork is correctly aligned with its collision center. No runtime errors in targeted checks. The legacy campaign's existing check-combat-scale.cjs is preserved; the new survivor test is named check-combat-units.cjs.

## October 2 — slower dodge-roll preview
- Extended dash/roll from 0.18s to 0.35s, preserving 111.6 world-pixel travel and the 3s cooldown. Five rolling frames receive 40ms each; the two landing frames receive 75ms each. Companion dash-end effects still run at completion. Veil protection retains its prior cap.
- Updated dash-duration fixtures and documentation; cache-busted player/expansion scripts to v56. Player-character checks cover landing holds, pause, exact distance, cooldown and collision.

## October 3 — reduce enemy starting damage
- User requested 20% less enemy starting damage across the board. Both incoming damage paths now use enemyHitDamage(base): (base × 0.8 + global time bonus) × party protection. Covers ordinary/specialist contact, projectiles, boss attacks and ground hazards; preserves shield/invulnerability behavior and the global +10 growth steps. Contact-damage snapshots report the reduced base.
- Updated incoming-damage regression expectations and the combat-units fixture comparison for this intentional balance adjustment. Player attacks, HP, healing, cooldowns and spawn schedules are untouched. Cache-busted the changed runtime scripts to v57.
- Verification passed: enemy-damage-growth (base reduction, timed growth, contact, projectiles, hazards, protection and shields), combat-units, enemy-variety, player-aim, syntax checks and git diff --check. The skill browser smoke reached active gameplay at 6.07s with no reported errors; the full-page gameplay screenshot was inspected.

## October 3 — small knockback on all damaging effects
- User requested a small knockback for all effects. Replaced the shared 12-pixel offset with a consistent 16-pixel push in solid 4-pixel steps. Projectile flight direction prevents backward pushes after overshoot; origin/player/aim fallbacks make enemy-centered strikes and fields push reliably. Existing shield, fixed-target and unstoppable rules remain; Repelling Sweep retains 60 pixels and its stagger. Cache-busted survivors.js to v58.
- Added check-effect-knockback.cjs: all 24 damage sources, centered/overlapping hits, projectile direction, obstacles, shields, resistance, stronger upgrade and repeated actual fire-field ticks passed. Evolution-roster regression, syntax and diff checks passed. Required skill smoke reached playing at 6.07s without errors. Its canvas export is black on this Mac; inspected the full-page Metal gameplay screenshot with fire ticks and damage popups instead.

## October 3 — stagger enemy introductions
- User requested Demons at 1:00, Mages at 2:00 and axe-wielding Gladiators at 3:00. Added shared spawnUnlocked gates for regular wave selection and matching den defenders, preserving den/recruitment availability. Golems fill the first minute; minute two uses the 80/20 golem/demon mix. Existing specialist, mouse, mole, elite and boss schedules and spawn intervals remain. Updated changed script cache versions to v59.
- Verification passed: new browser test checks immediately before/at each unlock, full pool at 3:00, both boss support pools, and each gated den defender. Gameplay smoke reached 6.07s with only golem variants and no reported errors. Inspected the full-page Metal screenshot of all four enemy appearances at 3:00. Syntax and diff checks passed.

## October 10 — Twinshot Sigil relic
- Added Twinshot Sigil to the relic reward pool with a dedicated icon. It doubles player projectiles, Cat slashes, Owl/Tengu volleys, element attacks, ink attacks, and eligible ranged/effect evolution attacks, including dashes that create those effects.
- Kept Mole, Beast, Bear, Mouse, and their non-projectile evolved attacks out of the relic's eligible source set.
- Cache-busted the modified combat scripts. Browser testing was not run.

## October 11 — Embers earned in runs
- User agreed the Star Map currency is earned in-run and kept on a loss, but only for a completed run (won or lost); a restart forfeits: den 3–5, elite 1 (pack hunter 2), shrine challenge 3, hidden treasure 10, Guardian 10, Ancient Guardian 20, plus 1 per two minutes survived. Full expedition only.
- Added survivor-embers.js (drops, collection, banking in finishRun, save `scrollmonsters-embers-v1`), orange Coin2 pickups that spin and are pulled like gems, a HUD count after kills with a bump and +1 pop, and an `Embers +N · total saved` line on the end screen. Cache-busted changed scripts.
- check-embers.cjs: every source, collection, single banking, HUD, end line, win path, demo/trial off. All assertions pass; the run reports one 404 for assets/Enemies/energy_golem.png, which comes from an uncommitted survivor-enemies.js edit (the file on disk is golem_energy.png). check-expedition's shrine step also fails against the uncommitted six-spirit shrine waves, with or without Embers.

## October 11 — Star Map in the game
- User asked for a way to reach meta progression from the main menu, Star Map in Music's slot with music moved to a settings gear, and the screen plus the simple stars this pass.
- Added survivor-starmap.js: the prototype's 14-star constellation drawn in the DarkMode kit like the Bestiary, bought with saved Embers. Vitality, Ferocity, Fleet Foot, Quick Roll and Magnet apply at run start via scene.meta (HP, damage multiplier in hit(), move speed, dash cooldown with the HUD charge bar following, gem/coin pull range). Other stars read "Coming soon". Title gear opens a settings panel (Music, damage numbers, UI size). Full game only.
- Star icons load under star_<id> keys because the evolution loader remaps several upgrade_ keys. NativeView reuses Image objects between frames, so every image on this screen sets or clears its tint.
- check-starmap.cjs passes. embers, survivor-reliability, determinism, player-character and entrypoints pass. juice, ui-foundation, combat-units, dash-input and upgrade-packs fail with identical assertions on the previous commit too (stale expectations from the shrine/spawn reworks), so they are not from this change.
