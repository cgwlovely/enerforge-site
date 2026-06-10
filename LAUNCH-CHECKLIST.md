# EnerForge — Launch Readiness Checklist

A pre-launch review of the static MVP (`index.html`, `case-study.html`, `style.css`).
Site positioning: *an independent project intelligence workflow for industrial solar + BESS
projects, built by one energy and climate modeller, to test customer value, contract revenue,
carbon upside and bankability before full project development.*

---

## Launch Readiness Checklist

| # | Check | Status |
|---|-------|--------|
| 1 | Internal links resolve (`index.html`, `case-study.html`, `#lens`, `#about`, `#contact`, `#reports`) | ✅ Pass |
| 2 | Nav identical on both pages (only `is-current` differs) | ✅ Pass |
| 3 | CTAs all point somewhere valid (case study, #reports, mailto, back-to-home) | ✅ Pass |
| 4 | Placeholder email is clearly flagged to replace | ✅ Pass — `hello@enerforge.example` + a `.small-note` reminder |
| 5 | Meta title + description present and on-message on both pages | ✅ Pass |
| 6 | Mobile layout (nav stacks, grids collapse, matrix/risk reflow) | ✅ Pass |
| 7 | "Coming soon" items are explained, not bare | ✅ Pass — reports `.small-note`; case-study `.note` |
| 8 | No overclaiming ("leading platform", "AI-powered", guaranteed savings) | ✅ Pass |
| 9 | Clearly stated as an independent workflow built by one person | ✅ Pass — About + footer |
| 10 | Disclaimer that this is not financial / investment advice | ✅ Pass — footer legal line + case-study "How to read this" |
| 11 | Deployable as plain static files (no build, no JS, no external fonts) | ✅ Pass |
| 12 | Founder name placeholder present | ⚠️ Must replace — `[Your Name]` |

---

## Must Fix Before Publishing

1. **Replace `[Your Name]`** in the About section (`index.html`) with your real name.
2. **Replace the placeholder email** `hello@enerforge.example` with a real, monitored address
   (the "Get in touch" button + footer-adjacent note).
3. **Decide what "Preview coming soon" links to.** Either keep them as honest placeholders (fine for
   MVP — they are already explained) or wire them to a real PDF / contact form before you promote
   the site widely.
4. **Add a favicon** (a 32×32 `favicon.png` + `<link rel="icon">`) so the browser tab isn't blank.
5. **Confirm the © year / entity name** in the footer matches how you want to present (personal name
   vs. "EnerForge").

## Nice to Improve Later

- Add `Open Graph` / Twitter-card meta tags so links preview nicely on LinkedIn / 小红书.
- Add one real downloadable **sample Decision Card** (1 page) — the lowest-effort, highest-trust asset.
- A lightweight **contact form** (Formspree / Netlify Forms) instead of a raw mailto.
- A short **"Notes" / writing index** page to host the content pieces below.
- Compress / lazy-load any images you add later (none required today — the site is text + CSS only).
- Add a `sitemap.xml` + `robots.txt` once the domain is fixed.

---

## Suggested meta title / description

**Home (`index.html`)**
- Title: `EnerForge — Independent project intelligence for industrial solar + BESS`
- Description: `An independent workflow, built by one energy and climate modeller, to test customer value, contract revenue, carbon upside and bankability before serious development cost is committed.`

**Case study (`case-study.html`)**
- Title: `Case study: a solar + BESS project that saved the customer money — and still couldn't be financed | EnerForge`
- Description: `A worked weak-grid solar + BESS EaaS screening: real customer savings, not bankable under the current debt structure. Shared as a lesson, not a success story.`

*(Both are already set in the files; listed here for reference / editing.)*

## Suggested footer disclaimer

> EnerForge is an independent workflow built by one person. It is not a consulting firm, an
> engineering firm or a software platform. Nothing on this site is financial, investment, tax or
> engineering advice. All figures are illustrative outputs of an early-stage screening model and
> should not be relied on for an investment decision.

*(The current footer is a shorter version of this — swap in the longer one if you want maximum
caution.)*

## Deployment recommendation

The site is three static files with no build step, so any static host works:

- **GitHub Pages** — push `index.html`, `case-study.html`, `style.css` to a repo, enable Pages on
  the `main` branch root. Simplest if you already use GitHub.
- **Netlify / Vercel** — drag-and-drop the folder, or connect the repo. Gives you a free HTTPS
  subdomain instantly and easy custom-domain + form handling later.

Recommended: **Netlify** for the MVP — drag-drop deploy, free HTTPS, and built-in form handling
when you replace the mailto. Point a custom domain (e.g. `enerforge.io`) at it once chosen, then
update the placeholder email to match the domain.
