#!/usr/bin/env python3
"""Measure how many printed pages a canonical markdown produces (page-limit check).

Usage: python3 tools/print_check.py research-strategy.md

Renders md -> HTML (pandoc, standalone, Arial 11 / 0.5in margins to approximate the
grant house format) -> PDF via headless Chromium -> per-page fill via pymupdf.
An approximation for drafting; final pagination happens in Word at submission.
"""
import sys, os, re, subprocess, tempfile
import pypandoc, pymupdf

src = sys.argv[1]
md = re.sub(r"<!--.*?-->", "", open(src, encoding="utf-8").read(), count=1, flags=re.S)
css = ("body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.15;"
       "margin:0.5in;text-align:justify} img{max-width:100%} table{border-collapse:collapse;"
       "font-size:9pt} td,th{border:1px solid #999;padding:2px 5px}")
tmp = tempfile.mkdtemp()
html_path, pdf_path = os.path.join(tmp, "pc.html"), os.path.join(tmp, "pc.pdf")
body = pypandoc.convert_text(md, "html", format="markdown",
                             extra_args=["--resource-path", os.path.dirname(os.path.abspath(src)) or "."])
open(html_path, "w", encoding="utf-8").write(f"<meta charset='utf-8'><style>{css}</style>{body}")
subprocess.run(["/opt/pw-browsers/chromium", "--headless", "--disable-gpu", "--no-sandbox",
                f"--print-to-pdf={pdf_path}", "--no-pdf-header-footer", html_path],
               check=True, capture_output=True)
d = pymupdf.open(pdf_path)
fills = []
for pg in d:
    ys = [b[3] for b in pg.get_text("blocks")] + [im["bbox"][3] for im in pg.get_image_info()]
    fills.append(min(max(ys, default=0) / pg.rect.height, 1.0))
print(f"{src}: {len(d)} pages, effective {sum(fills):.2f}")
