/* Shared model for the four bestiary prototypes.
 *
 * Real data (taken from the game code): roster order, ability lines, upgrade names, evolution recipes,
 * cross-creature combos, base stats and foe behaviour numbers.
 * Mock data (placeholder, for layout only): flavour text, radar ratings, per-player history, save presets.
 *
 * Reveal model used by every prototype ("research rank", see README):
 *   0 Unknown   - nothing shown, "???"
 *   1 Seen      - name and silhouette only (Palworld-style)
 *   2 Captured  - portrait, type, role, ability, flavour text, radar
 *   3 Studied   - upgrades, dash, combos, personal history
 *   4 Mastered  - deep lore note and a mastery stamp
 */
window.Bestiary = (() => {
  const ASSETS = window.BESTIARY_ASSETS;

  /* ---------- Types: one colour per ability family ---------- */
  const TYPES = {
    claw:  { name: 'Claw',  color: '#ff6b9a' },
    brawn: { name: 'Brawn', color: '#ffb347' },
    gale:  { name: 'Gale',  color: '#7fe3c4' },
    water: { name: 'Water', color: '#3fb8e8' },
    pack:  { name: 'Pack',  color: '#b9c4a8' },
    earth: { name: 'Earth', color: '#c08a52' },
    fire:  { name: 'Fire',  color: '#ff5a36' },
    web:   { name: 'Web',   color: '#b58cff' },
    storm: { name: 'Storm', color: '#ffe14d' },
    ink:   { name: 'Ink',   color: '#7a72e8' },
  };

  const KINDS = {
    creature:  { label: 'Creatures',  ranks: ['Unknown', 'Seen', 'Captured', 'Studied', 'Mastered'], axes: ['POWER', 'TEMPO', 'REACH', 'CONTROL', 'SUPPORT'] },
    evolution: { label: 'Evolutions', ranks: ['Undiscovered', 'Hinted', 'Discovered', 'Studied', 'Mastered'], axes: ['POWER', 'TEMPO', 'REACH', 'CONTROL', 'SUPPORT'] },
    foe:       { label: 'Foes',       ranks: ['Unknown', 'Sighted', 'Defeated', 'Studied', 'Mastered'], axes: ['HEALTH', 'SPEED', 'DAMAGE', 'RANGE', 'SWARM'] },
  };

  // Requirement to reach rank i+1 (mock thresholds).
  const TASKS = {
    creature:  ['Meet it at a den', 'Capture it', 'Deal 1,000 damage with it', 'Win an expedition with it in your party'],
    evolution: ['Capture one parent', 'Merge the parents once', 'Merge it 5 times', 'Win an expedition with it in your party'],
    foe:       ['Spot one', 'Defeat one', 'Defeat 100', 'Defeat 500'],
  };

  /* ---------- Entries ---------- */
  const up = (name, detail) => ({ name, detail });
  const C = (o) => ({ kind: 'creature', where: 'Dens, from 0:30', ...o });
  const E = (o) => ({ kind: 'evolution', where: 'Merge two parents during an expedition', ...o });
  const F = (o) => ({ kind: 'foe', ...o });

  const ENTRIES = [
    /* ----- Creatures (11) ----- */
    C({ id: 'cat', no: '001', name: 'Cat', type: 'claw', role: 'Sweeper', blurb: 'Sweeping attacks and knockback',
      ability: 'Sweeps a wide arc around the party. Claws and reach grow with upgrades.', dash: 'Claw slash in a forward cone',
      flavor: 'One great eye, never blinking. It has never missed a mouse, and it wants you to know.',
      lore: 'Rumour says the eye sees a few seconds ahead. The cat says nothing and sweeps.',
      upgrades: [up('Sharpened Claws', 'Cat damage +1'), up('Wide Sweep', 'Reach +20% and a wider arc'), up('Repelling Sweep', 'Swipes knock foes away and stagger them')],
      facts: [['Attack', 'Sweep arc'], ['Starter', 'Always unlocked']], radar: [3, 4, 2, 3, 1], where: 'Always unlocked; also found in dens' }),
    C({ id: 'owl', no: '002', name: 'Owl', type: 'gale', role: 'Sniper', blurb: 'Piercing feathers and ranged volleys',
      ability: 'Fires piercing feathers in volleys at the nearest foe.', dash: 'Marks the nearest foe for 2s',
      flavor: 'Throws feathers instead of flying at things. Collects every one afterwards and counts them twice.',
      lore: 'Its marks are not a curse. They tell the whole party where to hit.',
      upgrades: [up('Razor Feathers', 'Feather damage +1'), up('Rapid Volley', 'Volleys 20% faster per rank'), up('Extra Feather', '+1 piercing projectile'), up('Splinter Feathers', 'Two splinters on hit at 33% damage'), up('Hunter Marks', 'Marked foes take +25% from the party')],
      facts: [['Damage', '3.2'], ['Interval', '1.1s']], radar: [3, 4, 5, 1, 2] }),
    C({ id: 'beast', no: '003', name: 'Beast', type: 'brawn', role: 'Charger', blurb: 'Charges through enemy groups',
      ability: 'Charges through a group in a straight line. Upgrades add a quake at the end.', dash: 'Damaging line charge',
      flavor: 'Charges first and asks nothing. Dens are easy to find by the trampled grass.',
      lore: 'Calm only when asleep. Even then, one foot twitches toward the nearest enemy.',
      upgrades: [up('Crushing Force', 'Charge +2 damage, quake +1'), up('Relentless Charge', 'Charges 20% faster per rank'), up('Quake Charge', 'Charge ends in a damaging shockwave')],
      facts: [['Charge', '4.8'], ['Quake', '3.2'], ['Interval', '2.0s']], radar: [4, 2, 4, 2, 1] }),
    C({ id: 'frog', no: '004', name: 'Frog', type: 'water', role: 'Guardian', blurb: 'Shields and +1 party hit damage',
      ability: 'Pulses a one-hit shield onto the player. Adds +1 damage to every party hit.', dash: 'Grants a one-hit shield',
      flavor: 'Sings a low chorus that makes friends hit harder. Sulks if nobody joins in.',
      lore: 'Its bubble shield pops with a sound exactly like a tiny, polite cough.',
      upgrades: [up('Bubble Rhythm', 'Shields 20% faster per rank'), up('Rallying Chorus', 'Shield pulse: 3s of bonus attack speed')],
      facts: [['Shield', 'One hit'], ['Party', '+1 hit damage']], radar: [1, 2, 2, 1, 5] }),
    C({ id: 'mouse', no: '005', name: 'Mouse', type: 'pack', role: 'Summoner', blurb: 'Summons temporary attackers',
      ability: 'Sends out a handful of mice that chase foes and nibble.', dash: 'Sends two mice at nearby foes',
      flavor: 'Never alone. Where there is one mouse there is a colony, and the colony has opinions.',
      lore: 'Wild mice swarm in growing packs. Tame ones remember who fed them.',
      upgrades: [up('Sharp Nibbles', 'Mouse damage +1'), up('Growing Colony', 'Summon +1 temporary mouse'), up('Scurrying Rhythm', 'Summons 20% faster per rank'), up('Feeding Frenzy', 'Helpers bite a second target after a kill')],
      facts: [['Damage', '2'], ['Mice', '3'], ['Interval', '2.8s']], radar: [2, 3, 3, 1, 1] }),
    C({ id: 'mole', no: '006', name: 'Mole', type: 'earth', role: 'Ambusher', blurb: 'Delayed eruptions beneath groups',
      ability: 'Marks the densest group. 0.7s later the ground erupts.', dash: 'Eruption where the dash ends',
      flavor: 'Surfaces exactly where you were about to stand. Rumoured to keep a map of your feet.',
      lore: 'Tame moles aim at the thickest crowd. They find it very funny.',
      upgrades: [up('Stonebreaker', 'Eruption damage +2'), up('Wide Eruption', 'Radius +12'), up('Rapid Burrowing', 'Attacks 20% faster per rank'), up('Aftershock', 'A second eruption follows the first'), up('Cracked Ground', 'Eruptions leave slowing ground for 2s')],
      facts: [['Damage', '8'], ['Radius', '65'], ['Interval', '2.8s']], radar: [4, 2, 2, 2, 1] }),
    C({ id: 'bear', no: '007', name: 'Bear', type: 'earth', role: 'Bruiser', blurb: 'Cross tremors, strongest at center',
      ability: 'Slams a cross-shaped tremor. Damage fades toward the tips. Foes stagger.', dash: 'Stunning burst around you',
      flavor: 'Treats the ground like a drum. The closer a foe is to the middle, the louder the note.',
      lore: 'A bear standing near you makes the whole forest feel a little safer.',
      upgrades: [up('Heavy Paws', 'Cross damage +2 at center, +1 at tips'), up('Reaching Tremor', 'Cross reaches +30 farther'), up('Steady Rhythm', 'Slams 20% faster per rank'), up('Staggering Roar', 'Slams stagger for +0.2s'), up('Safe Ground', 'Near the bear: take 25% less damage')],
      facts: [['Damage', '10'], ['Reach', '180'], ['Interval', '2.1s']], radar: [4, 2, 4, 3, 2] }),
    C({ id: 'salamander', no: '008', name: 'Salamander', type: 'fire', role: 'Zoner', blurb: 'Fire patches and spreading burns',
      ability: 'Spits fire that leaves burning patches. Burning kills spread more fire.', dash: 'Leaves a fire trail',
      flavor: 'Its spit smoulders for seconds after it lands. Pleasant to sit beside on a cold run.',
      lore: 'Sparks from fallen foes are gifts, as far as the salamander is concerned.',
      upgrades: [up('Hot Embers', 'Burn damage +1'), up('Quick Spit', 'Fire attacks 20% faster per rank'), up('Lasting Embers', 'Patches last +0.5s'), up('Fire Pool', 'Patch radius +6'), up('Wildfire', 'Burning kills spread a small fire patch')],
      facts: [['Damage', '3'], ['Interval', '2.6s'], ['Patch', '3s']], radar: [3, 3, 2, 2, 1] }),
    C({ id: 'spider', no: '009', name: 'Spider', type: 'web', role: 'Trapper', blurb: 'Damaging webs that slow and weaken',
      ability: 'Places webs. Foes inside take damage, slow down and take more damage from the party.', dash: 'Drops a web where the dash starts',
      flavor: 'Spins faster than it thinks. Anything that touches the silk turns brittle.',
      lore: 'Webs hum when a foe is near. The spider listens, and says nothing.',
      upgrades: [up('Brittle Silk', 'Webbed foes take +5% creature damage'), up('Quick Weaver', 'Webs placed 20% faster per rank'), up('More Silk', 'Keep one more web'), up('Wide Web', 'Web radius +5'), up('Tension Trap', 'Three foes in a web trigger a burst')],
      facts: [['Damage', '4'], ['Webs', '2'], ['Interval', '3.4s']], radar: [2, 2, 2, 5, 3] }),
    C({ id: 'storm', no: '010', name: 'Storm Lizard', type: 'storm', role: 'Chainer', blurb: 'Chain lightning and thunder strikes',
      ability: 'Fires lightning that jumps from foe to foe. Thunderhead calls down strikes.', dash: 'Lightning where the dash ends',
      flavor: 'Static builds on its scales until a bolt jumps off. Lightning prefers to visit friends.',
      lore: 'Tame storm lizards never strike their own party. They are very careful about it.',
      upgrades: [up('Charged Scales', 'Lightning damage +1'), up('Rapid Discharge', 'Attacks 20% faster per rank'), up('Forked Lightning', 'Hits one more foe'), up('Long Arc', 'Jump range +20'), up('Thunderhead', 'Every third hit calls a strike')],
      facts: [['Damage', '4'], ['Jumps', '3'], ['Interval', '2.0s'], ['Range', '130']], radar: [3, 4, 4, 1, 1] }),
    C({ id: 'mollusc', no: '011', name: 'Mollusc', type: 'ink', role: 'Slower', blurb: 'Ink pools that damage and slow',
      ability: 'Leaves ink pools that damage and slow foes standing in them.', dash: null,
      flavor: 'Slow, dark and endlessly patient. Leaves a pool of ink wherever it dreams.',
      lore: 'Ink never dries in a mollusc den. Visitors go home with stained feet.',
      upgrades: [up('Dark Ink', 'Ink damage +1'), up('Spreading Ink', 'Ink radius +8'), up('Lingering Ink', 'Ink lasts +0.5s')],
      facts: [['Damage', '2'], ['Radius', '44'], ['Interval', '2.6s']], radar: [2, 2, 2, 4, 1] }),

    /* ----- Evolutions (4) ----- */
    E({ id: 'octopus', no: '012', name: 'Octopus', type: 'ink', role: 'Sweeper', parents: ['cat', 'mollusc'], hp: 8,
      bonus: 'Slowed foes take +15% party damage', blurb: 'Tentacle sweeps spread slowing ink',
      ability: 'Tentacle sweeps spread slowing ink.', dash: null,
      flavor: 'Cat and mollusc, somehow. Eight arms sweep. The ink does the thinking.',
      lore: 'It keeps the cat\'s eye on one tentacle. The tentacle is not allowed to blink either.',
      upgrades: [up('Backhand Sweep', 'Also sweep behind Octopus'), up('Ink Flood', 'Ink radius +10'), up('Squeezing Grip', 'Tentacles deal +25% to inked foes per rank')],
      facts: [['Damage', '5'], ['Interval', '0.85s'], ['Radius', '140']], radar: [4, 4, 3, 4, 1] }),
    E({ id: 'reptile', no: '013', name: 'Reptile', type: 'fire', role: 'Charger', parents: ['salamander', 'beast'], hp: 12,
      bonus: '+6% party damage', blurb: 'Charges leave fire and end in a heavy bite',
      ability: 'Charges leave fire and end in a heavy bite.', dash: null,
      flavor: 'Part furnace, part freight train. Leaves a warm path and a very worried forest.',
      lore: 'The bite is the polite part. The charge is a conversation it has already won.',
      upgrades: [up('Blazing Wake', 'Fire trail radius +8'), up('Explosive Bite', 'Bites detonate burning targets'), up('Double Charge', 'Follow each charge with a shorter one')],
      facts: [['Damage', '7'], ['Bite', '8'], ['Interval', '2.0s']], radar: [5, 3, 4, 2, 1] }),
    E({ id: 'tengu', no: '014', name: 'Tengu', type: 'storm', role: 'Sniper', parents: ['owl', 'storm'], hp: 4,
      bonus: '+6% party attack speed', blurb: 'Piercing feathers chain lightning on impact',
      ability: 'Piercing feathers chain lightning on impact.', dash: null,
      flavor: 'Feathers that remember lightning. It never says where it learned that.',
      lore: 'A tengu\'s volley arrives before the sound of it. Foes report feeling surprised, then nothing.',
      upgrades: [up('Storm Feathers', 'Fire one more feather'), up('Conductive Plumage', 'Lightning hits one more foe'), up('Gathering Storm', 'Every third volley calls delayed thunder')],
      facts: [['Damage', '4'], ['Lightning', '3'], ['Interval', '1.5s']], radar: [4, 5, 5, 1, 2] }),
    E({ id: 'axolotl', no: '015', name: 'Axolotl', type: 'water', role: 'Guardian', parents: ['frog', 'mollusc'], hp: 12,
      bonus: '10% damage reduction; keeps Frog support', blurb: 'Shield pulses burst into slowing ink',
      ability: 'Shield pulses burst into slowing ink when blocked.', dash: null,
      flavor: 'Smiles through everything. Its shield pops into ink, and the ink slows whoever popped it.',
      lore: 'Nobody has seen it frown. Several foes have tried to make it.',
      upgrades: [up('Bubble Rhythm', 'Shield pulses 20% faster per rank'), up('Ink Halo', 'Shield-break ink radius +15'), up('Bubble Rally', 'Shield breaks grant 3s of +30% attack speed')],
      facts: [['Damage', '2'], ['Shield', '8s'], ['Ring', '100']], radar: [2, 2, 3, 4, 5] }),

    /* ----- Foes (9) ----- */
    F({ id: 'shaman', no: 'F01', name: 'Shaman', type: 'ink', role: 'Summoner', appears: 'From 1:30', calls: ['skeleton', 'lion'], variants: ['shaman', 'shamanGreen', 'shamanBlue'],
      blurb: 'Keeps its distance and calls help', flavor: 'Never fights its own fights. Always has a friend to introduce.',
      lore: 'Yellow and green shamans call skeletons. Blue ones have a way with lions.',
      behavior: 'Holds about 240 px away and summons up to two helpers every 6s. Blue shamans call lions, the rest call skeletons.',
      tell: 'Orange rings mark the summon spots for 1.2s.', counter: 'Rush it between casts. Clear the rings before they fill.',
      facts: [['HP', '18'], ['Speed', '52'], ['Contact', '5']], radar: [3, 1, 1, 3, 5] }),
    F({ id: 'hunter', no: 'F02', name: 'Hunter', type: 'gale', role: 'Archer', appears: 'From 2:00', variants: ['hunter'],
      blurb: 'Stops at range and fires one arrow at a time', flavor: 'Patient, polite and extremely accurate. Apologises after.',
      lore: 'Walls spoil its shot, so it will walk around them. It will always walk around them.',
      behavior: 'Approaches to about 420 px, aims for 1.5s, then fires. Only one hunter at a time. 3.8s between shots.',
      tell: 'A thin line follows you. It thickens and turns red 0.4s before the arrow leaves.', counter: 'Sidestep or dash once the line locks. Walls block the shot.',
      facts: [['HP', '12'], ['Speed', '65'], ['Contact', '5']], radar: [2, 2, 4, 5, 1] }),
    F({ id: 'skeleton', no: 'F03', name: 'Skeleton', type: 'pack', role: 'Swarmer', appears: 'Summoned', variants: ['skeleton'],
      blurb: 'Runs straight at you', flavor: 'Fast, brittle and numerous. Rattles when it is nervous, which is always.',
      lore: 'Shamans call them in pairs. Nobody has asked the skeletons.',
      behavior: 'Charges straight in. Dies to almost anything.',
      tell: 'None. They arrive in pairs.', counter: 'Area attacks erase them. Stop the shaman to stop the flow.',
      facts: [['HP', '5'], ['Speed', '72'], ['Contact', '5']], radar: [1, 3, 1, 1, 4] }),
    F({ id: 'lion', no: 'F04', name: 'Lion', type: 'brawn', role: 'Pouncer', appears: 'Summoned', variants: ['lion'],
      blurb: 'Sprints at you and hits hard on contact', flavor: 'Not interested in conversation. Possibly interested in you.',
      lore: 'Blue shamans call lions the way other people call for tea.',
      behavior: 'Runs at you faster than anything else on the field.',
      tell: 'None.', counter: 'Webs and ink catch it. Contact deals 10.',
      facts: [['HP', '10'], ['Speed', '80'], ['Contact', '10']], radar: [2, 4, 3, 1, 2] }),
    F({ id: 'golem', no: 'F05', name: 'Golem', type: 'earth', role: 'Walker', appears: 'From the start', variants: ['golem', 'golemForest', 'golemEnergy'],
      blurb: 'The most common foe', flavor: 'A pile of rocks that decided to walk. Nobody told it where.',
      lore: 'Forest golems grow moss. Energy golems grow opinions. Both are rare.',
      behavior: 'Walks at you in numbers. About 5% are Forest golems (25% faster and tougher). About 1% are elite Energy golems.',
      tell: 'None.', counter: 'Keep moving. Save your area attacks for crowds.',
      facts: [['HP', '4+'], ['Speed', '68'], ['Contact', '7']], radar: [1, 3, 2, 1, 5] }),
    F({ id: 'demon', no: 'F06', name: 'Demon', type: 'fire', role: 'Brute', appears: 'Dens and waves', variants: ['demon', 'demonGreen'],
      blurb: 'Heavy hitter that marches at you', flavor: 'Slow, loud and proud of both.',
      lore: 'The green kind is bigger. It is also, somehow, prouder.',
      behavior: 'Marches at you and hits hard. The elite Green Demon is drawn at twice the size.',
      tell: 'None.', counter: 'Kite it. Slows and stuns pay off.',
      facts: [['HP', '9'], ['Speed', '47'], ['Contact', '12']], radar: [3, 1, 4, 1, 1] }),
    F({ id: 'mage', no: 'F07', name: 'Ninja Mage', type: 'storm', role: 'Caster', appears: 'Dens and waves', variants: ['mage', 'mageBlack'],
      blurb: 'Stops and fires an orb straight at you', flavor: 'Hides in plain sight. Is not hiding.',
      lore: 'Black mages are rarer and see no reason to aim carefully.',
      behavior: 'Stops, aims, fires. Black mages fire a spread of three.',
      tell: 'A red line previews each shot.', counter: 'Strafe sideways. Dash through the spread.',
      facts: [['HP', '6'], ['Speed', '68'], ['Shots', '1 or 3']], radar: [1, 3, 3, 4, 1] }),
    F({ id: 'gladiator', no: 'F08', name: 'Gladiator', type: 'claw', role: 'Duelist', appears: 'Dens and waves', variants: ['gladiator'],
      blurb: 'Slams, then spins its axe in a full circle', flavor: 'Wins crowds over. Loses patience with everyone else.',
      lore: 'The spin is for show. The slam is for business.',
      behavior: 'Walks up, winds up for 1s, then spins for 0.7s. Spin deals 12. Contact deals 9.',
      tell: 'The axe lifts overhead during the 1s windup.', counter: 'Stay outside the spin ring. Punish the 2.8s recovery.',
      facts: [['HP', '28'], ['Speed', '32'], ['Spin', '12']], radar: [5, 1, 5, 2, 1] }),
    F({ id: 'guardian', no: 'F09', name: 'Guardian', type: 'fire', role: 'Boss', appears: '9:30, final form at 19:00', variants: ['guardian'],
      blurb: 'Miniboss with three volley patterns', flavor: 'Stands guard over a place nobody has asked it to guard.',
      lore: 'Its final form arrives at 19:00. It uses 20 projectiles in a ring and no apology.',
      behavior: 'Cycles aimed volleys, ring bursts and ground eruptions under your feet. Contact deals 12.',
      tell: 'Orange circles mark each eruption before it fires.', counter: 'Dash out of the circles. Hide in the gaps of the ring.',
      facts: [['Appears', '9:30'], ['Final', '19:00'], ['Contact', '12']], radar: [5, 2, 4, 4, 3] }),
  ];

  const BY_ID = Object.fromEntries(ENTRIES.map((e) => [e.id, e]));
  const byKind = (kind) => ENTRIES.filter((e) => e.kind === kind);

  // Cross-creature combos (the game's "comboFire/comboWeb/comboStorm/comboShield" upgrades).
  const SYNERGIES = [
    { a: 'salamander', b: 'beast', name: 'Blazing Charge', detail: 'Beast charge leaves fire.' },
    { a: 'spider', b: 'cat', name: 'Silk Ripper', detail: 'Cat swipes burst nearby webs.' },
    { a: 'storm', b: 'owl', name: 'Conductive Feathers', detail: 'Owl feathers chain lightning (1s cooldown).' },
    { a: 'spider', b: 'frog', name: 'Sheltering Silk', detail: 'Frog shield blocks leave a web.' },
  ];
  const synergiesOf = (id) => SYNERGIES.filter((s) => s.a === id || s.b === id);
  const childrenOf = (id) => ENTRIES.filter((e) => e.parents?.includes(id));

  /* ---------- Save state (mock) ---------- */
  const rankMap = (creatures, evolutions, foes) => {
    const ids = [...byKind('creature'), ...byKind('evolution'), ...byKind('foe')].map((e) => e.id);
    const all = Object.assign({}, creatures, evolutions, foes);
    return Object.fromEntries(ids.map((id) => [id, all[id] || 0]));
  };
  const PRESETS = {
    mid: { label: 'Mid-game', unseen: ['spider', 'reptile', 'lion'],
      ranks: rankMap({ cat: 4, owl: 3, beast: 3, frog: 2, mouse: 2, mole: 1, bear: 1, salamander: 2, spider: 3, storm: 1, mollusc: 1 },
        { reptile: 3, axolotl: 1 }, { shaman: 2, hunter: 1, skeleton: 4, lion: 3, golem: 4, demon: 2, mage: 2, gladiator: 1, guardian: 2 }) },
    fresh: { label: 'New save', unseen: ['cat'],
      ranks: rankMap({ cat: 2, mouse: 1, owl: 1 }, {}, { skeleton: 1, golem: 1 }) },
    full: { label: 'Complete', unseen: [],
      ranks: Object.fromEntries(ENTRIES.map((e) => [e.id, 4])) },
  };

  const STORE = 'bestiary-proto-v1';
  let state = null;
  const listeners = [];
  const load = () => {
    try { const v = JSON.parse(sessionStorage.getItem(STORE)); if (v && v.ranks) return v; } catch (e) { /* ignore */ }
    return null;
  };
  const save = () => { try { sessionStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ } };
  const apply = (key) => {
    const p = PRESETS[key];
    state = { preset: key, ranks: { ...p.ranks }, viewed: ENTRIES.filter((e) => !p.unseen.includes(e.id)).map((e) => e.id) };
    save();
  };
  state = load();
  if (!state) apply('mid');
  const emit = (why) => listeners.forEach((fn) => fn(why));

  const rank = (id) => state.ranks[id] || 0;
  const setRank = (id, r) => { state.ranks[id] = Math.max(0, Math.min(4, r)); state.preset = 'custom'; save(); emit({ id, rank: state.ranks[id] }); };
  const isNew = (id) => rank(id) > 0 && !state.viewed.includes(id);
  const markViewed = (id) => { if (!state.viewed.includes(id)) { state.viewed.push(id); save(); } };
  const preset = (key) => { apply(key); emit({ preset: key }); };
  const gate = (id, min) => rank(id) >= min;
  const onChange = (fn) => listeners.push(fn);
  const rankName = (id) => KINDS[BY_ID[id].kind].ranks[rank(id)];

  // Evolutions show "?" until merged; every other kind shows its name from rank 1.
  const nameVisible = (id) => rank(id) >= (BY_ID[id].kind === 'evolution' ? 2 : 1);
  const shownName = (id) => (nameVisible(id) ? BY_ID[id].name : '???');

  const progress = (id) => {
    const e = BY_ID[id]; const r = rank(id);
    const all = byKind(e.kind);
    return { known: all.filter((x) => rank(x.id) >= (x.kind === 'evolution' ? 2 : 1)).length, owned: all.filter((x) => rank(x.id) >= 2).length, total: all.length };
  };
  const totals = () => {
    const known = ENTRIES.filter((e) => nameVisible(e.id)).length;
    const full = ENTRIES.filter((e) => rank(e.id) >= 4).length;
    return { known, full, total: ENTRIES.length };
  };

  // Deterministic mock history so numbers stay stable between renders.
  const hash = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const history = (id) => {
    const e = BY_ID[id]; const h = hash(id); const r = rank(id);
    if (e.kind === 'foe') return [['Defeated', (r >= 4 ? 520 : r >= 3 ? 130 : r >= 2 ? 3 + h % 9 : 0) + h % 40], ['Times it beat you', h % 7], ['First met', r >= 1 ? ['2 days ago', 'Last week', 'Yesterday', '3 days ago'][h % 4] : '-']];
    return [['Expeditions', r >= 4 ? 18 + h % 20 : r >= 3 ? 5 + h % 6 : 1 + h % 3], ['Total damage', ((r >= 4 ? 9000 : r >= 3 ? 2400 : 400) + (h % 900)).toLocaleString('en-US')], ['Wins', r >= 4 ? 4 + h % 6 : r >= 3 ? 1 + h % 2 : 0]];
  };
  const nextTask = (id) => {
    const e = BY_ID[id]; const r = rank(id);
    if (r >= 4) return null;
    const h = hash(id);
    const done = { creature: [null, null, 150 + h % 800, 0], evolution: [null, null, 1 + h % 4, 0], foe: [null, null, 20 + h % 70, 100 + h % 380] }[e.kind][r];
    const total = { creature: [1, 1, 1000, 1], evolution: [1, 1, 5, 1], foe: [1, 1, 100, 500] }[e.kind][r];
    return { text: TASKS[e.kind][r], done: done == null ? 0 : done, total, toRank: KINDS[e.kind].ranks[r + 1] };
  };

  /* ---------- Sprites ---------- */
  const css = document.createElement('style');
  css.id = 'bestiary-base';
  css.textContent = `
    .bsprite{display:block;flex:none;background-repeat:no-repeat;image-rendering:pixelated}
    .bface{display:block;flex:none;image-rendering:pixelated;object-fit:contain}
    .sil{filter:var(--sil-filter, brightness(0) invert(.22) sepia(.6) hue-rotate(215deg) saturate(2.4))}
    .bpx{font-family:'NovelMix',ui-monospace,monospace;-webkit-font-smoothing:none;font-smooth:never;letter-spacing:0}
    .bdemo{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:9999;display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;max-width:calc(100vw - 16px);padding:6px 8px;border-radius:14px;background:rgba(10,8,16,.92);border:1px solid rgba(255,255,255,.16);box-shadow:0 6px 24px rgba(0,0,0,.5);font:600 11px/1 system-ui,sans-serif;color:#cfc8e0}
    .bdemo b{font-size:10px;letter-spacing:.08em;color:#8f87a8;margin-right:2px}
    .bdemo button,.bdemo a{font:inherit;color:#e8e2f7;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:6px 9px;cursor:pointer;text-decoration:none;min-height:28px;display:inline-flex;align-items:center}
    .bdemo button:hover,.bdemo a:hover{background:rgba(255,255,255,.16)}
    .bdemo button.on{background:#ffc41b;border-color:#ffc41b;color:#1a1020}
    .bdemo .sep{width:1px;align-self:stretch;background:rgba(255,255,255,.14)}
  `;
  document.head.appendChild(css);
  if (ASSETS && 'FontFace' in window) {
    new FontFace('NovelMix', `url(${ASSETS.font})`).load().then((f) => { document.fonts.add(f); }).catch(() => {});
  }

  const place = (el) => {
    const s = ASSETS.sprites[el.dataset.spr]; const sc = +el.dataset.scale;
    const [col, row] = s.frames[(+el.dataset.f) % s.frames.length];
    el.style.backgroundPosition = `${-col * s.fw * sc}px ${-row * s.fh * sc}px`;
  };
  let tick = 0;
  setInterval(() => {
    tick++;
    document.querySelectorAll('.bsprite[data-anim="1"]').forEach((el) => {
      const s = ASSETS.sprites[el.dataset.spr];
      if (s.frames.length === 2 && tick % 2) return;
      el.dataset.f = (+el.dataset.f + 1) % s.frames.length;
      place(el);
    });
  }, 150);

  // Animated sprite. `scale` is an integer pixel multiplier.
  const sprite = (id, { scale = 4, sil = false, anim = true, cls = '' } = {}) => {
    const s = ASSETS.sprites[id]; const el = document.createElement('div');
    el.className = `bsprite${sil ? ' sil' : ''}${cls ? ' ' + cls : ''}`;
    el.dataset.spr = id; el.dataset.scale = scale; el.dataset.anim = anim ? '1' : '0';
    el.dataset.f = anim ? Math.floor(Math.random() * s.frames.length) : 0;
    Object.assign(el.style, { width: s.fw * scale + 'px', height: s.fh * scale + 'px', backgroundImage: `url(${s.sheet})`, backgroundSize: `${s.w * scale}px ${s.h * scale}px` });
    place(el);
    return el;
  };
  // Square portrait: faceset when the game has one, otherwise a still frame of the sprite.
  const portrait = (id, { size = 76, sil = false, cls = '' } = {}) => {
    const s = ASSETS.sprites[id];
    if (s.face && !sil) {
      const img = document.createElement('img');
      img.className = `bface${sil ? ' sil' : ''}${cls ? ' ' + cls : ''}`; img.src = s.face; img.alt = '';
      img.style.width = img.style.height = size + 'px';
      return img;
    }
    const box = document.createElement('div');
    box.style.cssText = `width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;flex:none`;
    if (cls) box.className = cls;
    box.appendChild(sprite(id, { scale: Math.max(1, Math.floor((size * 0.95) / Math.max(s.fw, s.fh))), sil, anim: false }));
    return box;
  };

  /* ---------- Radar ---------- */
  const radar = (id, { size = 180, color, mask = false } = {}) => {
    const e = BY_ID[id]; const axes = KINDS[e.kind].axes; const c = size / 2; const R = size * 0.27;
    const pt = (i, v) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; return [c + Math.cos(a) * R * (v / 5), c + Math.sin(a) * R * (v / 5)]; };
    const ring = (v) => axes.map((_, i) => pt(i, v).join(',')).join(' ');
    const shape = e.radar.map((v, i) => pt(i, v).join(',')).join(' ');
    const labels = axes.map((l, i) => { const [x, y] = pt(i, 6.5); return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="${Math.max(8, size / 20)}" fill="currentColor" opacity=".7" style="font-family:NovelMix,monospace">${l}</text>`; }).join('');
    const spokes = axes.map((_, i) => `<line x1="${c}" y1="${c}" x2="${pt(i, 5)[0]}" y2="${pt(i, 5)[1]}" stroke="currentColor" opacity=".18"/>`).join('');
    const col = color || TYPES[e.type].color;
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="overflow:visible" role="img" aria-label="Ratings: ${axes.map((l, i) => l + ' ' + e.radar[i]).join(', ')}">
      ${[1, 2, 3, 4, 5].map((v) => `<polygon points="${ring(v)}" fill="none" stroke="currentColor" opacity="${v === 5 ? .35 : .15}"/>`).join('')}
      ${spokes}${mask ? '' : `<polygon points="${shape}" fill="${col}" fill-opacity=".38" stroke="${col}" stroke-width="2" stroke-linejoin="round"/>${e.radar.map((v, i) => `<circle cx="${pt(i, v)[0]}" cy="${pt(i, v)[1]}" r="2.5" fill="${col}"/>`).join('')}`}${labels}</svg>`;
  };

  /* ---------- Cry (tiny synth blip, Pokédex-style) ---------- */
  let actx = null;
  const cry = (id) => {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const h = hash(id); const t0 = actx.currentTime; const base = 180 + (h % 380);
      const o = actx.createOscillator(); const g = actx.createGain();
      o.type = ['square', 'sawtooth', 'triangle'][h % 3];
      o.frequency.setValueAtTime(base, t0);
      o.frequency.exponentialRampToValueAtTime(base * (0.5 + ((h >> 3) % 20) / 10), t0 + 0.18);
      o.frequency.exponentialRampToValueAtTime(base * 0.8, t0 + 0.34);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.36);
      o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + 0.4);
    } catch (e) { /* audio unavailable */ }
  };

  /* ---------- Demo bar (prototype tooling, not part of the design) ---------- */
  const PAGES = [['v1-field-guide.html', '1 Field Guide'], ['v2-hunters-journal.html', '2 Journal'], ['v3-card-binder.html', '3 Binder'], ['v4-evolution-web.html', '4 Web']];
  const demoBar = ({ extra = '' } = {}) => {
    if (/[?&]embed\b/.test(location.search)) return null; // gallery previews hide the tooling
    const bar = document.createElement('div'); bar.className = 'bdemo';
    const here = location.pathname.split('/').pop();
    const draw = () => {
      bar.innerHTML = '<b>DEMO</b>' + Object.entries(PRESETS).map(([k, p]) => `<button data-p="${k}" class="${state.preset === k ? 'on' : ''}">${p.label}</button>`).join('')
        + (extra ? '<span class="sep"></span>' + extra : '') + '<span class="sep"></span><a href="index.html">All</a>'
        + PAGES.map(([f, l]) => `<a href="${f}" style="${f === here ? 'background:rgba(255,255,255,.22)' : ''}">${l.split(' ')[0]}</a>`).join('');
    };
    draw();
    bar.addEventListener('click', (ev) => { const b = ev.target.closest('button[data-p]'); if (b) preset(b.dataset.p); });
    onChange(draw);
    document.body.appendChild(bar);
    return bar;
  };

  // Tiny element builder: h('div', {class:'x', onclick:fn, style:{...}}, child, [children])
  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') for (const [p, val] of Object.entries(v)) (p.startsWith('--') ? el.style.setProperty(p, val) : (el.style[p] = val));
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) { if (kid == null || kid === false) continue; el.append(kid.nodeType ? kid : document.createTextNode(kid)); }
    return el;
  };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  return { ENTRIES, BY_ID, byKind, KINDS, TYPES, TASKS, SYNERGIES, PRESETS, synergiesOf, childrenOf,
    rank, setRank, isNew, markViewed, preset, gate, onChange, rankName, nameVisible, shownName, progress, totals, history, nextTask,
    sprite, portrait, radar, cry, demoBar, h, esc, hash, assets: ASSETS };
})();
