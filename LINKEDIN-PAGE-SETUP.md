# LinkedIn company page — setup copy

The site is already wired to `linkedin.com/company/heliovulcan`: every footer carries the link,
and the `Organization` JSON-LD claims it under `sameAs`. This file holds the copy for the page
itself, so the two sides say the same thing.

Creating the page has to be done by hand — it needs your own LinkedIn login.

## Before you start

- You need a personal LinkedIn profile to create the page from. LinkedIn requires the profile to
  be a few days old, to have some connections, and to list Heliovulcan in its Experience section
  before it will let you create a page. If page creation is blocked, that check is usually why.
- Start at **linkedin.com/company/setup/new** → *Company*.

## Fields

| Field | Value |
|---|---|
| Name | `Heliovulcan Energy Advisors` |
| LinkedIn public URL | `linkedin.com/company/heliovulcan` — **claim exactly this**, the site links to it |
| Website | `https://heliovulcan.com.au/` |
| Industry | Business Consulting and Services (second choice: Research Services) |
| Company size | 0–1 employees |
| Company type | Self-employed (or Privately Held, if it is a company rather than a sole trader) |
| Location | Australia — add the city you want on the record |
| Logo | `heliovulcan-linkedin-logo-300.png` (300×300) |
| Cover | `heliovulcan-linkedin-cover-1128x191.png` (1128×191) |
| Custom button | *Visit website* → `https://heliovulcan.com.au/` |

### Tagline

> Independent research on Australian industry, energy and emissions.

### About / Overview

> Heliovulcan is an independent research and analysis practice focused on Australian industry, energy and emissions.
>
> We use public data to answer practical questions about industrial facilities, energy use, emissions, regulation and proposed projects. The sources are regulatory registers, energy and emissions accounts, pollutant inventories, maps and company reports. We check them against accounts we build ourselves. Every figure is linked to a source and marked by evidence quality, and if the public data cannot answer something, we say so.
>
> Three kinds of work:
>
> Research and policy engagement — published analysis and public consultation submissions on industrial energy, emissions, market structure and policy exposure, open so the reasoning can be checked.
>
> Existing asset intelligence — facility-level analysis of an operating site: what it burns and what it buys, its Safeguard Mechanism position to 2029 including the statutory baseline floor, who actually controls the power station, and where it sits in its sector.
>
> Project screening (F1–F4 Pre-DD) — four connected questions for a project that does not exist yet: Approval Delta, Site Suitability, Microgrid Boundary and Financeability Readiness. A screen of readiness, not a verdict on the project.
>
> This is desktop analysis from public information and agreed inputs. It is not legal, financial, tax, engineering, investment or lender due-diligence advice, and every result must be independently verified before any commercial, financing or construction decision.
>
> Start with the question: heliovulcan.com.au

### Specialties

Independent energy research · Industrial emissions analysis · Safeguard Mechanism exposure ·
Facility-level asset intelligence · Pre-development due diligence · BESS and PV feasibility ·
Hybrid energy systems · Diesel displacement · Remote and off-grid power · Grid connection
assessment · Energy market analysis · Project financeability screening · Spatial and siting
analysis · Mining decarbonisation · Policy submissions · Public-record research

### Community hashtags (up to 3)

`#SafeguardMechanism` `#MiningDecarbonisation` `#EnergyTransition`

## After the page exists

1. **If the `heliovulcan` slug was taken** and you had to use something else, repoint the site:

   ```bash
   cd "/Users/hugefafafa1/BESS/网站建设/enerforge-site" && grep -rl "linkedin.com/company/heliovulcan" --include="*.html" . | xargs sed -i '' 's#linkedin.com/company/heliovulcan#linkedin.com/company/YOUR-SLUG#g'
   ```

2. **Point the page back at the site.** In the page's admin view, set the website field and the
   custom button to `https://heliovulcan.com.au/`. That plus the footer link and the `sameAs`
   claim is the full two-way link.

3. **Check the link preview.** Paste `https://heliovulcan.com.au/` into the LinkedIn Post
   Inspector (`linkedin.com/post-inspector/`) and hit *Inspect*. Every page now declares
   `og:title`, `og:description`, `og:image`, `og:url` and `og:site_name`, so the card should show
   the headline and the image rather than a bare URL. The inspector is also how you force
   LinkedIn to re-scrape a page after you change its copy — LinkedIn caches the card for about a
   week otherwise.

4. **Verify the page** if LinkedIn offers it in your admin settings — it confirms the domain
   belongs to the page and removes the "unverified" state.
