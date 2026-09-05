# TrailerTowCalc

Static towing-safety calculator site. Dark, mobile-first, zero dependencies — vanilla HTML/CSS/JS.

## Calculators (4 tabs on index.html)

1. **Towing capacity check** — computes margins against tow rating, GCWR, payload rating, and hitch class from the user's door-sticker numbers + real loaded trailer weight. Surfaces the LOWEST limiting number; hard warning when any margin is negative.
2. **Tongue weight** — 10–15% band check (12% target) from trailer weight + measured percentage or bathroom-scale lever reading.
3. **Payload math** — payload rating vs tongue weight + hitch hardware + passengers + cargo; line-by-line breakdown.
4. **Brake controller setting** — starting gain heuristic by trailer/tow-vehicle weight ratio and brake type (electric drum vs electric-over-hydraulic), plus the manual-slider calibration procedure.

## Safety rule

Every calculator must surface the lowest limiting number and warn when any rating is exceeded — never show "you're fine" when payload or GCWR is over. Enforced in `TTC.towCheck`, `TTC.tongueWeight`, `TTC.payloadCheck`.

## Structure

- `index.html` — hub with 4 calculator tabs + reference content
- `assets/app.js` — all logic; pure functions under the `TTC` namespace (unit-testable with a DOM stub)
- `assets/styles.css` — network identity theme (matches generatorsizer)
- `towing-capacity-explained.html`, `tongue-weight-guide.html`, `best-hitches-weight-distribution.html` — BOFU articles with `<!-- AFFILIATE SLOT -->` placeholders
- `llms.txt`, `robots.txt`, `sitemap.xml`, `LAUNCH_CHECKLIST.md`

## Smoke test

```
node test/smoke.js
```

## Deployment (when approved — see LAUNCH_CHECKLIST.md)

GitHub Pages → `jpanasuk-netizen.github.io/trailertowcalc/`. No build step; push the folder contents to `main`.
