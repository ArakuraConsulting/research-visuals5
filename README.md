# Workout Tracker

A mobile-first, single-page workout tracking app. Built with React + Vite +
TypeScript and Tailwind CSS. No backend, no login — everything lives in your
browser's `localStorage`.

## Run it

```bash
npm install
npm run dev
```

Then open the printed URL (default <http://localhost:5173>). Designed for an
iPhone in portrait, so for the best experience open it on your phone (use
`npm run dev -- --host` to expose it on your local network) or switch your
browser's dev tools to a mobile viewport.

Other scripts:

- `npm run build` — type-check and produce a production build in `dist/`
- `npm run preview` — serve the production build locally

## Where the workout data lives

The three seeded workouts (Daily Practice, Session A, Session B) are defined in:

```
src/data/seed.ts
```

Edit that file to change exercises, cues, form points, durations, sets, rep
ranges, categories, or the `timed` flag on a workout. The `Workout` and
`Exercise` shapes are documented in `src/types.ts`.

Because workouts are copied into `localStorage` on first run, an existing
install won't pick up your edits automatically. To force a re-seed, bump
`SEED_VERSION` in `src/data/seed.ts` — the app will replace the stored
workouts on next load. **Your history is never touched by a re-seed.**

To wipe everything (workouts + history + in-progress session) during
development, clear the site's `localStorage` in your browser dev tools. All
keys are prefixed `wt.` (see `src/lib/storage.ts`).

## What it does

- **Home** — one card per workout showing exercise count and either a computed
  total time (for timed workouts) or "Untimed". A "Recent activity" strip shows
  your last five sessions.
- **Detail** — the full exercise list with category pills, set/time summaries,
  one-line cues, and an expandable "Form" disclosure per exercise.
- **Active workout** — one exercise at a time with a progress bar, a session
  clock counting up, and form points always on screen.
  - _Timed exercises_ get a countdown with start/pause/reset, a beep + haptic
    buzz on each round, and an auto-advancing 10-second rest between rounds.
  - _Set-based exercises_ get one circle per set (tap to fill, tap a filled
    circle to undo), an optional 90-second rest that never auto-advances, and a
    free-text weight field saved into history.
  - "Back" preserves the progress you already recorded; "End workout" asks for
    confirmation and discards the session without writing history.
- **History** — reverse-chronological, grouped by month, with a summary
  (sessions this week / this month / current streak) and per-entry delete.

## Behaviour notes

- **Resume:** in-progress sessions are persisted, so a phone lock or accidental
  refresh won't lose your place — you'll be offered a chance to resume on next
  load. Abandoned workouts write nothing to history.
- **Screen stays awake** during an active workout via the Screen Wake Lock API
  where supported (graceful fallback otherwise).
- **Audio & haptics** use the Web Audio and Vibration APIs and degrade silently
  when unavailable. (iOS requires a tap to unlock audio — pressing "Start
  Workout" handles that.)
- **Storage safety:** if `localStorage` is unavailable or full, the app keeps
  working in memory instead of crashing.
- Dates are stored as ISO strings and shown in your local format.

## Tech notes

- React 18 + Vite 5, TypeScript, Tailwind CSS 3.
- No routing library — navigation between views is internal state.
- No external UI component library; components live in `src/components/`.
