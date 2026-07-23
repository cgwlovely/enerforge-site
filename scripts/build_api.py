#!/usr/bin/env python3
"""Build + validate the machine-readable layer from the single data source.

Source of truth:   /data/projects|claims|evidence/<slug>.json
Generated output:  /api/v1/projects/<slug>.json
                   /api/v1/projects/<slug>/claims.json
                   /api/v1/projects/<slug>/evidence.json
Injected HTML:     marked blocks in /projects/<slug>/index.html and
                   /datasets/*/index.html (between BUILD:BEGIN/END markers)

No third-party dependencies — plain python3 (stdlib only). Run from repo root:

    python3 scripts/build_api.py            # build + validate
    python3 scripts/build_api.py --check    # validate only, fail if outputs stale

The script fails (exit 1) on any schema violation, broken cross-reference, or
count mismatch, so it can be used as a pre-commit / CI gate.
"""

import argparse
import html
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://heliovulcan.com.au"
SLUG = "fountain-head"

CLAIM_TYPES = {"reported", "public_source", "calculated", "derived", "interpreted",
               "assumption", "unresolved", "owner_confirmation_required"}
CONFIDENCE = {"high", "medium", "low"}
CLAIM_STATUS = {"published", "draft", "unresolved", "withdrawn"}
EVIDENCE_TYPES = {"primary_public_document", "public_register", "company_disclosure",
                  "reference_dataset", "published_analysis"}

DATE_RE = re.compile(r"^\d{4}-\d{2}(-\d{2})?$")

errors: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


def load(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        err(f"{path}: cannot parse JSON — {exc}")
        return None


def check_date(owner: str, field: str, value, required: bool = True) -> None:
    if value is None:
        if required:
            err(f"{owner}: missing date field {field}")
        return
    if not DATE_RE.match(str(value)):
        err(f"{owner}: {field} '{value}' is not YYYY-MM or YYYY-MM-DD")


def validate(project: dict, claims_doc: dict, evidence_doc: dict) -> dict:
    """Validate all three documents and return computed stats."""
    # --- project ---
    for f in ("id", "canonical_url", "name", "entity_type", "location",
              "technology", "version", "updated_at", "links"):
        if f not in project:
            err(f"project: missing required field '{f}'")
    if not str(project.get("id", "")).startswith("project_"):
        err("project: id must start with 'project_'")
    check_date("project", "updated_at", project.get("updated_at"))
    for f in ("case_study_url", "methodology_url", "claims_url", "evidence_url",
              "api_docs_url", "openapi_url"):
        if f not in project.get("links", {}):
            err(f"project.links: missing '{f}'")

    # --- evidence ---
    evidence = evidence_doc.get("evidence", [])
    ev_ids = set()
    ev_supports: dict[str, list[str]] = {}
    for ev in evidence:
        eid = ev.get("evidence_id", "<missing>")
        if eid in ev_ids:
            err(f"evidence {eid}: duplicate evidence_id")
        ev_ids.add(eid)
        for f in ("source_title", "publisher", "supports_claims", "evidence_type",
                  "evidence_quality"):
            if f not in ev:
                err(f"evidence {eid}: missing required field '{f}'")
        if ev.get("evidence_type") not in EVIDENCE_TYPES:
            err(f"evidence {eid}: invalid evidence_type '{ev.get('evidence_type')}'")
        if ev.get("evidence_quality") not in CONFIDENCE:
            err(f"evidence {eid}: invalid evidence_quality")
        url, accessed = ev.get("source_url"), ev.get("accessed_at")
        if url is None and ev.get("status") != "unresolved":
            err(f"evidence {eid}: source_url is null but status is not 'unresolved' — "
                "missing sources must be explicitly marked, never silently omitted")
        if url is not None and not str(url).startswith("https://"):
            err(f"evidence {eid}: source_url must be https")
        if accessed is not None:
            check_date(f"evidence {eid}", "accessed_at", accessed)
        if url is not None and accessed is None:
            err(f"evidence {eid}: has source_url but no accessed_at date")
        ev_supports[eid] = ev.get("supports_claims", [])

    # --- claims ---
    claims = claims_doc.get("claims", [])
    if len(claims) < 8:
        err(f"claims: only {len(claims)} claims; MVP acceptance requires >= 8")
    claim_ids = set()
    for c in claims:
        cid = c.get("claim_id", "<missing>")
        if cid in claim_ids:
            err(f"claim {cid}: duplicate claim_id")
        claim_ids.add(cid)
        for f in ("statement", "claim_type", "confidence", "evidence_ids",
                  "last_verified", "status"):
            if f not in c:
                err(f"claim {cid}: missing required field '{f}'")
        if c.get("claim_type") not in CLAIM_TYPES:
            err(f"claim {cid}: invalid claim_type '{c.get('claim_type')}'")
        if c.get("confidence") not in CONFIDENCE:
            err(f"claim {cid}: invalid confidence")
        if c.get("status") not in CLAIM_STATUS:
            err(f"claim {cid}: invalid status")
        check_date(f"claim {cid}", "last_verified", c.get("last_verified"))
        # every published claim needs evidence, unless it is an assumption or unresolved
        if (c.get("status") == "published"
                and not c.get("evidence_ids")
                and c.get("claim_type") not in ("assumption", "unresolved")):
            err(f"claim {cid}: published with no evidence and not assumption/unresolved")
        for eid in c.get("evidence_ids", []):
            if eid not in ev_ids:
                err(f"claim {cid}: references unknown evidence '{eid}'")

    # evidence back-references must point at real claims and be consistent
    for eid, supports in ev_supports.items():
        for cid in supports:
            if cid not in claim_ids:
                err(f"evidence {eid}: supports_claims references unknown claim '{cid}'")
    for c in claims:
        for eid in c.get("evidence_ids", []):
            if eid in ev_supports and c["claim_id"] not in ev_supports[eid]:
                err(f"evidence {eid}: missing back-reference to claim {c['claim_id']}")

    # cross-document consistency
    for doc_name, doc in (("claims", claims_doc), ("evidence", evidence_doc)):
        if doc.get("project_id") != project.get("id"):
            err(f"{doc_name}: project_id does not match project id")

    by_type: dict[str, int] = {}
    for c in claims:
        by_type[c["claim_type"]] = by_type.get(c["claim_type"], 0) + 1
    public_sources = sum(1 for ev in evidence
                         if ev.get("evidence_type") != "published_analysis")
    return {
        "claims_total": len(claims),
        "claims_by_type": dict(sorted(by_type.items())),
        "derived_claims": by_type.get("derived", 0) + by_type.get("calculated", 0)
                          + by_type.get("interpreted", 0),
        "analyst_assumptions": by_type.get("assumption", 0),
        "owner_confirmation_required": by_type.get("owner_confirmation_required", 0),
        "public_sources": public_sources,
        "evidence_total": len(evidence),
        "unresolved_evidence": sum(1 for ev in evidence if ev.get("status") == "unresolved"),
    }


def api_payloads(project: dict, claims_doc: dict, evidence_doc: dict, stats: dict):
    """Assemble the three API responses from the source documents."""
    base = f"{SITE}/api/v1/projects/{SLUG}"
    common_links = {
        "canonical_url": project["canonical_url"],
        "methodology_url": project["links"]["methodology_url"],
        "self": None,  # filled per payload
    }
    proj = dict(project)
    proj["stats"] = stats
    proj["api"] = {
        "self": f"{base}.json",
        "claims_url": f"{base}/claims.json",
        "evidence_url": f"{base}/evidence.json",
        "docs": f"{SITE}/api/docs/",
        "openapi": f"{SITE}/openapi.json",
    }
    claims = {
        "project_id": project["id"],
        "canonical_url": project["canonical_url"],
        "methodology_url": project["links"]["methodology_url"],
        "project_url": f"{base}.json",
        "evidence_url": f"{base}/evidence.json",
        "version": claims_doc["version"],
        "updated_at": claims_doc["updated_at"],
        "currency_note": claims_doc.get("currency_note"),
        "count": stats["claims_total"],
        "claims": claims_doc["claims"],
    }
    evidence = {
        "project_id": project["id"],
        "canonical_url": project["canonical_url"],
        "methodology_url": project["links"]["methodology_url"],
        "project_url": f"{base}.json",
        "claims_url": f"{base}/claims.json",
        "version": evidence_doc["version"],
        "updated_at": evidence_doc["updated_at"],
        "count": stats["evidence_total"],
        "evidence": evidence_doc["evidence"],
    }
    _ = common_links
    return {
        ROOT / "api" / "v1" / "projects" / f"{SLUG}.json": proj,
        ROOT / "api" / "v1" / "projects" / SLUG / "claims.json": claims,
        ROOT / "api" / "v1" / "projects" / SLUG / "evidence.json": evidence,
    }


def html_escape(s: str) -> str:
    return html.escape(str(s), quote=True)


def claims_table_html(claims_doc: dict, evidence_doc: dict) -> str:
    ev_by_id = {e["evidence_id"]: e for e in evidence_doc["evidence"]}
    rows = []
    for c in claims_doc["claims"]:
        ev_cells = []
        for eid in c.get("evidence_ids", []):
            ev = ev_by_id.get(eid, {})
            url = ev.get("source_url")
            label = html_escape(eid)
            if url:
                ev_cells.append(f"<a href='{html_escape(url)}' target='_blank' rel='noopener'>{label}</a>")
            else:
                ev_cells.append(f"{label} <em>(unresolved)</em>")
        val = ""
        if c.get("value") is not None:
            val = f"{c['value']:g} {html_escape(c.get('unit', ''))}".strip()
        rows.append(
            "<tr>"
            f"<td><code>{html_escape(c['claim_id'])}</code></td>"
            f"<td>{html_escape(c['statement'])}"
            + (f"<br><small class='claim-limits'>{html_escape(c['limitations'])}</small>"
               if c.get("limitations") else "")
            + "</td>"
            f"<td>{val}</td>"
            f"<td><code>{html_escape(c['claim_type'])}</code></td>"
            f"<td>{html_escape(c['confidence'])}</td>"
            f"<td>{' '.join(ev_cells) or '&mdash;'}</td>"
            f"<td>{html_escape(c['last_verified'])}</td>"
            "</tr>"
        )
    return (
        "<div class='table-scroll'><table class='matrix claims-table'>"
        "<thead><tr><th>Claim ID</th><th>Statement</th><th>Value</th><th>Type</th>"
        "<th>Confidence</th><th>Evidence</th><th>Last verified</th></tr></thead>"
        "<tbody>" + "\n".join(rows) + "</tbody></table></div>"
    )


def stats_html(project: dict, stats: dict) -> str:
    rows = [
        ("Entity ID", f"<code>{html_escape(project['id'])}</code>"),
        ("Version", html_escape(project["version"])),
        ("Last updated", html_escape(project["updated_at"])),
        ("Last verified", html_escape(project.get("last_verified", project["updated_at"]))),
        ("Public sources", str(stats["public_sources"])),
        ("Published claims", str(stats["claims_total"])),
        ("Derived / calculated / interpreted claims", str(stats["derived_claims"])),
        ("Analyst assumptions", str(stats["analyst_assumptions"])),
        ("Owner confirmation required", str(stats["owner_confirmation_required"])),
        ("Unresolved evidence items", str(stats["unresolved_evidence"])),
    ]
    body = "\n".join(
        f"<tr><th scope='row'>{k}</th><td>{v}</td></tr>" for k, v in rows)
    return f"<table class='matrix entity-facts'><tbody>{body}</tbody></table>"


def inject(path: Path, marker: str, html: str, check_only: bool) -> None:
    text = path.read_text(encoding="utf-8")
    begin, end = f"<!-- BUILD:BEGIN {marker} -->", f"<!-- BUILD:END {marker} -->"
    if begin not in text or end not in text:
        err(f"{path.relative_to(ROOT)}: missing markers for '{marker}'")
        return
    pre, rest = text.split(begin, 1)
    _, post = rest.split(end, 1)
    new = f"{pre}{begin}\n{html}\n{end}{post}"
    if new != text:
        if check_only:
            err(f"{path.relative_to(ROOT)}: generated block '{marker}' is stale — run scripts/build_api.py")
        else:
            path.write_text(new, encoding="utf-8")
            print(f"  injected {marker} -> {path.relative_to(ROOT)}")


def dataset_jsonld(project: dict, stats: dict) -> str:
    ld = {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "@id": f"{SITE}/datasets/fountain-head-pre-dd/",
        "name": "Fountain Head Hybrid Energy — Pre-DD claim and evidence registry",
        "description": ("Structured claim and evidence registry for a public-information "
                        "Pre-DD screen of a diesel-PV-BESS hybrid microgrid at the Fountain Head "
                        "gold mine, Northern Territory, Australia. Screening outputs only; "
                        "not owner-verified data."),
        "url": f"{SITE}/datasets/fountain-head-pre-dd/",
        "sameAs": project["canonical_url"],
        "creator": {"@type": "Organization", "@id": f"{SITE}/#organization",
                     "name": "Heliovulcan Energy"},
        "dateModified": project["updated_at"],
        "version": project["version"],
        "inLanguage": "en",
        "isAccessibleForFree": True,
        "license": f"{SITE}/datasets/fountain-head-pre-dd/#terms",
        "spatialCoverage": {"@type": "Place",
                             "name": "Fountain Head / Pine Creek, Northern Territory, Australia"},
        "temporalCoverage": "2021-05/2026-07",
        "variableMeasured": [
            "indicative annual electricity demand", "indicative peak load",
            "disclosed PV capacity", "disclosed BESS capacity",
            "scenario TIC", "scenario CFADS", "indicative debt capacity",
            "modelled residual / buy-out", "indicative owner outcome",
        ],
        "distribution": [
            {"@type": "DataDownload", "encodingFormat": "application/json",
             "name": "Project entity JSON",
             "contentUrl": f"{SITE}/api/v1/projects/{SLUG}.json"},
            {"@type": "DataDownload", "encodingFormat": "application/json",
             "name": "Claims JSON",
             "contentUrl": f"{SITE}/api/v1/projects/{SLUG}/claims.json"},
            {"@type": "DataDownload", "encodingFormat": "application/json",
             "name": "Evidence JSON",
             "contentUrl": f"{SITE}/api/v1/projects/{SLUG}/evidence.json"},
        ],
    }
    return ("<script type=\"application/ld+json\">\n"
            + json.dumps(ld, indent=2, ensure_ascii=False)
            + "\n</script>")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="validate only; fail if generated outputs are stale")
    args = ap.parse_args()

    project = load(ROOT / "data" / "projects" / f"{SLUG}.json")
    claims_doc = load(ROOT / "data" / "claims" / f"{SLUG}.json")
    evidence_doc = load(ROOT / "data" / "evidence" / f"{SLUG}.json")
    if errors:
        print("\n".join(f"ERROR: {e}" for e in errors))
        return 1

    stats = validate(project, claims_doc, evidence_doc)

    # generate API files
    for path, payload in api_payloads(project, claims_doc, evidence_doc, stats).items():
        rendered = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
        if args.check:
            if not path.exists() or path.read_text(encoding="utf-8") != rendered:
                err(f"{path.relative_to(ROOT)}: stale or missing — run scripts/build_api.py")
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            if not path.exists() or path.read_text(encoding="utf-8") != rendered:
                path.write_text(rendered, encoding="utf-8")
                print(f"  wrote {path.relative_to(ROOT)}")

    # inject generated blocks into the human pages
    proj_page = ROOT / "projects" / SLUG / "index.html"
    ds_page = ROOT / "datasets" / "fountain-head-pre-dd" / "index.html"
    if proj_page.exists():
        inject(proj_page, "entity-facts", stats_html(project, stats), args.check)
        inject(proj_page, "claims-table",
               claims_table_html(claims_doc, evidence_doc), args.check)
    else:
        err("projects page missing")
    if ds_page.exists():
        inject(ds_page, "dataset-jsonld", dataset_jsonld(project, stats), args.check)
    else:
        err("dataset page missing")

    # sanity: sitemap contains the new canonical pages
    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    for u in (f"{SITE}/projects/{SLUG}/",
              f"{SITE}/datasets/fountain-head-pre-dd/",
              f"{SITE}/methods/pre-dd-f1-f4/",
              f"{SITE}/api/"):
        if u not in sitemap:
            err(f"sitemap.xml: missing <loc> for {u}")

    # sanity: openapi + api-catalog exist and parse
    for f in ("openapi.json", ".well-known/api-catalog"):
        p = ROOT / f
        if not p.exists():
            err(f"missing {f}")
        else:
            load(p)

    if errors:
        print("\n".join(f"ERROR: {e}" for e in errors))
        print(f"\nFAILED with {len(errors)} error(s).")
        return 1
    print(f"OK — {stats['claims_total']} claims, {stats['evidence_total']} evidence items, "
          f"{stats['unresolved_evidence']} unresolved. Stats: {json.dumps(stats['claims_by_type'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
