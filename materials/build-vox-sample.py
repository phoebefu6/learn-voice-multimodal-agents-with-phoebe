#!/usr/bin/env python3
"""Build assets/vox-sample.js: real pause and turn-gap durations from the HCRC Map Task Corpus.

Source: HCRC Map Task Corpus annotations v2.1 (NXT format), hcrcmaptask.nxtformatv2-1.zip,
https://groups.inf.ed.ac.uk/maptask/maptasknxt.html . The download page states (read 2026-11-08):
"licensed under a Creative Commons Attribution 4.0 International License". The 2011 zip itself
carries an older 00LICENSE.html (CC BY-NC-SA 2.5); we ship derived silence durations only, attribute
the corpus, and keep the sample non-commercial, which satisfies either reading.
Citation: Anderson, A. et al. (1991) The HCRC Map Task Corpus. Language and Speech 34(4), 351-366.

Why Map Task: two people, task-oriented, and in the "no eye contact" condition (file names with
"n", e.g. q1nc1) they cannot see each other - the nearest open analogue of a phone call. The same
corpus is one of the three Heldner and Edlund (2010) measured.

What is derived (modified): for a seeded sample of no-eye-contact dialogues, the timed word units
(<tu>) of both speakers are merged into one timeline. Every stretch where NOBODY speaks is
classified by who spoke either side of it:
  - pause: the same speaker before and after, nobody else in between (silence inside a turn)
  - gap:   a different speaker after, with only silence between (a speaker change)
  - overlap: a speaker change where the next speaker starts before the last one stops
Breath and other noise units are not speech. Silences under 10 ms (alignment jitter) are dropped.
Shipped per dialogue: pause and gap durations as integer milliseconds, and the overlap count.
No audio, no words, no speaker ids.
Also embedded: materials/wer-samples.json (constructed Callwell transcripts for the WER widget).

Usage:
  python3 materials/build-vox-sample.py <unzipped maptaskv2-1 dir> <repo>
Then: python3 materials/vox_reference.py <repo>   (canon)
"""
from __future__ import annotations

import json
import random
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

SEED = 20261108
N_DIALOGUES = 24
MIN_SILENCE_MS = 10


def units_of(path: Path) -> list[tuple[int, int]]:
    out = []
    for u in ET.parse(path).getroot():
        if u.tag != "tu":
            continue
        s, e = round(float(u.get("start")) * 1000), round(float(u.get("end")) * 1000)
        if e > s:
            out.append((s, e))
    return out


def classify(words: list[tuple[int, int, int]]) -> tuple[list[int], list[int], int]:
    """words: (start_ms, end_ms, speaker). Sweep the merged timeline into stretches where nobody,
    exactly one person, or several people speak; then read each pair of consecutive solo
    stretches: same speaker with only silence between = pause; different speaker with only
    silence between = gap; different speaker with overlapping speech between = overlap.
    Same speaker with someone else's speech between (a backchannel) is neither."""
    ev = []
    for s, e, k in words:
        ev.append((s, 1, k))
        ev.append((e, -1, k))
    ev.sort(key=lambda x: (x[0], x[1]))
    active = {}
    segs = []                       # (start, end, frozenset of speakers)
    t_prev = ev[0][0]
    for t, d, k in ev:
        if t > t_prev:
            segs.append((t_prev, t, frozenset(x for x, c in active.items() if c > 0)))
            t_prev = t
        active[k] = active.get(k, 0) + d
    pauses, gaps, overlaps = [], [], 0
    last_solo = None
    sil, ovl = 0, False
    for s, e, who in segs:
        if len(who) == 0:
            sil += e - s
        elif len(who) > 1:
            ovl = True
        else:
            (k,) = tuple(who)
            if last_solo is not None and (sil > 0 or ovl):
                if k == last_solo:
                    if not ovl and sil >= MIN_SILENCE_MS:
                        pauses.append(sil)
                else:
                    if ovl:
                        overlaps += 1
                    elif sil >= MIN_SILENCE_MS:
                        gaps.append(sil)
                    else:
                        overlaps += 1
            elif last_solo is not None and k != last_solo:
                overlaps += 1       # instant handover with no measurable silence
            last_solo, sil, ovl = k, 0, False
    return pauses, gaps, overlaps


def build(mt: Path, repo: Path) -> None:
    tu = mt / "Data" / "timed-units"
    names = sorted({f.name.split(".")[0] for f in tu.glob("q*n*.timed-units.xml")})
    eligible = [n for n in names if (tu / f"{n}.g.timed-units.xml").exists()
                and (tu / f"{n}.f.timed-units.xml").exists()]
    picked = sorted(random.Random(SEED).sample(eligible, N_DIALOGUES))
    dialogues = []
    for n in picked:
        ws = [(s, e, 0) for s, e in units_of(tu / f"{n}.g.timed-units.xml")]
        ws += [(s, e, 1) for s, e in units_of(tu / f"{n}.f.timed-units.xml")]
        ws.sort()
        p, g, o = classify(ws)
        dialogues.append({"id": n, "pauses": p, "gaps": g, "overlaps": o})
    data = {
        "source": "HCRC Map Task Corpus annotations v2.1, no-eye-contact dialogues, word timings only",
        "licence": "CC BY 4.0 per the corpus download page (read 2026-11-08); derived durations only",
        "citation": "Anderson et al. (1991), The HCRC Map Task Corpus, Language and Speech 34(4)",
        "seed": SEED,
        "eligible": len(eligible),
        "minSilenceMs": MIN_SILENCE_MS,
        "dialogues": dialogues,
        "wer": json.loads((repo / "materials" / "wer-samples.json").read_text()),
    }
    js = ("/* Derived from the HCRC Map Task Corpus (groups.inf.ed.ac.uk/maptask, CC BY 4.0 per its "
          "download page). Modified: silence durations between words, integer ms, classified "
          "pause/gap/overlap. Generated by materials/build-vox-sample.py */\n"
          "window.VOX_SAMPLE = " + json.dumps(data, separators=(",", ":")) + ";\n")
    (repo / "assets" / "vox-sample.js").write_text(js)
    print(f"eligible {len(eligible)}, picked {picked}")
    print(f"pauses {sum(len(d['pauses']) for d in dialogues)}, gaps {sum(len(d['gaps']) for d in dialogues)}, "
          f"overlaps {sum(d['overlaps'] for d in dialogues)}, bytes {len(js)}")


if __name__ == "__main__":
    build(Path(sys.argv[1]), Path(sys.argv[2]))
