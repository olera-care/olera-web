# -*- coding: utf-8 -*-
"""Check the three role manuals against the master document.

Mechanical checks only. It cannot judge whether a sentence means the same
thing, but it catches the drift that is checkable: an invented stage code, a
role named a different way, an ownership claim the master does not make, a
completion criterion reworded, a deferred-build item that does not exist.
"""
import re, sys, os, html

HERE = os.path.dirname(os.path.abspath(__file__))
MASTER = open(os.path.join(HERE, '..', 'matrix-src', 'MATRIX.md'), encoding='utf-8').read()
ROLES = {k: open(os.path.join(HERE, f'{k}.md'), encoding='utf-8').read()
         for k in ('ADMIN', 'SALES', 'CRM')}

fail = []
def check(ok, msg):
    print(('  ok   ' if ok else '  FAIL ') + msg)
    if not ok:
        fail.append(msg)

def norm(s):
    """Compare wording, not punctuation. The role sources write the middle dot
    as an HTML entity, so entities are decoded before anything else or the
    numeric reference survives into the comparison as a word."""
    s = html.unescape(s).replace('\u2014', ' ').replace('\u00b7', ' ')
    return re.sub(r'[^a-z0-9]+', ' ', s.lower()).strip()

# ---------------------------------------------------------------- stage codes
print('\nSTAGE CODES')
MASTER_STAGES = set(re.findall(r'^## ([A-Z0-9–-]+(?:–ST7)?) —', MASTER, re.M))
MASTER_STAGES = {s.strip() for s in MASTER_STAGES}
print('  master defines:', ' '.join(sorted(MASTER_STAGES)))
CODE = re.compile(r'\b(PR\d|PR-OUT|ST\d|ST-OUT|QUAL|MA\d)\b')
allowed = {'PR1','PR2','PR3','PR-OUT','ST1','ST2','ST3','ST4','ST5','ST6','ST7',
           'ST8','ST-OUT','QUAL','MA1','MA2','MA3','MA4','MA5'}
for k, txt in ROLES.items():
    used = set(CODE.findall(txt))
    check(used <= allowed, f'{k}: stage codes all exist in the master'
          + ('' if used <= allowed else f' (invented: {sorted(used - allowed)})'))

# ---------------------------------------------------------------- vocabulary
print('\nVOCABULARY DISCIPLINE')
# terms the master never uses, and that a role rewrite would naturally reach for
BANNED = ['customer success', 'account manager', 'account executive', 'SDR',
          'BDR', 'sales rep', 'onboarding specialist', 'CSM', 'lead qualification',
          'MQL', 'SQL ', 'pipeline stage', 'deal', 'quota', 'territory manager',
          'human SOP', 'client success manager']
for k, txt in ROLES.items():
    hits = [b for b in BANNED if b.lower() in txt.lower() and b.lower() not in MASTER.lower()]
    check(not hits, f'{k}: no vocabulary the master does not use' +
          ('' if not hits else f' (found: {hits})'))
for k, txt in ROLES.items():
    check('uman' not in txt, f'{k}: the word "human" does not appear')

# the three role names, exactly as the master writes them
print('\nROLE NAMES')
for k, txt in ROLES.items():
    for wrong, right in [('Admin team', 'Admin Team'), ('Sales lead', 'Sales Lead'),
                         ('User success manager', 'User Success Manager'),
                         ('user success manager', 'User Success Manager')]:
        check(wrong not in txt, f'{k}: writes "{right}", never "{wrong}"')
check('User Success Manager' in ROLES['CRM'] and 'CRM Manager' not in ROLES['CRM'],
      'CRM: the operating role is written as User Success Manager throughout')

# ---------------------------------------------------------------- ownership
print('\nOWNERSHIP')
OWNER = dict(re.findall(r'^## ([A-Z0-9–-]+) —.*?\n\n\*\*Objective\*\*.*?'
                        r'\n- \*\*Owner\*\* (.*?)\.?\n', MASTER, re.S | re.M))
EXPECT = {'ADMIN': ['PR1', 'PR-OUT', 'ST1', 'ST-OUT'],
          'SALES': ['PR2', 'ST2'],
          'CRM':   ['PR3', 'MA3', 'MA4', 'MA5']}
ROLE_OF = {'ADMIN': 'Admin Team', 'SALES': 'Sales Lead', 'CRM': 'User Success Manager'}
for k, stages in EXPECT.items():
    for st in stages:
        owner = OWNER.get(st, '')
        check(ROLE_OF[k] in owner,
              f'{k}: master gives {st} to {ROLE_OF[k]} (master says: "{owner}")')
# the four stages the Portal owns, where CRM is exceptions only
for st in ('ST8', 'QUAL', 'MA1', 'MA2'):
    check('Portal' in OWNER.get(st, ''), f'CRM: master gives {st} to the Portal, not to a role')
check('exception' in ROLES['CRM'].lower(),
      'CRM: names itself the exception handler on the Portal stages')

# ---------------------------------------------------------- completion criteria
print('\nCOMPLETION CRITERIA CARRIED VERBATIM')
DONE = dict(re.findall(r'^## ([A-Z0-9–-]+) —.*?\n- \*\*Completion criteria\*\* (.*?)\n',
                       MASTER, re.S | re.M))
for k, stages in EXPECT.items():
    for st in stages:
        want = norm(DONE[st])
        got = norm(ROLES[k])
        check(want in got, f'{k}: {st} completion criteria word for word')

# ------------------------------------------------------------- deferred items
print('\nDEFERRED BUILD ITEMS')
DEFERRED = set(re.findall(r'\*\*(B\d+)\*\*', MASTER))
for k, txt in ROLES.items():
    cited = set(re.findall(r'\bB(\d{1,2})\b', txt))
    cited = {'B' + c for c in cited}
    unknown = cited - DEFERRED
    check(not unknown, f'{k}: every B-number cited exists in the master'
          + ('' if not unknown else f' (unknown: {sorted(unknown)})'))

# ------------------------------------------------------- role coverage of gaps
print('\nGAP COVERAGE')
BY_ROLE = {  # which deferred items sit on stages this role owns or works
    'ADMIN': {'B1', 'B3', 'B8'},
    'SALES': {'B1', 'B2', 'B4', 'B6', 'B7', 'B8', 'B12'},
    'CRM':   {'B4', 'B5', 'B9', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16',
              'B17', 'B18', 'B19', 'B20', 'B21', 'B22', 'B23', 'B24', 'B25',
              'B26', 'B27', 'B28', 'B29'},
}
for k, want in BY_ROLE.items():
    cited = {'B' + c for c in re.findall(r'\bB(\d{1,2})\b', ROLES[k])}
    missing = want - cited
    check(not missing, f'{k}: carries every deferred item on its own stages'
          + ('' if not missing else f' (missing: {sorted(missing)})'))

# ------------------------------------------------------------------ structure
print('\nREQUIRED STRUCTURE')
for k, txt in ROLES.items():
    for head in ('ROLE PURPOSE', 'WHAT YOU OWN', 'WHAT YOU DO NOT OWN',
                 'WHO HANDS WORK TO YOU', 'WHO YOU HAND WORK TO'):
        check(f'**{head}**' in txt, f'{k}: has {head}')
    check('{: .navbar }' in txt, f'{k}: has the section navigation bar')
    check(txt.count('{: .totop }') >= 5, f'{k}: every section returns to the top')
    check('#trace' in txt and '#gaps' in txt, f'{k}: has traceability and gaps sections')

print('\n' + ('ALL CHECKS PASSED' if not fail else f'{len(fail)} FAILED'))
sys.exit(1 if fail else 0)
