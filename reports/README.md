# Reports — how to add a new report page

Report pages are **indexable HTML** versions of a project review (not just a PDF), so Google can
rank them for long-tail queries (e.g. *"Fountain Head Hybrid Energy review"*, *"mining PV+BESS
preliminary review"*). Each lives at `reports/<slug>-review.html` and links to its PDF.

`_template.html` is the starting point for every new report.

> ⚠️ **Never** add `_template.html` to `sitemap.xml`, and **never** link to it from any page.
> It carries a `noindex` guard on purpose.

---

## Steps

1. **Copy** `_template.html` → rename to `reports/<slug>-review.html`.
2. **Slug rules:** all lowercase, words joined by hyphens, end with `-review`.
   - e.g. `sunrise-dam-hybrid-energy-review.html`
3. **Delete the noindex guard** — remove this line from the new file's `<head>`:
   ```html
   <meta name="robots" content="noindex, nofollow" />
   ```
   (Without removing it, Google will **not** index the report.)
4. **Replace every `[PLACEHOLDER]`**, including inside the JSON-LD block:
   - `[PROJECT NAME]`, `[PROJECT LOCATION]`, `[TECHNOLOGY TYPE]`
   - `[PROJECT-SLUG]` → your slug (used in canonical, `og:url`, JSON-LD `url`/breadcrumb)
   - `[META DESCRIPTION]`
   - `[YYYY-MM-DD]` → `datePublished` **and** `dateModified`
   - `[EXECUTIVE SUMMARY]`, `[PROJECT BACKGROUND]`
   - `[KEY FINDING 1…]`, `[KEY RISK 1…]`, `[PUBLIC SOURCE 1…]`, `[RECOMMENDED NEXT STEP 1…]`
   - `[PDF FILENAME]` → the report PDF name
5. **Upload the PDF** into `reports/` and confirm the download link points to it
   (same folder, so `href="<file>.pdf"`).
6. **Update `sitemap.xml`** — add one `<url>` block:
   ```xml
   <url>
     <loc>https://heliovulcan.com.au/reports/<slug>-review.html</loc>
     <lastmod>YYYY-MM-DD</lastmod>
     <changefreq>monthly</changefreq>
     <priority>0.9</priority>
   </url>
   ```
7. **Add internal links** — add a card linking the new report in the **"Explore more"** section of:
   - `index.html`
   - `case-studies.html`
   - `notes.html`
8. **Commit & push** to `main` (GitHub Pages rebuilds in ~1–2 min).

---

## Verify after deploy

- Open `https://heliovulcan.com.au/reports/<slug>-review.html` — page loads, PDF downloads.
- Confirm the `noindex` line is gone (View Source).
- **Rich Results Test** → https://search.google.com/test/rich-results → paste the URL → should
  detect `Article` / `Report` structured data with no errors.

## Google Search Console — Request Indexing

1. Open Search Console for `heliovulcan.com.au`.
2. Paste the new URL into **URL Inspection** (top search bar).
3. Click **Request indexing**.
4. **Sitemaps** → confirm `sitemap.xml` is submitted and shows "Success" (it now includes the new URL).

---

## Checklist (tick each time)

**Before publishing**
- [ ] Copied `_template.html` → `reports/<slug>-review.html`
- [ ] Slug is lowercase-hyphenated and ends with `-review`
- [ ] Removed the `noindex` guard line
- [ ] Replaced **all** `[PLACEHOLDER]`s (head, body **and** JSON-LD)
- [ ] Set `datePublished` and `dateModified`
- [ ] PDF uploaded to `reports/` and download link works

**Publishing**
- [ ] Added the URL to `sitemap.xml`
- [ ] Added "Explore more" link cards in `index.html`, `case-studies.html`, `notes.html`
- [ ] Committed & pushed to `main`

**After deploy**
- [ ] Page + PDF load on the live domain
- [ ] Rich Results Test detects the structured data
- [ ] Requested indexing in Search Console

**Never**
- [ ] ❌ Do not add `_template.html` to `sitemap.xml`
- [ ] ❌ Do not link to `_template.html` from any page
- [ ] ❌ Do not publish a real report with the `noindex` guard still in place
