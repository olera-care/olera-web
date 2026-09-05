# Innovation (Phase IIB draft), house style

Source: `Olera_CRP_Innovation_PhaseIIB_HouseStyle_Illustrated_Final.docx`
(`orig.docx` here). Text and figures are the author's. Three pages, PDF and Word
both, 1,217 words of body text plus four figures.

```
python3 build_inn2.py                  # inn2.html, then print to PDF
WORD_EXPORT=1 python3 build_inn2.py    # inn2_word.html
python3 mkdocx_inn2.py                 # Olera_CRP_Innovation_PhaseIIB.docx
```

`text.json` is extracted straight from `orig.docx` and is what the build reads,
so no sentence is retyped. Every sentence was verified verbatim against the
rendered PDF after the build.

## What changed: formatting only

- House type: 11pt Arial body, justified, 9pt captions, the teal rule under the
  section head, bold run-in lead-ins for the four "Key Innovation" openers.
- The three figures that sat in invisible two-column layout tables are now real
  right floats, so text wraps around them instead of being trapped in a column.
  Figure 6 runs the full text width.
- Figure sizes set from each image's own pixel dimensions so the labels inside
  them are legible in print. The source placed Figure 4 at 2.20in wide, which put
  its internal text near 2pt; it now runs the full 7.3in column.
- One caption per figure, the document's own, in house caption style.

## What was removed from the figure files

Each of the first three images was a screen capture that included its own baked-in
caption from an earlier layout, numbered Figure 1, Figure 2 and Figure 3, which
would have collided with this document's Figure 3, 4 and 5 captions. Those
caption strips are cropped off. `media/` holds the untouched originals.

- `fig3.png`: bottom caption strip cropped, and a stray "ple." fragment in the
  top-left corner (the tail of "example." from the page the screenshot was taken
  from) painted out.
- `fig4.png`: bottom caption strip cropped.
- `fig5.png`: bottom caption strip cropped.
- `fig6.png`: untouched, it carried no baked-in caption.

## Two things worth knowing

1. **Figure 3 is cropped on its left edge in the source image.** The first
   pathway step is cut off mid-word, leaving a stray "d" where "Need Identified"
   should be. That cannot be recovered from the file supplied; it needs a
   re-export from whatever produced it.
2. **The images are low-resolution screen captures**, 108 to 326 dpi at the sizes
   used here. Figure 6 is the softest at about 99 dpi across the full column.
   They read acceptably in print but will not look crisp, and they cannot be
   enlarged further without visible softness. Re-exporting them at 300 dpi from
   source would fix both this and item 1.

## Known layout note

The PDF and the Word file both come out at three pages with the same content on
each. Word leaves about 1.3in of trailing white on page 2, because Writer anchors
the Figure 5 frame to its paragraph and moves both to page 3 rather than
splitting them. The browser-rendered PDF is the authoritative layout.
