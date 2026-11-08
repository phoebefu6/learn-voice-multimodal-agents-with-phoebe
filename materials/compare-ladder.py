#!/usr/bin/env python3
"""Compare the Python reference canon with the browser engine run in node, BY VALUE.

Usage: python3 materials/compare-ladder.py <repo>
Runs both, walks every key, and fails on any difference larger than 1e-9 (all canon values are
integers or one-decimal numbers, so equality is the bar). Self-test: a planted 0.1% fault on one
number must make the comparison fail, or the checker itself is broken.
"""
import json, subprocess, sys
from pathlib import Path

def walk(a, b, path, diffs):
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a or k not in b:
                diffs.append(f"{path}.{k}: missing on one side")
            else:
                walk(a[k], b[k], f"{path}.{k}", diffs)
    elif isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            diffs.append(f"{path}: length {len(a)} vs {len(b)}")
        for i, (x, y) in enumerate(zip(a, b)):
            walk(x, y, f"{path}[{i}]", diffs)
    elif isinstance(a, bool) or isinstance(b, bool):
        if a != b:
            diffs.append(f"{path}: {a} vs {b}")
    elif isinstance(a, (int, float)) and isinstance(b, (int, float)):
        if abs(a - b) > 1e-9:
            diffs.append(f"{path}: {a} vs {b}")
    elif a != b:
        diffs.append(f"{path}: {a!r} vs {b!r}")

repo = Path(sys.argv[1]).resolve()
py = json.loads(subprocess.check_output([sys.executable, str(repo / "materials/vox_reference.py"), str(repo), "--json"]))
nd = json.loads(subprocess.check_output(["node", str(repo / "materials/vox-node.js"), str(repo)]))
diffs = []
walk(py, nd, "canon", diffs)
planted = json.loads(json.dumps(nd))
planted["ladder"][0]["total"] *= 1.001
self_test = []
walk(py, planted, "canon", self_test)
print(f"values compared; differences: {len(diffs)}")
for d in diffs[:20]:
    print("  ", d)
print(f"self-test with a planted 0.1% fault: {'caught' if self_test else 'MISSED'}")
sys.exit(0 if (not diffs and self_test) else 1)
