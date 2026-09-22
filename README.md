<div align="center">

# 🏋️ GYM PLANNER v0.1

**Track your diet, log your lifts, and climb the ranks, all in one page.**

A fast, dark-themed gym planner built with plain HTML, CSS and JavaScript.
It has no frameworks, no build step and no backend, and your data never leaves your browser.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![No dependencies](https://img.shields.io/badge/dependencies-0-c6ff33?style=for-the-badge)
![License: MIT](https://img.shields.io/badge/license-MIT-ff6a1a?style=for-the-badge)

**[▶ Live demo](https://YOUR-USERNAME.github.io/gym-planner/)** · [Features](#-features) · [XP system](#-how-xp-works) · [Run locally](#-run-it-locally) · [Deploy](#-deploy-to-github-pages)

*Made by Nikhil Ravindra*

</div>

---

## ✨ Features

### 🥗 Diet
- **Macro goals.** Set daily calories and protein (plus optional carbs and fat) yourself, or let the app suggest them.
- **Goal calculator.** Enter age, height, weight, gender, activity level and goal (cut / maintain / bulk). The app uses the **Mifflin-St Jeor** equation with a protein target in **g per kg** of body weight, and shows its working.
- **Food log.** Add meals and watch progress rings fill up, with calories and grams left (or over) at a glance.
- **Diet calendar.** Each day is coloured 🟩 goals hit · 🟨 partly hit · 🟥 missed. Tap a day to see what you ate.
- **Water tracker.** Tap glasses to log your intake.
- **Saved foods.** Re-log the meals you eat often with one tap.

### 💪 Workout
- **Four ready-made splits:** Push/Pull/Legs, Upper/Lower, Bro Split and Full Body, each with preset exercises you can edit.
- **Smart logger.** Record sets, reps and weight, with **last session's numbers shown next to every set** so you know what to beat.
- **PR detection.** Beat your best and a PR badge pops up, with confetti when you save.
- **Rest timer.** A floating timer starts automatically when you tick off a set, then beeps and vibrates when rest is over.
- **Workout calendar.** Each day is labelled with its split day, alongside your **current and longest streak**.
- **Progress charts.** See your heaviest set over time for any exercise.

### 🏆 Rank
- Six ranks, each with its own badge: **Bronze → Silver → Gold → Platinum → Diamond → Elite**
- An XP progress bar, a list of recent XP and **15 achievements** (First Workout, 7-Day Streak, 100kg Club, 10-Tonne Session…)
- A full-screen **rank-up animation** when you level up

### ⚡ Extras
- Weekly summary: workouts, average calories and protein, and XP earned
- A motivational quote of the day
- **Export / import** your data as JSON
- Light and dark mode
- Works well on phones
- Sample data on first launch, so you can explore right away

---

## 🎮 How XP works

| Source | XP |
|---|---|
| 🏋️ Workout logged | **+100** per session |
| 🔥 Streak bonus | **+5 × streak length** per workout (max +50) |
| ⭐ Personal record | **+50** per PR |
| 🥗 Diet goals hit | **+50** per day · **+20** if partly hit |

```
XP = 100×workouts + Σ min(5×streak, 50) + 50×PRs + 50×diet days hit + 20×diet days partly hit
```

- **Streak:** workouts in a row with no more than one rest day between them.
- **Diet "hit":** calories within ±10% of your goal and protein at 95% of your goal or more.
- **PR:** a heavier top set than any earlier session of that exercise.

XP is recalculated from your log every time, so editing or deleting a workout keeps your rank accurate.

| Rank | XP needed |
|---|---|
| 🟤 Bronze | 0 |
| ⚪ Silver | 1,000 |
| 🟡 Gold | 3,000 |
| 🩵 Platinum | 6,500 |
| 🔷 Diamond | 11,000 |
| 🔴 Elite | 18,000 |

---

## 🚀 Run it locally

There's nothing to install. Clone the repo and open `index.html`:

```bash
git clone https://github.com/YOUR-USERNAME/gym-planner.git
cd gym-planner
open index.html        # macOS  (Windows: start index.html)
```

Or serve it locally:

```bash
python3 -m http.server 8000     # then visit http://localhost:8000
```

---

## 🌐 Deploy to GitHub Pages

1. Push the repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
4. After about a minute the app is live at `https://YOUR-USERNAME.github.io/gym-planner/`.

> Replace `YOUR-USERNAME` in the demo link at the top of this README once it's live.

---

## 🗂️ Project structure

```
gym-planner/
├── index.html      # Markup: landing page, app shell, overlays
├── css/
│   └── style.css   # Design tokens (dark + light), layout, components
├── js/
│   └── app.js      # State, sample data, XP engine, views, events
├── LICENSE
└── README.md
```

`app.js` is organised into clearly commented sections:

| # | Section | What it does |
|---|---|---|
| 1 | Helpers | Date keys, formatting, icons |
| 2 | Presets & rules | Splits, ranks, XP values, achievements, quotes |
| 3 | State & storage | `localStorage` load/save and sample data |
| 4 | Derived data | Diet status, streaks, PRs, XP, rank |
| 5 | UI pieces | Rings, calendars, badges, line chart |
| 6–10 | Views | Top bar, Dashboard, Diet, Workout, Rank |
| 11 | Overlays | Toasts, modals, confetti, rank-up |
| 12 | Import / export | JSON backup |
| 13 | Events | One delegated listener per event type |
| 14 | Boot | Start-up |

---

## 🔒 Your data

Everything is stored in your browser's `localStorage` under the key `gymPlanner.v1`. Nothing is uploaded anywhere.

To move your data to another device, open **⋯ → Export JSON** on one device and **Import JSON** on the other.

> Clearing your browser's site data will erase your log, so export a backup now and then.

---

## 🛠️ Built with

- **HTML5 / CSS3.** Custom properties for theming, CSS Grid, and animations that switch off when your device's reduce-motion setting is on
- **Vanilla JavaScript (ES2020).** No libraries; the charts are hand-drawn SVG
- **Google Fonts.** Big Shoulders Display, Barlow and JetBrains Mono

---

## 📄 License

[MIT](LICENSE) © 2026 Nikhil Ravindra
