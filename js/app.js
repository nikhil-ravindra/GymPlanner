(() => {
'use strict';

/* =========================================================
   JS 1. HELPERS
   ========================================================= */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const num = v => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
const fmt = n => Math.round(n).toLocaleString('en-US');
const fmt1 = n => (Math.round(n * 10) / 10).toString();
const uid = () => Math.random().toString(36).slice(2, 9);
const clone = o => JSON.parse(JSON.stringify(o));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Dates are stored as local "YYYY-MM-DD" keys
const pad = n => String(n).padStart(2, '0');
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return dkey(d); };
const daysBetween = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 864e5);
const todayKey = () => dkey(new Date());
const fmtDate = (k, o = { day: 'numeric', month: 'short' }) => fromKey(k).toLocaleDateString('en-GB', o);

// Inline icon set (stroke icons, 24px grid)
const I = {
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>', home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  dots:'<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7"/>', play:'<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>', pause:'<path d="M8 5v14M16 5v14"/>',
  reset:'<path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4"/>', left:'<path d="M15 6l-6 6 6 6"/>', right:'<path d="M9 6l6 6-6 6"/>',
  star:'<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9z"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', download:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', upload:'<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>', lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 20h8"/>',
  flame:'<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/>',
  bolt:'<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>', timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>'
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

/* =========================================================
   JS 2. PRESETS & RULES
   ========================================================= */
const STORE_KEY = 'gymPlanner.v1';

const SPLIT_PRESETS = {
  ppl: { name: 'Push / Pull / Legs', blurb: 'Classic 3-day rotation', days: [
    { name: 'Push', ex: ['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Lateral Raise', 'Triceps Pushdown'] },
    { name: 'Pull', ex: ['Deadlift', 'Pull-Up', 'Barbell Row', 'Face Pull', 'Barbell Curl'] },
    { name: 'Legs', ex: ['Back Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise'] } ] },
  ul: { name: 'Upper / Lower', blurb: 'Each half twice a week', days: [
    { name: 'Upper', ex: ['Bench Press', 'Barbell Row', 'Overhead Press', 'Lat Pulldown', 'Barbell Curl', 'Triceps Pushdown'] },
    { name: 'Lower', ex: ['Back Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise'] } ] },
  bro: { name: 'Bro Split', blurb: 'One muscle group a day', days: [
    { name: 'Chest', ex: ['Bench Press', 'Incline Dumbbell Press', 'Cable Fly', 'Dips'] },
    { name: 'Back', ex: ['Deadlift', 'Pull-Up', 'Barbell Row', 'Lat Pulldown'] },
    { name: 'Shoulders', ex: ['Overhead Press', 'Lateral Raise', 'Rear Delt Fly', 'Shrugs'] },
    { name: 'Arms', ex: ['Barbell Curl', 'Hammer Curl', 'Skull Crusher', 'Triceps Pushdown'] },
    { name: 'Legs', ex: ['Back Squat', 'Leg Press', 'Leg Curl', 'Calf Raise'] } ] },
  fb: { name: 'Full Body', blurb: 'Alternate A and B, 3×/week', days: [
    { name: 'Full Body A', ex: ['Back Squat', 'Bench Press', 'Barbell Row', 'Overhead Press', 'Plank'] },
    { name: 'Full Body B', ex: ['Deadlift', 'Incline Dumbbell Press', 'Pull-Up', 'Walking Lunge', 'Barbell Curl'] } ] }
};
const shortDay = n => n.startsWith('Full Body ') ? 'FB ' + n.slice(10) : n.length > 7 ? n.slice(0, 5) : n;

// Rank ladder: min XP needed + badge gradient (light → dark)
const RANKS = [
  { name: 'Bronze',   min: 0,     c1: '#f3b37a', c2: '#9a5220' },
  { name: 'Silver',   min: 1000,  c1: '#f1f4f8', c2: '#8a95a6' },
  { name: 'Gold',     min: 3000,  c1: '#ffe27a', c2: '#c98a00' },
  { name: 'Platinum', min: 6500,  c1: '#b8fff1', c2: '#26a195' },
  { name: 'Diamond',  min: 11000, c1: '#cde9ff', c2: '#3a76d6' },
  { name: 'Elite',    min: 18000, c1: '#ffb46b', c2: '#e0245e' }
];

// XP formula — shown verbatim in the Rank section
const XP = { workout: 100, streakPer: 5, streakCap: 50, pr: 50, dietHit: 50, dietPartial: 20 };

// Foods used for sample data and the default "saved foods" list
const FOODS = {
  oats:    { name: 'Oats & whey bowl',       cal: 520, protein: 38, carbs: 62, fat: 12 },
  chicken: { name: 'Chicken breast & rice',  cal: 650, protein: 52, carbs: 78, fat: 10 },
  paneer:  { name: 'Paneer bhurji wrap',     cal: 540, protein: 30, carbs: 42, fat: 26 },
  yogurt:  { name: 'Greek yogurt & berries', cal: 220, protein: 20, carbs: 26, fat: 4 },
  eggs:    { name: 'Egg omelette (4 eggs)',  cal: 360, protein: 26, carbs: 4,  fat: 26 },
  dal:     { name: 'Dal, roti & sabzi',      cal: 580, protein: 24, carbs: 82, fat: 16 },
  whey:    { name: 'Whey shake',             cal: 130, protein: 25, carbs: 3,  fat: 2 },
  pbtoast: { name: 'Peanut butter toast',    cal: 390, protein: 14, carbs: 36, fat: 20 },
  banana:  { name: 'Banana',                 cal: 105, protein: 1,  carbs: 27, fat: 0 },
  salmon:  { name: 'Salmon & potatoes',      cal: 620, protein: 42, carbs: 48, fat: 26 },
  nuts:    { name: 'Fruit & nuts',           cal: 280, protein: 7,  carbs: 30, fat: 16 },
  rajma:   { name: 'Rajma chawal',           cal: 610, protein: 22, carbs: 98, fat: 12 }
};

const QUOTES = [
  "Show up on the days you don't feel like it. Those are the days that count.",
  "The bar weighs the same every day. You're the one who changes.",
  "Small plates add up. So do small wins.",
  "Discipline is choosing what you want most over what you want now.",
  "Beat last week's numbers. That's the whole game.",
  "Strong is built one boring session at a time.",
  "Eat like it matters. Train like it matters. Sleep like it matters.",
  "Rest is part of the programme, not a break from it.",
  "Consistency beats intensity when intensity doesn't show up.",
  "Your only competition is the logbook.",
  "One more rep than last time. Every time.",
  "Motivation gets you in the door. Habit keeps you under the bar.",
  "Hard sets, honest reps, full plates.",
  "You don't find the time. You make it."
];

const ACHIEVEMENTS = [
  { id: 'first',     name: 'First Workout',    desc: 'Log your first session.',             test: c => c.workouts >= 1,  ic: 'bolt' },
  { id: 'ten',       name: 'Double Digits',    desc: 'Log 10 workouts.',                    test: c => c.workouts >= 10, ic: 'bolt' },
  { id: 'fifty',     name: 'Half Century',     desc: 'Log 50 workouts.',                    test: c => c.workouts >= 50, ic: 'bolt' },
  { id: 'streak7',   name: '7-Day Streak',     desc: 'Reach a 7-workout streak.',           test: c => c.longest >= 7,   ic: 'flame' },
  { id: 'streak21',  name: 'Habit Formed',     desc: 'Reach a 21-workout streak.',          test: c => c.longest >= 21,  ic: 'flame' },
  { id: 'club100',   name: '100kg Club',       desc: 'Lift 100 kg in any set.',             test: c => c.maxW >= 100,    ic: 'trophy' },
  { id: 'club140',   name: '140kg Club',       desc: 'Lift 140 kg in any set.',             test: c => c.maxW >= 140,    ic: 'trophy' },
  { id: 'pr1',       name: 'Personal Best',    desc: 'Set your first PR.',                  test: c => c.prs >= 1,       ic: 'star' },
  { id: 'pr25',      name: 'Record Breaker',   desc: 'Set 25 PRs.',                         test: c => c.prs >= 25,      ic: 'star' },
  { id: 'tonne',     name: '10-Tonne Session', desc: 'Move 10,000 kg in one workout.',      test: c => c.maxVol >= 10000, ic: 'trophy' },
  { id: 'diet7',     name: 'Dialled In',       desc: 'Hit your diet goals on 7 days.',      test: c => c.hit >= 7,       ic: 'check' },
  { id: 'cleanweek', name: 'Clean Week',       desc: 'Hit diet goals 7 days in a row.',     test: c => c.bestRun >= 7,   ic: 'check' },
  { id: 'water',     name: 'Hydrated',         desc: 'Reach your water goal on 10 days.',   test: c => c.water >= 10,    ic: 'check' },
  { id: 'gold',      name: 'Going for Gold',   desc: 'Reach Gold rank.',                    test: c => c.rank >= 2,      ic: 'trophy' },
  { id: 'elite',     name: 'Elite',            desc: 'Reach the top rank.',                 test: c => c.rank >= 5,      ic: 'trophy' }
];

/* =========================================================
   JS 3. STATE & PERSISTENCE (localStorage)
   ========================================================= */
function freshState() {
  const splits = {};
  for (const k in SPLIT_PRESETS) splits[k] = clone(SPLIT_PRESETS[k].days);
  return {
    v: 1, sample: false,
    profile: { name: 'Nikhil' },
    settings: { mode: 'dark' },
    diet: {
      goals: { cal: 2600, protein: 160, carbs: 300, fat: 75 }, waterGoal: 8,
      calc: { age: 21, gender: 'male', height: 176, weight: 74, activity: 1.55, goal: 'maintain' },
      days: {}, saved: []
    },
    workout: { split: 'ppl', splits, sessions: {}, draft: null, restSecs: 90 },
    rank: { last: 'Bronze', ach: [] }
  };
}

// Seeded RNG so the sample data looks the same on every first open
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ~5 weeks of Push/Pull/Legs training + diet logs, ending yesterday
function buildSample() {
  const s = freshState(); s.sample = true;
  const t = todayKey(), rnd = mulberry32(7);
  const BASE = { 'Bench Press': 70, 'Overhead Press': 42.5, 'Incline Dumbbell Press': 24, 'Lateral Raise': 10, 'Triceps Pushdown': 30,
    'Deadlift': 120, 'Pull-Up': 0, 'Barbell Row': 65, 'Face Pull': 20, 'Barbell Curl': 30,
    'Back Squat': 95, 'Romanian Deadlift': 80, 'Leg Press': 160, 'Leg Curl': 40, 'Calf Raise': 60 };
  const STEP = { 'Lateral Raise': 1, 'Face Pull': 1, 'Leg Press': 5, 'Incline Dumbbell Press': 2 };
  const HIGH_REP = ['Leg Press', 'Calf Raise', 'Lateral Raise', 'Face Pull'];
  const days = s.workout.splits.ppl, seen = {};
  let rot = 0, p = 0;
  for (let off = -34; off <= -1; off++) {
    if (off >= -20 && off <= -17) continue;         // a 4-day break (breaks the streak)
    if (p++ % 4 === 3) continue;                    // train 3 days, rest 1
    const k = addDays(t, off), day = days[rot++ % 3];
    const n = seen[day.name] = (seen[day.name] || 0) + 1;
    s.workout.sessions[k] = { split: 'ppl', day: day.name, ex: day.ex.map(name => {
      const w = BASE[name] + Math.floor((n - 1) / 3) * (STEP[name] || 2.5);
      const r = HIGH_REP.includes(name) ? 12 : name === 'Pull-Up' ? 8 : 8;
      return { name, sets: [{ r, w }, { r, w }, { r: r - (rnd() < .5 ? 1 : 2), w }] };
    }) };
  }
  // Diet: three "good day" templates, trimmed for partial / missed days
  const T = [['oats', 'chicken', 'yogurt', 'salmon', 'whey', 'pbtoast'],
             ['eggs', 'chicken', 'paneer', 'whey', 'dal', 'banana'],
             ['oats', 'rajma', 'chicken', 'yogurt', 'whey', 'nuts']];
  for (let off = -34; off <= -1; off++) {
    const k = addDays(t, off), r = rnd(), tpl = T[(off + 34) % 3];
    const ids = r < .55 ? tpl : r < .85 ? tpl.slice(0, 4) : tpl.slice(1, 3);
    s.diet.days[k] = { meals: ids.map(id => ({ id: uid(), ...FOODS[id] })), water: r < .55 ? 8 + Math.floor(rnd() * 2) : 4 + Math.floor(rnd() * 3) };
  }
  s.diet.days[t] = { meals: [{ id: uid(), ...FOODS.oats }, { id: uid(), ...FOODS.chicken }], water: 3 };
  s.diet.saved = ['oats', 'chicken', 'whey', 'yogurt', 'eggs', 'dal'].map(id => ({ id: uid(), ...FOODS[id] }));
  return s;
}

// Fill in any fields missing from older or imported data
function migrate(o) {
  const f = freshState();
  return { ...f, ...o,
    profile: { ...f.profile, ...(o.profile || {}) }, settings: { ...f.settings, ...(o.settings || {}) },
    diet: { ...f.diet, ...o.diet, goals: { ...f.diet.goals, ...(o.diet.goals || {}) }, calc: { ...f.diet.calc, ...(o.diet.calc || {}) }, days: o.diet.days || {}, saved: o.diet.saved || [] },
    workout: { ...f.workout, ...o.workout, splits: { ...f.workout.splits, ...(o.workout.splits || {}) }, sessions: o.workout.sessions || {} },
    rank: { ...f.rank, ...(o.rank || {}) } };
}

function load() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) { const o = JSON.parse(raw); if (o && o.diet && o.workout) return migrate(o); } } catch (e) { /* storage blocked or corrupt */ }
  return null;
}
let storageWarned = false;
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }
  catch (e) { if (!storageWarned) { storageWarned = true; toast("This browser won't let the app save — changes will be lost on refresh.", 'warn'); } }
}
let saveTimer = 0;
const saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(save, 250); };

let S = load();
const firstRun = !S;
if (!S) S = buildSample();

// UI state (not persisted)
const ui = {
  view: 'landing', dietDate: todayKey(), dietSel: todayKey(), dietCal: null,
  woDate: todayKey(), woCal: null, splitTab: 0, editSplit: false, chartEx: null
};
{ const d = new Date(); ui.dietCal = { y: d.getFullYear(), m: d.getMonth() }; ui.woCal = { y: d.getFullYear(), m: d.getMonth() }; }

/* =========================================================
   JS 4. DERIVED DATA: diet status, streaks, PRs, XP, ranks
   ========================================================= */
const dayObj = k => (S.diet.days[k] ||= { meals: [], water: 0 });
function dayTotals(k) {
  const t = { cal: 0, protein: 0, carbs: 0, fat: 0 }, d = S.diet.days[k];
  if (d) for (const m of d.meals) { t.cal += num(m.cal); t.protein += num(m.protein); t.carbs += num(m.carbs); t.fat += num(m.fat); }
  return t;
}
// hit = calories within ±10% AND protein ≥ 95% · partial = one of those, or both ≥ 75% · miss = logged but neither
function dayStatus(k) {
  const d = S.diet.days[k]; if (!d || !d.meals.length) return null;
  const t = dayTotals(k), g = S.diet.goals, cr = t.cal / g.cal, pr = t.protein / g.protein;
  const calOk = cr >= .9 && cr <= 1.1, proOk = pr >= .95;
  if (calOk && proOk) return 'hit';
  if (calOk || proOk || (cr >= .75 && pr >= .75)) return 'partial';
  return 'miss';
}
const STATUS_LABEL = { hit: 'Goals hit', partial: 'Partly hit', miss: 'Missed', null: 'Nothing logged' };

const workoutDates = () => Object.keys(S.workout.sessions).sort();
// A streak = consecutive workouts with at most one rest day between them
function streakInfo() {
  const dates = workoutDates(), pos = {}; let run = 0, longest = 0, prev = null;
  for (const k of dates) { run = prev && daysBetween(prev, k) <= 2 ? run + 1 : 1; pos[k] = run; longest = Math.max(longest, run); prev = k; }
  const last = dates[dates.length - 1];
  const current = last && daysBetween(last, todayKey()) <= 2 ? pos[last] : 0;
  return { dates, pos, longest, current };
}

const topWeight = ex => ex.sets.reduce((m, s) => num(s.r) > 0 ? Math.max(m, num(s.w)) : m, 0);
// Every session whose top set beats all earlier sessions of that exercise is a PR
function allPRs() {
  const best = {}, out = [];
  for (const k of workoutDates()) for (const ex of S.workout.sessions[k].ex) {
    const t = topWeight(ex); if (t <= 0) continue;
    const b = best[ex.name];
    if (b !== undefined && t > b) out.push({ date: k, name: ex.name, w: t, prev: b });
    if (b === undefined || t > b) best[ex.name] = t;
  }
  return out;
}
function bestBefore(name, k) {
  let b = 0;
  for (const d of workoutDates()) { if (d >= k) break; const ex = S.workout.sessions[d].ex.find(e => e.name === name); if (ex) b = Math.max(b, topWeight(ex)); }
  return b;
}
function lastBefore(name, k) {
  const ds = workoutDates();
  for (let i = ds.length - 1; i >= 0; i--) { if (ds[i] >= k) continue; const ex = S.workout.sessions[ds[i]].ex.find(e => e.name === name); if (ex) return { date: ds[i], ex }; }
  return null;
}

// XP is recomputed from the log every time, so editing history stays consistent
function xpSummary() {
  const ev = [], st = streakInfo();
  for (const k of st.dates) {
    ev.push({ date: k, xp: XP.workout, type: 'workout', label: `${S.workout.sessions[k].day} workout` });
    if (st.pos[k] >= 2) ev.push({ date: k, xp: Math.min(st.pos[k] * XP.streakPer, XP.streakCap), type: 'streak', label: `Streak ×${st.pos[k]}` });
  }
  for (const p of allPRs()) ev.push({ date: p.date, xp: XP.pr, type: 'pr', label: `PR · ${p.name} ${fmt1(p.w)} kg` });
  for (const k in S.diet.days) {
    const s = dayStatus(k);
    if (s === 'hit') ev.push({ date: k, xp: XP.dietHit, type: 'diet', label: 'Diet goals hit' });
    else if (s === 'partial') ev.push({ date: k, xp: XP.dietPartial, type: 'diet', label: 'Diet goals partly hit' });
  }
  ev.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  const by = { workout: { n: 0, xp: 0 }, streak: { n: 0, xp: 0 }, pr: { n: 0, xp: 0 }, diet: { n: 0, xp: 0 } };
  let total = 0; for (const e of ev) { by[e.type].n++; by[e.type].xp += e.xp; total += e.xp; }
  return { ev, by, total };
}
const rankIndex = xp => RANKS.reduce((i, r, j) => xp >= r.min ? j : i, 0);

function statsCtx() {
  const st = streakInfo(); let maxW = 0, maxVol = 0;
  for (const s of Object.values(S.workout.sessions)) {
    let vol = 0;
    for (const e of s.ex) for (const x of e.sets) { const r = num(x.r), w = num(x.w); if (r > 0) { maxW = Math.max(maxW, w); vol += r * w; } }
    maxVol = Math.max(maxVol, vol);
  }
  let hit = 0, run = 0, bestRun = 0, prevHit = null, water = 0;
  for (const k of Object.keys(S.diet.days).sort()) {
    if (dayStatus(k) === 'hit') { hit++; run = prevHit && daysBetween(prevHit, k) === 1 ? run + 1 : 1; prevHit = k; bestRun = Math.max(bestRun, run); }
    if ((S.diet.days[k].water || 0) >= S.diet.waterGoal) water++;
  }
  return { workouts: st.dates.length, longest: st.longest, maxW, maxVol, prs: allPRs().length, hit, bestRun, water, rank: rankIndex(xpSummary().total) };
}

// Called after every data change: unlock achievements, detect rank-ups
function checkProgress(silent) {
  const c = statsCtx();
  const unlocked = ACHIEVEMENTS.filter(a => a.test(c)).map(a => a.id);
  const fresh = unlocked.filter(id => !S.rank.ach.includes(id));
  const oldIdx = Math.max(0, RANKS.findIndex(r => r.name === S.rank.last));
  S.rank.ach = unlocked; S.rank.last = RANKS[c.rank].name; save();
  if (silent) return;
  fresh.forEach((id, i) => { const a = ACHIEVEMENTS.find(x => x.id === id); setTimeout(() => toast(`<b>Achievement unlocked</b>${esc(a.name)} — ${esc(a.desc)}`, 'ach', true), 500 + i * 600); });
  if (c.rank > oldIdx) setTimeout(() => showRankUp(c.rank), 900);
}
if (firstRun) checkProgress(true);

/* =========================================================
   JS 5. REUSABLE UI PIECES
   ========================================================= */
function ring(val, goal, cls, size = 150, stroke = 13) {
  const r = (size - stroke) / 2, c = size / 2, C = 2 * Math.PI * r;
  const p = goal > 0 ? Math.min(val / goal, 1) : 0, over = goal > 0 && val > goal * 1.1;
  return `<svg class="ring ${cls} ${over ? 'over' : ''}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="--C:${C.toFixed(1)}">
    <circle class="ring-bg" cx="${c}" cy="${c}" r="${r}" stroke-width="${stroke}"/>
    <circle class="ring-fg" cx="${c}" cy="${c}" r="${r}" stroke-width="${stroke}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - p)).toFixed(1)}" transform="rotate(-90 ${c} ${c})"/></svg>`;
}
const glassSVG = full => `<svg viewBox="0 0 24 32" class="glass ${full ? 'full' : ''}" aria-hidden="true"><path class="g-fill" d="M5.6 12h12.8l-1.3 15.9a1.8 1.8 0 0 1-1.8 1.6H8.7a1.8 1.8 0 0 1-1.8-1.6z"/><path class="g-out" d="M3 3h18l-2.2 25.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8z"/></svg>`;

// Monthly calendar, Monday first. cell(k, dayNumber, isToday, isFuture) returns the cell HTML.
function calendar(y, m, cell, prevAct, nextAct) {
  const first = new Date(y, m, 1), lead = (first.getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate(), t = todayKey();
  let html = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<span class="cal-dow">${d}</span>`).join('');
  for (let i = 0; i < lead; i++) html += '<span class="cal-cell empty"></span>';
  for (let d = 1; d <= n; d++) { const k = `${y}-${pad(m + 1)}-${pad(d)}`; html += cell(k, d, k === t, k > t); }
  const isCurrent = y === new Date().getFullYear() && m === new Date().getMonth();
  return `<div class="cal-nav"><button class="icon-btn sm" data-act="${prevAct}" aria-label="Previous month">${icon('left')}</button>
    <b>${first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</b>
    <button class="icon-btn sm" data-act="${nextAct}" aria-label="Next month" ${isCurrent ? 'disabled' : ''}>${icon('right')}</button></div>
    <div class="cal-grid">${html}</div>`;
}

// Hexagonal rank badge. Pips under the letter show the tier number.
let badgeSeq = 0;
function badgeSVG(i, size = 120) {
  const r = RANKS[i], id = 'bg' + (++badgeSeq);
  const pips = Array.from({ length: i + 1 }, (_, j) => { const x = 60 + (j - i / 2) * 11; return `<path d="M${x} 92l4 4-4 4-4-4z" fill="rgba(0,0,0,.45)"/>`; }).join('');
  return `<svg width="${size}" height="${size * 1.1}" viewBox="0 0 120 132" aria-label="${r.name} badge" role="img">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${r.c1}"/><stop offset="1" stop-color="${r.c2}"/></linearGradient></defs>
    <path d="M60 4l52 30v64l-52 30L8 98V34z" fill="url(#${id})"/>
    <path d="M60 16l41 23.5v53L60 116 19 92.5v-53z" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>
    <path d="M60 4l52 30-52 30L8 34z" fill="rgba(255,255,255,.14)"/>
    <text x="60" y="80" text-anchor="middle" style="font:900 50px var(--f-display)" fill="rgba(0,0,0,.55)">${r.name[0]}</text>
    ${pips}</svg>`;
}

// Line chart of top-set weight over time for one exercise
function lineChart(pts) {
  if (pts.length < 2) return `<p class="empty">Log this exercise at least twice to see a trend.</p>`;
  const W = 640, H = 250, L = 46, R = 70, T = 18, B = 32;
  const ws = pts.map(p => p.w), lo0 = Math.min(...ws), hi0 = Math.max(...ws), span = (hi0 - lo0) || Math.max(hi0 * .1, 5);
  let lo = Math.max(0, Math.floor((lo0 - span * .3) / 5) * 5), hi = Math.ceil((hi0 + span * .3) / 5) * 5; if (hi <= lo) hi = lo + 5;
  const t0 = fromKey(pts[0].date).getTime(), t1 = fromKey(pts[pts.length - 1].date).getTime();
  const X = d => L + (fromKey(d).getTime() - t0) / (t1 - t0 || 1) * (W - L - R);
  const Y = w => T + (1 - (w - lo) / (hi - lo)) * (H - T - B);
  let g = '';
  for (let i = 0; i <= 4; i++) { const v = lo + (hi - lo) * i / 4, y = Y(v); g += `<line class="ch-grid" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text class="ch-lbl" x="${L - 8}" y="${y + 4}" text-anchor="end">${fmt1(v)}</text>`; }
  const xs = [pts[0], pts[Math.floor(pts.length / 2)], pts[pts.length - 1]].filter((p, i, a) => a.indexOf(p) === i);
  xs.forEach((p, i) => g += `<text class="ch-lbl" x="${X(p.date)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === xs.length - 1 ? 'end' : 'middle'}">${fmtDate(p.date)}</text>`);
  const line = pts.map(p => `${X(p.date).toFixed(1)},${Y(p.w).toFixed(1)}`).join(' ');
  const area = `M${X(pts[0].date)},${H - B} L${line.split(' ').join(' L')} L${X(pts[pts.length - 1].date)},${H - B} Z`;
  const last = pts[pts.length - 1];
  const dots = pts.slice(0, -1).map(p => `<circle class="ch-dot" cx="${X(p.date)}" cy="${Y(p.w)}" r="4"><title>${fmtDate(p.date)} · ${fmt1(p.w)} kg</title></circle>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Top set weight over time">${g}
    <path class="ch-area" d="${area}"/><polyline class="ch-line" points="${line}"/>${dots}
    <circle class="ch-end" cx="${X(last.date)}" cy="${Y(last.w)}" r="7"/><text class="ch-end-lbl" x="${X(last.date) + 12}" y="${Y(last.w) + 5}">${fmt1(last.w)} kg</text></svg>`;
}

/* =========================================================
   JS 6. TOP BAR & NAVIGATION
   ========================================================= */
function greeting() { const h = new Date().getHours(); return h < 5 ? 'Late-night grind' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
function applyMode() {
  document.documentElement.dataset.mode = S.settings.mode;
  const ic = icon(S.settings.mode === 'dark' ? 'sun' : 'moon');
  $('#top-mode').innerHTML = ic; $('#landing-mode').innerHTML = ic;
}
function updateTop() {
  $('#greet').textContent = `${greeting()}, ${S.profile.name || 'athlete'}`;
  $('#top-date').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.go === ui.view));
}
function navigate(v) {
  if (v === ui.view) return;
  const from = ui.view; ui.view = v; document.body.dataset.view = v;
  const landing = $('#landing');
  if (v === 'landing') {
    landing.hidden = false; requestAnimationFrame(() => landing.classList.remove('leaving'));
    setTimeout(() => { if (ui.view === 'landing') $('#app').hidden = true; }, 600);
    return;
  }
  $('#app').hidden = false;
  if (from === 'landing') { landing.classList.add('leaving'); setTimeout(() => { if (ui.view !== 'landing') landing.hidden = true; }, reduceMotion ? 0 : 650); }
  $$('.view').forEach(x => x.classList.toggle('active', x.id === 'v-' + v));
  renderView(v); updateTop(); window.scrollTo({ top: 0, behavior: from === 'landing' ? 'auto' : 'smooth' });
}
function renderView(v = ui.view) { ({ dash: renderDash, diet: renderDiet, workout: renderWorkout, rank: renderRank })[v]?.(); }
// After any data change: persist, check achievements/rank, redraw
function commit() { save(); checkProgress(); renderView(); }

/* =========================================================
   JS 7. DASHBOARD
   ========================================================= */
function weekSummary(ev) {
  const t = todayKey(), start = addDays(t, -6), inWk = k => k >= start && k <= t;
  const workouts = workoutDates().filter(inWk).length;
  const dks = Object.keys(S.diet.days).filter(k => inWk(k) && S.diet.days[k].meals.length);
  const avg = f => dks.length ? dks.reduce((a, k) => a + dayTotals(k)[f], 0) / dks.length : 0;
  return { start, t, workouts, avgCal: avg('cal'), avgPro: avg('protein'), xp: ev.filter(e => inWk(e.date)).reduce((a, e) => a + e.xp, 0), logged: dks.length };
}
const quoteOfDay = () => QUOTES[Math.floor(fromKey(todayKey()).getTime() / 864e5) % QUOTES.length];

function renderDash() {
  const t = todayKey(), tot = dayTotals(t), g = S.diet.goals, st = streakInfo(), xs = xpSummary();
  const ri = rankIndex(xs.total), r = RANKS[ri], next = RANKS[ri + 1];
  const pct = next ? (xs.total - r.min) / (next.min - r.min) * 100 : 100;
  const todaySess = S.workout.sessions[t], wk = weekSummary(xs.ev), water = S.diet.days[t]?.water || 0;
  let strip = '';
  for (let i = 0; i < 7; i++) {
    const k = addDays(wk.start, i), s = dayStatus(k);
    strip += `<div class="strip-day"><div class="strip-box ${s || ''} ${k === t ? 'today' : ''}" title="${fmtDate(k, { weekday: 'long', day: 'numeric', month: 'short' })}: ${STATUS_LABEL[s]}${S.workout.sessions[k] ? ' · ' + esc(S.workout.sessions[k].day) + ' workout' : ''}">${S.workout.sessions[k] ? '<i></i>' : ''}</div>${fromKey(k).toLocaleDateString('en-GB', { weekday: 'short' })}</div>`;
  }
  $('#v-dash').innerHTML = `
    ${S.sample ? `<div class="sample-note"><span><b>You're looking at sample data</b> — five weeks of made-up training and meals so you can see how everything works.</span>
      <div><button class="btn sm" data-act="keep-sample">Keep exploring</button><button class="btn sm orange" data-act="start-fresh">Start fresh</button></div></div>` : ''}
    <div class="dash-head">
      <div><p class="eyebrow">${fmtDate(t, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1>${greeting()},<br><span class="acc">${esc(S.profile.name || 'athlete')}</span></h1></div>
      <figure class="quote"><span class="eyebrow">Quote of the day</span><blockquote>“${esc(quoteOfDay())}”</blockquote></figure>
    </div>
    <div class="dcards">
      <button class="dcard dcard-diet" data-go="diet">
        <div class="dcard-title"><div><p class="eyebrow">Fuel</p><h2>Diet</h2></div><span class="dcard-go">${icon('arrow')}</span></div>
        <div class="dcard-body">
          <div class="ring-wrap">${ring(tot.cal, g.cal, 'lime', 96, 10)}<div class="ring-txt"><b style="font-size:20px">${Math.round(tot.cal / g.cal * 100)}%</b></div></div>
          <div class="dcard-lines"><span><b>${fmt(tot.cal)}</b> / ${fmt(g.cal)} kcal</span><span><b>${fmt(tot.protein)}</b> / ${fmt(g.protein)} g protein</span><span><b>${water}</b> / ${S.diet.waterGoal} glasses water</span></div>
        </div>
      </button>
      <button class="dcard dcard-wo" data-go="workout">
        <div class="dcard-title"><div><p class="eyebrow">Train</p><h2>Workout</h2></div><span class="dcard-go">${icon('arrow')}</span></div>
        <div class="dcard-body"><div class="dcard-lines">
          <span>${todaySess ? 'Done today' : 'Next up'}</span>
          <span class="dcard-big">${esc(todaySess ? todaySess.day : suggestDay(t))}${todaySess ? ' <span class="acc">✓</span>' : ''}</span>
          <span>${icon('flame', 'acc-o')} Streak <b>${st.current}</b> · Best <b>${st.longest}</b> · ${esc(SPLIT_PRESETS[S.workout.split].name)}</span>
        </div></div>
      </button>
      <button class="dcard dcard-rank" data-go="rank" style="--rank-c:${r.c1};--rank-soft:${r.c2}33">
        <div class="dcard-title"><div><p class="eyebrow">Level</p><h2>Rank</h2></div><span class="dcard-go">${icon('arrow')}</span></div>
        <div class="dcard-body">${badgeSVG(ri, 70)}
          <div class="dcard-lines" style="flex:1"><span class="dcard-big">${r.name}</span><span><b>${fmt(xs.total)}</b> XP${next ? ` · ${fmt(next.min - xs.total)} to ${next.name}` : ''}</span>
            <div class="bar" style="--x:1"><i style="width:${pct}%;background:linear-gradient(90deg,${r.c2},${r.c1})"></i></div></div>
        </div>
      </button>
    </div>
    <div class="card">
      <div class="card-top"><div><p class="eyebrow">Last 7 days · ${fmtDate(wk.start)} – ${fmtDate(wk.t)}</p><h2 class="card-h" style="margin-top:6px">Weekly summary</h2></div></div>
      <div class="week">
        <div class="week-stats">
          <div class="wstat"><span class="eyebrow">Workouts</span><b>${wk.workouts}</b><small>sessions logged</small></div>
          <div class="wstat"><span class="eyebrow">Avg kcal</span><b>${fmt(wk.avgCal)}</b><small>goal ${fmt(g.cal)}</small></div>
          <div class="wstat"><span class="eyebrow">Avg protein</span><b>${fmt(wk.avgPro)}<small style="font-size:18px">g</small></b><small>goal ${fmt(g.protein)} g</small></div>
          <div class="wstat"><span class="eyebrow">XP earned</span><b class="acc">+${fmt(wk.xp)}</b><small>this week</small></div>
        </div>
        <div><div class="strip">${strip}</div>
          <div class="legend"><span><i style="background:var(--good-bg)"></i>Diet hit</span><span><i style="background:var(--warn-bg)"></i>Partly</span><span><i style="background:var(--bad-bg)"></i>Missed</span><span><i style="background:var(--orange);border-radius:50%"></i>Workout</span></div></div>
      </div>
    </div>`;
}

/* =========================================================
   JS 8. DIET
   ========================================================= */
function calcGoals(c) {
  const bmr = 10 * num(c.weight) + 6.25 * num(c.height) - 5 * num(c.age) + (c.gender === 'male' ? 5 : -161);
  const tdee = bmr * num(c.activity), mult = { cut: .8, maintain: 1, bulk: 1.1 }[c.goal];
  const cal = Math.round(tdee * mult / 10) * 10, gkg = { cut: 2.2, maintain: 1.8, bulk: 2.0 }[c.goal];
  const protein = Math.round(num(c.weight) * gkg), fat = Math.round(cal * .25 / 9);
  const carbs = Math.max(0, Math.round((cal - protein * 4 - fat * 9) / 4));
  return { bmr, tdee, mult, cal, gkg, protein, fat, carbs };
}
const ACTIVITY = [[1.2, 'Sedentary — desk job, little exercise'], [1.375, 'Light — 1–3 sessions a week'], [1.55, 'Moderate — 3–5 sessions a week'], [1.725, 'Very active — 6–7 sessions a week'], [1.9, 'Athlete — twice a day or physical job']];

function calcOutHTML() {
  const c = S.diet.calc, r = calcGoals(c);
  if (!(num(c.weight) > 0 && num(c.height) > 0 && num(c.age) > 0)) return `<p class="muted">Enter age, height and weight to see suggested goals.</p>`;
  const goalTxt = { cut: '× 0.80 (−20% deficit)', maintain: '× 1.00', bulk: '× 1.10 (+10% surplus)' }[c.goal];
  return `<div class="calc-nums">
      <div><small>Calories</small><b class="acc">${fmt(r.cal)}</b></div><div><small>Protein</small><b class="acc-o">${r.protein} g</b></div>
      <div><small>Carbs</small><b>${r.carbs} g</b></div><div><small>Fat</small><b>${r.fat} g</b></div></div>
    <p class="formula">BMR = 10×<b>${num(c.weight)}</b>kg + 6.25×<b>${num(c.height)}</b>cm − 5×<b>${num(c.age)}</b> ${c.gender === 'male' ? '+ 5' : '− 161'} = <b>${fmt(r.bmr)}</b> kcal<br>
      TDEE = BMR × ${c.activity} = <b>${fmt(r.tdee)}</b> kcal · Target = TDEE ${goalTxt} = <b>${fmt(r.cal)}</b> kcal<br>
      Protein = ${r.gkg} g/kg × ${num(c.weight)} kg · Fat = 25% of kcal · Carbs = the rest</p>
    <div><button class="btn primary" type="button" data-act="calc-apply">${icon('check')} Use these goals</button></div>`;
}

function renderDiet() {
  const k = ui.dietDate, t = todayKey(), d = S.diet.days[k] || { meals: [], water: 0 }, tot = dayTotals(k), g = S.diet.goals, c = S.diet.calc;
  const left = (v, goal, unit) => v <= goal ? `<b>${fmt(goal - v)}</b> ${unit} left` : `<b style="color:var(--bad)">${fmt(v - goal)}</b> ${unit} over`;
  const bar = (v, goal, cls) => `<div class="bar ${cls}"><i style="width:${goal > 0 ? Math.min(v / goal * 100, 100) : 0}%"></i></div>`;
  const glasses = Math.max(S.diet.waterGoal, d.water);
  const sel = ui.dietSel, selDay = S.diet.days[sel], selTot = dayTotals(sel), selSt = dayStatus(sel);
  $('#v-diet').innerHTML = `
    <div class="section-h"><div><p class="eyebrow">Fuel the work</p><h1>Diet</h1></div>
      <div class="day-nav"><button class="icon-btn sm" data-act="diet-prev" aria-label="Previous day">${icon('left')}</button>
        <b>${k === t ? 'Today' : fmtDate(k, { weekday: 'short', day: 'numeric', month: 'short' })}</b>
        <button class="icon-btn sm" data-act="diet-next" aria-label="Next day" ${k >= t ? 'disabled' : ''}>${icon('right')}</button>
        ${k !== t ? `<button class="btn sm" data-act="diet-today">Today</button>` : ''}</div></div>
    <div class="grid">
      <div class="card">
        <div class="card-top"><h2 class="card-h">${k === t ? "Today's" : fmtDate(k, { day: 'numeric', month: 'short' })} macros</h2><span class="pill ${dayStatus(k) || 'none'}">${STATUS_LABEL[dayStatus(k)]}</span></div>
        <div class="today-rings">
          <div class="ring-col"><div class="ring-wrap">${ring(tot.cal, g.cal, 'lime')}<div class="ring-txt"><b>${fmt(tot.cal)}</b><small>/ ${fmt(g.cal)} kcal</small></div></div><span class="lbl">Calories</span><span class="left">${left(tot.cal, g.cal, 'kcal')}</span></div>
          <div class="ring-col"><div class="ring-wrap">${ring(tot.protein, g.protein, 'orange')}<div class="ring-txt"><b>${fmt(tot.protein)}</b><small>/ ${fmt(g.protein)} g</small></div></div><span class="lbl">Protein</span><span class="left">${left(tot.protein, g.protein, 'g')}</span></div>
        </div>
        <div class="macro-bars">
          <div><div class="top"><span>Carbs</span><b>${fmt(tot.carbs)} / ${fmt(g.carbs)} g</b></div>${bar(tot.carbs, g.carbs, '')}</div>
          <div><div class="top"><span>Fat</span><b>${fmt(tot.fat)} / ${fmt(g.fat)} g</b></div>${bar(tot.fat, g.fat, 'o')}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-top"><h2 class="card-h">Log a meal</h2></div>
        <form id="meal-form" class="meal-form" autocomplete="off">
          <label class="field full"><span>Meal</span><input type="text" id="mf-name" placeholder="e.g. Chicken wrap" required></label>
          <label class="field"><span>Calories</span><input type="number" id="mf-cal" inputmode="numeric" min="0" placeholder="kcal" required></label>
          <label class="field"><span>Protein g</span><input type="number" id="mf-protein" inputmode="decimal" min="0" placeholder="g"></label>
          <label class="field"><span>Carbs g</span><input type="number" id="mf-carbs" inputmode="decimal" min="0" placeholder="optional"></label>
          <label class="field"><span>Fat g</span><input type="number" id="mf-fat" inputmode="decimal" min="0" placeholder="optional"></label>
          <div class="form-foot"><label class="check"><input type="checkbox" id="mf-save"> Save to my foods</label><button class="btn primary" type="submit">${icon('plus')} Add meal</button></div>
        </form>
        <p class="eyebrow" style="margin:18px 0 10px">My foods · one tap to add</p>
        <div class="saved">${S.diet.saved.length ? S.diet.saved.map(f => `<span class="chip"><button data-act="food-add" data-id="${f.id}" style="text-align:left">${esc(f.name)}<br><small>${fmt(f.cal)} kcal · ${fmt(f.protein)} g</small></button><button class="x" data-act="food-del" data-id="${f.id}" aria-label="Remove ${esc(f.name)} from my foods">${icon('x')}</button></span>`).join('') : '<p class="empty">Tick “Save to my foods” when adding a meal, or tap the star on a logged meal.</p>'}</div>
      </div>
      <div class="card">
        <div class="card-top"><h2 class="card-h">Meals</h2><span class="muted mono" style="font-size:13px">${d.meals.length} logged</span></div>
        <div class="rows">${d.meals.length ? d.meals.map(m => `<div class="row"><div class="row-main"><b>${esc(m.name)}</b><small>P ${fmt(m.protein)}g · C ${fmt(m.carbs)}g · F ${fmt(m.fat)}g</small></div><span class="row-num">${fmt(m.cal)}</span>
          <div class="row-actions"><button class="icon-btn sm" data-act="meal-star" data-id="${m.id}" aria-label="Save to my foods">${icon('star')}</button><button class="icon-btn sm" data-act="meal-del" data-id="${m.id}" aria-label="Delete meal">${icon('trash')}</button></div></div>`).join('') : '<p class="empty">No meals logged for this day yet.</p>'}</div>
      </div>
      <div class="card">
        <div class="card-top"><h2 class="card-h">Water</h2><span class="mono" style="font-size:14px"><b style="color:var(--water)">${d.water}</b> / ${S.diet.waterGoal} glasses</span></div>
        <div class="water">${Array.from({ length: glasses }, (_, i) => `<button class="glass-btn" data-act="water-set" data-n="${i + 1}" aria-label="${i + 1} glasses">${glassSVG(i < d.water)}</button>`).join('')}</div>
        <div class="bar b" style="margin:14px 0"><i style="width:${Math.min(d.water / S.diet.waterGoal * 100, 100)}%"></i></div>
        <div class="modal-btns"><button class="btn sm" data-act="water-dec">${icon('minus')} Glass</button><button class="btn sm" data-act="water-inc">${icon('plus')} Glass</button><span class="muted" style="font-size:13px;align-self:center">≈ ${fmt1(d.water * .25)} L of ${fmt1(S.diet.waterGoal * .25)} L</span></div>
      </div>
      <div class="card">
        ${calendar(ui.dietCal.y, ui.dietCal.m, (key, n, isT, fut) => { const s = dayStatus(key); return `<button class="cal-cell st-${s || 'none'} ${isT ? 'today' : ''} ${key === sel ? 'sel' : ''}" data-act="diet-cal-day" data-k="${key}" ${fut ? 'disabled' : ''} aria-label="${fmtDate(key, { day: 'numeric', month: 'long' })}: ${STATUS_LABEL[s]}">${n}</button>`; }, 'diet-cal-prev', 'diet-cal-next')}
        <div class="legend"><span><i style="background:var(--good-bg)"></i>Goals hit</span><span><i style="background:var(--warn-bg)"></i>Partly hit</span><span><i style="background:var(--bad-bg)"></i>Missed</span><span><i style="background:var(--surface-2)"></i>Not logged</span></div>
        <div class="day-detail">
          <div class="card-top" style="margin-bottom:8px"><b>${fmtDate(sel, { weekday: 'long', day: 'numeric', month: 'long' })}</b><span class="pill ${selSt || 'none'}">${STATUS_LABEL[selSt]}</span></div>
          ${selDay && selDay.meals.length ? `<p class="mono muted" style="font-size:12px;margin-bottom:6px">${fmt(selTot.cal)} kcal · ${fmt(selTot.protein)} g protein · ${selDay.water || 0} glasses</p>
            <div class="rows">${selDay.meals.map(m => `<div class="row"><div class="row-main"><b>${esc(m.name)}</b><small>${fmt(m.protein)} g protein</small></div><span class="row-num">${fmt(m.cal)}</span></div>`).join('')}</div>` : '<p class="empty">Nothing logged on this day.</p>'}
          ${sel !== k ? `<button class="btn sm" data-act="diet-open-day" style="margin-top:8px">${icon('edit')} Edit this day</button>` : ''}
        </div>
      </div>
      <div class="card">
        <div class="card-top"><h2 class="card-h">Daily goals</h2></div>
        <div class="fgrid">
          <label class="field"><span>Calories</span><input type="number" id="g-cal" value="${g.cal}" min="0"></label>
          <label class="field"><span>Protein g</span><input type="number" id="g-protein" value="${g.protein}" min="0"></label>
          <label class="field"><span>Carbs g</span><input type="number" id="g-carbs" value="${g.carbs}" min="0"></label>
          <label class="field"><span>Fat g</span><input type="number" id="g-fat" value="${g.fat}" min="0"></label>
          <label class="field"><span>Water glasses</span><input type="number" id="g-water" value="${S.diet.waterGoal}" min="1" max="20"></label>
        </div>
        <button class="btn primary" data-act="goals-save" style="margin-top:14px">${icon('check')} Save goals</button>
        <hr style="border:0;border-top:1px solid var(--line);margin:20px 0">
        <h3 class="card-h" style="font-size:20px;margin-bottom:4px">Suggest my goals</h3>
        <p class="muted" style="font-size:13px;margin-bottom:14px">Mifflin-St Jeor energy estimate with a protein target in g per kg of body weight.</p>
        <form id="calc-form" autocomplete="off">
          <div class="fgrid">
            <label class="field"><span>Age</span><input type="number" id="c-age" value="${c.age}" min="14" max="90"></label>
            <label class="field"><span>Height cm</span><input type="number" id="c-height" value="${c.height}" min="120" max="230"></label>
            <label class="field"><span>Weight kg</span><input type="number" id="c-weight" value="${c.weight}" min="35" max="250"></label>
          </div>
          <label class="field" style="margin-top:12px"><span>Activity level</span><select id="c-activity">${ACTIVITY.map(([v, l]) => `<option value="${v}" ${num(c.activity) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
            <div class="seg" role="group" aria-label="Gender">${['male', 'female'].map(v => `<button type="button" class="${c.gender === v ? 'on' : ''}" data-act="calc-gender" data-v="${v}">${v === 'male' ? 'Male' : 'Female'}</button>`).join('')}</div>
            <div class="seg" role="group" aria-label="Goal">${['cut', 'maintain', 'bulk'].map(v => `<button type="button" class="${c.goal === v ? 'on' : ''}" data-act="calc-goal" data-v="${v}">${v[0].toUpperCase() + v.slice(1)}</button>`).join('')}</div>
          </div>
          <div class="calc-out" id="calc-out">${calcOutHTML()}</div>
        </form>
      </div>
    </div>`;
}

/* =========================================================
   JS 9. WORKOUT
   ========================================================= */
const currentDays = () => S.workout.splits[S.workout.split];
// Next day in the rotation after the last session of the current split
function suggestDay(k) {
  const days = currentDays(), ds = workoutDates().filter(d => d < k && S.workout.sessions[d].split === S.workout.split);
  if (!ds.length) return days[0].name;
  const i = days.findIndex(d => d.name === S.workout.sessions[ds[ds.length - 1]].day);
  return days[(i + 1) % days.length].name;
}
function buildDraft(k, dayName) {
  const sess = S.workout.sessions[k];
  if (sess && (!dayName || sess.day === dayName)) return { date: k, split: sess.split, day: sess.day, ex: sess.ex.map(e => ({ name: e.name, sets: e.sets.map(s => ({ r: s.r, w: s.w, done: true })) })) };
  const days = currentDays(), day = days.find(d => d.name === dayName) || days.find(d => d.name === suggestDay(k)) || days[0];
  return { date: k, split: S.workout.split, day: day.name, ex: day.ex.map(name => {
    const last = lastBefore(name, k), n = last ? Math.max(last.ex.sets.length, 1) : 3;
    return { name, sets: Array.from({ length: n }, () => ({ r: '', w: '', done: false })) };
  }) };
}
// The in-progress log lives in state so a refresh mid-workout keeps it
function ensureDraft() {
  const d = S.workout.draft;
  if (d && d.date === ui.woDate) return d;
  S.workout.draft = buildDraft(ui.woDate); saveSoon();
  return S.workout.draft;
}

function exerciseHTML(ex, i, date) {
  const last = lastBefore(ex.name, date), best = bestBefore(ex.name, date), top = topWeight(ex);
  const isPR = best > 0 && top > best;
  return `<div class="ex" data-ex="${i}">
    <div class="ex-head"><h4>${esc(ex.name)}</h4><span class="best">${best > 0 ? `Best ${fmt1(best)} kg` : 'No history yet'}</span>
      <span class="pr-badge" ${isPR ? '' : 'hidden'}>${icon('star')} PR</span><span class="spacer"></span>
      <button class="icon-btn sm" data-act="ex-del" data-ex="${i}" aria-label="Remove ${esc(ex.name)} from this session">${icon('x')}</button></div>
    <div class="set-row hd"><span>Set</span><span>Last time</span><span style="text-align:center">kg</span><span style="text-align:center">Reps</span><span></span></div>
    ${ex.sets.map((s, j) => { const p = last?.ex.sets[j]; return `<div class="set-row ${s.done ? 'done' : ''}" data-set="${j}">
      <span class="n">${j + 1}</span><span class="prev">${p ? `${fmt1(num(p.w))} kg × ${p.r}` : '—'}</span>
      <input class="in-w" type="number" inputmode="decimal" step="0.5" min="0" value="${esc(s.w)}" placeholder="${p ? fmt1(num(p.w)) : 'kg'}" data-ex="${i}" data-set="${j}" aria-label="${esc(ex.name)} set ${j + 1} weight in kg">
      <input class="in-r" type="number" inputmode="numeric" min="0" value="${esc(s.r)}" placeholder="${p ? p.r : 'reps'}" data-ex="${i}" data-set="${j}" aria-label="${esc(ex.name)} set ${j + 1} reps">
      <button class="tick ${s.done ? 'on' : ''}" data-act="set-done" data-ex="${i}" data-set="${j}" aria-label="Mark set ${j + 1} done and start rest timer">${icon('check')}</button></div>`; }).join('')}
    <div class="ex-foot"><button class="btn sm" data-act="set-add" data-ex="${i}">${icon('plus')} Set</button>${ex.sets.length > 1 ? `<button class="btn sm" data-act="set-del" data-ex="${i}">${icon('minus')} Set</button>` : ''}</div>
  </div>`;
}

function renderWorkout() {
  const d = ensureDraft(), t = todayKey(), st = streakInfo(), days = currentDays();
  const saved = S.workout.sessions[d.date];
  if (ui.splitTab >= days.length) ui.splitTab = 0;
  const tab = days[ui.splitTab];
  // Exercises available for the chart, most logged first
  const counts = {}; for (const s of Object.values(S.workout.sessions)) for (const e of s.ex) counts[e.name] = (counts[e.name] || 0) + 1;
  const exNames = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  if (!ui.chartEx || !counts[ui.chartEx]) ui.chartEx = exNames[0] || null;
  const pts = ui.chartEx ? workoutDates().map(k => { const e = S.workout.sessions[k].ex.find(x => x.name === ui.chartEx); return e && topWeight(e) > 0 ? { date: k, w: topWeight(e) } : null; }).filter(Boolean) : [];
  const monthCount = workoutDates().filter(k => k.startsWith(`${ui.woCal.y}-${pad(ui.woCal.m + 1)}`)).length;
  const dayOpts = [...new Set([...days.map(x => x.name), d.day])];

  $('#v-workout').innerHTML = `
    <div class="section-h"><div><p class="eyebrow">Train with intent</p><h1>Workout</h1></div></div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-top"><h2 class="card-h">Your split</h2><div class="modal-btns">
        <button class="btn sm" data-act="split-edit">${icon(ui.editSplit ? 'check' : 'edit')} ${ui.editSplit ? 'Done editing' : 'Edit exercises'}</button>
        ${ui.editSplit ? `<button class="btn sm" data-act="split-reset">${icon('reset')} Reset to preset</button>` : ''}</div></div>
      <div class="splits">${Object.entries(SPLIT_PRESETS).map(([id, p]) => `<button class="split-btn ${S.workout.split === id ? 'on' : ''}" data-act="split-pick" data-v="${id}"><b>${p.name}</b><small>${p.blurb} · ${S.workout.splits[id].map(x => esc(x.name)).join(', ')}</small></button>`).join('')}</div>
      <div class="day-tabs">${days.map((x, i) => `<button class="day-tab ${i === ui.splitTab ? 'on' : ''}" data-act="split-tab" data-i="${i}">${esc(x.name)}</button>`).join('')}</div>
      <div class="ex-list">${tab.ex.map((name, i) => ui.editSplit
        ? `<div class="ex-item"><span class="n">${i + 1}</span><input type="text" class="split-ex-name" data-i="${i}" value="${esc(name)}" aria-label="Exercise ${i + 1} name"><button class="icon-btn sm" data-act="split-ex-del" data-i="${i}" aria-label="Remove ${esc(name)}">${icon('trash')}</button></div>`
        : `<div class="ex-item"><span class="n">${i + 1}</span><span class="grow">${esc(name)}</span></div>`).join('')}</div>
      ${ui.editSplit ? `<form class="inline-add" id="split-add-form"><input type="text" id="split-add-name" placeholder="Add an exercise to ${esc(tab.name)}"><button class="btn primary" type="submit">${icon('plus')} Add</button></form>` : ''}
    </div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));align-items:start">
      <div class="card">
        <div class="card-top"><h2 class="card-h">Log workout</h2>${saved ? `<span class="pill hit">${icon('check')} Saved</span>` : `<span class="pill none">Not saved yet</span>`}</div>
        <div class="log-head">
          <label class="field"><span>Date</span><input type="date" id="wo-date" value="${d.date}" max="${t}"></label>
          <label class="field"><span>Split day</span><select id="wo-day">${dayOpts.map(n => `<option ${n === d.day ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
        </div>
        ${d.ex.map((ex, i) => exerciseHTML(ex, i, d.date)).join('') || '<p class="empty">No exercises in this session. Add one below.</p>'}
        <form class="inline-add" id="ex-add-form"><input type="text" id="ex-add-name" placeholder="Add an exercise to this session"><button class="btn" type="submit">${icon('plus')} Add</button></form>
        <div class="modal-btns" style="margin-top:16px"><button class="btn orange" data-act="wo-save" style="flex:1">${icon('check')} ${saved ? 'Update workout' : 'Save workout'}</button>
          ${saved ? `<button class="btn danger" data-act="wo-delete">${icon('trash')} Delete</button>` : ''}</div>
        <p class="muted" style="font-size:12px;margin-top:10px">Grey numbers are last session's — beat them. Tick a set to start the rest timer. Empty sets are skipped when saving.</p>
      </div>
      <div class="stack">
        <div class="card">
          <div class="streaks"><div class="hot"><span class="eyebrow">Current streak</span><b>${st.current}</b></div><div><span class="eyebrow">Longest</span><b>${st.longest}</b></div><div><span class="eyebrow">This month</span><b>${monthCount}</b></div></div>
          ${calendar(ui.woCal.y, ui.woCal.m, (key, n, isT, fut) => { const s = S.workout.sessions[key]; return `<button class="cal-cell ${s ? 'wo' : ''} ${isT ? 'today' : ''} ${key === d.date ? 'sel' : ''}" data-act="wo-cal-day" data-k="${key}" ${fut ? 'disabled' : ''} aria-label="${fmtDate(key, { day: 'numeric', month: 'long' })}${s ? ': ' + esc(s.day) : ''}"><span>${n}</span>${s ? `<em>${esc(shortDay(s.day))}</em>` : ''}</button>`; }, 'wo-cal-prev', 'wo-cal-next')}
          <p class="muted" style="font-size:12px;margin-top:10px">A streak counts workouts in a row with no more than one rest day between them. Tap a day to open or log it.</p>
        </div>
        <div class="card">
          <div class="card-top"><h2 class="card-h">Progress</h2>${exNames.length ? `<select id="chart-ex" style="width:auto;max-width:100%" aria-label="Exercise">${exNames.map(n => `<option ${n === ui.chartEx ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>` : ''}</div>
          <div class="chart-box">${ui.chartEx ? lineChart(pts) : '<p class="empty">Save a workout to start tracking progress.</p>'}</div>
          ${pts.length >= 2 ? `<div class="chart-stats"><span>First <b>${fmt1(pts[0].w)} kg</b></span><span>Latest <b>${fmt1(pts[pts.length - 1].w)} kg</b></span><span>Change <b class="acc">${pts[pts.length - 1].w - pts[0].w >= 0 ? '+' : ''}${fmt1(pts[pts.length - 1].w - pts[0].w)} kg</b></span><span>Sessions <b>${pts.length}</b></span></div>` : ''}
          <p class="muted" style="font-size:12px;margin-top:8px">Heaviest set per session (kg).</p>
        </div>
      </div>
    </div>`;
}

function onSetInput(el) {
  const d = ensureDraft(), i = +el.dataset.ex, j = +el.dataset.set, ex = d.ex[i];
  ex.sets[j][el.classList.contains('in-w') ? 'w' : 'r'] = el.value; saveSoon();
  // Live PR badge
  const best = bestBefore(ex.name, d.date), isPR = best > 0 && topWeight(ex) > best, b = $(`.ex[data-ex="${i}"] .pr-badge`);
  if (!b) return;
  if (isPR && b.hidden) { b.hidden = false; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
  else if (!isPR) b.hidden = true;
}

function saveWorkout() {
  const d = ensureDraft();
  const ex = d.ex.map(e => ({ name: e.name, sets: e.sets.filter(s => num(s.r) > 0).map(s => ({ r: num(s.r), w: num(s.w) })) })).filter(e => e.sets.length);
  if (!ex.length) { toast('Enter reps for at least one set, then save.', 'warn'); return; }
  const key = p => p.name + '|' + p.w, before = allPRs().filter(p => p.date === d.date).map(key), existed = !!S.workout.sessions[d.date];
  S.workout.sessions[d.date] = { split: d.split, day: d.day, ex };
  S.workout.draft = buildDraft(d.date);
  const prs = allPRs().filter(p => p.date === d.date && !before.includes(key(p)));
  toast(existed ? 'Workout updated.' : `${d.day} workout saved · +${XP.workout} XP`, 'good');
  if (prs.length) setTimeout(() => { confetti(); toast(`<b>New PR${prs.length > 1 ? 's' : ''}!</b>${prs.map(p => `${esc(p.name)} ${fmt1(p.w)} kg <span style="opacity:.7">(was ${fmt1(p.prev)})</span>`).join('<br>')}<br>+${prs.length * XP.pr} XP`, 'pr', true); }, 250);
  commit();
}

/* ---------- rest timer ---------- */
const rest = { total: 90, left: 90, running: false, end: 0, tick: 0 };
const REST_C = 2 * Math.PI * 19;
function restDraw() {
  const s = Math.ceil(rest.left);
  $('#rest-time').textContent = `${Math.floor(s / 60)}:${pad(s % 60)}`;
  $('#rest-fg').style.strokeDashoffset = (REST_C * (1 - rest.left / rest.total)).toFixed(2);
  $('#rest-play').innerHTML = icon(rest.running ? 'pause' : 'play');
  $('#rest-play').setAttribute('aria-label', rest.running ? 'Pause rest timer' : 'Start rest timer');
}
function restStart() { if (rest.left <= 0) rest.left = rest.total; rest.end = Date.now() + rest.left * 1000; rest.running = true; clearInterval(rest.tick); rest.tick = setInterval(restTick, 200); restDraw(); }
function restPause() { rest.left = Math.max(0, (rest.end - Date.now()) / 1000); rest.running = false; clearInterval(rest.tick); restDraw(); }
function restTick() {
  rest.left = Math.max(0, (rest.end - Date.now()) / 1000);
  if (rest.left <= 0) {
    rest.running = false; clearInterval(rest.tick); beep(); try { navigator.vibrate?.([200, 100, 200]); } catch (e) {}
    const el = $('#rest'); el.classList.add('done'); setTimeout(() => el.classList.remove('done'), 1100);
    toast('Rest over — time for the next set.', 'good');
  }
  restDraw();
}
let audioCtx = null;
function beep() {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    [0, .22, .44].forEach(t => { const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(.0001, audioCtx.currentTime + t); g.gain.exponentialRampToValueAtTime(.25, audioCtx.currentTime + t + .02); g.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + t + .18);
      o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + .2); });
  } catch (e) { /* audio unavailable */ }
}

/* =========================================================
   JS 10. RANK
   ========================================================= */
function renderRank() {
  const xs = xpSummary(), ri = rankIndex(xs.total), r = RANKS[ri], next = RANKS[ri + 1], c = statsCtx();
  const pct = next ? (xs.total - r.min) / (next.min - r.min) * 100 : 100;
  const unlocked = ACHIEVEMENTS.filter(a => a.test(c));
  const rowsX = [
    ['Workout logged', `+${XP.workout} per session`, xs.by.workout],
    ['Streak bonus', `+${XP.streakPer} × streak length (max +${XP.streakCap}) per workout`, xs.by.streak],
    ['Personal record', `+${XP.pr} per PR`, xs.by.pr],
    ['Diet goals', `+${XP.dietHit} per day hit · +${XP.dietPartial} partly hit`, xs.by.diet]
  ];
  $('#v-rank').innerHTML = `
    <div class="section-h"><div><p class="eyebrow">Earn your stripes</p><h1>Rank</h1></div></div>
    <div class="card rank-hero" style="--rank-soft:${r.c2}40;--rc1:${r.c1};--rc2:${r.c2}">
      <div class="rank-badge-lg">${badgeSVG(ri, 160)}</div>
      <div class="rank-info"><p class="eyebrow">Current rank · ${ri + 1} of ${RANKS.length}</p><h2 class="rank-name">${r.name}</h2>
        <p class="rank-xp">${fmt(xs.total)} XP</p><div class="xpbar"><i style="width:${pct}%"></i></div>
        <p class="muted">${next ? `<b style="color:var(--text)">${fmt(next.min - xs.total)} XP</b> to ${next.name} (${fmt(next.min)} XP)` : 'Top of the ladder. Respect.'}</p></div>
    </div>
    <div class="ladder">${RANKS.map((x, i) => `<div class="rung ${i > ri ? 'locked' : ''} ${i === ri ? 'cur' : ''}">${badgeSVG(i, 54)}<b>${x.name}</b><small>${fmt(x.min)} XP</small></div>`).join('')}</div>
    <div class="grid">
      <div class="card"><div class="card-top"><h2 class="card-h">How XP works</h2></div>
        <div style="overflow-x:auto"><table class="xp-table"><thead><tr><th>Source</th><th>Rule</th><th class="r">Count</th><th class="r">XP</th></tr></thead>
          <tbody>${rowsX.map(([a, b, v]) => `<tr><td><b>${a}</b></td><td><code>${b}</code></td><td class="r">${v.n}</td><td class="r">${fmt(v.xp)}</td></tr>`).join('')}</tbody>
          <tfoot><tr><td colspan="3">Total</td><td class="r">${fmt(xs.total)}</td></tr></tfoot></table></div>
        <p class="formula" style="margin-top:12px"><b>XP</b> = 100×workouts + Σ min(5×streak, 50) + 50×PRs + 50×diet days hit + 20×diet days partly hit<br>
          Diet “hit” = calories within ±10% of goal and protein ≥ 95%. A PR = a heavier top set than any earlier session of that exercise. XP is recalculated from your log, so editing history keeps it honest.</p>
      </div>
      <div class="card"><div class="card-top"><h2 class="card-h">Recent XP</h2></div>
        <div class="rows">${xs.ev.slice(0, 9).map(e => `<div class="row"><div class="row-main"><b>${esc(e.label)}</b><small>${fmtDate(e.date, { weekday: 'short', day: 'numeric', month: 'short' })}</small></div><span class="row-num acc">+${e.xp}</span></div>`).join('') || '<p class="empty">Log a workout or a meal to start earning XP.</p>'}</div>
      </div>
    </div>
    <div class="card" style="margin-top:16px"><div class="card-top"><h2 class="card-h">Achievements</h2><span class="mono muted" style="font-size:13px">${unlocked.length} / ${ACHIEVEMENTS.length}</span></div>
      <div class="ach-grid">${ACHIEVEMENTS.map(a => { const on = a.test(c); return `<div class="ach ${on ? '' : 'locked'}"><span class="medal">${icon(on ? a.ic : 'lock')}</span><div><b>${a.name}</b><small>${a.desc}</small></div></div>`; }).join('')}</div>
    </div>`;
}

/* =========================================================
   JS 11. OVERLAYS: toasts, modal, confetti, rank-up
   ========================================================= */
function toast(msg, kind = 'info', html = false) {
  const t = document.createElement('div'); t.className = `toast ${kind}`; t[html ? 'innerHTML' : 'textContent'] = msg;
  $('#toasts').append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, kind === 'pr' || kind === 'ach' ? 4500 : 2600);
}
let pendingConfirm = null;
function openModal(html) { const m = $('#modal'); $('#modal-body').innerHTML = html; m.hidden = false; requestAnimationFrame(() => m.classList.add('open')); }
function closeModal() { const m = $('#modal'); m.classList.remove('open'); setTimeout(() => { if (!m.classList.contains('open')) m.hidden = true; }, 220); pendingConfirm = null; }
function confirmModal(title, text, okLabel, fn) {
  openModal(`<h3>${title}</h3><p class="muted" style="margin:10px 0 20px">${text}</p><div class="modal-btns"><button class="btn danger" data-act="confirm-ok">${okLabel}</button><button class="btn" data-act="modal-close">Cancel</button></div>`);
  pendingConfirm = fn;
}
function openDataModal() {
  openModal(`<h3>Data & settings</h3>
    <div class="modal-sec"><label class="field"><span>Your name (for the greeting)</span><input type="text" id="set-name" value="${esc(S.profile.name)}" maxlength="30"></label></div>
    <div class="modal-sec"><p class="eyebrow">Backup</p><p class="muted" style="font-size:14px">Everything is saved in this browser. Export a JSON file to back it up or move it to another device.</p>
      <div class="modal-btns"><button class="btn primary" data-act="export">${icon('download')} Export JSON</button><button class="btn" data-act="import">${icon('upload')} Import JSON</button></div></div>
    <div class="modal-sec"><p class="eyebrow">Reset</p><div class="modal-btns"><button class="btn" data-act="load-sample">${icon('reset')} Load sample data</button><button class="btn danger" data-act="start-fresh">${icon('trash')} Clear all data</button></div></div>`);
}

const fx = { parts: [], raf: 0 };
function confetti(colors = ['#c6ff33', '#ff6a1a', '#ffffff', '#3ec5ff'], n = 140) {
  if (reduceMotion) return;
  const c = $('#fx'), ctx = c.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let i = 0; i < n; i++) fx.parts.push({ x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 13 - 4,
    s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: colors[i % colors.length], life: 0 });
  if (fx.raf) return;
  const step = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    fx.parts = fx.parts.filter(p => p.life < 150 && p.y < innerHeight + 20);
    for (const p of fx.parts) { p.life++; p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - p.life / 150); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); }
    fx.raf = fx.parts.length ? requestAnimationFrame(step) : (ctx.clearRect(0, 0, innerWidth, innerHeight), 0);
  };
  fx.raf = requestAnimationFrame(step);
}
function showRankUp(i) {
  const r = RANKS[i], next = RANKS[i + 1], o = $('#rankup');
  o.innerHTML = `<div class="ru-inner"><div class="ru-rays" style="--rc:${r.c1}"></div><div class="ru-badge">${badgeSVG(i, 170)}</div>
    <p class="eyebrow" style="color:#b9c3ad;position:relative">Rank up</p><h2 class="ru-title" style="color:${r.c1}">${r.name}</h2>
    <p>You've passed ${fmt(r.min)} XP. ${next ? `Next stop: ${next.name} at ${fmt(next.min)} XP.` : "That's the top of the ladder."}</p>
    <button class="btn primary" data-act="rankup-close">Keep going</button></div>`;
  o.hidden = false; requestAnimationFrame(() => o.classList.add('open'));
  setTimeout(() => confetti([r.c1, r.c2, '#ffffff', '#c6ff33'], 200), 400);
}

/* =========================================================
   JS 12. IMPORT / EXPORT
   ========================================================= */
async function exportData() {
  const json = JSON.stringify(S, null, 2), filename = `gym-planner-${todayKey()}.json`;
  // Inside Claude's artifact viewer, downloads go through the platform's save prompt
  if (window.claude?.use) {
    try { const dl = await window.claude.use('downloads'); if (dl) { await dl.save({ filename, data: json }); toast('Backup exported.', 'good'); return; } }
    catch (e) { if (e?.code === 'declined') { toast('Export cancelled.'); return; } }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = filename;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Backup exported.', 'good');
}
function importData(file) {
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const o = JSON.parse(rd.result);
      if (!o || !o.diet || !o.workout) throw new Error('shape');
      S = migrate(o); S.workout.draft = null; applyMode(); checkProgress(true); closeModal(); renderView(); updateTop();
      toast('Data imported.', 'good');
    } catch (e) { toast("That file isn't a Gym Planner backup. Export one from this app and try again.", 'warn'); }
  };
  rd.readAsText(file);
}

/* =========================================================
   JS 13. EVENTS (one delegated listener per event type)
   ========================================================= */
const ACTIONS = {
  // chrome & data
  'mode': () => { S.settings.mode = S.settings.mode === 'dark' ? 'light' : 'dark'; applyMode(); save(); },
  'open-data': openDataModal, 'modal-close': closeModal,
  'confirm-ok': () => { const fn = pendingConfirm; closeModal(); fn?.(); },
  'export': exportData, 'import': () => $('#import-file').click(),
  'keep-sample': () => { S.sample = false; save(); renderDash(); },
  'start-fresh': () => confirmModal('Clear all data?', 'This removes every meal, workout and PR from this browser. Export a backup first if you want to keep anything.', 'Clear everything', () => {
    const mode = S.settings.mode, name = S.profile.name; S = freshState(); S.settings.mode = mode; S.profile.name = name; save(); checkProgress(true); renderView(); updateTop(); toast('Fresh start. Log your first workout!', 'good'); }),
  'load-sample': () => confirmModal('Load sample data?', 'This replaces your current data with five weeks of example training and meals.', 'Load sample', () => {
    const mode = S.settings.mode; S = buildSample(); S.settings.mode = mode; checkProgress(true); renderView(); updateTop(); toast('Sample data loaded.'); }),
  'rankup-close': () => { const o = $('#rankup'); o.classList.remove('open'); setTimeout(() => o.hidden = true, 400); },
  // diet
  'diet-prev': () => { ui.dietDate = addDays(ui.dietDate, -1); renderDiet(); },
  'diet-next': () => { if (ui.dietDate < todayKey()) { ui.dietDate = addDays(ui.dietDate, 1); renderDiet(); } },
  'diet-today': () => { ui.dietDate = todayKey(); renderDiet(); },
  'meal-del': el => { const d = dayObj(ui.dietDate); d.meals = d.meals.filter(m => m.id !== el.dataset.id); commit(); },
  'meal-star': el => { const m = dayObj(ui.dietDate).meals.find(x => x.id === el.dataset.id); if (m) saveFood(m); renderDiet(); },
  'food-add': el => { const f = S.diet.saved.find(x => x.id === el.dataset.id); if (!f) return; dayObj(ui.dietDate).meals.push({ ...f, id: uid() }); commit(); toast(`Added ${f.name}`); },
  'food-del': el => { S.diet.saved = S.diet.saved.filter(x => x.id !== el.dataset.id); save(); renderDiet(); },
  'water-set': el => { const d = dayObj(ui.dietDate), n = +el.dataset.n; d.water = d.water === n ? n - 1 : n; commit(); },
  'water-inc': () => { dayObj(ui.dietDate).water++; commit(); },
  'water-dec': () => { const d = dayObj(ui.dietDate); d.water = Math.max(0, d.water - 1); commit(); },
  'diet-cal-prev': () => { const c = ui.dietCal; c.m--; if (c.m < 0) { c.m = 11; c.y--; } renderDiet(); },
  'diet-cal-next': () => { const c = ui.dietCal; c.m++; if (c.m > 11) { c.m = 0; c.y++; } renderDiet(); },
  'diet-cal-day': el => { ui.dietSel = el.dataset.k; renderDiet(); },
  'diet-open-day': () => { ui.dietDate = ui.dietSel; renderDiet(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
  'goals-save': () => {
    const g = { cal: num($('#g-cal').value), protein: num($('#g-protein').value), carbs: num($('#g-carbs').value), fat: num($('#g-fat').value) };
    if (g.cal <= 0 || g.protein <= 0) { toast('Calories and protein goals need to be above zero.', 'warn'); return; }
    S.diet.goals = g; S.diet.waterGoal = Math.max(1, Math.round(num($('#g-water').value)) || 8); commit(); toast('Goals saved.', 'good'); },
  'calc-gender': el => { S.diet.calc.gender = el.dataset.v; save(); $$('[data-act="calc-gender"]').forEach(b => b.classList.toggle('on', b === el)); $('#calc-out').innerHTML = calcOutHTML(); },
  'calc-goal': el => { S.diet.calc.goal = el.dataset.v; save(); $$('[data-act="calc-goal"]').forEach(b => b.classList.toggle('on', b === el)); $('#calc-out').innerHTML = calcOutHTML(); },
  'calc-apply': () => { const r = calcGoals(S.diet.calc); S.diet.goals = { cal: r.cal, protein: r.protein, carbs: r.carbs, fat: r.fat }; commit(); toast(`Goals set: ${fmt(r.cal)} kcal · ${r.protein} g protein`, 'good'); },
  // workout: split editor
  'split-pick': el => { const v = el.dataset.v; if (v === S.workout.split) return; S.workout.split = v; ui.splitTab = 0;
    if (!S.workout.sessions[ui.woDate]) S.workout.draft = buildDraft(ui.woDate); save(); renderWorkout(); toast(`Switched to ${SPLIT_PRESETS[v].name}`); },
  'split-tab': el => { ui.splitTab = +el.dataset.i; renderWorkout(); },
  'split-edit': () => { ui.editSplit = !ui.editSplit; renderWorkout(); },
  'split-ex-del': el => { currentDays()[ui.splitTab].ex.splice(+el.dataset.i, 1); save(); renderWorkout(); },
  'split-reset': () => confirmModal('Reset this split?', `Restore the preset exercises for ${SPLIT_PRESETS[S.workout.split].name}. Your logged workouts are not affected.`, 'Reset split', () => {
    S.workout.splits[S.workout.split] = clone(SPLIT_PRESETS[S.workout.split].days); save(); renderWorkout(); }),
  // workout: log
  'set-add': el => { const ex = ensureDraft().ex[+el.dataset.ex], last = ex.sets[ex.sets.length - 1]; ex.sets.push({ r: '', w: last ? last.w : '', done: false }); saveSoon(); renderWorkout(); },
  'set-del': el => { const ex = ensureDraft().ex[+el.dataset.ex]; if (ex.sets.length > 1) ex.sets.pop(); saveSoon(); renderWorkout(); },
  'ex-del': el => { ensureDraft().ex.splice(+el.dataset.ex, 1); saveSoon(); renderWorkout(); },
  'set-done': el => {
    const s = ensureDraft().ex[+el.dataset.ex].sets[+el.dataset.set]; s.done = !s.done; saveSoon();
    el.classList.toggle('on', s.done); el.closest('.set-row').classList.toggle('done', s.done);
    if (s.done) { rest.left = rest.total; restStart(); }
  },
  'wo-save': saveWorkout,
  'wo-delete': () => confirmModal('Delete this workout?', `Remove the ${esc(S.workout.sessions[ui.woDate]?.day || '')} session on ${fmtDate(ui.woDate, { day: 'numeric', month: 'long' })}. XP and PRs update automatically.`, 'Delete workout', () => {
    delete S.workout.sessions[ui.woDate]; S.workout.draft = buildDraft(ui.woDate); commit(); toast('Workout deleted.'); }),
  'wo-cal-prev': () => { const c = ui.woCal; c.m--; if (c.m < 0) { c.m = 11; c.y--; } renderWorkout(); },
  'wo-cal-next': () => { const c = ui.woCal; c.m++; if (c.m > 11) { c.m = 0; c.y++; } renderWorkout(); },
  'wo-cal-day': el => { ui.woDate = el.dataset.k; S.workout.draft = buildDraft(ui.woDate); renderWorkout(); },
  // rest timer
  'rest-toggle': () => rest.running ? restPause() : restStart(),
  'rest-reset': () => { restPause(); rest.left = rest.total; restDraw(); },
  'rest-plus': () => { if (rest.running) rest.end += 15000; rest.left += 15; rest.total = Math.max(rest.total, rest.left); restDraw(); },
  'rest-minus': () => { if (rest.running) rest.end -= 15000; rest.left = Math.max(0, rest.left - 15); restDraw(); }
};
function saveFood(m) {
  if (S.diet.saved.some(f => f.name.toLowerCase() === m.name.toLowerCase())) { toast(`${m.name} is already in your foods.`); return; }
  S.diet.saved.push({ id: uid(), name: m.name, cal: num(m.cal), protein: num(m.protein), carbs: num(m.carbs), fat: num(m.fat) }); save(); toast(`Saved ${m.name} to your foods.`);
}

document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g) { navigate(g.dataset.go); return; }
  const a = e.target.closest('[data-act]');
  if (a && ACTIONS[a.dataset.act] && !a.disabled) ACTIONS[a.dataset.act](a, e);
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('hero-card')) { e.preventDefault(); navigate('dash'); }
  if (e.key === 'Escape') { if (!$('#modal').hidden) closeModal(); if (!$('#rankup').hidden) ACTIONS['rankup-close'](); }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.matches('.in-w, .in-r')) onSetInput(t);
  else if (t.closest('#calc-form') && t.id.startsWith('c-')) { S.diet.calc[t.id.slice(2)] = t.tagName === 'SELECT' ? num(t.value) : t.value; saveSoon(); $('#calc-out').innerHTML = calcOutHTML(); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'wo-date') { if (!t.value || t.value > todayKey()) { t.value = ui.woDate; return; } ui.woDate = t.value; S.workout.draft = buildDraft(ui.woDate); const d = fromKey(ui.woDate); ui.woCal = { y: d.getFullYear(), m: d.getMonth() }; renderWorkout(); }
  else if (t.id === 'wo-day') { S.workout.draft = buildDraft(ui.woDate, t.value); saveSoon(); renderWorkout(); }
  else if (t.id === 'chart-ex') { ui.chartEx = t.value; renderWorkout(); }
  else if (t.id === 'c-activity') { S.diet.calc.activity = num(t.value); saveSoon(); $('#calc-out').innerHTML = calcOutHTML(); }
  else if (t.classList.contains('split-ex-name')) { const v = t.value.trim(); if (v) { currentDays()[ui.splitTab].ex[+t.dataset.i] = v; save(); } }
  else if (t.id === 'set-name') { S.profile.name = t.value.trim().slice(0, 30); save(); updateTop(); renderView(); }
  else if (t.id === 'rest-preset') { rest.total = +t.value; S.workout.restSecs = rest.total; save(); if (!rest.running) rest.left = rest.total; restDraw(); }
  else if (t.id === 'import-file' && t.files[0]) { importData(t.files[0]); t.value = ''; }
});
document.addEventListener('submit', e => {
  const f = e.target; e.preventDefault();
  if (f.id === 'meal-form') {
    const name = $('#mf-name').value.trim(), cal = num($('#mf-cal').value);
    if (!name || cal <= 0) { toast('Give the meal a name and a calorie count.', 'warn'); return; }
    const m = { id: uid(), name, cal, protein: num($('#mf-protein').value), carbs: num($('#mf-carbs').value), fat: num($('#mf-fat').value) };
    dayObj(ui.dietDate).meals.push(m); if ($('#mf-save').checked) saveFood(m);
    commit(); toast(`Added ${name}`); $('#mf-name')?.focus();
  } else if (f.id === 'split-add-form') {
    const v = $('#split-add-name').value.trim(); if (!v) return;
    currentDays()[ui.splitTab].ex.push(v); save(); renderWorkout(); $('#split-add-name')?.focus();
  } else if (f.id === 'ex-add-form') {
    const v = $('#ex-add-name').value.trim(); if (!v) return;
    const last = lastBefore(v, ui.woDate);
    ensureDraft().ex.push({ name: v, sets: Array.from({ length: last ? last.ex.sets.length : 3 }, () => ({ r: '', w: '', done: false })) }); saveSoon(); renderWorkout();
  }
});

/* =========================================================
   JS 14. BOOT
   ========================================================= */
$('#marquee').innerHTML = Array(2).fill(['PUSH', 'PULL', 'LEGS', 'UPPER', 'LOWER', 'FULL BODY', 'BRO SPLIT', 'NEW PR', 'STREAK', 'RANK UP'].map(w => `<span>${w} <i>/</i></span>`).join('')).join('');
$('#top-data').innerHTML = icon('dots'); $('#top-home').insertAdjacentHTML('afterbegin', icon('home'));
$('#rest-minus').innerHTML = icon('minus'); $('#rest-plus').innerHTML = icon('plus'); $('#rest-reset').innerHTML = icon('reset'); $('#modal-x').innerHTML = icon('x');
rest.total = rest.left = S.workout.restSecs || 90;
$('#rest-preset').value = String(rest.total);
document.body.dataset.view = 'landing';
applyMode(); updateTop(); restDraw();
})();
