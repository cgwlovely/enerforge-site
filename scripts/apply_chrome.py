#!/usr/bin/env python3
"""Site chrome: one header (mega menu + mobile accordion), one breadcrumb rule, one footer, on every page.

    python3 scripts/apply_chrome.py            # rewrite every page in place (idempotent)

Replaces the <header class="nav">…</header> and <footer class="footer">…</footer> blocks. Links are
root-relative so the same markup works at any depth. The Atlas/facility templates in bess-workspace
carry the same blocks and are patched too, so a rebuild does not regress them.
"""
from __future__ import annotations
import re, pathlib, sys

SITE = pathlib.Path(__file__).resolve().parents[1]
WS = SITE.parents[1]            # /Users/hugefafafa1/BESS
TEMPLATES = [WS / "tools/consultation_kb/atlas/parts/shell.html",
             WS / "tools/consultation_kb/atlas/facility_template.html",
             WS / "tools/consultation_kb/atlas/build_facility_pages.py"]
ASSET_V = "20260916f"          # bump when style.css or site-nav.js changes: returning browsers cache both
SKIP = {"ar.html", "context_map.html", "siting_opportunity_constraint_screen.html", "reports/_template.html"}

# ---- the menu -------------------------------------------------------------------
MENU = [
    ("research", "Research", "/research.html", [
        ("Research", [("Research reports and models", "/research.html#reports"), ("Insights", "/insights.html"),
                      ("Consultations", "/consultations.html"), ("Methods", "/methods/")]),
        ("Featured", [("Safeguard Atlas: the post-2030 decline rate cannot be set in isolation", "/safeguard-atlas.html"),
                      ("Future mine-electrification loads and current electricity data", "/australian-diesel-replacement-market-size.html"),
                      ("Lowering the Safeguard threshold also tightens baselines for facilities already covered", "/safeguard-review-2026-baseline-floor.html")])]),
    ("tools", "Data & tools", "/safeguard-atlas.html", [
        ("Safeguard Atlas", [("Findings", "/safeguard-atlas.html"), ("Policy model", "/safeguard/policy.html"),
                             ("Facility explorer", "/safeguard/facilities.html"), ("Map", "/safeguard/map.html"), ("Facility sandbox", "/safeguard/sandbox.html")]),
        ("Downloads", [("Atlas model inputs (JSON)", "/safeguard/method.html#downloads"), ("Safeguard facility table (CSV)", "/data/safeguard-facilities.csv"),
                       ("Remote Mining Asset record (JSON)", "/projects/remote-mining-asset/#machine-access")])]),
    ("consultations", "Consultations", "/consultations.html", [
        ("Published submissions", [("All submissions", "/consultations.html"),
                                   ("Safeguard post-2030 decline rate, 2026", "/consultations/safeguard-decline-rate-2026.html"),
                                   ("AI and data centres, 2026", "/consultations/ai-data-centres-2026.html"),
                                   ("Safeguard onsite abatement, 2026", "/consultations/safeguard-onsite-abatement-2026.html")]),
        ("Method", [("How submissions are prepared", "/methods/#consultation-submissions")])]),
    ("projects", "Projects", "/case-studies.html", [
        ("Cases", [("Project screens", "/case-studies.html#screens"),
                   ("Remote Mining Asset", "/reports/remote-mining-asset-hybrid-energy-review.html")]),
        ("Record", [("Research coverage", "/coverage.html"), ("Pre-DD methodology", "/methods/pre-dd-f1-f4/")])]),
    ("about", "About", "/about.html", None),
]

# page path → (section key, breadcrumb trail [(label, href), …] excluding the page itself)
SECTION_OF = {
    "insights.html": ("research", [("Research", "/research.html")]),
    "insights/battery-project-readiness.html": ("research", [("Research", "/research.html"), ("Insights", "/insights.html")]),
    "safeguard/baseline-floor-method.html": ("research", [("Research", "/research.html"), ("Lowering the threshold does more to the facilities already in", "/safeguard-review-2026-baseline-floor.html")]),
    "index.html": ("home", []),
    "research.html": ("research", []),
    "consultations.html": ("consultations", []),
    "consultations/ai-data-centres-2026.html": ("consultations", [("Consultations", "/consultations.html")]),
    "consultations/safeguard-decline-rate-2026.html": ("consultations", [("Consultations", "/consultations.html")]),
    "consultations/safeguard-onsite-abatement-2026.html": ("consultations", [("Consultations", "/consultations.html")]),
    "consultations/method.html": ("consultations", [("Consultations", "/consultations.html")]),
    "case-studies.html": ("projects", []), "case.html": ("projects", [("Projects", "/case-studies.html")]),
    "reports/remote-mining-asset-hybrid-energy-review.html": ("projects", [("Projects", "/case-studies.html")]),
    "reports/fountain-head-hybrid-energy-review.html": ("projects", [("Projects", "/case-studies.html")]),
    "projects/remote-mining-asset/index.html": ("projects", [("Projects", "/case-studies.html"), ("Remote Mining Asset", "/reports/remote-mining-asset-hybrid-energy-review.html")]),
    "projects/fountain-head/index.html": ("projects", [("Projects", "/case-studies.html")]),
    "datasets/remote-mining-asset-pre-dd/index.html": ("tools", [("Tools & data", "/api/"), ("Remote Mining Asset", "/reports/remote-mining-asset-hybrid-energy-review.html")]),
    "datasets/fountain-head-pre-dd/index.html": ("tools", [("Tools & data", "/api/")]),
    "methods/pre-dd-f1-f4/index.html": ("projects", [("Projects", "/case-studies.html")]),
    "methods/index.html": ("tools", [("Tools & data", "/safeguard-atlas.html")]),
    "api/index.html": ("tools", [("Tools & data", "/safeguard-atlas.html")]),
    "api/docs/index.html": ("tools", [("Tools & data", "/safeguard-atlas.html"), ("Data & API", "/api/")]),
    "coverage.html": ("projects", [("Projects", "/case-studies.html")]), "about.html": ("about", []),
    "industry-maps.html": ("tools", [("Tools & data", "/safeguard-atlas.html")]),
    "safeguard-atlas.html": ("tools", [("Tools & data", "/safeguard-atlas.html")]),
    "privacy.html": ("about", [("About", "/about.html")]),
}
RESEARCH_PAGES = ["safeguard-review-2026-baseline-floor.html", "australian-diesel-replacement-market-size.html",
    "mine-decarbonisation-funding-map-australia.html", "locational-pricing-remote-energy-australia.html", "time-to-power-offgrid-hybrid.html",
    "btm-demand-charges-australia.html", "australian-battery-financing-capital-constraint.html", "bess-development-queue-to-construction.html",
    "bess-forecast-is-not-cashflow.html", "bess-ready-to-build-completeness.html", "brownfield-bess-connection-value.html",
    "emerging-market-bess-develop-backwards.html", "hybrid-asset-integrated-due-diligence.html", "notes.html",
    "research/btm-bess-customer-savings.html", "research/pre-dd-versus-feasibility-study.html", "research/weak-grid-mine-energy.html"]
for p in RESEARCH_PAGES: SECTION_OF[p] = ("research", [("Research", "/research.html")])


def header_html(section: str) -> str:
    items = []
    for key, label, href, cols in MENU:
        cur = ' is-current' if key == section else ''
        if cols is None:
            items.append(f'<li class="nav__item{cur}"><a class="nav__top" href="{href}">{label}</a></li>')
            continue
        panel = "".join(
            '<div class="mega__col"><span class="mega__k">' + h + '</span><ul>' +
            "".join(f'<li><a href="{u}">{t}</a></li>' for t, u in links) + '</ul></div>' for h, links in cols)
        items.append(
            f'<li class="nav__item nav__item--menu{cur}"><a class="nav__top" href="{href}">{label}</a>'
            f'<button class="nav__toggle" type="button" aria-expanded="false" aria-controls="mega-{key}" aria-label="Open the {label} menu">'
            f'<span aria-hidden="true">&#9662;</span></button>'
            f'<div class="mega" id="mega-{key}" hidden><div class="mega__inner">{panel}</div></div></li>')
    return ('<header class="nav" id="site-nav">\n    <div class="nav__inner">\n'
            '      <a class="brand" href="/index.html" aria-label="Heliovulcan home">\n'
            '        <span class="brand__badge"><img src="/assets/logo-mark.png" alt="" width="40" height="40" /></span>\n'
            '        <span class="brand__name">Heliovulcan<span class="brand__sub">Energy Advisors</span></span>\n      </a>\n'
            '      <button class="nav__burger" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="Open the menu">Menu</button>\n'
            '      <nav class="nav__menu" id="site-menu" aria-label="Site">\n        <ul class="nav__list">' + "".join(items) + '</ul>\n'
            '        <a class="nav__cta" href="/about.html#contact">Discuss a question</a>\n      </nav>\n    </div>\n  </header>\n'
            f'  <script src="/assets/site-nav.js?v={ASSET_V}" defer></script>')


def crumb_html(trail, page_title: str) -> str:
    if not trail: return ""
    parts = '<a href="/index.html">Home</a>' + "".join(f'<span aria-hidden="true">/</span><a href="{u}">{t}</a>' for t, u in trail)
    return f'\n  <nav class="crumb" aria-label="Breadcrumb"><div class="container">{parts}<span aria-hidden="true">/</span><span aria-current="page">{page_title}</span></div></nav>'


FOOTER = '''<footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__about">
          <a class="brand" href="/index.html">
            <span class="brand__badge"><img src="/assets/logo-mark.png" alt="" width="40" height="40" /></span>
            <span class="brand__name">Heliovulcan<span class="brand__sub">Energy Advisors</span></span>
          </a>
          <p class="footer__note">Independent analysis of Australian industrial assets, energy and emissions, built from regulatory filings, licence records and company disclosures. Calculated results and unresolved questions are labelled explicitly.</p>
        </div>
        <div class="footer__col"><span class="footer__k">Research</span><a href="/research.html">Research reports and models</a><a href="/insights.html">Insights</a><a href="/methods/">Methods</a><a href="/coverage.html">Research coverage</a></div>
        <div class="footer__col"><span class="footer__k">Data &amp; tools</span><a href="/safeguard-atlas.html">Safeguard Atlas</a><a href="/safeguard/policy.html">Policy model</a><a href="/safeguard/facilities.html">Facility explorer</a><a href="/safeguard/map.html">Map</a><a href="/safeguard/sandbox.html">Facility sandbox</a><a href="/safeguard/method.html#downloads">Downloads</a></div>
        <div class="footer__col"><span class="footer__k">Consultations &amp; projects</span><a href="/consultations.html">Published submissions</a><a href="/case-studies.html">Project screens</a><a href="/reports/remote-mining-asset-hybrid-energy-review.html">Remote Mining Asset</a><a href="/coverage.html">Research coverage</a></div>
        <div class="footer__col"><span class="footer__k">About</span><a href="/about.html">About Heliovulcan</a><a href="/about.html#contact">Contact</a><a href="https://www.linkedin.com/company/heliovulcan" rel="me noopener" target="_blank">LinkedIn</a><a href="/privacy.html">Privacy</a></div>
      </div>
      <p class="footer__legal">
        <b>Disclaimer:</b> Heliovulcan is an independent research and analysis practice providing public-information desktop analysis and screening support. Nothing on this site is legal, financial, tax, engineering, investment or lender due-diligence advice, a compliance determination, or regulatory representation or lobbying, and nothing here is a financial product recommendation. All results are indicative and must be independently verified before any commercial, financing or construction decision. &copy; 2026 Heliovulcan Energy Advisors.
      </p>
    </div>
  </footer>'''

HEAD_RE = re.compile(r'<header class="nav"[^>]*>.*?</header>(?:\s*<script src="/assets/site-nav\.js[^"]*" defer></script>)?(?:\s*<nav class="crumb".*?</nav>)?(?:\s*\{\{CRUMB\}\})*', re.S)
FOOT_RE = re.compile(r'<footer class="footer">.*?</footer>', re.S)


def title_of(s: str) -> str:
    """Breadcrumb label: the <title> up to its first separator, cut at a word boundary."""
    m = re.search(r"<title>(.*?)</title>", s, re.S) or re.search(r"<h1[^>]*>(.*?)</h1>", s, re.S)
    t = re.sub(r"<[^>]+>", "", m.group(1)) if m else "Page"
    t = re.split(r"\s+[|\u2014]\s+", re.sub(r"\s+", " ", t).strip())[0]
    if len(t) > 64: t = t[:64].rsplit(" ", 1)[0] + "\u2026"
    return t


def apply(path: pathlib.Path, rel: str) -> bool:
    s = path.read_text()
    if not HEAD_RE.search(s): return False
    section, trail = SECTION_OF.get(rel, ("", []))
    if rel.startswith("facility/"): section, trail = "tools", [("Tools & data", "/safeguard-atlas.html"), ("Facilities", "/safeguard/facilities.html")]
    if rel.startswith("safeguard/") and rel not in SECTION_OF: section, trail = "tools", [("Tools & data", "/safeguard-atlas.html"), ("Safeguard Atlas", "/safeguard-atlas.html")]
    if rel.startswith("consultations/"): section = "consultations"
    new = header_html(section) + crumb_html(trail, title_of(s))
    s = HEAD_RE.sub(lambda m: new, s, count=1)
    s = FOOT_RE.sub(lambda m: FOOTER, s, count=1)
    s = re.sub(r'href="(/|\.\./|\.\./\.\./)?style\.css(\?v=[^"]*)?"', f'href="/style.css?v={ASSET_V}"', s)
    path.write_text(s); return True


def main():
    n = 0
    for p in sorted(SITE.rglob("*.html")):
        rel = str(p.relative_to(SITE))
        if rel in SKIP or rel.startswith(("downloads/", ".preview/")): continue
        if apply(p, rel): n += 1
    print(f"chrome applied to {n} pages")
    for t in TEMPLATES:
        if not t.exists(): print("  ⚠ template missing", t); continue
        s = t.read_text()
        if t.name == "build_facility_pages.py":
            # the directory-page template is a Python string: same header/footer, escaped once
            hdr = header_html("tools") + crumb_html([("Tools & data", "/safeguard-atlas.html"), ("Safeguard Atlas", "/safeguard-atlas.html")], "Facilities")
            s2 = HEAD_RE.sub(lambda m: hdr, s, count=1); s2 = FOOT_RE.sub(lambda m: FOOTER, s2, count=1)
        elif t.name == "shell.html":
            hdr = header_html("tools") + '\n  {{CRUMB}}'
            s2 = HEAD_RE.sub(lambda m: hdr, s, count=1); s2 = FOOT_RE.sub(lambda m: FOOTER, s2, count=1)
        else:
            hdr = header_html("tools") + crumb_html([("Tools & data", "/safeguard-atlas.html"), ("Facilities", "/safeguard/facilities.html")], "{{NAME}}")
            s2 = HEAD_RE.sub(lambda m: hdr, s, count=1); s2 = FOOT_RE.sub(lambda m: FOOTER, s2, count=1)
        if s2 != s: t.write_text(s2); print("  template patched:", t.name)


if __name__ == "__main__":
    main()
