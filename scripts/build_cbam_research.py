#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build research/cbam-verification-gap.html — the CBAM findings report, in the site's own article system.

Figures (the comparison chart and the world map) are drawn from the site palette, not from the
standalone artifact's palette. The map's country shading and facility points are inlined from
    safeguard_public_model/outputs/cbam/countries-110m.json
    <scratchpad>/fac_payload.json           (built by the CBAM facility pipeline)

Gate, same rule as the methods page: no source classed 'internal' in the licence register may be
named anywhere in the page body. Failing it aborts the build (owner decision, 2026-10-04).

Run:  python3 scripts/build_cbam_research.py && python3 scripts/apply_chrome.py
"""
import csv
import html
import json
import pathlib
import re
import sys

SITE = pathlib.Path(__file__).resolve().parents[1]
ROOT = SITE.parents[1]
MODEL = ROOT / "safeguard_public_model"
REGISTER = MODEL / "data/reference/cbam_source_licence_register.csv"
WORLD = MODEL / "outputs/cbam/countries-110m.json"
PAYLOAD = pathlib.Path("/private/tmp/claude-502/-Users-hugefafafa1-BESS/"
                       "a3a861b3-9b9a-49eb-9236-bbed38f19b61/scratchpad/fac_payload.json")
OUT = SITE / "research/cbam-verification-gap.html"
DATE = "4 October 2026"

# chart series, validated against the site surface #f6f3ec (dataviz six checks, all pass)
C_OLD, C_NEW = "#0E8F72", "#d9620f"

CHART = [("China", 2013, 1895), ("Türkiye", 1137, 753), ("India", 951, 231), ("Russia", 678, 10),
         ("Ukraine", 327, 196), ("United Kingdom", 273, 164), ("Taiwan", 151, 124), ("South Africa", 134, 62)]

STYLE = """
  <style>
    .cb-tbl { width:100%; border-collapse:collapse; font-size:15px; margin:22px 0 6px;
      border-top:2px solid var(--ink); }
    .cb-tbl caption { caption-side:top; text-align:left; font-family:var(--mono); font-size:11px;
      letter-spacing:.11em; text-transform:uppercase; color:var(--ink-faint); padding-bottom:10px; }
    .cb-tbl th { font-family:var(--mono); font-size:10.5px; letter-spacing:.09em; text-transform:uppercase;
      color:var(--ink-faint); font-weight:600; text-align:left; padding:10px 14px 10px 0;
      border-bottom:1px solid var(--line); }
    .cb-tbl td { padding:10px 14px 10px 0; border-bottom:1px solid var(--line-soft); vertical-align:baseline; }
    .cb-tbl th.n, .cb-tbl td.n { text-align:right; font-family:var(--mono);
      font-variant-numeric:tabular-nums; white-space:nowrap; }
    .cb-tbl tr.tot td { border-top:1px solid var(--ink); border-bottom:none; font-weight:700; }
    .cb-tbl td.nm { font-weight:600; }
    .cb-scroll { overflow-x:auto; }
    .cb-note { font-size:13.5px; color:var(--ink-faint); max-width:76ch; margin:10px 0 0; }
    .cb-flag { font-family:var(--mono); font-size:10px; letter-spacing:.09em; text-transform:uppercase;
      font-weight:600; color:var(--amber); display:block; margin-bottom:2px; }
    .cb-flag--ok { color:var(--teal-deep); }

    .cb-fig { margin:26px 0 8px; position:relative; }
    .cb-fig h4 { font-family:var(--sans); font-size:16px; margin:0 0 10px; }
    .cb-key { display:flex; flex-wrap:wrap; gap:8px 24px; align-items:center; font-family:var(--mono);
      font-size:11px; color:var(--ink-soft); margin-bottom:14px; }
    .cb-key i { display:inline-block; width:20px; height:9px; margin-right:7px; vertical-align:-1px; }
    .cb-key i.d { width:9px; height:9px; border-radius:50%; }
    .cb-key i.d--m { background:var(--ink); box-shadow:0 0 0 2px var(--bg), 0 0 0 3.5px var(--ink); }
    .cb-key i.d--e { background:var(--ink-faint); opacity:.5; width:7px; height:7px; }

    .cb-rows { display:grid; gap:13px; }
    .cb-row { display:grid; grid-template-columns:118px 1fr; gap:16px; align-items:center; }
    .cb-row .lb { font-size:14px; text-align:right; color:var(--ink); font-weight:600; }
    .cb-bars { display:grid; gap:2px; }
    .cb-bar { display:flex; align-items:center; gap:10px; }
    .cb-bar span.f { height:13px; border-radius:0 4px 4px 0; min-width:2px; display:block; }
    .cb-bar span.v { font-family:var(--mono); font-size:12px; font-variant-numeric:tabular-nums;
      color:var(--ink-soft); white-space:nowrap; }
    .cb-axis { display:flex; justify-content:space-between; font-family:var(--mono); font-size:10.5px;
      color:var(--ink-faint); margin:12px 0 0 134px; padding-top:7px; border-top:1px solid var(--line); }

    #cbmap { width:100%; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
    #cbmap svg { display:block; width:100%; height:auto; }
    .cb-land { stroke:var(--bg); stroke-width:.3; }
    .cb-dot { stroke:var(--bg); stroke-width:.5; }
    .cb-dot--m { stroke:var(--surface); stroke-width:1.1; }
    .cb-tip { position:absolute; pointer-events:none; z-index:6; background:var(--ink); color:var(--surface);
      font-family:var(--mono); font-size:11px; line-height:1.45; padding:7px 10px; max-width:250px; }
    @media (max-width:760px){
      .cb-row { grid-template-columns:86px 1fr; gap:10px; }
      .cb-row .lb { font-size:12.5px; }
      .cb-axis { margin-left:96px; }
      .cb-tbl { min-width:540px; }
    }
  </style>"""


def chart_html():
    mx = 2000
    out = ['<div class="cb-fig">',
           '<h4>Modelled reduction in the annual charge, by origin</h4>',
           '<div class="cb-key">'
           f'<span><i style="background:{C_OLD}"></i>Earlier estimate</span>'
           f'<span><i style="background:{C_NEW}"></i>Revised, on published country intensities</span></div>',
           '<div class="cb-rows">']
    for name, old, now in CHART:
        po, pn = max(0.3, old / mx * 100), max(0.3, now / mx * 100)
        out.append(
            f'<div class="cb-row"><div class="lb">{html.escape(name)}</div><div class="cb-bars">'
            f'<div class="cb-bar" title="{html.escape(name)} &mdash; earlier estimate &euro;{old:,}M">'
            f'<span class="f" style="width:{po:.2f}%;background:{C_OLD}"></span>'
            f'<span class="v">&euro;{old:,}M</span></div>'
            f'<div class="cb-bar" title="{html.escape(name)} &mdash; revised &euro;{now:,}M">'
            f'<span class="f" style="width:{pn:.2f}%;background:{C_NEW}"></span>'
            f'<span class="v">&euro;{now:,}M</span></div>'
            '</div></div>')
    out += ['</div>',
            '<div class="cb-axis"><span>&euro;0</span><span>&euro;1,000M</span><span>&euro;2,000M</span></div>',
            '</div>']
    return "\n".join(out)


BODY = """
          <p class="standfirst">Applying the EU&rsquo;s 2026 CBAM rules to 2025 trade produces a modelled annual
          charge of <b>&euro;14.5&nbsp;billion</b> if every importer relies on default emissions values &mdash; a
          high-end default-value scenario, not a forecast of what will be collected. For the 38.6&nbsp;million tonnes
          of steel covered by published country-level intensity data, replacing EU defaults with those country
          averages reduces the modelled charge by <b>&euro;3.5&nbsp;billion</b>. This estimates the potential value
          of better data; an importer&rsquo;s actual charge would depend on verified emissions for the relevant
          product and facility. The estimated benefit is highly concentrated: China accounts for 54% of it.</p>

          <nav class="res-jump" aria-label="Contents">
            <b>In this report</b>
            <a href="#s-default">1 &middot; The cost of relying on default values</a>
            <a href="#s-reduce">2 &middot; Where better data reduces the charge</a>
            <a href="#s-revised">3 &middot; Why the earlier estimate was revised</a>
            <a href="#s-plants">4 &middot; From country averages to individual plants</a>
            <a href="#s-australia">5 &middot; Australia as a validation case</a>
            <a href="#s-trade">6 &middot; What early 2026 trade data can show</a>
            <a href="#s-checks">7 &middot; How this was checked, and its limits</a>
          </nav>

          <div class="article__body res-body">

          <p>The result varies sharply by country and product. For Russia, country averages reduce an
          &euro;893&nbsp;million modelled steel charge by only &euro;10&nbsp;million. India records a
          &euro;231&nbsp;million net reduction, but that national total hides opposite effects: the country
          average raises the charge on its main flat-steel flows while reducing it on ferro-alloys and
          stainless products.</p>

          <div class="pull"><span class="hl">Where actual emissions are close to or above the EU default, a lower
          charge requires lower production emissions or a different product mix &mdash; not simply better
          documentation.</span></div>

          <h2 id="s-default">The cost of relying on default values</h2>
          <p>CBAM requires importers to surrender certificates for the emissions embedded in imported goods. The
          charge is reduced by the free allocation an equivalent EU producer would receive under the relevant
          benchmark. If verified emissions data is unavailable, the importer must use an EU country default
          value instead.</p>
          <p>Those defaults carry a mark-up &mdash; 10% in 2026, rising to 30% by 2028 for steel, aluminium, cement
          and hydrogen, and a flat 1% for fertilisers. The mark-up is intended to make defaults conservative and
          to encourage verified reporting. It does not guarantee that verified data will reduce the modelled
          charge for every producer, as the Indian flat-product flows below show.</p>
          <p>The table shows the modelled charge if every consignment is assessed using default values. Read it as
          a default-value scenario, not as a forecast of revenue or as a maximum possible charge for every
          producer.</p>

          <div class="cb-scroll">
          <table class="cb-tbl">
            <caption>Modelled charge at default values, 2026 rules applied to 2025 trade</caption>
            <thead><tr><th>Origin</th><th class="n">Goods in scope</th><th class="n">Modelled charge</th>
              <th class="n">Share of goods value</th><th>What drives it</th></tr></thead>
            <tbody>
              <tr><td class="nm">China</td><td class="n">11.34 Mt</td><td class="n">&euro;2,689M</td><td class="n">16%</td><td>Steel, at a default value 1.7&times; the published country intensity</td></tr>
              <tr><td class="nm">T&uuml;rkiye</td><td class="n">14.81 Mt</td><td class="n">&euro;2,024M</td><td class="n">19%</td><td>Largest tonnage of any origin; defaults priced for blast furnaces</td></tr>
              <tr><td class="nm">Indonesia</td><td class="n">3.25 Mt</td><td class="n">&euro;1,950M</td><td class="n">80%</td><td><span class="cb-flag">read with care</span>default corresponds to ferro-nickel, not comparable with the others</td></tr>
              <tr><td class="nm">India</td><td class="n">4.60 Mt</td><td class="n">&euro;1,165M</td><td class="n">21%</td><td>High-intensity coal-based route; default close to the country average</td></tr>
              <tr><td class="nm">Russia</td><td class="n">10.40 Mt</td><td class="n">&euro;1,159M</td><td class="n">24%</td><td>Volume, with sanctions acting on the same flows</td></tr>
              <tr><td class="nm">Egypt</td><td class="n">6.56 Mt</td><td class="n">&euro;647M</td><td class="n">23%</td><td>Fertiliser and steel</td></tr>
              <tr><td class="nm">Ukraine</td><td class="n">11.18 Mt</td><td class="n">&euro;602M</td><td class="n">18%</td><td>Semi-finished steel and iron ore pellets</td></tr>
              <tr><td class="nm">Korea</td><td class="n">3.75 Mt</td><td class="n">&euro;379M</td><td class="n">9%</td><td>Default sits close to the published country intensity</td></tr>
              <tr><td class="nm">Australia</td><td class="n">0.42 Mt</td><td class="n">&euro;63M</td><td class="n">22%</td><td>Almost entirely one steelworks</td></tr>
              <tr class="tot"><td class="nm">All 198 origins</td><td class="n">115.6 Mt</td><td class="n">&euro;14,527M</td><td class="n">15.5%</td><td>Steel &euro;11,314M &middot; cement &euro;1,205M &middot; fertiliser &euro;1,154M &middot; aluminium &euro;742M &middot; hydrogen &euro;111M</td></tr>
            </tbody>
          </table>
          </div>
          <p class="cb-note">Aluminium is small because the Regulation currently counts only direct emissions, and an
          aluminium smelter&rsquo;s emissions are overwhelmingly in the electricity it buys. If indirect emissions
          are ever brought into scope, this is the line that moves most.</p>

          <h2 id="s-reduce">Where better data reduces the modelled charge</h2>
          <p>Run the same calculation against published country-level emissions intensities &mdash; the European
          Commission&rsquo;s own figures, on the same direct-emissions boundary the Regulation uses &mdash; and the
          difference estimates where better data would matter most. These are industry averages for each country,
          not verified figures for any particular consignment.</p>
          <p>National totals can conceal large differences between product groups. India is the clearest example:
          the country average raises the modelled charge on its main flat-steel flows while reducing it on several
          ferro-alloy and stainless-steel codes.</p>

          __CHART__

          <div class="cb-scroll">
          <table class="cb-tbl">
            <caption>Modelled effect of replacing default values with published country intensities</caption>
            <thead><tr><th>Origin</th><th class="n">Default-value charge</th><th class="n">At country average</th>
              <th class="n">Modelled reduction</th><th>Reading</th></tr></thead>
            <tbody>
              <tr><td class="nm">China</td><td class="n">&euro;2,282M</td><td class="n">&euro;387M</td><td class="n">&euro;1,895M</td><td>Default 3.19 against a published country intensity of 1.84 t CO&#8322;e per tonne. The largest single opportunity in the mechanism.</td></tr>
              <tr><td class="nm">T&uuml;rkiye</td><td class="n">&euro;1,163M</td><td class="n">&euro;411M</td><td class="n">&euro;753M</td><td>Defaults assume blast furnaces; roughly seven tenths of Turkish steel is electric arc.</td></tr>
              <tr><td class="nm">India</td><td class="n">&euro;1,147M</td><td class="n">&euro;917M</td><td class="n">&euro;231M</td><td><span class="cb-flag">mixed by product</span>on flat products &mdash; 2.4 Mt of the flow &mdash; the country average of 4.90 exceeds the marked-up default of 4.71, so the modelled charge rises by &euro;38M. The net reduction comes from ferro-alloys and stainless grades, where defaults sit far above the published country values.</td></tr>
              <tr><td class="nm">Russia</td><td class="n">&euro;893M</td><td class="n">&euro;883M</td><td class="n">&euro;10M</td><td><span class="cb-flag">negligible</span>on semi-finished steel, 3.7 Mt and the bulk of the flow, the modelled charge rises by &euro;30M; small reductions elsewhere leave &euro;10M net on an &euro;893M charge.</td></tr>
              <tr><td class="nm">Ukraine</td><td class="n">&euro;471M</td><td class="n">&euro;275M</td><td class="n">&euro;196M</td><td>Moderate reduction on semi-finished products.</td></tr>
              <tr><td class="nm">United Kingdom</td><td class="n">&euro;308M</td><td class="n">&euro;144M</td><td class="n">&euro;164M</td><td>Worth verifying; separately exposed to its own scheme from 2027.</td></tr>
              <tr><td class="nm">Taiwan</td><td class="n">&euro;205M</td><td class="n">&euro;80M</td><td class="n">&euro;124M</td><td><span class="cb-flag cb-flag--ok">plant data published</span>one of six jurisdictions with published facility-level intensity data.</td></tr>
              <tr><td class="nm">South Africa</td><td class="n">&euro;166M</td><td class="n">&euro;103M</td><td class="n">&euro;62M</td><td>A high country intensity limits the reduction.</td></tr>
              <tr><td class="nm">Brazil &middot; Japan &middot; United States</td><td class="n">&euro;197M</td><td class="n">&euro;152M</td><td class="n">&euro;47M</td><td>Defaults already close to the published country values.</td></tr>
              <tr class="tot"><td class="nm">Eleven origins, 38.6 Mt</td><td class="n">&euro;6,831M</td><td class="n">&euro;3,351M</td><td class="n">&euro;3,482M</td><td></td></tr>
            </tbody>
          </table>
          </div>
          <p class="cb-note">A country total can hide opposite effects within it. Across all of India&rsquo;s codes the
          country average reduces the modelled charge by &euro;269M and raises it by &euro;38M, netting &euro;231M &mdash;
          but the &euro;38M falls on the carbon-steel flat products that make up most of the tonnage, while about half
          the reduction comes from two codes, ferro-alloys and stainless bar, where the default sits far above the
          published country value. An exporter&rsquo;s answer depends on what it ships, not on its national average.</p>

          <h2 id="s-revised">Why the earlier estimate was revised</h2>
          <p>An earlier version of this work estimated the value of verified emissions data at about
          &euro;8.8&nbsp;billion for the same group of steel flows. Using published country-level intensities reduces
          that estimate to <b>&euro;3.5&nbsp;billion</b>. What caused the revision matters more than its size.</p>
          <p>The earlier comparison scaled each plant&rsquo;s activity by its production route. The method could
          estimate the scale of a plant, but it could not reliably distinguish emissions performance between
          countries: each production route used the same global emissions factor, so every blast-furnace works on
          earth carried the same number. Most of the apparent country differences simply reflected how much steel
          each country made in electric-arc furnaces.</p>
          <p>Replacing it with published country intensities changed both the total and its shape. Two country
          figures moved far enough to reverse their reading: India fell from &euro;951M to &euro;231M and Russia from
          &euro;678M to &euro;10M. An exporter in either country acting on the earlier figure would have received
          the wrong advice.</p>
          <p>The activity calibration remained sound, and independently so: scaling plant activity to measured
          emissions gives a blast-furnace ratio of 0.99 in Australia, 0.98 in the United States and 0.96 in Canada
          &mdash; three regulators, three sets of rules, one answer. The problem was the use of a single global
          emissions factor for each production route.</p>

          <h2 id="s-plants">From country averages to individual plants</h2>
          <p>Country averages show where better data may matter at a market level, but an importer&rsquo;s actual
          liability depends on the facility that produced the goods. The next question is therefore whether
          individual plants can be identified, and whether anyone has published their emissions.</p>
          <p>We hold 1,830 located plants across steel, aluminium and ammonia. Fifty-two of them carry an intensity
          that a regulator has published. The other 1,778 carry identity, ownership, production route, scale and a
          bounded estimate.</p>

          <div class="pull"><span class="hl">In our current dataset, 96% of the modelled charge comes from origin
          countries for which we hold no regulator-published plant-level intensity.</span></div>

          <p>China contributes 748 plants to the layer with no measured value attached to any of them; India 133,
          Russia 62, T&uuml;rkiye 32. Published plant-level data is concentrated in jurisdictions that account for
          only a small share of the modelled charge &mdash; 1.0% as the layer stands. Merging the three datasets we
          have already obtained but not yet matched to plant identity, from the United States, Canada and Taiwan,
          would take that to 5.3%. The remaining <b>&euro;13.8&nbsp;billion</b> is associated with origins where our
          dataset contains no regulator-published plant-level figure.</p>

          <div class="cb-fig">
            <h4>Where the modelled charge falls, and where plant-level data is published</h4>
            <div class="cb-key">
              <span><i class="sw1"></i><i class="sw2"></i><i class="sw3"></i> Modelled charge by origin, low to high</span>
              <span><i class="d d--m"></i> Plant with a matched regulator-published intensity (52)</span>
              <span><i class="d d--e"></i> Identified plant without a matched published intensity (1,778)</span>
            </div>
            <div id="cbmap" role="img" aria-label="World map. Shaded countries carry the largest modelled CBAM charges; dots are industrial plants. The dots marking plants with a published measured intensity sit almost entirely in Europe, Australia and Japan, away from the most heavily charged origins."></div>
            <div class="cb-tip" id="cbtip" hidden></div>
            <p class="cb-note">Steel, aluminium and ammonia plants with usable coordinates. Dot area is scaled to
            annual activity. Country shading is the modelled charge at default values, from the first table.</p>
          </div>

          <p>The countries associated with the largest modelled CBAM charges are generally not the countries for
          which plant-level regulatory data is available.</p>
          <p>Our current dataset includes regulator-published plant-level emissions from six jurisdictions:
          Australia, the United States, Canada, Taiwan, Japan and the European Union. EU data is included as a
          benchmark and validation source, even though EU production is not itself an imported CBAM origin. For
          three of the largest origins we checked the primary sources directly &mdash; China&rsquo;s provincial
          emitter registers list names and production routes but no emissions, India&rsquo;s crediting scheme covers
          aluminium and not steel, and T&uuml;rkiye&rsquo;s scheme has published no values yet. Elsewhere the absence
          reflects what we have searched for and obtained, not a certainty that nothing exists.</p>

          <div class="cb-scroll">
          <table class="cb-tbl">
            <caption>The largest steel plant behind each major origin</caption>
            <thead><tr><th>Origin</th><th>Plant</th><th>Operator</th><th>Route</th><th class="n">Activity</th><th>Published intensity</th></tr></thead>
            <tbody>
              <tr><td class="nm">China</td><td>Angang Steel</td><td>Angang Steel Co</td><td>BF/BOF</td><td class="n">19.6 Mt</td><td class="cb-flag">none published</td></tr>
              <tr><td class="nm">Korea</td><td>POSCO Gwangyang</td><td>POSCO Holdings</td><td>BF/BOF</td><td class="n">20.2 Mt</td><td class="cb-flag">none published</td></tr>
              <tr><td class="nm">Russia</td><td>NLMK Lipetsk</td><td>Novolipetsk Steel</td><td>BF/BOF</td><td class="n">12.1 Mt</td><td class="cb-flag">none published</td></tr>
              <tr><td class="nm">India</td><td>Hazira</td><td>ArcelorMittal Nippon Steel</td><td>BF/BOF &middot; DRI &middot; EAF</td><td class="n">8.5 Mt</td><td class="cb-flag">none published</td></tr>
              <tr><td class="nm">Taiwan</td><td>China Steel Xiaogang</td><td>China Steel Corp</td><td>BF/BOF</td><td class="n">7.6 Mt</td><td class="cb-flag">obtained, not yet matched</td></tr>
              <tr><td class="nm">Brazil</td><td>Tubar&atilde;o</td><td>ArcelorMittal Tubar&atilde;o</td><td>BF/BOF</td><td class="n">5.6 Mt</td><td class="cb-flag">none published</td></tr>
              <tr><td class="nm">T&uuml;rkiye</td><td>&#304;sdemir Payas</td><td>&#304;skenderun Demir ve &Ccedil;elik</td><td>BF/BOF</td><td class="n">5.1 Mt</td><td class="cb-flag">none published</td></tr>
              <tr><td class="nm">Ukraine</td><td>Kryvyi Rih</td><td>ArcelorMittal Kryvyi Rih</td><td>BF/BOF</td><td class="n">2.2 Mt</td><td class="cb-flag">none published</td></tr>
              <tr><td class="nm">United Kingdom</td><td>Scunthorpe</td><td>British Steel</td><td>BF/BOF</td><td class="n">1.9 Mt</td><td class="cb-flag">none published</td></tr>
              <tr><td class="nm">Japan</td><td>Fukuyama</td><td>JFE Steel</td><td>BF/BOF &middot; DRI</td><td class="n">8.3 Mt</td><td class="cb-flag cb-flag--ok">1.861 t CO&#8322;e/t</td></tr>
              <tr><td class="nm">Australia</td><td>Port Kembla</td><td>BlueScope Steel</td><td>BF/BOF</td><td class="n">2.6 Mt</td><td class="cb-flag cb-flag--ok">1.907 t CO&#8322;e/t</td></tr>
            </tbody>
          </table>
          </div>
          <p class="cb-note">Activity is the annual throughput modelled for 2024. &ldquo;None published&rdquo; means our
          dataset holds no regulator-published plant-level figure for that jurisdiction; it does not mean the plant
          is unmeasured internally. Taiwan and the United States publish facility emissions that we hold but have
          not yet matched to plant identity.</p>

          <h2 id="s-australia">Australia as a validation case</h2>
          <p>Australia accounts for only a small share of the modelled CBAM charge, but it provides one of the
          strongest checks on the plant-level method. Its entire modelled charge is <b>&euro;63&nbsp;million</b>, 22%
          of the value of the goods it sends, and almost all of it rests on one steelworks at Port Kembla.</p>
          <p>What Australia provides is the only place where the whole chain can be checked end to end, because the
          Safeguard Mechanism publishes measured facility emissions and the regulator also publishes a determined
          intensity per product. The modelled intensity for Port Kembla comes out at 1.918 tonnes CO&#8322;e per tonne
          of steel. The regulator&rsquo;s determined value is <b>1.907</b>.</p>
          <p>That agreement is a consistency check rather than an independent test &mdash; Port Kembla is one of the
          two Australian plants the calibration was built on, and it should not be presented as independent
          validation. The independent evidence is the United States, where seven plants reporting to a different
          regulator under different rules give the same ratio.</p>

          <h2 id="s-trade">What early 2026 trade data can &mdash; and cannot &mdash; show</h2>
          <p>Early 2026 trade data shows what changed after the definitive period began. It cannot by itself show
          that CBAM caused those changes.</p>
          <p>Compared with the first half of 2025, import volumes in the first half of 2026 fell across every CBAM
          sector in this analysis, measured by weight on goods originating outside the EU and the EEA: fertilisers
          by 56%, cement by 21%, aluminium by 14% and steel by 8%.</p>
          <p>The largest single movement by far is Russia &mdash; steel down 46%, aluminium down 80%, fertilisers down
          82%, a single origin accounting for 2.7 million tonnes of the fertiliser fall on its own. Sanctions and
          separate tariff measures on Russian fertiliser are more immediate explanations for this decline, and they
          make any CBAM effect difficult to isolate. Over the same months imports from several origins rose: Chinese
          steel by 9%, Brazilian steel by 90%, Indonesian steel by 30% and Canadian aluminium by 97%. That pattern is
          not consistent with a simple claim that CBAM alone is already reducing imports.</p>
          <p>One further caution on the published trade data. The share of aluminium arriving with its origin
          undeclared rose from under 2,000 tonnes in the first half of 2025 to nearly 86,000 tonnes in 2026, almost
          all of it unwrought metal. Part of what looks like a fall in any single country&rsquo;s aluminium is simply
          origin no longer being stated.</p>

          <h2 id="s-checks">How this was checked, and its limits</h2>
          <p>The analysis was tested in four ways using public data. Each check produces a numerical result that can
          be independently reproduced.</p>
          <div class="cb-scroll">
          <table class="cb-tbl">
            <thead><tr><th>Check</th><th class="n">Result</th></tr></thead>
            <tbody>
              <tr><td>Reconciled the assembled trade flows with the EU&rsquo;s published extra-EU totals, across six sector-period aggregates</td><td class="n">residual 0.000000%</td></tr>
              <tr><td>Compared per-tonne default charges for nine steel and aluminium products with an independent commercial estimate, using the official &euro;75.36 certificate price</td><td class="n">9 of 9 within &euro;0.50</td></tr>
              <tr><td>Internal consistency of the published country intensity dataset: direct plus indirect equals total, for every country-product cell</td><td class="n">2,382 of 2,382</td></tr>
              <tr><td>Plant-activity calibration against mandatory reporting in three countries, blast-furnace route</td><td class="n">0.99 &middot; 0.98 &middot; 0.96</td></tr>
            </tbody>
          </table>
          </div>

          <h3>Limits</h3>
          <ul>
            <li><b>The &euro;14.5bn is a default-value scenario, not a forecast.</b> What is actually collected depends
            on how much verified data importers obtain, which cannot be observed from outside.</li>
            <li><b>Country-level intensities are analytical proxies, not verified facility data.</b> They estimate
            where better emissions data may matter; they cannot determine the charge for an individual consignment,
            which depends on verified emissions for that product and facility.</li>
            <li><b>The estimates do not account for carbon prices paid in the country of origin.</b> Any recognised
            carbon price would reduce the number of CBAM certificates ultimately due. The implementing regulation
            governing that deduction was still in draft at the time of writing and sets no list of qualifying
            countries.</li>
            <li><b>Indonesia&rsquo;s &euro;1,950M should not be read as exposure.</b> The default value for its
            principal export corresponds to ferro-nickel and is not comparable with the others in the table.</li>
            <li><b>Outside the six jurisdictions named above our dataset holds no published plant-level
            intensity</b> &mdash; the plant layer gives identity, route and a bounded estimate, labelled as such.</li>
            <li><b>The United Kingdom&rsquo;s figures are inferred.</b> Its scheme starts in 2027 and its default
            values have not been published; these are derived from the allowance price and the statutory rate
            formula, and will be restated when the values appear.</li>
            <li><b>Indicative desktop analysis of public information, not advice.</b> Nothing here is a
            compliance determination. Any commercial, financing or compliance decision needs independent
            verification.</li>
            <li><b>The downstream extension is not priced here.</b> Parliament reached its first-reading position in
            September 2026 and the scope is still in negotiation; the codes proposed so far carry about 10 million
            tonnes a year, worth roughly twice the current steel scope in value.</li>
          </ul>

          <div class="provenance">
            <div class="provenance__row"><span class="provenance__k">Basis</span><span class="provenance__v">EU trade
            volumes for 2025 and the first half of 2026; CBAM scope, default values, benchmarks and certificate price
            from the Regulation and its implementing acts; country emissions intensities from the European
            Commission&rsquo;s Joint Research Centre; plant identity, ownership, route and capacity from Global Energy
            Monitor, with plant activity from Climate TRACE. Figures use 2025 trade volumes, 2026 rules and a
            &euro;80 certificate price; the official price was &euro;75.36 in the first quarter of 2026 and
            &euro;75.28 in the second.</span></div>
            <div class="provenance__row"><span class="provenance__k">Measured data</span><span class="provenance__v">Regulator-published
            facility emissions from the Clean Energy Regulator (Australia), the Environmental Protection Agency
            (United States), Environment and Climate Change Canada, the Ministry of Environment (Taiwan), Japan&rsquo;s
            mandatory reporting system, and the European Environment Agency. Australian export cross-checks from the
            Australian Bureau of Statistics; United Kingdom trade from HM Revenue &amp; Customs and UK legislation
            from legislation.gov.uk.</span></div>
            <div class="provenance__row"><span class="provenance__k">Method</span><span class="provenance__v">The full
            source register with licences, the calculation chain, the four checks and the dated corrections are set
            out in the <a href="/methods/cbam/">CBAM methodology note</a>.</span></div>
            <div class="provenance__row"><span class="provenance__k">Reuse</span><span class="provenance__v">Contains
            information from Eurostat and from EU legal texts, reused under Decision 2011/833/EU. Based on Clean
            Energy Regulator material licensed under a Creative Commons Attribution 4.0 licence. Contains public
            sector information licensed under the Open Government Licence v3.0. Climate TRACE and Global Energy
            Monitor data under CC BY 4.0. Changes have been made to all of the above. No regulator, agency or data
            publisher named here has reviewed, approved or endorsed this analysis.</span></div>
          </div>
          </div>
"""

MAPJS = """
<script src="/assets/d3-7.9.0.min.js"></script>
<script src="/assets/topojson-3.0.2.min.js"></script>
<script>
const CB_WORLD = __WORLD__;
const CB_PAY = __PAY__;
(function(){
  const host=document.getElementById("cbmap"); if(!host) return;
  if(!window.d3||!window.topojson){ host.innerHTML='<p class="cb-note" style="padding:18px 0">The map could not be drawn because its drawing library did not load. The figures it illustrates are in the tables above and below.</p>'; return; }
  const RAMP=["#f6ddc4","#e8a06a","#d9620f"], LAND="#e7e2d6", MEAS="#16293a", EST="#63707c";
  document.querySelectorAll(".cb-key .sw1").forEach(e=>e.style.background=RAMP[0]);
  document.querySelectorAll(".cb-key .sw2").forEach(e=>e.style.background=RAMP[1]);
  document.querySelectorAll(".cb-key .sw3").forEach(e=>e.style.background=RAMP[2]);
  const W=1000,H=440;
  const svg=d3.select(host).append("svg").attr("viewBox",[0,0,W,H]).attr("preserveAspectRatio","xMidYMid meet");
  const proj=d3.geoNaturalEarth1().fitExtent([[4,8],[W-4,H-8]],{type:"Sphere"});
  const path=d3.geoPath(proj);
  const feats=topojson.feature(CB_WORLD,CB_WORLD.objects.countries).features;
  const N2I=__N2I__;
  const vals=Object.values(CB_PAY.cost).filter(v=>v>0).sort(d3.ascending);
  const q=[d3.quantileSorted(vals,0.5),d3.quantileSorted(vals,0.85)];
  svg.append("g").selectAll("path").data(feats).join("path").attr("d",path).attr("class","cb-land")
     .style("fill",d=>{const c=CB_PAY.cost[N2I[d.properties.name]];
        return c==null?LAND:(c>q[1]?RAMP[2]:c>q[0]?RAMP[1]:RAMP[0]);});
  const r=d3.scaleSqrt().domain([0,20]).range([1.1,7]);
  const tip=document.getElementById("cbtip"), SEC=["steel","aluminium","ammonia"];
  const pts=CB_PAY.f.filter(f=>isFinite(f[3])&&isFinite(f[4])).sort((a,b)=>a[6]-b[6]);
  svg.append("g").selectAll("circle").data(pts).join("circle")
     .attr("class",d=>d[6]?"cb-dot cb-dot--m":"cb-dot")
     .attr("cx",d=>proj([d[4],d[3]])[0]).attr("cy",d=>proj([d[4],d[3]])[1])
     .attr("r",d=>d[6]?Math.max(2.6,r(d[5])):r(d[5]))
     .style("fill",d=>d[6]?MEAS:EST).style("fill-opacity",d=>d[6]?1:0.45)
     .on("mousemove",(e,d)=>{tip.hidden=false;
        tip.innerHTML="<b>"+d[1]+"</b><br>"+d[2]+" &middot; "+SEC[d[0]]+(d[5]?" &middot; "+d[5].toFixed(1)+" Mt":"")+
          (d[6]?"<br>published intensity":"<br>no published intensity");
        const b=host.getBoundingClientRect(); let x=e.clientX-b.left+14,y=e.clientY-b.top+14;
        if(x+260>b.width)x-=274; tip.style.left=x+"px"; tip.style.top=y+"px";})
     .on("mouseleave",()=>{tip.hidden=true;});
})();
</script>"""

N2I = {"China":"CHN","Turkey":"TUR","Indonesia":"IDN","India":"IND","Russia":"RUS","Egypt":"EGY","Ukraine":"UKR",
       "South Korea":"KOR","United Kingdom":"GBR","Algeria":"DZA","Vietnam":"VNM","Taiwan":"TWN",
       "United States of America":"USA","South Africa":"ZAF","Malaysia":"MYS","United Arab Emirates":"ARE",
       "Brazil":"BRA","Kazakhstan":"KAZ","Saudi Arabia":"SAU","Mozambique":"MOZ","Tunisia":"TUN","Japan":"JPN",
       "Australia":"AUS","Canada":"CAN","Serbia":"SRB","Belarus":"BLR","Morocco":"MAR","Trinidad and Tobago":"TTO",
       "Qatar":"QAT","Oman":"OMN","Nigeria":"NGA","Georgia":"GEO","Bosnia and Herz.":"BIH","Mexico":"MEX",
       "Argentina":"ARG","Iran":"IRN","Israel":"ISR","New Zealand":"NZL","Chile":"CHL","Libya":"LBY","Jordan":"JOR",
       "Uzbekistan":"UZB","Azerbaijan":"AZE","Philippines":"PHL","Pakistan":"PAK","Bangladesh":"BGD","Albania":"ALB",
       "Montenegro":"MNE","Colombia":"COL","Peru":"PER","Mongolia":"MNG","Zimbabwe":"ZWE","Cameroon":"CMR",
       "Ghana":"GHA","Iraq":"IRQ","Kuwait":"KWT","Sri Lanka":"LKA","Moldova":"MDA","Venezuela":"VEN",
       "Thailand":"THA","Macedonia":"MKD","Turkmenistan":"TKM","Armenia":"ARM","Norway":"NOR",
       "Switzerland":"CHE","Iceland":"ISL"}


def main():
    if not PAYLOAD.exists():
        sys.exit(f"missing facility payload: {PAYLOAD}")
    body = BODY.replace("__CHART__", chart_html())

    rows = list(csv.DictReader(open(REGISTER, encoding="utf-8")))
    hay = html.unescape(re.sub(r"<[^>]+>", " ", body)).lower()
    for r in rows:
        if r["publish_class"] != "internal":
            continue
        for needle in (r["source_name"], r["publisher"]):
            n = (needle or "").strip().lower()
            if len(n) > 6 and n in hay:
                sys.exit(f"ABORT: restricted source named in page body: {r['source_id']} ({needle})")

    mapjs = (MAPJS.replace("__WORLD__", WORLD.read_text())
                  .replace("__PAY__", PAYLOAD.read_text(encoding="utf-8"))
                  .replace("__N2I__", json.dumps(N2I, ensure_ascii=False)))

    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>The CBAM verification gap &mdash; where better emissions data reduces the charge | Heliovulcan</title>
  <meta name="description" content="Applying the EU's 2026 CBAM rules to 2025 trade gives a modelled charge of EUR 14.5 billion at default values. Replacing defaults with published country intensities reduces it by EUR 3.5 billion, more than half of that in one country - and for some exporters not at all." />
  <meta name="keywords" content="CBAM exposure analysis, carbon border adjustment default values, embedded emissions verification, facility-level CBAM, steel CBAM charge" />
  <link rel="stylesheet" href="/style.css?v=20260927a" />
  <link rel="icon" href="/favicon.png" type="image/png" sizes="240x240" />
  <link rel="canonical" href="https://heliovulcan.com.au/research/cbam-verification-gap.html" />
  <meta property="og:site_name" content="Heliovulcan" />
  <meta property="og:title" content="Better emissions data would cut the modelled CBAM charge by EUR 3.5 billion, but not for every exporter" />
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
          <p class="eyebrow">Quantitative policy analysis</p>
          <h1>Better emissions data would cut the modelled CBAM charge by &euro;3.5&nbsp;billion, but not for every exporter</h1>
          <p class="res-hero__meta">
            <span class="tag">Quantitative policy analysis</span>
            <span class="sep" aria-hidden="true"></span>
            <span>{DATE}</span>
            <span class="sep" aria-hidden="true"></span>
            <span>12-minute read</span>
            <span class="sep" aria-hidden="true"></span>
            <span>EU CBAM, definitive period</span>
          </p>
        </div>
      </section>

      <div class="res-layout">
        <aside class="res-rail">
          <div class="res-rail__inner">
            <a href="/research.html">&larr; All research</a>
            <button type="button" data-copy-link>Copy link</button>
            <button type="button" onclick="window.print()">Print</button>
            <a href="/methods/cbam/">Method &amp; sources</a>
            <a href="/about.html#contact">Discuss a question</a>
          </div>
        </aside>

        <div class="res-main">
{body}
        </div>
      </div>
      </div>
    </article>
  </main>
  <footer class="footer"></footer>
{mapjs}
</body>
</html>
"""
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(page, encoding="utf-8")
    print(f"wrote {OUT.relative_to(SITE)}  ({len(page)//1024} KB)")
    print("  gate passed: no restricted source named in body")
    print("  next: python3 scripts/apply_chrome.py")


if __name__ == "__main__":
    main()
