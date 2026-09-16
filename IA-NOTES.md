# Information architecture notes

Why the site is shaped the way it is, so future changes stay aligned rather than drifting back
toward a single-service brochure.

Last revised: 2026-09-02 (contact address moved to the heliovulcan.com.au domain; the
founder bio and personal links added on 2026-08-24 were reverted at the owner's request).
Previously 2026-08-24 (third pass: homepage cut by a third and the founder named on it; the
three project-report descriptions moved to the Projects page; the flow diagram became four steps).
Previously 2026-08-23 (homepage de-duplicated, the platform page rewritten and renamed
"How it works", evidence grades renamed in plain English; see "Voice" below). Previously 2026-08-09 (repositioning for exploration-stage
work; anonymisation of the third-party asset screen).

## Positioning

> **Independent research on Australian industry, energy and emissions.**
>
> We use public data to answer practical questions about industrial facilities, energy use,
> emissions, regulation and proposed projects.

The governing principle:

> Direction may evolve, but the underlying evidence base should compound.

## Voice

The homepage was rewritten on 2026-08-23 because the brand copy had drifted into abstract,
symmetrical, methodology-flavoured prose. The rules that pass now apply to all new site copy:

1. One sentence, one idea.
2. Break the sentence if it strings more than three abstract nouns together.
3. Say "public data" or "the data" rather than "the evidence base".
4. Say "we could not confirm it" rather than "the record cannot settle it".
5. Do not use "question" as the all-purpose noun. Name the thing: facility, rule, cost,
   project, assumption.
6. Use em dashes sparingly (the homepage went from 34 to 10).
7. Explain the evidence grading once per page, not three times.
8. Headings say what the section contains; they are not aphorisms.
9. Active voice with a subject: "We analyse…", "We compare…", "We could not confirm…".
10. Keep technical terms, but gloss them in plain English on first use (Pre-DD, EIS, SLD,
    PV+BESS).

One or two shaped lines per page are worth keeping — "Most of the diesel is on wheels",
"A model is not a project", "A clear next step — which can be to stop", "Who can actually
decide". The failure mode was every paragraph trying to be one.

The site therefore does **not** commit Heliovulcan to one final product or service category.
Pre-DD is presented as one capability among several, not as the identity of the practice.

## The business model this has to survive

```
open research → policy engagement → commissioned intelligence → recurring intelligence → data / software products
```

The site does not claim any of the later stages already exist. It only needs an architecture
that can absorb them without another redesign. Concretely, that means:

- a **Research** hub whose topic taxonomy has room for work that has not been written yet;
- a **Consultations** page that exists before there is anything to put on it;
- a **How it works** page that explains the shared method rather than a single product;
- a **Latest work** block on the homepage that makes the site read as an active research
  operation, and that is trivial to automate later.

## Design system (2026-09-15)

The owner's brief: the site read as cluttered and piecemeal; restructure the layout on the model
of McKinsey's Australia site, keeping the colour palette. The palette tokens in `style.css` are
unchanged. What changed is one typographic and spatial system, applied through the existing
class names so that the 36 hand-written pages and the 210 generated pages restyled without
markup surgery:

- **Type.** Titles are the serif at regular weight, large (mastheads 50–56 px, section titles
  30–42 px, card titles 24 px). Section labels are small uppercase sans (12 px, tracked, 600),
  not mono, and carry no leading dash. Body 16.5 px; article body 18–19 px. Mono is reserved
  for code.
- **Mastheads.** Every page opens on the same navy band (`.hero`, `.case-hero`, `.res-hero`,
  the Atlas and facility heroes). Buttons on the band are white; text links are white with an
  amber hover.
- **Surfaces.** Square corners (`--radius: 0`), no shadows, no tinted panels, no pills or chips.
  Cards are columns separated by a hairline above (`border-top: 1px solid var(--ink)`); grids
  use a 40 px gutter. Notes, insights and method boxes are a 2 px left rule. Tables open with a
  2 px rule and use hairline rows, no box. Tags (Official / Modelled / Assumption, TEBA,
  above/below) are coloured small-caps text.
- **Buttons.** One solid button (navy). Everything that was an outline button is now a text
  link with an arrow. The nav CTA is a plain link separated by a hairline, not a pill.
- **Rhythm.** Sections 96 px; `.section--tint` is now the page ground with a top hairline
  rather than a grey block; content width 1180 px, reading column 760 px.

The system lives in the block headed `EDITORIAL SYSTEM` at the end of `style.css`, layered over
the original rules so that every earlier selector still resolves. Page-local `<style>` blocks
(index, intelligence-platform, consultations, research, coverage, safeguard-review) were aligned
by hand in the same pass; `ar.html` is a standalone card and was left as is. The Atlas and
facility templates carry the same rules in their scoped CSS.

### Colour roles restored (2026-09-15, later the same day)

The restyle above kept the palette tokens but broke the colour *roles* defined in
`bess_reports/DESIGN_SYSTEM.md` (Solar Forge Modernism: Albers colour discipline, Constructivist
information design). The owner noticed. Corrections, layout untouched:

- **Mastheads are light by default** (`.hero`, `.case-hero`, `.atlas-hero`, `.fp-hero`: warm paper,
  navy text, hairline below). Navy is reserved, per §8 of the design system, for point-of-view and
  flagship pages: the homepage hero, the Atlas overview (`.atlas-hero--navy`), the research long-read
  hero with its photo (`.res-hero`), `.section--navy` blocks and the footer. `.masthead--navy` is the
  opt-in modifier for any other page.
- **Orange is the one action colour** (§5, §12): `.btn--primary` is orange again, the nav CTA is an
  orange-bordered link, F1–F4 badges are flat orange, hover states use orange-deep. Buttons on navy stay
  orange (orange against navy is the Albers principle the system cites).
- **No off-palette colours**: the `#ffc79a` highlight on dark grounds is `--orange-lite`; page-local
  hero styles use tokens. Above/below-baseline badges on facility pages are amber/teal, the caution and
  positive semantics.
- Homepage "Explore the evidence" is a light tinted section, not a second navy block.

Before changing any public page again: read DESIGN_SYSTEM.md §5, §8, §12, §16–17, then ask whether
orange is still scarce and the only action colour, and whether navy appears only where a pause is meant.

## Navigation (2026-09-15, restructured)

Five entries, the logo is Home, one CTA. Desktop: each entry is a link to the section landing page plus
an arrow button that opens a two-column mega menu (browse / featured); hover opens on fine pointers,
click and keyboard everywhere; Escape closes. Below 980 px the same markup is a burger and an
accordion. The current section is underlined in orange. Second-level pages carry a breadcrumb rule
under the header. The bar compacts after 80 px of scroll.

| entry | landing | menu |
|---|---|---|
| Research | `research.html` | All research · Industrial & emissions · Energy markets · Investment & projects · Policy & regulation · Research approach · featured: Safeguard Atlas, diesel study, latest submission |
| Tools & data | `safeguard-atlas.html` | Safeguard Atlas · Facility explorer · Industry maps · Data & API · Methods · Coverage |
| Consultations | `consultations.html` | Consultation record · each submission page · How submissions are prepared |
| Projects | `case-studies.html` | Case studies · Remote mine hybrid-energy screen · Pre-DD methodology · Coverage |
| About | `about.html` | plain link |
| CTA | `about.html#contact` | Discuss a question |

The header, breadcrumb and five-column footer are one component, applied to every page by
`scripts/apply_chrome.py` (idempotent; root-relative links; also patches the Atlas and facility
templates in the workspace so a rebuild does not regress them). Edit the component there, then run
it. `How it works` is no longer a navigation entry: its method content is `methods/index.html`,
its evidence principles and audience table are on `about.html`, and `intelligence-platform.html`
redirects to `/methods/`. `Track record` is now called Coverage.

### Three layers: entry page, topic page, evidence page

The rule that governs the structure: **a landing page chooses, a content page reads, a method page
proves.** No page does more than one of those.

- Landing pages (Home, Research, Consultations, Projects, Tools & data): short, strong navigation,
  summary cards, no full content.
- Research articles: category and date, conclusion-style title, standfirst, key numbers, body,
  methods and sources, related research.
- Interactive tool (the Atlas): its own section navigation; one product, not seven sites.
- Evidence records (project entity, dataset, API, claims): reached from a case or from Tools & data,
  not from the main navigation.

## Duplication removal (2026-09-15, round 9)

The split into 43 pages had left the same explanation on several pages and a template skeleton
inside every research article. Rules now in force:

- **One home for each explanation.** `research-approach.html` is gone (redirect to `/about.html#discipline`);
  About carries one paragraph on evidence discipline and links to Methods. `consultations/method.html` is gone
  (redirect to `/methods/#consultation-submissions`); the Consultations index carries one text link to it.
  Coverage is a technical record under Projects ("Research coverage"), out of the main nav. Project entity,
  dataset and API are technical resources reached from the case report, not from the main nav.
- **Methods is four numbered steps** (Reconstruct · Test · Separate reported/calculated/assumed · Record
  uncertainty) plus Detailed methodologies and the consultation-submission method. No output preview, no
  public/internal boundary (that is About).
- **Section names come from the article, never from a template.** "Why this matters", "The Pre-DD takeaway",
  "What this changes in a screen" and "Three lessons for Heliovulcan" no longer exist. A heading states what the
  section concludes. The in-page contents nav is regenerated from the H2s.
- **H1 gives the conclusion; the first H2 goes to the evidence** and never restates the H1 (Atlas subpages,
  facility pages, submissions: The question / What the evidence shows / Recommendations / What remains
  unresolved / Sources / Related research).
- **"Not X, but Y" is rationed**: at most one such title per three articles (kept: Pre-DD screen, customer
  savings, weak-grid mines, connection queue). Meta-narration ("This note examines…", "This page sets out…")
  is deleted. Boundaries are stated twice at most: next to the number and in the footer. The per-article
  "Where an external source informs the argument…" line is gone; the footer disclaimer stays.
- **Descriptive URLs for the three notes**: `/research/btm-bess-customer-savings.html`,
  `/research/pre-dd-versus-feasibility-study.html`, `/research/weak-grid-mine-energy.html`, tagged
  "Research note · Project screening"; `note-1/2/3.html` redirect.
- **Research hub**: featured three are not repeated in the grid; H2 "Browse the research"; the count is a line
  under the filters, never a heading. Topics: Industrial & emissions · Energy markets · Battery projects · Policy analysis.
- **Case report order** (Remote Mining Asset): Executive summary → Readiness → Key findings → Risks → Next steps →
  Spatial → Sources and downloads, with one "Technical resources" line instead of a machine-access section.

Phrase counts over the 41 content pages, before → after this round: "is not" 124 → 54, "not a" 91 → 56,
"does not" 68 → 51, "rather than" 52 → 20, "This note/page" 12 → 1 (privacy), "Why this matters" 12 → 0,
"The Pre-DD takeaway" 16 → 0.

## Round 11: promises narrowed, duplication cut, series (2026-09-15)

Sixth editorial review. Changes and the rules they leave behind:

- **The Atlas overview is an executive landing page**: H1 and conclusion, three numbers, one summary
  chart, the sensitivity table as the findings, four doors (Pathway, Policy, Map, Facilities), one method
  line. The three-step calculation and the register explanation live only on the Pathway and Method pages.
  Rendered, the page is now well under 750 words; it was about 1,100.
- **No blanket promises.** "Every figure on this site…" is gone. The claim-ID / confidence / evidence
  structure exists for the structured project records (the Remote Mining Asset registry); research
  articles label material figures as reported, calculated or assumed. Methods and Data & JSON say exactly that.
- **Data & API is Data & JSON**: versioned static JSON at stable URLs, no search, filtering, write
  access or service level. The page lists what is available and what is not, and keeps the roadmap to one line.
- **One statement of the Remote Mining Asset's anonymity**, in a box under the hero; the footer keeps a
  two-sentence limit. The Spatial section no longer re-explains it.
- **Data-centre count stated on both dates**: 11 records in the 15 August 2026 NABERS extract, six still
  current on 14 September 2026 (expired ratings, not closures), ten of 11 on the Infrastructure scope.
  Homepage, consultations index and submission page carry the same three numbers.
- **Long-reads split**: the baseline-floor article keeps its argument (≈3,350 words, 15 minutes) and hands
  method, reconciliation, limitations, the s 56(4) register evidence, two secondary exhibits and the data
  tables to `safeguard/baseline-floor-method.html`. Cards label it "In-depth analysis · 15-minute read".
- **Research content types**: Interactive model · Quantitative analysis · In-depth analysis · Research article ·
  Research note · Reference. "Perspective" is retired. A **Battery project readiness series** (nine pieces,
  numbered, prev/next bar at the top of each) replaces nine similar-looking stand-alone articles.
- **Submission pages**: The question · Key findings · Recommendations · Open questions · Sources · Related research.
- **Language**: the metaphor density in the customer-savings note and its neighbours is reduced to
  professional statements (no costumes, chairs, seductive numbers, quiet failures); first person removed;
  "The honest…" → "The appropriate…"; industry-map titles in sentence case with one specific caption each.
- **Facility pages** open with a one-line decision summary: FY2024-25 position and the modelled FY2034-35
  position under current settings.

## Round 12: submission-grade evidence standard for every piece (2026-09-15)

Seventh review: the site had been audited for editing and structure, not for whether each article met
the evidence standard the submissions meet. Rules now in force:

- **Content types by evidence, not by topic**: Quantitative analysis (a data set, a stated calculation,
  a checkable result) · Interactive model · Submission · Applied case · Analytical framework (a method or
  decision structure; no representative sample claimed) · Practitioner note (professional judgement from
  screening work and cited industry sources) · Reference. The legend sits on the research hub. Today:
  diesel, baseline floor and the funding map are Quantitative analysis; nine BESS pieces are Analytical
  framework; time-to-power, capital and readiness, emerging markets and weak-grid mines are Practitioner notes.
- **Every research piece opens with the same five-line box**: Question · Basis · Method · Finding · Limits.
  A framework says so in Basis ("no claim of a representative market sample") instead of borrowing the
  register of a quantitative study.
- **Titles state no more than the evidence supports**: "Grants pay for the first one, not the tenth" →
  "Public funding is concentrated in first-of-a-kind mine-energy projects" (3 of 23, first-of-a-kind, "not
  found" ≠ "no support"); "Capital is available…" → "Project readiness can constrain battery deployment
  before capital availability does"; "most valuable part" → "can materially improve"; "emerging markets"
  → "projects dependent on concessional or development finance"; time-to-power is conditional on slow
  connection; demand charges are conditional on demand-based tariffs.
- **Submission pages carry two-date facts, not a correction footnote**: the data-centre page shows
  4,658 rows · 11 records · 6 current at verification · 10 of 11 Infrastructure scope, with a dated
  Data update box directly under the numbers, a note under the finding that changed, and a revision
  history at the foot. "Current-ratings extract" is now "the complete ratings extract downloaded on
  15 August 2026", with the validity re-check described in Sources.
- **Submission page grid**: prose 760 px, findings, recommendations and numbers 900 px, all left-aligned;
  hero metadata in two fixed columns; finding titles in sans 17.5 px with the qualifying condition in
  the title itself; recommendations as three numbered cards, each written in full.

### Round 13: say the specific thing (2026-09-16)

Two sentences had been made abstract to sound like research. Rules:

- **The homepage sentence names the inputs, the object, the check and the labels**: "We build facility- and
  project-level accounts from regulatory filings, licences and company disclosures. We cross-check the key
  figures against independent sources and identify what is reported, calculated, assumed or still unknown."
  No "reconstruct facilities", no "test the numbers", no "how far the record supports each one".
- **A submission title states the finding, not a slogan.** The data-centre page is now "Australia
  regulates data centres through multiple systems, but cannot trace one facility across them", with the
  crosswalk explained in the standfirst; the lodged PDF keeps its official title and the page says so.
  Findings say what was found in the sources reviewed ("no public crosswalk was found", "the threshold sits
  in the National Electricity Rules, which do not operate in WA or the NT", "did not describe … in one
  proposal reviewed") rather than blanket verdicts ("has the data", "does not reach", "unreliable").
  Recommendations share one verb: connect the records, connect the regulatory perimeter, connect the measures.
- **When a title changes, everything changes with it**: `<title>`, meta and Open Graph descriptions,
  structured data, the consultations card, the homepage card, related-research cards and the breadcrumb
  (regenerated from `<title>` by `apply_chrome.py`).

### Round 14: the decline-rate submission on the site, and the PDF–site reconciliation (2026-09-16)

- **Submission page**: `consultations/safeguard-decline-rate-2026.html`, PDF at
  `submissions/Heliovulcan-Submission-2026-SMR-Post-2030-Decline-Rate.pdf` (38 pages). The workbook is
  not published. Status line reads "To be lodged …" until the lodgement date is known, then
  "Lodged with DCCEEW on <date> in the 2026-27 Safeguard Mechanism Review; the Department's published
  version will be linked when available". Copyright and reuse terms stay on page 2 of the PDF; the footer
  keeps its © line.
- **Corrections rule is live**: the page carries a Corrections section. Any material correction is
  recorded there with the date, the original figure, the corrected figure and the source, and notified
  to DCCEEW, as Annex H.2 of the submission undertakes.
- **Facility count**: the Regulator counts 208 covered facilities on 209 register rows (Telfer Gold Mine
  twice after a mid-year change of operator; 228 rows less 19 eligible facilities under s 58B). The site
  now headlines 208 everywhere and says "rows" only where rows are meant (the facilities table, the map,
  the register-change comparison). The trade-off statements use "the other 187 facilities", as the PDF does.
- **Other figures checked against the PDF and found consistent**: 3.53 / 5.99, 68.8 / 54.3 Mt, 70.25 Mt
  at the legislated 3.285, 21 trade-exposed facilities, 17.0 Mt / 2.59 Mt pipeline, 607.7 Mt × 29.8%,
  412.8 / 369.3 Mt budgets, seven confirmed closures, ERC 0.902 → 0.657. The Policy page's five-year
  cumulative (393 Mt) is under the settings in force; the PDF's 388 Mt is at the solved rate.

### Facility locations are not documented on the site (owner decision, 2026-09-16)

The Atlas map places each register row by Heliovulcan's own geocoding and shows a confidence grade
(A: two independent references agree; B: one reference, or references a few kilometres apart; C:
references disagree, open circle). The references, the matching rules and the per-point workings are
part of the facility layer and are deliberately not published: not on the map page, not in the method
page's source table beyond a labelled "Modelled" row, not in the page data (per-point notes are stripped
at build time) and not in the public JSON (the map layer is omitted). No modelled figure depends on a
location, so the evidence ledger for the numbers is unaffected.

### Round 16: sentences no stronger than the evidence (2026-09-16)

Ninth review, on the rebuilt diesel study and the rest of the research. Rules that now hold:

- **A title states the direction and the condition, not a certainty**: "may not appear in current electricity
  data" (not "invisible"); "also tightens baselines for facilities already covered" (not "does more");
  "buy reliability as well as energy" (not "do not buy cheap energy"); "for early-stage battery projects …
  than headline capital availability"; "for customers on demand-based tariffs".
- **What the accounts cannot split is not asserted**: the national accounts do not separate mobile from
  stationary mining diesel, so the text says "appears to be predominantly mobile use", the bar chart's last row
  is "reported mining diesel pool, not split by equipment type" in a neutral colour, and the funnel's second
  layer is "not quantified; the reconciliation indicates it is the majority". A chart never concludes more
  than the text.
- **"Not found" is written as not found**: no public funding record was identified for 20 of 23 projects;
  absence of a record is not proof that none was received.
- **Derived numbers carry their derivation**: the 25–35 MW installed-capacity figure states the
  average-to-installed ratio it comes from and that it is indicative.
- **Neutral policy vocabulary**: the fuel tax credit lowers the private cost of each litre relative to its
  excise-inclusive price; it is not called a subsidy.
- **Three registers, deliberately**: quantitative pieces read data → method → result → limit; frameworks
  define the decision, show the steps and say when to use them; practitioner notes give a common problem,
  its implication and the questions to test. A few characterful headings stay ("Most of the diesel is on
  wheels", "Average energy is not charging capacity", "Customer savings are not project revenue"); the body
  underneath returns to evidence language.

## Round 17: research and insights are different things (2026-09-16)

Tenth review. The research hub had been laying four quantitative studies, a dozen 600–1,200-word notes,
method pages and framework diagrams out as identical cards, and "Tools & data" had one tool, a poster
page and a one-project JSON catalogue. Now:

- **Research** (`research.html`) holds only work with an original data set or model, a stated method, a
  quantified finding and its sources, assumptions and limitations: the Safeguard Atlas (interactive model),
  the mine-electrification load study (quantitative sector analysis), the baseline-floor study (quantitative
  policy analysis) and the mine-energy public-funding study (project-register analysis). Each card shows type,
  question, finding, data scope, date and reading time. Below them, a light "Latest insights" list.
- **Insights** (`insights.html`) holds the short notes, typed Project insight · Market insight ·
  Financeability insight · Practitioner note, on light list rows (type · title · one line · read time). No
  big numbers, no five-line evidence box; each note names its basis and sources in its provenance block.
- **Merges**: demand charges + revenue/debt + customer savings → *From customer savings to financeable BESS
  cashflow* (`research/btm-bess-customer-savings.html`; the other two URLs redirect); weak-grid + time-to-power
  → *Screening energy options for weak-grid and off-grid mines* (`research/weak-grid-mine-energy.html`;
  time-to-power redirects); the five readiness notes stay separate under a series landing page
  (`insights/battery-project-readiness.html`, numbered 01–05 with prev/next bars); the concessional-finance
  note is withdrawn (redirects to Insights) until it has a specific region, institution or case; the Pre-DD
  vs feasibility page is a method and is listed under Methods.
- **Framework diagrams live where they are used**: development process → Pre-DD F1–F4 methodology; path to
  financial close → readiness series page; who-does-what → hybrid review note; remote mine power architecture
  → weak-grid note; stakeholder map → cashflow note. `industry-maps.html` redirects to `/methods/#frameworks`,
  where a table says where each diagram went.
- **Navigation** (as of 2026-09-16, later): Research (columns: Research reports and models · Insights · Methods | Featured) · **Data & tools** (a plain link to the Safeguard Atlas; its sub-pages are reached from the Atlas's own sub-navigation and downloads from its method page) · Consultations · Projects · About. "Data & JSON" is gone from the main navigation as a product; the JSON stays and is
  reached from the Remote Mining Asset pages. Downloads sit inside the product pages: the Atlas method page
  now has a Downloads table (model-inputs JSON, a 209-row facility CSV, a short data dictionary).
- A Data catalogue returns only when there are at least three independent data sets with record counts,
  CSV/JSON, a dictionary, a licence, an update date and a preview.

## Homepage (2026-09-15, six modules)

1. **Hero** — one sentence of value: *Independent analysis of Australian industrial assets, energy
   and emissions*, one line on what we do, two buttons (Explore the research / Discuss a question).
2. **Selected findings** — three cards, each with content type, conclusion-style title, one key
   number, two lines and a date: Safeguard Atlas, the diesel study, the AI and data centres submission.
3. **What we analyse** — three capabilities (industrial assets, energy projects, markets and policy),
   each linking to its section. No method on the homepage.
4. **Flagship tools** — a navy band: Safeguard Atlas, Industry maps, Data & API.
5. **Selected project** — the Remote Mining Asset case: the question, F1–F4 in one line each, one
   image, Read the case.
6. **Trust strip and contact** — one sentence on sources and labelling, then the final CTA.

Everything that used to sit on the homepage now lives on an inner page: the asset-analysis cards and
the evidence ladder on `methods/`, the output types and audience table on `about.html`, the
Pre-DD outputs on `case-studies.html`, the About and Contact sections on `about.html`. Legacy
anchors `#about` and `#contact` now resolve on `about.html`.

## Consultations (2026-09-15, three layers)

- `consultations.html` — why we make submissions, then one summary card per submission (type and
  date, conclusion-style title, institution, three numbers, two links), one method sentence, one CTA.
- `consultations/<slug>.html` — one page per submission: title and one-sentence finding, metadata,
  three numbers, key findings, recommendations, then evidence used, unresolved matters and sources
  folded, the PDF, related research.
- `consultations/method.html` — which consultations are in scope, what each record contains, the
  evidence discipline, the bodies monitored, no relationship implied.

## Research hub (2026-09-15)

Featured research (three cards), then all published work in one grid with topic filters
(`#industrial`, `#markets`, `#investment`, `#policy`, `#maps` select a filter on load). Every card
shows type, topic, conclusion-style title, an optional key number, one-line summary, date and read
time. The themes moved to `research-approach.html`; the in-preparation list became one line.

## Research

`notes.html` became `research.html`. The old URL is kept as a redirect stub (canonical tag plus
meta-refresh and `location.replace` — GitHub Pages cannot issue a 301). **Every individual note
keeps the URL it always had**; only the index moved.

Topic taxonomy, deliberately not all equally populated:

| Topic | Published |
|---|---|
| Industrial & Emissions | 2 |
| Energy Markets | 3 |
| Investment & Projects | 9 |
| Policy & Regulation | 1 |

The imbalance is stated on the page rather than hidden. Policy & Regulation is the newest topic
and the page says so.

## Consultations

The page exists; the record is empty, and it says so plainly. **No submission has been
published to date** and none is invented. What the page does carry:

- an explicit empty state;
- the seven-field record format each future entry will use (field names only — no fabricated
  values);
- what is in and out of scope for a submission;
- the bodies whose open processes are monitored (CCA, DCCEEW, AEMO, AER, AEMC), with an
  explicit statement that no relationship, appointment, accreditation or endorsement exists
  with any of them.

When the first submission lands, add an entry above the record-format section using those seven
fields, and swap the homepage `#latest` consultation slot from the pending panel to a card.

## Safeguard Atlas (`safeguard-atlas.html` + `facility/`)

Added 2026-09-15. The model behind the decline-rate consultation submissions, published as a page
that recomputes in the reader's browser. Three things and deliberately not more: the national
pathway, a policy simulator, and a searchable table of the 209 facilities in the FY2024-25 register.

**Both are generated.** The layout source is in the *bess-workspace* repo at
`tools/consultation_kb/atlas/{atlas_template.html, facility_template.html}`; the pages here are
build output and editing them directly will be overwritten by the next build. To rebuild:
`bake_data.py` → `build_facility_pages.py` → `build_atlas.py`, in that order.

What makes it defensible rather than just interactive:

- **The page proves itself.** A self-check at the foot re-runs 135 figures from our published
  submissions — FY2034-35 net emissions, the decline rate needed for a 62% and a 70% target, the
  five-year cumulative, across three facility populations and five ways of treating the
  trade-exposed facilities, plus both iso-target curves — and prints whether this browser
  reproduced them. If the engine drifts from the one behind the submission, the line goes red.
- **Every number carries a provenance label**: Official (published), Modelled (calculated here),
  Assumption (a stated judgement the reader can change), Yours (a control).
- **Scenario permalinks.** The controls encode into the URL fragment, so a scenario can be sent to
  someone else.
- **It refuses to count what it cannot count.** The methods section publishes the churn between the
  two registers and then explains why we do *not* turn it into an entries-and-exits number: names
  change, and a change of operator part-way through a year puts one facility in the register twice.

**One page per part (2026-09-15, later the same day).** The owner's second brief: too much on one
page, and quantitative panels mixed with qualitative prose. The Atlas is now an overview plus seven
section pages, on the McKinsey pattern of an overview that opens onto one-topic pages:

| page | holds |
|---|---|
| `safeguard-atlas.html` | the register as published (six figures) and seven tiles, one per part |
| `safeguard/pathway.html` | the national series to FY2039-40 |
| `safeguard/scorecard.html` | what the rule alone explains between the two registers |
| `safeguard/policy.html` | the settings, the rate required, the iso-target curve, the decomposition |
| `safeguard/map.html` | the map with location grades |
| `safeguard/facilities.html` | the 209-row table |
| `safeguard/sandbox.html` | a facility not in the register |
| `safeguard/method.html` | sources, register changes, verification, limitations |

The settings chosen on the policy page carry across the other pages (localStorage, and the
`#s:` fragment for a shareable link); pathway, map, facilities and sandbox open with a one-line
"settings in force" strip linking back to the policy page. All pages share one engine,
`assets/safeguard-atlas.js`, and each inlines the data so nothing is fetched. The masthead of
every page carries the section navigation. `safeguard/` redirects to the overview. Layout source:
`tools/consultation_kb/atlas/parts/` (shell, section fragments, engine) assembled by `build_atlas.py`.

**Narrative order, not database order (2026-09-15, third brief).** The owner's third note: the
site read as a regulatory data tool, not a conclusion-driven research report, because readers met
definitions and controls before they met a finding. The rules that now govern the Atlas, and any
research page after it:

- The title states the finding, not the product. *The post-2030 decline rate cannot be set in
  isolation*, then one line saying what the model is.
- Three headline numbers directly under the masthead, each answering a question, all computed
  by the engine from the starting-point assumptions (never typed in): FY2034-35 modelled compliant
  emissions, the post-2030 rate required for a 62% target, the number of register rows. Then one
  paragraph beginning *Our analysis finds…*.
- Page order follows an executive reader: findings → what the model shows (pathway) → what changes
  the result (policy settings) → explore the evidence (map, facilities, sandbox) → what has changed
  (scorecard) → method. The scorecard and the map are evidence, not the story, and sit after it.
- Every section heading gives the answer; the body gives the evidence. Headings with numbers in
  them are rendered by the engine (`start-h2`, `scorecard-h2`, `map-h2`, `facilities-h2`) so they
  cannot drift from the data.
- Chart convention: the chart title is the conclusion (*Modelled compliant emissions fall to
  70.25 Mt…*), one line of units and scope beneath it, `Heliovulcan analysis` at the right, and one
  source line below; the full method sits in a folded block.
- Three tiers of visual weight: the finding (masthead, big numbers, the full-width core chart);
  the evidence (charts with conclusion titles and a short paragraph); the audit material
  (methods, sources, tables, control explanations), folded or last.
- Say the boundary once. Disclaimers appear in the footer and once in the method page; the
  sandbox says once that nothing is stored.
- No manual voice: no *This section shows…*, *The first… The last…*, *Nothing on this page…*.
  Active judgements (*Our analysis finds…*), short sentences allowed, specific subjects (*The
  Regulator publishes…*, *The model applies…*).

The overview also carries a *What changes the result* table: one setting moved at a time from the
starting point, with the FY2034-35 figure and the rate required for 62% under each.

`facility/<slug>.html` — one page per register row, not per facility. Where a facility name appears
twice in one register (Telfer Gold Mine in FY2024-25) each row gets its own page, disambiguated by
responsible emitter in the slug, and each page says plainly that the other row exists and that the
two should not be added together. `facility/index.html` is the directory, by state.

Added later the same day, once each had the evidence discipline it needed:

- **A map** (`#map`). 175 of 209 rows are placed; each dot carries a mechanical location grade —
  A (single NPI site, 131), B (one of several NPI sites mapped to the facility, 37), C (placed
  through a name pair that has not been adjudicated, 7, drawn hollow) — and the 34 rows with no
  coordinate we are willing to publish are listed by name rather than guessed. The state outline
  is the same equirectangular drawing (27°S standard parallel) as the data-centre map; the file is
  `docs/research/australia/consultation-kb/dc_map_au_paths.json` in the workspace.
- **An assumption scorecard** (`#scorecard`). The first score that can be taken with two registers:
  for the 183 facilities continuing under the same name, the ERC step alone predicted 114.79 Mt of
  FY2024-25 baselines and the register said 114.48. This year's forward assumptions (production
  factors, decided closures, pipeline ramp, TEBA end dates) are stored in `data/safeguard-atlas.json`
  under `assumptions`, stamped with the model date, so the FY2025-26 register can be scored against
  what was actually assumed rather than what is remembered.
- **A facility sandbox** (`#sandbox`). Production × intensity or a known baseline, TEBA option,
  abatement, break-even abatement and rate sensitivity. Nothing typed is stored or sent.

### What is deliberately not there yet

- **The s58B ten-year eligibility window.** The full engine models it; this page counts each
  facility until it closes, and says so.
- **Adjudication of the ten name pairs.** Listed, graded, not decided.
- **An NPI pollutant layer on the facility pages.**

## How it works (`intelligence-platform.html`)

Called *Platform* until 2026-08-23. The word set an expectation — software, a database, a live
feed — that the page then spent several paragraphs dismantling. The nav label is now **How it
works**; the file name stays `intelligence-platform.html` so no link breaks, and "platform" is
fine as an internal name.

`#evidence-base` shows the entity graph:

```
Company ↔ Facility ↔ Project ↔ Energy ↔ Emissions ↔ Grid ↔ Technology ↔ Approval ↔ Capital
```

and four ways to use it (policy / investment / asset / energy). One bounding note states what it
is not: not client-operated software, not a public database, not a live or complete national
dataset. It used to say this twice, in two adjacent blocks; one is enough.

### Evidence labels

The six grades are named in plain English, not in house codes, and the same words are used on
the homepage example panel and in the output preview:

| was | now |
|---|---|
| Filed | Regulatory filing |
| Licensed | Licence record |
| Disclosed | Company disclosure |
| Derived | Calculated |
| Owner | Owner data required |
| Absent | Not publicly available |

If you add a grade, add it in all three places and keep the wording identical.

## Anonymising third-party asset screens

A screen built from public records, without the asset owner's involvement, is published
**without naming the asset**. Two reasons, and the second is the one that actually bites:

1. A named real-world project plus project-specific siting maps implies a closer relationship
   with the owner than exists, however clearly the disclaimers say otherwise.
2. Detailed mine-site GIS over-weights one service line at exactly the point where the practice
   is broadening. Site-specific spatial output is commissioned work, not a public brochure.

The worked case is published as **Remote Mining Asset — Hybrid Energy Pre-DD**, described where
useful as *a publicly documented Northern Territory gold mining project*. The slug is
`remote-mining-asset` throughout: pages, data files, entity ID (`project_remote_mining_asset`),
claim IDs (`RMA-*`), evidence IDs (`EVID-RMA-*`) and API paths. Anonymising the visible page and
leaving the name in a URL or a JSON payload would have been theatre.

### What was withdrawn from public presentation — and what came back

The first column is the state 958bb5f withdrew it to. The second is where it stands now:
5eaab48 (9 August 2026) restored the maps and the PDF downloads, and this table was not
updated at the time.

| | Withdrawn to | State today |
|---|---|---|
| `context_map.html`, `siting_opportunity_constraint_screen.html` | Unlinked everywhere, `noindex`, `robots.txt` disallow, absent from the sitemap. | **Public again.** Anonymised in content, linked from the report page, `noindex` removed, disallow dropped, back in the sitemap. |
| Both named-asset PDF reports | All download links and labels removed; available on request. | **Downloadable again** from the report page, under the independence disclaimer. Filenames still carry the asset name. |
| `assets/predd-siting-zones-map.png` | Already unreferenced; renamed off the asset name and robots-disallowed. | Still unreferenced. The disallow is gone with the rest of the stanzas. |
| The map pin on the case index | Now hollow and deliberately imprecise — region, not site. | Unchanged. |

⚠ **Open, deliberately left as it stands (16 August 2026).** The report page carries the
withdrawal-era sentence — *"They name the asset, so they are no longer offered as public
downloads"* — directly above the two download links restored in 5eaab48. Prose and links
disagree, and the two filenames are the only place on the site where the asset is named.
Reviewed and left unchanged pending a decision on which side is right.

`robots.txt` no longer carries any `Disallow`. When it did, it used patterns (`/reports/*.pdf`)
rather than filenames — it is itself a public file, and spelling the asset name there would leak
exactly what the pages withhold. That constraint still applies to anything added later.

`robots.txt` disallow is a crawling signal, **not access control**. Files are fetchable by direct
URL because GitHub Pages serves everything in the repo. If something needs to be genuinely
unreachable, it has to leave the served branch.

### What stayed

The F1–F4 workflow, every figure, every evidence grade, the open questions, the owner-data
requests, and the full claim and evidence registry. GIS remains described as a capability on the
platform and methodology pages — the method is public, the site-specific output is not. The
aggregated national facility map is untouched: it supports the industrial-intelligence
positioning and performs no site selection for anyone.

### `withheld` vs `unresolved`

Anonymising broke a citation chain, and the fix is a new evidence status rather than a quiet
deletion. `scripts/build_api.py` now accepts a null `source_url` when status is either:

- **`unresolved`** — we never captured the source. A gap in our own record.
- **`withheld`** — we hold it and it is public, but the link identifies the asset. Requires a
  `withheld_reason`; the validator fails without one. Document class, date and section are still
  published, so the citation stays checkable on request.

The generated claims table renders the actual status, so the two are never conflated.

### Old URLs

Redirect stubs at `reports/fountain-head-hybrid-energy-review.html`,
`projects/fountain-head/` and `datasets/fountain-head-pre-dd/`. The three old API endpoints
return a small `{"status":"moved","moved_to":…}` pointer, since static hosting cannot redirect
JSON. Those paths still contain the old name — unavoidable if old links are not to break, and
the stub content itself names nothing.

## Evidence discipline — the part not to lose

This is the strongest thing the site has and none of the repositioning weakens it:

- every figure carries an evidence grade (filed / licensed / disclosed / derived / owner /
  absent);
- what the public record cannot settle is named, not estimated into place;
- the ~8,000 *mapped* sites and the much smaller *analysed in depth* count are kept distinct
  wherever either number appears;
- no claims of clients, datasets, regulatory roles or institutional relationships that are not
  evidenced;
- no `leading` / `best-in-class` / `trusted by` language.

## Commercial positioning — sell the conversation, not a package

During exploration the site does **not** package itself around a paid-service funnel. The point
is to maximise useful market conversations; a price list narrows them before they start. If
repeated paid demand later reveals a standard product, pricing can be introduced then.

Removed from the public pages, and not to be reintroduced without a decision:

- public pricing or fixed package prices
- `free` framing of any kind — no free screen, no free sanity check, no "no fee" bullet
- success-fee, milestone-fee and success-linked structures
- the `Free → Asset Review → Pre-DD → success fee` ladder, and the A/B/C/D persona cards that
  asked visitors to classify themselves before making contact
- the Founding Projects Program note

It was **not** replaced with a commissioned-research price table. The contact section is now
one invitation:

> Heliovulcan is open to discussions around industrial, energy, emissions, policy and investment
> questions where independent evidence or analysis may be useful.

A light commercial signal stays, so the site does not read as an NGO or a university page:
*some of the work stays open and is published here, some is commissioned, and which one a
question turns into is worked out in the conversation.* Pre-DD capability remains fully visible
— what is gone is the price and package mechanics around it.

### CTAs

Two primary calls to action sitewide, and nothing else competing with them:

| | |
|---|---|
| **Explore our research** | `research.html` |
| **Discuss a question** | `index.html#contact` → `mailto:` |

Hard lead-generation copy (`Book a 20-min screen`, `Book a 20-minute project screen`) is gone.
Contact functionality is unchanged — the same `mailto:` routes remain. Note that
`cases/render.js` appends a CTA block to **every** case page automatically; it carries the same
framing, so change it there rather than per-case.

What survives under `#contact` is not a service menu: what an answer looks like, where you need
a professional instead, optional context that sharpens a site-specific question, and the service
boundary. Those are evidence discipline, not packaging.
