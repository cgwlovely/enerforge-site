#!/usr/bin/env python3
"""Build /updates.html and /updates.xml from updates.json.

    python3 scripts/build_updates.py

updates.json is the source of truth. The feed is what MailerLite reads to send a
notice to registered readers, so an entry added here reaches people: write it for
a reader, not for the commit log. The page and the feed are generated — edit
updates.json, not the output.

Chrome comes from apply_chrome.py so the header and footer cannot drift from the
rest of the site.
"""
from __future__ import annotations
import html, json, pathlib, re, sys
from datetime import datetime, timezone

HERE = pathlib.Path(__file__).resolve().parent
SITE = HERE.parent
sys.path.insert(0, str(HERE))
from apply_chrome import ASSET_V, FOOTER, crumb_html, header_html  # noqa: E402

BASE = "https://heliovulcan.com.au"
SRC = json.loads((SITE / "updates.json").read_text(encoding="utf-8"))
KINDS: dict[str, str] = SRC["kinds"]
ENTRIES = sorted(SRC["entries"], key=lambda e: e["date"], reverse=True)

MONTHS = ["January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"]


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def long_date(iso: str) -> str:
    y, m, d = (int(x) for x in iso.split("-"))
    return f"{d} {MONTHS[m - 1]} {y}"


def rfc822(iso: str) -> str:
    dt = datetime.strptime(iso, "%Y-%m-%d").replace(hour=9, tzinfo=timezone.utc)
    return dt.strftime("%a, %d %b %Y %H:%M:%S +0000")


def guid(e: dict) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", e["title"].lower()).strip("-")
    if len(slug) > 64:
        slug = slug[:64].rsplit("-", 1)[0]
    return f"{BASE}/updates.html#{e['date']}-{slug}"


# ---- the page ------------------------------------------------------------------
def page() -> str:
    rows = []
    for e in ENTRIES:
        kind = KINDS.get(e["kind"], e["kind"])
        anchor = guid(e).split("#", 1)[1]
        cls = "upd__row is-correction" if e["kind"] == "correction" else "upd__row"
        rows.append(
            f'        <li class="{cls}" id="{esc(anchor)}">\n'
            f'          <p class="upd__meta"><time datetime="{e["date"]}">{long_date(e["date"])}</time>'
            f'<span class="upd__kind">{esc(kind)}</span></p>\n'
            f'          <h3 class="upd__title"><a href="{esc(e["url"])}">{esc(e["title"])}</a></h3>\n'
            f'          <p class="upd__sum">{esc(e["summary"])}</p>\n'
            f'        </li>')
    listing = "\n".join(rows)
    first, last = ENTRIES[0]["date"], ENTRIES[-1]["date"]
    counts = {}
    for e in ENTRIES:
        counts[e["kind"]] = counts.get(e["kind"], 0) + 1
    corrections = counts.get("correction", 0)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Updates: what has changed on this site | Heliovulcan</title>
  <meta name="description" content="Every published change to Heliovulcan's research, datasets and tools, newest first, including corrections to figures already published. Available as a feed and by email." />
  <link rel="canonical" href="{BASE}/updates.html" />
  <link rel="alternate" type="application/rss+xml" title="Heliovulcan updates" href="{BASE}/updates.xml" />
  <link rel="icon" href="/favicon.png" type="image/png" sizes="240x240" />
  <link rel="stylesheet" href="/style.css?v={ASSET_V}" />
</head>
<body>

{header_html("about")}{crumb_html([("About", "/about.html")], "Updates")}

  <section class="hero">
    <div class="container">
      <span class="eyebrow">Updates</span>
      <h1>What has changed, including the figures we have had to correct</h1>
      <p class="hero__sub">This page lists every published change to the research, the datasets and the
      tools, newest first. {corrections} of the {len(ENTRIES)} entries below are corrections to figures
      that had already been published. Those are the entries most worth reading.</p>
      <p class="actions">
        <a class="btn btn--primary" href="/subscribe.html">Get these by email</a>
        <a class="btn btn--outline" href="/updates.xml">Subscribe by feed <span class="btn__arrow">&rarr;</span></a>
      </p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <ul class="upd">
{listing}
      </ul>
      <p class="small-note">Entries run from {long_date(last)} to {long_date(first)}. Changes to
      navigation, layout and internal tooling are not listed here, because they do not change what a
      reader can rely on. A correction is listed whether or not it favours our earlier conclusion.</p>
    </div>
  </section>

{FOOTER}

</body>
</html>
"""


# ---- the feed ------------------------------------------------------------------
def feed() -> str:
    items = []
    for e in ENTRIES:
        kind = KINDS.get(e["kind"], e["kind"])
        link = BASE + e["url"] if e["url"].startswith("/") else e["url"]
        items.append(
            "    <item>\n"
            f"      <title>{esc(e['title'])}</title>\n"
            f"      <link>{esc(link)}</link>\n"
            f"      <guid isPermaLink=\"false\">{esc(guid(e))}</guid>\n"
            f"      <pubDate>{rfc822(e['date'])}</pubDate>\n"
            f"      <category>{esc(kind)}</category>\n"
            f"      <description>{esc(kind)} &#8212; {esc(e['summary'])}</description>\n"
            "    </item>")
    built = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    body = "\n".join(items)
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Heliovulcan updates</title>
    <link>{BASE}/updates.html</link>
    <atom:link href="{BASE}/updates.xml" rel="self" type="application/rss+xml" />
    <description>Published changes to Heliovulcan's research, datasets and tools, including corrections to figures already published.</description>
    <language>en-AU</language>
    <lastBuildDate>{built}</lastBuildDate>
{body}
  </channel>
</rss>
"""


def main() -> None:
    (SITE / "updates.html").write_text(page(), encoding="utf-8")
    (SITE / "updates.xml").write_text(feed(), encoding="utf-8")
    print(f"wrote updates.html and updates.xml  ({len(ENTRIES)} entries, newest {ENTRIES[0]['date']})")


if __name__ == "__main__":
    main()
