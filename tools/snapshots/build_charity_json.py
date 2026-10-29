"""Build charity snapshot input files automatically (replaces copying figures by hand).

Sources, all public and organisation-level:
  - Charity Commission register extract, annual return part A (latest year: government grants and contracts, volunteers)
    https://ccewuksprdoneregsadata1.blob.core.windows.net/data/txt/publicextract.charity_annual_return_parta.zip
  - OpenCharities (mirror of the register): five-year income and expenditure, activities, legal form
  - 360Giving Datastore API: grants received, by funder

Usage
  python build_charity_json.py --parta <path to publicextract.charity_annual_return_parta.txt> --list charities.tsv --out charities
  charities.tsv: number<TAB>display name  (one per line)
Then:  python snapshot.py charity --input charities/<number>.json --price 345
Run on a machine that can reach opencharities.uk and api.threesixtygiving.org (curl is used, so system proxies apply).
"""
import argparse, json, subprocess, datetime as dt, csv, re
from pathlib import Path

def get(url):
    out = subprocess.run(["curl", "-s", "-m", "30", url], capture_output=True, text=True).stdout
    return json.loads(out)

def grants(ids):
    seen, rows = set(), []
    for oid in ids:
        url = f"https://api.threesixtygiving.org/api/v1/org/{oid}/grants_received/?limit=100"
        while url:
            try: d = get(url)
            except Exception: break
            for r in d.get("results", []):
                if r["grant_id"] in seen: continue
                seen.add(r["grant_id"]); g = r["data"]
                f = (g.get("fundingOrganization") or [{}])[0].get("name", "Unknown funder")
                rows.append({"funder": f, "amount": float(g.get("amountAwarded") or 0), "date": g.get("awardDate", "")[:10]})
            url = d.get("next")
    return rows

def tidy_funder(n):
    n = re.sub(r"^The ", "", n.strip())
    if re.search(r"Department for (Digital, )?Culture, Media (&|and) Sport", n): return "DCMS"
    return {"Big Lottery Fund": "National Lottery Community Fund", "Lloyds Bank Foundation for England and Wales": "Lloyds Bank Foundation",
            "Department for Science, Innovation and Technology": "DSIT"}.get(n, n)

def main():
    a = argparse.ArgumentParser(); a.add_argument("--parta", required=True); a.add_argument("--list", required=True); a.add_argument("--out", default="charities")
    args = a.parse_args(); out = Path(args.out); out.mkdir(exist_ok=True)
    wanted = [l.rstrip("\n").split("\t") for l in open(args.list, encoding="utf-8") if l.strip()]
    nums = {w[0] for w in wanted}; parta = {}
    with open(args.parta, encoding="utf-8", errors="replace") as fh:
        for r in csv.DictReader(fh, delimiter="\t", quoting=csv.QUOTE_NONE):
            if r["registered_charity_number"] in nums and r["latest_fin_period_submitted_ind"] == "True":
                parta[r["registered_charity_number"]] = r
    today = dt.date.today().strftime("%-d %B %Y") if hasattr(dt.date.today(), "strftime") else ""
    for num, name in wanted:
        oc = get(f"https://opencharities.uk/ew/{num}.json"); p = parta.get(num, {})
        fy = sorted([y for y in oc.get("financial_years", []) if y.get("income") is not None], key=lambda y: y["end"])
        hist = [{"year_end": y["end"], "income": y["income"], "expenditure": y["expenditure"]} for y in fy][-5:]
        latest = hist[-1] if hist else {"year_end": oc["fin_period_end"], "income": oc["latest_income"], "expenditure": oc["latest_expenditure"]}
        i = lambda k: int(float(p.get(k) or 0))
        latest = dict(latest, government_grants=i("income_from_government_grants"), government_grant_sources=i("count_govt_grants"),
                      government_contracts=i("income_from_government_contracts"), government_contract_count=i("count_govt_contracts"),
                      volunteers=i("count_volunteers") or None, trustees=len(oc.get("trustees", [])))
        ids = [f"GB-CHC-{num}"] + ([f"GB-COH-{oc['company_number']}"] if oc.get("company_number") else [])
        g = grants(ids); agg = {}
        for r in g:
            k = tidy_funder(r["funder"]); agg.setdefault(k, {"funder": k, "grants": 0, "total": 0.0})
            agg[k]["grants"] += 1; agg[k]["total"] += r["amount"]
        years = sorted(r["date"][:4] for r in g if r["date"])
        # Register descriptions are often long or clumsy, so the subtitle shows the town from the registered address instead.
        parts = [x.strip() for x in (oc.get("address") or "").split(",") if x.strip()]
        desc = parts[-1].title() if parts else ""
        if len(parts) > 1 and desc in ("Dorset", "Hampshire", "Somerset", "Wiltshire", "Devon"): desc = f"{parts[-2].title()}, {desc}"
        d = {"name": name, "number": num, "description": desc, "legal_form": oc.get("legal_form"), "latest": latest, "history": hist,
             "grantnav": {"period": f"{years[0]}–{years[-1]}" if years else "", "count": len(g),
                          "funders": sorted(agg.values(), key=lambda f: -f["total"])},
             "source_note": (f"Sources: Charity Commission register, charity {num}: annual return for the year to {latest['year_end']} "
                             f"(register extract of {p.get('date_of_extract','')[:10]}) and financial history via OpenCharities; "
                             f"360Giving Datastore ({len(g)} grants). Grant data covers only funders that publish to 360Giving. Checked {dt.date.today().isoformat()}.")}
        (out / f"{num}.json").write_text(json.dumps(d, indent=1, ensure_ascii=False), encoding="utf-8")
        print(num, name, "| years", len(hist), "| grants", len(g), "| funders", len(agg), "| vols", latest["volunteers"], "| govt £", latest["government_grants"] + latest["government_contracts"])

if __name__ == "__main__": main()
