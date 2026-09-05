// TrailerTowCalc smoke test — pure functions only, DOM stubbed out.
// Run: node test/smoke.js
"use strict";
var fs = require("fs");
var path = require("path");

// Minimal DOM stub so app.js loads headlessly
var stubEl = function(){ return { value:"", hidden:true, innerHTML:"", classList:{add:function(){},remove:function(){}}, setAttribute:function(){}, getAttribute:function(){return ""} }; };
global.document = {
  getElementById: stubEl,
  querySelectorAll: function(){ return []; },
  addEventListener: function(){}
};
global.alert = function(){};
global.window = global;

var src = fs.readFileSync(path.join(__dirname, "..", "assets", "app.js"), "utf8");
require("vm").runInThisContext(src.replace(/document\.addEventListener\("DOMContentLoaded"[\s\S]*$/m, "")); // drop DOM init wiring; var TTC lands on global

var failures = 0, passes = 0;
function check(name, cond, detail){
  if(cond){ passes++; console.log("PASS " + name); }
  else { failures++; console.log("FAIL " + name + (detail ? " — " + detail : "")); }
}
function near(a, b, tol){ return Math.abs(a - b) <= (tol || 0.51); }

/* ===== 1. towCheck — known scenario ===== */
// Half-ton: tow 9200, GCWR 16000, curb 5600, payload 1650, hitch 10000
// Trailer 6800 loaded, cargo 300, pax 420 → tongue 816
var base = {
  towRating: 9200, gcwr: 16000, curbWeight: 5600, payloadRating: 1650,
  hitchMax: 10000, trailerWeight: 6800, cargoInTruck: 300, passengers: 420, tonguePct: 0.12
};
var r = TTC.towCheck(base);
check("towCheck tongue = 816", r.tongueWeight === 816, "got " + r.tongueWeight);
// tow room: 9200-6800 = 2400 ; GCWR: 16000-(5600+300+420+6800)=2880 ; payload: 1650-(816+300+420)=114
check("towCheck limiting = payload rating", r.limitingFactor === "payload rating", "got " + r.limitingFactor);
check("towCheck payload room = 114", r.payloadLeft === 114, "got " + r.payloadLeft);
check("towCheck passes", r.ok === true);

// Over-payload scenario: same truck, 7300 lb trailer + 500 cargo
var over = TTC.towCheck(Object.assign({}, base, { trailerWeight: 7300, cargoInTruck: 500 }));
// tongue 876; payload used 876+500+420=1796 → room -146
check("towCheck over-payload flags failure", over.ok === false);
check("towCheck over-payload payload room = -146", over.payloadLeft === -146, "got " + over.payloadLeft);
check("towCheck over-payload names payload", over.limitingFactor === "payload rating");
check("towCheck marks payload limit over", over.limits.some(function(l){ return l.key === "payload rating" && l.over === true; }));

// GCWR binding: light truck ratings, heavy trailer within tow rating
var gcwrCase = TTC.towCheck({ towRating: 12000, gcwr: 12000, curbWeight: 5000, payloadRating: 2000,
  hitchMax: 12000, trailerWeight: 6000, cargoInTruck: 0, passengers: 0, tonguePct: 0.10 });
// GCWR room: 12000-(5000+6000)=1000 ; tow room 6000 ; payload: 2000-600=1400
check("towCheck GCWR binding", gcwrCase.limitingFactor === "GCWR", "got " + gcwrCase.limitingFactor);
check("towCheck GCWR room = 1000", gcwrCase.limits.filter(function(l){return l.key==="GCWR";})[0].room === 1000);

check("towCheck rejects missing input", TTC.towCheck({towRating:1}).error !== undefined);
check("towCheck rejects zero trailer", TTC.towCheck(Object.assign({}, base, {trailerWeight: 0})).error !== undefined);

/* ===== 2. tongueWeight ===== */
var tw1 = TTC.tongueWeight({ trailerWeight: 6800, measuredPct: 12.6 });
check("tongueWeight 12.6% → 857 lb (6800×0.126=856.8)", tw1.tongue === 857, "got " + tw1.tongue);
check("tongueWeight 12.6% in band", tw1.band === "ok");

var twLight = TTC.tongueWeight({ trailerWeight: 6800, measuredPct: 8 });
check("tongueWeight 8% → TOO LIGHT", twLight.band === "over" && /TOO LIGHT/.test(twLight.verdict), twLight.verdict);

var twHeavy = TTC.tongueWeight({ trailerWeight: 6800, measuredPct: 18 });
check("tongueWeight 18% → TOO HEAVY", twHeavy.band === "over" && /TOO HEAVY/.test(twHeavy.verdict));

// scale + lever: reading 285, lever 3 → 855 on 6800 (12.57%)
var twScale = TTC.tongueWeight({ trailerWeight: 6800, scaleReading: 285, leverFactor: 3 });
check("tongueWeight scale×3 = 855", twScale.tongue === 855, "got " + twScale.tongue);
check("tongueWeight band edges: 10% ok", TTC.tongueWeight({trailerWeight:1000, measuredPct:10}).band === "ok");
check("tongueWeight band edges: 15% ok", TTC.tongueWeight({trailerWeight:1000, measuredPct:15}).band === "ok");
check("tongueWeight rejects 0 trailer", TTC.tongueWeight({trailerWeight:0}).error !== undefined);

/* ===== 3. payloadCheck ===== */
var p1 = TTC.payloadCheck({ payloadRating: 1650, tongueWeight: 816, hitchHardware: 90, passengers: 420, cargo: 200 });
check("payloadCheck used = 1526", p1.used === 1526, "got " + p1.used);
check("payloadCheck left = 124", p1.left === 124, "got " + p1.left);
check("payloadCheck passes", p1.ok === true);

var p2 = TTC.payloadCheck({ payloadRating: 1650, tongueWeight: 950, hitchHardware: 110, passengers: 500, cargo: 300 });
check("payloadCheck over flags failure", p2.ok === false);
check("payloadCheck over by 210", p2.left === -210, "got " + p2.left);
check("payloadCheck warns 'OVER'", /OVER PAYLOAD/.test(p2.verdict), p2.verdict);

// tight margin case (<100 lb left) gets a "very tight" note, still passes
var p3 = TTC.payloadCheck({ payloadRating: 1650, tongueWeight: 816, hitchHardware: 90, passengers: 420, cargo: 250 });
check("payloadCheck <100 lb margin → tight note", p3.ok === true && /tight/.test(p3.verdict), p3.verdict);
check("payloadCheck rejects 0 rating", TTC.payloadCheck({payloadRating:0}).error !== undefined);

/* ===== 4. brakeSetting ===== */
var b1 = TTC.brakeSetting({ trailerWeight: 6800, towVehicleWeight: 6300, brakeType: "electric" });
// ratio 1.0794 → gain 5 + (1.0794-0.25)*10 = 13.29 → clamped 10
check("brakeSetting clamps to 10 max", b1.gain === 10, "got " + b1.gain);
var b2 = TTC.brakeSetting({ trailerWeight: 3500, towVehicleWeight: 7000, brakeType: "electric" });
// ratio 0.5 → 5 + 2.5 = 7.5
check("brakeSetting 0.5 ratio → 7.5", b2.gain === 7.5, "got " + b2.gain);
var b3 = TTC.brakeSetting({ trailerWeight: 875, towVehicleWeight: 5000, brakeType: "eoh" });
// ratio 0.175 → 3 + (0.175-0.25)*10 = 2.25 → rounds to 2.3
check("brakeSetting eoh light trailer → 2.3", b3.gain === 2.3, "got " + b3.gain);
var b4 = TTC.brakeSetting({ trailerWeight: 500, towVehicleWeight: 6000, brakeType: "electric" });
// ratio 0.0833 → 5 - 1.667 = 3.333 → min clamp 1... 3.33 > 1 so stays 3.3
// ratio 1/6000 ≈ 0.00017 → 5 - 2.5 = 2.498 → 2.5 (floor clamp of 1 is a defensive backstop)
check("brakeSetting tiny trailer → 2.5", TTC.brakeSetting({trailerWeight:1, towVehicleWeight:6000, brakeType:"electric"}).gain === 2.5);
check("brakeSetting rejects missing weights", TTC.brakeSetting({trailerWeight:0, towVehicleWeight:1}).error !== undefined);

/* ===== hand-verified arithmetic ===== */
// 6800 trailer × 12% = 816 tongue ✓ (independent recomputation)
check("cross-check tongue 6800×0.12", near(6800*0.12, r.tongueWeight));
// combined = 5600+300+420+6800 = 13120 ≤ GCWR 16000 ✓
check("cross-check combined 13120", r.combinedWeight === 13120, "got " + r.combinedWeight);
// payload used = 816+300+420 = 1536
check("cross-check payload used 1536", r.payloadUsed === 1536, "got " + r.payloadUsed);

console.log("\n" + passes + " passed, " + failures + " failed");
process.exit(failures ? 1 : 0);
