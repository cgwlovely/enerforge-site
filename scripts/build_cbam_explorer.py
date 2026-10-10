#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build cbam-explorer.html — the interactive CBAM charge explorer for Data & tools.

Every figure here is recalculated in the reader's browser from the two published CSVs, which are
the same files the research report cites. Nothing is approximated client-side: the certificate
price is a plain multiplier on the certificates due, so moving it is exact arithmetic, and the
origin and sector views are selections over published rows.

What the tool deliberately does NOT offer, and why:

  Mark-up year (10% in 2026, 20% in 2027, 30% from 2028). The mark-up sits inside a max() against
  the benchmark, so it does not scale: codes below the benchmark can cross it. Recomputing it
  needs the charge rebuilt per CN code, and that recomputation does not yet reproduce the
  published 2026 total (it lands 5% low, on country-name matching in the default-value tables).
  A lever that disagrees with the report it sits beside is worse than no lever.

  The plant layer. Same boundary as everywhere else: identity, matching rules and calibrated
  intensities stay unpublished.

Run:  python3 scripts/build_cbam_explorer.py && python3 scripts/apply_chrome.py
"""
import csv
import json
import pathlib
import sys

SITE = pathlib.Path(__file__).resolve().parents[1]
DATA = SITE / "data"
OUT = SITE / "cbam-explorer.html"
PRICE_BASIS = 80.0          # the price the published charges are stated at
Q1, Q2 = 75.36, 75.28       # official certificate prices, 2026 Q1 and Q2

SECTORS = [("steel", "Steel"), ("aluminium", "Aluminium"), ("cement", "Cement"),
           ("fertiliser", "Fertiliser"), ("hydrogen", "Hydrogen")]


def payload():
    ex = list(csv.DictReader(open(DATA / "cbam-exposure-by-origin.csv")))
    ve = {r["origin_iso2"]: r for r in csv.DictReader(open(DATA / "cbam-verification-by-origin.csv"))}
    f = lambda x: float(x) if x not in ("", None) else 0.0
    rows = []
    for r in ex:
        iso = r["origin_iso2"]
        # certificates in tonnes CO2e, so the page can price them at whatever the reader picks
        # keep three decimals: rounding certificates to whole tonnes drops the smallest
        # origins entirely, and the table is meant to show all 198
        cert = {k: round(f(r[f"charge_{k}_eur"]) / PRICE_BASIS, 3) for k, _ in SECTORS}
        v = ve.get(iso)
        rows.append({
            "iso": iso, "name": r["origin"], "t": round(f(r["goods_in_scope_t"])),
            "val": round(f(r["goods_value_eur"])),
            "see": f(r["trade_weighted_default_intensity_tco2e_per_t"]),
            "cert": cert,
            "ver": ({"t": round(f(v["steel_covered_t"])),
                     "int": f(v["published_country_intensity_7208_tco2e_per_t"]),
                     "certDef": round(f(v["charge_at_default_values_eur"]) / PRICE_BASIS, 3),
                     "certAvg": round(f(v["charge_at_country_average_eur"]) / PRICE_BASIS, 3)}
                    if v else None),
        })
    rows.sort(key=lambda x: -sum(x["cert"].values()))
    return rows


STYLE = """
  <style>
    .xp-wrap { margin-top: 26px; }
    .xp-controls { display: grid; grid-template-columns: minmax(260px,1fr) minmax(220px,1fr) auto;
      gap: 22px 32px; align-items: end; border-top: 2px solid var(--ink);
      border-bottom: 1px solid var(--line); padding: 20px 0; margin-bottom: 4px; }
    .xp-ctl label { display: block; font-family: var(--mono); font-size: 11px; letter-spacing: .1em;
      text-transform: uppercase; color: var(--ink-faint); font-weight: 600; margin-bottom: 8px; }
    .xp-ctl input[type=range] { width: 100%; accent-color: var(--orange-deep); }
    .xp-price { display: flex; align-items: baseline; gap: 10px; }
    .xp-price b { font-family: var(--serif); font-size: 30px; font-variant-numeric: tabular-nums;
      line-height: 1; }
    .xp-price span { font-size: 13px; color: var(--ink-faint); }
    .xp-marks { display: flex; gap: 14px; font-family: var(--mono); font-size: 11px;
      color: var(--ink-faint); margin-top: 7px; }
    .xp-marks button { font: inherit; border: 0; background: none; color: var(--teal-deep);
      cursor: pointer; padding: 0; text-decoration: underline; }
    .xp-ctl select { font: inherit; font-size: 15px; padding: 9px 11px; border: 1px solid var(--ink);
      background: var(--surface); color: var(--ink); width: 100%; border-radius: 0; }
    .xp-reset { font: inherit; font-size: 13px; border: 1px solid var(--line); background: var(--surface);
      color: var(--ink-soft); padding: 9px 14px; cursor: pointer; border-radius: 0; white-space: nowrap; }

    .xp-heads { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0 30px; margin: 26px 0 8px; }
    .xp-heads > div { border-top: 1px solid var(--ink); padding-top: 11px; }
    .xp-heads b { display: block; font-family: var(--serif); font-size: 27px; line-height: 1.05;
      font-variant-numeric: tabular-nums; }
    .xp-heads span { display: block; font-size: 12.5px; color: var(--ink-soft); margin-top: 5px; }

    .xp-tbl { width: 100%; border-collapse: collapse; font-size: 14.5px; margin-top: 20px;
      border-top: 2px solid var(--ink); }
    .xp-tbl th { font-family: var(--mono); font-size: 10.5px; letter-spacing: .09em;
      text-transform: uppercase; color: var(--ink-faint); font-weight: 600; text-align: left;
      padding: 10px 12px 10px 0; border-bottom: 1px solid var(--line); cursor: pointer;
      white-space: nowrap; }
    .xp-tbl th.n { text-align: right; }
    .xp-tbl th[aria-sort]::after { content: " \\2193"; color: var(--orange-deep); }
    .xp-tbl td { padding: 9px 12px 9px 0; border-bottom: 1px solid var(--line-soft); }
    .xp-tbl td.n { text-align: right; font-family: var(--mono); font-variant-numeric: tabular-nums;
      white-space: nowrap; }
    .xp-tbl tbody tr:hover { background: var(--surface-2); }
    .xp-tbl tbody tr.is-sel { background: var(--orange-tint); }
    .xp-tbl td.nm { font-weight: 600; cursor: pointer; }
    .xp-bar { display: inline-block; height: 9px; background: var(--orange-deep); vertical-align: 1px;
      margin-right: 7px; min-width: 1px; }
    .xp-scroll { overflow-x: auto; }
    .xp-note { font-size: 13px; color: var(--ink-faint); max-width: 78ch; margin: 12px 0 0; }

    .xp-detail { border-top: 2px solid var(--ink); margin-top: 34px; padding-top: 18px; }
    .xp-detail h3 { font-family: var(--sans); font-size: 19px; margin: 0 0 4px; }
    .xp-split { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0 26px; margin-top: 16px; }
    .xp-split > div { border-top: 1px solid var(--line); padding-top: 10px; }
    .xp-split b { display: block; font-family: var(--mono); font-size: 17px;
      font-variant-numeric: tabular-nums; }
    .xp-split span { display: block; font-size: 12px; color: var(--ink-faint); margin-top: 3px; }
    .xp-cmp { margin-top: 20px; border-left: 2px solid var(--ink); padding: 2px 0 2px 16px; }
    .xp-cmp p { margin: 0 0 6px; font-size: 14.5px; max-width: 72ch; }
    @media (max-width: 820px) {
      .xp-controls { grid-template-columns: 1fr; gap: 18px; }
      .xp-heads { grid-template-columns: repeat(2, 1fr); gap: 0 20px; }
      .xp-tbl { min-width: 620px; }
    }
  </style>"""


SCRIPT = """
<script>
const ROWS = __ROWS__;
const SECTORS = __SECTORS__;
const BASIS = __BASIS__, Q1 = __Q1__, Q2 = __Q2__;
let price = BASIS, sector = "all", sortKey = "charge", selected = null;

const eur = v => v >= 1e9 ? "\\u20ac" + (v/1e9).toFixed(2) + "bn"
               : v >= 1e6 ? "\\u20ac" + Math.round(v/1e6).toLocaleString("en-GB") + "M"
               : "\\u20ac" + Math.round(v/1e3).toLocaleString("en-GB") + "k";
const mt = t => (t/1e6).toFixed(2) + " Mt";

const certOf = r => sector === "all"
  ? SECTORS.reduce((a, s) => a + (r.cert[s[0]] || 0), 0)
  : (r.cert[sector] || 0);
const tonOf = r => sector === "all" ? r.t : null;     // tonnage is published whole, not by sector
const valOf = r => r.val;

function visible() {
  return ROWS.filter(r => certOf(r) > 0);
}

function render() {
  const rows = visible();
  const totalCert = rows.reduce((a, r) => a + certOf(r), 0);
  const totalVal = rows.reduce((a, r) => a + valOf(r), 0);
  const charge = totalCert * price;

  document.getElementById("h-charge").textContent = eur(charge);
  document.getElementById("h-cert").textContent = (totalCert/1e6).toFixed(1) + " Mt";
  document.getElementById("h-origins").textContent = rows.length;
  document.getElementById("h-share").textContent = totalVal ? (charge/totalVal*100).toFixed(1) + "%" : "\\u2014";
  document.getElementById("priceOut").textContent = "\\u20ac" + price;

  const sorted = rows.slice().sort((a, b) =>
      sortKey === "name" ? a.name.localeCompare(b.name)
    : sortKey === "share" ? (certOf(b)*price/b.val) - (certOf(a)*price/a.val)
    : sortKey === "tonnes" ? b.t - a.t
    : certOf(b) - certOf(a));
  const max = Math.max(...sorted.map(certOf), 1);

  document.getElementById("tbody").innerHTML = sorted.map(r => {
    const c = certOf(r) * price;
    const w = Math.max(1, Math.round(certOf(r) / max * 90));
    return '<tr data-iso="' + r.iso + '"' + (r.iso === selected ? ' class="is-sel"' : '') + '>'
      + '<td class="nm">' + r.name + '</td>'
      + '<td class="n">' + mt(r.t) + '</td>'
      + '<td class="n"><span class="xp-bar" style="width:' + w + 'px"></span>' + eur(c) + '</td>'
      + '<td class="n">' + (r.val ? (c/r.val*100).toFixed(1) + '%' : '\\u2014') + '</td>'
      + '<td class="n">' + (r.see ? r.see.toFixed(2) : '\\u2014') + '</td></tr>';
  }).join("");

  document.querySelectorAll("#tbody tr").forEach(tr =>
    tr.onclick = () => { selected = tr.dataset.iso; render(); detail(); });
  detail();
}

function detail() {
  const box = document.getElementById("detail");
  const r = ROWS.find(x => x.iso === selected);
  if (!r) { box.innerHTML = '<p class="xp-note">Select an origin in the table to see its sector '
    + 'split, and — where a published country intensity exists — what the charge would be on that '
    + 'intensity instead of the EU default.</p>'; return; }
  const parts = SECTORS.filter(s => (r.cert[s[0]] || 0) > 0)
    .map(s => '<div><b>' + eur(r.cert[s[0]] * price) + '</b><span>' + s[1] + '</span></div>').join("");
  let cmp = '';
  if (r.ver) {
    const d = r.ver.certDef * price, a = r.ver.certAvg * price, red = Math.max(0, d - a);
    const pct = d > 0 ? (red / d * 100) : 0;
    cmp = '<div class="xp-cmp"><p><b>Steel, against the published country average.</b> '
      + 'On ' + mt(r.ver.t) + ' of steel with a published intensity of ' + r.ver.int.toFixed(2)
      + ' t CO\\u2082e per tonne, the charge falls from ' + eur(d) + ' at default values to '
      + eur(a) + ' \\u2014 a modelled reduction of ' + eur(red) + ', ' + pct.toFixed(0) + '%.</p>'
      + '<p class="xp-note">A country average, not verified data for any consignment. Where it is '
      + 'close to or above the default, better reporting alone will not reduce the charge.</p></div>';
  } else {
    cmp = '<p class="xp-note">No published country-level steel intensity for this origin, so the '
      + 'default-value charge is the only figure that can be put against it here.</p>';
  }
  box.innerHTML = '<h3>' + r.name + '</h3>'
    + '<p class="xp-note">' + mt(r.t) + ' of goods in scope, worth ' + eur(r.val)
    + '. Trade-weighted default intensity ' + (r.see ? r.see.toFixed(2) + ' t CO\\u2082e per tonne' : 'n/a') + '.</p>'
    + '<div class="xp-split">' + parts + '</div>' + cmp;
}

document.getElementById("price").addEventListener("input", e => { price = +e.target.value; render(); });
document.querySelectorAll("[data-price]").forEach(b => b.onclick = () => {
  price = +b.dataset.price; document.getElementById("price").value = price; render(); });
document.getElementById("sector").addEventListener("change", e => { sector = e.target.value; render(); });
document.querySelectorAll(".xp-tbl th[data-sort]").forEach(th => th.onclick = () => {
  sortKey = th.dataset.sort;
  document.querySelectorAll(".xp-tbl th").forEach(x => x.removeAttribute("aria-sort"));
  th.setAttribute("aria-sort", "descending"); render(); });
document.getElementById("reset").onclick = () => {
  price = BASIS; sector = "all"; sortKey = "charge"; selected = null;
  document.getElementById("price").value = BASIS;
  document.getElementById("sector").value = "all";
  document.querySelectorAll(".xp-tbl th").forEach(x => x.removeAttribute("aria-sort"));
  render(); };
render();
</script>"""


def main():
    if not (DATA / "cbam-exposure-by-origin.csv").exists():
        sys.exit("run scripts/build_cbam_data.py first")
    rows = payload()
    body_sectors = "".join(f'<option value="{k}">{lab}</option>' for k, lab in SECTORS)
    script = (SCRIPT.replace("__ROWS__", json.dumps(rows, ensure_ascii=False, separators=(",", ":")))
                    .replace("__SECTORS__", json.dumps(SECTORS))
                    .replace("__BASIS__", str(int(PRICE_BASIS)))
                    .replace("__Q1__", str(Q1)).replace("__Q2__", str(Q2)))

    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CBAM charge explorer &mdash; what the EU carbon border tariff costs by origin | Heliovulcan</title>
  <meta name="description" content="Move the certificate price and see what CBAM charges each origin country at EU default values, by sector, on 2025 trade and 2026 rules. Recalculated in the browser from published data." />
  <meta name="keywords" content="CBAM calculator, carbon border adjustment charge by country, CBAM certificate price, EU default emissions values" />
  <link rel="stylesheet" href="/style.css?v=20260927a" />
  <link rel="icon" href="/favicon.png" type="image/png" sizes="240x240" />
  <link rel="canonical" href="https://heliovulcan.com.au/cbam-explorer.html" />
  <meta property="og:site_name" content="Heliovulcan" />
  <meta property="og:title" content="CBAM charge explorer" />
  <meta property="og:image" content="https://heliovulcan.com.au/assets/bess.jpg" />
  <meta name="twitter:card" content="summary_large_image" />{STYLE}
</head>
<body>
  <header class="nav" id="site-nav"></header>
  <main>
    <article>
      <div class="container">
        <section class="res-hero res-hero--plain">
          <div class="res-hero__inner">
            <p class="eyebrow">Interactive tool</p>
            <h1>What CBAM charges, by origin and by certificate price</h1>
            <p class="res-hero__meta">
              <span class="tag">Interactive tool</span>
              <span class="sep" aria-hidden="true"></span>
              <span>2025 trade, 2026 rules</span>
              <span class="sep" aria-hidden="true"></span>
              <span>198 origins</span>
              <span class="sep" aria-hidden="true"></span>
              <span>Recalculated in your browser</span>
            </p>
          </div>
        </section>

        <div class="res-layout">
          <aside class="res-rail">
            <div class="res-rail__inner">
              <a href="/safeguard-atlas.html">&larr; Tools &amp; data</a>
              <a href="/research/cbam-verification-gap.html">The findings</a>
              <a href="/methods/cbam/">Method &amp; sources</a>
              <a href="/api/">Download the data</a>
              <a href="/about.html#contact">Discuss a question</a>
            </div>
          </aside>

          <div class="res-main">
            <p class="standfirst">CBAM charges an importer for the emissions embedded in a good,
            less the free allocation an equivalent EU producer would receive. Where no verified
            emissions data is supplied, an EU country default value is used instead. This is what
            that costs, origin by origin, at a certificate price you choose.</p>

            <div class="xp-wrap">
              <div class="xp-controls">
                <div class="xp-ctl">
                  <label for="price">Certificate price</label>
                  <div class="xp-price"><b id="priceOut">&euro;{int(PRICE_BASIS)}</b>
                    <span>per tonne CO&#8322;e</span></div>
                  <input type="range" id="price" min="20" max="200" step="1" value="{int(PRICE_BASIS)}"
                         aria-label="Certificate price in euro per tonne" />
                  <div class="xp-marks">
                    <button type="button" data-price="{Q1:.0f}">2026 Q1 &euro;{Q1}</button>
                    <button type="button" data-price="{Q2:.0f}">Q2 &euro;{Q2}</button>
                    <button type="button" data-price="{int(PRICE_BASIS)}">report basis &euro;{int(PRICE_BASIS)}</button>
                  </div>
                </div>
                <div class="xp-ctl">
                  <label for="sector">Sector</label>
                  <select id="sector"><option value="all">All CBAM goods</option>{body_sectors}</select>
                </div>
                <div class="xp-ctl"><button type="button" class="xp-reset" id="reset">Reset</button></div>
              </div>

              <div class="xp-heads">
                <div><b id="h-charge">&mdash;</b><span>Modelled charge at default values</span></div>
                <div><b id="h-cert">&mdash;</b><span>Certificates due</span></div>
                <div><b id="h-share">&mdash;</b><span>Share of the value of those goods</span></div>
                <div><b id="h-origins">&mdash;</b><span>Origin countries</span></div>
              </div>

              <div class="xp-scroll">
                <table class="xp-tbl">
                  <thead><tr>
                    <th data-sort="name">Origin</th>
                    <th class="n" data-sort="tonnes">Goods in scope</th>
                    <th class="n" data-sort="charge" aria-sort="descending">Modelled charge</th>
                    <th class="n" data-sort="share">Share of value</th>
                    <th class="n">Default intensity</th>
                  </tr></thead>
                  <tbody id="tbody"></tbody>
                </table>
              </div>
              <p class="xp-note">Goods in scope is the whole CBAM basket for that origin and does not
              change with the sector filter; the charge and its share do. Default intensity is the
              trade-weighted EU default for that origin, in tonnes CO&#8322;e per tonne of goods.</p>

              <div class="xp-detail" id="detail"></div>
            </div>

            <h2 style="margin-top:56px">What this is, and what it is not</h2>
            <p>Every figure is recalculated in your browser from
            <a href="/data/cbam-exposure-by-origin.csv" download>cbam-exposure-by-origin.csv</a> and
            <a href="/data/cbam-verification-by-origin.csv" download>cbam-verification-by-origin.csv</a>,
            the same files behind <a href="/research/cbam-verification-gap.html">the research
            report</a>. The certificate price is a plain multiplier on the certificates due, so
            moving it is exact.</p>
            <ul>
              <li><b>A default-value scenario, not a forecast.</b> It shows what is charged if no
              verified emissions data is supplied. What is actually collected depends on how much
              verified data importers obtain.</li>
              <li><b>The mark-up year is not a control here.</b> The mark-up rises from 10% in 2026
              to 30% from 2028, but it sits inside a comparison against the benchmark rather than
              scaling the answer, so it cannot be moved client-side without rebuilding the charge
              per customs code. Until that recomputation reproduces the published 2026 total
              exactly, it is left out rather than shown as an approximation.</li>
              <li><b>Country averages are not verified data.</b> The comparison shown for some
              origins uses a published country-level intensity. It estimates where better data
              would matter; it cannot determine the charge for an individual consignment.</li>
              <li><b>Carbon prices paid in the country of origin are not deducted.</b> Any
              recognised carbon price would reduce the certificates ultimately due.</li>
              <li><b>Indonesia should be read with care.</b> Its default value corresponds to
              ferro-nickel and is not comparable with the other origins.</li>
              <li><b>Indicative desktop analysis of public information, not advice.</b></li>
            </ul>
            <p class="xp-note">Trade year 2025, 2026 rules, CBAM factor 0.975. The official
            certificate price was &euro;{Q1} in the first quarter of 2026 and &euro;{Q2} in the
            second; the report states its figures at &euro;{int(PRICE_BASIS)}. Sources and licences:
            <a href="/data/cbam-sources.csv" download>cbam-sources.csv</a>. Method:
            <a href="/methods/cbam/">the CBAM methodology note</a>.</p>
          </div>
        </div>
      </div>
    </article>
  </main>
  <footer class="footer"></footer>
{script}
</body>
</html>
"""
    OUT.write_text(page, encoding="utf-8")
    print(f"wrote {OUT.name}  ({len(page)//1024} KB, {len(rows)} origins)")
    print("  next: python3 scripts/apply_chrome.py")


if __name__ == "__main__":
    main()
