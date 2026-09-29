#!/usr/bin/env python3
"""Build and publish the student-plan reports to the JYEdu site.

    python3 publish.py build market            # PDF only
    python3 publish.py sync market             # PDF + copy into the site
    python3 publish.py release market -m "..." # sync + commit + push + verify live
    python3 publish.py release market --no-push

Pipeline per report: markdown -> pandoc -> build_pdf.py (branded HTML) ->
headless Chrome (PDF) -> content/reports/<slug>.zh.md + public/reports/<slug>.pdf.
Needs pandoc, Google Chrome and (for release) git + gh.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
GH_REPO = "jytechllc/career-education"
LIVE_BASE = "https://jyedu.vercel.app"
CHROME = os.environ.get(
    "CHROME", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
)
ATTRIBUTION = "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"

REPORTS = {
    "career": {
        "md": "会计专业方向规划建议书-家长版.md",
        "slug": "accounting-us-plan",
        "lead": ["学生背景", "长期目标", "本建议书目的"],
    },
    "phd": {
        "md": "会计专业博士方向规划建议书-家长版.md",
        "slug": "accounting-phd-plan",
        "lead": ["学生背景", "长期目标", "本建议书目的"],
    },
    "arts": {
        "md": "舞蹈表演研究生全额奖学金指南.md",
        "slug": "performing-arts-funding",
        "lead": ["适用对象", "核心问题", "本指南目的"],
    },
    "market": {
        "md": "中国学生赴美留学市场研究报告.md",
        "slug": "china-us-study-market",
        "lead": ["研究对象", "数据时点", "本报告目的"],
    },
}


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, check=True, **kw)


def suffix(variant: str) -> str:
    return "" if variant == "career" else f"_{variant}"


def paths(variant: str) -> dict:
    r = REPORTS[variant]
    md = HERE / r["md"]
    return {
        "md": md,
        "pdf": md.with_suffix(".pdf"),
        "body": HERE / f"body_only{suffix(variant)}.html",
        "html": HERE / f"proposal_branded{suffix(variant)}.html",
        "content": REPO / "content" / "reports" / f"{r['slug']}.zh.md",
        "public_pdf": REPO / "public" / "reports" / f"{r['slug']}.pdf",
        "meta": REPO / "content" / "reports" / f"{r['slug']}.meta.json",
    }


def build(variant: str) -> Path:
    p = paths(variant)
    run(["pandoc", str(p["md"]), "-f", "markdown", "-t", "html", "-o", str(p["body"])])
    run([sys.executable, "build_pdf.py", variant], cwd=HERE, stdout=subprocess.DEVNULL)
    run(
        [CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
         f"--print-to-pdf={p['pdf']}", p["html"].as_uri()],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    if not p["pdf"].exists() or p["pdf"].stat().st_size < 50_000:
        raise SystemExit(f"PDF build failed: {p['pdf']}")
    return p["pdf"]


def web_markdown(variant: str) -> str:
    """Site copy: drop the H1 (the page renders its own title) and the brand
    footer, and turn the bold lead lines into a list so they don't run together."""
    text = paths(variant)["md"].read_text(encoding="utf-8")
    text = text.split("\n", 1)[1].lstrip("\n")
    text = text.replace("\n---\n\n*JYEdu 杰圆教育 · JY Tech LLC*\n", "\n")
    for key in REPORTS[variant]["lead"]:
        text = text.replace(f"**{key}**", f"- **{key}**", 1)
    return text


def title(variant: str) -> str:
    first = paths(variant)["md"].read_text(encoding="utf-8").split("\n", 1)[0]
    return first.lstrip("# ").strip()


def sync(variant: str) -> list[Path]:
    """Build the PDF and copy the report into the site. The page title comes
    from the markdown H1 via <slug>.meta.json, so a new edition renames itself."""
    p = paths(variant)
    build(variant)
    p["content"].write_text(web_markdown(variant), encoding="utf-8")
    p["public_pdf"].write_bytes(p["pdf"].read_bytes())
    p["meta"].write_text(json.dumps({"title": title(variant)}, ensure_ascii=False, indent=2) + "\n",
                         encoding="utf-8")
    return [p["md"], p["pdf"], p["body"], p["html"], p["content"], p["public_pdf"], p["meta"]]


def gh_json(path: str):
    out = run(["gh", "api", path], capture_output=True, text=True).stdout
    return json.loads(out)


def wait_for_deploy(sha: str, timeout: int = 900) -> str:
    deadline = time.time() + timeout
    dep_id = None
    while time.time() < deadline and dep_id is None:
        for d in gh_json(f"repos/{GH_REPO}/deployments"):
            if d["sha"].startswith(sha):
                dep_id = d["id"]
                break
        else:
            time.sleep(10)
    if dep_id is None:
        return "not-found"
    while time.time() < deadline:
        statuses = gh_json(f"repos/{GH_REPO}/deployments/{dep_id}/statuses")
        if statuses and statuses[0]["state"] in ("success", "failure", "error"):
            return statuses[0]["state"]
        time.sleep(10)
    return "timeout"


def verify_live(variant: str, must_contain: list[str]) -> list[str]:
    url = f"{LIVE_BASE}/zh/{REPORTS[variant]['slug']}"
    html = urllib.request.urlopen(url, timeout=30).read().decode("utf-8", "ignore")
    return [s for s in must_contain if s not in html]


def release(variants: list[str], message: str, push: bool = True,
            must_contain: dict[str, list[str]] | None = None, extra: list[Path] = ()) -> None:
    files: list[Path] = list(extra)
    for v in variants:
        files += sync(v)
    rel = [str(f.relative_to(REPO)) for f in files]
    run(["git", "add", "--", *rel], cwd=REPO)
    staged = run(["git", "diff", "--cached", "--name-only"], cwd=REPO,
                 capture_output=True, text=True).stdout.split()
    if not staged:
        print("Nothing changed; no commit.")
        return
    run(["git", "commit", "-q", "-m", f"{message}\n\n{ATTRIBUTION}"], cwd=REPO)
    sha = run(["git", "rev-parse", "--short=7", "HEAD"], cwd=REPO,
              capture_output=True, text=True).stdout.strip()
    print(f"Committed {sha}: {len(staged)} file(s)")
    if not push:
        print("--no-push: stopping before push.")
        return
    run(["git", "push", "-q", "origin", "HEAD"], cwd=REPO)
    state = wait_for_deploy(sha)
    print(f"Deploy: {state}")
    if state != "success":
        raise SystemExit("Deploy did not succeed; check Vercel.")
    for v in variants:
        missing = verify_live(v, (must_contain or {}).get(v, []))
        url = f"{LIVE_BASE}/zh/{REPORTS[v]['slug']}"
        print(f"Live: {url}" + (f"  MISSING: {missing}" if missing else "  OK"))
        if missing:
            raise SystemExit("Live page is missing expected content.")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("action", choices=["build", "sync", "release"])
    ap.add_argument("variants", nargs="+", choices=sorted(REPORTS))
    ap.add_argument("-m", "--message", default="docs(reports): update reports")
    ap.add_argument("--no-push", action="store_true")
    a = ap.parse_args()
    if a.action == "build":
        for v in a.variants:
            print(build(v))
    elif a.action == "sync":
        for v in a.variants:
            sync(v)
            print(f"synced {v}")
    else:
        release(a.variants, a.message, push=not a.no_push)


if __name__ == "__main__":
    main()
