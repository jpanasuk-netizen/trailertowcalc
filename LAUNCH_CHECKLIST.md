# TrailerTowCalc — Launch Checklist

Site files: `HermesVault/40-Content/sites/trailertowcalc/`
Network: generatorsizer, solarsizer, weldingcalc, battery-bank-sizer (github.io)

## 0. Pre-launch (before anything public)
- [ ] Jeremy approves publish (charter human gate — no live URL without his yes)
- [ ] Verify all calculator math against a real truck's door-sticker numbers (payload = GVWR − curb) and a manufacturer towing guide (SAE J2807 ratings)
- [ ] Affiliate monetization timing — apply to programs BEFORE adding real links; placeholder slots marked `<!-- AFFILIATE SLOT -->` in index.html and all 3 articles
- [ ] r/Trucks + r/RVLiving angle: the "lowest limiting number" framing is the hook — half-ton owners over on payload is the most common real-world failure

## 1. Hosting — GitHub Pages ($0)
- [ ] Create repo `jpanasuk-netizen/trailertowcalc` (public), push the site folder contents to `main`
- [ ] Settings → Pages → Deploy from branch: `main` / root → confirm green URL `jpanasuk-netizen.github.io/trailertowcalc/`
- [ ] Mirror to Hugging Face Space `jpanasuk/trailertowcalc` (sdk: static) — packet-twin pattern

## 2. Search Console
- [ ] Verify the github.io URL via HTML file
- [ ] Submit `sitemap.xml` (4 URLs)
- [ ] URL Inspection → Request indexing on all 4 pages
- [ ] Week 2: Coverage + Performance check; then Bing Webmaster Tools (imports GSC property)

## 3. Affiliate programs
- [ ] **Amazon Associates** — hitches, weight-distribution kits, tongue-weight scales, brake controllers, breakaway kits; needs 3 qualifying sales in 180 days to stick. Build links only after approval; disclosure already on ranking page
- [ ] Later: AdSense once organic traffic exists (~20+ sessions/day)

## 4. Distribution (2-engine model)
- [ ] r/Trucks, r/RVLiving, r/GoRVing, r/TruckCampers: answer 2–3 "can my truck tow this" threads/week with genuinely useful math; link the calculator only when it's the right tool
- [ ] Cross-link: add a "TrailerTowCalc ↗" line to generatorsizer / solarsizer / weldingcalc / battery-bank-sizer index + llms.txt AFTER this site is live (reciprocal, not orphan)

## 5. Post-launch QA
- [ ] Test all 4 calculator tabs on a phone (mobile-first; verify row2/row3 grids at 375px)
- [ ] Rich Results Test: SoftwareApplication + FAQPage validate
- [ ] Lighthouse mobile ≥ 95 perf (static, single CSS/JS — should pass clean)
- [ ] Confirm no affiliate links ship before program approval (slots are placeholders by design)
- [ ] SAFETY SPOT-CHECK: enter a payload-over configuration in the capacity check and confirm the tool screams (never green-lights an over-limit rig)
