# Heliovulcan — independent BESS feasibility & project-intelligence website

A static, founder-led website for early-stage industrial **solar + BESS** sanity checks,
project notes and case studies. No framework, no build step — plain HTML, one CSS file, and a
small data-driven case-study engine.

## Add a new case study (the important part)

You do **not** edit any page design to publish a case. Open:

```
cases/data.js
```

Copy an existing object in the `HELIOVULCAN_CASES` array, change the fields, and save. That's it:

- a new card + map pin appear on **case-studies.html** automatically, and
- a full page renders at **case.html?id=&lt;your-id&gt;**

Every field is documented at the top of `cases/data.js`. The disclaimer block and the
"free sanity check" call-to-action are added to every case page automatically.

## Project structure

```
index.html            Home
case-studies.html     Case-study index (map + auto-generated cards)
case.html             Dynamic case page — reads ?id= from cases/data.js
notes.html            Project Notes index
note-1 … note-11.html Individual notes
cases/
  data.js             ← the ONLY file you edit to add/change a case
  render.js           rendering engine (don't edit for content)
style.css             all styling
assets/               photos used on the site
```

## Run locally

Just open `index.html` in a browser (double-click works — the case engine uses a JS data
file, not `fetch`, so it runs from `file://`). For a nicer local server:

```
npx serve .        # or:  python3 -m http.server
```

## Deploy

This is a static site — it deploys anywhere with zero configuration.

**GitHub Pages**
1. Push these files to a GitHub repo.
2. Settings → Pages → Source: `Deploy from a branch` → `main` / root.
3. Your site is live at `https://<user>.github.io/<repo>/`.
   (The included `.nojekyll` file ensures every folder is served as-is.)

**Vercel**
1. Import the repo at vercel.com (Framework preset: **Other**, no build command, output dir `.`),
   or run `npx vercel` from this folder.

**Netlify**
1. Drag-and-drop this folder onto app.netlify.com, or connect the repo with **no build command**
   and publish directory `.`.

## Structured data, claims & API (AI-friendly layer)

The Fountain Head case also ships as a machine-readable registry. **Single source of truth**
is `/data/` — everything else is generated:

```
data/
  projects/fountain-head.json     project entity (identity, links, coverage)
  claims/fountain-head.json       claim registry (IDs, types, confidence, limitations)
  evidence/fountain-head.json     evidence registry (sources, access dates, quality)
  schemas/*.schema.json           JSON Schemas for the three documents
scripts/build_api.py              build + validation (stdlib python3, no deps)
api/v1/projects/…                 GENERATED static JSON endpoints — do not hand-edit
projects/fountain-head/           canonical entity page (tables between BUILD markers
datasets/fountain-head-pre-dd/      and the Dataset JSON-LD are GENERATED — do not
methods/pre-dd-f1-f4/               hand-edit inside the markers)
openapi.json                      API description  ·  /.well-known/api-catalog  discovery
```

To change a claim or evidence item: edit the file in `/data/`, then run

```
python3 scripts/build_api.py          # regenerates api/v1 + injected HTML blocks
python3 scripts/build_api.py --check  # CI-style gate: validates + fails if outputs stale
```

The script enforces: schema shape, claim↔evidence cross-references, "every published claim
has evidence or is an assumption/unresolved", no silent missing sources (a null
`source_url` must be marked `unresolved`), and sitemap coverage of the new pages.

Local preview: `python3 -m http.server` from this folder (directory URLs like
`/projects/fountain-head/` need an HTTP server; `file://` won't resolve them).
Production: GitHub Pages serves the generated `.json` files and folder `index.html`s as-is
— no build step runs in deployment, so **commit the generated files** after running the script.

## Before you go live

- Contact email is set to `grant.chen.phd@gmail.com` (live `mailto:` links across the site).
- Add a `favicon.png` + `<link rel="icon">` if you want a custom browser-tab icon.
- Swap the `assets/*.jpg` photos for your own if preferred.

---

Heliovulcan is an independent workflow built by one person. Nothing on the site is legal,
financial, tax, engineering or investment advice — it is an early project logic check and
peer-style discussion.
