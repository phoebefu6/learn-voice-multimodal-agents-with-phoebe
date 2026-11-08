#!/usr/bin/env python3
"""Python reference for assets/vox-live.js. Same steps, same order, same rounding.

Usage:
  python3 materials/vox_reference.py <repo>          # human-readable canon
  python3 materials/vox_reference.py <repo> --json   # canon as JSON (compare-ladder.py reads this)
"""
from __future__ import annotations

import json
import math
import re
import sys
from pathlib import Path

DEFAULTS = dict(mode="cascaded", T=500, U=100, A=350, L=375, S=100, D=100, M=375, toolMs=400,
                replyTokens=40, llmMsPerToken=20, ttsMsPerToken=10, streaming=True,
                preemptive=True, tool=False, target=800)


def r1(x: float) -> float:
    return math.floor(x * 10 + 0.5) / 10


def latency(opts: dict | None = None) -> dict:
    p = dict(DEFAULTS)
    p.update(opts or {})
    nodes, by = [], {}

    def add(key, label, dur, deps):
        start = max([by[d]["end"] for d in deps], default=0)
        n = dict(key=key, label=label, dur=dur, deps=deps, start=start, end=start + dur, critical=False)
        nodes.append(n)
        by[key] = n
        return n

    add("up", "Caller audio uplink", p["U"], [])
    add("eot", "End-of-turn wait", p["T"], ["up"])
    if p["mode"] == "s2s":
        if p["tool"]:
            add("m1", "Model decides on a tool", p["M"], ["eot"])
            add("tool", "Tool call round trip", p["toolMs"], ["m1"])
            last = add("m2", "Model first audio", p["M"], ["tool"])
        else:
            last = add("m1", "Model first audio", p["M"], ["eot"])
        add("down", "Audio downlink", p["D"], [last["key"]])
    else:
        add("asr", "ASR final transcript", p["A"], ["up"] if p["streaming"] else ["eot"])
        pre = bool(p["preemptive"] and p["streaming"])
        llm = add("llm", "LLM first token", p["L"], ["up"] if pre else ["eot", "asr"])
        text = llm
        if p["tool"]:
            add("tool", "Tool call round trip", p["toolMs"], ["eot", "llm"])
            text = add("llm2", "LLM first token, again", p["L"], ["tool"])
        if not p["streaming"]:
            text = add("gen", "Rest of the reply", p["replyTokens"] * p["llmMsPerToken"], [text["key"]])
        tts = p["S"] + (0 if p["streaming"] else p["replyTokens"] * p["ttsMsPerToken"])
        add("tts", "TTS first audio" if p["streaming"] else "TTS whole reply", tts, ["eot", text["key"]])
        add("down", "Audio downlink", p["D"], ["tts"])
    cur = by["down"]
    while cur:
        cur["critical"] = True
        if not cur["deps"]:
            break
        best = by[cur["deps"][0]]
        for d in cur["deps"][1:]:
            if by[d]["end"] > best["end"]:
                best = by[d]
        cur = best
    largest = None
    for n in nodes:
        if n["critical"] and (largest is None or n["dur"] > largest["dur"]):
            largest = n
    total = by["down"]["end"]
    return dict(total=total, largest=largest["label"], largestMs=largest["dur"],
                onTarget=total <= p["target"], critical=[n["key"] for n in nodes if n["critical"]])


def load(repo: Path) -> dict:
    t = (repo / "assets" / "vox-sample.js").read_text()
    return json.loads(t[t.index("{"): t.rindex("}") + 1])


def wer(ref: str, hyp: str) -> dict:
    norm = lambda s: [w for w in re.sub(r"[^a-z0-9' ]+", " ", s.lower()).split(" ") if w]
    r, h = norm(ref), norm(hyp)
    n, m = len(r), len(h)
    d = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        d[i][0] = i
    for j in range(m + 1):
        d[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            d[i][j] = min(d[i - 1][j - 1] + (r[i - 1] != h[j - 1]), d[i - 1][j] + 1, d[i][j - 1] + 1)
    S = D = I = 0
    i, j = n, m
    while i > 0 or j > 0:
        if i > 0 and j > 0 and d[i][j] == d[i - 1][j - 1] + (r[i - 1] != h[j - 1]):
            S += r[i - 1] != h[j - 1]
            i, j = i - 1, j - 1
        elif i > 0 and d[i][j] == d[i - 1][j] + 1:
            D += 1
            i -= 1
        else:
            I += 1
            j -= 1
    return dict(S=S, D=D, I=I, N=n, wer=r1(100 * (S + D + I) / n) if n else 0)


RUNGS = [
    ("defaults", {}),
    ("defaults + tool call", {"tool": True}),
    ("preemptive off", {"preemptive": False}),
    ("preemptive off + tool call", {"preemptive": False, "tool": True}),
    ("streaming off", {"streaming": False}),
    ("threshold 200", {"T": 200}),
    ("threshold 300", {"T": 300}),
    ("threshold 800", {"T": 800}),
    ("speech-to-speech", {"mode": "s2s"}),
    ("speech-to-speech + tool call", {"mode": "s2s", "tool": True}),
    ("speech-to-speech, threshold 200", {"mode": "s2s", "T": 200}),
]


def canon(repo: Path) -> dict:
    data = load(repo)
    P = [x for d in data["dialogues"] for x in d["pauses"]]
    G = [x for d in data["dialogues"] for x in d["gaps"]]
    O = sum(d["overlaps"] for d in data["dialogues"])
    turns = len(G) + O

    def med(xs):
        s = sorted(xs)
        k = len(s)
        return s[(k - 1) // 2] if k % 2 else (s[k // 2 - 1] + s[k // 2]) / 2

    out = {"ladder": [dict(rung=name, **latency(o)) for name, o in RUNGS], "cutIns": {}}
    for T in [100, 200, 300, 400, 500, 600, 700, 800, 1000, 1200]:
        n = sum(1 for x in P if x >= T)
        g = sum(1 for x in G if x >= T)
        out["cutIns"][str(T)] = dict(per100=r1(100 * n / turns), pauseShare=r1(100 * n / len(P)),
                                     gapShare=r1(100 * g / len(G)), n=n)
    out["gaps"] = dict(dialogues=len(data["dialogues"]), pauses=len(P), gaps=len(G), overlaps=O,
                       medianGap=med(G), medianPause=med(P), overlapShare=r1(100 * O / turns),
                       gapsUnder500=r1(100 * sum(1 for x in G if x < 500) / len(G)))
    rows, E, N, miss = [], 0, 0, 0
    for p in data["wer"]["pairs"]:
        w = wer(p["ref"], p["hyp"])
        E += w["S"] + w["D"] + w["I"]
        N += w["N"]
        miss += not p["slotOk"]
        rows.append(dict(id=p["id"], **w))
    out["wer"] = dict(overall=r1(100 * E / N), errors=E, words=N, slotMiss=miss, rows=rows)
    out["werTry"] = wer("Tuesday the fourteenth at nine thirty", "Tuesday the fourth at nine thirty")
    return out


if __name__ == "__main__":
    repo = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
    c = canon(repo)
    if "--json" in sys.argv:
        print(json.dumps(c, indent=1))
    else:
        for r in c["ladder"]:
            print(f"{r['rung']:34s} total {r['total']:5d} ms  largest {r['largest']} ({r['largestMs']} ms)  on target {r['onTarget']}")
        for T, v in c["cutIns"].items():
            print(f"threshold {T:>5s} ms: false cut-ins {v['per100']} per 100 speaker changes, pauses {v['pauseShare']}%, gaps {v['gapShare']}%")
        print("gaps", c["gaps"])
        print("wer", c["wer"])
        print("wer try", c["werTry"])
