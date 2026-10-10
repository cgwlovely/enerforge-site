#!/usr/bin/env python3
"""Guard: nothing on the registration list may be published or linked.

    python3 scripts/check_registered.py        # exit 1 on any finding

This repository is public, so a file that sits in the tree is published whether
or not a page links to it, and an unguessable path protects nothing. The gate is
therefore one rule only: the file is not in the repository. This script is what
stops that rule being undone by a later build or a stray `git add`.

Two findings are errors:
  * a listed path exists in the site tree;
  * a page links a listed path, so a visitor would reach a 404.

One is a warning: the single-file exports under downloads/ are snapshots of
earlier states of the site and keep their original links.
"""
from __future__ import annotations
import json, pathlib, re, sys

SITE = pathlib.Path(__file__).resolve().parents[1]
MANIFEST = json.loads((SITE / "scripts/registered_files.json").read_text(encoding="utf-8"))
LISTED = [f["path"] for f in MANIFEST["files"]]
REGISTER = MANIFEST["register_page"]

errors: list[str] = []
warnings: list[str] = []

# 1. none of them may be in the tree
for rel in LISTED:
    if (SITE / rel).exists():
        errors.append(f"{rel}: present in the site tree. A public repository publishes it. "
                      f"Move it to 网站建设/_registered/ and remove it here.")

# 2. nothing may link to them
LINK_RE = {rel: re.compile(r'(?:href|src)="(?:https://heliovulcan\.com\.au)?/?' + re.escape(rel) + r'"')
           for rel in LISTED}
for page in sorted(SITE.rglob("*.html")):
    rel_page = str(page.relative_to(SITE))
    if rel_page.startswith((".git/", ".preview", "node_modules/")):
        continue
    try:
        text = page.read_text(encoding="utf-8", errors="replace")
    except OSError:
        continue
    for rel, rx in LINK_RE.items():
        if rx.search(text):
            msg = f"{rel_page}: links {rel}, which is not published. Point it at {REGISTER}."
            (warnings if rel_page.startswith("downloads/") else errors).append(msg)

# 3. the sitemap must not advertise them either
sitemap = (SITE / "sitemap.xml")
if sitemap.exists():
    sm = sitemap.read_text(encoding="utf-8")
    for rel in LISTED:
        if rel in sm:
            errors.append(f"sitemap.xml: lists {rel}, which is not published.")

for w in warnings:
    print(f"warning: {w}")
for e in errors:
    print(f"ERROR: {e}")
print(f"\n{len(LISTED)} files on the registration list; "
      f"{len(errors)} errors, {len(warnings)} warnings.")
sys.exit(1 if errors else 0)
