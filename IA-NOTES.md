# Information architecture notes

Why the site is shaped the way it is, so future changes stay aligned rather than drifting back
toward a single-service brochure.

Last revised: 2026-08-23 (second pass: homepage de-duplicated, the platform page rewritten and
renamed "How it works", evidence grades renamed in plain English; see "Voice" below). Previously 2026-08-09 (repositioning for exploration-stage
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

## Navigation

| | |
|---|---|
| **Home** | `index.html` |
| **Research** | `research.html` |
| **Consultations** | `consultations.html` |
| **How it works** | `intelligence-platform.html` |
| **Projects** | `case-studies.html` |
| **About** | `index.html#about` |
| **Discuss a question** (CTA) | `index.html#contact` |

`coverage.html` (Track record) left the primary nav to keep it to seven items. It is reachable
from the footer on every page and is linked inline from the homepage platform section, the
research page and the platform page — it is not orphaned.

Nav and footer markup is duplicated in every page (no templating layer). It is kept identical
across all 32 pages; if you change one, change them all.

## Homepage content hierarchy

1. **Hero** — independent research positioning. CTAs are `Explore the research`
   and `Discuss a question`. The graded example panel stays: it is the fastest signal of the
   evidence discipline.
2. **Latest work** (`#latest`) — three fixed slots in order: consultation, research, project.
   Update the three cards in place when new work publishes.
3. **Four domains** (`#domains`) — industrial assets · energy and emissions · policy and
   regulation · projects and investment.
4. **Research & policy** (`#research`).
5. **Existing operations** (`#asset-market`, was "Asset & market intelligence") — absorbs what used to be a standalone
   2029 Safeguard exposure section. The Safeguard material is now framed as a worked example of
   the method, not as the site's lead hook.
6. **Project analysis** (`#projects`) — F1–F4, the anonymised Remote Mining Asset case, and
   what a project screen produces. One application of the evidence engine.
7. **Where the information comes from** (`#platform`) — deliberately short: the figure, the
   8,000-mapped-versus-analysed distinction, and a link out. The method itself lives on the
   How it works page, so the homepage does not explain it twice.
8. **About** (`#about`), **Discuss a question** (`#contact`). The navy **Point of view** band was
   removed on 2026-08-23: by that point the page had already said the same thing four times.

### Legacy anchors

The old section ids are preserved as empty anchor spans so existing deep links still land
somewhere sensible: `#two-ways` → domains, `#exposure` → asset-market, `#lens` / `#case` /
`#reports` → projects, `#why` → contact. `#about` and `#contact` are unchanged and carry the
great majority of inbound anchor links.

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
