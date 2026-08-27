import re

def _pat(t):
    return re.compile(r'\s+'.join(re.escape(w) for w in t.split()))

def apply(path, pairs):
    src = open(path).read()
    n_ok = n_skip = 0
    for old, new in pairs:
        old = old.strip(); new = new.strip()
        ms = list(_pat(old).finditer(src))
        if not ms and _pat(new).search(src):
            n_skip += 1; continue
        assert len(ms) == 1, "ANCHOR %s (%d): %s" % ("MISSING" if not ms else "AMBIG", len(ms), old[:80])
        src = src[:ms[0].start()] + new + src[ms[0].end():]
        n_ok += 1
    open(path, "w").write(src)
    print("%s: %d applied, %d already done" % (path, n_ok, n_skip))
