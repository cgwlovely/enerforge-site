#!/usr/bin/env python3
"""Connect the registration form to its MailerLite form.

    python3 scripts/set_mailerlite.py "<the form's action URL>"
    python3 scripts/set_mailerlite.py --check

Copy the URL out of MailerLite: Forms -> your embedded form -> view the HTML, the
value of <form action="...">. Paste it whole. It is written into assets/subscribe.js
and nowhere else, so this is the single step between a page that offers the email
route and a page that registers people.

The URL is not a secret — it is in the page source of every site with an embedded
form — so it belongs in the repository. The delivery links do not: those go in
网站建设/_registered/LINKS.md and the welcome email.
"""
from __future__ import annotations
import pathlib, re, sys

JS = pathlib.Path(__file__).resolve().parents[1] / "assets/subscribe.js"
PLACEHOLDER = "PASTE_MAILERLITE_FORM_ACTION_URL"
LINE = re.compile(r'(  var ENDPOINT = ")([^"]*)(";)')

FIELDS = ["role", "interests", "came_for"]


def current() -> str:
    m = LINE.search(JS.read_text(encoding="utf-8"))
    if not m:
        sys.exit("assets/subscribe.js: the ENDPOINT line is not where it was — check the file by hand")
    return m.group(2)


def main() -> None:
    args = [a for a in sys.argv[1:] if a]
    now = current()
    if not args or args[0] == "--check":
        live = now != PLACEHOLDER and now.startswith("http")
        print(f"ENDPOINT = {now}")
        print("the form is CONNECTED" if live else
              "the form is NOT connected: it disables its own button and offers the email route")
        sys.exit(0 if live else 1)

    url = args[0].strip()
    if not url.startswith("https://"):
        sys.exit(f"refusing: {url!r} is not an https URL. Paste the <form action=\"...\"> value whole.")
    if " " in url or '"' in url:
        sys.exit("refusing: that does not look like a bare URL — paste only the action value.")

    text = JS.read_text(encoding="utf-8")
    JS.write_text(LINE.sub(lambda m: m.group(1) + url + m.group(3), text, count=1), encoding="utf-8")
    print(f"assets/subscribe.js: ENDPOINT set to {url}")
    print("\nBefore telling anyone about the page, check in MailerLite that:")
    print("  * double opt-in is on — the confirmation email is where the file links go;")
    print(f"  * these custom fields exist, or their values arrive unnamed and are dropped: "
          f"{', '.join(FIELDS)} (all text);")
    print("  * then register with a real address and walk the whole path: "
          "confirm, receive the links, unsubscribe, confirm you are off the list.")


if __name__ == "__main__":
    main()
