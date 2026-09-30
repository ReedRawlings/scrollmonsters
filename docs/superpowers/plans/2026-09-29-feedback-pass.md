# Playtest Feedback Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Act on the 2026-09-29 playtest:
- No text over the map except the den header.
- A 2x capture zone.
- The picked upgrade visibly lifts off its card.
- The prototype's home screen (flip, ‹ › arrows, BEGIN brackets).
- A desktop view that matches the phone's creature scale.
- A desktop UI-size setting.

**Architecture:** Each item is a local change to the module that owns it:
- `announce()` and the HUD world labels.
- The capture radius and ring.
- The upgrade screen's dismiss beat.
- The title screen.
- The canvas size and UI scale.

The last item (1440×960 plus the UI scale) touches layout everywhere, so it goes last and re-baselines checks deliberately.

**Tech Stack:** Phaser 4.2.1, plain browser JS, Playwright checks run by `node scripts/test-survivors.cjs`.

**Spec:** `docs/superpowers/specs/2026-09-28-reward-juice-design.md`, amended by the user's 2026-09-29 decisions recorded below.

## Global Constraints (user decisions, 2026-09-29)

- "We should only see a header notification when the monster den appears." No other banner and no world-anchored text: no upgrade or pickup names, no shrine callouts, no phase ("ranged enemies") callouts, no capture percentage label. Error text (save failures) stays.
- The capture zone is 2x: radius 70 → 140 world px. The capture ring and fill draw at 6x instead of 3x. The shrine circle is unchanged.
- The desktop (landscape) canvas becomes 1440×960, so creatures appear the same physical size as on a phone. Portrait stays 540×960.
- A UI-size setting, landscape only, lives in the pause menu:
  - **Normal** (default): UI scale 2, logical 720×480.
  - **Large**: UI scale 3, logical 480×320, which is today's size.
  - Portrait is always UI scale 2, logical 270×480.
  - The setting persists in `scrollmonsters-survivor-settings-v1`, merged with `damageNumbers`.
- Presentation never changes the simulation, apart from the two deliberate balance changes here: the capture radius, and the spawn distance that follows the bigger desktop view. Every check that moves because of them is re-baselined with a ledger line (old → new).
- Never `git add -A`.

## Review Focus

1. **Landscape layouts at 720×480.** Every screen must be centred and on screen: title, pause (with and without relics), won/lost, upgrade, relic, pack, unlock. Test: Task 5, `landscape screens at both sizes`.
2. **Switching the UI size mid-run.** The HUD, notices, juice layer (flights, pops) and hit areas must all move to the new scale on the next frame, with no stale positions. Test: Task 5, `resize mid-run`.
3. **Taps on the title arrows and faces during the flip.** They must never leave the hero face at scaleX 0. Test: Task 4, `rapid arrows`.
4. **Locked faces.** They must not start a run with a locked starter. Test: Task 4, `locked`.
5. **The den header.** It must still show after the announce purge. Test: Task 1.

---

### Task 1: No map exposition except the den header

**Files:** `survivors.js` (`announce`, new `headline`), `survivor-encounters.js:117` and `survivor-expedition.js:53` (den calls), `survivor-hud.js` (`worldLabels` removed). Tests: `scripts/check-feedback.cjs` (new, added to the suite). Any check asserting removed text is re-baselined.

- [ ] **Step 1: Write the failing check.** In `scripts/check-feedback.cjs`, use the same `open/state` helpers as `check-upgrade-packs.cjs`. Then:
  - Start a run, then call `announce('Elite defeated!')`, `announce('Shrine challenge 1/3!')` and `expedition.phaseName` via a phase tick. Assert `s.noticeTime === 0` (no banner).
  - Call `s.headline('A den of monsters appears')` and assert `s.notice === 'A den of monsters appears' && s.noticeTime > 0`.
  - Put a ready capture body, a pickup and an active shrine in view. `draw()`, then walk `s.ui` Texts. Assert none match `/CAPTURE|WILD OWL|SHRINE|FRENZY|SHIELD|XP MAGNET|CLEANSE|\+8 HP/`.
  - Drive the real den path: set `elapsed` to 150 and call `expedition.update`. Assert that the den header is the notice.
- [ ] **Step 2:** Run it and watch it fail.
- [ ] **Step 3: Implement.**
  - `announce(message){}` becomes a no-op with the comment `// Map callouts are off by design (playtest 2026-09-29); only headline() shows a header.`
  - Add `headline(message){this.notice=message;this.noticeTime=4;}`.
  - Change both den `announce('A den of monsters appears')` calls to `headline(...)`.
  - Delete `worldLabels` and its call in `SurvivorHud.draw`.
- [ ] **Step 4:** Run it and watch it pass. Then run the full suite and re-baseline checks that asserted removed text (for example `check-exploration.cjs` `notice`, `check-ui-foundation.cjs` capture label and wrapped notice). Use `headline()` wherever a test needs a notice on screen. Ledger each one.
- [ ] **Step 5:** Commit: `feat(ui): no map callouts except the den header`.

### Task 2: Capture zone 2x

**Files:** `survivor-expedition.js:37` (`<70` → `<CAPTURE_R`, with `const CAPTURE_R=140`), and `survivor-juice.js` `ring()` (a scale parameter; capture rings pass 6, shrine keeps 3). Test: `check-feedback.cjs`.

- [ ] **Step 1: Failing check.** For a ready capture body, put the player at 120 px. One tick: progress rises. At 150 px, progress does not rise. The capture ring sprite `scaleX === 6`, and the shrine ring stays at 3.
- [ ] **Step 2:** Watch it fail.
- [ ] **Step 3:** Implement. `ring(id,x,y,fill01,{tint,alpha,scale=3})` sets `setScale(scale)` on the ring and the fill. `updateWorld`'s capture calls pass `scale:6`.
- [ ] **Step 4:** Watch it pass. Run the full suite and re-baseline capture-timing checks (`check-capture-choice`, `check-expedition`, and others). Ledger each.
- [ ] **Step 5:** Commit: `feat(capture): 2x capture zone`.

### Task 3: The picked upgrade lifts off its card

**Files:** `survivor-screens.js` (a `dismiss` beat drawn while `mode==='playing'` for 260ms after a pick), `survivor-juice.js` `onUpgrade` (records the pick for the screen). Test: `check-feedback.cjs`.

- [ ] **Step 1: Failing check.** Open a level-up at 1100×760, wait 420ms, and click card 1. After 80ms, assert:
  - card 1's label text is still visible;
  - the other two cards' labels are gone;
  - a flight exists whose `from` lies inside card 1's rect.
  After 400ms, card 1's label is gone.
- [ ] **Step 2:** Watch it fail. Card 1's label is gone immediately today.
- [ ] **Step 3: Implement.**
  - `juice.onUpgrade` stores `this.picked={card:{...card},choice:{name,detail,id},at:now}`. It is cleared in `reset()`.
  - `SurvivorScreens.draw` calls `this.dismiss(w,h)` whenever `s.juice.picked` is younger than 260ms, in any mode.
  - `dismiss` draws only the chosen card:
    - brightness flash for the first 60ms (skipped under reduced motion);
    - then alpha from 1 to 0 and scale from 1 to 0.9 about its centre over 260ms;
    - no dim, no hit areas.
  - The flight still starts at the card's icon (`card.x+24`), so it visibly lifts off the card.
- [ ] **Step 4:** Watch it pass. Take a screenshot and look at it. Run the full suite.
- [ ] **Step 5:** Commit: `feat(juice): picked upgrade card lingers and the icon lifts off it`.

### Task 4: Prototype home screen (flip, arrows, brackets)

**Files:** `survivor-screens.js` `title()`, `survivors.js` `chooseStarter()` (records `starterAt` and `starterFrom` for presentation). Test: `check-feedback.cjs`.

Behaviour (prototype Moment "menu"):
- `‹` and `›` pills sit either side of the hero portrait (portrait: 30×28 at (46,110) and (194,110); landscape: level with the hero's centre, 8px outside it). They step to the previous or next **unlocked** roster entry, wrapping around.
- Flip on change:
  - the hero face squashes scaleX 1→0 over 80ms (ease-in), then swaps to the new face;
  - it grows 0→1.1→1 over 220ms with an 8px lift at the midpoint;
  - 8 white sparkles burst from the hero centre (juice `popText` isn't suitable, so use `juice.play('Reward_Trail',…,{ui:true})` ×8 at spread offsets from `juice.rand()`);
  - reduced motion: an instant swap.
- The selection bracket slides from the old face to the new one over 150ms (a back-out ease).
- The name and description slide up 5px while fading in: 180ms and 200ms, the description 50ms behind.
- A locked face shakes for 220ms (±4px). The name becomes `???` and the description becomes `Capture one in an expedition to unlock it` in `D().danger`. The starter does not change.
- BEGIN always shows the four white corner brackets, the same ones the selected face uses, 6px outside the card.

- [ ] **Step 1: Failing check.**
  - `‹`/`›` controls exist in portrait and landscape. Tapping `›` sets `s.starter` to the next unlocked entry.
  - 40ms after the change, the hero image `scaleX < 1`. 400ms after, it is 1.
  - `rapid arrows`: tap `›` five times, 30ms apart, then wait 400ms. Hero `scaleX === 1`, and the face texture is `face_`+`s.starter`.
  - `locked`: with only `cat` unlocked, tapping a locked face leaves `s.starter === 'cat'` and shows the `???` text.
  - BEGIN brackets: `s.screens.layout.beginBrackets` equals the card rect.
- [ ] **Step 2:** Watch it fail.
- [ ] **Step 3:** Implement as described. Timings come from `s.juice.now()` minus `s.starterAt`. `chooseStarter` records the previous starter as `starterFrom` and returns early for locked ids after setting `s.lockedTap={id,at}`.
- [ ] **Step 4:** Watch it pass. Look at portrait and landscape screenshots mid-flip and at rest. Run the full suite.
- [ ] **Step 5:** Commit: `feat(title): flip, arrows, sliding selection and BEGIN brackets from the prototype`.

### Task 5: 1440×960 desktop canvas and the UI-size setting

**Files:** `survivors.js` (canvas config, `UI` → `this.uiScale()`, `uiSize`, `toUI`, the draw group scale), `survivor-juice.js` (the front layer scale follows `s.uiScale()` each update; the settings merge), `survivor-screens.js` (landscape title laid out in a centred 480×320 frame; pause pill `UI size: Normal/Large`, landscape only), checks. Test: `check-feedback.cjs`.

- [ ] **Step 1: Failing check.**
  - At a 1100×760 viewport, the canvas is 1440×960, `uiScale()` is 2, and `uiSize()` is 720×480.
  - Switching to Large from the pause pill gives `uiScale()` 3 and `uiSize()` 480×320. It persists across a reload, and the settings key still holds `damageNumbers`.
  - Portrait 390×844: canvas 540×960, `uiScale()` 2, no UI-size pill.
  - `landscape screens at both sizes`: for each mode (title, paused, paused with 13 relics, upgrade, relic, pack, unlock, won), at Normal and at Large, `offscreenTexts` is empty. Save screenshots.
  - `resize mid-run`: start a flight, switch size, draw. The juice front scale equals the new `uiScale()`, and the pause pill is clickable at its new position.
- [ ] **Step 2:** Watch it fail.
- [ ] **Step 3: Implement.**
  - Game config: `width:portrait?540:1440,height:960`.
  - `uiScale(){return this.scale.width<this.scale.height?2:(this.juice?.uiLarge?3:2);}`. Replace every `UI` use in `survivors.js` with it.
  - Juice: `this.front.setScale(this.s.uiScale())` in `update()`. Settings are read into `uiLarge`, and a `saveSettings()` helper writes `{damageNumbers, uiLarge}` merged.
  - Title landscape: offset every `L` coordinate by `((w-480)/2,(h-320)/2)`.
  - Any other landscape layout found off-centre or offscreen by the check gets the same frame treatment. Ledger each one.
- [ ] **Step 4:** Watch it pass. Look at every screenshot. Run the full suite. Re-baseline checks whose numbers move because the landscape view (and spawn radius `max(cam.w,cam.h)*.64`) grew, with a ledger line per file giving old → new.
- [ ] **Step 5:** Commit: `feat(view): 1440x960 desktop canvas and a Normal/Large UI size setting`.

### Task 6: Docs

`UI_STYLE_GUIDE.md`: in Scale and space, the desktop canvas and UI sizes. In Juice, the dismiss beat and title motion. Add a new "Map text" rule (den header only). Update the spec's Canvas and HUD rows to match. Commit: `docs: playtest feedback pass`.
