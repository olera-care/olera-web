#!/usr/bin/env python3
"""
Build the MedJobs migration mapping workbook.

Reads the admin team's spreadsheet and produces one reviewable row per
record, in three bands:

  A  what the sheet said        verbatim, never edited
  B  what this script resolved  read-only, shows its working
  C  your corrections           the only editable columns; anything here wins

The directory match (phone -> olera-providers -> city -> campus) needs
database access, which this script does not have. Those columns are left
as `pending-directory` and filled by a second pass; everything computable
from the sheet alone is resolved here.

  python3 scripts/migration/build-mapping-workbook.py <source.xlsx> <out.xlsx>
"""

import re, sys, zipfile, collections, datetime
from xml.etree import ElementTree as ET

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
T = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

# ── the six, and nothing else ────────────────────────────────────────
CAMPUSES = {
    "u-utah": "University of Utah",
    "arizona-state": "Arizona State University",
    "uw-madison": "University of Wisconsin-Madison",
    "florida-state": "Florida State University",
    "indiana-bloomington": "Indiana University Bloomington",
    "u-florida": "University of Florida",
}
SECTIONS = ["Providers", "Advisors", "Student orgs", "Professors"]

# Area codes. "weak" ones cover a metro that only partly overlaps the
# catchment, so they are resolved but flagged for a look.
AREA_STRONG = {
    "801": "u-utah", "385": "u-utah", "435": "u-utah",
    "480": "arizona-state", "602": "arizona-state", "623": "arizona-state",
    "608": "uw-madison",
    "850": "florida-state",
    "812": "indiana-bloomington", "930": "indiana-bloomington",
    "352": "u-florida",
}
AREA_WEAK = {
    "262": "uw-madison", "414": "uw-madison",
    "317": "indiana-bloomington", "765": "indiana-bloomington",
    "386": "u-florida",
    "928": "arizona-state",
}
# Email domains. usu.edu and utahtech.edu are Utah State and Utah Tech —
# different universities that merely contain the word Utah, and mapping
# them to u-utah would be a silent, plausible-looking error.
EDU = {
    "utah.edu": "u-utah", "hsc.utah.edu": "u-utah", "nurs.utah.edu": "u-utah",
    "disability.utah.edu": "u-utah", "med.utah.edu": "u-utah",
    "asu.edu": "arizona-state",
    "wisc.edu": "uw-madison",
    "fsu.edu": "florida-state", "med.fsu.edu": "florida-state",
    "iu.edu": "indiana-bloomington", "indiana.edu": "indiana-bloomington",
    "ufl.edu": "u-florida", "honors.ufl.edu": "u-florida", "advising.ufl.edu": "u-florida",
}
OUT_OF_SCOPE_DOMAIN = {
    "usu.edu": "Utah State University",
    "utahtech.edu": "Utah Tech University",
    "virginia.edu": "University of Virginia",
}
NAME_HINT = [
    ("florida state", "florida-state"), ("fsu", "florida-state"),
    ("arizona state", "arizona-state"), ("asu", "arizona-state"),
    ("wisconsin-madison", "uw-madison"), ("wisconsin", "uw-madison"), ("madison", "uw-madison"),
    ("indiana", "indiana-bloomington"), ("bloomington", "indiana-bloomington"),
    ("university of florida", "u-florida"),
    ("utah", "u-utah"),
]
OUT_OF_SCOPE_NAME = [("uva", "University of Virginia"), ("virginia", "University of Virginia")]

NEGATIVE = ("uninterested", "not interested", "declin", "do not contact", "closed provider")
UNREACHED = ("unable to", "no answer", "cannot", "can't", "invalid", "does not exist", "wrong number")


# ── reading the source ───────────────────────────────────────────────
def read_sheets(path):
    z = zipfile.ZipFile(path)
    strings = []
    sst = ET.fromstring(z.read("xl/sharedStrings.xml"))
    for si in sst.findall("m:si", NS):
        strings.append("".join(t.text or "" for t in si.iter(f"{T}t")))

    def rows(member):
        root = ET.fromstring(z.read(member))
        out = []
        for r in root.iter(f"{T}row"):
            row = {}
            for c in r:
                ref = c.get("r", "")
                m = re.match(r"[A-Z]+", ref)
                col = m.group(0) if m else ""
                v = c.find("m:v", NS)
                if v is None:
                    isel = c.find("m:is", NS)
                    val = "".join(x.text or "" for x in isel.iter(f"{T}t")) if isel is not None else ""
                else:
                    val = strings[int(v.text)] if c.get("t") == "s" and v.text and v.text.isdigit() else (v.text or "")
                if val.strip():
                    row[col] = val.strip()
            if row:
                row["_row"] = int(r.get("r", 0))
                out.append(row)
        return out

    return rows("xl/worksheets/sheet1.xml"), rows("xl/worksheets/sheet2.xml")


# ── tolerant parsing ─────────────────────────────────────────────────
def parse_date(raw):
    """The sheet holds fifteen date shapes. Returns (iso, ok)."""
    if not raw:
        return "", True
    s = raw.strip()
    if re.fullmatch(r"\d{5}(\.\d+)?", s):                       # Excel serial
        base = datetime.date(1899, 12, 30)
        return (base + datetime.timedelta(days=int(float(s)))).isoformat(), True
    s = re.sub(r"(?i)\s*(am|pm|m|f)+\s*$", "", s)               # trailing m / AM / mf
    m = re.match(r"(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})", s)
    if not m:                                                    # "06/292026" — lost a slash
        m2 = re.match(r"(\d{1,2})[/.-](\d{2})(\d{4})$", s)
        if m2:
            m = m2
    if not m:
        return "", False
    mo, d, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if y < 100:
        y += 2000
    try:
        return datetime.date(y, mo, d).isoformat(), True
    except ValueError:
        return "", False


def digits(phone):
    return [re.sub(r"\D", "", p) for p in re.split(r"[/;,]| or ", phone or "") if re.sub(r"\D", "", p)]


def area_codes(phone):
    out = []
    for d in digits(phone):
        if len(d) == 11 and d.startswith("1"):
            d = d[1:]
        if len(d) >= 10:
            out.append(d[:3])
    return out


def classify_email(cell):
    """The email column doubles as a status column. Returns (kind, value)."""
    if not cell:
        return "empty", ""
    s = cell.strip()
    if "@" in s:
        m = re.search(r"[\w.+-]+@[\w.-]+\.\w+", s)
        return ("address", m.group(0)) if m else ("note", s)
    low = s.lower()
    if any(k in low for k in NEGATIVE):
        return "negative", s
    if any(k in low for k in UNREACHED):
        return "unreached", s
    return "note", s


def campus_from(name, email_value, phone):
    """Returns (campus_slug, source, out_of_scope_reason)."""
    dom = email_value.split("@")[-1].lower() if "@" in email_value else ""
    if dom in OUT_OF_SCOPE_DOMAIN:
        return "", "out-of-scope", OUT_OF_SCOPE_DOMAIN[dom]
    if dom in EDU:
        return EDU[dom], "edu_domain", ""
    low = (name or "").lower()
    for key, why in OUT_OF_SCOPE_NAME:
        if re.search(rf"\b{re.escape(key)}\b", low):
            return "", "out-of-scope", why
    for key, slug in NAME_HINT:
        if key in low:
            return slug, "source_name", ""
    for a in area_codes(phone):
        if a in AREA_STRONG:
            return AREA_STRONG[a], "area_code", ""
    for a in area_codes(phone):
        if a in AREA_WEAK:
            return AREA_WEAK[a], "area_code (weak)", ""
    return "", "unresolved", ""


def section_for(name):
    low = (name or "").lower()
    if any(k in low for k in ("dept head", "department of", "professor", "school of medicine")):
        return "Professors"
    if any(k in low for k in ("sig", "society", "association", "council", "apamsa", "program (mapp)", "mapp")):
        return "Student orgs"
    if any(k in low for k in ("advis", "career", "success", "pre-health", "prehealth", "honors", "navigate hub")):
        return "Advisors"
    if len(low.split()) <= 3 and not any(ch.isdigit() for ch in low):
        return "Advisors"          # a bare person name; flagged in review_flag
    return "Advisors"


# ── the agreed ladder rule ───────────────────────────────────────────
def ladder_for(section, email_kind, email_sent, n_calls, has_person):
    """The mapping signed off in planning. Returns (step, round, ready, state)."""
    if email_kind == "negative":
        return "", "", "", "stopped — not interested"

    if section == "Providers":
        if email_kind == "address" and email_sent:
            rnd = min(max(n_calls, 1), 7)
            return 2, rnd, f"Follow up {rnd}", "live"
        if email_kind == "address":
            return 1, "", "Send the program info", "live"
        return 0, "", "Call to get the right email", "live"

    if section == "Student orgs":
        if email_kind == "address" and email_sent:
            rnd = min(max(n_calls, 1), 7)
            return 3, rnd, f"Follow up {rnd}", "live"
        if has_person or email_kind == "address":
            return 2, "", "Send the program info", "live"
        return 1, "", "Identify a contact at the org", "live"

    if section == "Professors":
        return 0, "", "Get permission to email professors", "live"

    # Advisors
    if email_kind == "address" and email_sent:
        rnd = min(max(n_calls, 1), 7)
        return 2, rnd, f"Follow up {rnd}", "live"
    return 1, "", "Send the program info", "live"


MONTH = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def pretty(iso):
    if not iso:
        return "?"
    y, m, d = iso.split("-")
    return f"{MONTH[int(m)]} {int(d)}"


def build_rows(prov, part):
    out = []
    for r in prov:
        if not r.get("A"):
            continue
        calls = [(r.get(c), r.get(c2)) for c, c2 in (("F", "G"), ("H", "I"), ("J", "K"), ("L", "M"))]
        out.append(make("MedJobs Providers", r["_row"], r["A"], r.get("C", ""), r.get("D", ""),
                        r.get("E", ""), calls, "Providers"))
    for r in part:
        if not r.get("B"):
            continue
        calls = [(r.get(c), r.get(c2)) for c, c2 in (("G", "H"), ("I", "J"), ("K", "L"))] + [(None, None)]
        out.append(make("MedJobs Partners", r["_row"], r["B"], r.get("D", ""), r.get("E", ""),
                        r.get("F", ""), calls, None))
    return out


def make(tab, row_no, raw_name, phone, email_cell, email_sent_cell, calls, forced_section):
    name = re.sub(r"\s+", " ", raw_name).strip()
    # A structured partner name encodes org · university · channel · person.
    parts = [p.strip() for p in name.split("·")] if "·" in name else []
    person = ""
    if parts:
        m = re.search(r"\(([^)]+)\)\s*$", parts[-1])
        if m:
            person = m.group(1).strip()
        name_display = parts[0]
    else:
        name_display = name
        m = re.search(r"\(([^)]+)\)\s*$", name)
        if m:
            person = m.group(1).strip()
            name_display = name[: m.start()].strip()

    kind, email_value = classify_email(email_cell)
    section = forced_section or (
        "Professors" if any("dept head" in p.lower() for p in parts) else section_for(name)
    )
    campus, source, oos = campus_from(name, email_value if kind == "address" else "", phone)
    if not campus and parts:
        for key, slug in NAME_HINT:
            if any(key in p.lower() for p in parts):
                campus, source = slug, "source_name"
                break

    sent_iso, sent_ok = parse_date(email_sent_cell)
    hist, bad_dates, n_calls = [], 0, 0
    for i, (d, remark) in enumerate(calls, start=1):
        if not d and not remark:
            continue
        n_calls += 1
        iso, ok = parse_date(d or "")
        if not ok:
            bad_dates += 1
        hist.append(f"{pretty(iso)} Call {i}" + (f" — {remark}" if remark else ""))

    step, rnd, ready, state = ladder_for(section, kind, bool(sent_iso), n_calls, bool(person))
    if oos:
        state = "out of scope"

    flags = []
    if source == "unresolved":
        flags.append("no campus")
    if source == "area_code (weak)":
        flags.append("weak area code")
    if bad_dates:
        flags.append(f"{bad_dates} unreadable date(s)")
    if kind == "note":
        flags.append("email cell is a note")
    if not phone and tab == "MedJobs Providers":
        flags.append("no phone")
    if oos:
        flags.append(f"out of scope — {oos}")

    return {
        "source_tab": tab, "source_row": row_no, "source_name": raw_name,
        "source_phone": phone, "source_email_cell": email_cell,
        "source_email_sent": email_sent_cell,
        "call_1": calls[0][0] or "", "remark_1": calls[0][1] or "",
        "call_2": calls[1][0] or "", "remark_2": calls[1][1] or "",
        "call_3": calls[2][0] or "", "remark_3": calls[2][1] or "",
        "call_4": calls[3][0] or "", "remark_4": calls[3][1] or "",
        "matched_name": "pending-directory", "matched_city": "", "matched_state": "",
        "match_method": "pending-directory",
        "record_name": name_display, "contact_person": person,
        "contact_email": email_value if kind == "address" else "",
        "campus": campus, "campus_source": source,
        "section": section,
        "ready_task": ready, "ladder_step": step, "ladder_round": rnd,
        "record_state": state,
        "history_count": len(hist),
        "history_preview": " · ".join(hist),
        "duplicate_match": "",
        "review_flag": "; ".join(flags),
        "fix_campus": "", "fix_section": "", "fix_name": "", "fix_state": "",
        "fix_skip": "out of scope" if oos else "", "fix_note": "",
    }


PROVIDER_WORDS = ("care", "caregiv", "home", "senior", "assist", "angels", "hospice",
                  "staffing", "nursing services", "health services", "companion", "helpers",
                  "living", "aide", "agency", "llc", "inc")
CAMPUS_WORDS = ("advis", "career", "college of", "school of", "department", "dept",
                "student success", "pre-health", "prehealth", "honors", "program",
                "university", "faculty", "admissions", "society", "association",
                "council", "sig", "center for")


def looks_like_a_person(name):
    """Two or three capitalised words, no business vocabulary."""
    words = name.split()
    if not 2 <= len(words) <= 3:
        return False
    low = name.lower()
    if any(w in low for w in PROVIDER_WORDS + CAMPUS_WORDS):
        return False
    return all(w[:1].isupper() for w in words if w)


def reclassify(rows):
    """
    The tab a row sits on is not what it is.

    The Providers tab turned out to hold university advisors and whole
    departments — Indiana's switchboard appears against nine of them — and
    several offices appear on both tabs. Importing on the tab's word alone
    would put an advising office on the provider ladder, asking an intern to
    ring it for "the best email address", and would create the same office
    twice.

    So the section is decided by what the row says, and an institutional
    switchboard is treated as evidence: a number shared by three or more
    rows is a university main line, not a provider's.
    """
    switchboards = collections.Counter()
    for r in rows:
        ds = digits(r["source_phone"])
        if ds:
            switchboards[ds[0]] += 1

    for r in rows:
        low = r["record_name"].lower()
        ds = digits(r["source_phone"])
        shared = ds and switchboards[ds[0]] >= 3
        provider_ish = any(w in low for w in PROVIDER_WORDS)
        campus_ish = any(w in low for w in CAMPUS_WORDS)
        person = looks_like_a_person(r["record_name"])
        was = r["section"]

        if provider_ish and not campus_ish:
            r["section"] = "Providers"
        elif campus_ish or (shared and not provider_ish) or (person and shared):
            r["section"] = section_for(r["record_name"])
            if r["section"] == "Providers":
                r["section"] = "Advisors"
        elif person:
            r["section"] = "Advisors" if r["source_tab"].endswith("Partners") else was

        if r["section"] != was:
            r["review_flag"] = "; ".join(
                x for x in [r["review_flag"], f"moved from {was} — reads as {r['section'].lower()}"] if x
            )
            # The ladder position depends on the section, so redo it.
            kind, value = classify_email(r["source_email_cell"])
            step, rnd, ready, state = ladder_for(
                r["section"], kind, bool(parse_date(r["source_email_sent"])[0]),
                r["history_count"], bool(r["contact_person"]))
            if r["record_state"] not in ("out of scope",):
                r["ladder_step"], r["ladder_round"] = step, rnd
                r["ready_task"], r["record_state"] = ready, state

        # A shared number is a switchboard when the row is not a provider, and
        # a franchise call centre when it is. Say which rather than assert.
        if shared:
            label = ("institutional switchboard" if not provider_ish
                     else f"shared number — {switchboards[ds[0]]} rows")
            r["review_flag"] = "; ".join(x for x in [r["review_flag"], label] if x)
            r["shared_phone"] = switchboards[ds[0]]


def mark_cross_tab(rows):
    """The same office recorded on both tabs is one record, not two."""
    seen = collections.defaultdict(list)
    for r in rows:
        key = re.sub(r"[^a-z0-9]", "", r["record_name"].lower())
        if key:
            seen[key].append(r)
    for key, group in seen.items():
        tabs = {r["source_tab"] for r in group}
        if len(tabs) > 1:
            for r in group:
                r["duplicate_match"] = f"ON BOTH TABS — {len(group)} rows, merge into one"
                r["review_flag"] = "; ".join(
                    x for x in [r["review_flag"], "same record on both tabs"] if x)


def mark_duplicates(rows):
    by_phone, by_name = collections.defaultdict(list), collections.defaultdict(list)
    for r in rows:
        ds = digits(r["source_phone"])
        if ds:
            by_phone[ds[0]].append(r)
        else:
            by_name[re.sub(r"[^a-z0-9]", "", r["record_name"].lower())].append(r)
    for key, group in by_phone.items():
        if len(group) > 1:
            for r in group:
                r["duplicate_match"] = f"same phone as {len(group)-1} other row(s)"
    for key, group in by_name.items():
        if len(group) > 1 and key:
            for r in group:
                r["duplicate_match"] = f"same name, no phone — {len(group)} rows"


# ── the workbook ─────────────────────────────────────────────────────
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter

BAND_A = PatternFill("solid", fgColor="EFEFEF")   # what the sheet said
BAND_B = PatternFill("solid", fgColor="E3EEF0")   # what the script resolved
BAND_C = PatternFill("solid", fgColor="FFF3CD")   # your corrections
NEEDS  = PatternFill("solid", fgColor="FDE7E9")   # a row needing a decision
HEAD   = Font(name="Arial", size=9, bold=True, color="1F3536")
BODY   = Font(name="Arial", size=10)
THIN   = Side(style="thin", color="D5DDDD")

COLUMNS = [
    ("source_tab", 18, "A"), ("source_row", 8, "A"), ("source_name", 34, "A"),
    ("source_phone", 20, "A"), ("source_email_cell", 26, "A"), ("source_email_sent", 14, "A"),
    ("call_1", 12, "A"), ("remark_1", 34, "A"), ("call_2", 12, "A"), ("remark_2", 34, "A"),
    ("call_3", 12, "A"), ("remark_3", 34, "A"), ("call_4", 12, "A"), ("remark_4", 34, "A"),

    ("matched_name", 30, "B"), ("matched_city", 16, "B"), ("matched_state", 8, "B"),
    ("match_method", 16, "B"),
    ("record_name", 30, "B"), ("contact_person", 22, "B"), ("contact_email", 26, "B"),
    ("campus", 20, "B"), ("campus_source", 16, "B"), ("section", 14, "B"),
    ("ready_task", 32, "B"), ("ladder_step", 10, "B"), ("ladder_round", 11, "B"),
    ("record_state", 22, "B"), ("history_count", 12, "B"), ("history_preview", 70, "B"),
    ("duplicate_match", 24, "B"), ("review_flag", 32, "B"),

    ("fix_campus", 20, "C"), ("fix_section", 14, "C"), ("fix_name", 26, "C"),
    ("fix_state", 18, "C"), ("fix_skip", 14, "C"), ("fix_note", 30, "C"),
]
FILL = {"A": BAND_A, "B": BAND_B, "C": BAND_C}


def write(rows, out_path):
    wb = Workbook()

    # ── Read me ──────────────────────────────────────────────────────
    ws = wb.active
    ws.title = "Read me"
    lines = [
        ("MedJobs migration — mapping review", True),
        ("", False),
        ("One row per record. Three bands, left to right:", False),
        ("", False),
        ("  GREY    what the admin team's sheet said. Verbatim. Never edited.", False),
        ("  BLUE    what the script resolved. Read-only — this is it showing its working.", False),
        ("  YELLOW  your corrections. The only columns to type in.", False),
        ("", False),
        ("Anything you put in a fix_ column wins over the blue band. Blank means", False),
        ("you accept what the script resolved.", False),
        ("", False),
        ("The columns to scan:", False),
        ("  ready_task        the literal task the operator will see on the board", False),
        ("  campus_source     how the campus was decided; 'unresolved' needs you", False),
        ("  review_flag       everything the script was unsure about", False),
        ("  history_preview   every call and remark, in order — check nothing was lost", False),
        ("", False),
        ("matched_name and match_method read 'pending-directory'. The phone →", False),
        ("olera-providers → city → campus lookup needs database access; it runs as a", False),
        ("second pass and fills those columns in. Everything else is resolved here.", False),
        ("", False),
        ("Rows needing a decision are sorted to the top and tinted pink.", False),
        ("", False),
        ("How a row became a ladder position:", True),
        ("  real email + a send date    →  follow-ups, round = number of calls", False),
        ("  real email, no send date    →  Send the program info", False),
        ("  email cell says 'uninterested' →  stopped, with that reason", False),
        ("  no usable email             →  Call to get the right email", False),
    ]
    for i, (text, bold) in enumerate(lines, start=1):
        c = ws.cell(row=i, column=1, value=text)
        c.font = Font(name="Arial", size=11, bold=bold)
    ws.column_dimensions["A"].width = 95

    # ── Mapping ──────────────────────────────────────────────────────
    ws = wb.create_sheet("Mapping")
    for i, (name, width, band) in enumerate(COLUMNS, start=1):
        c = ws.cell(row=1, column=i, value=name)
        c.font, c.fill = HEAD, FILL[band]
        c.alignment = Alignment(vertical="center", wrap_text=True)
        ws.column_dimensions[get_column_letter(i)].width = width
    ws.freeze_panes = "D2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(COLUMNS))}1"

    # Needing a decision first, then by campus, section, name.
    def needs(r):
        """Pink means a person has to decide something. A shared franchise
        number is worth knowing and not worth tinting 170 rows for."""
        flag = r["review_flag"]
        return (
            r["campus_source"] in ("unresolved", "out-of-scope", "area_code (weak)")
            or "BOTH TABS" in r["duplicate_match"]
            or "moved from" in flag
            or "unreadable" in flag
            or "institutional switchboard" in flag
            or "email cell is a note" in flag
        )
    rows = sorted(rows, key=lambda r: (not needs(r), r["campus"] or "zzz", r["section"], r["record_name"].lower()))

    for ri, r in enumerate(rows, start=2):
        pink = needs(r)
        for ci, (name, _w, band) in enumerate(COLUMNS, start=1):
            c = ws.cell(row=ri, column=ci, value=r.get(name, ""))
            c.font = BODY
            c.alignment = Alignment(vertical="top", wrap_text=name in ("history_preview", "review_flag") or name.startswith("remark"))
            c.border = Border(bottom=THIN)
            if band == "C":
                c.fill = BAND_C
            elif pink and band == "B":
                c.fill = NEEDS
        ws.row_dimensions[ri].height = 30

    last = len(rows) + 1
    col = {name: get_column_letter(i) for i, (name, _, _) in enumerate(COLUMNS, start=1)}

    dv_campus = DataValidation(type="list", formula1='"' + ",".join(CAMPUSES) + '"', allow_blank=True)
    dv_section = DataValidation(type="list", formula1='"' + ",".join(SECTIONS) + '"', allow_blank=True)
    dv_skip = DataValidation(type="list", formula1='"out of scope,duplicate,bad data,skip"', allow_blank=True)
    for dv, cl in ((dv_campus, col["fix_campus"]), (dv_section, col["fix_section"]), (dv_skip, col["fix_skip"])):
        ws.add_data_validation(dv)
        dv.add(f"{cl}2:{cl}{last}")

    # ── Summary: live formulas, so it tracks your edits ──────────────
    ws2 = wb.create_sheet("Summary")
    ws2.column_dimensions["A"].width = 34
    ws2.column_dimensions["B"].width = 12
    ws2.column_dimensions["C"].width = 46
    rownum = 1

    def head(text):
        nonlocal rownum
        c = ws2.cell(row=rownum, column=1, value=text)
        c.font = Font(name="Arial", size=11, bold=True)
        rownum += 1

    def line(label, formula, note=""):
        nonlocal rownum
        ws2.cell(row=rownum, column=1, value=label).font = BODY
        ws2.cell(row=rownum, column=2, value=formula).font = BODY
        ws2.cell(row=rownum, column=3, value=note).font = Font(name="Arial", size=9, color="6A7F83")
        rownum += 1

    cc, cs, cr, cst, cf = col["campus"], col["campus_source"], col["ready_task"], col["record_state"], col["fix_campus"]
    head("Rows")
    line("Total", f"=COUNTA(Mapping!{col['source_name']}2:{col['source_name']}{last})")
    line("Still unresolved", f'=COUNTIF(Mapping!{cs}2:{cs}{last},"unresolved")', "these need a fix_campus")
    line("Corrected by you", f'=COUNTA(Mapping!{cf}2:{cf}{last})')
    rownum += 1

    head("By campus (script's answer)")
    for slug, label in CAMPUSES.items():
        line(label, f'=COUNTIF(Mapping!{cc}2:{cc}{last},"{slug}")')
    line("Unplaced", f'=COUNTIF(Mapping!{cc}2:{cc}{last},"")')
    rownum += 1

    head("How the campus was decided")
    for src, note in (("directory", "phone → olera-providers → city"),
                      ("edu_domain", "the decision maker's .edu address"),
                      ("source_name", "the university is named in the row"),
                      ("area_code", "phone area code, clear match"),
                      ("area_code (weak)", "metro only partly in catchment — check"),
                      ("out-of-scope", "a university that is not one of the six"),
                      ("unresolved", "nothing to go on — needs you")):
        line(src, f'=COUNTIF(Mapping!{cs}2:{cs}{last},"{src}")', note)
    rownum += 1

    head("What each record will be asked to do")
    for task in ("Call to get the right email", "Send the program info",
                 "Identify a contact at the org", "Get permission to email professors"):
        line(task, f'=COUNTIF(Mapping!{cr}2:{cr}{last},"{task}")')
    line("A follow-up round", f'=COUNTIF(Mapping!{cr}2:{cr}{last},"Follow up *")')
    line("Stopped — not interested", f'=COUNTIF(Mapping!{cst}2:{cst}{last},"stopped*")')
    line("Out of scope", f'=COUNTIF(Mapping!{cst}2:{cst}{last},"out of scope")')
    rownum += 1

    head("History")
    line("Completed tasks to create", f"=SUM(Mapping!{col['history_count']}2:{col['history_count']}{last})",
         "one per logged call, with its remark as the note")
    line("Rows flagged for review", f'=COUNTIF(Mapping!{col["review_flag"]}2:{col["review_flag"]}{last},"?*")')
    line("Possible duplicate rows", f'=COUNTIF(Mapping!{col["duplicate_match"]}2:{col["duplicate_match"]}{last},"?*")')

    wb.save(out_path)
    return len(rows)


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    prov, part = read_sheets(src)
    rows = build_rows(prov[1:], part[1:])
    reclassify(rows)
    mark_duplicates(rows)
    mark_cross_tab(rows)
    n = write(rows, dst)
    print(f"{n} rows -> {dst}")
    by = collections.Counter(r["campus_source"] for r in rows)
    for k, v in by.most_common():
        print(f"  {v:5d}  {k}")
