#!/usr/bin/env python3
"""Generate tools/house-reference.docx, the Word style template for docx export.

House style per README section 6: Letter portrait, 0.5in margins, Arial 11pt
justified body, 9pt table text, bold left-aligned section headings. Pandoc copies
these styles into every export, so the Drive copy opens in house format instead of
Word's defaults.

Run once, or after a house-style change:  python3 tools/make_reference_docx.py
"""
import os, subprocess, sys

import pypandoc
from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.shared import Inches, Pt, RGBColor

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'house-reference.docx')

BODY_PT = 11        # README section 6: body 11pt
TABLE_PT = 9        # table body text 9pt
FONT = 'Arial'


def base_template(path):
    """Start from pandoc's own reference.docx so every style it writes exists."""
    pandoc = pypandoc.get_pandoc_path()
    with open(path, 'wb') as fh:
        subprocess.run([pandoc, '--print-default-data-file', 'reference.docx'],
                       stdout=fh, check=True)


def set_font(style, size_pt, bold=None, italic=None, color=None):
    f = style.font
    f.name = FONT
    f.size = Pt(size_pt)
    if bold is not None:
        f.bold = bold
    if italic is not None:
        f.italic = italic
    if color is not None:
        f.color.rgb = RGBColor.from_string(color)


def set_para(style, align=None, before=0, after=2, spacing=1.0):
    pf = style.paragraph_format
    if align is not None:
        pf.alignment = align
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = spacing
    pf.line_spacing_rule = WD_LINE_SPACING.SINGLE


def main():
    base_template(OUT)
    doc = Document(OUT)

    # ---- page: Letter portrait, 0.5in margins on all four sides ----
    for s in doc.sections:
        s.orientation = WD_ORIENT.PORTRAIT
        s.page_width, s.page_height = Inches(8.5), Inches(11)
        for side in ('left', 'right', 'top', 'bottom'):
            setattr(s, f'{side}_margin', Inches(0.5))

    styles = doc.styles

    # ---- body text: Arial 11pt justified, single spaced, 2pt after ----
    set_font(styles['Normal'], BODY_PT)
    set_para(styles['Normal'], WD_ALIGN_PARAGRAPH.JUSTIFY)

    for name in ('Body Text', 'First Paragraph', 'Compact'):
        if name in [s.name for s in styles]:
            set_font(styles[name], BODY_PT)
            set_para(styles[name], WD_ALIGN_PARAGRAPH.JUSTIFY)

    # ---- section headings: bold, left, body size, ~8pt before ----
    # House style puts major sections in ALL CAPS bold at body size, so the
    # heading styles must not inherit Word's blue sans display sizes.
    for i, name in enumerate(('Heading 1', 'Heading 2', 'Heading 3',
                              'Heading 4', 'Heading 5', 'Heading 6')):
        if name in [s.name for s in styles]:
            set_font(styles[name], BODY_PT, bold=True, italic=False, color='000000')
            set_para(styles[name], WD_ALIGN_PARAGRAPH.LEFT, before=8, after=2)

    # ---- captions: body size, left aligned, only the label is bold (in content) ----
    for name in ('Image Caption', 'Table Caption', 'Caption'):
        if name in [s.name for s in styles]:
            set_font(styles[name], BODY_PT, bold=False, italic=False, color='000000')
            set_para(styles[name], WD_ALIGN_PARAGRAPH.LEFT, before=2, after=6)

    # ---- tables: 9pt, tight ----
    for name in ('Table Text', 'Table Grid'):
        if name in [s.name for s in styles]:
            try:
                set_font(styles[name], TABLE_PT)
            except AttributeError:
                pass  # table styles without a font element

    if 'Title' in [s.name for s in styles]:
        set_font(styles['Title'], 14, bold=True, color='000000')
        set_para(styles['Title'], WD_ALIGN_PARAGRAPH.LEFT, before=0, after=6)

    doc.save(OUT)
    print('wrote', OUT)


if __name__ == '__main__':
    sys.exit(main())
