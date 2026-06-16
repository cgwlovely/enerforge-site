/* =============================================================================
   EnerForge — CASE STUDY DATA
   -----------------------------------------------------------------------------
   This is the ONLY file you edit to add or change a case study.
   No build step, no framework. Add a new object to the ENERFORGE_CASES array
   and a new card + map pin appear on case-studies.html automatically, and a
   full page renders at  case.html?id=<your-id>

   FIELD REFERENCE (every field is optional except id, num, title):
     id            unique slug used in the URL (case.html?id=fountain-head)
     num           display number, e.g. "02"
     title         headline
     subtitle      one-paragraph standfirst
     status        { label, tone }  tone = "ok" | "warn" | "bad"
     lesson        optional navy call-out HTML stated up front
     industry      e.g. "Gold mining"
     location      e.g. "Pine Creek, Northern Territory, Australia"
     projectType   e.g. "Behind-the-meter solar + BESS + diesel hybrid"
     tags          array of short labels
     source        "public" (located pin) | "illustrative" (hollow pin)
     pin           { x, y, type, label } position on the Australia SVG map
     summary       short text for the index card
     stats         array of { value, label } shown on the index card (max 3)
     kpis          array of { value, label } shown on the detail page
     problem       array of HTML paragraph strings  (the project question)
     method        array of HTML paragraph strings  (how it was screened)
     dataSources   array of strings
     assumptions   array of { k, v } rows
     scenarios     array of { tag, name, desc }
     matrix        { note, columns:[{label,win}], rows:[{metric,cells:[{html,cls}]}] }
     keyFindings   array of strings (shown as a navy takeaways list)
     finance       array of HTML paragraphs (financial / bankability reading)
     customer      array of HTML paragraphs (customer / owner economics reading)
     insight       HTML string shown in a teal insight box
     pullQuote     HTML string shown in a navy pull-quote
     limitations   array of HTML paragraphs
     outputs       array of { title, desc }
     downloads     array of { label, href, note }  (use href:"" for "coming soon")

   The disclaimer block and the "free sanity check" call-to-action are added to
   EVERY case page automatically — you do not need to repeat them here.
   ============================================================================= */

window.ENERFORGE_CASES = [

  /* ===========================================================================
     CASE 02 — FOUNTAIN HEAD GOLD MINE  (first published case)
     =========================================================================== */
  {
    id: "fountain-head",
    num: "02",
    title: "Fountain Head: a gold mine that looked better at 100% renewable — and financed worse.",
    subtitle:
      "An independent public-data screen of the Fountain Head gold mine in the Northern Territory — testing solar + BESS + diesel under a third-party SPV, where more renewable was not the better commercial answer.",
    status: { label: "Outcome: 60% hybrid is the preferred screen", tone: "ok" },
    lesson:
      "<span class='hl'>More renewable is not automatically better.</span> Every case here can be geared to pass a lender DSCR — but the 100% renewable case, weighed down by CAPEX and a large buy-out, leaves the owner worse off. The 60% hybrid is the only case that works for the owner and the lender at once.",

    industry: "Gold mining",
    location: "Fountain Head / Pine Creek, Northern Territory, Australia",
    projectType: "Behind-the-meter solar + BESS + diesel hybrid (EaaS / third-party SPV)",
    tags: ["Hybrid energy", "Mining", "Public data"],
    source: "public",
    pin: { x: 456, y: 108, type: "solid", label: "Case 02 · Fountain Head" },

    summary:
      "A public-data screen of the Fountain Head gold mine (Northern Territory). Four solar + BESS + diesel cases, all clearing the lender DSCR — but only the 60% hybrid leaves the owner genuinely ahead after buy-out.",
    stats: [
      { value: "~30 GWh/yr", label: "indicative demand" },
      { value: "4 cases", label: "S1 / S3 / S4 / S5" },
      { value: "+$4.6M", label: "owner saving (S4)" }
    ],

    kpis: [
      { value: "~30 GWh/yr", label: "Indicative annual demand (public EIS material)" },
      { value: "~3.9 MW", label: "Indicative peak load" },
      { value: "4.6 MWp", label: "Disclosed PV starting point" },
      { value: "2.3 MW / 2.2 MWh", label: "Disclosed BESS starting point" }
    ],

    problem: [
      "Remote and weak-grid mines often want to cut diesel exposure, lower operating cost and improve emissions performance. But the first risk is not technical. The first question is whether the ownership, contract, financing and owner-saving story even holds together.",
      "So the screen did not ask &ldquo;can a hybrid be built?&rdquo; It asked whether a third-party SPV could recover the cost of PV, BESS, diesel generation and integration within the available contract life — and still leave the mine owner genuinely better off than staying on diesel."
    ],

    method: [
      "A high-level but structured desktop screen. Annual energy and peak load were reconstructed from public environmental-impact material, a diesel-only baseline was built for tariff and emissions context, and four hybrid configurations were sized across a range of renewable shares.",
      "Each configuration was then tested for SPV financeability — DSCR, debt capacity and the residual buy-out an investor would need — and for the owner&rsquo;s true saving after that buy-out, not just the headline tariff discount."
    ],

    dataSources: [
      "NT EPA environmental-impact statement / GHG assessment — annual electricity demand and peak load",
      "PNX Metals / Sunrise public reporting — disclosed PV (4.6 MWp) and BESS (2.3 MW / 2.2 MWh) sizing",
      "Global Solar Atlas / analyst assumption — Pine Creek solar yield (1,850 kWh/kWp/yr)",
      "Analyst assumptions — diesel price, genset O&amp;M, EPC benchmarks, gearing and tenor"
    ],

    assumptions: [
      { k: "Site type", v: "Weak-grid / off-grid gold mine" },
      { k: "Baseline supply", v: "Diesel generation" },
      { k: "Solar yield assumed", v: "1,850 kWh/kWp/yr" },
      { k: "Structure tested", v: "Third-party SPV / EaaS" },
      { k: "Lender DSCR threshold", v: "1.30x (simplified downside)" },
      { k: "Cases screened", v: "4 (S1 / S3 / S4 / S5)" }
    ],

    scenarios: [
      { tag: "S1 · short life", name: "Original short-life base", desc: "The disclosed-style mine-life case with limited renewable share. Too short for a third-party SPV to recover capital without a heavy residual." },
      { tag: "S3 · expanded hub", name: "7-year expanded hub", desc: "A longer demand horizon reflecting a regional / merged-asset logic. Bankability improves, but owner economics stay weak if sizing is not redesigned." },
      { tag: "S4 · 60% renewable", name: "Balanced hybrid", desc: "PV + BESS resized to a 60% renewable share with diesel backup held constant. The best balance of DSCR, diesel reduction, buy-out and true owner saving." },
      { tag: "S5 · 100% renewable", name: "Maximum-renewable screen", desc: "An upper-bound case: PV sized to 100% of annual energy with a much larger BESS and diesel backup. A useful strategic screen — but capital-heavy." }
    ],

    matrix: {
      note: "All four cases clear the lender DSCR — only one leaves the owner ahead",
      columns: [
        { label: "S1 · short life" },
        { label: "S3 · expanded hub" },
        { label: "S4 · 60% renewable", win: true },
        { label: "S5 · 100% renewable" }
      ],
      rows: [
        { metric: "Physical renewable share", cells: [{ html: "28%" }, { html: "28%" }, { html: "60%", cls: "win" }, { html: "100%" }] },
        { metric: "TIC before IDC", cells: [{ html: "$19.0M" }, { html: "$19.6M" }, { html: "$31.3M", cls: "win" }, { html: "$64.0M" }] },
        { metric: "SPV after-tax CFADS (base)", cells: [{ html: "$0.1M" }, { html: "$2.4M" }, { html: "$5.7M", cls: "win" }, { html: "$10.1M" }] },
        { metric: "Bankable debt capacity", cells: [{ html: "$0.27M" }, { html: "$8.6M" }, { html: "$20.5M", cls: "win" }, { html: "$36.3M" }] },
        { metric: "Min DSCR (downside)", cells: [{ html: "1.30x" }, { html: "1.30x" }, { html: "1.30x", cls: "win" }, { html: "1.30x" }] },
        { metric: "Required residual / buy-out", cells: [{ html: "$27.3M" }, { html: "$14.5M" }, { html: "$4.5M", cls: "win" }, { html: "$24.5M" }] },
        { metric: "Owner true saving after buy-out", cells: [{ html: "&minus;$20.1M", cls: "bad" }, { html: "&minus;$5.4M", cls: "bad" }, { html: "+$4.6M", cls: "win" }, { html: "&minus;$15.4M", cls: "bad" }] },
        { metric: "Verdict", cells: [
          { html: "<span class='pill pill--red'>Owner fails</span>" },
          { html: "<span class='pill pill--amber'>Marginal</span>" },
          { html: "<span class='pill pill--green'>Preferred</span>", cls: "win" },
          { html: "<span class='pill pill--red'>Owner fails</span>" }
        ] }
      ]
    },

    insight:
      "The headline trap: every case can be geared to pass a 1.30x lender DSCR. The real differentiator is the owner&rsquo;s <em>true</em> saving after the residual buy-out — and only the 60% hybrid (S4) leaves the owner genuinely ahead.",

    finance: [
      "The short-life case (S1) collapses because the contract is too short to recover capital. It needs a $27.3M buy-out and leaves the owner $20.1M worse off — a textbook example of mine-life risk killing an SPV structure.",
      "The 100% renewable case (S5) is the seductive one. It clears the lender test after re-gearing, so it looks bankable. But $64M of CAPEX and a $24.5M residual buy-out leave the owner $15.4M behind. Pushing renewable share to the maximum made the project look greener and finance worse."
    ],

    customer: [
      "On the owner side, the only number that matters is the true saving after the residual buy-out is paid. A headline tariff discount is not the same thing.",
      "Only the 60% hybrid (S4) turns the diesel saving into a positive owner outcome — roughly +$4.6M — while still supporting the lender&rsquo;s debt. That is what makes it the preferred screen, not its renewable share."
    ],

    pullQuote:
      "More renewable was <span class='hl'>not</span> better. The 60% hybrid was the only case that worked for the owner and the lender at the same time.",

    keyFindings: [
      "Passing a lender DSCR is necessary, but it does not make a project good for the owner.",
      "Mine life and contract tenor decide whether an SPV can ever recover its capital.",
      "The residual / buy-out is where headline savings quietly disappear.",
      "Maximum renewable share is a strategy choice, not the default commercial answer.",
      "The right question is the owner&rsquo;s true saving after buy-out — not the tariff discount."
    ],

    limitations: [
      "This is a preliminary public-data screen built from NT EPA environmental-impact material for a Fountain Head / Pine Creek style gold mine. It is a demonstration of the screening method — indicative assumptions only, not commissioned by, endorsed by or verified with the project owner.",
      "All results must be validated against owner-confirmed mine plans, load and diesel data, hourly dispatch modelling, vendor quotations and real contract / buy-out terms before any commercial decision."
    ],

    outputs: [
      { title: "Owner-facing summary", desc: "The commercial story, scenario ranking, owner implications and next steps — in plain language." },
      { title: "Scenario workbook", desc: "Transparent assumptions, sizing logic, SPV boundary, DSCR and true-saving calculations." },
      { title: "Risk &amp; sensitivity screen", desc: "Where the project is exposed to mine life, diesel cost, gearing, tariff and buy-out assumptions." },
      { title: "Next-step data request", desc: "The owner data needed to move from desktop screen to hourly dispatch validation." }
    ],

    downloads: [
      { label: "Financeability report (PDF)", href: "reports/Fountain_Head_Hybrid_Energy_Financeability_Report.pdf", note: "download PDF" }
    ],
    downloadsNote: "Want the full scenario workbook, sensitivity tables, or a walk-through of the numbers? <a href='index.html#contact'>Reach out</a> — I'm happy to share more detail or talk through what this screen means for a project you're looking at."
  },

  /* ===========================================================================
     CASE 01 — WEAK-GRID INDUSTRIAL SOLAR + BESS EaaS  (illustrative)
     =========================================================================== */
  {
    id: "weak-grid-eaas",
    num: "01",
    title: "A project that saved the customer money — and still couldn't be financed.",
    subtitle:
      "An illustrative weak-grid, diesel-exposed industrial site. The customer case works; the base-case financing does not — a lesson in why customer value and bankability are not the same.",
    status: { label: "Not bankable under the current debt structure", tone: "warn" },
    lesson:
      "<span class='hl'>Not bankable does not mean no value.</span> This project creates real customer savings and still fails the lender test under its current debt structure. The honest fix is to redesign the commercial and financing structure — not to abandon the technical solution.",

    industry: "Industrial / weak-grid energy user",
    location: "Representative weak-grid industrial site",
    projectType: "Behind-the-meter solar + BESS, Energy-as-a-Service",
    tags: ["BESS feasibility", "EaaS", "Bankability"],
    source: "illustrative",
    pin: { x: 178, y: 332, type: "hollow", label: "Case 01 · representative site" },

    summary:
      "A weak-grid, diesel-exposed industrial site. The customer case works; the base-case financing does not. A lesson in why customer value and bankability are not the same.",
    stats: [
      { value: "$2.08M/yr", label: "customer benefit" },
      { value: "0.60x", label: "S1 min DSCR" },
      { value: "3.0 MWp", label: "PV + 6 MWh BESS" }
    ],

    kpis: [
      { value: "3.0 MWp", label: "Solar PV" },
      { value: "1.5 MW / 6.0 MWh", label: "BESS (2.5 MW PCS, N+1)" },
      { value: "$9.17M", label: "TIC incl. IDC" },
      { value: "0.60x", label: "S1 min DSCR vs 1.30x target" }
    ],

    problem: [
      "The starting question was simple: can a behind-the-meter solar + BESS system reduce diesel cost for a weak-grid industrial customer, while creating a stable EaaS revenue stream for a project company (SPV)?",
      "The model does not assume that all diesel must be removed. Diesel backup remains important for peaks, reliability and extreme operating conditions. The system is sized to the predictable load — not to the short peak — which is the first place value is either created or wasted."
    ],

    method: [
      "The screen built a diesel baseline, sized PV and BESS to the steady load, and translated the customer&rsquo;s avoided cost into a contracted EaaS fee. It then tested that fixed fee against debt service across three revenue cases — fixed fee only (S1), fee plus arbitrage upside (S2) and pure arbitrage (S3).",
      "The key discipline: only contracted, fixed revenue (S1) is treated as the bankable base case. Carbon value is shown on the customer side and kept out of base SPV revenue."
    ],

    dataSources: [
      "Illustrative load and tariff profile for a weak-grid diesel-exposed site",
      "Analyst assumptions — EPC benchmarks, diesel price, EaaS pricing, gearing and tenor",
      "Indicative feasibility-stage CAPEX (&plusmn;20% before a binding EPC quote)"
    ],

    assumptions: [
      { k: "Annual load", v: "3,310 MWh/yr" },
      { k: "Peak / average load", v: "1.8 MW / 0.38 MW (4.8&times;)" },
      { k: "Diesel displacement target", v: "1,000,000 L/yr" },
      { k: "Grid condition", v: "Weak-grid" },
      { k: "Lender DSCR threshold", v: "1.30x" },
      { k: "Structure tested", v: "Energy-as-a-Service (SPV)" }
    ],

    scenarios: [
      { tag: "S1 · base case", name: "Fixed EaaS service fee only", desc: "Contracted, predictable revenue a lender can underwrite. The only honest base case — and the one that fails here." },
      { tag: "S2 · upside", name: "EaaS fee plus BTM arbitrage", desc: "Investor upside. It clears the bar on paper, but the arbitrage is not contracted, so it should not carry the base case." },
      { tag: "S3 · comparison", name: "Pure BTM arbitrage, no fixed fee", desc: "Shown only for contrast. A project IRR of −177% makes clear why pure arbitrage is not a base case." }
    ],

    matrix: {
      note: "The same project, three verdicts — the honest base case (S1) is the one a bank cannot fund today",
      columns: [
        { label: "S1 · base", win: true },
        { label: "S2 · upside" },
        { label: "S3 · contrast" }
      ],
      rows: [
        { metric: "Project IRR (after tax)", cells: [{ html: "7.58%", cls: "win" }, { html: "8.49%" }, { html: "&minus;177%", cls: "bad" }] },
        { metric: "Minimum DSCR", cells: [{ html: "0.60x", cls: "win" }, { html: "1.28x" }, { html: "0.01x", cls: "bad" }] },
        { metric: "Bankable debt capacity", cells: [{ html: "$4.29M", cls: "win" }, { html: "$4.61M" }, { html: "$0.34M" }] },
        { metric: "Debt gap vs $6.26M", cells: [{ html: "&minus;$1.97M", cls: "win" }, { html: "&minus;$1.65M" }, { html: "&minus;$5.92M", cls: "bad" }] },
        { metric: "Verdict", cells: [
          { html: "<span class='pill pill--red'>Red</span>", cls: "win" },
          { html: "<span class='pill pill--amber'>Amber</span>" },
          { html: "<span class='pill pill--red'>Red</span>" }
        ] }
      ]
    },

    insight:
      "A 0.60x minimum DSCR sounds like a project that doesn&rsquo;t work. It isn&rsquo;t — debt service is comfortable for over a decade, then a single sculpted tail-year repayment drops coverage and sets the minimum. Fix the structure, not the technology.",

    finance: [
      "Against a 1.30x lender target, S1 lands at a 0.60x minimum DSCR with a roughly $1.97M debt capacity gap. S2 only clears because it leans on uncontracted arbitrage — which is exactly the revenue a careful lender will discount.",
      "This does not mean the project has no value. It means that under the current debt gearing and EaaS pricing, fixed contract revenue does not yet support the assumed debt structure."
    ],

    customer: [
      "On the customer side the numbers hold up: a $2.08M/yr avoided cost, an EaaS fee of $1.31M/yr below the diesel baseline, and a buyer saving of roughly $563.5K/yr (about 30%).",
      "But the customer&rsquo;s avoided cost is not the project company&rsquo;s revenue. The fixed EaaS fee captures only about 70% of it, and that fee is the only thing a bank will underwrite. Carbon value (~$67K/yr) is shown customer-side and excluded from base SPV revenue."
    ],

    pullQuote:
      "Customer value is necessary, but <span class='hl'>contracted revenue is what carries debt.</span>",

    keyFindings: [
      "A project can create real customer savings and still fail the lender case.",
      "Customer avoided cost is not project-company revenue — the EaaS fee captures only part of it.",
      "Carbon value belongs to the customer; it should be visible, not double-counted into base revenue.",
      "Banks underwrite S1 fixed revenue, not S2 arbitrage upside.",
      "A single tail-year DSCR can sink bankability — fix the structure, not the technology."
    ],

    limitations: [
      "This is an illustrative screening, not a bank-approved financing model. CAPEX is a feasibility estimate that can move &plusmn;20% before a binding EPC quote, and all figures are indicative outputs of an early-stage workflow.",
      "The aim is not to predict perfectly — it is to make the early decision clearer: proceed, optimise, redesign, or stop."
    ],

    outputs: [
      { title: "Client report", desc: "Customer value, EaaS fee, savings, carbon and the next decision gate — in plain language." },
      { title: "Technical report", desc: "S1 / S2 / S3 scenarios, DSCR, debt capacity, cash flow and model QA for investors and lenders." },
      { title: "Decision card", desc: "A one-page summary of customer value, service fee, financing gap and recommended next step." },
      { title: "Next-step data request", desc: "What to confirm — EPC quote, EaaS term sheet, customer credit support — before proceeding." }
    ],

    downloads: []
  }

];
