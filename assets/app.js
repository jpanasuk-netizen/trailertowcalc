/* TrailerTowCalc calculators — vanilla JS, no dependencies.
   All pure functions live in the TTC namespace so they can be unit-tested
   against a DOM stub (node smoke test). SAFETY RULE: when any rating is
   exceeded, the result MUST warn — never print a green "you're fine".
   Figures use published SAE J2807-style conventions and manufacturer
   payload/GVWR/GCWR plate values the user enters. Estimates are
   conservative: we always surface the LOWEST limiting number. */
"use strict";

var TTC = {};

function el(id){ return document.getElementById(id); }
function fmt(n){ return Math.round(n).toLocaleString("en-US"); }
function n_(v){ var x = parseFloat(v); return isNaN(x) ? 0 : x; }

/* ---------- Tabs ---------- */
function showTab(key, btn){
  document.querySelectorAll(".panel").forEach(function(p){ p.classList.remove("active"); });
  document.querySelectorAll(".tabs button").forEach(function(b){ b.setAttribute("aria-selected","false"); });
  el(key).classList.add("active");
  if(btn) btn.setAttribute("aria-selected","true");
}

/* =========================================================
   1. TOWING CAPACITY CHECK
   Lowest of: tow rating, GCWR headroom, payload-limited
   towing, and hitch class rating. Verdict = most exceeded.
   ========================================================= */
TTC.towCheck = function(inp){
  var errs = [];
  ["towRating","payloadRating","gcwr","curbWeight","trailerWeight","cargoInTruck","passengers"].forEach(function(k){
    if(typeof inp[k] !== "number" || isNaN(inp[k])) errs.push(k);
  });
  if(errs.length) return { error: "missing inputs: " + errs.join(", ") };
  if(inp.trailerWeight <= 0) return { error: "trailerWeight must be > 0" };

  var tonguePct = inp.tonguePct || 0.12; // 12% planning default, 10–15% band
  var tongue = inp.trailerWeight * tonguePct;

  // Limit 1: manufacturer tow rating
  var byTow = inp.towRating - inp.trailerWeight;

  // Limit 2: GCWR — combined weight of loaded truck + loaded trailer
  var truckLoaded = inp.curbWeight + inp.cargoInTruck + inp.passengers;
  var byGCWR = inp.gcwr - (truckLoaded + inp.trailerWeight);

  // Limit 3: payload — tongue weight + truck cargo + passengers must fit payload rating
  var payloadRating = inp.payloadRating || (inp.gvwrTongue - inp.curbWeight);
  var payloadUsed = tongue + inp.cargoInTruck + inp.passengers;
  var payloadLeft = payloadRating - payloadUsed;
  // Max trailer weight the payload rating can carry (tongue = pct of trailer)
  var byPayload = payloadLeft / tonguePct + inp.trailerWeight;

  var limits = [
    { key:"tow rating",     room: byTow,     cap: inp.towRating,      used: inp.trailerWeight },
    { key:"GCWR",           room: byGCWR,    cap: inp.gcwr,           used: truckLoaded + inp.trailerWeight },
    { key:"payload rating", room: payloadLeft, cap: payloadRating,    used: payloadUsed }
  ];
  if(inp.hitchMax){
    limits.push({ key:"hitch rating", room: inp.hitchMax - inp.trailerWeight, cap: inp.hitchMax, used: inp.trailerWeight });
  }

  var limiting = limits.reduce(function(a,b){ return b.room < a.room ? b : a; });
  var worst = limits.reduce(function(a,b){ return b.room < a.room ? b : a; });
  var overAny = limits.some(function(l){ return l.room < 0; });

  return {
    ok: !overAny,
    tongueWeight: Math.round(tongue),
    truckLoaded: Math.round(truckLoaded),
    combinedWeight: Math.round(truckLoaded + inp.trailerWeight),
    payloadRating: Math.round(payloadRating),
    payloadUsed: Math.round(payloadUsed),
    payloadLeft: Math.round(payloadLeft),
    limitingFactor: limiting.key,
    maxSafeTrailer: Math.round(inp.trailerWeight + Math.max(0, limiting.room)),
    limits: limits.map(function(l){
      return { key:l.key, cap:Math.round(l.cap), used:Math.round(l.used), room:Math.round(l.room), over:l.room < 0 };
    })
  };
};

/* =========================================================
   2. TONGUE WEIGHT
   10–15% of loaded trailer weight (12% target). Also handles
   a bathroom-scale measurement (scale reading × lever factor).
   ========================================================= */
TTC.tongueWeight = function(inp){
  var trailer = n_(inp.trailerWeight);
  if(trailer <= 0) return { error: "trailerWeight must be > 0" };
  var pct = inp.measuredPct; // optional: measured percentage
  var tongue;
  if(typeof pct === "number" && pct > 0){
    tongue = trailer * pct / 100;
  } else {
    var scale = n_(inp.scaleReading);
    var lever = inp.leverFactor || 1; // tongue on scale via extension: reading × (len/(len-extend))
    tongue = scale * lever;
  }
  var pctOfTrailer = tongue / trailer * 100;
  var verdict, cls;
  if(pctOfTrailer < 10){ verdict = "TOO LIGHT — dangerous trailer sway risk"; cls = "over"; }
  else if(pctOfTrailer > 15){ verdict = "TOO HEAVY — overloads rear axle and unsteers the tow vehicle"; cls = "over"; }
  else { verdict = "In the safe 10–15% band"; cls = "ok"; }
  return {
    tongue: Math.round(tongue),
    pct: Math.round(pctOfTrailer * 10) / 10,
    targetLow: Math.round(trailer * 0.10),
    targetHigh: Math.round(trailer * 0.15),
    targetMid: Math.round(trailer * 0.12),
    verdict: verdict,
    band: cls
  };
};

/* =========================================================
   3. PAYLOAD MATH
   payload rating vs (tongue weight + passengers + cargo +
   hitch hardware). Any negative line = over, warning shown.
   ========================================================= */
TTC.payloadCheck = function(inp){
  var rating = n_(inp.payloadRating);
  var tongue = n_(inp.tongueWeight);
  var hitch  = n_(inp.hitchHardware);
  var pax    = n_(inp.passengers);
  var cargo  = n_(inp.cargo);
  if(rating <= 0) return { error: "payloadRating must be > 0 (door-jamb sticker: GVWR − curb weight)" };

  var used = tongue + hitch + pax + cargo;
  var left = rating - used;
  var lines = [
    { key:"Tongue weight",      val: tongue },
    { key:"Hitch / WDH hardware", val: hitch },
    { key:"Passengers",         val: pax },
    { key:"Bed / cabin cargo",  val: cargo }
  ];
  return {
    ok: left >= 0,
    used: Math.round(used),
    rating: Math.round(rating),
    left: Math.round(left),
    pctUsed: Math.round(used / rating * 100),
    lines: lines,
    verdict: left < 0
      ? "OVER PAYLOAD by " + fmt(-left) + " lb — remove weight, you are over the rating"
      : (left < 100 ? "Passes, but under 100 lb of margin — very tight" : "Passes with " + fmt(left) + " lb to spare")
  };
};

/* =========================================================
   4. BRAKE CONTROLLER SETTING
   Heuristic starting gain from trailer weight ratio + brake
   type; boost assumes electric-over-hydraulic needs less gain.
   Always: test at 15 mph on gravel, adjust until wheels lock
   just short of skid. Never a substitute for a breakaway test.
   ========================================================= */
TTC.brakeSetting = function(inp){
  var tw = n_(inp.trailerWeight);
  var tv = n_(inp.towVehicleWeight);
  if(tw <= 0 || tv <= 0) return { error: "enter trailer and tow vehicle weights" };
  var ratio = tw / tv; // 0.2 – 0.6 typical
  var brake = inp.brakeType || "electric"; // electric | eoh
  var base = brake === "eoh" ? 3.0 : 5.0;
  // Heavier relative trailer → more gain, capped by controller scale (0–10)
  var gain = base + (ratio - 0.25) * 10;
  gain = Math.max(1, Math.min(10, Math.round(gain * 10) / 10));
  var boostNote = brake === "eoh"
    ? "Electric-over-hydraulic: keep boost ON (start LOW), gain stays lower than drum-electric."
    : "Time-delayed or proportional drum-electric: start at this gain, boost 0.";
  return {
    gain: gain,
    ratio: Math.round(ratio * 100) / 100,
    note: boostNote,
    procedure: "Empty lot, 15 mph, trailer brakes only: press manual slider. Raise gain until wheels just lock on dry pavement, then back off slightly. Re-test every load change."
  };
};

/* ---------- DOM wiring ---------- */

function towInputs(){
  return {
    towRating: n_(el("twRating").value),
    gcwr: n_(el("twGcwr").value),
    curbWeight: n_(el("twCurb").value),
    payloadRating: n_(el("twPayload").value),
    hitchMax: n_(el("twHitchMax").value),
    trailerWeight: n_(el("twTrailer").value),
    cargoInTruck: n_(el("twCargo").value),
    passengers: n_(el("twPax").value),
    tonguePct: 0.12
  };
}

function checkTow(){
  var r = TTC.towCheck(towInputs());
  var box = el("towResult"); box.hidden = false;
  if(r.error){ box.innerHTML = '<p class="note">'+r.error+'</p>'; return; }
  var rows = r.limits.map(function(l){
    return '<tr><td>'+l.key+'</td><td class="num">'+fmt(l.cap)+' lb</td><td class="num">'+fmt(l.used)+' lb</td><td class="num" style="color:'+(l.over?'var(--acc)':'var(--ok)')+'">'+(l.over?'OVER by '+fmt(-l.room):fmt(l.room)+' lb left')+'</td></tr>';
  }).join("");
  var head = r.ok
    ? '<div class="big">'+fmt(r.maxSafeTrailer)+' <span class="unit">lb max safe trailer — limited by '+r.limitingFactor+'</span></div>'
    : '<div class="big" style="color:var(--acc)">⚠ DO NOT TOW THIS LOAD</div>';
  box.innerHTML = head +
    '<table><tr><th>Limit</th><th class="num">Rating</th><th class="num">Your weight</th><th class="num">Margin</th></tr>'+rows+'</table>' +
    '<div class="grid2">'+
      '<div class="stat"><b>'+fmt(r.tongueWeight)+' lb</b><span>Est. tongue weight (12% of loaded trailer)</span></div>'+
      '<div class="stat"><b>'+fmt(r.combinedWeight)+' lb</b><span>Combined GCWR weight</span></div>'+
      '<div class="stat"><b>'+fmt(r.payloadUsed)+' lb</b><span>Payload used (tongue + cargo + passengers)</span></div>'+
      '<div class="stat"><b>'+fmt(r.payloadRating)+' lb</b><span>Payload rating</span></div>'+
    '</div>' +
    (r.ok
      ? '<p class="note">Your real limit is always the LOWEST number above — the truck can only tow as much as its tightest constraint allows.</p>'
      : '<p class="note">At least one rating is exceeded. Exceeding payload or GCWR is not a fine — it is failed brakes, blown tires, and lost steering. Remove weight or use a lighter trailer.</p>');
}

function checkTongue(){
  var r = TTC.tongueWeight({
    trailerWeight: n_(el("tgTrailer").value),
    scaleReading: n_(el("tgScale").value),
    leverFactor: n_(el("tgLever").value) || 1,
    measuredPct: parseFloat(el("tgPct").value)
  });
  var box = el("tgResult"); box.hidden = false;
  if(r.error){ box.innerHTML = '<p class="note">'+r.error+'</p>'; return; }
  var color = r.band === "ok" ? "var(--ok)" : "var(--acc)";
  box.innerHTML = '<div class="big" style="color:'+color+'">'+fmt(r.tongue)+' <span class="unit">lb ('+r.pct+'% of loaded trailer)</span></div>'+
    '<p><strong>'+r.verdict+'</strong></p>'+
    '<div class="grid2">'+
      '<div class="stat"><b>'+fmt(r.targetLow)+'–'+fmt(r.targetHigh)+' lb</b><span>Safe 10–15% band for your trailer</span></div>'+
      '<div class="stat"><b>'+fmt(r.targetMid)+' lb</b><span>Target (12%) — set with an adjustable shank or WDH</span></div>'+
    '</div>'+
    '<p class="note">Measure on a loaded, packed-for-travel trailer — water, gear, and propane move the balance a lot. Too little tongue weight causes deadly sway above 55 mph; too much overloads the rear axle. Weight-distribution hitches restore steering but do NOT change tongue weight.</p>';
}

function checkPayload(){
  var r = TTC.payloadCheck({
    payloadRating: n_(el("plRating").value),
    tongueWeight: n_(el("plTongue").value),
    hitchHardware: n_(el("plHitch").value),
    passengers: n_(el("plPax").value),
    cargo: n_(el("plCargo").value)
  });
  var box = el("plResult"); box.hidden = false;
  if(r.error){ box.innerHTML = '<p class="note">'+r.error+'</p>'; return; }
  var rows = r.lines.map(function(l){ return '<tr><td>'+l.key+'</td><td class="num">'+fmt(l.val)+' lb</td></tr>'; }).join("");
  var color = r.ok ? "var(--ok)" : "var(--acc)";
  box.innerHTML = '<div class="big" style="color:'+color+'">'+(r.ok?fmt(r.left)+' <span class="unit">lb of payload left</span>':'OVER by '+fmt(-r.left)+' lb')+'</div>'+
    '<table><tr><th>On the truck</th><th class="num">Weight</th></tr>'+rows+
    '<tr><td><strong>Total used</strong></td><td class="num"><strong>'+fmt(r.used)+' lb</strong></td></tr>'+
    '<tr><td>Payload rating (door sticker)</td><td class="num">'+fmt(r.rating)+' lb</td></tr></table>'+
    '<p><strong>'+r.verdict+'</strong></p>'+
    '<p class="note">Tongue weight is payload — every 100 lb on the hitch comes out of your cargo room. A weight-distribution hitch spreads it across both axles but does not reduce payload consumption.</p>';
}

function checkBrakes(){
  var r = TTC.brakeSetting({
    trailerWeight: n_(el("brTrailer").value),
    towVehicleWeight: n_(el("brTV").value),
    brakeType: el("brType").value
  });
  var box = el("brResult"); box.hidden = false;
  if(r.error){ box.innerHTML = '<p class="note">'+r.error+'</p>'; return; }
  box.innerHTML = '<div class="big">'+r.gain+' <span class="unit">starting gain (0–10 scale)</span></div>'+
    '<div class="grid2">'+
      '<div class="stat"><b>'+Math.round(r.ratio*100)+'%</b><span>Trailer weight vs tow vehicle</span></div>'+
      '<div class="stat"><b>'+el("brType").value.toUpperCase()+'</b><span>Brake type</span></div>'+
    '</div>'+
    '<p class="note"><strong>Set-up procedure:</strong> '+r.procedure+'</p>'+
    '<p class="note">'+r.note+' Over 3,000 lb loaded, trailer brakes are legally required in most states — test the breakaway switch before every trip.</p>';
}
