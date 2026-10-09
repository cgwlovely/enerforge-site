#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Publish the CBAM datasets that may be published, and only those.

Three files go to /data/. What is deliberately absent from all of them is the plant layer's
cross-source identifiers, the matching rules behind them, and the per-plant calibrated
intensities — the same boundary the methodology note sets out, and the same one the Safeguard
Atlas applies when it publishes a facility table without its map layer.

Every column here is either a public figure (trade volumes, EU default values, benchmarks,
published country intensities) or arithmetic over them that the methodology note describes in
full. Nothing here lets a reader reconstruct which asset in one register is which plant in
another, which is the part that took the work.

  cbam-exposure-by-origin.csv       198 origins, the default-value charge and what drives it
  cbam-verification-by-origin.csv   11 origins, default charge against the country average
  cbam-sources.csv                  the source register with licences, as on the methods page

Run:  python3 scripts/build_cbam_data.py
"""
import csv
import pathlib
import sys

SITE = pathlib.Path(__file__).resolve().parents[1]
MODEL = SITE.parents[1] / "safeguard_public_model"
REF = MODEL / "data/reference"
OUTD = SITE / "data"

PRICE, TRADE_YEAR, RULES_YEAR = 80.0, 2025, 2026
NAME = {
    "CN": "China", "TR": "Türkiye", "ID": "Indonesia", "IN": "India", "RU": "Russia", "EG": "Egypt",
    "UA": "Ukraine", "KR": "Korea", "GB": "United Kingdom", "DZ": "Algeria", "VN": "Viet Nam",
    "TW": "Taiwan", "US": "United States", "ZA": "South Africa", "MY": "Malaysia",
    "AE": "United Arab Emirates", "BR": "Brazil", "KZ": "Kazakhstan", "SA": "Saudi Arabia",
    "MZ": "Mozambique", "TN": "Tunisia", "JP": "Japan", "MK": "North Macedonia", "AU": "Australia",
    "VE": "Venezuela", "TH": "Thailand", "MD": "Moldova", "CA": "Canada", "BH": "Bahrain",
    "RS": "Serbia", "BY": "Belarus", "MA": "Morocco", "TT": "Trinidad and Tobago", "QA": "Qatar",
    "OM": "Oman", "NG": "Nigeria", "GE": "Georgia", "BA": "Bosnia and Herzegovina", "MX": "Mexico",
    "AR": "Argentina", "IR": "Iran", "IL": "Israel", "NZ": "New Zealand", "CL": "Chile",
    "LY": "Libya", "JO": "Jordan", "UZ": "Uzbekistan", "AZ": "Azerbaijan", "SG": "Singapore",
    "PH": "Philippines", "PK": "Pakistan", "BD": "Bangladesh", "AL": "Albania", "ME": "Montenegro",
    "CO": "Colombia", "PE": "Peru", "MN": "Mongolia", "ZW": "Zimbabwe", "CM": "Cameroon",
    "GH": "Ghana", "IQ": "Iraq", "KW": "Kuwait", "LK": "Sri Lanka", "HK": "Hong Kong",
    "XS": "Not specified",
}
f = lambda x: float(x) if x not in ("", None) else 0.0
r0 = lambda x, n=0: round(x, n) if n else round(x)


def write(path, header, rows, note):
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh, lineterminator="\n")      # this repo has been bitten by CRLF before
        w.writerow(header)
        w.writerows(rows)
    print(f"  {path.name:38s} {len(rows):>5} rows   {note}")


def exposure():
    src = list(csv.DictReader(open(REF / "cbam_global_exposure_2025.csv")))
    rows = []
    for r in sorted(src, key=lambda x: -f(x["cost_total_2026_eur"])):
        charge = f(r["cost_total_2026_eur"])
        if charge <= 0:
            continue
        rows.append([
            r["iso2"], NAME.get(r["iso2"], r["iso2"]),
            r0(f(r["t_total"])), r0(f(r["eur_total"])), r0(charge),
            round(f(r["cost_pct_of_value"]), 1),
            r0(f(r["cost_steel"])), r0(f(r["cost_alu"])), r0(f(r["cost_cement"])),
            r0(f(r["cost_fert"])), r0(f(r["cost_hydrogen"])),
            round(f(r["avg_default_see"]), 3),
        ])
    write(OUTD / "cbam-exposure-by-origin.csv",
          ["origin_iso2", "origin", "goods_in_scope_t", "goods_value_eur",
           "modelled_charge_eur", "charge_pct_of_goods_value", "charge_steel_eur",
           "charge_aluminium_eur", "charge_cement_eur", "charge_fertiliser_eur",
           "charge_hydrogen_eur", "trade_weighted_default_intensity_tco2e_per_t"],
          rows, "default-value charge by origin")
    return len(rows)


def verification():
    src = list(csv.DictReader(open(REF.parent / "../outputs/cbam/cbam_jrc_recalibration_steel.csv")))
    rows = []
    for r in src:
        rows.append([
            r["iso2"], NAME.get(r["iso2"], r["iso2"]),
            r0(f(r["t_covered"])), round(f(r["coverage_pct"]) * 100, 1),
            r["jrc_direct_7208"],
            r0(f(r["cost_default_eur"])), r0(f(r["cost_jrc_path_eur"])),
            r0(f(r["verification_value_jrc_eur"])),
        ])
    write(OUTD / "cbam-verification-by-origin.csv",
          ["origin_iso2", "origin", "steel_covered_t", "share_of_origin_steel_pct",
           "published_country_intensity_7208_tco2e_per_t", "charge_at_default_values_eur",
           "charge_at_country_average_eur", "modelled_reduction_eur"],
          rows, "default charge against the published country average")
    return len(rows)


def sources():
    src = list(csv.DictReader(open(REF / "cbam_source_licence_register.csv")))
    rows = []
    for r in src:
        if r["publish_class"] not in ("derive", "cite"):
            continue      # sources whose terms do not permit republication are not listed
        rows.append([r["source_name"], r["publisher"], r["url"], r["licence"],
                     "derived figures published" if r["publish_class"] == "derive"
                     else "cited, values not reproduced",
                     r["used_for"]])
    rows.sort(key=lambda x: (x[4] != "derived figures published", x[0]))
    write(OUTD / "cbam-sources.csv",
          ["source", "publisher", "url", "licence", "how_it_is_used", "what_it_is_used_for"],
          rows, "source register with licences")
    return len(rows)


def main():
    if not (REF / "cbam_global_exposure_2025.csv").exists():
        sys.exit("model repo reference tables not found")
    OUTD.mkdir(parents=True, exist_ok=True)
    print(f"CBAM datasets  (trade {TRADE_YEAR}, {RULES_YEAR} rules, €{PRICE:.0f} certificate)")
    n1, n2, n3 = exposure(), verification(), sources()
    print(f"\nnot published, by design: the plant layer's cross-source identifiers, the matching "
          f"rules behind them, and the per-plant calibrated intensities")
    return n1, n2, n3


if __name__ == "__main__":
    main()
