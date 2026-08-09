# Information architecture notes

Why the site is shaped the way it is, so future changes stay aligned rather than drifting back
toward a single-service brochure.

Last revised: 2026-08-09 (repositioning for exploration-stage industrial intelligence;
anonymisation of the third-party asset screen).

## Positioning

> **Independent intelligence for Australian industry, energy and investment.**
>
> We connect facility, energy, emissions, project, regulatory and commercial evidence to answer
> questions that matter to policy, investment and industrial decisions.

The governing principle:

> Direction may evolve, but the underlying evidence base should compound.

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
- a **Platform** page that explains a shared evidence base rather than a single product;
- a **Latest work** block on the homepage that makes the site read as an active research
  operation, and that is trivial to automate later.

## Navigation

| | |
|---|---|
| **Home** | `index.html` |
| **Research** | `research.html` |
| **Consultations** | `consultations.html` |
| **Platform** | `intelligence-platform.html` |
| **Projects** | `case-studies.html` |
| **About** | `index.html#about` |
| **Discuss a question** (CTA) | `index.html#contact` |

`coverage.html` (Track record) left the primary nav to keep it to seven items. It is reachable
from the footer on every page and is linked inline from the homepage platform section, the
research page and the platform page — it is not orphaned.

Nav and footer markup is duplicated in every page (no templating layer). It is kept identical
across all 32 pages; if you change one, change them all.

## Homepage content hierarchy

1. **Hero** — independent industrial intelligence positioning. CTAs are `Explore our research`
   and `Discuss a question`. The graded example panel stays: it is the fastest signal of the
   evidence discipline.
2. **Latest work** (`#latest`) — three fixed slots in order: consultation, research, project.
   Update the three cards in place when new work publishes.
3. **Four domains** (`#domains`) — industrial assets · energy and emissions · policy and
   regulation · projects and investment.
4. **Research & policy** (`#research`).
5. **Asset & market intelligence** (`#asset-market`) — absorbs what used to be a standalone
   2029 Safeguard exposure section. The Safeguard material is now framed as a worked example of
   the method, not as the site's lead hook.
6. **Project analysis** (`#projects`) — F1–F4, the anonymised Remote Mining Asset case, and
   what a project screen produces. One application of the evidence engine.
7. **Evidence platform** (`#platform`).
8. **Point of view**, **About** (`#about`), **Discuss a question** (`#contact`).

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

## Platform

Strengthened with `#evidence-base` — *One evidence base. Different questions.* It shows the
entity graph:

```
Company ↔ Facility ↔ Project ↔ Energy ↔ Emissions ↔ Grid ↔ Technology ↔ Approval ↔ Capital
```

and four traversals of it (policy / investment / asset / energy). A bounding note states what
the graph is not: not complete national coverage, not queryable, not a live feed.

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

### What was withdrawn from public presentation

| | |
|---|---|
| `context_map.html`, `siting_opportunity_constraint_screen.html` | Kept in the repo as internal GIS capability. Unlinked everywhere, `noindex`, `robots.txt` disallow, absent from the sitemap. |
| Both named-asset PDF reports | Kept in the repo. All download links and labels removed; available on request. |
| `assets/fountainhead-zones-map.png` | Already unreferenced; now robots-disallowed. |
| The map pin on the case index | Now hollow and deliberately imprecise — region, not site. |

`robots.txt` disallow is a crawling signal, **not access control**. These files are still
fetchable by direct URL because GitHub Pages serves everything in the repo. If they need to be
genuinely unreachable, they have to leave the served branch.

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
