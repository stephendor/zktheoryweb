"""Public-data snapshot generator — one-page, accessible PDF built only from published data.

Each snapshot is built as an HTML page (lang="en-GB", real headings, lists, table headers, charts with
alt text) and printed to a tagged PDF with headless Chromium. Both files are saved: send the PDF, keep
the HTML as the accessible source.

Usage
  python snapshot.py apprenticeship --ukprn 10002841 --name "Haddon Training" --csv dfe_apprenticeship_achievement_rates_slim.csv
  python snapshot.py charity --input charities/1106963.json --price 345
  python snapshot.py area --input ap_area_bcp_dorset.json --provider "Rise Alternative Provision" --profile ap
  python snapshot.py pdf output/snapshot-haddon-training.html     (print an existing HTML snapshot to PDF)
  python snapshot.py check output/snapshot-haddon-training.pdf    (accessibility check: tagged, language, alt text, one page)

Setup (once, on Windows or macOS):  pip install playwright pypdf  &&  python -m playwright install chromium
On Linux, Chromium also needs system libraries:  python -m playwright install --with-deps chromium  (needs admin rights).

Apprenticeship data: DfE 'Achievement Rates Providers - Volumes and Rates by Provider, SSA T1, Level,
Standard-framework name' (Explore Education Statistics, Apprenticeships 2025/26 release).
Charity data: a small JSON file filled in from the Charity Commission register and 360Giving GrantNav
(see README.md).
"""
import argparse, base64, html, io, json, os, re, sys, warnings, datetime as dt
warnings.filterwarnings("ignore")
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

NAVY, TEAL, INK, GREY, MUTED = "#19324D", "#157A7A", "#23313F", "#8A99A6", "#5C6973"
FOOTER = "Stephen Dorman · Reporting and data analysis for small organisations · stephen@zktheory.org · zktheory.org/services"

plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 7.5, "axes.edgecolor": "#B9C8D0", "axes.labelcolor": INK,
                     "xtick.color": MUTED, "ytick.color": MUTED})

def style_ax(ax, grid="y"):
    for sp in ("top", "right"): ax.spines[sp].set_visible(False)
    ax.grid(axis=grid, color="#E3E9ED", lw=0.6); ax.set_axisbelow(True); ax.tick_params(length=0)

def png_data_uri(fig):
    buf = io.BytesIO(); fig.savefig(buf, format="png", dpi=220, bbox_inches="tight"); plt.close(fig)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
num = lambda s: pd.to_numeric(s, errors="coerce")
yr = lambda p: f"{p[:4]}/{p[4:]}"
ym = lambda d: dt.date.fromisoformat(d).strftime("%B %Y")
pct = lambda x: "—" if pd.isna(x) else f"{x:.1f}%"
e = html.escape

# ---------------------------------------------------------------- HTML + PDF
CSS = f"""
@page {{ size: A4; margin: 11mm 14mm 15mm 14mm; }}
* {{ box-sizing: border-box; }}
body {{ font-family: Helvetica, Arial, "Liberation Sans", "DejaVu Sans", sans-serif; color: {INK}; font-size: 8.6pt; line-height: 1.35; margin: 0; }}
.banner {{ background: {TEAL}; color: #fff; font-weight: 700; font-size: 7.8pt; padding: 3pt 6pt; margin: 0 0 6pt; }}
h1 {{ color: {NAVY}; font-size: 16.5pt; line-height: 1.2; margin: 0 0 2pt; }}
.sub {{ color: {TEAL}; font-size: 9.3pt; margin: 0 0 7pt; }}
h2 {{ color: {NAVY}; font-size: 10pt; margin: 8pt 0 3pt; }}
.tiles {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 2pt; margin: 0 0 6pt; padding: 0; list-style: none; }}
.tile {{ background: #EAF1F4; padding: 5pt 7pt; margin: 0; }}
.tile strong {{ display: block; font-weight: 700; color: {NAVY}; font-size: 14pt; line-height: 1.15; }}
.tile span {{ display: block; margin-top: 1pt; color: {MUTED}; font-size: 7.2pt; }}
.charts {{ display: grid; grid-template-columns: 1fr 1fr; gap: 8pt; margin: 2pt 0 4pt; }}
.fig {{ margin: 0; }}
.figtitle {{ font-size: 8.4pt; margin: 0 0 2pt; }}
.fig img {{ width: 100%; height: auto; display: block; }}
table {{ width: 100%; border-collapse: collapse; font-size: 7.7pt; }}
caption {{ text-align: left; font-weight: 700; color: {NAVY}; font-size: 10pt; padding: 6pt 0 3pt; }}
th {{ background: {NAVY}; color: #fff; text-align: left; padding: 2.5pt 4pt; font-weight: 700; }}
td {{ padding: 2.5pt 4pt; border-bottom: 0.5pt solid #B9C8D0; }}
td.num, th.num {{ text-align: right; }}
.questions {{ background: #F6F8FA; border: 0.5pt solid #B9C8D0; padding: 5pt 8pt; margin: 8pt 0 6pt; }}
.questions h2 {{ margin: 0 0 3pt; font-size: 9pt; }}
.questions h2 span {{ font-weight: 400; color: {MUTED}; }}
.questions ol {{ margin: 0; padding-left: 14pt; }}
.questions li {{ margin: 2pt 0; }}
.closing {{ margin: 0 0 4pt; }}
.source {{ color: {MUTED}; font-size: 7.2pt; margin: 0; }}
"""

def render_html(m):
    tiles = "".join(f'<li class="tile"><strong>{e(v)}</strong> <span>{e(l)}</span></li>' for v, l in m["tiles"])
    figs = "".join(f'<div class="fig"><h2 class="figtitle">{e(c["title"])}</h2><img src="{c["src"]}" alt="{e(c["alt"])}"></div>' for c in m["charts"])
    table = ""
    if m.get("table"):
        t = m["table"]
        head = "".join(f'<th scope="col"{" class=num" if i in t["numeric"] else ""}>{e(h)}</th>' for i, h in enumerate(t["header"]))
        body = "".join("<tr>" + "".join(f'<td{" class=num" if i in t["numeric"] else ""}>{e(str(c))}</td>' for i, c in enumerate(r)) + "</tr>" for r in t["rows"])
        table = f'<table><caption>{e(t["caption"])}</caption><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>'
    qs = "".join(f"<li>{e(q)}</li>" for q in m["questions"])
    return f"""<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><title>{e(m['doc_title'])}</title>
<meta name="author" content="Stephen Dorman"><meta name="description" content="Public-data snapshot">
<style>{CSS}</style></head>
<body><main>
<p class="banner">{e(m['banner'])}</p>
<h1>{e(m['title'])}</h1>
<p class="sub">{e(m['subtitle'])}</p>
<ul class="tiles" aria-label="Key figures">{tiles}</ul>
<div class="charts">{figs}</div>
{table}
<section class="questions"><h2>Questions this raises <span>— published data only, so these are questions, not conclusions</span></h2><ol>{qs}</ol></section>
<p class="closing"><strong>What a Review would add.</strong> {e(m['closing'])} The Reporting &amp; Insight Review is £{m.get('price', 345)}, fixed price, no VAT, with a full refund if it doesn't give you at least three improvements you'd act on. Details at <strong>zktheory.org/services</strong>.</p>
<p class="source">{e(m['source'])}</p>
</main></body></html>"""

def print_pdf(html_path, pdf_path, title):
    from playwright.sync_api import sync_playwright
    footer = (f'<div style="font-family:Helvetica,Arial,sans-serif;font-size:8px;color:{MUTED};width:100%;margin:0 14mm;'
              f'display:flex;justify-content:space-between;border-top:0.8px solid {TEAL};padding-top:3px">'
              f'<span>{e(FOOTER)}</span><span>Public-data snapshot</span></div>')
    with sync_playwright() as p:
        exe = os.environ.get("CHROMIUM_PATH")  # use an installed Chromium instead of Playwright's own
        b = p.chromium.launch(**({"executable_path": exe} if exe else {})); pg = b.new_page()
        pg.goto(Path(html_path).resolve().as_uri()); pg.wait_for_load_state("networkidle")
        pg.pdf(path=str(pdf_path), format="A4", print_background=True, prefer_css_page_size=True, tagged=True, outline=True,
               display_header_footer=True, header_template="<span></span>", footer_template=footer)
        b.close()

def check(pdf_path):
    """Return a list of problems: untagged, no language, no alt text on figures, more than one page."""
    from pypdf import PdfReader
    r = PdfReader(str(pdf_path)); root = r.trailer["/Root"]; problems = []
    if "/StructTreeRoot" not in root: problems.append("not tagged (no structure tree)")
    if not str(root.get("/Lang", "")).strip(): problems.append("no document language")
    if len(r.pages) != 1: problems.append(f"{len(r.pages)} pages, expected 1")
    figures, with_alt = 0, 0
    def walk(node, depth=0):
        nonlocal figures, with_alt
        if depth > 60: return
        node = node.get_object()
        if isinstance(node, dict):
            if node.get("/S") == "/Figure":
                figures += 1; with_alt += 1 if node.get("/Alt") else 0
            kids = node.get("/K")
            if kids is not None:
                for k in (kids if isinstance(kids, list) else [kids]):
                    try: walk(k, depth + 1)
                    except Exception: pass
        elif isinstance(node, list):
            for k in node: walk(k, depth + 1)
    if "/StructTreeRoot" in root: walk(root["/StructTreeRoot"])
    if figures == 0: problems.append("no tagged figures found")
    elif with_alt < figures: problems.append(f"{figures - with_alt} of {figures} figures have no alt text")
    return problems

def publish(m, outdir, tag):
    out = Path(outdir); out.mkdir(parents=True, exist_ok=True)
    html_path = out / f"snapshot-{tag}.html"; pdf_path = out / f"snapshot-{tag}.pdf"
    html_path.write_text(render_html(m), encoding="utf-8")
    return to_pdf(html_path, m["doc_title"])

def to_pdf(html_path, title=""):
    html_path = Path(html_path); pdf_path = html_path.with_suffix(".pdf")
    try:
        print_pdf(html_path, pdf_path, title)
    except Exception as ex:
        print(f"HTML saved: {html_path}")
        print("PDF not produced: headless Chromium could not start on this machine "
              f"({str(ex).splitlines()[0][:120]}).")
        print("Fix: run the one-off setup in the header of this script, or print the HTML from another machine with:")
        print(f"     python snapshot.py pdf \"{html_path}\"")
        return None
    problems = check(pdf_path)
    print(pdf_path); print("  accessibility check:", "passed" if not problems else "; ".join(problems))
    return pdf_path

CLOSE_APP = ("The published figures show where results differ. Your own records show why: which learners, employers and points in the "
             "programme. A Review maps that in five working days and sets up a monthly view so you see it before it is published.")
CLOSE_CHAR = ("Published figures show the shape of the funding. Your own records show what each funder needs, how long it takes to produce, "
              "and where the numbers disagree. A Review maps one recurring report in five working days and shows what it would take to produce it once, checked, for every funder.")

# ---------------------------------------------------------------- apprenticeship
def apprenticeship(ukprn, name, csv, outdir, price=345):
    df = pd.read_pickle(csv) if str(csv).endswith(".pkl") else pd.read_csv(csv, dtype=str)
    years = sorted(df.time_period.unique()); latest = years[-1]
    tot_mask = (df.ssa_tier_1 == "Total") & (df.level == "Total") & (df.std_fwk_name_stcode == "Total")
    def rate(d):
        L, A = num(d.leavers), num(d.achievers); ok = L.notna() & A.notna()
        return A[ok].sum() / L[ok].sum() * 100 if L[ok].sum() else np.nan
    allp = {y: rate(df[tot_mask & (df.age_youth_adult == "Total") & (df.age_group == "Total") & (df.time_period == y)]) for y in years}
    me = df[df.provider_ukprn == str(ukprn)]
    if me.empty: raise SystemExit(f"UKPRN {ukprn} not found")
    me_tot = me[(tot_mask & (df.age_youth_adult == "Total") & (df.age_group == "Total")).loc[me.index]].set_index("time_period")
    prov = {y: num(pd.Series([me_tot.loc[y, "achievement_rate"]])).iloc[0] if y in me_tot.index else np.nan for y in years}
    ret = num(pd.Series([me_tot.loc[latest, "retention_rate"]])).iloc[0]
    leavers = me_tot.loc[latest, "leavers"]

    ages = [("16-18", "16-18", "16-18"), ("19-23", "19+", "19-23"), ("24+", "19+", "24+")]
    age_rows = []
    for lab, ay, ag in ages:
        m_ = tot_mask & (df.age_youth_adult == ay) & (df.age_group == ag) & (df.time_period == latest)
        p = me[m_.loc[me.index]]
        age_rows.append((lab, num(p.achievement_rate).iloc[0] if len(p) else np.nan, rate(df[m_])))

    sm = (df.std_fwk_name_stcode != "Total") & (df.level != "Total") & (df.ssa_tier_1 != "Total") & (df.age_youth_adult == "Total") & (df.age_group == "Total") & (df.time_period == latest)
    mine = me[sm.loc[me.index]].copy(); mine["L"] = num(mine.leavers); mine["R"] = num(mine.achievement_rate)
    mine = mine[mine.L >= 20].sort_values("L", ascending=False)
    nat_std = df[sm].groupby("std_fwk_name_stcode").apply(rate, include_groups=False)
    std_rows = [(re.sub(r"-ST\d+$", "", r.std_fwk_name_stcode), r.level.replace(" Level", ""), int(r.L), r.R,
                 nat_std.get(r.std_fwk_name_stcode, np.nan), r.R - nat_std.get(r.std_fwk_name_stcode, np.nan)) for _, r in mine.head(8).iterrows()]

    # chart 1
    fig, ax = plt.subplots(figsize=(3.6, 2.6)); style_ax(ax); xs = [yr(y) for y in years]
    ax.plot(xs, [allp[y] for y in years], color=GREY, lw=2, ls="--", marker="o", ms=3)
    ax.plot(xs, [prov[y] for y in years], color=NAVY, lw=2, marker="o", ms=3)
    lo = min(v for v in list(prov.values()) + list(allp.values()) if not pd.isna(v)); ymin = max(0, lo - 12)
    ya, yp = allp[latest], prov[latest]; sep = (100 - ymin) * 0.16
    if abs(ya - yp) < sep:  # keep the two end labels from overlapping
        mid = (ya + yp) / 2; hi_, lo_ = mid + sep / 2, mid - sep / 2
        ya, yp = (hi_, lo_) if allp[latest] >= prov[latest] else (lo_, hi_)
    ax.text(2.12, ya, f"All providers\n{allp[latest]:.1f}%", va="center", fontsize=7, color=INK)
    ax.text(2.12, yp, f"{name if len(name) <= 22 else name[:21] + '…'}\n{prov[latest]:.1f}%", va="center", fontsize=7, color=NAVY)
    ax.set_xlim(-0.2, 3.1); ax.set_ylim(ymin, 100); ax.set_ylabel("Achievement rate, %")
    c1 = {"title": "Apprenticeship achievement rate, three years", "src": png_data_uri(fig),
          "alt": f"Line chart of achievement rate by year. {name}: " + "; ".join(f"{yr(y)} {pct(prov[y])}" for y in years) +
                 ". All providers: " + "; ".join(f"{yr(y)} {pct(allp[y])}" for y in years) + "."}
    # chart 2
    fig, ax = plt.subplots(figsize=(3.6, 2.6)); style_ax(ax); x = np.arange(len(age_rows)); w = 0.36
    pv = [0 if pd.isna(r[1]) else r[1] for r in age_rows]; nv = [r[2] for r in age_rows]
    ax.bar(x - w / 2 - 0.01, pv, w, color=NAVY, label=name); ax.bar(x + w / 2 + 0.01, nv, w, color=GREY, label="All providers")
    for i, r in enumerate(age_rows):
        ax.text(i - w / 2, pv[i] + 1.5, "n/a" if pd.isna(r[1]) else f"{r[1]:.0f}%", ha="center", fontsize=6.8, color=INK)
        ax.text(i + w / 2, nv[i] + 1.5, f"{nv[i]:.0f}%", ha="center", fontsize=6.8, color=INK)
    ax.set_xticks(x, [f"Age {r[0]}" for r in age_rows]); ax.set_ylim(0, 100); ax.set_ylabel("Achievement rate, %")
    ax.legend(frameon=False, fontsize=6.8, loc="upper left", ncol=2)
    c2 = {"title": f"Achievement rate by age, {yr(latest)}", "src": png_data_uri(fig),
          "alt": f"Bar chart comparing achievement rate by age group in {yr(latest)}. " +
                 "; ".join(f"age {a}: {name} {pct(p)}, all providers {pct(n)}" for a, p, n in age_rows) + "."}

    first = next((y for y in years if not pd.isna(prov[y])), latest)   # first year this provider has a published rate
    gap = prov[latest] - allp[latest]; change = prov[latest] - prov[first]; nchg = allp[latest] - allp[first]
    prev = years[-2] if len(years) > 1 else years[0]; last = prov[latest] - prov[prev]
    q1 = (f"The achievement rate is {abs(gap):.1f} points {'above' if gap >= 0 else 'below'} the all-provider rate in {yr(latest)}. " +
          (f"Since {yr(first)} it has {'risen' if change >= 0 else 'fallen'} {abs(change):.1f} points, against {nchg:+.1f} for all providers. " if first != latest else ""))
    if change >= nchg:
        q1 += "What is behind the improvement, and is it holding in this year's in-year figures?"
    elif gap >= 0 and change < 0:
        q1 += "It is still above the sector, but has dipped while the sector improved. Which standards or cohorts account for the dip?"
    elif gap >= 0:
        q1 += "It is still above the sector, but the sector has improved faster. Which standards or cohorts have not kept pace?"
    elif last > 2:
        q1 += f"The latest year was up {last:.1f} points. Is that recovery holding in this year's in-year figures, and which standards are still behind?"
    elif change >= 0:
        q1 += "The rate is rising, but more slowly than the sector, so the gap has widened. Which standards or cohorts have not kept pace?"
    else:
        q1 += "Which part of the provision is holding the rate back?"
    qs = [q1]
    valid = [r for r in age_rows if not pd.isna(r[1])]
    if valid:
        wa = min(valid, key=lambda r: r[1] - r[2])
        if wa[1] - wa[2] < -3:
            qs.append(f"Learners aged {wa[0]} achieve at {wa[1]:.1f}% against {wa[2]:.1f}% across all providers. Is this concentrated in particular standards or employers?")
    vs = [r for r in std_rows if not pd.isna(r[5])]
    if vs:
        w_ = min(vs, key=lambda r: r[5] * r[2])
        if w_[5] < -3:
            pos = [r for r in vs if r[5] > 0]
            if pos:
                b_ = max(pos, key=lambda r: r[5])
                q = (f"{w_[0]} ({w_[2]} leavers) is {abs(w_[5]):.1f} points below the national rate for the same standard, while {b_[0]} is "
                     f"{b_[5]:.1f} points above. The gap looks specific to particular programmes rather than provider-wide. Where in {w_[0]} do learners leave?")
            elif len(vs) > 1:
                wd = min(vs, key=lambda r: r[5])
                q = (f"{'Both' if len(vs) == 2 else f'All {len(vs)}'} of the largest standards are below their national rates, the widest gap being {wd[0]} ({wd[2]} leavers, "
                     f"{abs(wd[5]):.1f} points). Is there a common cause, such as recruitment, employer engagement or end-point assessment readiness, "
                     "or does each programme have its own?")
                w_ = wd
            else:
                q = (f"{w_[0]} ({w_[2]} leavers) is {abs(w_[5]):.1f} points below the national rate for the same standard. Where in that programme "
                     "do learners leave: early withdrawal, breaks in learning, or at end-point assessment?")
            if w_[2] <= 30:
                q += f" With around {w_[2]} leavers, a single cohort can move this figure noticeably."
            qs.append(q)
    qs.append("Published rates are a year behind. Can the team see this year's position by standard, employer and caseload before it is published?")

    m = {"doc_title": f"{name} public-data snapshot",
         "banner": "PUBLIC-DATA SNAPSHOT — built only from DfE published statistics. No internal data was used.",
         "title": f"{name} — apprenticeship achievement at a glance",
         "subtitle": f"UKPRN {ukprn} · Apprenticeship achievement rates {yr(years[0])} to {yr(latest)} · Source: Department for Education",
         "tiles": [(f"{prov[latest]:.1f}%", f"achievement rate {yr(latest)}"), (f"{gap:+.1f} pts", "compared with all providers"),
                   (f"{ret:.1f}%", "retention rate"), (str(leavers), f"leavers in {yr(latest)}")],
         "charts": [c1, c2],
         "table": {"caption": f"Largest standards, {yr(latest)} (20 or more leavers)", "numeric": {2, 3, 4, 5},
                   "header": ["Standard", "Level", "Leavers", f"{name} rate", "National rate", "Difference (points)"],
                   "rows": [[a, b, c, pct(d), pct(n), "—" if pd.isna(f) else f"{f:+.1f}"] for a, b, c, d, n, f in std_rows]} if std_rows else None,
         "questions": qs, "closing": CLOSE_APP, "price": price,
         "source": "Source: DfE, Apprenticeships 2025/26 release, 'Achievement Rates Providers' data set (published 16 July 2026). Leaver counts are "
                   "rounded to the nearest 10 by DfE and small groups are suppressed. 'All providers' and national standard rates are calculated from "
                   "the published provider figures and may differ slightly from DfE headline rates."}
    return publish(m, outdir, slug(name))

# ---------------------------------------------------------------- charity
def charity(path, outdir, price=345):
    d = json.loads(Path(path).read_text(encoding="utf-8")); name = d["name"]
    hist = sorted(d.get("history", []), key=lambda r: r["year_end"]); latest = d["latest"]
    funders = sorted(d.get("grantnav", {}).get("funders", []), key=lambda f: -f["total"]); gtotal = sum(f["total"] for f in funders)

    fig, ax = plt.subplots(figsize=(3.6, 2.6)); style_ax(ax)
    rows = hist if len(hist) >= 2 else [{"year_end": latest["year_end"], "income": latest["income"], "expenditure": latest["expenditure"]}]
    x = np.arange(len(rows)); w = 0.36
    inc = [r["income"] / 1000 for r in rows]; exp = [r["expenditure"] / 1000 for r in rows]
    ax.bar(x - w / 2 - 0.01, inc, w, color=NAVY, label="Income"); ax.bar(x + w / 2 + 0.01, exp, w, color=GREY, label="Expenditure")
    many = len(rows) > 3; lab = (lambda v: f"{v:.0f}") if many else (lambda v: f"£{v:.0f}k"); fs = 5.8 if many else 6.6
    for i in range(len(rows)):
        ax.text(i - w / 2 - 0.01, inc[i] + max(inc + exp) * 0.02, lab(inc[i]), ha="center", fontsize=fs, color=INK)
        ax.text(i + w / 2 + 0.01, exp[i] + max(inc + exp) * 0.02, lab(exp[i]), ha="center", fontsize=fs, color=INK)
    if many:
        ends = {dt.date.fromisoformat(r["year_end"]).strftime("%d %B") for r in rows}
        ax.set_xticks(x, [r["year_end"][:4] for r in rows])
        ax.set_xlabel(f"Year ending {ends.pop().lstrip('0')}" if len(ends) == 1 else "Financial year end", fontsize=6.8)
    else:
        ax.set_xticks(x, [dt.date.fromisoformat(r["year_end"]).strftime("YE %b %Y") for r in rows])
    ax.set_ylim(0, max(inc + exp) * 1.25)
    ax.set_ylabel("£ thousand"); ax.legend(frameon=False, fontsize=6.8, loc="upper left", ncol=2)
    c1 = {"title": "Income and expenditure" + (f", {len(rows)} years" if len(rows) > 1 else ", latest year"), "src": png_data_uri(fig),
          "alt": "Bar chart of income and expenditure. " + "; ".join(f"year to {ym(r['year_end'])}: income £{r['income']:,.0f}, expenditure £{r['expenditure']:,.0f}" for r in rows) + "."}

    if not funders:
        raise SystemExit(f"{name}: no 360Giving grants found; send the made-up example instead.")
    fig, ax = plt.subplots(figsize=(3.6, 2.6)); style_ax(ax, "x")
    top = funders[:6]; other = gtotal - sum(f["total"] for f in top)
    labels = [f["funder"] for f in top] + (["All other funders"] if other > 0 else [])
    shares = [f["total"] / gtotal * 100 for f in top] + ([other / gtotal * 100] if other > 0 else [])
    y = np.arange(len(labels))[::-1]
    ax.barh(y, shares, color=[TEAL] + [NAVY] * (len(labels) - 1), height=0.55)
    for yi, s in zip(y, shares): ax.text(s + 1, yi, f"{s:.0f}%", va="center", fontsize=6.8, color=INK)
    ax.set_yticks(y, [l if len(l) <= 34 else l[:33] + "…" for l in labels]); ax.tick_params(axis="y", labelsize=6.4)
    ax.set_xlim(0, max(shares) * 1.25); ax.set_xlabel("% of recorded grant value")
    c2 = {"title": f"Who has funded {name}, {d['grantnav']['period']}", "src": png_data_uri(fig),
          "alt": "Horizontal bar chart of each funder's share of recorded grant value: " + "; ".join(f"{l} {s:.0f}%" for l, s in zip(labels, shares)) + "."}

    top_share = funders[0]["total"] / gtotal * 100 if funders else 0
    surplus = latest["income"] - latest["expenditure"]; gov = latest.get("government_grants", 0); qs = []
    if funders:
        qs.append(f"{funders[0]['funder']} accounts for {top_share:.0f}% of the grant value recorded on 360Giving, and the top three funders for "
                  f"{sum(f['total'] for f in funders[:3]) / gtotal * 100:.0f}%. Each will want its own figures. Are they produced from one set of records, or rebuilt for each funder?")
    deficits = [r for r in hist if r["expenditure"] > r["income"]]
    if len(hist) >= 3 and surplus >= 0 and deficits:
        lo, hi = min(r["income"] for r in hist), max(r["income"] for r in hist)
        qs.append(f"Over {len(hist)} years income has ranged from £{lo / 1000:,.0f}k to £{hi / 1000:,.0f}k, and spending exceeded income in {len(deficits)} of them "
                  f"before a £{surplus / 1000:,.0f}k surplus in the year to {ym(latest['year_end'])}. Swings like this often reflect when multi-year grants are received "
                  "rather than when they are spent. Can trustees see which funds are restricted and how they will be used over the next two to three years?")
    if surplus < 0:
        qs.append(f"Expenditure exceeded income by £{-surplus:,.0f} in the year to {ym(latest['year_end'])}. When that happens through planned use of reserves "
                  "or grant timing, trustees need a clear forward view. How far ahead can the board currently see?")
    con = latest.get("government_contracts", 0) or 0; gtot = (gov or 0) + con
    if latest["income"] > 500000:
        # SORP 2026 applies to reporting years beginning on or after 1 January 2026 (Tier 2: income over £500,000).
        first = dt.date.fromisoformat(latest["year_end"]) + dt.timedelta(days=1)
        while first < dt.date(2026, 1, 1): first = first.replace(year=first.year + 1)
        started = ("The first such year has already started. " if first <= dt.date.today()
                   else f"The first such year begins on {first.day} {first:%B %Y}. ")
        qs.insert(0, f"Income of £{latest['income'] / 1000:,.0f}k puts the charity above £500,000, where the Charities SORP 2026 makes impact reporting a requirement "
                  "in the trustees' report for reporting years beginning on or after 1 January 2026. " + started +
                  "Is the evidence for that section being collected as the year goes, or will it be pieced together at year end?")
    if gtot and gtot >= 0.05 * latest["income"]:
        parts = []
        if gov: parts.append(f"£{gov:,.0f} from {latest.get('government_grant_sources') or 'several'} government grant{'s' if latest.get('government_grant_sources') != 1 else ''}")
        if con: parts.append(f"£{con:,.0f} from {latest.get('government_contract_count') or 'several'} government contract{'s' if latest.get('government_contract_count') != 1 else ''}")
        qs.append(f"{gtot / latest['income'] * 100:.0f}% of income came from public bodies: {' and '.join(parts)}. "
                  "Commissioned work usually brings its own monitoring returns. How much staff time do those returns take each quarter?")
    if (latest.get("volunteers") or 0) >= 5:
        # SORP 2026 module 1, para 1.26: Tier 2 and 3 (income over £500,000) only, and only if the charity reports on
        # general volunteers: it should give their number and the activities they support, and may give hours.
        # Keep in step with /services/guides/trustees-report-impact-data/.
        if latest["income"] > 500000:
            qs.append(f"{latest['volunteers']:,} volunteers support the charity. Under SORP 2026, charities with income over £500,000 that report on their "
                      "volunteers should give the number and the activities they support, and may give hours. "
                      "Are volunteer hours and roles recorded as they happen, so they can be reported and valued?")
        else:
            qs.append(f"{latest['volunteers']:,} volunteers support the charity. Volunteer hours are strong evidence in funding bids, and under SORP 2026 "
                      "charities with income over £500,000 that report on their volunteers should give the number and the activities they support. "
                      "Are hours and roles recorded as they happen, so they can be reported and valued?")
    qs = qs[:4]

    m = {"doc_title": f"{name} public-data snapshot",
         "banner": "PUBLIC-DATA SNAPSHOT — built only from the Charity Commission register and 360Giving. No internal data was used.",
         "title": f"{name} — funding and finance at a glance",
         "subtitle": f"Registered charity {d['number']} · {d.get('description', '')}",
         "tiles": [(f"£{latest['income'] / 1000:,.0f}k", f"income, year to {ym(latest['year_end'])}"),
                   (str(d["grantnav"]["count"]), f"grants recorded, {d['grantnav']['period']}"),
                   (f"{top_share:.0f}%", "of grant value from the largest funder"), (f"{latest['volunteers']:,}" if latest.get("volunteers") else "—", "volunteers")],
         "charts": [c1, c2], "table": None, "questions": qs, "closing": CLOSE_CHAR, "price": price, "source": d.get("source_note", "")}
    return publish(m, outdir, slug(name))

# ---------------------------------------------------------------- alternative provision: area context
CLOSE_AREA = ("Published figures show the demand around you. Your own registers show what each school and authority needs, how long the "
              "returns take, and where the figures disagree. A Review maps one recurring report in five working days and shows how to produce it once, checked, for every commissioner.")

def area(path, provider, profile, outdir, price=345):
    """One-page commissioning-context snapshot for an AP or specialist post-16 provider, from LA-level DfE statistics only."""
    d = json.loads(Path(path).read_text(encoding="utf-8")); e, ab = d["ehcp"], d["absence"]
    yrs = lambda ser: sorted(ser)
    tot = {k: e[k]["Total"] for k in ("BCP", "Dorset", "England")}
    last = max(tot["BCP"]); base = "202122"
    growth = {k: (tot[k][last][0] / tot[k][base][0] - 1) * 100 for k in tot}
    cols = {"BCP": NAVY, "Dorset": TEAL, "England": GREY}
    if profile == "post16":
        ser = {k: e[k]["Specialist post 16 institutions"] for k in ("BCP", "Dorset", "England")}
        fig, ax = plt.subplots(figsize=(3.6, 2.6)); style_ax(ax)
        for k in ("BCP", "Dorset"):
            t = [y for y in yrs(ser[k]) if y >= "201920"]; ax.plot(range(len(t)), [ser[k][y][0] for y in t], marker="o", ms=3, color=cols[k], label=k)
            ax.text(len(t) - 1 + 0.1, ser[k][t[-1]][0], f"{ser[k][t[-1]][0]}", fontsize=6.6, va="center", color=INK)
        ax.set_xticks(range(len(t)), [yr(y)[2:] for y in t]); ax.set_ylabel("EHC plans"); ax.set_ylim(0, None)
        ax.set_xlabel("January of each school year", fontsize=6.8); ax.legend(frameon=False, fontsize=6.8, loc="upper left")
        c1 = {"title": "EHC plans in specialist post-16 institutions", "src": png_data_uri(fig),
              "alt": "Line chart of EHC plans in specialist post-16 institutions. " + "; ".join(f"{k}: " + ", ".join(f"{yr(y)} {ser[k][y][0]}" for y in yrs(ser[k]) if y >= '201920') for k in ('BCP', 'Dorset')) + "."}
        t3 = [y for y in yrs(ser["England"]) if y >= "202324"]
        fig, ax = plt.subplots(figsize=(3.6, 2.6)); style_ax(ax); x = np.arange(len(t3)); w = 0.26
        for i, k in enumerate(("BCP", "Dorset", "England")):
            v = [ser[k][y][1] for y in t3]; ax.bar(x + (i - 1) * w, v, w, color=cols[k], label=k)
            for xi, vi in zip(x, v): ax.text(xi + (i - 1) * w, vi + 0.08, f"{vi:.1f}", ha="center", fontsize=6.2, color=INK)
        ax.set_xticks(x, [yr(y) for y in t3]); ax.set_ylabel("% of all EHC plans"); ax.legend(frameon=False, fontsize=6.8, loc="upper left", ncol=3); ax.set_ylim(0, 6)
        c2 = {"title": "Share of EHC plans in specialist post-16 institutions", "src": png_data_uri(fig),
              "alt": "Bar chart of the share of all EHC plans held by learners in specialist post-16 institutions. " + "; ".join(f"{yr(y)}: " + ", ".join(f"{k} {ser[k][y][1]:.1f}%" for k in ('BCP', 'Dorset', 'England')) for y in t3) + "."}
        n2 = ser["BCP"][last][0] + ser["Dorset"][last][0]
        tiles = [(f"{ser['BCP'][last][1]:.1f}%", f"of BCP EHC plans in specialist post-16 institutions, January 20{last[-2:]}"),
                 (f"{ser['Dorset'][last][1]:.1f}%", "the same share in Dorset"), (f"{ser['England'][last][1]:.1f}%", "England"),
                 (f"{n2}", "plans across the two authorities")]
        qs = [f"In January 20{last[-2:]}, {ser['BCP'][last][1]:.1f}% of BCP's EHC plans and {ser['Dorset'][last][1]:.1f}% of Dorset's were held by learners in specialist post-16 institutions, "
              f"more than twice England's {ser['England'][last][1]:.1f}%. With {n2} such placements across the two authorities, is each authority's reporting produced once from your own records, or rebuilt for each?",
              f"EHC plans have grown by {growth['BCP']:.0f}% in BCP and {growth['Dorset']:.0f}% in Dorset since {yr(base)}. Annual reviews, attendance and destinations follow every plan. How much staff time goes into preparing them each term?",
              "As numbers rise faster than budgets, authorities compare providers on cost and outcomes. Could you show the full cost of a placement, and what it achieves, for each authority you work with?"]
        subtitle = "Specialist post-16 placements for learners with EHC plans in Bournemouth, Christchurch and Poole (BCP) and Dorset"
    else:
        ee = {k: e[k]["Total educated elsewhere"] for k in ("BCP", "Dorset", "England")}
        fig, ax = plt.subplots(figsize=(3.6, 2.6)); style_ax(ax)
        for k in ("BCP", "Dorset"):
            t = [y for y in yrs(ee[k]) if y >= "201920"]; ax.plot(range(len(t)), [ee[k][y][0] for y in t], marker="o", ms=3, color=cols[k], label=k)
            ax.text(len(t) - 1 + 0.1, ee[k][t[-1]][0], f"{ee[k][t[-1]][0]}", fontsize=6.6, va="center", color=INK)
        ax.set_xticks(range(len(t)), [yr(y)[2:] for y in t]); ax.set_ylabel("EHC plans"); ax.set_ylim(0, None)
        ax.set_xlabel("January of each school year", fontsize=6.8); ax.legend(frameon=False, fontsize=6.8, loc="upper left")
        c1 = {"title": "EHC plans for children educated outside school", "src": png_data_uri(fig),
              "alt": "Line chart of EHC plans for children and young people educated elsewhere (outside schools and colleges). " + "; ".join(f"{k}: " + ", ".join(f"{yr(y)} {ee[k][y][0]}" for y in yrs(ee[k]) if y >= '201920') for k in ('BCP', 'Dorset')) + "."}
        sv = {k: ab[k]["Severe absence"] for k in ("BCP", "Dorset", "England")}; t3 = sorted(sv["England"])
        fig, ax = plt.subplots(figsize=(3.6, 2.6)); style_ax(ax); x = np.arange(len(t3)); w = 0.26
        for i, k in enumerate(("BCP", "Dorset", "England")):
            v = [sv[k][y] for y in t3]; ax.bar(x + (i - 1) * w, v, w, color=cols[k], label=k)
            for xi, vi in zip(x, v): ax.text(xi + (i - 1) * w, vi + 0.08, f"{vi:.1f}", ha="center", fontsize=5.8, color=INK)
        ax.set_xticks(x, [yr(y) for y in t3]); ax.set_ylabel("% of secondary pupils"); ax.legend(frameon=False, fontsize=6.8, loc="upper left", ncol=3); ax.set_ylim(0, 6.5)
        c2 = {"title": "Severe absence, state-funded secondary schools", "src": png_data_uri(fig),
              "alt": "Bar chart of the percentage of secondary pupils missing half or more of sessions. " + "; ".join(f"{yr(y)}: " + ", ".join(f"{k} {sv[k][y]:.1f}%" for k in ('BCP', 'Dorset', 'England')) for y in t3) + "."}
        la = max(t3)
        tiles = [(f"{ee['BCP'][last][0]}", f"BCP EHC plans for children educated outside school, January 20{last[-2:]} (up from {ee['BCP'][base][0]})"),
                 (f"{ee['BCP'][last][1]:.1f}%", f"of BCP plans, against {ee['England'][last][1]:.1f}% in England"),
                 (f"{sv['Dorset'][la]:.1f}%", f"Dorset secondary pupils severely absent, {yr(la)} (England {sv['England'][la]:.1f}%)"),
                 (f"+{growth['BCP']:.0f}% / +{growth['Dorset']:.0f}%", f"EHC plans since {yr(base)}, BCP / Dorset")]
        qs = [f"BCP now has {ee['BCP'][last][0]} children and young people with EHC plans educated outside school, {ee['BCP'][last][1]:.1f}% of all plans against {ee['England'][last][1]:.1f}% in England, "
              f"up from {ee['BCP'][base][0]} in {yr(base)}. As placements grow, how long does it take to report attendance and progress back to each school or authority each half-term?",
              f"Severe absence (missing half or more of sessions) in Dorset secondary schools rose from {sv['Dorset'][min(t3)]:.1f}% in {yr(min(t3))} to {sv['Dorset'][la]:.1f}% in {yr(la)}, above England's {sv['England'][la]:.1f}%. "
              "Can your reports show each commissioner a young person's attendance against their position at referral?",
              "As demand rises faster than budgets, commissioners compare providers on cost and outcomes. Could you show the full cost of a placement, and what it achieves, for each commissioner?"]
        subtitle = "Demand for alternative and out-of-school provision in Bournemouth, Christchurch and Poole (BCP) and Dorset"
    m = {"doc_title": f"{provider} public-data snapshot",
         "banner": f"PUBLIC-DATA SNAPSHOT — built only from DfE local authority statistics. No data about {provider} or its learners was used.",
         "title": f"Prepared for {provider} — the commissioning picture in BCP and Dorset", "subtitle": subtitle,
         "tiles": tiles, "charts": [c1, c2], "table": None, "questions": qs, "closing": CLOSE_AREA, "price": price, "source": d["source_note"]}
    return publish(m, outdir, slug(provider))

if __name__ == "__main__":
    a = argparse.ArgumentParser(); sub = a.add_subparsers(dest="mode", required=True)
    ap_ = sub.add_parser("apprenticeship"); ap_.add_argument("--ukprn", required=True); ap_.add_argument("--name", required=True)
    ap_.add_argument("--csv", required=True); ap_.add_argument("--out", default="output")
    ch = sub.add_parser("charity"); ch.add_argument("--input", required=True); ch.add_argument("--out", default="output")
    for sp in (ap_, ch): sp.add_argument("--price", type=int, default=345, help="Review price shown on the page (295 for anyone quoted it before 27 Oct 2026)")
    ar = sub.add_parser("area"); ar.add_argument("--input", required=True); ar.add_argument("--provider", required=True)
    ar.add_argument("--profile", choices=["ap", "post16"], default="ap"); ar.add_argument("--out", default="output")
    ar.add_argument("--price", type=int, default=345)
    ck = sub.add_parser("check"); ck.add_argument("pdf")
    pp = sub.add_parser("pdf"); pp.add_argument("html")
    args = a.parse_args()
    if args.mode == "apprenticeship": apprenticeship(args.ukprn, args.name, args.csv, args.out, args.price)
    elif args.mode == "charity": charity(args.input, args.out, args.price)
    elif args.mode == "area": area(args.input, args.provider, args.profile, args.out, args.price)
    elif args.mode == "pdf": to_pdf(args.html)
    else:
        probs = check(args.pdf); print("passed" if not probs else "; ".join(probs)); sys.exit(1 if probs else 0)
