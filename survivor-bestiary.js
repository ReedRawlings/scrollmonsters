// Field Binder data and the lifetime bestiary record (2026-10-03).
// The record only reads game events; it never touches simulation state or randomness.
(() => {
  'use strict';
  const KEY = 'scrollmonsters-bestiary-v1', SEEN_EVO_KEY = 'scrollmonsters-seen-evolutions-v1', EVO_KEY = 'scrollmonsters-evolutions-v1';
  // Attack-style types: a base creature has one; a fusion takes one from each parent.
  const TYPES = {claw:['CLAW','#d9475f'],wing:['WING','#3fa6e0'],rush:['RUSH','#d9822b'],ward:['WARD','#25aaa6'],swarm:['SWARM','#6577a8'],
    earth:['EARTH','#5f9e30'],fire:['FIRE','#f2552e'],web:['WEB','#9a8cc4'],storm:['STORM','#e0aa12'],ink:['INK','#7d55e0']};
  // hp: the wild form's HP (survivors.js spawn(), survivor-encounters.js bosses). Fusions use their party HP bonus instead.
  // Species, types, attack and dash names, dex text and notes are draft copy.
  const ENTRIES = [
    {id:'cat',kind:'base',name:'Cat',sp:'CYCLOPS CAT',t:['claw'],hp:7,atk:['SWEEP','A wide melee arc. Upgrades push foes back.'],dash:'SWIPE AT END',dex:'Its one eye never blinks. It sweeps its tail in a wide arc and knocks foes away.',note:'It purrs when the whole party is at full health.'},
    {id:'owl',kind:'base',name:'Owl',sp:'VOLLEY OWL',t:['wing'],hp:6,atk:['FEATHER VOLLEY','Piercing feathers at long range. Can mark foes.'],dash:'FEATHER BURST',dex:'It watches from high stumps. Its feathers fly straight through a crowd.',note:'Its shed feathers always land facing north.'},
    {id:'beast',kind:'base',name:'Beast',sp:'HORN BEAST',t:['rush'],hp:9,atk:['CHARGE','Rams through groups. A shockwave follows.'],dash:'RAMMING DASH',dex:'It lowers its horns and charges. The ground shakes where it stops.',note:'It cannot turn in the middle of a charge.'},
    {id:'frog',kind:'base',name:'Frog',sp:'BUBBLE FROG',t:['ward'],hp:6,atk:['BUBBLE SHIELD','Blocks one hit. Every party hit deals +1.'],dash:'GAIN A SHIELD',dex:'Its croak blows a bubble around its friends. Allies near it hit harder.',note:'The bubble pops if it croaks off-key.'},
    {id:'mouse',kind:'base',name:'Mouse',sp:'PACK MOUSE',t:['swarm'],hp:2,atk:['PACK CALL','Calls 3 biters that chase foes.'],dash:'DROP BITERS',dex:'Never alone. One squeak calls a pack of small biters out of the grass.',note:'No one has counted the whole pack.'},
    {id:'mole',kind:'base',name:'Mole',sp:'RUMBLE MOLE',t:['earth'],hp:12,atk:['ERUPTION','A delayed blast under the biggest group.'],dash:'ERUPT AT END',dex:'It hears footsteps from below. Then the ground bursts under the crowd.',note:'It sleeps all day under old dens.'},
    {id:'bear',kind:'base',name:'Bear',sp:'QUAKE BEAR',t:['earth'],hp:28,atk:['CROSS TREMOR','A cross-shaped quake, strongest at the center.'],dash:'SMALL TREMOR',dex:'It slams both paws down. The quake runs out in a cross and staggers foes.',note:'Its tremor splits stumps in a perfect cross.'},
    {id:'salamander',kind:'base',name:'Salamander',sp:'EMBER NEWT',t:['fire'],hp:12,atk:['EMBER SPIT','Burning patches. Kills can spread fire.'],dash:'FIRE TRAIL',dex:'Its spit lights the grass. Foes that burn can pass the fire on.',note:'Rain does not put out its fire.'},
    {id:'spider',kind:'base',name:'Spider',sp:'RED WEAVER',t:['web'],hp:10,atk:['SNARE WEB','Webs slow foes. Webbed foes take +20%.'],dash:'WEB AT START',dex:'It strings red silk between trees. Prey caught in it takes more damage.',note:'Its red silk is stronger than rope.'},
    {id:'storm',kind:'base',name:'Storm Lizard',sp:'THUNDER GECKO',t:['storm'],hp:12,atk:['CHAIN BOLT','Lightning jumps across 3 foes.'],dash:'BOLT AT END',dex:'It basks in thunderstorms. A bolt from its tail jumps from foe to foe.',note:'Its tail glows before a storm.'},
    {id:'mollusc',kind:'base',name:'Mollusc',sp:'INK SNAIL',t:['ink'],hp:12,atk:['INK POOL','Ink pools that hurt and slow.'],dash:'INK SPLASH',dex:'It leaves a trail of dark ink. Foes that step in it slow down.',note:'The ink smells like old scrolls.'},
    {id:'octopus',kind:'fusion',name:'Octopus',sp:'REEF BRAWLER',t:['ink','claw'],bonus:'+15% vs slowed foes',atk:['TENTACLE SWEEP','Fast sweeps that spread slowing ink.'],dash:'INK SWEEP',dex:'Born when Cat and Mollusc merge. Its arms sweep the field and leave ink.',note:'Each arm keeps its own grudge.'},
    {id:'reptile',kind:'fusion',name:'Reptile',sp:'BLAZE DRAKE',t:['fire','rush'],bonus:'+6% party damage',atk:['BLAZE RUSH','Charges leave fire, then a heavy bite.'],dash:'FIRE CHARGE',dex:'Born from Salamander and Beast. It charges straight through its own fire.',note:'It runs hotter after every charge.'},
    {id:'tengu',kind:'fusion',name:'Tengu',sp:'STORM CROW',t:['wing','storm'],bonus:'+6% attack speed',atk:['STORM QUILLS','Piercing feathers chain lightning.'],dash:'LIGHTNING QUILLS',dex:'Born from Owl and Storm Lizard. Every feather it throws carries a spark.',note:'It mimics thunder to scare rivals.'},
    {id:'axolotl',kind:'fusion',name:'Axolotl',sp:'BUBBLE GUARD',t:['ward','ink'],bonus:'10% less damage taken',atk:['BUBBLE BURST','Shield pulses. Broken shields burst into ink.'],dash:'SHIELD RING',dex:'Born from Frog and Mollusc. When its shield breaks, ink sprays out.',note:'It smiles even when its shield breaks.'},
    {id:'shaman',kind:'foe',name:'Shaman',sp:'MASK SUMMONER',t:['swarm'],hp:18,goal:10,when:'FROM 1:30',atk:['SUMMON','Calls minions until it falls.'],dex:'It shakes a rattle and the grass fills with minions. Defeat it first.',note:'Its minions stop the moment it falls.'},
    {id:'guardian',kind:'boss',name:'Guardian',sp:'DEN GUARDIAN',t:['fire','earth'],hp:1200,goal:3,when:'ARRIVES 9:30',atk:['VOLLEY','Aimed shots, ring volleys and eruptions.'],dex:'It wakes when the field gets loud. It throws fire in rings and splits the ground.',note:'It guards the oldest den in the field.'},
    {id:'ancient',kind:'boss',name:'Ancient Guardian',sp:'ELDER GUARDIAN',t:['fire','earth'],hp:4000,goal:1,when:'ARRIVES 19:00',atk:['ELDER VOLLEY','Stronger volleys. Its fall ends the run.'],dex:'Older than the scrolls. Defeat it to finish the expedition.',note:'Its eye is the green of the first scroll.'},
  ];
  ENTRIES.forEach((e, i) => { e.no = String(i + 1).padStart(3, '0'); e.i = i; });
  const BY = Object.fromEntries(ENTRIES.map(e => [e.id, e]));
  const isFoe = e => e.kind === 'foe' || e.kind === 'boss';
  const recipeOf = id => SurvivorEvolution.recipes.find(r => r.id === id);
  const readList = key => { try { const v = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };

  class SurvivorBestiary {
    static entries = ENTRIES;
    static types = TYPES;
    static isFoe = isFoe;
    constructor(s) { this.s = s; this.data = this.load(); }
    // States: 0 unknown, 1 seen, 2 caught (foes: defeated, fusions: merged), 3 mastered.
    load() {
      let d = null; try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch {}
      if (d && d.v === 1 && d.c && d.f && d.viewed) return d;
      // First load: what the player already owns is not NEW; evolutions keep the old "viewed in the bestiary" flags.
      d = {v:1, c:{}, f:{}, viewed:{}};
      for (const id of this.s.unlocked || []) { d.c[id] = {seen:1, caught:0, merged:0, wins:0, best:0}; d.viewed[id] = 2; }
      const seenEvo = readList(SEEN_EVO_KEY);
      for (const id of readList(EVO_KEY)) if (BY[id]) { d.c[id] = {seen:1, caught:0, merged:0, wins:0, best:0}; if (seenEvo.includes(id)) d.viewed[id] = 2; }
      this.data = d; this.save(); return d;
    }
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch {} }
    rec(id) { return this.data.c[id] ??= {seen:0, caught:0, merged:0, wins:0, best:0}; }
    foe(id) { return this.data.f[id] ??= {seen:0, defeated:0}; }
    see(id) { if (!BY[id]) return; const r = isFoe(BY[id]) ? this.foe(id) : this.rec(id); if (!r.seen) { r.seen = 1; this.save(); } }
    defeat(id) { const f = this.foe(id); f.seen = 1; f.defeated++; this.save(); }
    // Called from scene.logEvent() during a run.
    event(type, data = {}) {
      const s = this.s;
      if (type === 'nests_appeared' || type === 'second_nests_appeared' || type === 'fusion_dens_appeared') for (const n of s.encounters?.nests || []) this.see(n.type);
      else if (type.endsWith('_captured')) { const id = type.slice(0, -9); if (BY[id]) { const r = this.rec(id); r.seen = 1; r.caught++; this.save(); } }
      else if (type === 'creature_merged' && BY[data.result]) { const r = this.rec(data.result); r.seen = 1; r.merged++; this.save(); }
      else if (type === 'boss_appeared') this.see(data.final ? 'ancient' : 'guardian');
      else if (type === 'boss_defeated') this.defeat(data.final ? 'ancient' : 'guardian');
    }
    // Called once from scene.finishRun(). A won expedition counts as a win for every creature in the final party.
    finish(status) {
      const s = this.s, dmg = {cat:s.catDamage, owl:s.owlDamage, beast:s.encounters?.beastDamage, ...(s.creatures?.damage || {})};
      for (const [id, v] of Object.entries(dmg)) if (BY[id] && v > 0) { const r = this.rec(id); r.best = Math.max(r.best, Math.round(v)); }
      if (status === 'won' && s.isExpedition) for (const id of s.expedition?.party() || []) if (BY[id]) this.rec(id).wins++;
      this.save();
    }
    caught(id) {
      const e = BY[id]; if (!e) return false;
      if (isFoe(e)) return (this.data.f[id]?.defeated || 0) > 0;
      if (e.kind === 'fusion') return (this.s.creatures?.evolution.discovered || readList(EVO_KEY)).includes(id);
      return (this.s.unlocked || []).includes(id);
    }
    state(id) {
      const e = BY[id]; if (!e) return 0;
      if (isFoe(e)) { const f = this.data.f[id]; return !f ? 0 : f.defeated >= e.goal ? 3 : f.defeated > 0 ? 2 : f.seen ? 1 : 0; }
      if (this.caught(id)) return (this.data.c[id]?.wins || 0) > 0 ? 3 : 2;
      return this.data.c[id]?.seen ? 1 : 0;
    }
    // Discoveries the binder has not shown yet; the title's Bestiary button wears NEW while any remain.
    unseen() { return ENTRIES.filter(e => this.state(e.id) > (this.data.viewed[e.id] ?? 0)).map(e => e.id); }
    // Marks the entry viewed; returns the state it was last shown in, so the binder can play the reveal once.
    view(id) { const now = this.state(id), was = this.data.viewed[id] ?? 0; if (now > was) { this.data.viewed[id] = now; this.save(); } return was; }
    recipes(id) { const e = BY[id]; if (!e) return []; return e.kind === 'fusion' ? [recipeOf(id)] : SurvivorEvolution.recipes.filter(r => r.parents.includes(id)); }
    ready(r) { return !this.caught(r.id) && r.parents.every(p => this.caught(p)); }
    goal(id) {
      const e = BY[id];
      if (!isFoe(e)) return 'Win a run with it in your party.';
      const d = this.data.f[id]?.defeated || 0;
      return e.goal === 1 ? 'Defeat it once.' : `Defeat ${e.goal} times (${Math.min(d, e.goal - 1)}/${e.goal}).`;
    }
    counts() { const c = ENTRIES.filter(e => !isFoe(e)); return {seen:c.filter(e => this.state(e.id) >= 1).length, own:c.filter(e => this.state(e.id) >= 2).length, total:c.length}; }
    summary() { return {states:Object.fromEntries(ENTRIES.map(e => [e.id, this.state(e.id)])), unseen:this.unseen(), wins:Object.fromEntries(Object.entries(this.data.c).filter(([, r]) => r.wins).map(([id, r]) => [id, r.wins])), foes:{...this.data.f}}; }
  }
  window.SurvivorBestiary = SurvivorBestiary;
})();
