#!/usr/bin/env python3
"""Build the single-file app: src/ -> index.html (what GitHub Pages serves).

Usage:  python3 tools/build.py          # writes ./index.html (comments and indentation stripped)
        python3 tools/build.py --dev    # same, but readable (no stripping)
        python3 tools/build.py --check  # exit 1 if ./index.html is stale

The stripper is deliberately conservative: it never renames anything or joins lines, it only drops comments, indentation,
trailing spaces and blank lines, and leaves strings, template literals and regex literals untouched.
"""
import sys, glob, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANNER = "HISS — pocket cassette deck. MIT License, (c) 2026 Kirill Kinderhart. Source: src/ (built by tools/build.py)."

def cat(pattern):
    parts = []
    for f in sorted(glob.glob(os.path.join(ROOT, pattern))):
        with open(f, encoding="utf-8") as fh:
            parts.append(fh.read().rstrip("\n"))
    return "\n".join(parts)

def strip_css(src):
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c in "\"'":                                   # string: copy verbatim
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == "\\" else 1
            out.append(src[i:j + 1]); i = j + 1
        elif src.startswith("/*", i):                    # comment
            i = src.index("*/", i) + 2
        else:
            out.append(c); i += 1
    t = "".join(out)
    t = re.sub(r"[ \t]*\n\s*", "\n", t)                 # indentation + blank lines
    t = re.sub(r"[ \t]+(?=[{};,>])|(?<=[{;,>])[ \t]+", "", t)
    return t.strip()

REGEX_PREV = set("(,=:[!&|?{};+-*%<>~^")
def strip_js(src):
    out, i, n = [], 0, len(src)
    last = ""                                             # last significant char, to tell a regex from a division
    while i < n:
        c = src[i]
        if c in "\"'":
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == "\\" else 1
            out.append(src[i:j + 1]); i = j + 1; last = c
        elif c == "`":                                   # template literal, ${...} nesting handled
            j, depth = i + 1, 0
            while j < n:
                if src[j] == "\\": j += 2; continue
                if src.startswith("${", j): depth += 1; j += 2; continue
                if src[j] == "}" and depth: depth -= 1
                elif src[j] == "`" and depth == 0: break
                j += 1
            out.append(src[i:j + 1]); i = j + 1; last = c
        elif src.startswith("//", i):
            while i < n and src[i] != "\n": i += 1
        elif src.startswith("/*", i):
            i = src.index("*/", i) + 2
        elif c == "/" and (last in REGEX_PREV or last == "" or last == "\n" or re.search(r"(return|typeof|case)$", "".join(out[-3:])[-8:])):
            j, cls = i + 1, False                        # regex literal
            while j < n and (src[j] != "/" or cls):
                if src[j] == "\\": j += 1
                elif src[j] == "[": cls = True
                elif src[j] == "]": cls = False
                j += 1
            j += 1
            while j < n and src[j].isalpha(): j += 1
            out.append(src[i:j]); i = j; last = "x"
        else:
            out.append(c)
            if not c.isspace(): last = c
            i += 1
    # indentation / trailing space / blank lines, but never inside a template literal
    t = "".join(out)
    res, pos = [], 0
    for m in re.finditer(r"`(?:\\.|\$\{(?:[^{}]|\{[^{}]*\})*\}|[^`\\])*`", t):
        res.append(("code", t[pos:m.start()])); res.append(("tpl", m.group())); pos = m.end()
    res.append(("code", t[pos:]))
    joined = "".join(("\u0000%d\u0000" % k if kind == "tpl" else seg) for k, (kind, seg) in enumerate(res))
    joined = re.sub(r"[ \t]*\n[ \t\n]*", "\n", joined)
    for k, (kind, seg) in enumerate(res):
        if kind == "tpl": joined = joined.replace("\u0000%d\u0000" % k, seg)
    return joined.strip()

def build(dev=False):
    tpl = open(os.path.join(ROOT, "src", "template.html"), encoding="utf-8").read()
    css, js = cat("src/css/*.css"), cat("src/js/*.js")
    if not dev:
        css, js = strip_css(css), strip_js(js)
    out = tpl.replace("/*@css*/", css).replace("/*@js*/", js)
    return out.replace("<head>", "<head>\n<!-- " + BANNER + " -->", 1)

if __name__ == "__main__":
    out = build(dev="--dev" in sys.argv)
    dst = os.path.join(ROOT, "index.html")
    if "--check" in sys.argv:
        cur = open(dst, encoding="utf-8").read() if os.path.exists(dst) else ""
        sys.exit(0 if cur == out else 1)
    with open(dst, "w", encoding="utf-8") as fh:
        fh.write(out)
    print("index.html: %d bytes" % len(out.encode()))
