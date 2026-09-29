import re
import sys

# Usage: python3 build_pdf.py [phd]
#   (default) 就业方向版: body_only.html -> proposal_branded.html
#   phd       博士方向版: body_only_phd.html -> proposal_branded_phd.html
VARIANT = sys.argv[1] if len(sys.argv) > 1 else "career"
SUFFIX = "_phd" if VARIANT == "phd" else ""

body = open(f"body_only{SUFFIX}.html", encoding="utf-8").read()
body = body.replace("<hr />\n", "")


# School lists (a 学校 column plus a long 优势/理由 column) read better as
# cards than as 6-column tables; same rule as src/components/SchoolCards.tsx.
def _cells(row_html, tag):
    return [c.strip() for c in re.findall(rf"<{tag}[^>]*>(.*?)</{tag}>", row_html, re.S)]


def _text(h):
    return re.sub(r"<[^>]+>", "", h).strip()


def _tier_class(t):
    for k, c in (("冲刺", "reach"), ("主申", "target"), ("保底", "safety")):
        if k in t:
            return c
    return "other"


def _card_table(m):
    table = m.group(0)
    head = re.search(r"<thead>(.*?)</thead>", table, re.S)
    rows = re.findall(r"<tbody>(.*?)</tbody>", table, re.S)
    if not head or not rows:
        return table
    headers = [_text(h) for h in _cells(head.group(1), "th")]
    name_i = next((i for i, h in enumerate(headers) if "学校" in h), -1)
    long_i = next((i for i, h in enumerate(headers) if "优势" in h or "理由" in h), -1)
    if name_i < 0 or long_i < 0:
        return table
    badge = {i for i, h in enumerate(headers) if h in ("档位", "STEM")}
    cards = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", rows[0], re.S):
        cells = _cells(tr, "td")
        if len(cells) != len(headers):
            continue
        tags = []
        for i in sorted(badge):
            if headers[i] == "STEM":
                t = _text(cells[i])
                cls = "ok" if "已核实" in t else ("na" if "不适用" in t else "check")
                tags.append(f'<span class="tag stem-{cls}">STEM：{cells[i]}</span>')
            else:
                tags.append(f'<span class="tag tier-{_tier_class(_text(cells[i]))}">{cells[i]}</span>')
        facts = "".join(
            f'<div class="fact"><div class="k">{headers[i]}</div><div class="v">{cells[i]}</div></div>'
            for i in range(len(headers))
            if i not in badge and i not in (name_i, long_i)
        )
        cards.append(
            f'<div class="card"><div class="tags">{"".join(tags)}</div>'
            f'<div class="name">{cells[name_i]}</div><div class="facts">{facts}</div>'
            f'<div class="long"><div class="k">{headers[long_i]}</div>{cells[long_i]}</div></div>'
        )
    return f'<div class="cards">{"".join(cards)}</div>'


body = re.sub(r"<table>.*?</table>", _card_table, body, flags=re.S)

CSS = r"""
@font-face { font-family: 'PingFang SC'; }

:root {
  --navy-900: #0B1830;
  --navy-800: #10233F;
  --navy-700: #16305A;
  --gold-500: #C9A227;
  --gold-300: #E4C766;
  --cream-50: #FAF8F3;
  --ink: #1C2333;
  --muted: #5B6478;
}

* { box-sizing: border-box; }

html, body {
  margin: 0; padding: 0;
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  color: var(--ink);
  font-size: 13.5px;
  line-height: 1.75;
  background: white;
}

.cover {
  position: relative;
  width: 100%;
  height: 297mm;
  background: linear-gradient(155deg, var(--navy-900) 0%, var(--navy-800) 55%, var(--navy-700) 100%);
  color: white;
  page-break-after: always;
  overflow: hidden;
}
.cover::before {
  content: "";
  position: absolute; top: -120px; right: -120px;
  width: 420px; height: 420px; border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(201,162,39,0.35), rgba(201,162,39,0) 70%);
}
.cover::after {
  content: "";
  position: absolute; bottom: -160px; left: -100px;
  width: 480px; height: 480px; border-radius: 50%;
  background: radial-gradient(circle at 60% 60%, rgba(201,162,39,0.18), rgba(201,162,39,0) 70%);
}
.cover-inner {
  position: relative; z-index: 2;
  height: 100%;
  display: flex; flex-direction: column; justify-content: space-between;
  padding: 26mm 20mm 18mm 20mm;
}
.cover-brand {
  display: flex; align-items: center; gap: 10px;
  font-size: 15px; letter-spacing: 2px; font-weight: 600; color: var(--gold-300);
}
.cover-brand .mark {
  width: 30px; height: 30px; border-radius: 8px;
  background: linear-gradient(135deg, var(--gold-300), var(--gold-500));
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--navy-900); font-weight: 800; font-size: 15px;
}
.cover-title-block { margin-top: 40mm; }
.cover-eyebrow {
  color: var(--gold-300); font-size: 13px; letter-spacing: 3px; font-weight: 600;
  margin-bottom: 14px; text-transform: uppercase;
}
.cover-title {
  font-size: 36px; font-weight: 800; line-height: 1.35; margin: 0 0 18px 0;
  max-width: 480px;
}
.cover-title .accent { color: var(--gold-300); }
.cover-sub {
  font-size: 15px; color: rgba(255,255,255,0.75); max-width: 460px; line-height: 1.8;
}
.cover-rule {
  width: 64px; height: 4px; background: var(--gold-500); border-radius: 2px; margin: 22px 0;
}
.cover-meta {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px;
  border-top: 1px solid rgba(255,255,255,0.18); padding-top: 16px;
  font-size: 12px; color: rgba(255,255,255,0.65);
}
.cover-meta b { color: white; font-weight: 600; display: block; margin-bottom: 2px; font-size: 11px; letter-spacing: 1px; color: var(--gold-300); }

.content { padding: 4mm 2mm; }

h2 {
  font-size: 20px; font-weight: 800; color: var(--navy-800);
  margin: 0 0 14px 0; padding: 10px 0 10px 16px;
  border-left: 6px solid var(--gold-500);
  background: linear-gradient(90deg, rgba(201,162,39,0.10), rgba(201,162,39,0) 70%);
  page-break-before: always;
  break-before: page;
}
h2:first-of-type { page-break-before: avoid; break-before: avoid; }

h3 {
  font-size: 15px; font-weight: 700; color: var(--navy-700);
  margin: 22px 0 8px 0; padding-left: 10px; border-left: 3px solid var(--gold-300);
}

p { margin: 8px 0; color: var(--ink); }
strong { color: var(--navy-800); }

ul, ol { margin: 8px 0; padding-left: 22px; }
li { margin: 4px 0; }
li::marker { color: var(--gold-500); font-weight: 700; }

blockquote {
  margin: 14px 0; padding: 14px 18px;
  background: var(--cream-50);
  border-left: 4px solid var(--gold-500);
  border-radius: 4px;
  color: var(--navy-800);
}
blockquote p { margin: 0; }

table {
  width: 100%; border-collapse: collapse; margin: 12px 0 18px 0;
  font-size: 12.5px;
}
thead th {
  background: var(--navy-800); color: white; text-align: left;
  padding: 8px 10px; font-weight: 700;
}
tbody td {
  padding: 8px 10px; border-bottom: 1px solid #E4E1D8; vertical-align: top;
}
tbody tr:nth-child(even) { background: #FAF8F3; }

pre {
  background: #F0EEE6; color: var(--navy-800); padding: 12px 14px; border-radius: 6px;
  font-size: 11.5px; overflow-x: auto; line-height: 1.5;
}
code {
  background: #F0EEE6; color: var(--navy-800); padding: 1px 5px; border-radius: 3px;
  font-size: 12px;
}
pre code { background: none; padding: 0; }

.toc-page { page-break-after: always; padding: 14mm 6mm; }
.toc-title { font-size: 22px; font-weight: 800; color: var(--navy-800); margin-bottom: 4px; }
.toc-rule { width: 48px; height: 4px; background: var(--gold-500); margin: 10px 0 22px 0; border-radius: 2px; }
.toc-list { list-style: none; padding: 0; margin: 0; }
.toc-list li {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 10px 0; border-bottom: 1px dashed #DAD5C6; font-size: 14px; color: var(--navy-800); font-weight: 600;
}
.toc-list li span.no { color: var(--gold-500); font-weight: 800; margin-right: 10px; }

.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px 0 18px 0; }
.card {
  border: 1px solid #E8DDB5; border-top: 3px solid var(--gold-500); border-radius: 8px;
  padding: 10px 12px; background: white; font-size: 11.5px; line-height: 1.6;
  break-inside: avoid; page-break-inside: avoid;
}
.card .tags { display: flex; flex-wrap: wrap; gap: 4px; }
.card .tag { border-radius: 999px; padding: 1px 8px; font-size: 10px; font-weight: 600; }
.tag.tier-reach { background: #FDE2E4; color: #9F1239; }
.tag.tier-target { background: #DBEAFE; color: #1E40AF; }
.tag.tier-safety { background: #D1FAE5; color: #065F46; }
.tag.tier-other { background: #EEF0F4; color: #374151; }
.tag.stem-ok { background: #DCFCE7; color: #166534; }
.tag.stem-check { background: #FEF3C7; color: #92400E; }
.tag.stem-na { background: #EEF0F4; color: #4B5563; }
.card .tags:empty { display: none; }
.card .name { font-size: 13.5px; font-weight: 800; color: var(--navy-800); margin: 6px 0 4px 0; line-height: 1.4; }
.card .name strong { color: var(--navy-800); }
.card .facts { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; }
.card .k { font-size: 9.5px; color: var(--muted); }
.card .v { color: var(--ink); }
.card .long { margin-top: 6px; padding-top: 6px; border-top: 1px dashed #E8DDB5; color: var(--ink); }
.card .long .k { color: #9A7B12; font-weight: 600; }

@page { size: A4; margin: 18mm 16mm 16mm 16mm; }
@page :first { margin: 0; }
"""

CAREER_TOC = [
    ("", "结论先行：现阶段建议的专业战略"),
    ("一", "为什么会计仍然是一个好的起点"),
    ("二", "我们建议的方向：Accounting + Analytics"),
    ("三", "五个专业方向的对比"),
    ("四", "纯会计 vs 会计+分析/信息系统：留美概率对比"),
    ("五", "为什么特别推荐 Accounting + Analytics"),
    ("六", "如果目标是美国长期身份，我们建议的优先级排序"),
    ("七", "硕士阶段的建议"),
    ("八", "美国高校选择：三类学校名单"),
    ("九", "硕士 vs 博士：就业与留美的比较"),
    ("十", "大二到大三：能力结构先行"),
    ("十一", "下一步"),
]
PHD_TOC = [
    ("", "结论先行：本案例的博士路线方案"),
    ("一", "会计博士读的是什么"),
    ("二", "为什么会计博士是一条高确定性路线"),
    ("三", "门槛与风险"),
    ("四", "适合度自测清单"),
    ("五", "本科阶段准备清单"),
    ("六", "进入路径与本案例推荐"),
    ("七", "博士选校：本案例的目标院校"),
    ("八", "博士期间的研究方向"),
    ("九", "博士毕业后的就业方向"),
    ("十", "本案例时间表：从现在到拿到绿卡"),
    ("十一", "与就业方向版的关系"),
    ("十二", "下一步"),
]

COVER = {
    "career": {
        "title": "专业方向<span class=\"accent\">规划建议书</span>",
        "sub": "会计专业 · 美国就业与长期身份路径规划<br>本科到硕士（乃至博士）主路线建议",
        "goal": "美国就业 + 长期身份",
    },
    "phd": {
        "title": "博士方向<span class=\"accent\">规划建议书</span>",
        "sub": "会计专业 · 美国会计学博士就学与就业路径规划<br>读博衔接、研究方向、毕业去向与身份路线",
        "goal": "美国高校教职 + 长期身份",
    },
}[VARIANT]
TOC_ITEMS = PHD_TOC if VARIANT == "phd" else CAREER_TOC
toc_html = "\n".join(
    f'<li><span><span class="no">{n}</span>{t}</span></li>' for n, t in TOC_ITEMS
)

html = f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>{"博士方向规划建议书" if VARIANT == "phd" else "专业方向规划建议书"}</title>
<style>{CSS}</style>
</head>
<body>

<div class="cover">
  <div class="cover-inner">
    <div class="cover-brand"><span class="mark">J</span>JYEDU · 杰圆教育</div>
    <div class="cover-title-block">
      <div class="cover-eyebrow">Academic &amp; Career Planning · 家长版</div>
      <div class="cover-title">{COVER["title"]}</div>
      <div class="cover-rule"></div>
      <div class="cover-sub">{COVER["sub"]}</div>
    </div>
    <div class="cover-meta">
      <div><b>学生背景</b>会计专业 · 国内大二</div>
      <div><b>长期目标</b>{COVER["goal"]}</div>
      <div><b>文件性质</b>阶段性方向建议，非最终决定</div>
      <div><b>出品</b>JYEdu 杰圆教育 · JY Tech LLC</div>
    </div>
  </div>
</div>

<div class="toc-page">
  <div class="toc-title">目录</div>
  <div class="toc-rule"></div>
  <ul class="toc-list">
    {toc_html}
  </ul>
</div>

<div class="content">
{body}
</div>

</body>
</html>
"""

open(f"proposal_branded{SUFFIX}.html", "w", encoding="utf-8").write(html)
print("wrote", len(html), "bytes")
