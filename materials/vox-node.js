// Run the browser engine (assets/vox-live.js) in node on the shipped sample and print the canon
// ladder as JSON. Usage: node materials/vox-node.js <repo>
const fs = require("fs"), path = require("path"), vm = require("vm");
const repo = process.argv[2] || path.join(__dirname, "..");
const ctx = { console };
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(repo, "assets/vox-sample.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(repo, "assets/vox-live.js"), "utf8"), ctx);
const V = ctx.VOX;
const RUNGS = [
  ["defaults", {}],
  ["defaults + tool call", { tool: true }],
  ["preemptive off", { preemptive: false }],
  ["preemptive off + tool call", { preemptive: false, tool: true }],
  ["streaming off", { streaming: false }],
  ["threshold 200", { T: 200 }],
  ["threshold 300", { T: 300 }],
  ["threshold 800", { T: 800 }],
  ["speech-to-speech", { mode: "s2s" }],
  ["speech-to-speech + tool call", { mode: "s2s", tool: true }],
  ["speech-to-speech, threshold 200", { mode: "s2s", T: 200 }]
];
const out = { ladder: [], cutIns: {}, gaps: V.gapStats(), wer: null };
for (const [name, o] of RUNGS) {
  const r = V.latency(o);
  out.ladder.push({ rung: name, total: r.total, largest: r.largest.label, largestMs: r.largest.dur,
    onTarget: r.onTarget, critical: r.nodes.filter(n => n.critical).map(n => n.key) });
}
for (const T of [100, 200, 300, 400, 500, 600, 700, 800, 1000, 1200]) {
  const c = V.cutIns(T); out.cutIns[T] = { per100: c.per100, pauseShare: c.pauseShare, gapShare: c.gapShare, n: c.pausesAtLeast };
}
const w = V.werSamples();
out.wer = { overall: w.overall, errors: w.errors, words: w.words, slotMiss: w.slotMiss,
  rows: w.rows.map(r => ({ id: r.id, S: r.S, D: r.D, I: r.I, N: r.N, wer: r.wer })) };
const t = V.wer("Tuesday the fourteenth at nine thirty", "Tuesday the fourth at nine thirty");
out.werTry = { S: t.S, D: t.D, I: t.I, N: t.N, wer: t.wer };
console.log(JSON.stringify(out, null, 1));
