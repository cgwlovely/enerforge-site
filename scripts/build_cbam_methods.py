#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build methods/cbam/index.html — the CBAM method and sources page.

The source table is generated from the licence register, so the page cannot drift from it:
    safeguard_public_model/data/reference/cbam_source_licence_register.csv

Two gates run before the file is written:
  1. every source listed on the page must be classed 'derive' or 'cite' in the register;
  2. no source classed 'internal' may be named anywhere in the page body.
'internal' means the publisher's terms do not permit republication, or the material is used
only inside the identity layer. Failing either gate aborts the build (owner decision, 2026-10-04).

Run:  python3 scripts/build_cbam_methods.py && python3 scripts/apply_chrome.py
"""
import csv
import html
import pathlib
import sys

SITE = pathlib.Path(__file__).resolve().parents[1]
REGISTER = SITE.parents[1] / "safeguard_public_model/data/reference/cbam_source_licence_register.csv"
OUT = SITE / "methods/cbam/index.html"
UPDATED = "4 October 2026"
e = html.escape


def load_register():
    rows = list(csv.DictReader(open(REGISTER, encoding="utf-8")))
    if not rows:
        sys.exit("licence register is empty")
    return rows


def source_table(rows):
    pub = [r for r in rows if r["publish_class"] in ("derive", "cite")]
    out = ['<table class="src-tbl">',
           "<thead><tr><th>Source</th><th>Publisher</th><th>Licence</th><th>What it is used for</th></tr></thead>",
           "<tbody>"]
    for r in sorted(pub, key=lambda x: (x["publish_class"] != "derive", x["source_name"])):
        tag = "" if r["publish_class"] == "derive" else ' <span class="cls">cited, not reproduced</span>'
        out.append("<tr><td>{}{}</td><td>{}</td><td>{}</td><td>{}</td></tr>".format(
            e(r["source_name"]), tag, e(r["publisher"]), e(r["licence"]), e(r["used_for"])))
    out.append("</tbody></table>")
    return "\n".join(out), pub


STYLE = """
  <style>
    .src-tbl { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 18px;
      border-top: 2px solid var(--ink); }
    .src-tbl th { text-align: left; font-family: var(--sans); font-size: 11.5px; letter-spacing: .1em;
      font-weight: 600; text-transform: uppercase; color: var(--ink-soft); padding: 12px 12px 12px 0;
      border-bottom: 1px solid var(--line); }
    .src-tbl td { padding: 12px 12px 12px 0; border-bottom: 1px solid var(--line-soft); vertical-align: top; }
    .src-tbl td:first-child { font-weight: 600; }
    .src-tbl .cls { display: block; font-weight: 400; font-size: 11.5px; letter-spacing: .08em;
      text-transform: uppercase; color: var(--amber); margin-top: 3px; }
    .check { border-top: 1px solid var(--ink); padding: 18px 0 2px; }
    .check h3 { font-size: 17px; margin: 0 0 6px; }
    .check p { max-width: 72ch; }
    .check .res { font-family: var(--sans); font-size: 12px; letter-spacing: .1em; text-transform: uppercase;
      font-weight: 600; color: var(--teal-deep); }
    .tiers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 40px; margin-top: 8px; }
    .tiers > div { border-top: 1px solid var(--ink); padding-top: 14px; }
    .tiers h3 { font-size: 16px; margin: 0 0 8px; }
    .tiers li { font-size: 15px; line-height: 1.55; margin-bottom: 7px; }
    .tiers ul { padding-left: 18px; margin: 0; }
    .corr { border-left: 2px solid var(--ink); padding: 2px 0 2px 18px; margin: 18px 0; }
    .corr .d { font-family: var(--sans); font-size: 12px; letter-spacing: .1em; text-transform: uppercase;
      font-weight: 600; color: var(--ink-soft); }
    @media (max-width: 860px) { .tiers { grid-template-columns: 1fr; gap: 0; } }
    @media (max-width: 640px) { .src-tbl { display: block; overflow-x: auto; min-width: 0; } }
  </style>"""


def build():
    rows = load_register()
    table, pub = source_table(rows)
    internal = [r for r in rows if r["publish_class"] == "internal"]
    n_derive = sum(1 for r in rows if r["publish_class"] == "derive")
    n_cite = sum(1 for r in rows if r["publish_class"] == "cite")

    body = f"""<main>
    <article>
      <div class="container">
        <header class="article">
          <p class="article__meta">
            <span>Methodology</span>
            <span class="dot" aria-hidden="true"></span>
            <span>EU CBAM exposure</span>
            <span class="dot" aria-hidden="true"></span>
            <span>v1.0 &middot; updated {UPDATED}</span>
          </p>
          <h1>Every CBAM figure traces to a named public source, and the checks below can be rerun</h1>
          <p class="case-hero__sub">Method, sources, licences and the limits of what is published.</p>
          <p class="standfirst">
            This page accompanies Heliovulcan&rsquo;s facility-level analysis of the EU Carbon Border
            Adjustment Mechanism. It sets out where every input comes from, four checks that can be
            rerun from public data, and &mdash; because this matters as much as the method &mdash;
            which parts of the work are deliberately not published and why.
          </p>
          <nav class="report-toc" aria-label="Methodology sections">
            <a href="#checks">Four checks</a>
            <a href="#calculation">The calculation</a>
            <a href="#sources">Sources and licences</a>
            <a href="#withheld">What is withheld</a>
            <a href="#corrections">Corrections</a>
            <a href="#boundaries">What this is not</a>
          </nav>
        </header>

        <section class="prose">
          <h2 id="checks">Four checks that can be rerun from public data</h2>
          <p>
            A method description is a claim about how work was done. A check is something a reader can
            repeat. These four use only the sources listed further down, and each one has a result that
            is either right or visibly wrong.
          </p>

          <div class="check">
            <h3>1. The trade flows close against Eurostat&rsquo;s own total</h3>
            <p>
              Import volumes are assembled country by country and product by product. Summing the
              non-EU origin countries, plus Norway, Iceland and Switzerland, must reproduce the
              extra-EU total that Eurostat publishes separately.
            </p>
            <p class="res">Residual 0.000000% across six sector-period aggregates</p>
          </div>

          <div class="check">
            <h3>2. The per-tonne charges match an independent commercial estimate</h3>
            <p>
              For the first quarter of 2026 a trade-price reporting agency published the default-value
              charge per tonne for several steel and aluminium products by origin country, using the
              official certificate price of &euro;75.36. The same formula applied to our own parameter
              set reproduces all nine of those figures.
            </p>
            <p class="res">9 of 9 within &euro;0.50 per tonne</p>
          </div>

          <div class="check">
            <h3>3. The intensity dataset is internally consistent</h3>
            <p>
              The country-level intensity dataset from the European Commission&rsquo;s Joint Research
              Centre reports direct, indirect and total emissions separately for each country and
              product. Every triple must add up.
            </p>
            <p class="res">2,382 of 2,382 triples consistent, no exceptions</p>
          </div>

          <div class="check">
            <h3>4. The plant-level calibration holds across three regulators</h3>
            <p>
              Plant activity data is scaled to measured emissions using mandatory reporting from
              Australia, the United States and Canada. For integrated blast-furnace steelworks the
              scaling ratio agrees closely across all three, which it need not have done.
            </p>
            <p class="res">Australia 0.99 (2 plants) &middot; United States 0.98 (7) &middot; Canada 0.96 (1)</p>
            <p>
              Two caveats are worth stating plainly. The sample is small: two plants in Australia and one
              in Canada. And the Port Kembla value sometimes quoted as a verification point is one of
              the two Australian plants, so it is a consistency check rather than an independent test.
              The United States ratio, drawn from seven plants reporting to a different regulator under
              different rules, is the stronger evidence, and it is the agreement between regulators
              rather than any single number that carries the weight.
            </p>
          </div>

          <h2 id="calculation">The calculation, in five steps</h2>
          <p>
            CBAM charges an importer for the emissions embedded in a good, less a free allocation set by
            an EU benchmark. The exposure estimate follows that structure.
          </p>
          <ol class="prose-list">
            <li>
              <b>Fix the legal parameters.</b> Product scope, country default values, free-allocation
              benchmarks, the transitional factor, the sector mark-up and the certificate price all come
              from the Regulation and its implementing acts. Nothing here is estimated.
            </li>
            <li>
              <b>Measure the flow.</b> Tonnes and values of goods in scope, by origin country and product
              code, from the EU&rsquo;s own trade database.
            </li>
            <li>
              <b>Build the default-value bill.</b> What an importer pays if no verified emissions data is
              supplied. This is an upper bound by construction: the default values carry a deliberate
              mark-up, and the regulation is designed so that using them is never the cheaper option.
            </li>
            <li>
              <b>Build a comparison path.</b> Where measured or officially published intensity exists, the
              same calculation is run against it. Country-level intensity comes from the Joint Research
              Centre; plant-level measurement exists only where a regulator publishes it.
            </li>
            <li>
              <b>Take the difference.</b> The gap between the two paths is what accurate, verified emissions
              data is worth to that exporter. Where the gap is near zero, verification will not reduce the
              bill and the exporter&rsquo;s only options are to abate or to sell elsewhere. This is a measure
              of the gap between two published parameter sets, not a saving that any particular importer
              will realise; what an individual consignment pays depends on its own verified data.
            </li>
          </ol>

          <h2 id="sources">Sources and licences</h2>
          <p>
            {n_derive} sources are published under terms that permit derived analysis with attribution.
            A further {n_cite} are named but their data is not reproduced here, either because the
            publisher&rsquo;s terms do not permit it or because the terms could not be verified. Where a
            source is marked as cited only, the figures on this site are our own, and the source is named
            so that a reader can go and check it.
          </p>
          {table}
          <p class="cap">
            Derived from Clean Energy Regulator material licensed under a Creative Commons Attribution 4.0
            licence. No regulator, agency or data publisher named on this page has reviewed, approved or
            endorsed this analysis, and nothing here should be read as their view.
            Contains information from Eurostat and from EU legal texts, reused under
            Decision 2011/833/EU. Contains public sector information licensed under the Open Government
            Licence v3.0. Climate TRACE and Global Energy Monitor data under CC BY 4.0. Changes have been
            made to all of the above.
          </p>

          <h2 id="withheld">What is published and what is withheld</h2>
          <p>
            The sources are public and the law is public. What is not public is the work of joining them:
            deciding that a particular plant in one database is the same plant in another, and converting
            generic activity data into a defensible emissions estimate. That join is the analysis, and it
            is not published. The table below is the whole of the boundary.
          </p>
          <div class="tiers">
            <div>
              <h3>Published in full</h3>
              <ul>
                <li>The legal parameters and their citations</li>
                <li>Every source, with publisher, licence and use</li>
                <li>The calculation structure, step by step</li>
                <li>The four checks and their results</li>
                <li>Corrections, dated, including those that move headline figures</li>
                <li>The boundaries below</li>
              </ul>
            </div>
            <div>
              <h3>Result shown, method not</h3>
              <ul>
                <li>Plant-level estimated intensities, each carrying a label saying whether it is measured, calculated or estimated</li>
                <li>Country comparison values</li>
                <li>The scaling ratios in check 4 are quoted to two decimal places as evidence; the underlying coefficients by production route are not published</li>
              </ul>
            </div>
            <div>
              <h3>Not published</h3>
              <ul>
                <li>The cross-source plant identity table linking the asset registers to each other and to regulatory records</li>
                <li>The matching rules, thresholds and match scores behind it</li>
                <li>Benchmark assignment where the regulation leaves a product without a direct match</li>
                <li>{len(internal)} sources whose terms do not permit republication, or which are used only inside the identity layer</li>
              </ul>
            </div>
          </div>
          <p>
            The last of those is enforced rather than promised: the page you are reading is generated by a
            script that refuses to build if a restricted source is named anywhere in it.
          </p>

          <h2 id="corrections">Corrections</h2>
          <p>
            Figures that have been published and later changed are listed here with the reason. A method
            that never corrects itself is not being checked.
          </p>
          <div class="corr">
            <p class="d">16 September 2026 &middot; affects a headline figure</p>
            <p>
              The global value of verified emissions data for steel was revised down from approximately
              &euro;8.8&nbsp;billion a year to approximately &euro;3.5&nbsp;billion on comparable volumes.
              The earlier comparison used plant activity data scaled by production route. That scaling is
              sound for sizing a plant, but the underlying factor is a single global constant per route,
              so it carried no information about which country a plant was in. Replacing it with the Joint
              Research Centre&rsquo;s country-level direct intensities changed the answer and changed its
              shape: the opportunity is now concentrated in one country rather than spread across several.
            </p>
            <p>
              Two country figures were withdrawn entirely. For India and Russia the EU default value already
              sits at or above the published measured intensity, so verifying emissions would not lower the
              bill. Those exporters have no verification incentive at all, which is the opposite of what the
              earlier figures implied.
            </p>
          </div>
          <div class="corr">
            <p class="d">5 September 2026</p>
            <p>
              The mark-up applied to fertiliser default values was corrected from 10% to 1%. The implementing
              regulation sets 10%, rising to 20% and then 30%, for cement, iron and steel, aluminium and
              hydrogen, but holds fertilisers at 1% throughout. The step is by year for most sectors and flat
              for one, and the two had been conflated.
            </p>
          </div>

          <h2 id="boundaries">What this is not</h2>
          <ul class="prose-list">
            <li>
              <b>Not a forecast of what importers will pay.</b> The default-value bill is an upper bound. The
              actual bill depends on how much verified data each importer obtains, which cannot be observed
              from outside.
            </li>
            <li>
              <b>Not a plant-level measurement outside six jurisdictions.</b> Measured emissions exist where a
              regulator publishes them: Australia, the United States, Canada, Taiwan, Japan and the European
              Union. Everywhere else the plant layer gives identity, production route, scale and a bounded
              estimate, and says so on each record.
            </li>
            <li>
              <b>Not evidence that CBAM has redirected trade.</b> EU imports of goods in scope fell across
              every sector in the first half of 2026, but the largest single movement is Russia, where
              sanctions and separate tariff measures are the more direct explanation. Imports from several
              other origins rose over the same period.
            </li>
            <li>
              <b>Not complete on the United Kingdom.</b> The UK scheme begins in 2027 and its default values
              have not been published. The UK figures here are inferred from the allowance price and the
              statutory rate formula, and will be restated when the values appear.
            </li>
            <li>
              <b>Not advice.</b> Indicative desktop analysis of public information. Any commercial, financing
              or compliance decision needs independent verification.
            </li>
          </ul>
        </section>
      </div>
    </article>
  </main>"""

    # ---- gate: no restricted source may be named in the page body ----
    hay = body.lower()
    for r in internal:
        for needle in (r["source_name"], r["publisher"]):
            n = (needle or "").strip().lower()
            if len(n) > 6 and n in hay:
                sys.exit(f"ABORT: restricted source named in page body: {r['source_id']} ({needle})")
    for r in rows:
        if r["publish_class"] not in ("derive", "cite", "internal"):
            sys.exit(f"ABORT: unknown publish_class for {r['source_id']}")

    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CBAM exposure methodology &mdash; sources, checks and limits | Heliovulcan</title>
  <meta name="description" content="How Heliovulcan builds facility-level EU CBAM exposure estimates: the legal parameters, the trade and emissions sources with their licences, four checks that can be rerun from public data, what is deliberately not published, and dated corrections." />
  <meta name="keywords" content="CBAM methodology, carbon border adjustment mechanism sources, embedded emissions default values, facility-level CBAM exposure, verified emissions data value" />
  <link rel="stylesheet" href="/style.css?v=20260927a" />
  <link rel="icon" href="/favicon.png" type="image/png" sizes="240x240" />
  <link rel="canonical" href="https://heliovulcan.com.au/methods/cbam/" />
  <meta property="og:site_name" content="Heliovulcan" />
  <meta property="og:title" content="Every CBAM figure traces to a named public source, and the checks below can be rerun" />
  <meta property="og:image" content="https://heliovulcan.com.au/assets/bess.jpg" />
  <meta name="twitter:card" content="summary_large_image" />{STYLE}
</head>
<body>
  <header class="nav" id="site-nav"></header>
{body}
  <footer class="footer"></footer>
</body>
</html>
"""
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(page, encoding="utf-8")
    print(f"wrote {OUT.relative_to(SITE)}  ({len(page):,} bytes)")
    print(f"  sources on page: {n_derive} derive + {n_cite} cite   withheld: {len(internal)}")
    print("  gate passed: no restricted source named in body")
    print("  next: python3 scripts/apply_chrome.py")


if __name__ == "__main__":
    build()
