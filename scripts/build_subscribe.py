#!/usr/bin/env python3
"""Build /subscribe.html — the registration page.

    python3 scripts/build_subscribe.py

The prose lives here and the file table is read from scripts/registered_files.json,
so the page cannot promise a file that is not on the registration list, or omit one
that is. Chrome comes from apply_chrome.py.
"""
from __future__ import annotations
import html, json, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
SITE = HERE.parent
sys.path.insert(0, str(HERE))
from apply_chrome import ASSET_V, FOOTER, crumb_html, header_html  # noqa: E402

BASE = "https://heliovulcan.com.au"
MAN = json.loads((HERE / "registered_files.json").read_text(encoding="utf-8"))
UPD = json.loads((SITE / "updates.json").read_text(encoding="utf-8"))

CONTACT = "grantchen@heliovulcan.com.au"
INTERESTS = [
    "Safeguard Mechanism and baselines",
    "Critical minerals and mining energy",
    "Data centres and electricity demand",
    "EU CBAM and trade exposure",
    "Project screening and Pre-DD",
]
ROLES = ["", "Asset owner or operator", "Developer", "Investor or lender", "Adviser or consultant",
         "Government or regulator", "Research or academia", "Media", "Other"]


def esc(s: str) -> str:
    return html.escape(s or "", quote=True)


def file_rows() -> str:
    on_request = [f for f in MAN["files"] if f.get("release") == "on_request"]
    on_reg = [f for f in MAN["files"] if f.get("release") != "on_request"]
    out = []
    for f in on_reg:
        also = ""
        if f.get("also_public_as"):
            also = (f'<br /><span class="reg__hint">Also readable without registering: '
                    f'<code>{esc(f["also_public_as"])}</code></span>')
        out.append(f'            <tr><td><code>{esc(f["title"])}</code>{also}</td>'
                   f'<td>{esc(f["contents"])}</td><td class="n">{esc(f["records"])}</td></tr>')
    rows = "\n".join(out)
    extra = ""
    if on_request:
        names = ", ".join(esc(f["title"]) for f in on_request)
        extra = (f'\n          <p class="small-note">Two further documents &mdash; {names} &mdash; name the asset '
                 f'in their contents. They are released on request after a short exchange about the purpose, '
                 f'not by registering.</p>')
    return rows, extra


def interest_boxes() -> str:
    return "\n".join(
        f'              <label class="reg__check"><input type="checkbox" name="interests" '
        f'value="{esc(i)}" />{esc(i)}</label>' for i in INTERESTS)


def role_options() -> str:
    out = []
    for r in ROLES:
        label = r or "Please choose"
        out.append(f'                <option value="{esc(r)}">{esc(label)}</option>')
    return "\n".join(out)


def page() -> str:
    rows, extra = file_rows()
    n_entries = len(UPD["entries"])
    n_corrections = sum(1 for e in UPD["entries"] if e["kind"] == "correction")
    n_also = sum(1 for f in MAN["files"] if f.get("also_public_as"))
    open_rows = "\n".join(
        f'            <tr><td><code>{esc(s["path"])}</code></td><td>{esc(s["why"])}</td></tr>'
        for s in MAN["stays_public"])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Register for data access and update notices | Heliovulcan</title>
  <meta name="description" content="Registration for Heliovulcan's packaged datasets and submissions is free. Register with an email address to receive the files and a notice whenever the research changes, including corrections to figures already published." />
  <link rel="canonical" href="{BASE}/subscribe.html" />
  <link rel="alternate" type="application/rss+xml" title="Heliovulcan updates" href="{BASE}/updates.xml" />
  <link rel="icon" href="/favicon.png" type="image/png" sizes="240x240" />
  <link rel="stylesheet" href="/style.css?v={ASSET_V}" />
</head>
<body>

{header_html("about")}{crumb_html([("About", "/about.html")], "Register")}

  <section class="hero">
    <div class="container">
      <span class="eyebrow">Registration</span>
      <h1>Registration is free. It exists so we know who relies on this work</h1>
      <p class="hero__sub">There is no payment, no tier and no trial. An email address gets you the
      packaged datasets and the submissions, and a short notice whenever the research changes. We ask
      for an organisation and a role because knowing who uses a figure changes how we maintain it.</p>
      <p class="actions">
        <a class="btn btn--primary" href="#register">Register</a>
        <a class="btn btn--outline" href="/updates.html">See what has changed so far <span class="btn__arrow">&rarr;</span></a>
      </p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <h2>What registration gets you</h2>
      <p>Each file carries the licences of the sources behind it. Cite those sources, not this page.</p>
      <div class="table-scroll">
        <table class="reg-table">
          <thead><tr><th>File</th><th>Contents</th><th>Records</th></tr></thead>
          <tbody>
{rows}
          </tbody>
        </table>
      </div>{extra}

      <h2 style="margin-top:56px">What stays open whether or not you register</h2>
      <p>Every page of analysis stays open, and so does the data each interactive tool works from.
      The tools recalculate in your browser, which means they carry their figures with them. For
      {n_also} of the datasets above the same fields can therefore be read without registering, and
      the submissions are the files this list actually withholds. We would rather say that here than
      let a reader find it and wonder what else the page was quiet about.</p>
      <div class="table-scroll">
        <table class="reg-table">
          <thead><tr><th>Stays public</th><th>Why</th></tr></thead>
          <tbody>
{open_rows}
          </tbody>
        </table>
      </div>
      <p class="small-note">What registration adds for those {n_also} datasets is the packaged file,
      the column definitions and the change notices &mdash; not access to the numbers.</p>

      <h2 style="margin-top:56px">Why the notices are the part that matters</h2>
      <p>We correct figures after publication. Of the {n_entries} entries on the
      <a href="/updates.html">updates page</a>, {n_corrections} are corrections to numbers that had
      already been published and had already been read. A correction is listed whether or not it
      favours our earlier conclusion.</p>
      <p>If you have used one of these datasets in your own work, the notice telling you a figure
      moved is worth more than the original download. That is the main reason to register rather than
      take a copy of the file.</p>
    </div>
  </section>

  <section class="section section--tint" id="register">
    <div class="container">
      <h2>Register</h2>
      <p class="reg__for" id="reg-for" hidden></p>
      <form class="reg" id="reg-form" novalidate>
        <div class="reg__row">
          <label class="reg__label" for="reg-email">Email address</label>
          <input id="reg-email" name="email" type="email" autocomplete="email" required />
        </div>
        <div class="reg__row">
          <label class="reg__label" for="reg-name">Name <span class="opt">&mdash; optional</span></label>
          <input id="reg-name" name="name" type="text" autocomplete="name" />
        </div>
        <div class="reg__row">
          <label class="reg__label" for="reg-company">Organisation <span class="opt">&mdash; optional</span></label>
          <input id="reg-company" name="company" type="text" autocomplete="organization" />
        </div>
        <div class="reg__row">
          <label class="reg__label" for="reg-role">Role <span class="opt">&mdash; optional</span></label>
          <select id="reg-role" name="role">
{role_options()}
          </select>
          <p class="reg__hint">A role tells us which reading of a figure to protect when we revise it.</p>
        </div>
        <div class="reg__row">
          <span class="reg__label">Subjects you want notices about <span class="opt">&mdash; optional</span></span>
          <div class="reg__checks">
{interest_boxes()}
          </div>
        </div>
        <div class="reg__row">
          <div class="reg__checks">
            <label class="reg__check"><input type="checkbox" name="consent" value="yes" />
            I am happy to receive a notice when the research changes. One message per published
            change, and an unsubscribe link in every one.</label>
          </div>
        </div>
        <input type="hidden" name="came_for" value="" />
        <div style="position:absolute;left:-9999px" aria-hidden="true">
          <label for="reg-trap">Leave this field empty</label>
          <input id="reg-trap" name="website_url" type="text" tabindex="-1" autocomplete="off" />
        </div>
        <div class="reg__actions">
          <button class="btn btn--primary" type="submit">Register</button>
          <span class="reg__hint">You will get a confirmation email first. The files follow once you confirm.</span>
        </div>
      </form>
      <p class="reg__msg" id="reg-msg" hidden></p>
      <noscript>
        <p class="reg__msg is-bad">This form needs JavaScript. To register without it, email
        <a href="mailto:{CONTACT}?subject=Register%20for%20data%20access">{CONTACT}</a> with your name
        and organisation, and we will add you and send the files.</p>
      </noscript>

      <h3 style="margin-top:48px">What we do with your details</h3>
      <p>Your email address, and anything else you choose to enter, is held in our mailing-list
      account at MailerLite and used for two things: sending you the files, and telling you when the
      research changes. We do not sell the list, and we do not pass it to anyone else. Every message
      carries an unsubscribe link, and unsubscribing deletes you from the list. The
      <a href="/privacy.html">privacy notice</a> sets out the detail, including how to ask what we
      hold and have it removed.</p>
      <p class="small-note">Registration is not a commercial engagement and creates no obligation on
      either side. If you would rather not be on a list at all, the
      <a href="/updates.xml">update feed</a> carries the same notices with no registration and no
      email address.</p>
    </div>
  </section>

{FOOTER}

  <script src="/assets/subscribe.js?v={ASSET_V}" defer></script>

</body>
</html>
"""


def main() -> None:
    out = SITE / "subscribe.html"
    out.write_text(page(), encoding="utf-8")
    print(f"wrote subscribe.html  ({len(page()) // 1024} KB)")


if __name__ == "__main__":
    main()
