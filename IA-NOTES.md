# Information architecture notes

Why the site is shaped the way it is, so future changes stay aligned rather than drifting back
toward a single-service brochure.

Last revised: 2026-08-09 (repositioning for exploration-stage industrial intelligence).

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
6. **Project analysis** (`#projects`) — F1–F4, the Fountain Head case, and the three sample
   outputs. One application of the evidence engine.
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

## CTAs

Hard lead-generation copy (`Book a 20-min screen`, `Book a 20-minute project screen`) is gone
sitewide, replaced by `Discuss a question` and `Explore our research`. Contact functionality is
unchanged — the same `mailto:` routes remain, and the engagement pathways are still documented
under `#contact`, reframed as *how work is scoped* rather than a service menu.
