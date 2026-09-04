# MedJobs 2.0 Implementation Map, house style

**Status: not started.** This directory holds inputs only. No deliverable has
been built yet.

## What is here

- `orig.pdf` is the source as supplied, `MedJobs2.0MasterMatrix15.pdf`
  (Logan, 2026-09-04). 57 pages.
- `img/` holds the 30 screenshot exhibits, extracted losslessly from that PDF at
  their native size. All are 640px wide, which is about 90 dpi at full page
  width, so they will print exactly as softly as they do in the source. Logan's
  call, 2026-09-04, was to use them as they are rather than re-capture.

## What is waiting

The file the PDF was generated from. Rebuilding house style out of a PDF means
re-deriving the structure from font, size and position data, which is slow and
lossy: table detection returns 114 fragments for what are really about 40
tables, and 215 table cells fall outside the detected table boundaries. With the
source, this becomes an ordinary formatting pass like the other documents in this
repository.

The exhibits are kept regardless. If the source carries its own images these can
be discarded; if it references them by path, they are already in place.

## The work, once the source arrives

1. **324 em dashes.** The bulk of it, and the main reason the document is not in
   house style today. Each one is a judgment: a colon, a comma pair, or a full
   stop. A dash inside quoted script text or a screenshot label stays, because
   that is what the interface says.
2. **Type and colour.** Serif body to 11pt Arial, the blue headings to house
   teal, the circled-numeral layer heads to the house section rule.
3. **Exhibits** at their current size, with the caption set below the image as a
   house caption rather than as a bold sentence above it.
4. **The flow diagram on page 2** stays as monospace, exactly as drawn.
   Redrawing it in the house vector figure system would be a better artifact and
   is a separate job; it should not be done silently.
5. **Prose tightening** only where the writing is not already house style. The
   run-in lead-ins in the SOP lists are already right and stay as they are.

Verification will be the same lossless check used on the walkthrough summary:
every word of the source compared against the rendered output.
