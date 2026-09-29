#!/usr/bin/env python3
"""Keep the Chinese-students-in-the-US market report up to date.

    python3 market_report.py check              # any newer official data online?
    python3 market_report.py update             # download + parse newer editions into data.json
    python3 market_report.py render             # template.md + data.json -> report markdown
    python3 market_report.py publish [--no-push]
    python3 market_report.py auto [--no-push]   # check -> update -> render -> publish

Automatic sources (parsed, validated): Open Doors China fact sheet, Open Doors
Fast Facts, SEVIS by the Numbers, NSF Survey of Earned Doctorates.
Manual sources live under "manual" in data.json. Each manual block records
which automatic edition it matches ("tied_to"); publishing is refused while
a block is older than its source, so a new Open Doors release can't go out
next to last year's hand-entered numbers.

The report edition (title year) is the Open Doors edition, e.g. Open Doors
2025 (2024/25 data) -> "2025 版". Each edition's PDF is also kept as
public/reports/china-us-study-market-<year>.pdf.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent))

import sources as src  # noqa: E402
import publish  # noqa: E402

DATA = HERE / "data.json"
TEMPLATE = HERE / "template.md"
CACHE = HERE / "cache"
REPORT_MD = HERE.parent / publish.REPORTS["market"]["md"]

AUTO = ("od_china", "od_fastfacts", "sevis", "nsf")
CN_NUM = "零一二三四五六七八九十"


# --------------------------------------------------------------------------- #
# data.json
# --------------------------------------------------------------------------- #

def load() -> dict:
    return json.loads(DATA.read_text(encoding="utf-8"))


def save(data: dict) -> None:
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def edition(data: dict, key: str) -> int:
    return data["auto"][key]["edition"]


# --------------------------------------------------------------------------- #
# check / update
# --------------------------------------------------------------------------- #

def discover(data: dict) -> dict:
    return {
        "od_china": src.discover_od_china(edition(data, "od_china")),
        "od_fastfacts": src.discover_od_fastfacts(edition(data, "od_fastfacts")),
        "sevis": src.discover_sevis(),
        "nsf": src.discover_nsf(),
    }


def cmd_check(data: dict) -> dict:
    found = discover(data)
    newer = {}
    print(f"{'source':<14}{'current':>9}{'latest online':>16}")
    for key in AUTO:
        cur = edition(data, key)
        latest = found.get(key)
        mark = ""
        if latest and latest["edition"] > cur:
            newer[key] = latest
            mark = "  <- NEW"
        if not latest:
            mark = "  <- 无法访问，请稍后重试"
        print(f"{key:<14}{cur:>9}{(latest or {}).get('edition', '?'):>16}{mark}")
    for name, block in data["manual"].items():
        print(f"  manual  {name:<22} last checked {block.get('checked', '?')}  {block.get('url', '')}")
    return newer


def fetch_and_parse(key: str, info: dict) -> dict:
    CACHE.mkdir(exist_ok=True)
    if key == "nsf":
        pub = info["pub"]
        files = []
        for table in ("tab007-007", "tab007-008", "tab002-008"):
            path = CACHE / f"{pub}-{table}.pdf"
            src.download(src.nsf_table_url(pub, table), str(path))
            files.append(str(path))
        return src.parse_nsf(*files)
    path = CACHE / f"{key}-{info['edition']}.pdf"
    src.download(info["url"], str(path))
    return {"od_china": src.parse_od_china, "od_fastfacts": src.parse_od_fastfacts,
            "sevis": src.parse_sevis}[key](str(path))


def merge_history(data: dict, key: str, parsed: dict) -> None:
    """Keep earlier years that a new edition no longer prints."""
    old = data["auto"].get(key, {}).get("data", {})
    if key == "od_china":
        hist = dict(old.get("level_history", {}))
        hist[parsed["prev_label"]] = {k: v["prev"] for k, v in parsed["levels"].items()}
        hist[parsed["cur_label"]] = {k: v["cur"] for k, v in parsed["levels"].items()}
        parsed["level_history"] = dict(sorted(hist.items()))
        totals = dict(old.get("totals", []))
        totals.update(dict(parsed["totals"]))
        parsed["totals"] = sorted(totals.items())
    if key == "sevis":
        # the new edition only prints its own year; carry last edition's K-12 row
        hist = dict(old.get("k12_history", {}))
        if old.get("k12_china"):
            hist[str(data["auto"]["sevis"]["edition"])] = {
                "k12_china": old["k12_china"], "k12_china_share": old["k12_china_share"]}
        parsed["k12_history"] = hist


def cmd_update(data: dict, force: bool = False) -> list[str]:
    targets = cmd_check(data)
    if force:
        found = discover(data)
        targets = {k: v for k, v in found.items() if v}
    changed = []
    for key, info in targets.items():
        print(f"\nUpdating {key} -> {info['edition']} ({info.get('url')})")
        parsed = fetch_and_parse(key, info)  # raises ParseError on layout drift
        merge_history(data, key, parsed)
        prev = data["auto"][key]
        data["auto"][key] = {
            "edition": info["edition"],
            "url": info["url"],
            "prev_url": prev["url"] if prev["edition"] < info["edition"] else prev.get("prev_url", ""),
            "fetched": dt.date.today().isoformat(),
            "data": parsed,
            **({"pub": info["pub"]} if "pub" in info else {}),
        }
        changed.append(key)
    if changed:
        save(data)
    return changed


# --------------------------------------------------------------------------- #
# render
# --------------------------------------------------------------------------- #

def n(x) -> str:
    return f"{x:,}"


def p(x, d: int = 1) -> str:
    return f"{x:.{d}f}%"


def sp(x, d: int = 1) -> str:
    """Signed percent with a real minus sign, as used in the report tables."""
    return ("+" if x >= 0 else "−") + f"{abs(x):.{d}f}%"


def chg(a, b) -> float:
    return (b - a) / a * 100


def wan(x, d: int = 1) -> str:
    return f"{x / 10_000:.{d}f}"


def cn(k: int) -> str:
    return CN_NUM[k] if 0 <= k <= 10 else str(k)


def context(data: dict) -> dict:
    od = data["auto"]["od_china"]["data"]
    ff = data["auto"]["od_fastfacts"]["data"]
    sv = data["auto"]["sevis"]["data"]
    ns = data["auto"]["nsf"]["data"]
    m = data["manual"]

    totals = od["totals"]
    peak_label, peak = max(totals, key=lambda t: t[1])
    cur_label, total = totals[-1]
    streak = 0
    for (_, a), (_, b) in zip(reversed(totals[:-1]), reversed(totals[1:])):
        if b < a:
            streak += 1
        else:
            break

    def series_rows():
        rows, prev = [], None
        for label, v in totals[-8:]:
            c = "—" if prev is None else sp(chg(prev, v))
            cell = f"**{n(v)}**（峰值）" if label == peak_label else (f"**{n(v)}**" if label == cur_label else n(v))
            lab = f"**{label}**" if label == peak_label else label
            rows.append(f"| {lab} | {cell} | {c} |")
            prev = v
        return "\n".join(rows)

    lv = {k: dict(v, chg=chg(v["prev"], v["cur"])) for k, v in od["levels"].items()}
    hist = od["level_history"]
    h3 = sorted(hist)[-3:]

    def level3_rows():
        names = [("ug", "本科"), ("grad", "研究生（硕士 + 博士 + 专业学位）"), ("opt", "OPT"), ("nondeg", "非学位")]
        out = []
        for k, name in names:
            vals = [hist[l][k] for l in h3]
            last = f"**{n(vals[-1])}**" if k != "nondeg" else n(vals[-1])
            c = sp(chg(vals[0], vals[-1]))
            c = f"**{c}**" if k == "ug" else c
            out.append(f"| {name} | " + " | ".join(n(v) for v in vals[:-1]) + f" | {last} | {c} |")
        return "\n".join(out)

    ug2 = chg(hist[h3[0]]["ug"], hist[h3[-1]]["ug"])
    grad2 = chg(hist[h3[0]]["grad"], hist[h3[-1]]["grad"])

    # SEVIS K-12
    k12_years = sorted(sv.get("k12_history", {}))
    k12_prev = sv["k12_history"][k12_years[-1]] if k12_years else None
    k12_chg = chg(k12_prev["k12_china"], sv["k12_china"]) if k12_prev else 0.0
    k12_trend = "基本稳定" if abs(k12_chg) < 3 else ("有所增长" if k12_chg > 0 else "有所下降")

    stem_china = sv["stem_opt_total"] * sv["stem_opt_china_share"] / 100

    majors = [(name.rstrip("*"), v) for name, v in sv["top_majors"]]
    zh = m["major_names_zh"]["value"]

    def major_rows():
        out = [f"| {i} | {zh.get(name, name)} | {n(v)} |" for i, (name, v) in enumerate(majors[:10], 1)]
        for i, (name, v) in enumerate(majors, 1):
            if i > 10 and name == "Business Analytics":
                out.append(f"| {i} | {zh.get(name, name)} | {n(v)} |")
        return "\n".join(out)

    # NSF
    years, china = ns["years"], ns["china"]
    ly, latest = years[-1], china[-1]
    yoy = chg(china[-2], latest)
    growth = chg(china[0], latest)
    floor5 = min(china[-5:])
    floor_round = floor5 // 100 * 100
    if yoy <= -2:
        phd_trend = "总体稳定、最新一年有所回落"
    elif yoy >= 2:
        phd_trend = "稳中有升"
    else:
        phd_trend = "基本稳定"

    def nsf_rows():
        picks = [i for i in range(len(years)) if (years[-1] - years[i]) % 2 == 0] + [len(years) - 2]
        picks = sorted(set(picks))
        out = []
        for i in picks:
            y, a, b, c = years[i], china[i], ns["china_se"][i], ns["china_non_se"][i]
            if i == len(years) - 1:
                out.append(f"| **{y}** | **{n(a)}** | **{n(b)}** | **{n(c)}** |")
            else:
                out.append(f"| {y} | {n(a)} | {n(b)} | {n(c)} |")
        return "\n".join(out)

    def stay_rows():
        out = []
        for y, nn, pc, pa in zip(ns["stay_years"], ns["stay_china_n"], ns["stay_china"], ns["stay_all"]):
            if y == ns["stay_years"][-1]:
                out.append(f"| **{y}** | **{n(nn)}** | **{p(pc)}** | {p(pa)} |")
            else:
                out.append(f"| {y} | {n(nn)} | {p(pc)} | {p(pa)} |")
        out.append(f"| {ns['stay_pool_label']} 合计 | {n(ns['stay_china_pool_n'])} | **{p(ns['stay_china_pool'])}** | {p(ns['stay_all_pool'])} |")
        return "\n".join(out)

    phd_lo, phd_hi = latest * 5, latest * 6
    grad = lv["grad"]["cur"]
    ms_lo, ms_hi = grad - phd_hi, grad - phd_lo

    ctx = dict(
        n=n, p=p, sp=sp, chg=chg, wan=wan, cn=cn, m=m,
        ED=data["auto"]["od_china"]["edition"],
        today=dt.date.today(),
        od=od, ff=ff, sv=sv, ns=ns, lv=lv,
        cur_label=cur_label, total=total, peak_label=peak_label, peak=peak,
        peak_drop=chg(peak, total), streak=streak,
        series_rows=series_rows, level3_rows=level3_rows, h3=h3,
        ug2=ug2, grad2=grad2, ug_grad_ratio=ug2 / grad2 if grad2 else 0,
        econ_yi=od["econ_impact"] / 1e8,
        k12_year=data["auto"]["sevis"]["edition"], k12_prev=k12_prev,
        k12_prev_year=k12_years[-1] if k12_years else "", k12_chg=k12_chg, k12_trend=k12_trend,
        stem_china=stem_china, major_rows=major_rows,
        ly=ly, latest=latest, yoy=yoy, growth=growth, first_year=years[0],
        floor_round=floor_round, phd_trend=phd_trend, nsf_rows=nsf_rows, stay_rows=stay_rows,
        se_share=ns["china_se"][-1] / latest * 100, non_se=ns["china_non_se"][-1],
        tv_share=latest / ns["all_temp_visa_latest"] * 100,
        india_ratio=latest / ns["india_latest"],
        stay_latest=ns["stay_china"][-1], stay_year=ns["stay_years"][-1],
        phd_lo=phd_lo, phd_hi=phd_hi, ms_lo=ms_lo, ms_hi=ms_hi,
        india_first=ff["india"] > ff["china"],
        abs=abs, len=len,
        k12_others=[m["country_names_zh"]["value"].get(c, c) for c in sv["k12_others"]],
        od_url=data["auto"]["od_china"]["url"], od_prev_url=data["auto"]["od_china"].get("prev_url", ""),
        sv_url=data["auto"]["sevis"]["url"], sv_prev_url=data["auto"]["sevis"].get("prev_url", ""),
        ns_pub=data["auto"]["nsf"]["pub"],
    )
    return ctx


TOKEN = re.compile(r"\{\{(.+?)\}\}", re.S)


def render(data: dict) -> str:
    ctx = context(data)
    tpl = TEMPLATE.read_text(encoding="utf-8")

    def sub(mt):
        return str(eval(mt.group(1).strip(), {"__builtins__": {}, **ctx}))

    out = TOKEN.sub(sub, tpl)
    if "{{" in out or "}}" in out:
        raise SystemExit("unrendered token left in template")
    return out


def stale_manual(data: dict) -> list[str]:
    out = []
    for name, block in data["manual"].items():
        tied = block.get("tied_to")
        if tied and block.get("edition", 0) < edition(data, tied):
            out.append(f"{name}（对应 {tied} {edition(data, tied)} 版，当前为 {block.get('edition')} 版）: {block.get('url', '')}")
    return out


def cmd_render(data: dict) -> None:
    REPORT_MD.write_text(render(data), encoding="utf-8")
    print(f"rendered {REPORT_MD.name} (edition {edition(data, 'od_china')})")


def cmd_publish(data: dict, push: bool, message: str | None = None) -> None:
    stale = stale_manual(data)
    if stale:
        print("以下人工数据尚未更新到对应版本，已停止发布：")
        for s in stale:
            print("  - " + s)
        raise SystemExit(2)
    cmd_render(data)
    ed = edition(data, "od_china")
    archive = publish.REPO / "public" / "reports" / f"china-us-study-market-{ed}.pdf"
    publish.sync("market")
    archive.write_bytes(publish.paths("market")["pdf"].read_bytes())
    ctx = context(data)
    publish.release(
        ["market"],
        message or f"docs(reports): refresh market report ({ed} edition)",
        push=push,
        must_contain={"market": [f"（{ed}）", n(ctx["total"]), n(ctx["latest"])]},
        extra=[DATA, TEMPLATE, archive],
    )


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("action", choices=["check", "update", "render", "publish", "auto"])
    ap.add_argument("--force", action="store_true", help="update: re-fetch even if not newer")
    ap.add_argument("--no-push", action="store_true")
    ap.add_argument("-m", "--message")
    a = ap.parse_args()
    data = load()
    if a.action == "check":
        sys.exit(10 if cmd_check(data) else 0)
    if a.action == "update":
        cmd_update(data, force=a.force)
    elif a.action == "render":
        cmd_render(data)
    elif a.action == "publish":
        cmd_publish(data, push=not a.no_push, message=a.message)
    elif a.action == "auto":
        changed = cmd_update(data)
        if not changed:
            print("No new official data; nothing to publish.")
            return
        cmd_publish(load(), push=not a.no_push,
                    message=a.message or f"docs(reports): market report data update ({', '.join(changed)})")


if __name__ == "__main__":
    main()
