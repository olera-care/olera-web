#!/usr/bin/env python3
"""Export a canonical CRP markdown file to .docx for Google Drive review.

Usage: python3 tools/export_docx.py research-strategy.md [out.docx]

Preserves headings, lists, tables, and inline figures (PNG embeds; SVGs are
rendered to PNG first). Strip the HTML provenance comment before export.
Upload the result to Drive and CONVERT TO A NATIVE GOOGLE DOC so reviewer
comments can be read back through the Drive API.
"""
import sys, re, os, tempfile
import pypandoc

src = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else os.path.splitext(src)[0] + ".docx"
md = open(src, encoding="utf-8").read()
md = re.sub(r"<!--.*?-->", "", md, count=1, flags=re.S)  # drop provenance header

# render any SVG embeds to PNG (docx handles PNG most reliably)
tmp = tempfile.mkdtemp()
def svg2png(m):
    alt, path = m.group(1), m.group(2)
    png = os.path.join(tmp, os.path.basename(path).replace(".svg", ".png"))
    import cairosvg, html
    svg = open(path, encoding="utf-8").read()
    cairosvg.svg2png(bytestring=html.unescape(svg).replace("&", "&amp;").encode(),
                     write_to=png, output_width=2200, background_color="white")
    return f"![{alt}]({png})"
md = re.sub(r"!\[([^\]]*)\]\(([^)]+\.svg)\)", svg2png, md)

pypandoc.convert_text(md, "docx", format="markdown", outputfile=out,
                      extra_args=["--resource-path", os.path.dirname(os.path.abspath(src)) or "."])
print("wrote", out)
