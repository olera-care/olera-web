#!/usr/bin/env python3
"""Export research-strategy.md to a house-style .docx for Google Drive review.

Shares the formatter with tools/render_pdf.py, so the run-in headings, captions,
bullets, tables, and citation numbering are identical to the PDF. Page styling
(Letter, 0.5in margins, Arial 11pt justified, 9pt tables) comes from
tools/house-reference.docx; regenerate that with tools/make_reference_docx.py.

Usage: python3 tools/export_docx.py [out.docx]

Upload the result to Drive and let Drive CONVERT IT TO A NATIVE GOOGLE DOC so
reviewer comments can be read back through the Drive API.

Two differences from the PDF are unavoidable and expected:
  * Word reflows, so page breaks will not match the PDF. The PDF remains the
    artifact that proves the 12-page limit.
  * Figures marked "wrap" float beside the text in the PDF; Word places them
    full width in the flow.
"""
import os, re, shutil, sys, tempfile

import pypandoc

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render_pdf as R

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(R.CRP, 'research-strategy.docx')
REFERENCE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'house-reference.docx')

FULL_WIDTH_IN = 7.5   # Letter minus 0.5in margins
WRAP_WIDTH_IN = 3.2   # same nominal width as the PDF's floated figures
RASTER_PX = 2200      # SVG raster width; keeps line art sharp in print


def make_img_fn(tmpdir):
    """Figure path -> <img> tag pointing at a real file, sized like the PDF.

    Word cannot render inline SVG, so SVGs are rasterized. Wrapped figures keep
    their 3.2in nominal width even though Word will not float them.
    """
    import cairosvg
    import html as _html

    def img_fn(relpath):
        src = os.path.join(R.FIGDIR, relpath)
        name = os.path.basename(relpath)
        if relpath.endswith('.svg'):
            dst = os.path.join(tmpdir, name[:-4] + '.png')
            svg = open(src, encoding='utf-8').read()
            cairosvg.svg2png(bytestring=_html.unescape(svg).replace('&', '&amp;').encode(),
                             write_to=dst, output_width=RASTER_PX, background_color='white')
        else:
            dst = os.path.join(tmpdir, name)
            shutil.copyfile(src, dst)
        img_fn.last = dst
        return f'<img src="{dst}">'

    return img_fn


def size_images(blocks):
    """Give each <img> an explicit width so Word does not scale by pixel count."""
    out = []
    for b in blocks:
        w = WRAP_WIDTH_IN if 'fig wrapme' in b else FULL_WIDTH_IN
        # pandoc's HTML reader honours the width attribute, not CSS width
        out.append(re.sub(r'<img src="([^"]+)">',
                          lambda m: f'<img src="{m.group(1)}" width="{w}in" />', b))
    return out


def to_docx_html(blocks):
    """House-style HTML retargeted at pandoc's docx writer.

    Section headings become <h1> so they land on the Heading 1 style; everything
    else already carries its formatting as <b>/<i>/<u>/<sup> runs, which pandoc
    maps directly to Word character formatting.
    """
    out = []
    for b in blocks:
        b = re.sub(r'<p class="sec[^"]*">(.*?)</p>', r'<h1>\1</h1>', b, flags=re.S)
        b = b.replace('<sup class="todo">', '<sup>')
        b = re.sub(r'<table class="matrix">', '<table>', b)
        b = re.sub(r'<(td|th) class="[^"]*">', r'<\1>', b)
        b = re.sub(r'<span class="(?:yes|no)">(.*?)</span>', r'\1', b, flags=re.S)
        b = re.sub(r'<span class="eg">(.*?)</span>', r' (\1)', b, flags=re.S)
        b = re.sub(r'<div class="[^"]*">', '<div>', b)
        out.append(b)
    return '\n'.join(out)


def main():
    if not os.path.exists(REFERENCE):
        sys.exit(f'ERROR: {REFERENCE} missing. Run tools/make_reference_docx.py first.')

    src = open(R.MD, encoding='utf-8').read()
    tmp = tempfile.mkdtemp()
    blocks = R.build_body(src, img_fn=make_img_fn(tmp))
    blocks, cite_order, refs = R.resolve_citations(
        blocks, src, todo_markup='<sup>[cite]</sup>')

    if cite_order:
        items = ''.join(f'<p>{R.html.escape(l)}</p>'
                        for l in R.reference_lines(cite_order, refs))
        blocks.append(f'<h1>REFERENCES</h1><p><i>{R.html.escape(R.REFNOTE)}</i></p>{items}')

    body = to_docx_html(size_images(blocks))
    doc = ('<!doctype html><html><head><meta charset="utf-8"></head>'
           f'<body>{body}</body></html>')

    html_path = os.path.join(tmp, 'rs.html')
    open(html_path, 'w', encoding='utf-8').write(doc)

    if os.path.exists(OUT):
        os.remove(OUT)   # fail loudly rather than leave a stale file behind
    pypandoc.convert_file(html_path, 'docx', format='html', outputfile=OUT,
                          extra_args=[f'--reference-doc={REFERENCE}',
                                      '--resource-path', tmp])
    if not os.path.exists(OUT):
        sys.exit('ERROR: pandoc produced no output')
    polish(OUT)
    print('wrote', OUT, f'({os.path.getsize(OUT) // 1024} KB)')


def polish(path):
    """Apply the two house rules pandoc cannot carry from HTML classes.

    Captions are left aligned rather than justified, and the reference list runs
    at 9pt, matching the PDF.
    """
    from docx import Document
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.shared import Pt

    doc = Document(path)
    in_refs = False
    for p in doc.paragraphs:
        text = p.text.strip()
        if p.style.name.startswith('Heading') and text == 'REFERENCES':
            in_refs = True
            continue
        if in_refs:
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_after = Pt(3)
            for r in p.runs:
                r.font.size = Pt(9)
        elif re.match(r'(Figure|Table) [A-Z0-9]+[:.]', text):
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
    doc.save(path)


if __name__ == '__main__':
    main()
