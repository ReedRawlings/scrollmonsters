# ScollMonsters prototype

A portrait browser rail shooter with a southbound route, monster companions, and permanent upgrades.

## Play locally or on a phone

From this folder, start the server:

```sh
python3 -m http.server 5173 --bind 0.0.0.0
```

Open http://localhost:5173 on the Mac. For a phone, connect to the same Wi-Fi and open `http://<Mac-Wi-Fi-IP>:5173`. Find the Mac’s Wi-Fi IP with `ipconfig getifaddr en0` (or in macOS Wi-Fi settings). Keep the Mac awake and the server running. Saves are stored separately in each browser and site address.

Touch and drag to aim, or move the mouse. Firing and travel are automatic. After buying Hunter’s Eye in the Shared upgrade branch, tap the bottom combat button or press Space to toggle auto-targeting. Portrait orientation gives the largest playfield.

## Checks

```sh
node scripts/check-game.cjs
node scripts/check-opening.cjs
node scripts/check-mobile.cjs
node scripts/check-opening-browser.cjs
```

The browser check requires Playwright and Chromium installed, plus a running server on port 5173. Set `GAME_URL` to test a different server address.

Design: GDD.md. Tuning: BALANCE.md. Work log: progress.md.

## Reset for testing

Refresh to return to the title screen, then choose **RESET PROGRESS** and confirm. This removes only this game's save in the current browser on the current site address, then reloads into a fresh game. Cancel keeps your progress. Saves on other browsers or deployment URLs are separate.
