/* vox-live.js - the latency waterfall, the end-of-turn curve and the WER table for
 * learn-voice-multimodal-agents-with-phoebe.
 *
 * MEASURED here, in the browser, from vox-sample.js:
 *   - silences inside one speaker's turn ("pauses") and silences at a speaker change ("gaps")
 *     in 24 no-eye-contact dialogues of the HCRC Map Task Corpus (two people who cannot see
 *     each other, the nearest open analogue of a phone call). A silence timer set to T would
 *     have jumped in on every pause of T or longer: that count, per 100 speaker changes, is the
 *     false cut-in rate the bench prints.
 *   - word error rate on constructed Callwell transcripts (the transcripts are invented, the
 *     arithmetic is real).
 * COMPUTED from stated inputs (the latency waterfall): every stage time is an input with a
 *   default taken from a dated vendor or practitioner figure, or labelled modelled. The engine
 *   only adds, takes maxima where stages run in parallel, and reports the critical path.
 * The Python reference (materials/vox_reference.py) runs the same steps and prints the same
 * numbers; materials/compare-ladder.py checks them by value.
 */
(function (root) {
  "use strict";

  /* ---------- defaults and their tiers (the widget prints the tier next to each) ---------- */
  var DEFAULTS = {
    mode: "cascaded",       // or "s2s"
    T: 500,                 // end-of-turn silence threshold, ms
    U: 100,                 // network uplink, ms
    A: 350,                 // ASR final transcript after last audio, ms
    L: 375,                 // LLM time to first token, ms
    S: 100,                 // TTS time to first audio, ms
    D: 100,                 // network downlink, ms
    M: 375,                 // speech-to-speech model time to first audio, ms (modelled)
    toolMs: 400,            // one tool round trip (Callwell's booking lookup), ms (modelled)
    replyTokens: 40,        // length of the spoken reply, tokens (modelled)
    llmMsPerToken: 20,      // LLM output, ms per token when not streaming (modelled)
    ttsMsPerToken: 10,      // TTS synthesis, ms per reply token when not streaming (modelled)
    streaming: true,
    preemptive: true,
    tool: false,
    target: 800
  };
  var TIERS = {
    U: "practitioner, modelled split",
    T: "vendor default",
    A: "vendor target",
    L: "vendor target",
    S: "vendor target",
    D: "practitioner, modelled split",
    M: "modelled",
    toolMs: "modelled",
    gen: "modelled",
    ttsgen: "modelled"
  };
  var TARGETS = [
    { ms: 200, label: "200 ms - human gap, Stivers et al. 2009" },
    { ms: 800, label: "800 ms - practitioner target, Kramer 2025" },
    { ms: 1000, label: "1,000 ms - LiveKit, under one second" },
    { ms: 1115, label: "1,115 ms - Twilio mouth-to-ear median" }
  ];

  function r1(x) { return Math.floor(x * 10 + 0.5) / 10; }

  /* ---------- latency engine: a small DAG, start = max(end of dependencies) ---------- */
  function latency(opts) {
    var p = {}, k;
    for (k in DEFAULTS) p[k] = DEFAULTS[k];
    for (k in (opts || {})) p[k] = opts[k];
    var nodes = [], by = {};
    function add(key, label, dur, deps, tier) {
      var start = 0;
      for (var i = 0; i < deps.length; i++) start = Math.max(start, by[deps[i]].end);
      var n = { key: key, label: label, dur: dur, deps: deps, start: start, end: start + dur, tier: tier, critical: false };
      nodes.push(n); by[key] = n; return n;
    }
    var preemptiveActive = false, last;
    add("up", "Caller audio uplink", p.U, [], TIERS.U);
    add("eot", "End-of-turn wait", p.T, ["up"], TIERS.T);
    if (p.mode === "s2s") {
      if (p.tool) {
        add("m1", "Model decides on a tool", p.M, ["eot"], TIERS.M);
        add("tool", "Tool call round trip", p.toolMs, ["m1"], TIERS.toolMs);
        last = add("m2", "Model first audio", p.M, ["tool"], TIERS.M);
      } else {
        last = add("m1", "Model first audio", p.M, ["eot"], TIERS.M);
      }
      add("down", "Audio downlink", p.D, [last.key], TIERS.D);
    } else {
      add("asr", "ASR final transcript", p.A, p.streaming ? ["up"] : ["eot"], TIERS.A);
      preemptiveActive = !!(p.preemptive && p.streaming);
      var llm = add("llm", "LLM first token", p.L, preemptiveActive ? ["up"] : ["eot", "asr"], TIERS.L);
      var text = llm;
      if (p.tool) {
        add("tool", "Tool call round trip", p.toolMs, ["eot", "llm"], TIERS.toolMs);
        text = add("llm2", "LLM first token, again", p.L, ["tool"], TIERS.L);
      }
      if (!p.streaming) {
        text = add("gen", "Rest of the reply", p.replyTokens * p.llmMsPerToken, [text.key], TIERS.gen);
      }
      var ttsDur = p.S + (p.streaming ? 0 : p.replyTokens * p.ttsMsPerToken);
      last = add("tts", p.streaming ? "TTS first audio" : "TTS whole reply", ttsDur, ["eot", text.key], p.streaming ? TIERS.S : TIERS.ttsgen);
      add("down", "Audio downlink", p.D, ["tts"], TIERS.D);
    }
    // critical path: walk back from the last node, always to the dependency that ended last
    // (ties go to the dependency listed first)
    var cur = by.down;
    while (cur) {
      cur.critical = true;
      if (!cur.deps.length) break;
      var best = by[cur.deps[0]];
      for (var j = 1; j < cur.deps.length; j++) if (by[cur.deps[j]].end > best.end) best = by[cur.deps[j]];
      cur = best;
    }
    var total = by.down.end, largest = null;
    for (var q = 0; q < nodes.length; q++) {
      if (nodes[q].critical && (!largest || nodes[q].dur > largest.dur)) largest = nodes[q];
    }
    return {
      params: p, nodes: nodes, total: total, target: p.target,
      overBy: total - p.target, onTarget: total <= p.target,
      largest: largest ? { key: largest.key, label: largest.label, dur: largest.dur } : null,
      preemptiveActive: preemptiveActive
    };
  }

  /* ---------- the pause sample ---------- */
  var SAMPLE = root.VOX_SAMPLE || null;
  var PAUSES = [], GAPS = [], OVERLAPS = 0;
  if (SAMPLE) {
    SAMPLE.dialogues.forEach(function (d) {
      PAUSES = PAUSES.concat(d.pauses); GAPS = GAPS.concat(d.gaps); OVERLAPS += d.overlaps;
    });
  }
  function countAtLeast(xs, T) { var n = 0; for (var i = 0; i < xs.length; i++) if (xs[i] >= T) n++; return n; }
  function median(xs) {
    var s = xs.slice().sort(function (a, b) { return a - b; }), n = s.length;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  }
  function cutIns(T) {
    var turns = GAPS.length + OVERLAPS, n = countAtLeast(PAUSES, T), g = countAtLeast(GAPS, T);
    return {
      T: T, pausesAtLeast: n, pauses: PAUSES.length, turns: turns,
      per100: r1(100 * n / turns),
      pauseShare: r1(100 * n / PAUSES.length),
      gapShare: r1(100 * g / GAPS.length)
    };
  }
  function gapStats() {
    var turns = GAPS.length + OVERLAPS;
    return {
      dialogues: SAMPLE ? SAMPLE.dialogues.length : 0,
      pauses: PAUSES.length, gaps: GAPS.length, overlaps: OVERLAPS,
      medianGap: median(GAPS), medianPause: median(PAUSES),
      overlapShare: r1(100 * OVERLAPS / turns),
      gapsUnder500: r1(100 * (GAPS.length - countAtLeast(GAPS, 500)) / GAPS.length)
    };
  }

  /* ---------- word error rate ---------- */
  function normalise(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(" ").filter(function (w) { return w.length; });
  }
  function wer(ref, hyp) {
    var r = normalise(ref), h = normalise(hyp), n = r.length, m = h.length, i, j;
    var d = [];
    for (i = 0; i <= n; i++) { d.push([]); for (j = 0; j <= m; j++) d[i].push(0); }
    for (i = 0; i <= n; i++) d[i][0] = i;
    for (j = 0; j <= m; j++) d[0][j] = j;
    for (i = 1; i <= n; i++) for (j = 1; j <= m; j++) {
      var sub = d[i - 1][j - 1] + (r[i - 1] === h[j - 1] ? 0 : 1);
      d[i][j] = Math.min(sub, d[i - 1][j] + 1, d[i][j - 1] + 1);
    }
    // backtrace: prefer match/substitution, then deletion, then insertion
    var S = 0, D = 0, I = 0, ops = [];
    i = n; j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (r[i - 1] === h[j - 1] ? 0 : 1)) {
        if (r[i - 1] === h[j - 1]) ops.push(["=", r[i - 1], h[j - 1]]); else { S++; ops.push(["S", r[i - 1], h[j - 1]]); }
        i--; j--;
      } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
        D++; ops.push(["D", r[i - 1], ""]); i--;
      } else {
        I++; ops.push(["I", "", h[j - 1]]); j--;
      }
    }
    ops.reverse();
    return { S: S, D: D, I: I, N: n, errors: S + D + I, wer: n ? r1(100 * (S + D + I) / n) : 0, ops: ops };
  }
  function werSamples() {
    if (!SAMPLE || !SAMPLE.wer) return null;
    var rows = [], E = 0, N = 0, slotMiss = 0;
    SAMPLE.wer.pairs.forEach(function (p) {
      var w = wer(p.ref, p.hyp); E += w.errors; N += w.N; if (!p.slotOk) slotMiss++;
      rows.push({ id: p.id, ref: p.ref, hyp: p.hyp, slot: p.slot, slotOk: p.slotOk, S: w.S, D: w.D, I: w.I, N: w.N, wer: w.wer, ops: w.ops });
    });
    return { rows: rows, errors: E, words: N, overall: r1(100 * E / N), slotMiss: slotMiss };
  }

  var VOX = { DEFAULTS: DEFAULTS, TIERS: TIERS, TARGETS: TARGETS, latency: latency, cutIns: cutIns,
    gapStats: gapStats, wer: wer, werSamples: werSamples, normalise: normalise, r1: r1 };
  root.VOX = VOX;
  if (typeof module !== "undefined" && module.exports) module.exports = VOX;
  if (typeof document === "undefined") return;

  /* ====================================================================== widgets */
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function fmt(ms) { return Math.round(ms).toLocaleString("en-US"); }
  function lc(s) { return /^[A-Z]{2,}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---------- 1. the latency waterfall (session 2) ---------- */
  function mountBench(host) {
    var state = {};
    for (var k in DEFAULTS) state[k] = DEFAULTS[k];
    host.classList.add("vx-bench");
    host.innerHTML =
      '<div class="vx-head"><h4>Callwell latency waterfall</h4>' +
      '<p class="vx-intro">Constructed Callwell example. Time runs left to right from the moment the caller stops speaking to the moment the first syllable of the reply reaches their ear. Stage times are inputs, each tagged with where its default came from; the false cut-in rate is measured on real conversation.</p></div>' +
      '<div class="vx-controls">' +
        '<div class="vx-ctl"><span class="vx-clabel">Pipeline</span><div class="vx-seg" role="group" aria-label="Pipeline">' +
          '<button type="button" data-mode="cascaded" class="is-on">Cascaded: ASR, LLM, TTS</button>' +
          '<button type="button" data-mode="s2s">Speech-to-speech</button></div></div>' +
        '<div class="vx-ctl"><label class="vx-clabel" for="vx-t">End-of-turn silence threshold: <b class="vx-tval"></b></label>' +
          '<input id="vx-t" type="range" min="100" max="1200" step="50"></div>' +
        '<div class="vx-ctl vx-toggles">' +
          '<label class="vx-tog"><input type="checkbox" data-k="streaming"> Streaming at every stage</label>' +
          '<label class="vx-tog"><input type="checkbox" data-k="preemptive"> Preemptive generation</label>' +
          '<label class="vx-tog"><span class="vx-tsel">Target</span> <select data-k="target"></select></label>' +
        '</div>' +
        '<div class="vx-ctl vx-actions">' +
          '<button type="button" class="vx-break" data-act="tool">Add a tool call</button>' +
          '<button type="button" class="vx-reset" data-act="reset">Reset to defaults</button>' +
        '</div>' +
      '</div>' +
      '<div class="vx-verdict" aria-live="polite"></div>' +
      '<div class="vx-metrics"></div>' +
      '<div class="vx-stage"></div>' +
      '<div class="vx-tablewrap"><table class="vx-table"><thead><tr><th>Stage</th><th>Time</th><th>Starts after</th><th>Default from</th></tr></thead><tbody></tbody></table></div>' +
      '<p class="vx-rail">Stage times are dated inputs, not measurements of any system: vendor targets from Twilio (2025-11-17), the 500 ms threshold from the OpenAI Realtime API and LiveKit Agents defaults, the 200 ms network budget from Kramer (2025), all re-verify before use. Modelled: the uplink/downlink split, the speech-to-speech first-audio time, the tool call, reply length and per-token rates. Measured: false cut-ins, on 24 HCRC Map Task dialogues (CC BY 4.0), two people who could not see each other, not phone calls.</p>';
    var sel = host.querySelector("select[data-k=target]");
    TARGETS.forEach(function (t) { var o = document.createElement("option"); o.value = t.ms; o.textContent = t.label; sel.appendChild(o); });
    var slider = host.querySelector("#vx-t");
    function sync() {
      host.querySelectorAll(".vx-seg button").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-mode") === state.mode); });
      slider.value = state.T;
      host.querySelector(".vx-tval").textContent = fmt(state.T) + " ms";
      host.querySelectorAll("input[type=checkbox]").forEach(function (c) {
        c.checked = !!state[c.getAttribute("data-k")];
        c.disabled = state.mode === "s2s";
      });
      sel.value = String(state.target);
      var tb = host.querySelector(".vx-break");
      tb.classList.toggle("is-on", state.tool);
      tb.textContent = state.tool ? "Remove the tool call" : "Add a tool call";
      render();
    }
    function render() {
      var r = latency(state), c = cutIns(state.T);
      var v = host.querySelector(".vx-verdict");
      v.className = "vx-verdict " + (r.onTarget ? "is-good" : "is-bad");
      v.innerHTML = (r.onTarget
        ? "<b>" + fmt(r.total) + " ms</b> to first audio: on target, " + fmt(Math.max(0, -r.overBy)) + " ms to spare against " + fmt(r.target) + " ms."
        : "<b>" + fmt(r.total) + " ms</b> to first audio: " + fmt(r.overBy) + " ms over the " + fmt(r.target) + " ms target.") +
        " Fix first: <b>" + esc(lc(r.largest.label)) + "</b> (" + fmt(r.largest.dur) + " ms on the critical path).";
      host.querySelector(".vx-metrics").innerHTML =
        metric("Caller hears the reply after", fmt(r.total) + " ms", "computed", "sum of the critical path") +
        metric("Largest stage on the path", fmt(r.largest.dur) + " ms", "computed", r.largest.label) +
        metric("False cut-ins at " + fmt(state.T) + " ms", c.per100.toFixed(1), "measured", "per 100 speaker changes, " + fmt(c.pausesAtLeast) + " of " + fmt(c.pauses) + " real pauses") +
        metric("Mode", state.mode === "s2s" ? "speech-to-speech" : (r.preemptiveActive ? "cascaded, preemptive" : "cascaded"), "input", state.streaming || state.mode === "s2s" ? "streaming" : "nothing streams");
      drawWaterfall(host.querySelector(".vx-stage"), r);
      var tb = host.querySelector(".vx-table tbody"); tb.innerHTML = "";
      r.nodes.forEach(function (n) {
        var after = n.deps.length ? n.deps.map(function (d) { return labelOf(r, d); }).join(" and ") : "caller stops speaking";
        var tr = el("tr", n.critical ? "is-crit" : "is-par");
        tr.innerHTML = "<td>" + esc(n.label) + (n.critical ? "" : ' <em>in parallel</em>') + "</td><td>" + fmt(n.dur) + " ms</td><td>" + esc(after) + "</td><td>" + esc(n.tier) + "</td>";
        tb.appendChild(tr);
      });
      host.setAttribute("data-total", r.total);
      host.setAttribute("data-cutins", c.per100);
    }
    function labelOf(r, key) { for (var i = 0; i < r.nodes.length; i++) if (r.nodes[i].key === key) return lc(r.nodes[i].label); return key; }
    function metric(label, value, kind, note) {
      return '<div class="vx-metric"><div class="vx-mlabel">' + esc(label) + '</div><div class="vx-mvalue">' + esc(value) +
        '</div><div class="vx-munit">' + esc(note) + '</div><span class="vx-mkind is-' + kind + '">' + kind + '</span></div>';
    }
    host.querySelectorAll(".vx-seg button").forEach(function (b) { b.addEventListener("click", function () { state.mode = b.getAttribute("data-mode"); sync(); }); });
    slider.addEventListener("input", function () { state.T = +slider.value; sync(); });
    host.querySelectorAll("input[type=checkbox]").forEach(function (c) { c.addEventListener("change", function () { state[c.getAttribute("data-k")] = c.checked; sync(); }); });
    sel.addEventListener("change", function () { state.target = +sel.value; sync(); });
    host.querySelector("[data-act=tool]").addEventListener("click", function () { state.tool = !state.tool; sync(); });
    host.querySelector("[data-act=reset]").addEventListener("click", function () { for (var k2 in DEFAULTS) state[k2] = DEFAULTS[k2]; sync(); });
    sync();
    root.VOX_BENCH = {
      set: function (o) { for (var k3 in o) state[k3] = o[k3]; sync(); return latency(state).total; },
      reset: function () { for (var k4 in DEFAULTS) state[k4] = DEFAULTS[k4]; sync(); },
      state: function () { var r = latency(state); return { total: r.total, largest: r.largest.label, cutIns: cutIns(state.T).per100, onTarget: r.onTarget }; }
    };
  }

  function svgEl(tag, attrs, text) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  function drawWaterfall(stage, r) {
    var rows = r.nodes.length, top = 56, rowH = 34;
    var H = top + rows * rowH + 64;
    var x0 = 236, x1 = 720;
    var maxMs = Math.ceil(Math.max(r.total, r.target) * 1.08 / 200) * 200;
    function X(ms) { return x0 + (x1 - x0) * ms / maxMs; }
    var svg = svgEl("svg", { viewBox: "0 0 880 " + H, role: "img",
      "aria-label": "Latency waterfall: " + r.nodes.map(function (n) { return n.label + " " + n.start + " to " + n.end + " ms"; }).join("; ") + ". Total " + r.total + " ms against a target of " + r.target + " ms." });
    svg.appendChild(svgEl("text", { x: 20, y: 22, "class": "vx-svh" }, "FROM THE CALLER'S LAST WORD TO THE FIRST SYLLABLE THEY HEAR"));
    var step = maxMs > 2400 ? 500 : 200;
    for (var t = 0; t <= maxMs; t += step) {
      svg.appendChild(svgEl("line", { x1: X(t), x2: X(t), y1: top - 6, y2: top + rows * rowH, "class": "vx-grid" }));
      svg.appendChild(svgEl("text", { x: X(t), y: top - 12, "text-anchor": "middle", "class": "vx-svs" }, t === 0 ? "0" : String(t)));
    }
    svg.appendChild(svgEl("text", { x: 868, y: top - 12, "text-anchor": "end", "class": "vx-svs" }, "ms"));
    r.nodes.forEach(function (n, i) {
      var y = top + i * rowH;
      svg.appendChild(svgEl("text", { x: 224, y: y + 21, "text-anchor": "end", "class": n.critical ? "vx-svl" : "vx-svm" }, n.label));
      var w = Math.max(2, X(n.end) - X(n.start));
      var cls = n.critical ? (n.key === "tool" ? "vx-bar-tool" : "vx-bar-crit") : "vx-bar-par";
      svg.appendChild(svgEl("rect", { x: X(n.start), y: y + 7, width: w, height: 20, rx: 4, "class": cls }));
      svg.appendChild(svgEl("text", { x: 868, y: y + 21, "text-anchor": "end", "class": n.critical ? "vx-svv" : "vx-svm" },
        fmt(n.dur) + " ms" + (n.critical ? "" : ", parallel")));
    });
    var yb = top + rows * rowH;
    var tx = X(r.target);
    svg.appendChild(svgEl("line", { x1: tx, x2: tx, y1: top - 6, y2: yb + 6, "class": "vx-target" }));
    var tAnchor = tx > 640 ? "end" : "middle";
    svg.appendChild(svgEl("text", { x: tx, y: yb + 22, "text-anchor": tAnchor, "class": "vx-svt" }, "target " + fmt(r.target) + " ms"));
    var ex = X(r.total);
    svg.appendChild(svgEl("path", { d: "M" + ex + " " + (yb + 30) + " l-5 -8 l10 0 z", "class": r.onTarget ? "vx-mark-ok" : "vx-mark-bad" }));
    svg.appendChild(svgEl("text", { x: Math.min(Math.max(ex, x0 + 60), 860), y: yb + 48, "text-anchor": ex > 700 ? "end" : "middle", "class": "vx-svv" },
      "caller hears the reply at " + fmt(r.total) + " ms"));
    stage.innerHTML = ""; stage.appendChild(svg);
  }

  /* ---------- 2. the end-of-turn curve (session 3) ---------- */
  function mountEot(host) {
    var T = +(host.getAttribute("data-t") || 500);
    host.classList.add("vx-bench");
    host.innerHTML =
      '<div class="vx-head"><h4>Silence threshold: what a timer catches</h4>' +
      '<p class="vx-intro">Real silences from 24 HCRC Map Task dialogues (CC BY 4.0), two people who could not see each other. Teal: silences inside one person\'s turn, where a reply would be a cut-in. Coral: silences where the other person really did take the turn. Move the threshold and read both.</p></div>' +
      '<div class="vx-controls"><div class="vx-ctl"><label class="vx-clabel" for="vx-et">Threshold: <b class="vx-tval"></b></label>' +
      '<input id="vx-et" type="range" min="100" max="1200" step="50"></div></div>' +
      '<div class="vx-metrics"></div><div class="vx-stage"></div>' +
      '<p class="vx-rail">Measured: share of real pauses and gaps at least as long as the threshold. Not measured: how a semantic turn detector would do on the same silences; that needs the words and the model, not just the timings.</p>';
    var s = host.querySelector("#vx-et");
    function render() {
      s.value = T; host.querySelector(".vx-tval").textContent = fmt(T) + " ms";
      var c = cutIns(T), g = gapStats();
      host.querySelector(".vx-metrics").innerHTML =
        '<div class="vx-metric"><div class="vx-mlabel">False cut-ins</div><div class="vx-mvalue">' + c.per100.toFixed(1) + '</div><div class="vx-munit">per 100 speaker changes</div><span class="vx-mkind is-measured">measured</span></div>' +
        '<div class="vx-metric"><div class="vx-mlabel">Pauses the timer fires on</div><div class="vx-mvalue">' + c.pauseShare.toFixed(1) + '%</div><div class="vx-munit">' + fmt(c.pausesAtLeast) + ' of ' + fmt(c.pauses) + ' mid-turn pauses</div><span class="vx-mkind is-measured">measured</span></div>' +
        '<div class="vx-metric"><div class="vx-mlabel">Real gaps still running at T</div><div class="vx-mvalue">' + c.gapShare.toFixed(1) + '%</div><div class="vx-munit">the other person had not yet spoken</div><span class="vx-mkind is-measured">measured</span></div>' +
        '<div class="vx-metric"><div class="vx-mlabel">Wait added to every reply</div><div class="vx-mvalue">' + fmt(T) + ' ms</div><div class="vx-munit">human median gap here: ' + fmt(g.medianGap) + ' ms</div><span class="vx-mkind is-computed">computed</span></div>';
      drawCurve(host.querySelector(".vx-stage"), T);
      host.setAttribute("data-cutins", c.per100);
    }
    s.addEventListener("input", function () { T = +s.value; render(); });
    render();
    root.VOX_EOT = { set: function (t) { T = t; render(); return cutIns(T); } };
  }
  function drawCurve(stage, T) {
    var H = 300, x0 = 90, x1 = 830, y0 = 50, y1 = 230;
    function X(ms) { return x0 + (x1 - x0) * (ms - 100) / 1100; }
    function Y(pct) { return y1 - (y1 - y0) * pct / 100; }
    var svg = svgEl("svg", { viewBox: "0 0 880 " + H, role: "img",
      "aria-label": "Two falling curves, share of real pauses and of real gaps at least as long as the threshold, from 100 to 1200 ms. They nearly coincide. At " + T + " ms, " + cutIns(T).pauseShare + "% of pauses and " + cutIns(T).gapShare + "% of gaps are that long." });
    svg.appendChild(svgEl("text", { x: 20, y: 22, "class": "vx-svh" }, "A SILENCE TIMER CANNOT TELL A THINKING PAUSE FROM A FINISHED TURN"));
    [0, 25, 50, 75, 100].forEach(function (v) {
      svg.appendChild(svgEl("line", { x1: x0, x2: x1, y1: Y(v), y2: Y(v), "class": "vx-grid" }));
      svg.appendChild(svgEl("text", { x: x0 - 10, y: Y(v) + 4, "text-anchor": "end", "class": "vx-svs" }, v + "%"));
    });
    [100, 300, 500, 700, 900, 1100].forEach(function (v) {
      svg.appendChild(svgEl("text", { x: X(v), y: y1 + 18, "text-anchor": "middle", "class": "vx-svs" }, v + " ms"));
    });
    function line(cls, key) {
      var d = "";
      for (var t = 100; t <= 1200; t += 25) { var c = cutIns(t); d += (t === 100 ? "M" : "L") + X(t).toFixed(1) + " " + Y(c[key]).toFixed(1) + " "; }
      svg.appendChild(svgEl("path", { d: d, "class": cls }));
    }
    line("vx-curve-pause", "pauseShare");
    line("vx-curve-gap", "gapShare");
    var tx = X(T);
    svg.appendChild(svgEl("line", { x1: tx, x2: tx, y1: y0 - 6, y2: y1, "class": "vx-target" }));
    svg.appendChild(svgEl("rect", { x: 600, y: 102, width: 14, height: 4, "class": "vx-key-pause" }));
    svg.appendChild(svgEl("text", { x: 620, y: 108, "class": "vx-svm" }, "pauses inside a turn"));
    svg.appendChild(svgEl("rect", { x: 600, y: 120, width: 14, height: 4, "class": "vx-key-gap" }));
    svg.appendChild(svgEl("text", { x: 620, y: 126, "class": "vx-svm" }, "gaps before the other spoke"));
    svg.appendChild(svgEl("text", { x: 20, y: H - 14, "class": "vx-svs" },
      "Share of silences at least as long as the threshold. Same shape on both sides, which is why semantic turn detection exists."));
    stage.innerHTML = ""; stage.appendChild(svg);
  }

  /* ---------- 3. word error rate (session 5) ---------- */
  function mountWer(host) {
    var ws = werSamples();
    host.classList.add("vx-bench");
    var html = '<div class="vx-head"><h4>Word error rate, computed</h4>' +
      '<p class="vx-intro">Constructed Callwell example: invented caller lines and invented recogniser output. The alignment and the arithmetic are real: lower-case, strip punctuation, align word by word, count substitutions (S), deletions (D) and insertions (I).</p></div>' +
      '<div class="vx-tablewrap"><table class="vx-table vx-wer"><thead><tr><th>What the caller said / what the recogniser wrote</th><th>S</th><th>D</th><th>I</th><th>N</th><th>WER</th><th>Booking still right?</th></tr></thead><tbody>';
    ws.rows.forEach(function (r) {
      var al = r.ops.map(function (o) {
        if (o[0] === "=") return esc(o[1]);
        if (o[0] === "S") return '<span class="vx-op-s">' + esc(o[1]) + " &rarr; " + esc(o[2]) + "</span>";
        if (o[0] === "D") return '<span class="vx-op-d">' + esc(o[1]) + "</span>";
        return '<span class="vx-op-i">+' + esc(o[2]) + "</span>";
      }).join(" ");
      html += '<tr><td><div class="vx-ref">' + esc(r.ref) + '</div><div class="vx-al">' + al + '</div></td><td>' + r.S + '</td><td>' + r.D + '</td><td>' + r.I + '</td><td>' + r.N +
        '</td><td><b>' + r.wer.toFixed(1) + '%</b></td><td>' + (r.slotOk ? "yes" : '<span class="vx-no">no, ' + esc(r.slot) + '</span>') + '</td></tr>';
    });
    html += '</tbody></table></div>' +
      '<div class="vx-verdict is-bad">Overall: <b>' + ws.errors + ' errors in ' + ws.words + ' reference words, WER ' + ws.overall.toFixed(1) + '%</b>. Bookings broken: <b>' + ws.slotMiss + ' of ' + ws.rows.length + '</b>.</div>' +
      '<div class="vx-try"><label class="vx-clabel" for="vx-wr">Reference (what was said)</label><input id="vx-wr" type="text" value="Tuesday the fourteenth at nine thirty">' +
      '<label class="vx-clabel" for="vx-wh">Hypothesis (what the recogniser wrote)</label><input id="vx-wh" type="text" value="Tuesday the fourth at nine thirty">' +
      '<p class="vx-tryout" aria-live="polite"></p></div>' +
      '<p class="vx-rail">Normalisation is a choice: these rules ignore case and punctuation and keep apostrophes. Change the rules and the number changes, which is why a WER figure without its normaliser is not comparable.</p>';
    host.innerHTML = html;
    var a = host.querySelector("#vx-wr"), b = host.querySelector("#vx-wh"), out = host.querySelector(".vx-tryout");
    function run() { var w = wer(a.value, b.value); out.innerHTML = "S " + w.S + ", D " + w.D + ", I " + w.I + ", N " + w.N + ": <b>WER " + w.wer.toFixed(1) + "%</b>"; }
    a.addEventListener("input", run); b.addEventListener("input", run); run();
  }

  function boot() {
    var b = document.getElementById("vox-bench"); if (b) mountBench(b);
    var e = document.getElementById("vox-eot"); if (e) mountEot(e);
    var w = document.getElementById("vox-wer"); if (w) mountWer(w);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})(typeof window !== "undefined" ? window : globalThis);
