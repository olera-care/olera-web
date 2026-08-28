# -*- coding: utf-8 -*-
"""Type scale for the figure set, in real printed points.

An SVG font-size is in user units, and the house grid puts 100 units to the
inch, so a unit is 0.72pt. Sizes here are declared in points and converted, so
what the code says is what the page prints.

Floor is 9.5pt: NIH exempts figure text from the 11pt body minimum as long as it
is legible, but the separate 15-characters-per-linear-inch density rule has no
figure exemption, and Arial breaches it below about 9.5pt.
"""
from measure import width as _w, wrap as _wrap

U = 100 / 72.0                 # points to svg units

FLOOR_PT = 9.5
BODY   = FLOOR_PT * U          # 13.19u, the smallest type allowed
LABEL  = 10.0 * U              # 13.89u, column and node labels
HEAD   = 11.0 * U              # 15.28u, headline inside a figure
BIG    = 15.0 * U
LEAD   = 1.18                  # line spacing, as a multiple of size


def w(text, size, weight='normal', ls=0.0):
    return _w(text, size, weight, ls)


def wrap(text, max_units, size, weight='normal', ls=0.0):
    return _wrap(text, max_units, size, weight, ls)


def fit(text, max_units, size, weight='normal', ls=0.0, min_size=None):
    """Wrap to width; if a single word still will not fit, shrink to the floor."""
    lines = wrap(text, max_units, size, weight, ls)
    if max(w(l, size, weight, ls) for l in lines) <= max_units:
        return lines, size
    lo = min_size or BODY
    s = size
    while s > lo:
        s -= 0.2
        lines = wrap(text, max_units, s, weight, ls)
        if max(w(l, s, weight, ls) for l in lines) <= max_units:
            return lines, s
    return lines, lo


def stack(t, cx, y0, lines, size, fill, weight='normal', style='normal',
          anchor='middle', ls=0.0, lead=None):
    """Draw wrapped lines from a top baseline, returning the next free baseline."""
    lead = lead or size * LEAD
    out = []
    for i, ln in enumerate(lines):
        out.append(t(cx, y0 + i * lead, ln, size, fill, anchor=anchor,
                     weight=weight, style=style, ls=ls))
    return ''.join(out), y0 + len(lines) * lead
