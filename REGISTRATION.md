# Registration and update notices — how to run it

Free registration with an email address, a notice whenever the research changes, and
the packaged files sent by email. Built on 10 October 2026.

> **Not pushed yet, and that is deliberate.** The change is committed locally
> (`c709e1e`) and the live site is unchanged. Pushing removes eight files from the site
> at the moment the form still cannot register anyone, which is a window where a reader
> finds neither the file nor a working form. Connect MailerLite first — one command,
> below — then push. If you are a different session: please do not push this branch
> until `python3 scripts/set_mailerlite.py --check` exits 0.

## What a download gate can and cannot do on this site

Worth reading before changing the registration list. The site's method is that every
figure recalculates in the reader's browser, so the analysis pages **carry their data
with them**:

| File | Also readable without registering |
|---|---|
| `safeguard-facilities.csv` | yes — `safeguard-atlas.json` holds the same 209 rows and the Atlas page fetches it |
| `cbam-exposure-by-origin.csv` | yes — `cbam-explorer.html` inlines all 198 origins |
| `cbam-verification-by-origin.csv` | yes — the same inlined rows carry the `ver` object |
| `datacentres.csv` | yes — `datacentres.json` is the same 161 records, and the page fetches it |
| the three submissions, the two Pre-DD reports | no |

So registration withholds the PDFs and nothing else. For the datasets it buys the
packaged file, the column definitions and the change notices. `subscribe.html` says
exactly this, in a section of its own. Do not replace that section with copy implying
the data is otherwise unavailable — a reader who opens the network tab will find out,
and on a site that sells verifiability that costs more than the registrations are worth.

To make the gate real the tools would have to load their data from an authenticated
endpoint instead of carrying it. That is a Cloudflare Worker and a different hosting
arrangement, not a copy change.

## Pieces

| Piece | File |
|---|---|
| Registration page | `scripts/build_subscribe.py` → `subscribe.html` |
| Form behaviour | `assets/subscribe.js` |
| Connecting it to MailerLite | `scripts/set_mailerlite.py` |
| What is withheld | `scripts/registered_files.json` |
| Guard | `scripts/check_registered.py` |
| Changelog source | `updates.json` |
| Changelog page and feed | `scripts/build_updates.py` → `updates.html`, `updates.xml` |
| The files themselves | `网站建设/_registered/` on the operator's machine, mirrored to the shared drive |

## Before it works: three things to set up once

**1. MailerLite.** Create the account and a form (Forms → Embedded form). Open the
embed HTML and copy the `<form action="...">` value, then:

```
python3 scripts/set_mailerlite.py "<the action URL>"
python3 scripts/set_mailerlite.py --check      # exits 0 once the form is connected
```

Paste the URL whole rather than assembling it from IDs — then it is MailerLite's own URL
and cannot be the wrong shape. It is not a secret: every site with an embedded form has it
in its page source. Until it is set, the form disables its own button and offers the email
route, so the page is safe to publish beforehand.

Create three custom fields first (Subscribers → Fields), or the values arrive unnamed and
are dropped: `role`, `interests`, `came_for` — all text. `name` and `company` are built in.

Turn on double opt-in. The confirmation email is where the file links go.

**2. The shared drive folder.** Upload everything in `网站建设/_registered/` to one folder,
and put the links in the MailerLite welcome email. Keep the links out of this repository:
it is public, so a link committed here is a published link. Record them in
`网站建设/_registered/LINKS.md`, which is outside both repositories.

**3. The RSS campaign.** In MailerLite, create an RSS campaign pointed at
`https://heliovulcan.com.au/updates.xml`. Each new entry then goes out on its own, with no
further work. The item title becomes the subject line, so write entry titles as subject
lines.

## Publishing an update

1. add an entry at the top of `updates.json` — date, kind, title, url, summary;
2. `python3 scripts/build_updates.py`;
3. commit and push.

MailerLite picks it up on its next poll. Entries are messages to every registered reader,
so navigation changes, layout work and refactors do not belong there. **Corrections do** —
that is the reason the list exists, and two of the first seven entries are corrections.

## Adding or removing a file from the registration list

1. edit `scripts/registered_files.json`;
2. move the file into or out of `网站建设/_registered/`;
3. `python3 scripts/check_registered.py` — it fails if a listed file is still in the tree
   or if any page still links to it;
4. `python3 scripts/build_subscribe.py` to refresh the table on the page.

## After `scripts/apply_chrome.py` changes

Both generated pages take their header and footer from `apply_chrome.py`. After that file
changes, run all three in order:

```
python3 scripts/apply_chrome.py
python3 scripts/build_updates.py
python3 scripts/build_subscribe.py
```

## What is not solved

* **Everything removed on 10 October 2026 was public before that date.** The repository is
  public and keeps its history, so the files stay retrievable from any clone, and copies may
  sit in caches, the Internet Archive and crawled corpora. Removing them stops new readers
  taking them from the site; it does not recall the copies already out.
* **A link in an email can be forwarded.** The gate records who asked, not who ends up with
  the file.
* `downloads/Heliovulcan-site.html` and `downloads/Safeguard-Atlas.html` are single-file
  snapshots of earlier states of the site and still carry the old download links. They are
  unlinked and not in the sitemap. `check_registered.py` reports them as warnings, not errors.
