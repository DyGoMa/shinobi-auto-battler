// BattleSim.js — deterministic, seeded, DOM-free lane battle simulation.
// The browser (Renderer) and the Node tools (sim.mjs, campaign-sim.mjs) run
// exactly the same code. All numbers come from balance.js.
//
// Usage:
//   const sim = new BattleSim({ player, enemies, objective, seed, enemyFactory });
//   sim.step(dtSeconds);            // advance (fixed internal tick)
//   sim.fireUlt(uid);               // player taps a portrait
//   sim.runToEnd({ ultMode:'asap' })// headless: play to the end
//   sim.state -> 'running' | 'won' | 'lost'
import { BALANCE } from '../config/balance.js';
import { makeRng, computeHit, bestNature, natureRelation, clamp } from './formulas.js';

export const LANE_WIDTH = 1280;

export class BattleSim {
  /**
   * cfg = {
   *   player: [unitSpec],            // from Ninja.buildPlayerUnit (order = slot order)
   *   enemies: [{ spec, delay? }],   // from Ninja.buildEnemyUnit
   *   civilians: [unitSpec],         // protected units (role Civilian)
   *   objective: { type: 'defeatAll'|'survive'|'protect'|'defeatBoss', seconds?, protect? },
   *   enemyFactory: (enemyId, { isAdd, bossUnit }) => unitSpec, // for summons
   *   seed, balance, recordEvents (default true), ultsEnabled (default true)
   * }
   */
  constructor(cfg) {
    this.B = cfg.balance || BALANCE;
    this.cfg = cfg;
    this.rng = makeRng(cfg.seed ?? 1);
    this.time = 0; this._acc = 0;
    this.tick = this.B.combat.tick;
    this.units = [];
    this.events = [];
    this.telegraphs = [];
    this.recordEvents = cfg.recordEvents !== false;
    this.ultsEnabled = cfg.ultsEnabled !== false;
    this.state = 'running';
    this.objective = cfg.objective || { type: 'defeatAll' };
    this.enemyFactory = cfg.enemyFactory || null;
    this.nextUid = 1;
    this.pending = [];
    this.stats = { ults: 0, playerUlts: [], clashes: { overpower: 0, standoff: 0, overwhelmed: 0 }, damageByUnit: {}, effective: 0, resisted: 0 };
    this.clashEnabled = !!this.B.jutsuClash.enabled;
    const L = this.B.combat.lane;

    // Player units: melee in front, then mid, then long range (stable by slot).
    const players = (cfg.player || []).map((s, i) => ({ s, i }))
      .sort((a, b) => (a.s.range - b.s.range) || (a.i - b.i));
    players.forEach(({ s }, idx) => this._addUnit(s, 'player', L.playerFrontX - idx * L.allySpacing));
    const rearX = L.playerFrontX - Math.max(0, players.length - 1) * L.allySpacing;
    (cfg.civilians || []).forEach((s, i) => this._addUnit(s, 'player', Math.max(40, rearX - L.allySpacing - 20 - i * L.allySpacing)));
    // Enemies: those without delay spawn now, melee in front (stable by list order).
    let eIdx = 0;
    const now = (cfg.enemies || []).map((e, i) => ({ e, i })).filter(({ e }) => !(e.delay > 0))
      .sort((a, b) => (a.e.spec.range - b.e.spec.range) || (a.i - b.i));
    for (const { e } of now) this._addUnit(e.spec, 'enemy', L.enemyFrontX + (eIdx++) * L.allySpacing);
    for (const e of (cfg.enemies || [])) if (e.delay > 0) this.pending.push({ at: e.delay, spec: e.spec });
    this._emit({ type: 'start' });
  }

  // ---------------------------------------------------------------------------
  // Setup helpers
  // ---------------------------------------------------------------------------
  _addUnit(spec, side, x) {
    const u = {
      ...spec, uid: this.nextUid++, side, x,
      hp: spec.startHp != null ? Math.min(spec.startHp, spec.maxHp) : spec.maxHp,
      chakra: clamp((spec.startChakraOverride ?? spec.startChakra ?? 0) + (side === 'enemy' ? this.rng() * (this.B.combat.enemyStartChakraMax || 0) : 0), 0, this.B.combat.chakra.max),
      alive: true, deadAt: null, attackTimer: this.rng() * spec.attackInterval * 0.6 + 0.2,
      statuses: [], shield: 0, shieldUntil: 0, activeNature: spec.natures?.[0] || null,
      invulnUntil: 0, casting: null, revived: false, reflectUntil: 0, targetUid: null,
      mechState: (spec.mechanics || []).map(m => ({ next: (m.firstAt ?? m.every) != null ? this._jitter(m.firstAt ?? m.every) : null, hpFired: [], swapIdx: 0 })),
      permAtk: 1, permSpeed: 1, lastHitBy: null,
    };
    if (u.hp <= 0) { u.alive = false; u.hp = 0; }
    this.units.push(u);
    this.stats.damageByUnit[u.uid] = 0;
    this._emit({ type: 'spawn', uid: u.uid });
    return u;
  }

  _jitter(seconds) { const j = this.B.combat.timingJitter || 0; return seconds * (1 + (this.rng() * 2 - 1) * j); }

  _emit(ev) { if (this.recordEvents) { ev.t = this.time; this.events.push(ev); } }
  drainEvents() { const e = this.events; this.events = []; return e; }

  unit(uid) { return this.units.find(u => u.uid === uid); }
  alive(side) { return this.units.filter(u => u.alive && u.side === side); }
  fighters(side) { return this.units.filter(u => u.alive && u.side === side && !u.protected); }

  // ---------------------------------------------------------------------------
  // Status effects
  // ---------------------------------------------------------------------------
  _addStatus(u, type, value, duration) { u.statuses.push({ type, value, until: this.time + duration }); }
  _has(u, type) { return u.statuses.some(s => s.type === type && s.until > this.time); }
  _sum(u, type) { let v = 0; for (const s of u.statuses) if (s.type === type && s.until > this.time) v += s.value; return v; }
  _max(u, type) { let v = 0; for (const s of u.statuses) if (s.type === type && s.until > this.time) v = Math.max(v, s.value); return v; }
  atkOf(u) { return u.atk * u.permAtk * (1 + this._sum(u, 'atkBuff')); }
  intervalOf(u) { return u.attackInterval / u.permSpeed; }
  drOf(u) { return Math.min(0.9, this._max(u, 'dr')); }
  isStunned(u) { return this._has(u, 'stun'); }

  // ---------------------------------------------------------------------------
  // Main loop
  // ---------------------------------------------------------------------------
  /** Advance by real seconds (clamped by caller). Runs fixed ticks. */
  step(dt) {
    if (this.state !== 'running') return;
    this._acc += Math.min(dt, 0.25);
    let guard = 0;
    while (this._acc >= this.tick && this.state === 'running' && guard++ < 20) {
      this._acc -= this.tick;
      this._tick(this.tick);
    }
  }

  /** Headless: run until the battle ends. ultMode: 'none' | 'asap' | 'smart'. */
  runToEnd({ ultMode = 'asap' } = {}) {
    const maxTicks = Math.ceil((this.B.combat.timeLimit + 5) / this.tick) + 10;
    for (let i = 0; i < maxTicks && this.state === 'running'; i++) {
      if (ultMode !== 'none') this.botUlts(ultMode);
      this._tick(this.tick);
      if (!this.recordEvents) this.events.length = 0;
    }
    if (this.state === 'running') this.state = 'lost';
    return this.state;
  }

  _tick(dt) {
    this.time += dt;
    const B = this.B;
    // Delayed spawns
    for (let i = this.pending.length - 1; i >= 0; i--) {
      if (this.time >= this.pending[i].at) {
        const p = this.pending.splice(i, 1)[0];
        this._addUnit(p.spec, 'enemy', this._rearSpawnX('enemy'));
      }
    }
    // Expire statuses and shields; passive chakra
    const passive = (B.combat.chakra.passivePerSec || 0) * dt;
    for (const u of this.units) {
      if (u.alive && !u.protected && !u.casting && passive > 0 && (u.side === 'player' || u.jutsu)) this._gainChakra(u, passive);
      if (u.statuses.length) u.statuses = u.statuses.filter(s => s.until > this.time);
      if (u.shield > 0 && this.time >= u.shieldUntil) { u.shield = 0; this._emit({ type: 'shieldEnd', uid: u.uid }); }
    }
    // Mechanics (bosses & special enemies)
    for (const u of this.units) if (u.alive && u.mechanics.length) this._runMechanics(u, dt);
    // Telegraphs (wind-ups)
    this._updateTelegraphs();
    // Units act
    for (const u of this.units) {
      if (!u.alive || u.protected) continue;
      if (this.isStunned(u)) continue;
      if (u.casting) continue; // channeling a jutsu
      const tgt = this._findTarget(u);
      u.targetUid = tgt ? tgt.uid : null;
      if (!tgt) { this._move(u, null, dt); continue; }
      const dist = Math.abs(tgt.x - u.x);
      // Melee-type units (melee/reach) keep closing to contact; ranged stop at range.
      const closeIn = u.range <= this.B.stats.ranges.reach + 0.5 && dist > this.B.combat.lane.contactGap + 0.5;
      if (dist > u.range || closeIn) this._move(u, tgt, dt, closeIn);
      if (Math.abs(tgt.x - u.x) <= u.range + 0.5) {
        u.attackTimer -= dt;
        if (u.attackTimer <= 0) {
          u.attackTimer = this.intervalOf(u);
          this._autoAttack(u, tgt);
        }
      }
    }
    this._resolveSpacing();
    // Enemy jutsu (their "ultimates"): start a telegraph when chakra is full.
    if (B.enemyScaling.enemyJutsu.enabled) {
      for (const u of this.units) {
        if (!u.alive || u.side !== 'enemy' || !u.jutsu || u.casting || this.isStunned(u)) continue;
        if (u.chakra >= B.combat.chakra.max) this._startEnemyJutsu(u);
      }
    }
    // Deaths
    for (const u of this.units) if (u.alive && u.hp <= 0) this._kill(u);
    this._checkEnd();
  }

  _rearSpawnX(side) {
    const L = this.B.combat.lane;
    const mates = this.units.filter(u => u.alive && u.side === side && !u.protected);
    if (side === 'enemy') {
      const rear = mates.reduce((m, u) => Math.max(m, u.x), -Infinity);
      return Math.max(LANE_WIDTH - 40, rear + L.allySpacing);
    }
    const rear = mates.reduce((m, u) => Math.min(m, u.x), Infinity);
    return Math.min(40, rear - L.allySpacing);
  }

  // ---------------------------------------------------------------------------
  // Targeting & movement
  // ---------------------------------------------------------------------------
  _opponents(u) { return this.units.filter(o => o.alive && o.side !== u.side); }

  /** Divers (targeting 'protected') slip past the enemy line toward the protect target. */
  _isDiver(u) { return u.targeting === 'protected' && this.units.some(o => o.alive && o.protected && o.side !== u.side); }

  _findTarget(u) {
    const opp = this._opponents(u);
    if (!opp.length) return null;
    if (u.side === 'enemy') {
      const taunter = opp.find(o => this._has(o, 'taunt'));
      if (taunter && Math.abs(taunter.x - u.x) <= u.range + 0.5) return taunter;
    }
    if (u.targeting === 'protected') { const p = opp.find(o => o.protected); if (p) return p; }
    const inRange = opp.filter(o => Math.abs(o.x - u.x) <= u.range + 0.5);
    // "Defeat the boss" objectives: your units focus a boss whenever one is in range.
    if (u.side === 'player' && this.objective.type === 'defeatBoss') {
      const boss = inRange.find(o => o.isBoss);
      if (boss) return boss;
    }
    if (u.targeting === 'backline' && inRange.length) {
      return inRange.reduce((a, b) => (Math.abs(b.x - u.x) > Math.abs(a.x - u.x) ? b : a));
    }
    const pool = inRange.length ? inRange : opp;
    let best = null, bd = Infinity;
    for (const o of pool) {
      const d = Math.abs(o.x - u.x);
      if (d < bd - 0.01 || (Math.abs(d - bd) <= 0.01 && best && o.hp < best.hp)) { bd = d; best = o; }
    }
    return best;
  }

  _move(u, tgt, dt, closeIn = false) {
    const L = this.B.combat.lane;
    if (u.moveSpeed <= 0) return;
    const sideDir = u.side === 'player' ? 1 : -1;
    const dir = tgt ? (Math.sign(tgt.x - u.x) || sideDir) : sideDir;
    let nx = u.x + dir * u.moveSpeed * dt;
    // Don't overshoot desired range (melee-type units close to contact)
    if (tgt) {
      const want = tgt.x - dir * (closeIn ? L.contactGap : u.range);
      if (dir > 0) nx = Math.min(nx, want); else nx = Math.max(nx, want);
    }
    // Blocked by allies ahead (queue, no stacking) and by opponents (contact).
    // Divers ignore blocking on their way to the protect target.
    if (!this._isDiver(u)) {
      for (const o of this.units) {
        if (!o.alive || o === u || o.protected || (o.side === u.side && this._isDiver(o))) continue;
        const ahead = dir > 0 ? o.x > u.x : o.x < u.x;
        if (!ahead) continue;
        const gap = o.side === u.side ? L.allySpacing : L.contactGap;
        if (dir > 0) nx = Math.min(nx, o.x - gap); else nx = Math.max(nx, o.x + gap);
      }
    }
    nx = clamp(nx, 20, LANE_WIDTH + 200);
    if (dir > 0 ? nx > u.x : nx < u.x) u.x = nx;
  }

  _resolveSpacing() {
    const L = this.B.combat.lane;
    const ps = this.units.filter(u => u.alive && u.side === 'player' && !u.protected).sort((a, b) => b.x - a.x);
    for (let i = 1; i < ps.length; i++) if (ps[i].x > ps[i - 1].x - L.allySpacing) ps[i].x = ps[i - 1].x - L.allySpacing;
    const es = this.units.filter(u => u.alive && u.side === 'enemy' && !this._isDiver(u)).sort((a, b) => a.x - b.x);
    for (let i = 1; i < es.length; i++) if (es[i].x < es[i - 1].x + L.allySpacing) es[i].x = es[i - 1].x + L.allySpacing;
  }

  // ---------------------------------------------------------------------------
  // Damage
  // ---------------------------------------------------------------------------
  _autoAttack(u, tgt) {
    this._emit({ type: 'attack', uid: u.uid, target: tgt.uid });
    if (this.rng() < (this.B.combat.dodgeChance || 0)) this._emit({ type: 'miss', uid: tgt.uid, src: u.uid });
    else this._damage(u, tgt, 1, { kind: 'auto' });
    this._gainChakra(u, this.B.combat.chakra.perAttackSecond * u.attackInterval);
  }

  _gainChakra(u, amt) {
    const max = this.B.combat.chakra.max;
    const before = u.chakra;
    u.chakra = Math.min(max, u.chakra + amt * (u.chakraGainMult ?? 1));
    if (u.side === 'player' && before < max && u.chakra >= max) this._emit({ type: 'ultReady', uid: u.uid });
  }

  /** Deal damage from src to tgt with power multiplier. Returns damage dealt. */
  _damage(src, tgt, power, opts = {}) {
    if (!tgt.alive) return 0;
    const B = this.B;
    if (this.time < tgt.invulnUntil) { this._emit({ type: 'immune', uid: tgt.uid }); return 0; }
    const nat = opts.nature !== undefined
      ? (opts.nature ? { ...bestNature([opts.nature], tgt.activeNature, {}, B) } : { mult: 1, relation: 0 })
      : bestNature(src.natures?.length ? (src.activeNature && src.side === 'enemy' ? [src.activeNature] : src.natures) : [], tgt.activeNature, { taijutsu: src.taijutsu }, B);
    let natureMult = nat.mult;
    if (nat.relation > 0) natureMult += (src.natureBonus || 0);
    const hit = computeHit({
      atk: this.atkOf(src), def: tgt.def, level: src.level, power,
      critChance: opts.noCrit ? 0 : src.critChance, natureMult,
      defIgnore: src.taijutsu ? B.combat.taijutsuDefIgnore : 0, dr: this.drOf(tgt) + (opts.extraDR || 0),
    }, this.rng, B);
    let dmg = hit.dmg;
    if (tgt.shield > 0) {
      const a = Math.min(tgt.shield, dmg); tgt.shield -= a; dmg -= a;
      if (tgt.shield <= 0) { tgt.shield = 0; this._emit({ type: 'shieldBreak', uid: tgt.uid }); }
    }
    tgt.hp -= dmg; tgt.lastHitBy = src.uid;
    if (nat.relation > 0) this.stats.effective++; else if (nat.relation < 0) this.stats.resisted++;
    this.stats.damageByUnit[src.uid] = (this.stats.damageByUnit[src.uid] || 0) + dmg;
    this._emit({ type: 'damage', uid: tgt.uid, src: src.uid, amount: dmg, crit: hit.crit, relation: nat.relation, nature: nat.nature || null, kind: opts.kind || 'auto', absorbed: hit.dmg - dmg });
    // Chakra from taking hits
    if (dmg > 0) this._gainChakra(tgt, B.combat.chakra.onHitPerPctHp * (dmg / tgt.maxHp) * 100);
    // Lifesteal (mechanic)
    const ls = src.mechanics?.find(m => m.type === 'lifesteal');
    if (ls && dmg > 0 && src.alive) this._heal(src, dmg * ls.pct, src);
    // Reflect stance (mechanic)
    if (!opts.reflected && dmg > 0 && tgt.reflectUntil > this.time && src.alive) {
      const refl = tgt.mechanics.find(m => m.type === 'reflect');
      const amt = Math.max(1, Math.round(hit.dmg * (refl?.pct ?? 0.3)));
      src.hp -= amt;
      this._emit({ type: 'damage', uid: src.uid, src: tgt.uid, amount: amt, crit: false, relation: 0, kind: 'reflect' });
    }
    return dmg;
  }

  _heal(u, amount, src) {
    if (!u.alive) return;
    const amt = Math.max(0, Math.min(u.maxHp - u.hp, Math.round(amount)));
    u.hp += amt;
    if (amt > 0) this._emit({ type: 'heal', uid: u.uid, amount: amt, src: src?.uid });
  }

  _kill(u) {
    const rev = u.mechanics.find(m => m.type === 'reviveOnce');
    if (rev && !u.revived) {
      u.revived = true; u.hp = Math.round(u.maxHp * rev.hpPct); u.invulnUntil = this.time + (rev.invuln ?? 1.5);
      u.statuses = []; u.casting = null;
      this.telegraphs = this.telegraphs.filter(t => t.caster !== u.uid);
      this._emit({ type: 'revive', uid: u.uid, name: rev.name || 'Revive' });
      return;
    }
    u.alive = false; u.hp = 0; u.deadAt = this.time; u.casting = null;
    this.telegraphs = this.telegraphs.filter(t => t.caster !== u.uid);
    this._emit({ type: 'death', uid: u.uid });
  }

  // ---------------------------------------------------------------------------
  // Player ultimates + Jutsu Clash
  // ---------------------------------------------------------------------------
  canUlt(uid) {
    const u = this.unit(uid);
    return !!(this.ultsEnabled && this.state === 'running' && u && u.alive && u.side === 'player' && !u.protected && u.ult && u.chakra >= this.B.combat.chakra.max && !this.isStunned(u));
  }

  /** Active enemy telegraph that a clash would meet (earliest to land). */
  clashTarget() {
    if (!this.clashEnabled) return null;
    let best = null;
    for (const t of this.telegraphs) if (t.clashable && t.side === 'enemy' && (!best || t.endsAt < best.endsAt)) best = t;
    return best;
  }

  /** Predicted clash outcome for a unit vs the current telegraph (for UI + bot). */
  clashPreview(uid) {
    const u = this.unit(uid); const t = this.clashTarget();
    if (!u || !t) return null;
    return { outcome: this._clashOutcome(u, t), telegraph: t };
  }

  _clashOutcome(u, t) {
    const JC = this.B.jutsuClash;
    let rel = 0;
    if (!u.taijutsu && t.nature) {
      const natures = u.natures?.length ? u.natures : [];
      const b = bestNature(natures, t.nature, {}, this.B);
      rel = b.relation;
    }
    if (u.taijutsu && JC.taijutsuNeverOverwhelmed) rel = Math.max(rel, 0);
    return rel > 0 ? 'overpower' : rel < 0 ? 'overwhelmed' : 'standoff';
  }

  /** Player taps a ready portrait. Returns { ok, clash? }. */
  fireUlt(uid) {
    if (!this.canUlt(uid)) return { ok: false };
    const u = this.unit(uid);
    const JC = this.B.jutsuClash;
    u.chakra = 0;
    this.stats.ults++;
    this.stats.playerUlts.push(this.time);
    this._emit({ type: 'ult', uid: u.uid, name: u.ult.name, ultType: u.ult.type, nature: u.ult.nature || u.natures?.[0] || null });
    const t = this.clashTarget();
    if (!t) { this._executeUlt(u, 1); return { ok: true }; }
    const outcome = this._clashOutcome(u, t);
    this.stats.clashes[outcome]++;
    const caster = this.unit(t.caster);
    if (JC.tankGuard && u.role === 'Tank') {
      t.forceTarget = u.uid; t.guardDR = JC.tankGuardDR;
    }
    if (outcome === 'overpower') {
      this._cancelTelegraph(t, 'overpower');
      if (caster && caster.alive) { this._addStatus(caster, 'stun', 1, JC.overpowerStun); caster.casting = null; }
      this._executeUlt(u, JC.overpowerUltMult);
      this._gainChakra(u, JC.overpowerChakraRefund);
    } else if (outcome === 'standoff') {
      this._cancelTelegraph(t, 'standoff');
      this._executeUlt(u, JC.standoffUltMult);
    } else {
      t.powerMult *= JC.overwhelmedJutsuMult;
    }
    this._emit({ type: 'clash', uid: u.uid, caster: t.caster, outcome, name: t.name, nature: t.nature });
    return { ok: true, clash: outcome };
  }

  _executeUlt(u, mult) {
    const U = this.B.combat.ult;
    // Ults hit with the unit's best nature vs each target (the ult's own nature
    // is its colour/flavour); taijutsu specialists stay neutral-but-unresisted.
    const opts = { kind: 'ult' };
    // Ults are jutsu: they reach any target. In "defeat the boss" nodes they go for the boss.
    let tgt = this.unit(u.targetUid) && this.unit(u.targetUid).alive ? this.unit(u.targetUid) : this._findTarget(u);
    if (this.objective.type === 'defeatBoss' && ['single', 'aoe', 'taunt'].includes(u.ult.type)) {
      const boss = this._opponents(u).find(o => o.isBoss);
      if (boss) tgt = boss;
    }
    this._emit({ type: 'shake', amount: 1, seconds: U.shakeSeconds });
    switch (u.ult.type) {
      case 'single':
        if (tgt) { this._damage(u, tgt, U.single * mult, opts); if (u.ult.stun && tgt.alive) this._stun(tgt, U.stunDuration); }
        break;
      case 'aoe': {
        if (!tgt) break;
        const foes = this._opponents(u).filter(o => Math.abs(o.x - tgt.x) <= U.aoeRadius);
        for (const f of foes) { this._damage(u, f, U.aoe * mult, opts); if (u.ult.stun && f.alive) this._stun(f, U.stunDuration * 0.6); }
        this._emit({ type: 'aoe', uid: u.uid, x: tgt.x, radius: U.aoeRadius });
        break;
      }
      case 'taunt':
        this._addStatus(u, 'taunt', 1, U.tauntDuration);
        this._addStatus(u, 'dr', U.tauntDR, U.tauntDuration);
        if (tgt) this._damage(u, tgt, U.tauntHit * mult, opts);
        break;
      case 'heal':
        for (const a of this.alive(u.side)) this._heal(a, (U.healPower * this.atkOf(u) + U.healPctMaxHp * a.maxHp) * mult, u);
        break;
      case 'buff':
        for (const a of this.alive(u.side)) if (!a.protected) this._addStatus(a, 'atkBuff', U.buffAtk * mult, U.buffDuration);
        this._emit({ type: 'buff', uid: u.uid });
        break;
      default: break;
    }
  }

  _stun(u, dur) {
    this._addStatus(u, 'stun', 1, dur);
    if (u.casting) { this._cancelTelegraph(u.casting, 'interrupted'); }
    this._emit({ type: 'stun', uid: u.uid, seconds: dur });
  }

  // ---------------------------------------------------------------------------
  // Telegraphs (enemy jutsu wind-ups and boss specials)
  // ---------------------------------------------------------------------------
  _startEnemyJutsu(u) {
    const EJ = this.B.enemyScaling.enemyJutsu;
    u.chakra = 0;
    const tgt = this._findTarget(u);
    if (!tgt) return;
    const t = {
      id: this.nextUid++, caster: u.uid, side: 'enemy', name: u.jutsu.name,
      nature: u.jutsu.nature ?? null,
      kind: 'jutsu', type: u.jutsu.type || 'single', power: u.jutsu.type === 'aoe' ? EJ.aoe : EJ.single,
      powerMult: 1, startedAt: this.time, endsAt: this.time + EJ.windup, target: tgt.uid, clashable: true, stun: 0,
    };
    u.casting = t; this.telegraphs.push(t);
    this._emit({ type: 'telegraph', id: t.id, uid: u.uid, name: t.name, nature: t.nature, windup: EJ.windup });
  }

  _startBossSpecial(u, m) {
    const t = {
      id: this.nextUid++, caster: u.uid, side: 'enemy', name: m.name, nature: m.nature !== undefined ? m.nature : u.activeNature,
      kind: 'special', type: 'aoe', targetMode: m.target || 'all', power: m.power, powerMult: 1,
      startedAt: this.time, endsAt: this.time + m.windup, clashable: true, stun: m.stun || 0,
    };
    u.casting = t; this.telegraphs.push(t);
    this._emit({ type: 'telegraph', id: t.id, uid: u.uid, name: t.name, nature: t.nature, windup: m.windup, special: true });
  }

  _cancelTelegraph(t, reason) {
    this.telegraphs = this.telegraphs.filter(x => x !== t);
    const c = this.unit(t.caster); if (c && c.casting === t) c.casting = null;
    this._emit({ type: 'telegraphEnd', id: t.id, uid: t.caster, reason });
  }

  _updateTelegraphs() {
    for (const t of [...this.telegraphs]) {
      if (this.time < t.endsAt) continue;
      this._cancelTelegraph(t, 'landed');
      const c = this.unit(t.caster);
      if (!c || !c.alive) continue;
      let targets;
      const foes = this._opponents(c);
      if (t.forceTarget) { const g = this.unit(t.forceTarget); targets = g && g.alive ? [g] : []; }
      else if (t.kind === 'jutsu' && t.type === 'single') {
        const g = this.unit(t.target); targets = g && g.alive ? [g] : (this._findTarget(c) ? [this._findTarget(c)] : []);
      } else if (t.kind === 'jutsu') {
        const g = this.unit(t.target) || this._findTarget(c);
        targets = g ? foes.filter(o => Math.abs(o.x - g.x) <= this.B.combat.ult.aoeRadius) : [];
      } else {
        const sorted = foes.slice().sort((a, b) => (c.side === 'enemy' ? b.x - a.x : a.x - b.x));
        switch (t.targetMode) {
          case 'front': targets = sorted.slice(0, 2); break;
          case 'back': targets = sorted.slice(-2); break;
          case 'random': targets = sorted.length ? [sorted[Math.floor(this.rng() * sorted.length)]] : []; break;
          default: targets = sorted;
        }
      }
      for (const g of targets) {
        const dmg = this._damage(c, g, t.power * t.powerMult, { kind: 'special', nature: t.nature ?? null, noCrit: true, extraDR: t.forceTarget ? (t.guardDR || 0) : 0 });
        if (t.stun && g.alive && dmg > 0) this._stun(g, t.stun);
      }
      this._emit({ type: 'jutsuLand', uid: c.uid, name: t.name, nature: t.nature, targets: targets.map(g => g.uid) });
    }
  }

  // ---------------------------------------------------------------------------
  // Boss / special mechanics
  // ---------------------------------------------------------------------------
  _runMechanics(u, dt) {
    const hpPct = u.hp / u.maxHp;
    u.mechanics.forEach((m, i) => {
      const st = u.mechState[i];
      const thresholdHit = () => {
        if (!m.atHp) return false;
        for (const th of m.atHp) if (hpPct <= th && !st.hpFired.includes(th)) { st.hpFired.push(th); return true; }
        return false;
      };
      const timerHit = () => {
        if (st.next == null) return false;
        if (this.time >= st.next) { st.next = m.every ? this.time + this._jitter(m.every) : null; return true; }
        return false;
      };
      switch (m.type) {
        case 'telegraphAoE':
          if (!u.casting && !this.isStunned(u) && (m.atHp ? thresholdHit() : timerHit())) this._startBossSpecial(u, m);
          break;
        case 'summonAdds':
          if ((m.atHp ? thresholdHit() : timerHit()) && this.enemyFactory) {
            const aliveAdds = this.units.filter(o => o.alive && o.isAdd && o.summoner === u.uid).length;
            const n = Math.max(0, Math.min(m.count, m.maxAlive - aliveAdds));
            for (let k = 0; k < n; k++) {
              const spec = this.enemyFactory(m.enemy, { isAdd: true, bossUnit: u });
              if (!spec) continue;
              const a = this._addUnit({ ...spec, isAdd: true }, u.side, u.x + (u.side === 'enemy' ? 1 : -1) * this.B.combat.lane.allySpacing * (k + 1));
              a.summoner = u.uid;
            }
            if (n > 0) this._emit({ type: 'summon', uid: u.uid, name: m.name, count: n });
          }
          break;
        case 'shieldPhase':
          if (thresholdHit()) {
            u.shield = Math.round(u.maxHp * m.shieldPctMaxHp); u.shieldUntil = this.time + m.duration;
            this._emit({ type: 'shield', uid: u.uid, name: m.name, amount: u.shield });
          }
          break;
        case 'enrage':
          if (!st.done && ((m.after != null && this.time >= m.after) || (m.atHp && thresholdHit()))) {
            st.done = true; u.permAtk *= m.atkMult; u.permSpeed *= m.speedMult;
            this._emit({ type: 'enrage', uid: u.uid, name: m.name });
          }
          break;
        case 'elementSwap': {
          const seq = m.sequence || u.natures;
          if (seq && seq.length > 1 && (m.atHp ? thresholdHit() : timerHit())) {
            st.swapIdx = (st.swapIdx + 1) % seq.length; u.activeNature = seq[st.swapIdx];
            this._emit({ type: 'swap', uid: u.uid, nature: u.activeNature, name: m.name });
          }
          break;
        }
        case 'reflect':
          if (!st.pendingAt && timerHit()) { st.pendingAt = this.time + m.windup; this._emit({ type: 'reflectWarn', uid: u.uid, name: m.name, windup: m.windup }); }
          if (st.pendingAt && this.time >= st.pendingAt) {
            st.pendingAt = null; u.reflectUntil = this.time + m.duration;
            this._emit({ type: 'reflect', uid: u.uid, name: m.name, seconds: m.duration });
          }
          break;
        case 'regen':
          this._healSilent(u, u.maxHp * m.pctPerSec * dt);
          break;
        case 'rally':
          if (timerHit()) {
            for (const a of this.alive(u.side)) this._addStatus(a, 'atkBuff', m.atk, m.duration);
            this._emit({ type: 'rally', uid: u.uid, name: m.name });
          }
          break;
        default: break; // lifesteal / reviveOnce are passive (handled in _damage/_kill)
      }
    });
  }

  _healSilent(u, amt) { u.hp = Math.min(u.maxHp, u.hp + amt); }

  // ---------------------------------------------------------------------------
  // Objectives
  // ---------------------------------------------------------------------------
  surviveSeconds() {
    const o = this.objective; if (!o.seconds) return null;
    return o.seconds * (this.B.objectives.surviveTimeMult ?? 1);
  }

  _checkEnd() {
    const o = this.objective;
    const players = this.fighters('player');
    if (players.length === 0) return this._end('lost', 'defeated');
    if (this.units.some(u => u.protected && !u.alive)) return this._end('lost', 'protectFailed');
    const enemiesAlive = this.alive('enemy').length + this.pending.length;
    const survive = this.surviveSeconds();
    switch (o.type) {
      case 'survive':
        if (survive != null && this.time >= survive) return this._end('won', 'survived');
        if (enemiesAlive === 0) return this._end('won', 'defeatAll');
        break;
      case 'protect':
        if (survive != null && this.time >= survive) return this._end('won', 'survived');
        if (enemiesAlive === 0) return this._end('won', 'defeatAll');
        break;
      case 'defeatBoss': {
        const bosses = this.units.filter(u => u.side === 'enemy' && u.isBoss);
        if (bosses.length && bosses.every(b => !b.alive)) return this._end('won', 'bossDown');
        if (enemiesAlive === 0) return this._end('won', 'defeatAll');
        break;
      }
      default:
        if (enemiesAlive === 0) return this._end('won', 'defeatAll');
    }
    if (this.time >= this.B.combat.timeLimit) return this._end('lost', 'timeout');
  }

  _end(state, reason) {
    this.state = state; this.endReason = reason;
    this._emit({ type: 'end', state, reason });
  }

  // ---------------------------------------------------------------------------
  // Bots (for sims and the "auto" toggle)
  // ---------------------------------------------------------------------------
  /**
   * 'asap'  — fire every ready ult immediately (what npm run sim uses).
   * 'smart' — same, but uses Jutsu Clash well: fires counter-nature units into
   *           enemy wind-ups and holds units that would be Overwhelmed.
   */
  botUlts(mode = 'asap') {
    if (!this.ultsEnabled) return;
    const ready = this.units.filter(u => u.side === 'player' && this.canUlt(u.uid));
    if (!ready.length) return;
    if (mode === 'asap') { for (const u of ready) this.fireUlt(u.uid); return; }
    const t = this.clashTarget();
    if (t) {
      const ranked = ready.map(u => ({ u, o: this._clashOutcome(u, t) }));
      const best = ranked.find(r => r.o === 'overpower') || ranked.find(r => r.u.role === 'Tank') || ranked.find(r => r.o === 'standoff');
      if (best) this.fireUlt(best.u.uid);
      return; // hold the rest until the wind-up resolves
    }
    // Hold units that could overpower an upcoming boss special.
    const boss = this.units.find(e => e.alive && e.side === 'enemy' && e.isBoss);
    for (const u of ready) {
      if (boss) {
        const idx = boss.mechanics.findIndex(m => m.type === 'telegraphAoE');
        if (idx >= 0) {
          const m = boss.mechanics[idx]; const st = boss.mechState[idx];
          const nat = m.nature !== undefined ? m.nature : boss.activeNature;
          const soon = st.next != null && st.next - this.time < 4;
          if (soon && nat && !u.taijutsu && bestNature(u.natures, nat, {}, this.B).relation > 0) continue;
        }
      }
      this.fireUlt(u.uid);
    }
  }

  /** Snapshot of player units for carrying state between Boss Rush rounds. */
  playerCarry() {
    return this.units.filter(u => u.side === 'player' && !u.protected).map(u => ({ key: u.key, hp: u.alive ? u.hp : 0, chakra: u.chakra, alive: u.alive }));
  }
}

export { natureRelation };
