/* =====================================================================
   Safeguard Atlas — engine + rendering.
   The engine below is a line-for-line port of the Python used to produce
   Heliovulcan's consultation submissions:
     tools/consultation_kb/coverage_dynamics.py       (register, floor, production)
     tools/consultation_kb/dossier/teba_rate_grid.py  (TEBA paths, solving for a rate)
     tools/consultation_kb/dossier/teba_frontier.py   (the iso-target curve)
   The self-check at the foot of the page re-runs the published cases and
   shows whether this browser reproduces them. Everything runs locally.
   ===================================================================== */
(function () {
"use strict";
/* A renderer for a section that is not on this page writes into a throwaway stub. A fresh stub
   per call, so a value written by one renderer never reaches another. */
function nullEl() { return { innerHTML: "", textContent: "", value: "", className: "", hidden: false, style: {},
  addEventListener: function () {}, setAttribute: function () {}, getAttribute: function () { return null; },
  querySelectorAll: function () { return []; }, querySelector: function () { return null; } }; }
function $(id) { return document.getElementById(id) || nullEl(); }
var D = JSON.parse(document.getElementById("atlas-data").textContent);
var ROOT = (document.body.getAttribute("data-root") || "");                 /* "" on /safeguard-atlas.html, "../" under /safeguard/ */
var C = D.const, F = D.facilities, RAMP = D.ramp;
var FLOOR = C.FLOOR_T, THRESH = C.THRESHOLD;

/* ---------- 1. engine ------------------------------------------------ */
function ercDefault(y, d) {
  var k = y - 2024, v = k <= 6 ? 0.951 - 0.049 * k : 0.657 - d * (k - 6);
  return y < 2050 ? Math.max(v, 0) : 0;
}
function ercTebaRaw(t, y, d, renew) {
  var p = t.path;
  if (p[y] !== undefined) return p[y];
  var last = Math.max.apply(null, Object.keys(p).map(Number)), v = p[last];
  for (var yy = last + 1; yy <= y; yy++) {
    if (renew && yy <= 2030) v -= t.rate;
    else if (yy <= 2030) v -= 0.049;
    else v -= d;
  }
  return y < 2050 ? Math.max(v, 0) : 0;
}
function ercOf(t, y, d, mode, start, L) {
  var dflt = ercDefault(y, d);
  if (!t || mode === "none") return dflt;
  if (mode === "freeze") return y <= 2025 ? ercTebaRaw(t, y, d, false) : t.reg * dflt / 0.902;
  var tt = ercTebaRaw(t, y, d, mode === "renew");
  if (mode === "current" || mode === "renew") return tt;
  if (mode === "reset") return y < 2031 ? tt : dflt;   // identical to catchup(start=2031, L=1)
  if (mode === "catchup") {
    var p = y < start ? 0 : Math.min((y - start + 1) / L, 1);
    return (1 - p) * tt + p * dflt;
  }
  return dflt;
}
function pfOf(f, k, mode) {
  if (mode === "flat") return 1;
  var P = D.pf[mode];
  if (f.c === "coal" && f.ms != null) return f.ms * P.coal_met[k] + (1 - f.ms) * P.coal_thermal[k];
  return (P[f.c] || P.other)[k];
}
function closeYear(f, clos) {
  if (clos === "none") return null;
  if (clos === "decided") return f.cd || null;
  if (f.cd && f.ct) return Math.min(f.cd, f.ct);       // whichever comes first
  return f.ct || f.cd || null;
}
/* one facility's modelled year-k numbers under scenario o */
function facYear(f, k, o) {
  var y = 2025 + k, cy = closeYear(f, o.clos);
  if (cy !== null && k >= cy - 2025) return null;              // closed: out of the totals
  var pf = pfOf(f, k, o.pf), t = f.t || null;
  var b = t ? t.J * pf * ercOf(t, y, o.d, o.teba, o.cuStart, o.cuL)
            : f.b0 * pf * ercDefault(y, o.d) / 0.902;
  var braw = b;
  if (b < FLOOR && f.b0 >= FLOOR * 0.5) b = FLOOR;             // Safeguard Rule s10(1)
  var cov = f.cov * pf * Math.pow(1 - o.abate, k);
  return { cov: cov, b: b, braw: braw, net: Math.min(cov, b) };
}
/* national aggregate for year k */
function yearAgg(k, o) {
  var a = { net: 0, base: 0, cov: 0, owed: 0, sur: 0, relief: 0,
            nT: 0, nN: 0, over: 0, under: 0, floored: 0, closed: 0, sub: 0, n: 0 };
  for (var i = 0; i < F.length; i++) {
    var f = F[i], r = facYear(f, k, o);
    if (!r) { a.closed++; continue; }
    a.n++; a.net += r.net; a.base += r.b; a.cov += r.cov;
    a.owed += Math.max(0, r.cov - r.b);
    a.sur += Math.max(0, r.braw - r.cov);                       // s57 credits use the un-floored baseline
    if (r.b > r.braw) { a.floored++; a.relief += r.b - r.braw; }
    if (r.cov > r.b) a.over++; else a.under++;
    if (r.cov < THRESH) a.sub++;
    if (f.t) a.nT += r.net; else a.nN += r.net;
  }
  if (o.pipe) {
    var share = k < RAMP.length ? RAMP[k] : 1;
    var nc = C.NEW_EMISSIONS_T * share * Math.pow(1 - o.abate, k);
    var nb = C.NEW_BASELINE_T * share * ercDefault(2025 + k, o.d);   // Rule s29: new entrants scale by the ERC
    a.net += Math.min(nc, nb); a.base += nb; a.cov += nc;
    a.owed += Math.max(0, nc - nb); a.nN += Math.min(nc, nb);
  }
  ["net", "base", "cov", "owed", "sur", "relief", "nT", "nN"].forEach(function (k2) { a[k2] /= 1e6; });
  return a;
}
function series(o, n) {
  var out = [];
  for (var k = 0; k < (n || 16); k++) out.push(yearAgg(k, o));
  return out;
}
function net35(o) { return yearAgg(10, o).net; }
function budget5(o) { var s = 0; for (var k = 6; k <= 10; k++) s += yearAgg(k, o).net; return s; }
/* the post-2030 rate that lands FY2034-35 net exactly on a target */
function solveRate(o, targetMt) {
  var lo = 0, hi = 0.30, o2 = Object.assign({}, o);
  for (var i = 0; i < 44; i++) {
    var m = (lo + hi) / 2; o2.d = m;
    if (net35(o2) > targetMt) lo = m; else hi = m;
  }
  return (lo + hi) / 2 * 100;
}
/* iso-target frontier: pairs of post-2030 rates that hit the target exactly.
   dT applies to the TEBA facilities from their FY2029-30 position; dN to everyone else. */
function frontierNet(dT, dN, o) {
  var net = 0;
  for (var i = 0; i < F.length; i++) {
    var f = F[i], cy = closeYear(f, o.clos);
    if (cy !== null && 10 >= cy - 2025) continue;
    var pf = pfOf(f, 10, o.pf), t = f.t || null, b;
    if (t) b = t.J * pf * Math.max(ercTebaRaw(t, 2030, 0, false) - 5 * dT, 0);
    else b = f.b0 * pf * Math.max(0.657 - 5 * dN, 0) / 0.902;
    if (b < FLOOR && f.b0 >= FLOOR * 0.5) b = FLOOR;
    net += Math.min(f.cov * pf, b);
  }
  if (o.pipe) {
    var share = RAMP.length > 10 ? RAMP[10] : 1;
    net += Math.min(C.NEW_EMISSIONS_T, C.NEW_BASELINE_T * Math.max(0.657 - 5 * dN, 0)) * share;
  }
  return net / 1e6;
}
function frontier(targetMt, o) {
  var pts = [];
  for (var x = 0; x <= 15.5; x += 0.5) {
    var lo = 0, hi = 0.30, dT = x / 100;
    for (var i = 0; i < 44; i++) {
      var m = (lo + hi) / 2;
      if (frontierNet(dT, m, o) > targetMt) lo = m; else hi = m;
    }
    pts.push([x, (lo + hi) / 2 * 100]);
  }
  return pts;
}
function targetMt(pct) { return C.NAT_2005_MT * (1 - pct) * C.SHARE; }

/* ---------- 2. scenario state --------------------------------------- */
var REF = { d: C.D_STATUTORY, teba: "current", pf: "capped", pipe: true,
            clos: "decided", abate: 0, cuStart: 2031, cuL: 20, target: 0.62 };
var S = Object.assign({}, REF);

var FIELDS = [["d", "d"], ["teba", "t"], ["pf", "p"], ["pipe", "e"], ["clos", "c"],
              ["abate", "a"], ["cuL", "l"], ["target", "g"]];
var HASH_ON = false;            /* only take over the URL once the reader changes something */
function saveS() { try { localStorage.setItem("sgAtlasS", JSON.stringify(S)); } catch (e) {} }
function loadS() {
  try { var v = localStorage.getItem("sgAtlasS"); if (!v) return false; var o = JSON.parse(v);
    Object.keys(REF).forEach(function (k) { if (o[k] !== undefined) S[k] = o[k]; }); return true; } catch (e) { return false; }
}
function toHash() {
  saveS();
  if (!HASH_ON) return;
  var q = FIELDS.map(function (f) {
    var v = S[f[0]];
    if (typeof v === "boolean") v = v ? 1 : 0;
    if (typeof v === "number") v = Math.round(v * 1e5) / 1e5;
    return f[1] + "=" + v;
  }).join("&");
  history.replaceState(null, "", "#s:" + q);
}
function fromHash() {
  var h = location.hash || "";
  if (h.indexOf("#s:") !== 0) return;
  HASH_ON = true;
  h.slice(3).split("&").forEach(function (kv) {
    var p = kv.split("="), f = FIELDS.filter(function (x) { return x[1] === p[0]; })[0];
    if (!f) return;
    var cur = REF[f[0]], v = p[1];
    if (typeof cur === "boolean") S[f[0]] = v === "1";
    else if (typeof cur === "number") { var n = parseFloat(v); if (isFinite(n)) S[f[0]] = n; }
    else S[f[0]] = v;
  });
}

/* ---------- 3. formatting + svg helpers ------------------------------ */
function fy(k) { return "FY" + (2024 + k) + "-" + String(2025 + k).slice(2); }
function mt(v, p) { return (v).toFixed(p === undefined ? 1 : p); }
function int(v) { return Math.round(v).toLocaleString("en-AU"); }
function sgn(v, p) { return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(p === undefined ? 2 : p); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
  return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
var PAL = { cov: "#b9712b", base: "#2f7d6b", net: "#16293a", ref: "#9A958C",
            t62: "#16293a", t70: "#4C3F79", you: "#f07820", pos: "#26697F", neg: "#B94A38" };

function svgEl(w, h, body) {
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" ' +
         'role="img" style="font-family:var(--sans)">' + body + "</svg>";
}
function txt(x, y, s, o) {
  o = o || {};
  return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-size="' + (o.size || 11) +
    '" fill="' + (o.fill || "#63707c") + '" text-anchor="' + (o.anchor || "start") + '"' +
    (o.weight ? ' font-weight="' + o.weight + '"' : "") +
    (o.rot ? ' transform="rotate(' + o.rot + ')"' : "") +
    (o.halo ? ' paint-order="stroke" stroke="#fffdf9" stroke-width="3.5" stroke-linejoin="round"' : "") +
    ">" + s + "</text>";
}
function poly(pts, col, w, dash) {
  return '<path d="M' + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L") +
    '" fill="none" stroke="' + col + '" stroke-width="' + (w || 2.2) + '"' +
    (dash ? ' stroke-dasharray="' + dash + '"' : "") + ' stroke-linejoin="round"/>';
}
function legend(items) {
  return items.map(function (i) {
    return '<span><i style="background:' + i[1] + (i[2] ? ";opacity:.55" : "") + '"></i>' + i[0] + "</span>";
  }).join("");
}

/* ---------- 4. the starting point ------------------------------------ */
function renderKPIs() {
  var cov = 0, b0 = 0, over = 0, teba = 0, net0 = 0;
  F.forEach(function (f) {
    cov += f.cov; b0 += f.b0; net0 += Math.min(f.cov, f.b0);
    if (f.cov > f.b0) over++;
    if (f.t) teba++;
  });
  var cards = [
    ["Facilities in the register", int(F.length), "off",
     "Rows in the " + D.meta.register_year + " register after removing the 19 rows the Regulator marks as eligible facilities under Rule s 58B. " +
     "Telfer Gold Mine occupies two rows because of a mid-year change of operator, so the merged count is 208 facilities. " +
     "Elsewhere on this site the denominator is stated as 208 covered facilities; the register is the same."],
    ["Covered emissions", mt(cov / 1e6) + " Mt", "off",
     "Scope 1 emissions covered by the scheme: " + int(cov) + " t CO₂-e, which reconciles to the 132.8 Mt the Regulator publishes. " +
     "This is approximately a quarter of the national inventory."],
    ["Aggregate baselines", mt(b0 / 1e6) + " Mt", "off",
     "The sum of the published baselines. The difference between covered emissions and baselines is the net obligation the scheme created in the year."],
    ["Facilities above their baseline", int(over) + " of " + int(F.length), "off",
     "Facilities whose covered emissions exceeded their baseline and which were therefore required to surrender units. The remainder were at or below baseline."],
    ["On slower trade-exposed rates", int(teba) + " facilities", "off",
     "Facilities holding a trade-exposed baseline adjustment (TEBA) determination under Rule s 42, under which the ERC declines more slowly than the default path."],
    ["2035 point target at 62%", mt(targetMt(0.62)) + " Mt", "off",
     "Calculated from the consultation paper's own inputs: 607.7 Mt CO₂-e of 2005 national emissions, a 62% reduction, and the 29.8% share of the national task proposed for the scheme."]
  ];
  $("kpis").innerHTML = cards.map(function (c) {
    return '<div class="kpi-card"><span class="kpi-lab">' + c[0] + '</span><b>' + c[1] +
      '</b><span class="tag tag--' + c[2] + '">' + (c[2] === "off" ? "Official" : "Modelled") +
      '</span><small>' + c[3] + "</small></div>";
  }).join("");
  $("stamp").textContent =
    "Register " + D.meta.register_year + " · " + D.meta.register_rows + " facilities · " +
    D.meta.teba_facilities + " with a trade-exposed determination · model built " + D.meta.built +
    " · all figures recalculated in the browser";
}

/* ---------- 5. national pathway chart -------------------------------- */
function renderPath() {
  var N = 16, ys = series(S, N), ref = series(REF, N);
  var W = 900, H = 430, L = 62, R = 838, T = 26, B = 356;
  var hi = 0; ys.concat(ref).forEach(function (a) { hi = Math.max(hi, a.cov, a.base); });
  hi = Math.ceil(hi / 20) * 20;
  var X = function (k) { return L + (R - L) * k / (N - 1); };
  var Y = function (v) { return B - (B - T) * v / hi; };
  var s = [];
  for (var v = 0; v <= hi; v += 20)
    s.push('<line x1="' + L + '" y1="' + Y(v).toFixed(1) + '" x2="' + R + '" y2="' + Y(v).toFixed(1) +
      '" stroke="#e4ddcf"/>' + txt(L - 9, Y(v) + 4, String(v), { anchor: "end" }));
  for (var k = 0; k < N; k += 2)
    s.push(txt(X(k), B + 18, fy(k).replace("FY", "").replace("-", "–"), { anchor: "middle", size: 10.5 }));
  s.push(txt(16, (T + B) / 2, "Mt CO₂-e per year", { anchor: "middle", rot: "-90 16 " + ((T + B) / 2).toFixed(0), size: 12, fill: "#4c5b68" }));
  /* the 2035 test year */
  s.push('<line x1="' + X(10).toFixed(1) + '" y1="' + T + '" x2="' + X(10).toFixed(1) + '" y2="' + B +
    '" stroke="#16293a" stroke-width="1" stroke-dasharray="3 4" opacity=".45"/>');
  s.push(txt(X(10), T - 8, "FY2034-35", { anchor: "middle", size: 11, fill: "#16293a", weight: 600, halo: 1 }));
  /* obligation band: between net and covered */
  var band = ys.map(function (a, k) { return [X(k), Y(a.cov)]; })
    .concat(ys.map(function (a, k) { return [X(N - 1 - k), Y(ys[N - 1 - k].net)]; }));
  s.push('<path d="M' + band.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L") +
    ' Z" fill="' + PAL.cov + '" opacity=".10"/>');
  s.push(poly(ref.map(function (a, k) { return [X(k), Y(a.net)]; }), PAL.ref, 1.8, "5 4"));
  s.push(poly(ys.map(function (a, k) { return [X(k), Y(a.cov)]; }), PAL.cov, 2.2));
  s.push(poly(ys.map(function (a, k) { return [X(k), Y(a.base)]; }), PAL.base, 2.2));
  s.push(poly(ys.map(function (a, k) { return [X(k), Y(a.net)]; }), PAL.net, 2.8));
  /* targets, and the scenario's own FY2034-35 value — nudged apart when they land close together */
  var y35 = ys[10], yy = Y(y35.net);
  [[0.62, PAL.t62, "62%"], [0.70, PAL.t70, "70%"]].forEach(function (t) {
    var v = targetMt(t[0]), ty = Y(v);
    s.push('<circle cx="' + X(10).toFixed(1) + '" cy="' + ty.toFixed(1) + '" r="4.5" fill="none" stroke="' +
      t[1] + '" stroke-width="2.2"/>' + txt(X(10) + 13, ty + 4, t[2] + " target " + mt(v) + " Mt",
      { size: 11.5, fill: t[1], weight: 600, halo: 1 }));
  });
  s.push('<circle cx="' + X(10).toFixed(1) + '" cy="' + yy.toFixed(1) + '" r="5" fill="' + PAL.you +
    '" stroke="#fff" stroke-width="1.6"/>');
  s.push(txt(X(10) - 11, yy - 11, "selected settings: " + mt(y35.net, 2) + " Mt",
    { size: 11.5, fill: PAL.you, anchor: "end", weight: 700, halo: 1 }));
  $("chart-path").innerHTML = svgEl(W, H, s.join(""));
  $("legend-path").innerHTML = legend([
    ["Covered emissions", PAL.cov],
    ["Aggregate baselines", PAL.base],
    ["Modelled compliant net emissions", PAL.net],
    ["Current policy on the starting-point assumptions", PAL.ref, 1]
  ]);

  var a = ys[10], r0 = ref[10];
  $("path-out").innerHTML = [
    ["FY2034-35 net emissions", mt(a.net, 2) + " Mt", "mod",
     "Current policy on the starting-point assumptions: " + mt(r0.net, 2) + " Mt"],
    ["Units to be surrendered in FY2034-35", mt(a.owed, 2) + " Mt", "mod",
     int(a.over) + " facilities with covered emissions above their baseline"],
    ["Emissions below baseline", mt(a.sur, 2) + " Mt", "mod",
     "Indicative credit issuance, measured against the baseline before the minimum baseline is applied (Rule s 57)"],
    ["Facilities on the minimum baseline", int(a.floored), "mod",
     "Facilities whose calculated baseline falls below 100,000 t and is set at 100,000 t under Rule s 10(1); the difference is " +
     mt(a.relief, 2) + " Mt"]
  ].map(function (o) {
    return '<div class="out"><span>' + o[0] + '</span><b>' + o[1] + '</b><span class="tag tag--' + o[2] +
      '">Modelled</span><small>' + o[3] + "</small></div>";
  }).join("");

  $("how-path").innerHTML =
    "<p>The calculation applies the same three steps as the Safeguard Rule to every facility in every year.</p>" +
    "<p><b>Step one — the baseline.</b> Under Rule s 11, an existing facility's baseline is its production multiplied by an applicable " +
    "emissions intensity and by the emissions reduction contribution (ERC). The ERC is the coefficient that falls each year: " +
    "<code>0.902</code> in FY2024-25, then <code>0.049</code> lower each year to <code>0.657</code> in FY2029-30, and from FY2030-31 " +
    "by the post-2030 decline rate selected in the policy section. Because the ERC is a multiplier, each published baseline is scaled " +
    "by the ratio of ERC values rather than re-derived from production and intensity. The " + D.meta.teba_facilities + " facilities " +
    "with a trade-exposed determination follow the ERC path the Regulator has published for each of them. The treatment of those " +
    "facilities after their determinations expire is a policy setting, not an input.</p>" +
    "<p><b>Step two — the minimum baseline.</b> Under Rule s 10(1), a baseline that calculates below 100,000 t CO₂-e is set at 100,000 t. " +
    "The credit issuance formula in Rule s 57 uses the baseline that would apply if s 10(1) had not been made, so the minimum baseline " +
    "reduces the units a facility must surrender but does not increase the credits it can be issued. The calculation applies it in " +
    "that direction only.</p>" +
    "<p><b>Step three — the compliance measure.</b> Modelled compliant net emissions for a facility are the smaller of its covered " +
    "emissions and its baseline. The national figure is the sum across facilities. Production is applied as one factor per commodity, " +
    "so a coal mine follows the coal production path and an LNG plant follows the LNG path.</p>" +
    "<p><b>Not modelled on this page.</b> The full model also tracks facilities that fall below the 100,000 t coverage threshold and " +
    "remain eligible facilities under Rule s 58B for up to ten years. That treatment affects the coverage series after approximately " +
    "FY2032-33 but not the FY2034-35 test, and it is not applied here. Each facility is counted until its modelled closure year.</p>";
}

/* ---------- 6. the Policy Lab ---------------------------------------- */
var TEBA_MODES = [
  ["current", "Current rules", "Each facility with a trade-exposed determination follows the ERC path the Regulator has published for it and, after the determination expires, the default path. This is the treatment under the Rule as made."],
  ["freeze", "Not granted", "A counterfactual in which the facility's registered ERC is scaled down on the default path. The difference from the current rules measures the value of the adjustment."],
  ["renew", "Renewed", "Each determination is renewed on its own slower rate to FY2029-30. This is the most lenient treatment."],
  ["reset", "Reset in FY2030-31", "Determinations end with the current phase. From FY2030-31 these facilities follow the default path."],
  ["catchup", "Gradual transition", "The difference from the default path is reduced in equal annual steps over the number of years selected."],
  ["none", "No adjustment", "Every facility, including those with a determination, follows the default path from FY2024-25."]
];
var PF_MODES = [
  ["capped", "OCE outlook, capped", "Commodity production follows the Office of the Chief Economist's national outlook, with the factor for existing facilities capped at 1.0 so that no existing facility is assumed to grow. This is the starting-point assumption."],
  ["uncapped", "OCE outlook, uncapped", "The same outlook, with existing facilities following it in both directions."],
  ["flat", "Production held constant", "Every facility produces the same quantity in each year as in FY2024-25. This setting isolates the effect of the rules from changes in production."]
];
var CLOS_MODES = [
  ["decided", "Confirmed closures", "Seven facilities whose owners have decided to close, or which have already closed."],
  ["tracker", "Confirmed closures plus approval expiry", "Adds mines whose current approval expires within the period. Most of these dates are approval expiries rather than closure decisions, so this is a sensitivity case."],
  ["none", "No closures", "Every facility in the register continues to operate to FY2034-35."]
];
function seg(name, opts) {
  return '<div class="seg" data-seg="' + name + '">' + opts.map(function (o) {
    return '<button type="button" data-v="' + o[0] + '" aria-pressed="false">' + o[1] + "</button>";
  }).join("") + "</div>";
}
function hintOf(list, v) {
  var m = list.filter(function (x) { return x[0] === v; })[0];
  return m ? m[2] : "";
}
/* Built once. Redraws only sync the values, so dragging a slider is not interrupted. */
function buildControls() {
  var h = [];
  h.push('<div class="ctrl"><div class="ctrl__lab"><span>2035 target</span><span class="ctrl__val" id="v-target"></span></div>' +
    '<input type="range" id="c-target" min="62" max="70" step="1">' +
    '<p class="ctrl__hint">The national 2035 target, converted to the scheme\'s share using the 29.8% proposed in the consultation paper. <span class="tag tag--asm">Assumption</span></p></div>');

  h.push('<div class="ctrl"><div class="ctrl__lab"><span>Post-2030 decline rate</span><span class="ctrl__val" id="v-d"></span></div>' +
    '<input type="range" id="c-d" min="0" max="8" step="0.01">' +
    '<p class="ctrl__hint">The annual reduction in the ERC from FY2030-31, in percentage points of the original baseline per year. The statutory indicative rate is 3.285. <span class="tag tag--user">Setting</span></p>' +
    '<div class="lab__btns"><button class="btn-sm btn-sm--go" id="c-solve">Calculate the rate for this target</button>' +
    '<button class="btn-sm" id="c-reset">Reset to current policy</button>' +
    '<button class="btn-sm" id="c-link">Copy scenario link</button></div></div>');

  h.push('<div class="ctrl"><div class="ctrl__lab"><span>Treatment of facilities with a trade-exposed determination</span></div>' +
    seg("teba", TEBA_MODES) + '<p class="ctrl__hint" id="h-teba"></p>' +
    '<div id="row-cul" hidden><div class="ctrl__lab" style="margin-top:10px"><span>Transition period</span>' +
    '<span class="ctrl__val" id="v-cul"></span></div>' +
    '<input type="range" id="c-cul" min="1" max="20" step="1"></div></div>');

  h.push('<div class="ctrl"><div class="ctrl__lab"><span>Production</span></div>' +
    seg("pf", PF_MODES) + '<p class="ctrl__hint" id="h-pf"></p></div>');

  h.push('<div class="ctrl"><div class="ctrl__lab"><span>Closures</span></div>' +
    seg("clos", CLOS_MODES) + '<p class="ctrl__hint" id="h-clos"></p></div>');

  h.push('<div class="ctrl"><div class="ctrl__lab"><span>New entrants</span></div>' +
    seg("pipe", [["1", "Identified projects enter", ""], ["0", "No new entrants", ""]]) +
    '<p class="ctrl__hint">Coal, LNG and iron ore projects in public environmental assessment, phased in over the decade: ' +
    mt(C.NEW_EMISSIONS_T / 1e6) + ' Mt of emissions against ' + mt(C.NEW_BASELINE_T / 1e6) +
    ' Mt of best-practice baseline. <span class="tag tag--asm">Assumption</span></p></div>');

  h.push('<div class="ctrl"><div class="ctrl__lab"><span>Additional on-site abatement</span><span class="ctrl__val" id="v-abate"></span></div>' +
    '<input type="range" id="c-abate" min="0" max="3" step="0.1">' +
    '<p class="ctrl__hint">Additional on-site abatement, applied as a compounding annual reduction in covered emissions. At zero, the starting-point assumption applies and no additional on-site abatement is assumed. <span class="tag tag--asm">Assumption</span></p></div>');

  $("controls").innerHTML = h.join("");
  bindControls();
}
function setVal(id, v) { var e = $(id); if (e && e.value !== String(v)) e.value = v; }
function syncControls() {
  $("v-target").textContent = Math.round(S.target * 100) + "% · " + mt(targetMt(S.target)) + " Mt";
  $("v-d").textContent = (S.d * 100).toFixed(2) + " pp/yr";
  $("v-abate").textContent = (S.abate * 100).toFixed(1) + "%/yr";
  $("v-cul").textContent = S.cuL + " years";
  setVal("c-target", Math.round(S.target * 100));
  setVal("c-d", (S.d * 100).toFixed(2));
  setVal("c-abate", (S.abate * 100).toFixed(1));
  setVal("c-cul", S.cuL);
  $("h-teba").innerHTML = hintOf(TEBA_MODES, S.teba);
  $("h-pf").innerHTML = hintOf(PF_MODES, S.pf) + ' <span class="tag tag--asm">Assumption</span>';
  $("h-clos").innerHTML = hintOf(CLOS_MODES, S.clos);
  $("row-cul").hidden = S.teba !== "catchup";
  var cur = { teba: S.teba, pf: S.pf, clos: S.clos, pipe: S.pipe ? "1" : "0" };
  Array.prototype.forEach.call(document.querySelectorAll("[data-seg]"), function (g) {
    var name = g.getAttribute("data-seg");
    Array.prototype.forEach.call(g.querySelectorAll("button"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === cur[name]));
    });
  });
}
function bindControls() {
  function on(id, fn) { var e = $(id); if (e) e.addEventListener("input", fn); }
  on("c-target", function (e) { S.target = +e.target.value / 100; HASH_ON = true; redraw(); });
  on("c-d", function (e) { S.d = +e.target.value / 100; HASH_ON = true; redraw(); });
  on("c-abate", function (e) { S.abate = +e.target.value / 100; HASH_ON = true; redraw(); });
  on("c-cul", function (e) { S.cuL = +e.target.value; HASH_ON = true; redraw(); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-seg]"), function (g) {
    g.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button") : null;
      if (!b || !g.contains(b)) return;
      var name = g.getAttribute("data-seg"), v = b.getAttribute("data-v");
      if (name === "pipe") S.pipe = v === "1"; else S[name] = v;
      HASH_ON = true; redraw();
    });
  });
  $("c-solve").addEventListener("click", function () {
    S.d = solveRate(S, targetMt(S.target)) / 100; HASH_ON = true; redraw();
  });
  $("c-reset").addEventListener("click", function () {
    S = Object.assign({}, REF); HASH_ON = true; redraw();
  });
  var lk = $("c-link");
  lk.addEventListener("click", function () {
    HASH_ON = true; toHash();
    if (navigator.clipboard) navigator.clipboard.writeText(location.href);
    lk.textContent = "Link copied";
    setTimeout(function () { lk.textContent = "Copy scenario link"; }, 1800);
  });
}

function renderLab() {
  var T = targetMt(S.target), a = yearAgg(10, S), need = solveRate(S, T), b5 = budget5(S);
  var budget = S.target >= 0.70 ? C.BUDGET["0.70"] : (S.target <= 0.62 ? C.BUDGET["0.62"] : null);
  var hit = a.net <= T + 1e-9, gap = a.net - T;
  $("verdict").innerHTML =
    '<div class="verdict verdict--' + (hit ? "hit" : "miss") + '"><b>' +
    (hit ? "These settings meet the " + Math.round(S.target * 100) + "% target" :
           "These settings miss the " + Math.round(S.target * 100) + "% target by " + mt(gap, 2) + " Mt") +
    "</b><p style=\"margin-top:8px;font-size:15px;color:var(--ink-soft)\">Modelled compliant net emissions in FY2034-35 are <b>" +
    mt(a.net, 2) + " Mt CO₂-e</b> against a point target of <b>" + mt(T, 2) + " Mt</b>. The post-2030 decline rate that meets the target exactly is <b>" +
    need.toFixed(2) + " percentage points per year</b>, " +
    (need > C.D_STATUTORY * 100 ?
      Math.abs(need - C.D_STATUTORY * 100).toFixed(2) + " points above the statutory indicative rate of " + (C.D_STATUTORY * 100).toFixed(3) + "." :
      Math.abs(need - C.D_STATUTORY * 100).toFixed(2) + " points below the statutory indicative rate of " + (C.D_STATUTORY * 100).toFixed(3) + ".") +
    "</p></div>";

  var tot = a.nT + a.nN;
  $("lab-out").innerHTML = [
    ["Rate required for this target", need.toFixed(2) + " pp/yr", "Statutory indicative rate: " + (C.D_STATUTORY * 100).toFixed(3) + " percentage points per year"],
    ["Aggregate baselines, FY2034-35", mt(a.base, 1) + " Mt", "The sum of the baselines the rules would set in that year"],
    ["Five-year cumulative net", mt(b5, 0) + " Mt", budget === null ? "FY2030-31 to FY2034-35" :
      "Compared with the consultation paper's " + mt(budget, 0) + " Mt budget for this target: " + sgn(b5 - budget, 0) + " Mt"],
    ["Net emissions of facilities with a determination", mt(a.nT, 1) + " Mt", (100 * a.nT / tot).toFixed(1) + "% of modelled compliant net emissions, from " +
      D.meta.teba_facilities + " of " + F.length + " facility rows"],
    ["Facilities above baseline, FY2034-35", int(a.over), int(a.under) + " at or below baseline; " + int(a.closed) + " closed"],
    ["Units to be surrendered, FY2034-35", mt(a.owed, 2) + " Mt", "Covered emissions less the applicable baseline, summed over facilities above baseline, assuming no additional on-site abatement"]
  ].map(function (o) {
    return '<div class="out"><span>' + o[0] + '</span><b>' + o[1] +
      '</b><span class="tag tag--mod">Modelled</span><small>' + o[2] + "</small></div>";
  }).join("");

  renderFrontier(T);
  renderWaterfall();
  $("how-lab").innerHTML =
    "<p><b>The iso-target curve.</b> For a fixed 2035 target, each post-2030 decline rate for the " + D.meta.teba_facilities +
    " facilities with a trade-exposed determination implies a single rate for the remaining facilities at which the national total meets the target exactly. " +
    "Plotting that implied rate for each value gives the curve. Every point on the curve meets the same target; the points differ in how the reduction is " +
    "distributed between the two groups. Points above the curve exceed the target and points below it fall short.</p>" +
    "<p><b>Interpretation.</b> Where the curve crosses the dashed 45° line, both groups decline at the same rate. That is the single-rate result, and " +
    "it is the quantity the consultation question asks about. Moving to the left along the curve reduces the rate required of the facilities with a " +
    "determination; the curve gives the corresponding increase required of the other " + (F.length - D.meta.teba_facilities) + " facilities. " +
    "Because the two groups differ greatly in size, the exchange is far from one-for-one.</p>" +
    "<p><b>Solution method.</b> The rate is found by bisection over 44 iterations, to a precision of approximately 0.0001 percentage points. " +
    "Each iteration recalculates all " + F.length + " facility rows; no fitted parameters are used.</p>" +
    "<p><b>Effect of additional on-site abatement.</b> Modelled compliant net emissions are the smaller of covered emissions and the baseline. " +
    "A facility well above its baseline remains above it after a small annual reduction, so its contribution to net emissions is unchanged and " +
    "only the units it must surrender are reduced. The abatement setting therefore changes the <em>units to be surrendered</em> figure before it " +
    "changes net emissions. On the starting-point assumptions, net emissions begin to fall only when the abatement rate is large enough to bring " +
    "facilities below their baselines.</p>" +
    "<p><b>The decomposition chart.</b> The FY2034-35 figure is decomposed by moving one setting at a time from current policy to the selected value, " +
    "in the order shown. The final bar is the interaction term, the part of the difference that depends on the order of the steps and cannot be " +
    "attributed to any single setting.</p>";
}

/* ---------- 7. iso-target frontier ----------------------------------- */
function renderFrontier(T) {
  var pts = frontier(T, S);
  var W = 900, H = 430, L = 66, R = 800, Tp = 24, B = 350;
  var xm = 16, ym = Math.max(8, Math.ceil(pts[0][1] + 1));
  var X = function (v) { return L + (R - L) * v / xm; };
  var Y = function (v) { return B - (B - Tp) * v / ym; };
  var s = [];
  for (var v = 0; v <= ym; v += 1)
    s.push('<line x1="' + L + '" y1="' + Y(v).toFixed(1) + '" x2="' + R + '" y2="' + Y(v).toFixed(1) +
      '" stroke="#e4ddcf"/>' + txt(L - 9, Y(v) + 4, String(v), { anchor: "end" }));
  for (var x = 0; x <= xm; x += 2)
    s.push('<line x1="' + X(x).toFixed(1) + '" y1="' + Tp + '" x2="' + X(x).toFixed(1) + '" y2="' + B +
      '" stroke="#e4ddcf"/>' + txt(X(x), B + 18, String(x), { anchor: "middle" }));
  s.push(txt((L + R) / 2, B + 40, "Post-2030 decline rate for the " + D.meta.teba_facilities +
    " facilities with a trade-exposed determination, percentage points per year", { anchor: "middle", size: 12, fill: "#4c5b68" }));
  s.push(txt(16, (Tp + B) / 2, "Rate for the other " + (F.length - D.meta.teba_facilities) + " facilities, percentage points per year",
    { anchor: "middle", rot: "-90 16 " + ((Tp + B) / 2).toFixed(0), size: 12, fill: "#4c5b68" }));
  var d45 = Math.min(xm, ym);
  s.push('<line x1="' + X(0).toFixed(1) + '" y1="' + Y(0).toFixed(1) + '" x2="' + X(d45).toFixed(1) +
    '" y2="' + Y(d45).toFixed(1) + '" stroke="#9A958C" stroke-dasharray="4 4"/>');
  s.push(txt(X(d45) - 6, Y(d45) - 9, "equal rates", { anchor: "end", size: 11 }));
  s.push(poly(pts.map(function (p) { return [X(p[0]), Y(p[1])]; }), PAL.t62, 2.6));
  s.push(txt(X(pts[pts.length - 1][0]) + 8, Y(pts[pts.length - 1][1]) + 4,
    Math.round(S.target * 100) + "% target — " + mt(T, 1) + " Mt", { size: 12, fill: PAL.t62, weight: 700, halo: 1 }));
  s.push(txt(X(1.5), Y(0.8), "below the curve: target not met", { size: 11.5, fill: PAL.neg }));
  s.push(txt(X(8.5), Y(ym - 0.5), "above the curve: target exceeded", { size: 11.5, fill: PAL.pos }));
  /* your setting, and the single-rate answer */
  var dp = S.d * 100, need = solveRate(S, T);
  if (dp <= xm && dp <= ym) {
    s.push('<circle cx="' + X(dp).toFixed(1) + '" cy="' + Y(dp).toFixed(1) + '" r="6.5" fill="' + PAL.you +
      '" stroke="#fff" stroke-width="1.6"/>');
    s.push(txt(X(dp) + 12, Y(dp) - 13, "selected rate " + dp.toFixed(2), { size: 11.5, fill: PAL.you, weight: 700, halo: 1 }));
  }
  if (need <= xm && need <= ym) {
    s.push('<circle cx="' + X(need).toFixed(1) + '" cy="' + Y(need).toFixed(1) + '" r="5" fill="none" stroke="' +
      PAL.t62 + '" stroke-width="2.2"/>');
    s.push(txt(X(need) - 12, Y(need) + 24, "single rate that meets the target: " + need.toFixed(2),
      { size: 11.5, fill: PAL.t62, anchor: "end", weight: 600, halo: 1 }));
  }
  $("chart-front").innerHTML = svgEl(W, H, s.join(""));
  $("legend-front").innerHTML = legend([
    ["Combinations that meet the selected 2035 target", PAL.t62],
    ["Selected rate", PAL.you]
  ]);
}

/* ---------- 8. why did this change? ---------------------------------- */
var WF_STEPS = [
  ["pf", "Production", function (o) { o.pf = S.pf; }],
  ["pipe", "New entrants", function (o) { o.pipe = S.pipe; }],
  ["clos", "Closures", function (o) { o.clos = S.clos; }],
  ["teba", "Trade-exposed determinations", function (o) { o.teba = S.teba; o.cuL = S.cuL; }],
  ["abate", "Additional abatement", function (o) { o.abate = S.abate; }],
  ["d", "Decline rate", function (o) { o.d = S.d; }]
];
function renderWaterfall() {
  var cur = Object.assign({}, REF), base = net35(cur), bars = [], v = base;
  WF_STEPS.forEach(function (st) {
    var changed = JSON.stringify(S[st[0]]) !== JSON.stringify(REF[st[0]]) ||
                  (st[0] === "teba" && S.cuL !== REF.cuL && S.teba === "catchup");
    if (!changed) return;
    st[2](cur);
    var nv = net35(cur);
    bars.push([st[1], nv - v]); v = nv;
  });
  var final = net35(S);
  if (Math.abs(final - v) > 0.005) bars.push(["Interaction", final - v]);
  var W = 900, H = 300, L = 30, R = 870, Tp = 26, B = 216;
  if (!bars.length) {
    $("chart-wf").innerHTML =
      '<p style="padding:18px 8px;color:var(--ink-faint);font-size:14.5px">' +
      "The settings are those of current policy on the starting-point assumptions, so there is no difference to decompose. " +
      "When a setting is changed, this chart shows the contribution of each change to the FY2034-35 figure.</p>";
    $("legend-wf").innerHTML = "";
    return;
  }
  var cols = [["Current policy", base, null]];
  var run = base;
  bars.forEach(function (b) { cols.push([b[0], run + b[1], b[1]]); run += b[1]; });
  cols.push(["Selected settings", final, null]);
  var lo = Math.min.apply(null, cols.map(function (c) { return c[1]; }).concat([base, final]));
  var hi = Math.max.apply(null, cols.map(function (c) { return c[1]; }).concat([base, final]));
  var pad = Math.max(0.6, (hi - lo) * 0.28); lo = Math.max(0, lo - pad); hi = hi + pad;
  var Y = function (v2) { return B - (B - Tp) * (v2 - lo) / (hi - lo); };
  var n = cols.length, bw = Math.min(96, (R - L) / n * 0.62);
  var s = [], cx = function (i) { return L + (R - L) * (i + 0.5) / n; };
  s.push('<line x1="' + L + '" y1="' + B + '" x2="' + R + '" y2="' + B + '" stroke="#e4ddcf"/>');
  cols.forEach(function (c, i) {
    var x = cx(i) - bw / 2, isTotal = c[2] === null;
    var y0 = isTotal ? Y(0 > lo ? lo : 0) : Y(c[1] - c[2]), y1 = Y(c[1]);
    var top = isTotal ? y1 : Math.min(y0, y1), h = isTotal ? Math.max(2, B - y1) : Math.max(2, Math.abs(y1 - y0));
    var col = isTotal ? PAL.net : (c[2] > 0 ? PAL.neg : PAL.pos);
    s.push('<rect x="' + x.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + bw.toFixed(1) +
      '" height="' + h.toFixed(1) + '" rx="3" fill="' + col + '" opacity="' + (isTotal ? ".92" : ".82") + '"/>');
    s.push(txt(cx(i), top - 8, isTotal ? mt(c[1], 2) + " Mt" : sgn(c[2], 2),
      { anchor: "middle", size: 12, weight: 700, fill: col }));
    var words = c[0].split(" "), line = "", lines = [];
    words.forEach(function (w) {
      if ((line + " " + w).trim().length > 14) { lines.push(line.trim()); line = w; } else line += " " + w;
    });
    lines.push(line.trim());
    lines.forEach(function (ln, j) { s.push(txt(cx(i), B + 18 + j * 13, ln, { anchor: "middle", size: 11 })); });
  });
  $("chart-wf").innerHTML = svgEl(W, H, s.join(""));
  $("legend-wf").innerHTML = legend([
    ["Increases FY2034-35 net emissions", PAL.neg],
    ["Reduces FY2034-35 net emissions", PAL.pos],
    ["Total", PAL.net]
  ]);
}

/* ---------- 9. facility table ---------------------------------------- */
var sortK = "cov", sortDir = -1, ROWS = [];
function buildRows() {
  ROWS = F.map(function (f) {
    var r = facYear(f, 10, S), cy = closeYear(f, S.clos);
    return {
      f: f, n: f.n, o: f.o, s: f.s, a: f.a, cov: f.cov, b0: f.b0, pos0: f.cov - f.b0,
      b35: r ? r.b : null, pos35: r ? r.cov - r.b : null, close: cy, teba: !!f.t
    };
  });
}
function renderTable() {
  var q = ($("fsearch").value || "").toLowerCase().trim();
  var st = $("fstate").value, cl = $("fclass").value;
  var rows = ROWS.filter(function (r) {
    if (st && r.s !== st) return false;
    if (cl === "teba" && !r.teba) return false;
    if (cl === "over" && r.pos0 <= 0) return false;
    if (cl === "under" && r.pos0 > 0) return false;
    if (cl === "close" && !r.close) return false;
    if (q && (r.n + " " + r.o + " " + r.a).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  rows.sort(function (x, y) {
    var a = x[sortK], b = y[sortK];
    if (a === null) a = -Infinity; if (b === null) b = -Infinity;
    if (typeof a === "string") return sortDir * a.localeCompare(b);
    return sortDir * (a - b);
  });
  var tb = document.querySelector("#ftable tbody");
  if (!tb) return;
  tb.innerHTML = rows.map(function (r) {
    var pill0 = r.pos0 > 0 ? '<span class="pill pill--over">above</span>' : '<span class="pill pill--under">below</span>';
    var cell35 = r.close ? '<span class="pill pill--closed">closed ' + r.close + "</span>" : int(r.b35);
    var pill35 = r.close ? "—" : (r.pos35 > 0 ? '<span class="pill pill--over">' + int(r.pos35) + "</span>"
                                               : '<span class="pill pill--under">' + int(r.pos35) + "</span>");
    var nm = r.f.u ? '<a href="' + ROOT + 'facility/' + r.f.u + '.html">' + esc(r.n) + "</a>" : esc(r.n);
    return "<tr><td><span class=\"fname\">" + nm + (r.teba ? ' <span class="pill pill--teba">TEBA</span>' : "") +
      '</span><span class="fsub">' + esc(r.o || "—") + " · " + esc(r.a || "—") + "</span></td>" +
      "<td>" + esc(r.s) + "</td>" +
      '<td class="num">' + int(r.cov) + "</td>" +
      '<td class="num">' + int(r.b0) + "</td>" +
      '<td class="num">' + int(r.pos0) + " " + pill0 + "</td>" +
      '<td class="num">' + cell35 + "</td>" +
      '<td class="num">' + pill35 + "</td></tr>";
  }).join("");
  $("fcount").textContent =
    "Showing " + rows.length + " of " + ROWS.length + " register rows. The FY2034-35 columns follow the settings selected above.";
  window.__atlasRows = rows;
}
function csv() {
  var head = ["facility", "responsible_emitter", "state", "anzsic", "teba",
    "covered_emissions_t_fy2024_25", "baseline_t_fy2024_25", "position_t_fy2024_25",
    "modelled_baseline_t_fy2034_35", "modelled_position_t_fy2034_35", "closes_in_scenario"];
  var meta = "# Safeguard Atlas — heliovulcan.com.au/safeguard-atlas.html\n" +
    "# register: CER Safeguard facility data " + D.meta.register_year + "; model built " + D.meta.built + "\n" +
    "# scenario: target=" + Math.round(S.target * 100) + "% d=" + (S.d * 100).toFixed(2) +
    "pp/yr teba=" + S.teba + " production=" + S.pf + " pipeline=" + (S.pipe ? "on" : "off") +
    " closures=" + S.clos + " abatement=" + (S.abate * 100).toFixed(1) + "%/yr\n" +
    "# columns 6-8 are published register values; columns 9-10 are modelled and are not compliance determinations\n";
  var body = (window.__atlasRows || ROWS).map(function (r) {
    return [r.n, r.o, r.s, r.a, r.teba ? "yes" : "no", Math.round(r.cov), Math.round(r.b0),
      Math.round(r.pos0), r.b35 === null ? "" : Math.round(r.b35),
      r.pos35 === null ? "" : Math.round(r.pos35), r.close || ""]
      .map(function (v) { return /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : v; })
      .join(",");
  }).join("\n");
  var blob = new Blob([meta + head.join(",") + "\n" + body + "\n"], { type: "text/csv;charset=utf-8" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "safeguard-atlas-facilities.csv";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
}

/* ---------- 10. sources and self-check -------------------------------- */
function renderSources() {
  var rows = [
    ["Facility register", "Clean Energy Regulator — Safeguard facility reported emissions and baselines, " +
      D.meta.register_year, "Official", "Facility name, responsible emitter, state, industry, ERC, baseline, covered emissions. " +
      D.meta.register_rows + " rows after removing the 19 rows marked as eligible facilities under Rule s 58B.",
      "https://cer.gov.au/markets/reports-and-data/safeguard-data"],
    ["Baseline calculation", "National Greenhouse and Energy Reporting (Safeguard Mechanism) Rule 2015, compilation F2024C00846 — s 10(1), s 17, s 29, s 57",
      "Official", "The minimum baseline, the best-practice intensities applied to new entrants, and the provision that credits are calculated against the baseline before the minimum is applied.",
      "https://www.legislation.gov.au/F2015L01048/latest"],
    ["Trade-exposed determinations", "Clean Energy Regulator — trade-exposed baseline adjustment determinations", "Official",
      "The published ERC path, decline rate and end date for each of the " + D.meta.teba_facilities + " facilities with a current determination.",
      "https://cer.gov.au/schemes/safeguard-mechanism/safeguard-baselines"],
    ["2035 target", "DCCEEW — 2026-27 Safeguard Mechanism Review consultation paper, August 2026", "Official",
      "607.7 Mt CO₂-e of 2005 national emissions, the 29.8% share of the national task proposed for the scheme, and the cumulative budget range. Submissions closed 18 September 2026.",
      "https://consult.dcceew.gov.au/2026-27-safeguard-mechanism-review"],
    ["Production outlook", "Office of the Chief Economist, Resources and Energy Quarterly — national commodity production",
      "Assumption", "Applied as one factor per commodity, calibrated to the national production quantity. In the capped setting the factor for existing facilities does not exceed 1.0.", ""],
    ["Closures", "Owner announcements and regulatory approvals, reviewed facility by facility (September 2026)",
      "Assumption", "Seven facilities have a closure that the owner has decided or completed. The wider set adds mines whose approval expires within the period; those dates are expiries rather than decisions.", ""],
    ["New entrants", "Projects in public environmental assessment, with baselines calculated from the Rule's best-practice intensities",
      "Assumption", mt(C.NEW_EMISSIONS_T / 1e6) + " Mt CO₂-e of emissions against " + mt(C.NEW_BASELINE_T / 1e6) +
      " Mt of baseline, phased in over the decade according to stated commissioning dates.", ""],
    ["Model", "Heliovulcan — the calculation used in the 2026 decline-rate submission", "Modelled",
      "The calculation on this page is a port of the code used for the consultation submission. The check below re-runs the published cases.",
      "consultations.html"]
  ];
  $("srctbl").innerHTML =
    "<thead><tr><th>Input</th><th>Source</th><th>Kind</th><th>Use in the model</th></tr></thead><tbody>" +
    rows.map(function (r) {
      var tag = r[2] === "Official" ? "off" : (r[2] === "Modelled" ? "mod" : "asm");
      var src = r[4] ? '<a href="' + r[4] + '" target="_blank" rel="noopener">' + esc(r[1]) + "</a>" : esc(r[1]);
      return "<tr><td>" + esc(r[0]) + "</td><td>" + src + '</td><td><span class="tag tag--' + tag + '">' +
        r[2] + "</span></td><td>" + esc(r[3]) + "</td></tr>";
    }).join("") + "</tbody>";
}
function renderChurn() {
  var c = D.churn;
  if (!c) return;
  var pairs = c.pairs || [];
  var punct = pairs.filter(function (p) { return p[2] === "punctuation"; });
  var body = pairs.map(function (p) {
    return "<tr><td>" + esc(p[0]) + "</td><td>" + esc(p[1]) + "</td><td>" +
      (p[2] === "punctuation"
        ? '<span class="tag tag--off">Identical after punctuation</span>'
        : '<span class="tag tag--asm">To be verified</span>') + "</td></tr>";
  }).join("");
  var dupc = Object.keys(c.dup_cur || {}), dupp = Object.keys(c.dup_prev || {});
  $("churn").innerHTML =
    '<p class="atlas-sec__why" style="margin-top:10px">The Regulator has now published two years on the ' +
    "reformed rules. The FY2023-24 register carries <b>" + c.rows_prev + " rows</b> under " + c.names_prev +
    " distinct facility names; FY2024-25 carries <b>" + c.rows_cur + " rows</b> under " + c.names_cur +
    " names. <b>" + c.both + "</b> names appear in both years, " + c.only_cur.length +
    " only in the newer year and " + c.only_prev.length + " only in the older one.</p>" +
    '<p class="atlas-sec__why"><b>These figures are not reported as a count of facilities entering and leaving the ' +
    "scheme, because two features of the register prevent that reading.</b> First, facilities are renamed between years, " +
    "and a rename appears as one facility leaving and another entering. Second, when a facility changes operator " +
    "part-way through a year, both operators report it, producing two rows and two baselines under one name. This is why " +
    (dupc.length ? "<b>" + esc(dupc.join(", ")) + "</b> " + (dupc.length > 1 ? "appear" : "appears") +
      " twice in the FY2024-25 register" : "duplicate names occur") +
    (dupp.length ? ", and <b>" + esc(dupp.join(", ")) + "</b> " + (dupp.length > 1 ? "do" : "does") +
      " the same in FY2023-24" : "") + ". Each such row has its own page, and the rows are not combined.</p>" +
    '<p class="atlas-sec__why">The name pairs below are those that would need to be verified before entries and exits could be counted. ' +
    "They were selected by a stated rule: the generic words (<code>mine</code>, <code>coal</code>, <code>operations</code>, <code>facility</code>, " +
    "<code>project</code>, <code>pty</code>, <code>ltd</code> and similar) are removed from each name, and a pair is listed if the remaining words " +
    "of one name are contained in those of the other. " +
    (punct.length ? "<b>" + punct.length + " pairs are identical once punctuation is normalised</b> (an en dash against a hyphen). " : "") +
    "The remaining pairs are identified for verification and have not been verified. The model uses the FY2024-25 register as published, " +
    "so no result on this page depends on their resolution.</p>" +
    '<div style="overflow-x:auto"><table class="src-tbl"><thead><tr><th>Name in FY2024-25</th><th>Name in FY2023-24</th><th>Status</th></tr></thead>' +
    "<tbody>" + body + "</tbody></table></div>";
}
function selfCheck() {
  var B = D.bench, worst = 0, checks = 0, fails = [];
  function cmp(label, got, want, tol) {
    checks++;
    var diff = Math.abs(got - want);
    if (diff > worst) worst = diff;
    if (diff > tol) fails.push(label + " got " + got.toFixed(4) + ", published " + want.toFixed(4));
  }
  var cases = [["ref", { clos: "none", pipe: false }], ["pipe", { clos: "none", pipe: true }],
               ["start", { clos: "decided", pipe: true }]];
  var modes = ["none", "freeze", "current", "renew", "reset"];
  cases.forEach(function (c) {
    modes.forEach(function (m) {
      var o = Object.assign({}, REF, c[1], { teba: m === "reset" ? "catchup" : m, cuStart: 2031, cuL: m === "reset" ? 1 : 20 });
      var b = B[c[0] + "|" + m];
      if (!b) return;
      cmp(c[0] + "|" + m + " net35", net35(o), b.net35, 0.002);
      cmp(c[0] + "|" + m + " rate for 62%", solveRate(o, targetMt(0.62)), b.d62, 0.01);
      cmp(c[0] + "|" + m + " rate for 70%", solveRate(o, targetMt(0.70)), b.d70, 0.01);
      cmp(c[0] + "|" + m + " five-year total", budget5(o), b.budget, 0.01);
    });
  });
  if (B["years|start|current"]) {
    B["years|start|current"].forEach(function (v, k) {
      cmp("net " + fy(k), yearAgg(k, REF).net, v, 0.002);
    });
  }
  if (B.frontier) {
    [["62", 0.62], ["70", 0.70]].forEach(function (t) {
      var pub = B.frontier[t[0]]; if (!pub) return;
      var got = frontier(targetMt(t[1]), REF);
      pub.forEach(function (p, i) { if (got[i]) cmp("frontier " + t[0] + "% at " + p[0], got[i][1], p[1], 0.01); });
    });
  }
  var el = $("selfcheck");
  if (fails.length) {
    el.className = "selfcheck bad";
    el.innerHTML = "Verification: " + fails.length + " of " + checks + " cases differ from the published figures.<br>" +
      fails.slice(0, 6).map(esc).join("<br>");
  } else {
    el.className = "selfcheck ok";
    el.textContent = "Verification passed: " + checks + " published figures were recomputed in this browser; the largest difference is " +
      worst.toExponential(1) + ", attributable to rounding.";
  }
  $("selfcheck-note").innerHTML =
    "The verification recomputes, in the reader's browser, the principal figures published in Heliovulcan's 2026 decline-rate submission: " +
    "FY2034-35 modelled compliant net emissions, the decline rate required for a 62% and a 70% target, and the five-year cumulative total, " +
    "for three facility populations and five treatments of the trade-exposed determinations, together with both iso-target curves. " +
    "A difference between this page and the submission would be reported here.";
}


/* ---------- 11b. headlines: the answer first, the evidence after -------- */
function chartHead(id, title, sub) {
  var el = document.getElementById(id); if (!el) return;
  el.innerHTML = '<div class="chart-head"><div><h3 class="chart-h">' + title + '</h3>' +
    (sub ? '<p class="chart-sub">' + sub + "</p>" : "") + '</div><span class="chart-mark">Heliovulcan analysis</span></div>';
}
function renderHeadlines() {
  var r = yearAgg(10, REF), need = solveRate(REF, targetMt(0.62)), cur = yearAgg(10, S);
  var set = function (id, v) { var e = document.getElementById(id); if (e) e.innerHTML = v; };
  set("hl-net35", mt(r.net, 2) + " Mt CO\u2082-e");
  set("ov-net35", mt(r.net, 2) + " Mt CO\u2082-e");
  set("hl-rate", need.toFixed(2) + " percentage points");
  set("hl-n", F.length + " facility rows");
  /* starting point */
  var cov = 0, over = 0; F.forEach(function (f) { cov += f.cov; if (f.cov > f.b0) over++; });
  set("start-h2", "The FY2024-25 starting point: " + F.length + " rows, " + mt(cov / 1e6) + " Mt CO\u2082-e covered, " + over + " facilities above baseline");
  /* pathway chart */
  chartHead("chart-path-head",
    "Modelled compliant emissions " + (cur.net < r.net - 0.005 ? "fall to " : cur.net > r.net + 0.005 ? "reach " : "fall to ") + mt(cur.net, 2) +
    " Mt CO\u2082-e by FY2034-35 under the settings in force" + (isRef() ? "" : ", against " + mt(r.net, 2) + " Mt under current policy"),
    "Mt CO\u2082-e per year, FY2024-25 to FY2039-40; settings in force compared with the current-policy reference case");
  /* policy charts */
  var T = targetMt(S.target);
  chartHead("chart-front-head",
    "A slower path for the " + D.meta.teba_facilities + " trade-exposed facilities must be paid for by the other " + (F.length - D.meta.teba_facilities),
    "Pairs of post-2030 decline rates, in percentage points per year, that meet the " + Math.round(S.target * 100) + "% target of " + mt(T, 1) + " Mt CO\u2082-e in FY2034-35");
  chartHead("chart-wf-head", isRef() ? "Current policy on the starting-point assumptions" : "Where the difference from current policy comes from",
    "FY2034-35 modelled compliant net emissions, Mt CO\u2082-e; each bar moves one setting from current policy to the value in force");
  /* scorecard */
  if (D.scorecard) { var t = D.scorecard[D.scorecard.length - 1], share = 100 * (t.b_prev - t.b_pred) / (t.b_prev - t.b_act);
    set("scorecard-h2", "Comparing the two registers: the ERC step explains " + share.toFixed(0) + "% of the fall in baselines"); }
  /* map: states */
  if (D.map) { var st = {}; F.forEach(function (f) { st[f.s] = (st[f.s] || 0) + f.cov; });
    var arr = Object.keys(st).map(function (k) { return [k, st[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
    var top3 = arr.slice(0, 3), tot = arr.reduce(function (a, x) { return a + x[1]; }, 0), s3 = top3.reduce(function (a, x) { return a + x[1]; }, 0);
    set("map-h2", "Facility distribution: " + top3.map(function (x) { return x[0]; }).join(", ") + " carry " + (100 * s3 / tot).toFixed(0) + "% of covered emissions"); }
  /* facilities */
  set("facilities-h2", "Facility positions: " + over + " above baseline in FY2024-25, " + cur.over + " in FY2034-35 under the settings in force");
}
/* the overview's "what changes the result": one setting moved at a time from the starting point */
function renderSensitivity() {
  var el = document.getElementById("sens-out"); if (!el) return;
  var base = net35(REF), T62 = targetMt(0.62);
  var cases = [
    ["Trade-exposed determinations renewed on their slower rate", { teba: "renew" }],
    ["Trade-exposed facilities reset to the default path in FY2030-31", { teba: "reset" }],
    ["Production held constant instead of the OCE outlook", { pf: "flat" }],
    ["No new entrants", { pipe: false }],
    ["Confirmed closures plus approval expiries", { clos: "tracker" }],
    ["Additional on-site abatement of 1% a year", { abate: 0.01 }]
  ];
  el.innerHTML = '<table class="sens-tbl"><thead><tr><th>One setting changed from the starting point</th>' +
    '<th class="num">FY2034-35 net, Mt</th><th class="num">Change</th><th class="num">Rate required for 62%, pp/yr</th></tr></thead><tbody>' +
    '<tr class="tot"><td>Current policy on the starting-point assumptions</td><td class="num">' + mt(base, 2) + '</td><td class="num">&mdash;</td><td class="num">' + solveRate(REF, T62).toFixed(2) + "</td></tr>" +
    cases.map(function (c) {
      var o = Object.assign({}, REF, c[1]), n = net35(o), d = n - base;
      return "<tr><td>" + c[0] + '</td><td class="num">' + mt(n, 2) + '</td><td class="num" style="color:' + (d > 0 ? "var(--amber)" : "var(--teal-deep)") + '">' + sgn(d, 2) + '</td><td class="num">' + solveRate(o, T62).toFixed(2) + "</td></tr>";
    }).join("") + "</tbody></table>";
}

/* ---------- 12. assumption scorecard ---------------------------------- */
var GROUP_LABEL = { lng: "LNG", coal: "Coal mining", other: "Other industries", alumina: "Alumina",
  steel: "Steel", iron_ore: "Iron ore", gas_east: "Gas, east coast", aluminium: "Aluminium", gold: "Gold",
  base_metals: "Base metals", oil: "Oil", mineral_sands: "Mineral sands", nickel: "Nickel", bauxite: "Bauxite",
  manganese: "Manganese", gas_west: "Gas, west coast", lithium: "Lithium", all: "All continuing facilities" };
function renderScorecard() {
  var rows = D.scorecard; if (!rows) return;
  var tot = rows[rows.length - 1];
  var ruleFall = tot.b_prev - tot.b_pred, actFall = tot.b_prev - tot.b_act, resid = tot.b_act - tot.b_pred;
  var covD = tot.c_act - tot.c_prev;
  var head =
    '<div class="outgrid" style="margin-top:22px">' +
    '<div class="out"><span>Facilities compared</span><b>' + tot.n + '</b><span class="tag tag--off">Official</span>' +
    '<small>Facilities with the same name and a single row in both registers. Renamed facilities and names with two rows in a year are excluded.</small></div>' +
    '<div class="out"><span>Baselines FY2023-24</span><b>' + mt(tot.b_prev, 2) + ' Mt</b><span class="tag tag--off">Official</span><small>Sum of the published baselines for the facilities compared</small></div>' +
    '<div class="out"><span>Rule-only figure for FY2024-25</span><b>' + mt(tot.b_pred, 2) + ' Mt</b><span class="tag tag--mod">Modelled</span>' +
    '<small>Each baseline adjusted by its own ERC change only; a reduction of ' + mt(ruleFall, 2) + ' Mt</small></div>' +
    '<div class="out"><span>Published FY2024-25</span><b>' + mt(tot.b_act, 2) + ' Mt</b><span class="tag tag--off">Official</span>' +
    '<small>A reduction of ' + mt(actFall, 2) + ' Mt. The residual of ' + sgn(resid, 2) + ' Mt is attributable to production and intensity, ' +
    (Math.abs(resid) / ruleFall * 100).toFixed(0) + '% of the rule effect</small></div>' +
    '<div class="out"><span>Covered emissions, same facilities</span><b>' + mt(tot.c_prev, 2) + ' → ' + mt(tot.c_act, 2) + ' Mt</b>' +
    '<span class="tag tag--off">Official</span><small>A change of ' + sgn(covD, 2) + ' Mt. Baselines fell by ' + mt(actFall, 1) +
    ' Mt while covered emissions changed by ' + mt(Math.abs(covD), 1) + ' Mt; the difference is the additional surrender obligation created in the year</small></div>' +
    "</div>";
  var body = rows.map(function (r) {
    var res = r.b_act - r.b_pred, cd = r.c_act - r.c_prev;
    return "<tr" + (r.group === "all" ? ' class="tot"' : "") + "><td>" + esc(GROUP_LABEL[r.group] || r.group) +
      '</td><td class="num">' + r.n + '</td><td class="num">' + mt(r.b_prev, 2) + '</td><td class="num">' + mt(r.b_pred, 2) +
      '</td><td class="num">' + mt(r.b_act, 2) + '</td><td class="num" style="color:' + (res > 0 ? "var(--amber)" : "var(--teal-deep)") + '">' +
      sgn(res, 2) + '</td><td class="num">' + mt(r.c_prev, 2) + '</td><td class="num">' + mt(r.c_act, 2) +
      '</td><td class="num" style="color:' + (cd > 0 ? "var(--amber)" : "var(--teal-deep)") + '">' + sgn(cd, 2) + "</td></tr>";
  }).join("");
  $("scorecard-out").innerHTML = head +
    '<div style="overflow-x:auto"><table class="sc-tbl"><thead><tr><th>Group</th><th class="num">Facilities</th>' +
    '<th class="num">Baseline FY23-24</th><th class="num">Rule-only prediction</th><th class="num">Published FY24-25</th>' +
    '<th class="num">Residual</th><th class="num">Covered FY23-24</th><th class="num">Covered FY24-25</th><th class="num">Change</th></tr></thead><tbody>' +
    body + "</tbody></table></div>" +
    '<p class="note-inline">All figures are Mt CO₂-e. Facilities are grouped by the commodity used for their production assumption. ' +
    'A positive residual means the published baseline is above the rule-only figure, which indicates an increase in production or intensity.</p>';
  var A = D.assumptions || {};
  $("how-sc").innerHTML =
    "<p><b>Method.</b> A baseline is production multiplied by an applicable intensity and by the ERC. Between two years the ERC changes by rule; " +
    "production and intensity change for facility-specific reasons. For each facility compared, the rule-only figure is " +
    "<code>baseline<sub>FY23-24</sub> × ERC<sub>FY24-25</sub> ÷ ERC<sub>FY23-24</sub></code>, using the facility's own published ERC in each year " +
    "(0.951 to 0.902 for most facilities; 0.99 to 0.98 for those with a trade-exposed determination). For " + tot.n + " facilities the rule-only figure is " +
    mt(tot.b_pred, 2) + " Mt and the published figure is " + mt(tot.b_act, 2) + " Mt. The ERC change accounts for " +
    (100 * ruleFall / actFall).toFixed(0) + "% of the reduction in aggregate baselines.</p>" +
    "<p><b>Assumptions not yet tested.</b> The forward assumptions in the model, namely the commodity production factors, the " +
    Object.keys(A.closures_decided || {}).length + " confirmed closures, the phasing of new entrants and the end dates of the " +
    Object.keys(A.teba_end_years || {}).length + " trade-exposed determinations, cannot be compared with outcomes until the FY2025-26 register is published. " +
    "They are recorded in the page's data file with the model date <code>" + esc(A.model_version || "") + "</code> so that the comparison can be made against " +
    "the assumptions as stated. <a href=\"" + ROOT + "data/safeguard-atlas.json\">The data file is available for download.</a></p>";
}

/* ---------- 13. map ---------------------------------------------------- */
var MAP_ON = null;
function tierColour(t) { return t === "A" ? "#2f7d6b" : t === "B" ? "#b9712b" : "#4C3F79"; }
function renderMap() {
  var M = D.map; if (!M) return;
  var mode = $("map-colour").value;
  var pts = M.points.slice().sort(function (a, b) { return F[b.i].cov - F[a.i].cov; });   // big ones underneath
  var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
  var x0 = 100.5, x1 = 137.3, y0 = 10.4, y1 = 43.9;
  var maxCov = Math.max.apply(null, F.map(function (f) { return f.cov; }));
  var s = ['<svg viewBox="' + x0 + " " + y0 + " " + (x1 - x0) + " " + (y1 - y0) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Map of Safeguard facilities" style="font-family:var(--sans)">'];
  Object.keys(M.paths).forEach(function (k) { s.push('<path class="map-state" d="' + M.paths[k] + '"/>'); });
  var col = function (p) {
    var f = F[p.i];
    if (mode === "pos0") return f.cov > f.b0 ? PAL.neg : PAL.pos;
    if (mode === "pos35") { var r = facYear(f, 10, S); return !r ? "#9A958C" : (r.cov > r.b ? PAL.neg : PAL.pos); }
    if (mode === "teba") return f.t ? "#4C3F79" : "#9A958C";
    return tierColour(p.t);
  };
  pts.forEach(function (p) {
    var f = F[p.i], r = 0.12 + 1.15 * Math.sqrt(f.cov / maxCov);
    s.push('<circle class="map-dot t' + p.t + '" data-i="' + p.i + '" cx="' + p.x + '" cy="' + p.y + '" r="' + r.toFixed(3) +
      '" fill="' + col(p) + '" stroke="' + (p.t === "C" ? col(p) : "#fffdf9") + '" opacity=".82"><title>' + esc(f.n) + " — " + int(f.cov) + " t</title></circle>");
  });
  s.push("</svg>");
  $("chart-map").innerHTML = s.join("");
  var leg = mode === "pos0" || mode === "pos35"
    ? [["Above baseline", PAL.neg], ["At or below baseline", PAL.pos]].concat(mode === "pos35" ? [["Closed under the selected settings", "#9A958C"]] : [])
    : mode === "teba" ? [["Trade-exposed determination", "#4C3F79"], ["Default path", "#9A958C"]]
    : [["A · single NPI site", tierColour("A")], ["B · one of several NPI sites", tierColour("B")], ["C · located through an unverified name match", tierColour("C")]];
  $("legend-map").innerHTML = legend(leg);
  Array.prototype.forEach.call(document.querySelectorAll(".map-dot"), function (c) {
    c.addEventListener("mouseenter", function () { mapInfo(+c.getAttribute("data-i")); });
    c.addEventListener("click", function () { MAP_ON = +c.getAttribute("data-i"); mapInfo(MAP_ON, true); });
  });
  if (MAP_ON !== null) mapInfo(MAP_ON, true);
  var t = M.tiers || {};
  $("map-tiers").innerHTML =
    "<b>" + M.points.length + " of " + F.length + " register rows are shown.</b> " +
    (t.A || 0) + " are located from a single National Pollutant Inventory site (grade A), " + (t.B || 0) + " from one of several NPI sites associated with the facility (grade B), and " +
    (t.C || 0) + " through a facility name match that has not been verified (grade C, drawn as an open circle). " +
    (M.missing || []).length + " rows have no coordinate of sufficient quality and are listed below rather than placed. " +
    "The coastline is simplified, so coastal plants and offshore platforms may appear on or beyond the outline.";
  var pointByI = {}; M.points.forEach(function (p) { pointByI[p.i] = p; });
  $("how-map").innerHTML =
    "<p><b>Coordinates.</b> All coordinates are taken from the National Pollutant Inventory (NPI). Each Safeguard facility is matched to an NPI reporting site, " +
    "and that site's coordinate is used. Where a facility is associated with more than one NPI site, for example a mine with several pits or an operator with several " +
    "licences, one site is used and the point is graded B. Where the register row has no NPI match under its FY2024-25 name but does under its FY2023-24 name, the " +
    "earlier row's coordinate is used and the point is graded C. Three of those name pairs differ only in punctuation and take the grade of the underlying point.</p>" +
    "<p><b>Projection.</b> Equirectangular, standard parallel 27°S. Distances are approximate.</p>" +
    "<p><b>Not shown (" + (M.missing || []).length + ").</b> " + (M.missing || []).map(esc).join(" · ") + ".</p>" +
    "<p>Gas distribution networks, rail and airline facilities have no single location and are not placed. The remaining omissions are gaps in the matching, not in the register.</p>";
}
function mapInfo(i, pin) {
  var f = F[i], p = null;
  D.map.points.forEach(function (q) { if (q.i === i) p = q; });
  var r = facYear(f, 10, S);
  $("map-info").innerHTML =
    "<b>" + (f.u ? '<a href="' + ROOT + 'facility/' + f.u + '.html">' + esc(f.n) + "</a>" : esc(f.n)) + "</b>" +
    (f.t ? ' <span class="pill pill--teba">TEBA</span>' : "") +
    '<div style="margin-top:4px;color:var(--ink-soft)">' + esc(f.o || "—") + " · " + esc(f.s) + " · " + esc(f.a) + "</div>" +
    '<div style="margin-top:6px">FY2024-25: covered <b>' + int(f.cov) + "</b> t, baseline <b>" + int(f.b0) + "</b> t, " +
    (f.cov > f.b0 ? '<span class="pill pill--over">' + int(f.cov - f.b0) + " above</span>" : '<span class="pill pill--under">' + int(f.b0 - f.cov) + " below</span>") +
    " &nbsp;·&nbsp; FY2034-35 under the selected settings: " + (r ? ("baseline <b>" + int(r.b) + "</b> t, " + (r.cov > r.b ? '<span class="pill pill--over">' + int(r.cov - r.b) + " above</span>" : '<span class="pill pill--under">' + int(r.b - r.cov) + " below</span>")) : '<span class="pill pill--closed">closed</span>') +
    '</div><div style="margin-top:6px;font-size:12.5px;color:var(--ink-faint)">Location grade ' + p.t + (p.n ? " — " + esc(p.n) : "") + (pin ? " · selected" : "") + "</div>";
  Array.prototype.forEach.call(document.querySelectorAll(".map-dot"), function (c) { c.classList.toggle("is-on", +c.getAttribute("data-i") === i); });
}

/* ---------- 14. facility sandbox -------------------------------------- */
var SB = { mode: "baseline", cov: 500000, b0: 450000, q: 1000000, ii: 0.45, teba: "no", rate: 1.0, c: "other", growth: 0, abate: 0 };
var SB_COMMOD = [["other", "Other / not sure (flat)"], ["coal", "Coal (thermal)"], ["coal_met", "Coal (metallurgical)"], ["lng", "LNG"],
  ["gas_east", "Gas, east coast"], ["gas_west", "Gas, west coast"], ["oil", "Oil"], ["alumina", "Alumina"], ["aluminium", "Aluminium"],
  ["bauxite", "Bauxite"], ["iron_ore", "Iron ore"], ["steel", "Steel"], ["gold", "Gold"], ["nickel", "Nickel"], ["lithium", "Lithium"],
  ["base_metals", "Base metals"], ["mineral_sands", "Mineral sands"], ["manganese", "Manganese"]];
function sbBase0() { return SB.mode === "baseline" ? SB.b0 : SB.q * SB.ii * C.ERC_2425; }
function sbPf(k) {
  var P = D.pf[S.pf] || D.pf.capped, arr = S.pf === "flat" ? null : (P[SB.c === "coal_met" ? "coal_met" : SB.c] || P.other);
  var base = arr ? arr[k] : 1;
  return base * Math.pow(1 + SB.growth, k);
}
function sbPath(d) {
  var b0 = sbBase0(), J = b0 / C.ERC_2425, out = [];
  for (var k = 0; k <= 10; k++) {
    var y = 2025 + k, pf = sbPf(k), erc;
    if (SB.teba === "yes") {                                   // a fresh three-year determination (FY2025-26 to FY2027-28) on a slower rate, then the default path
      var v = C.ERC_2425;
      for (var yy = 2026; yy <= y; yy++) v -= (yy <= 2028 ? SB.rate / 100 : (yy <= 2030 ? 0.049 : d));
      erc = Math.max(v, 0);
    } else erc = ercDefault(y, d);
    var b = J * pf * erc, braw = b;
    if (b < FLOOR && b0 >= FLOOR * 0.5) b = FLOOR;
    var cov = SB.cov * pf * Math.pow(1 - SB.abate, k);
    out.push({ k: k, b: b, braw: braw, cov: cov });
  }
  return out;
}
function sbControls() {
  var h = [];
  h.push('<div class="sb-field"><label>Basis for the baseline</label>' + seg("sbmode", [["baseline", "Baseline is known"], ["prod", "Production × intensity"]]) +
    '<p class="hint">Under Rule s 11 a baseline is production quantity × applicable emissions intensity × ERC. A baseline from a determination can be entered directly.</p></div>');
  h.push('<div class="sb-field" id="sb-row-b0"><label>Baseline FY2024-25, t CO₂-e</label><input type="number" id="sb-b0" min="0" step="1000" value="' + SB.b0 + '"></div>');
  h.push('<div class="sb-field" id="sb-row-q"><label>Production quantity, units per year</label><input type="number" id="sb-q" min="0" step="1000" value="' + SB.q + '">' +
    '<label style="margin-top:8px">Applicable emissions intensity, t CO₂-e per unit</label><input type="number" id="sb-ii" min="0" step="0.001" value="' + SB.ii + '">' +
    '<p class="hint">Baseline = quantity × intensity × 0.902, the FY2024-25 ERC. Applicable intensities are set out in Schedule 1 of the Rule; a new facility uses the best-practice intensity under Rule s 29.</p></div>');
  h.push('<div class="sb-field"><label>Covered emissions FY2024-25, t CO₂-e</label><input type="number" id="sb-cov" min="0" step="1000" value="' + SB.cov + '"></div>');
  h.push('<div class="sb-field"><label>Commodity, for the production path</label><select id="sb-c">' +
    SB_COMMOD.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === SB.c ? " selected" : "") + ">" + c[1] + "</option>"; }).join("") +
    '</select><p class="hint">Follows the production setting selected above (currently <b>' + S.pf + '</b>). A facility-specific change can be added below.</p></div>');
  h.push('<div class="sb-field"><label>Facility-specific production change <span class="v" id="sb-growth-v"></span></label><input type="range" id="sb-growth" min="-10" max="10" step="0.5" value="' + (SB.growth * 100) + '"><p class="hint">Annual, compounding, applied in addition to the commodity path. At zero the national outlook applies.</p></div>');
  h.push('<div class="sb-field"><label>Trade-exposed determination</label>' + seg("sbteba", [["no", "None"], ["yes", "Determination from FY2025-26"]]) +
    '<div id="sb-row-rate" hidden><label style="margin-top:8px">Decline rate under the determination <span class="v" id="sb-rate-v"></span></label>' +
    '<input type="range" id="sb-rate" min="0.5" max="3" step="0.05" value="' + SB.rate + '"><p class="hint">A three-year determination, after which the default path applies. Most current determinations specify 1 percentage point per year.</p></div></div>');
  h.push('<div class="sb-field"><label>Additional on-site abatement <span class="v" id="sb-abate-v"></span></label><input type="range" id="sb-abate" min="0" max="10" step="0.5" value="' + (SB.abate * 100) + '"><p class="hint">Annual, compounding, applied to covered emissions.</p></div>');
  h.push('<p class="hint" style="margin-top:12px">The post-2030 decline rate is taken from the policy settings above (currently <b>' + (S.d * 100).toFixed(2) + '</b> percentage points per year).</p>');
  $("sb-controls").innerHTML = h.join("");
  function on(id, ev, fn) { var e = $(id); if (e) e.addEventListener(ev, fn); }
  on("sb-b0", "input", function (e) { SB.b0 = +e.target.value || 0; renderSandbox(); });
  on("sb-q", "input", function (e) { SB.q = +e.target.value || 0; renderSandbox(); });
  on("sb-ii", "input", function (e) { SB.ii = +e.target.value || 0; renderSandbox(); });
  on("sb-cov", "input", function (e) { SB.cov = +e.target.value || 0; renderSandbox(); });
  on("sb-c", "change", function (e) { SB.c = e.target.value; renderSandbox(); });
  on("sb-growth", "input", function (e) { SB.growth = +e.target.value / 100; renderSandbox(); });
  on("sb-rate", "input", function (e) { SB.rate = +e.target.value; renderSandbox(); });
  on("sb-abate", "input", function (e) { SB.abate = +e.target.value / 100; renderSandbox(); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-seg="sbmode"],[data-seg="sbteba"]'), function (g) {
    g.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button") : null; if (!b || !g.contains(b)) return;
      if (g.getAttribute("data-seg") === "sbmode") SB.mode = b.getAttribute("data-v"); else SB.teba = b.getAttribute("data-v");
      renderSandbox();
    });
  });
}
function renderSandbox() {
  if (!$("sb-b0")) sbControls();
  $("sb-row-b0").hidden = SB.mode !== "baseline";
  $("sb-row-q").hidden = SB.mode !== "prod";
  $("sb-row-rate").hidden = SB.teba !== "yes";
  $("sb-growth-v").textContent = (SB.growth >= 0 ? "+" : "") + (SB.growth * 100).toFixed(1) + "%/yr";
  $("sb-rate-v").textContent = SB.rate.toFixed(2) + " pp/yr";
  $("sb-abate-v").textContent = (SB.abate * 100).toFixed(1) + "%/yr";
  Array.prototype.forEach.call(document.querySelectorAll('[data-seg="sbmode"] button'), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === SB.mode)); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-seg="sbteba"] button'), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === SB.teba)); });
  var rows = sbPath(S.d), last = rows[10], b0 = sbBase0();
  var owed = rows.reduce(function (a, r) { return a + Math.max(0, r.cov - r.b); }, 0);
  var sur = rows.reduce(function (a, r) { return a + Math.max(0, r.braw - r.cov); }, 0);
  /* break-even abatement: the compounding cut that puts FY2034-35 covered exactly on the baseline */
  var be = null;
  if (last.cov > last.b && last.cov > 0) be = 1 - Math.pow(last.b / (last.cov / Math.pow(1 - SB.abate, 10)), 1 / 10);
  /* sensitivity: ±1 point on the post-2030 rate */
  var lo = sbPath(Math.max(0, S.d - 0.01))[10], hi = sbPath(S.d + 0.01)[10];
  var floorK = null; rows.forEach(function (r) { if (r.b > r.braw && floorK === null) floorK = r.k; });
  $("sb-out").innerHTML = [
    ["Baseline FY2024-25", int(b0) + " t", SB.mode === "prod" ? int(SB.q) + " × " + SB.ii + " × 0.902" : "As entered"],
    ["Baseline FY2034-35", int(last.b) + " t", (100 * (1 - last.b / b0)).toFixed(0) + "% below the FY2024-25 baseline" + (floorK !== null ? "; set at the 100,000 t minimum from " + fy(floorK) : "")],
    ["Position FY2034-35", (last.cov > last.b ? "+" : "−") + int(Math.abs(last.cov - last.b)) + " t", last.cov > last.b ? "Covered emissions exceed the baseline; units would have to be surrendered" : "At or below baseline"],
    ["Units to be surrendered, FY2024-25 to FY2034-35", int(owed) + " t", "Sum of the annual shortfalls over eleven years"],
    ["Indicative credits, FY2024-25 to FY2034-35", int(sur) + " t", "Sum of the annual surpluses against the baseline before the minimum baseline is applied (Rule s 57)"],
    ["Break-even abatement", be === null ? "Not required" : (be * 100).toFixed(1) + "%/yr", be === null ? "Covered emissions are at or below the baseline in FY2034-35" : "The compounding annual reduction at which FY2034-35 covered emissions equal the baseline"],
    ["Sensitivity to the decline rate", "±1 pp → " + int(lo.b) + " / " + int(hi.b) + " t", "FY2034-35 baseline if the post-2030 rate were one percentage point lower or higher than " + (S.d * 100).toFixed(2)]
  ].map(function (o) {
    return '<div class="out"><span>' + o[0] + '</span><b>' + o[1] + '</b><span class="tag tag--user">Yours</span><small>' + o[2] + "</small></div>";
  }).join("");
  /* chart */
  var W = 900, H = 340, L = 74, R = 850, T = 22, B = 272;
  var hiv = 0; rows.forEach(function (r) { hiv = Math.max(hiv, r.b, r.cov); }); hiv = hiv || 1;
  var step = Math.pow(10, Math.floor(Math.log10(hiv))) / 2; hiv = Math.ceil(hiv / step) * step;
  var X = function (k) { return L + (R - L) * k / 10; }, Y = function (v) { return B - (B - T) * v / hiv; };
  var s = [];
  for (var i = 0; i <= 4; i++) { var v = hiv * i / 4; s.push('<line x1="' + L + '" y1="' + Y(v).toFixed(1) + '" x2="' + R + '" y2="' + Y(v).toFixed(1) + '" stroke="#e4ddcf"/>' + txt(L - 9, Y(v) + 4, (v >= 1e6 ? (v / 1e6).toFixed(1) + " M" : v >= 1e3 ? Math.round(v / 1e3) + " k" : String(Math.round(v))), { anchor: "end" })); }
  for (var k = 0; k <= 10; k += 2) s.push(txt(X(k), B + 18, fy(k).replace("FY", "").replace("-", "–"), { anchor: "middle", size: 10.5 }));
  var band = rows.map(function (r) { return [X(r.k), Y(r.cov)]; }).concat(rows.slice().reverse().map(function (r) { return [X(r.k), Y(r.b)]; }));
  s.push('<path d="M' + band.map(function (q) { return q[0].toFixed(1) + " " + q[1].toFixed(1); }).join(" L") + ' Z" fill="' + PAL.cov + '" opacity=".10"/>');
  s.push(poly(rows.map(function (r) { return [X(r.k), Y(r.cov)]; }), PAL.cov, 2.2));
  if (floorK !== null) s.push(poly(rows.map(function (r) { return [X(r.k), Y(r.braw)]; }), "#9A958C", 1.6, "4 4"));
  s.push(poly(rows.map(function (r) { return [X(r.k), Y(r.b)]; }), PAL.base, 2.6));
  $("chart-sb").innerHTML = svgEl(W, H, s.join(""));
  $("legend-sb").innerHTML = legend([["Covered emissions", PAL.cov], ["Baseline", PAL.base]].concat(floorK !== null ? [["Baseline without the floor", "#9A958C", 1]] : []));
  $("how-sb").innerHTML =
    "<p><b>Method.</b> The FY2024-25 baseline is divided by 0.902 to recover the production × intensity term. That term is multiplied by each year's ERC, which falls by 0.049 per year to FY2029-30 and then by the selected post-2030 rate, and by the production path. A baseline below 100,000 t is set at 100,000 t under Rule s 10(1); credits are measured against the baseline before that adjustment, as in Rule s 57.</p>" +
    "<p><b>The trade-exposed option</b> models a three-year determination beginning in FY2025-26 at the selected rate, after which the default path applies. This is the form of the determinations the Regulator has issued. It is not an assessment of eligibility, which depends on trade-exposure and earnings tests that are outside the scope of this page.</p>" +
    "<p><b>Break-even abatement</b> is the compounding annual reduction at which FY2034-35 covered emissions equal that year's baseline. It does not consider cost, and it treats abatement as reducing covered emissions one-for-one. That is appropriate for fuel switching and not for measures that change the production variable.</p>" +
    "<p>Nothing entered in this section is stored or transmitted. Reloading the page clears it.</p>";
}

/* ---------- 11. wire it up ------------------------------------------- */
function redraw() {
  renderSettingsStrip();
  renderHeadlines();
  renderSensitivity();
  syncControls();
  renderPath();
  renderLab();
  buildRows();
  renderTable();
  renderMap();
  renderSandbox();
  toHash();
}
function isRef() { return Object.keys(REF).every(function (k) { return JSON.stringify(S[k]) === JSON.stringify(REF[k]); }); }
/* one-line summary of the settings in force, shown on every section page */
function renderSettingsStrip() {
  var el = document.getElementById("settings-strip"); if (!el) return;
  var teba = (TEBA_MODES.filter(function (m) { return m[0] === S.teba; })[0] || ["", S.teba])[1];
  var pf = (PF_MODES.filter(function (m) { return m[0] === S.pf; })[0] || ["", S.pf])[1];
  var clos = (CLOS_MODES.filter(function (m) { return m[0] === S.clos; })[0] || ["", S.clos])[1];
  el.innerHTML = '<span class="ss-lab">Settings in force</span>' +
    '<span>' + (isRef() ? "Current policy on the starting-point assumptions" :
      Math.round(S.target * 100) + "% target · " + (S.d * 100).toFixed(2) + " pp/yr · " + esc(teba) + " · " + esc(pf) + " · " + esc(clos) +
      (S.pipe ? " · new entrants" : " · no new entrants") + (S.abate ? " · abatement " + (S.abate * 100).toFixed(1) + "%/yr" : "")) + "</span>" +
    '<a href="' + ROOT + 'safeguard/policy.html">Change the settings &rarr;</a>';
}
function init() {
  if ((location.hash || "").indexOf("#s:") === 0) fromHash(); else loadS();
  var states = {};
  F.forEach(function (f) { if (f.s) states[f.s] = 1; });
  $("fstate").innerHTML = '<option value="">All states</option>' +
    Object.keys(states).sort().map(function (s) { return '<option value="' + s + '">' + s + "</option>"; }).join("");
  renderKPIs();
  renderSources();
  renderChurn();
  renderScorecard();
  buildControls();
  $("map-colour").addEventListener("change", renderMap);
  redraw();
  $("fsearch").addEventListener("input", renderTable);
  $("fstate").addEventListener("change", renderTable);
  $("fclass").addEventListener("change", renderTable);
  $("fcsv").addEventListener("click", csv);
  Array.prototype.forEach.call(document.querySelectorAll("#ftable th"), function (th) {
    th.addEventListener("click", function () {
      var k = th.getAttribute("data-k");
      if (k === sortK) sortDir = -sortDir; else { sortK = k; sortDir = (k === "n" || k === "s") ? 1 : -1; }
      renderTable();
    });
  });
  setTimeout(selfCheck, 30);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();