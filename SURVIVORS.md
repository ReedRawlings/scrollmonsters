# Survivor expedition

The current game runs from `survivors.html`. Its default expedition lasts twenty minutes, with a Guardian encounter and an Ancient Guardian finale. `survivors.html?trial` keeps the two-minute trial. `demo.html` opens the ten-minute itch demo.

## Demo rules

The demo is a forest-only run. Cat is the initial starter. The title shows the five-monster demo roster, with unfound monsters as silhouettes; captured monsters can be selected as starters on later runs, just as in the full game. Owl, Frog, Storm Lizard, and Mollusc can be captured and revealed in the bestiary. The available evolutions are Octopus, Tengu, and Axolotl. The guardian appears at 9:30. Ambient spawns taper off and stop at 10:00, but the fight continues until the guardian is defeated or the player falls.

Runs retain randomized maps, den positions, enemy spawns, pickups, upgrades, and capture decisions. The first minute has only Bat enemies with their current golem art; dens appear at 1:00. Later enemy pacing follows the full expedition, and later dens favor currently compatible monsters. There is no prescribed recruitment or merge sequence.

A den opens a capture ring when destroyed. Stand in the ring to choose between evolution, recruitment, or leaving the creature. Evolution consumes the compatible ally and the newly captured monster, carries eligible upgrades into the new form, and records the discovery.

## Development

Run `npm run dev` for a local server. `node scripts/check-demo.cjs` checks the forest start, unlocked starters, randomized dens, opening enemies, an evolution, and the guardian ending. `npm run build:demo` creates the itch archive. The full-game browser suite is `npm run test:survivors`.

The demo entry uses `?demo` locally. The packaged HTML sets the demo flag directly, so navigating back from run history or adding query parameters cannot enter the full expedition.

## Full expedition evolutions

The full expedition has twelve base creatures and twelve evolutions. Each base has two paths; capture a compatible creature at a den to replace one teammate with its evolved form. The party still has three creature slots. Evolutions cannot merge again or become starters.

| Parents | Evolution | Combined attack |
| --- | --- | --- |
| Cat + Mollusc | Octopus | Tentacle sweeps and slowing ink |
| Cat + Spider | Cyclope | Binding silk followed by a heavy cleave |
| Frog + Mollusc | Axolotl | Shields that break into ink |
| Frog + Mouse | Heart | Heart guardians, shielding and projectile interception |
| Mouse + Owl | Spirit | Homing, piercing wisps |
| Owl + Storm Lizard | Tengu | Piercing feathers and chain lightning |
| Storm Lizard + Salamander | Kappa | Burning lightning builds into storm rings |
| Salamander + Beast | Reptile | Fire-trail charges and heavy bites |
| Beast + Bear | Monkey Boxer | Charge into a directional ground slam |
| Bear + Bamboo | Panda | Cross tremors with lingering bamboo spikes |
| Bamboo + Mole | Mushroom | Eruptions that plant infectious spore patches |
| Mole + Spider | Trapdoor Spider | Eruptions with pulling, weakening web craters |

Bamboo is capturable from full-expedition dens and unlocks as the twelfth starter. It grows slowing spike lines before evolving. Each added form has three unique upgrades. Parent ranks transfer into the corresponding damage, timing, size, duration, summon or special behavior; consumed parents' ongoing attacks are cleared. Heart retains Frog support. New forms add 40–140 maximum/current HP and a role bonus shown on their cards.

The bestiary has three desktop pages or four portrait pages of recipes, with discovery saved between runs. The new abilities use existing sheets, creature sprites and temporary terrain geometry; custom effect art can replace their presentation without changing combat. Definitions and new combat live in `survivor-evolution-roster.js`; presentation stays in `survivor-evolution-fx.js`. `scripts/check-evolution-roster.cjs` covers recipe coverage, both capture orders, inheritance, combat, dashes, effects-on/off equivalence, guardian interception and desktop/touch bestiary paging.

## Combat units and player art

Combat HP, damage, healing and flat upgrades use ten times the original prototype units: starting party HP is 400, a basic player shot is 20, Cat sweeps deal 24, Frog adds 10 per hit, and Tough Hide adds/heals 80 HP. Enemy, den, prop and boss HP scale with damage, preserving combat pacing. Percentage bonuses, attack intervals, ranges, shields that block one hit, and damage reduction are unchanged. HP retains fractional damage; popups round only for display. The pre-scale balance fixture in `scripts/fixtures/combat-before-scale.json` verifies attacks, evolved abilities, dashes and healing after normalizing units.

The player uses the Pixelarium Grasslands character, with four-direction idle/walk sheets and lateral dodge-roll sheets. `survivor-player.js` samples animation frames from simulation time, so pausing freezes the roll. The roll travels 111.6 world pixels over 0.35 seconds, with longer landing frames. It retains its 3-second cooldown, collision rules and companion effects; vertical dashes use the most recent lateral roll facing. The portrait uses the same character. The full game and packaged demo share these assets and combat units.

Enemy attack bases receive a 0.8 multiplier before the global time-based damage bonus and party protection. This applies to contact, projectile, boss and ground-hazard damage in all survivor modes. For example, a normal golem hit starts at 56 instead of 70; the global +10 damage steps are unchanged.

All damaging party effects share a small 16-pixel knockback, including periodic damage from fields. Projectiles push in their travel direction; melee and area effects push away from their origin, falling back to away from the player (then aim direction) for centered hits. Solid steps stop at obstacles. Shields block the push; dens, props, bosses, elites and committed Beast charges retain their resistance. Repelling Sweep keeps its stronger 60-pixel push and stagger.
