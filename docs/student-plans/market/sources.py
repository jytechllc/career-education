"""Discover and parse the official data sources behind the market report.

Each source has two halves:
  discover_*() -> newest edition {"edition", "url"} found online
  parse_*(pdf_path) -> dict of numbers, raising ParseError when the layout
                       no longer matches (so a format change never slips a
                       wrong number into a published report).

Only stdlib + the `pdftotext` CLI (poppler) are required.
"""

from __future__ import annotations

import re
import subprocess
import urllib.error
import urllib.request

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36"
)


class ParseError(RuntimeError):
    pass


# --------------------------------------------------------------------------- #
# HTTP / PDF helpers
# --------------------------------------------------------------------------- #

def fetch(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def exists(url: str, attempts: int = 3) -> bool:
    """True if url serves a PDF. Retries transient failures (timeouts, 429/5xx)
    so one flaky probe can't hide a new edition; a clean 404 returns at once."""
    import time
    for i in range(attempts):
        r = _probe(url)
        if r is not None:
            return r
        time.sleep(2 * (i + 1))
    return False


def _probe(url: str) -> bool | None:
    """HEAD-ish probe; some hosts reject HEAD, so fall back to a 1-byte GET.
    Returns None when the answer is unknown (network error, throttling)."""
    for method in ("HEAD", "GET"):
        req = urllib.request.Request(url, method=method, headers={"User-Agent": UA})
        if method == "GET":
            req.add_header("Range", "bytes=0-0")
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                ctype = r.headers.get("Content-Type", "")
                return r.status in (200, 206) and "pdf" in ctype.lower()
        except urllib.error.HTTPError as e:
            if e.code in (403, 405) and method == "HEAD":
                continue
            if e.code == 429 or e.code >= 500:
                return None
            return False
        except Exception:
            return None
    return False


def download(url: str, path: str) -> str:
    data = fetch(url, timeout=60)
    if not data.startswith(b"%PDF"):
        raise ParseError(f"not a PDF: {url}")
    with open(path, "wb") as f:
        f.write(data)
    return path


def pdftext(path: str, mode: str = "-layout") -> str:
    out = subprocess.run(
        ["pdftotext", mode, path, "-"], capture_output=True, text=True, check=True
    )
    return out.stdout


def num(s: str) -> int:
    return int(s.replace(",", ""))


def need(m, what: str):
    if not m:
        raise ParseError(f"could not find {what}")
    return m


# --------------------------------------------------------------------------- #
# Open Doors — China fact sheet
# --------------------------------------------------------------------------- #

OD_CHINA_PATTERNS = (
    "https://opendoorsdata.org/wp-content/uploads/{uy}/{mm:02d}/OD_China_Fact-Sheet-{y}.pdf",
    "https://opendoorsdata.org/wp-content/uploads/{uy}/{mm:02d}/OpenDoors_FactSheet_China_{y}.pdf",
)


def discover_od_china(start_year: int) -> dict | None:
    """Fact sheets are uploaded Nov–Jan under /uploads/<year>/<month>/."""
    best = None
    for y in range(start_year, start_year + 3):
        found = None
        for uy, months in ((y, range(10, 13)), (y + 1, range(1, 4))):
            for mm in months:
                for pat in OD_CHINA_PATTERNS:
                    url = pat.format(uy=uy, mm=mm, y=y)
                    if exists(url):
                        found = url
                        break
                if found:
                    break
            if found:
                break
        if found:
            best = {"edition": y, "url": found}
    return best


def parse_od_china(path: str) -> dict:
    # The fact sheet's text layer is letter-spaced ("U n d e r g r a d ..."), so
    # drop every space and rely on comma grouping to split adjacent numbers.
    lines = [re.sub(r"\s+", "", l) for l in pdftext(path, "-raw").splitlines()]
    text = "\n".join(lines)
    N = r"(\d{1,3}(?:,\d{3})+)"

    totals = {}
    for m in re.finditer(rf"^(\d{{4}}/\d{{2}}){N}", text, re.M):
        totals.setdefault(m.group(1), num(m.group(2)))
    totals = sorted(totals.items())
    if len(totals) < 5:
        raise ParseError("Open Doors totals series too short")

    head = need(re.search(r"AcademicLevel(\d{4}/\d{2})(\d{4}/\d{2})Total", text), "academic level header")
    prev_label, cur_label = head.group(1), head.group(2)

    levels = {}
    for key, word in (("ug", "Undergraduate"), ("grad", "Graduate"),
                      ("nondeg", "Non-Degree"), ("opt", "OPT")):
        m = need(re.search(rf"^{word}{N}{N}(\d+\.\d)%", text, re.M), f"level {word}")
        levels[key] = {"prev": num(m.group(1)), "cur": num(m.group(2)), "share": float(m.group(3))}

    inst = {}
    for key, word in (("associate", "Associate'sColleges"), ("baccalaureate", "BaccalaureateColleges"),
                      ("doctoral", "DoctoralUniversities"), ("masters", "Master'sCollegesandUniversities"),
                      ("special", "SpecialFocusInstitutions")):
        m = need(re.search(rf"{word}(\d+\.\d)%", text), f"institution type {key}")
        inst[key] = float(m.group(1))

    pp = need(re.search(r"PrivateInstitutionsPublicInstitutions\n(\d+\.\d)%(\d+\.\d)%", text), "private/public split")
    econ = need(re.search(r"\$(\d{1,3}(?:,\d{3}){3})", text), "economic impact")
    econ_year = re.search(r"EconomicImpact,\n?(\d{4})", text)

    total = dict(totals)[cur_label]
    level_sum = sum(v["cur"] for v in levels.values())
    if abs(level_sum - total) > total * 0.01:
        raise ParseError(f"levels sum {level_sum} != total {total}")

    return {
        "cur_label": cur_label,
        "prev_label": prev_label,
        "totals": totals,
        "levels": levels,
        "institution_types": inst,
        "private": float(pp.group(1)),
        "public": float(pp.group(2)),
        "econ_impact": num(econ.group(1)),
        "econ_year": int(econ_year.group(1)) if econ_year else None,
    }


# --------------------------------------------------------------------------- #
# Open Doors — Fast Facts (world total, India, graduate total)
# --------------------------------------------------------------------------- #

def discover_od_fastfacts(start_year: int) -> dict | None:
    best = None
    for y in range(start_year, start_year + 3):
        yy = y % 100
        for mm in (11, 12, 10):
            url = f"https://opendoorsdata.org/wp-content/uploads/{y}/{mm:02d}/OD{yy:02d}_Fast-Facts.pdf"
            if exists(url):
                best = {"edition": y, "url": url}
                break
    return best


def parse_od_fastfacts(path: str) -> dict:
    lay = pdftext(path)
    world = need(re.search(r"WORLD TOTAL\s+([\d,]+)\s+([\d,]+)", lay), "world total")
    india = need(re.search(r"^\s*.*?India\s+([\d,]+)\s+([\d,]+)\s+([\d.]+)\s+(-?[\d.]+)", lay, re.M), "India")
    china = need(re.search(r"China\s+([\d,]+)\s+([\d,]+)\s+([\d.]+)\s+(-?[\d.]+)", lay), "China")
    grad = need(re.search(r"^(\d{4}/\d{2})\s+([\d,]+)\s+(-?[\d.]+)\s+([\d,]+)\s+(-?[\d.]+)\s+\S", lay, re.M),
                "undergraduate/graduate table")
    # take the last row of the undergrad/graduate table
    rows = re.findall(r"^(\d{4}/\d{2})\s+([\d,]+)\s+(-?[\d.]+)\s+([\d,]+)\s+(-?[\d.]+)(?:\s{2,}|$)", lay, re.M)
    rows = [r for r in rows if num(r[1]) > 200_000 and num(r[3]) > 200_000]
    if not rows:
        raise ParseError("graduate totals row")
    last = rows[-1]
    return {
        "world_total": num(world.group(2)),
        "india": num(india.group(2)),
        "china": num(china.group(2)),
        "china_share": float(china.group(3)),
        "grad_total_label": last[0],
        "grad_total": num(last[3]),
        "grad_total_chg": float(last[4]),
    }


# --------------------------------------------------------------------------- #
# SEVIS by the Numbers
# --------------------------------------------------------------------------- #

SEVIS_INDEX = "https://www.ice.gov/sevis/whats-new"


def discover_sevis() -> dict | None:
    html = fetch(SEVIS_INDEX).decode("utf-8", "ignore")
    best = None
    for path in set(re.findall(r'doclib/sevis/btn/[^"\']+?btn\.pdf', html)):
        m = re.search(r"(?:cy(\d{2})|(\d{4})-sevis-btn)", path)
        if not m:
            continue
        year = int(m.group(2)) if m.group(2) else 2000 + int(m.group(1))
        if not best or year > best["edition"]:
            best = {"edition": year, "url": "https://www.ice.gov/" + path}
    return best


def parse_sevis(path: str) -> dict:
    t = pdftext(path)
    flat = re.sub(r"\s+", " ", t)
    k12_total = need(re.search(r"There were ([\d,]+) (?:foreign|international) student (?:SEVIS )?records for K-12", flat),
                     "K-12 total")
    k12_china = need(re.search(r"([\d.]+)% \(([\d,]+)\):? China", flat), "K-12 China")
    after = need(re.search(r"K-12 students? in \d{4}, followed by (.*?)\.|came from China in \d{4}, followed by (.*?)\.", flat), "K-12 followed-by list")
    k12_top = [c.strip() for c in re.split(r",\s*(?:and\s+)?|\s+and\s+", after.group(1) or after.group(2)) if c.strip()]
    stem = need(re.search(r"from India \(([\d.]+)%\) or\s+China \(([\d.]+)%\)(?:, with ([\d,]+) (?:foreign|international) students participating in STEM OPT)?", flat),
                "STEM OPT shares")
    china_total = need(re.search(r"China \(([\d,]+)\) in calendar year", flat)
                       or re.search(r"China\s+([\d,]{6,})", flat), "China records")
    masters = re.search(r"master.s \(([\d,]+)\) degree", flat)
    doctoral = re.search(r"There were ([\d,]+) F-1 students who sought a doctoral degree", flat)

    majors = []
    block = re.search(r"Primary Major\s+\d{4} Active Student Count(.*?)\n\*", t, re.S)
    if block:
        for line in block.group(1).splitlines():
            m = re.match(r"\s*(\S.*?\S)\*?\s{2,}([\d,]+)\s*$", line)
            if m:
                majors.append((m.group(1), num(m.group(2))))
    if len(majors) < 10:
        raise ParseError("top majors table")

    return {
        "k12_total": num(k12_total.group(1)),
        "k12_china": num(k12_china.group(2)),
        "k12_china_share": float(k12_china.group(1)),
        "k12_others": k12_top,
        "stem_opt_india_share": float(stem.group(1)),
        "stem_opt_china_share": float(stem.group(2)),
        "stem_opt_total": num(stem.group(3)) if stem.group(3) else None,
        "china_records": num(china_total.group(1)),
        "masters_total": num(masters.group(1)) if masters else None,
        "doctoral_total": num(doctoral.group(1)) if doctoral else None,
        "top_majors": majors,
    }


# --------------------------------------------------------------------------- #
# NSF Survey of Earned Doctorates
# --------------------------------------------------------------------------- #

NSF_INDEX = "https://ncses.nsf.gov/surveys/earned-doctorates"


def discover_nsf() -> dict | None:
    html = fetch(NSF_INDEX).decode("utf-8", "ignore")
    pubs = sorted(set(re.findall(r"/pubs/(nsf\d{5})", html)))
    best = None
    for pub in pubs:
        url = f"https://ncses.nsf.gov/pubs/{pub}/assets/data-tables/tables/{pub}-tab007-007.pdf"
        if not exists(url):
            continue
        title = fetch(f"https://ncses.nsf.gov/pubs/{pub}").decode("utf-8", "ignore")
        m = re.search(r"Earned Doctorates \(SED\) (\d{4})", title) or re.search(r"Doctorates?[^<]{0,80}?(\d{4})", title)
        year = int(m.group(1)) if m else 0
        if not best or year > best["edition"]:
            best = {"edition": year, "pub": pub,
                    "url": f"https://ncses.nsf.gov/pubs/{pub}/assets/data-tables/tables/{pub}-tab007-007.pdf"}
    return best


def nsf_table_url(pub: str, table: str) -> str:
    return f"https://ncses.nsf.gov/pubs/{pub}/assets/data-tables/tables/{pub}-{table}.pdf"


def parse_nsf(tab77: str, tab78: str, tab28: str) -> dict:
    t77 = pdftext(tab77)
    years = [int(y) for y in re.findall(r"\b(20\d{2})\b",
             need(re.search(r"Country or economy and field\s+([\d\s]+)\n", t77), "7-7 header").group(1))]

    def row(label: str, after: str = "China") -> list[int]:
        seg = t77[t77.index(after):]
        m = need(re.search(rf"^\s*{label}\S*\s+((?:[\d,]+\s+){{{len(years) - 1}}}[\d,]+)\s*$", seg, re.M), f"7-7 {label}")
        vals = [num(v) for v in m.group(1).split()]
        return vals

    china = row("China")
    china_se = row("Science and engineering")
    china_non = row("Non-science and engineering")
    if any(a != b + c for a, b, c in zip(china, china_se, china_non)):
        raise ParseError("7-7 China total != S&E + non-S&E")

    t78 = pdftext(tab78)
    all_tv = num(need(re.search(r"All temporary visa holders.*?([\d,]{5,})\s*$", t78, re.M), "7-8 total").group(1))
    india = num(need(re.search(r"^\s*India\s+\d+\s+([\d,]+)", t78, re.M), "7-8 India").group(1))
    china_rank = int(need(re.search(r"^\s*China\S*\s+(\d+)\s+[\d,]+", t78, re.M), "7-8 China rank").group(1))

    t28 = pdftext(tab28)
    hdr = need(re.search(r"(\d{4})–(\d{2})\s+((?:\d{4}\s+)+)", t28), "2-8 header")
    stay_years = [int(y) for y in hdr.group(3).split()]

    def stay_row(label: str) -> tuple:
        m = need(re.search(rf"^\s*{label}\S*\s+([\d,]+)\s+([\d.]+)((?:\s+[\d,]+\s+[\d.]+)+)", t28, re.M), f"2-8 {label}")
        pairs = re.findall(r"([\d,]+)\s+([\d.]+)", m.group(3))
        return num(m.group(1)), float(m.group(2)), [(num(a), float(b)) for a, b in pairs]

    c_pool_n, c_pool_pct, c_rows = stay_row("China")
    a_pool_n, a_pool_pct, a_rows = stay_row("All temporary visa holders")
    if len(c_rows) != len(stay_years):
        raise ParseError("2-8 column count")

    return {
        "years": years,
        "china": china,
        "china_se": china_se,
        "china_non_se": china_non,
        "all_temp_visa_latest": all_tv,
        "india_latest": india,
        "china_rank": china_rank,
        "stay_years": stay_years,
        "stay_pool_label": f"{hdr.group(1)}–20{hdr.group(2)}",
        "stay_china": [p for _, p in c_rows],
        "stay_china_n": [n for n, _ in c_rows],
        "stay_all": [p for _, p in a_rows],
        "stay_china_pool": c_pool_pct,
        "stay_china_pool_n": c_pool_n,
        "stay_all_pool": a_pool_pct,
    }
