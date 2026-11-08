# Source map - learn-voice-multimodal-agents-with-phoebe

Built 2026-11-08 by Phoebe Fu's course lead. Single-track, 6 sessions x 45 min, audience: builders who
have shipped a text agent or chatbot and now need voice and/or images. Public course.

**Re-verify the changelog before delivery.** Every product, model name, price, default and latency
figure below is dated 2026-11-08 and tiered. Voice AI moves monthly: a default read today can be
renamed by the time a learner reads it (LiveKit already renamed `min_endpointing_delay` to
`turn_handling` endpointing `min_delay`).

Raw notes with every quote and URL: `materials/research-notes.md` (456 lines, read 2026-11-08).

## Evidence tiers used on every page

- **read at source** - read on the primary page named, 2026-11-08.
- **vendor-reported** - a vendor's own figure about its own product, read at source; not
  independently measured. All latency targets and model speeds are this tier.
- **practitioner** - a named practitioner's published guidance, read at source.
- **reported** - read only in a secondary source; say "reported" on the page.
- **measured** - computed in the browser from the shipped real sample.
- **modelled** - an input we chose; the widget labels it.
- **constructed** - the Callwell case and its transcripts, referral letter, call flows.

## The running case

**Constructed Callwell example** (label it every time): a fictional multi-site clinic's booking line.
Callers speak; some text a photo of a referral letter; they expect a reply in under a second; some
interrupt. Sites: Riverside, Northgate, Harbour (all invented). Clinician names used: Doctor Okafor,
Doctor Lindqvist (invented). Grep of `github_repo/learn-*` on 2026-11-08: "Callwell" appears nowhere
else. No real patient data; the referral letter is invented and says so.

## The bench (session 2) and the two small widgets (sessions 3 and 5)

Engine `assets/vox-live.js`, data `assets/vox-sample.js` (28,992 bytes), builder
`materials/build-vox-sample.py`, reference `materials/vox_reference.py`, node runner
`materials/vox-node.js`, checker `materials/compare-ladder.py` (0 differences by value, planted 0.1%
fault caught, 2026-11-08).

### Real data: HCRC Map Task Corpus (measured tier)

- Source: HCRC Map Task Corpus annotations v2.1, https://groups.inf.ed.ac.uk/maptask/maptasknxt.html .
  The download page says, read 2026-11-08: "licensed under a Creative Commons Attribution 4.0
  International License". The 2011 zip carries an older 00LICENSE.html (CC BY-NC-SA 2.5). We ship
  derived silence durations only, attribute, and the course is free and non-commercial, which
  satisfies either reading. Citation: Anderson, A. et al. (1991), The HCRC Map Task Corpus,
  Language and Speech 34(4), 351-366.
- Sample: 24 of the 64 no-eye-contact dialogues (seed 20261108). Two people who cannot see each
  other: the nearest open analogue of a phone call, but NOT phone calls and not a booking line.
- Classification: both speakers' timed word units merged; a silence with the same speaker either
  side and nobody else between is a **pause**; with a different speaker after and only silence
  between it is a **gap**; a speaker change with overlapping speech is an **overlap**. Breath and
  noise units are not speech; silences under 10 ms dropped.
- Why not AMI (the donor's corpus): AMI manual word timings are contiguous inside a segment (91% of
  same-speaker word boundaries have zero silence in two meetings checked), so short pauses vanish.
  Tried and rejected 2026-11-08.

Canon (python = node, 2026-11-08):

| Measure | Value |
|---|---|
| dialogues / pauses / gaps / overlaps | 24 / 3,520 / 3,014 / 1,218 |
| median gap / median pause | 335 ms / 323 ms |
| overlap share of speaker changes | 28.8% |
| gaps under 500 ms | 64.6% |
| threshold 100: false cut-ins per 100 speaker changes / pauses / gaps | 71.8 / 86.3% / 85.9% |
| threshold 200 | 55.2 / 66.3% / 69.2% |
| threshold 300 | 44.4 / 53.4% / 54.0% |
| threshold 400 | 34.8 / 41.8% / 43.5% |
| threshold 500 | 27.2 / 32.6% / 35.4% |
| threshold 600 | 21.3 / 25.7% / 28.5% |
| threshold 700 | 17.2 / 20.7% / 23.2% |
| threshold 800 | 14.2 / 17.1% / 19.6% |
| threshold 1000 | 9.7 / 11.6% / 13.7% |
| threshold 1200 | 6.7 / 8.0% / 9.2% |

"False cut-ins per 100 speaker changes" = pauses at least T long / (gaps + overlaps) x 100: every
such pause is a moment a pure silence timer set to T would have started talking while the speaker
was not finished. Cross-check against Heldner and Edlund (2010) on the same corpus: they report a
500 ms threshold catches 47.5% of gaps and 56.0% of pauses in HCRC Map Task; ours are 35.4% and
32.6%. Different segmentation (they used their own speech activity detection; we use the timed word
units), so the levels differ, and the SHAPE agrees: pauses and gaps have nearly the same length
distribution, so a timer cannot separate them. Teach both numbers and the reason they differ.
Overlap share 28.8% here vs their "about 40%" across three corpora: same direction, lower level.

### The latency waterfall (computed tier, inputs tiered)

Time 0 = the caller's last word. A stage starts when everything it depends on has finished.

| Input | Default | Tier and source |
|---|---|---|
| End-of-turn silence threshold T | 500 ms | vendor default: OpenAI Realtime `server_vad` `silence_duration_ms` "Defaults to 500ms" (API reference); LiveKit Agents JS `minDelay` default 500 ms |
| Uplink / downlink | 100 / 100 ms | practitioner: Kramer 2025 budgets 200 ms network "if you use WebRTC"; the even split is modelled |
| ASR final transcript | 350 ms | vendor target: Twilio cascaded guide, STT 350 ms target (500 upper) |
| LLM time to first token | 375 ms | vendor target: Twilio, 375 ms target (750 upper) |
| TTS time to first audio | 100 ms | vendor target: Twilio TTS TTFB 100 ms (250 upper); ElevenLabs "median latency of ~100ms" for Flash v2.5 / v4 Turbo |
| Speech-to-speech model first audio | 375 ms | modelled: no vendor publishes it; set equal to the LLM first-token budget so the comparison isolates the hand-offs |
| Tool round trip | 400 ms | modelled (Callwell booking lookup) |
| Reply length, LLM ms/token, TTS ms/token | 40, 20, 10 | modelled (non-streaming only) |
| Preemptive generation | on | vendor default: LiveKit field guide "Preemptive generation is enabled by default" |
| Target | 800 ms | practitioner: Kramer 2025 "aiming for 800ms median voice-to-voice latency (eventually)" |

Model: cascaded, streaming: ASR runs from the uplink (parallel to the wait); with preemptive
generation the LLM starts on the partial transcript at the uplink; TTS cannot start before the turn
is confirmed. Non-streaming: ASR starts after the wait, the whole reply is generated, then the whole
reply is synthesised. Speech-to-speech: the model responds after the wait (OpenAI `create_response`
fires on the VAD stop event), so it cannot overlap the wait; streaming and preemptive do not apply.
A tool call waits for the confirmed turn (never book on a guess), then the model runs again.

Canon ladder (python = node, 2026-11-08):

| Rung | Total | Largest stage on the critical path | vs 800 |
|---|---|---|---|
| defaults (cascaded, streaming, preemptive, T 500) | 800 ms | end-of-turn wait 500 | on target, 0 to spare |
| defaults + tool call (BREAK BUTTON) | 1,575 ms | end-of-turn wait 500 | 775 over |
| preemptive off | 1,175 ms | end-of-turn wait 500 | 375 over |
| preemptive off + tool call | 1,950 ms | end-of-turn wait 500 | over |
| streaming off | 2,725 ms | rest of the reply 800 | 1,925 over |
| threshold 200 (ANTI-LEVER) | 675 ms | LLM first token 375 | on target; false cut-ins 55.2 per 100 |
| threshold 300 | 675 ms | LLM first token 375 | same total as 200; false cut-ins 44.4 |
| threshold 800 | 1,100 ms | end-of-turn wait 800 | over; false cut-ins 14.2 |
| speech-to-speech | 1,075 ms | end-of-turn wait 500 | 275 over |
| speech-to-speech + tool call | 1,850 ms | end-of-turn wait 500 | over |
| speech-to-speech, threshold 200 | 775 ms | model first audio 375 | on target |

Lessons the ladder carries (each is a number the widget prints):
1. The vendor-default build lands exactly on 800 with nothing to spare; one tool call puts it 775
   over. Tool calls need a spoken acknowledgement or a faster path.
2. The wait, not the model, is the largest stage at defaults.
3. Below 375 ms the threshold stops buying latency (LLM is now on the critical path) while false
   cut-ins keep rising: 675 ms at both 300 and 200, cut-ins 44.4 then 55.2.
4. Streaming is worth 1,925 ms here: without it nothing overlaps.
5. Speech-to-speech removes hand-offs but cannot overlap the wait the way preemptive generation
   does in a cascade; with these (modelled) inputs the tuned cascade wins. Teach this as "depends
   on the inputs", never as a ranking: LiveKit rates realtime models "Fastest" in its table.

### WER widget (session 5): measured arithmetic on constructed transcripts

Normaliser: lower-case, keep a-z 0-9 apostrophe, everything else a space. Levenshtein alignment,
backtrace prefers match/substitution, then deletion, then insertion.

| Pair (constructed) | S | D | I | N | WER | booking right? |
|---|---|---|---|---|---|---|
| c1 Doctor Okafor -> "oak offer" | 1 | 0 | 1 | 12 | 16.7% | no (clinician) |
| c2 fourteenth -> fourth | 1 | 0 | 0 | 12 | 8.3% | no (date of birth) |
| c3 Riverside -> "river side" | 1 | 0 | 1 | 9 | 22.2% | yes |
| c4 "Tuesday." dropped | 0 | 1 | 0 | 4 | 25.0% | no (day) |
| c5 punctuation only | 0 | 0 | 0 | 7 | 0.0% | yes |
| c6 "Um" dropped | 0 | 1 | 0 | 12 | 8.3% | yes |
| overall | 7 errors / 56 words | | | | 12.5% | 3 of 6 broken |
| try box default: "fourteenth at nine thirty" -> "fourth" | 1 | 0 | 0 | 6 | 16.7% | |

The lesson: the highest-WER line (c3, 22.2%) books correctly; an 8.3% line (c2) breaks the
booking. Measure slot accuracy and task success next to WER.

## Verified facts by session (tiers in brackets)

### Session 1 - The voice pipeline
- OpenAI voice agents guide: speech-to-speech path "Use one model to interpret audio, decide what to
  do, and respond in speech"; chained path "when you want to inspect or transform text between speech
  recognition" and the reply [read at source, no page date].
- LiveKit pipeline types: cascaded "strings together three specialized models"; "For most production
  agents, a cascaded pipeline is the right default"; cascaded costs "Each stage adds latency" and
  "prosody and emotional cues in the user's speech don't reach the LLM"; realtime "consumes and
  produces speech directly, in a single model", "Lower end-to-end latency", but "Delayed transcripts",
  "Less provider flexibility", "Harder to audit"; hybrid = realtime model + separate TTS [read at source].
- Pipecat: a pipeline connects frame processors; frames carry data; SystemFrames are high priority and
  "interruptions do not discard them" [read at source].
- OpenAI Realtime audio formats: PCM 24 kHz mono; G.711 mu-law and A-law accepted [read at source].
- Twilio Media Streams: phone audio is always `audio/x-mulaw`, 8000 Hz, mono [read at source,
  dateModified 2026-10-30 / 2026-10-08].
- DeepLearning.AI "Building AI Voice Agents for Production": with LiveKit and RealAvatar, ElevenLabs
  supporting; instructors Russ d'Sa, Shayne Parmelee, Nedelina Teneva; 7 video lessons incl.
  "Optimizing Latency"; page "Updated Jul 17, 2026"; no latency figures on the page [read at source].
- Model names seen 2026-11-08 (dated, re-verify): gpt-realtime-2.1, gpt-realtime-2, gpt-realtime,
  gpt-realtime-2.1-mini; ElevenLabs Flash v2.5, Eleven v4 Turbo; Deepgram Nova-3, Flux.

### Session 2 - The latency waterfall (bench)
- Stivers et al. 2009 PNAS: 10 languages; overall mode 0 ms; median +100 ms; "The mean response offset
  for the full dataset is +208 ms"; Japanese fastest +7 ms, Danish slowest +469 ms; language means
  within about 250 ms of the cross-language mean; data are responses to polar questions [read at
  source, PMC].
- Levinson and Torreira 2015: gaps "of the order of 200 ms"; producing a single word takes "around
  600 ms and up", three words about 900 ms; so listeners must plan their reply while the other is
  still talking [read at source, partial].
- Twilio cascaded latency guide (Phil Bredeson, 2025-11-17): mouth-to-ear turn gap target 1,115 ms,
  upper 1,400; platform turn gap 885 / 1,100; STT 350/500, LLM TTFT 375/750, TTS TTFB 100/250;
  "starting benchmarks, not best-in-class" [vendor guidance, read at source].
- Kramer (GitHub "kwindla") gist, 2025-06-23: "aiming for 800ms median voice-to-voice latency
  (eventually)"; 1,500 ms acceptable for a proof of concept; budget network 200, turn detection +
  transcription 400, LLM 500, TTS 200, P50 [practitioner, read at source]. Affiliation not stated in
  the gist: say "Kwindla Hultman Kramer" without naming a company.
- LiveKit: "Voice conversations feel natural when end-to-end response latency stays under one second"
  [vendor, read at source].
- TEACH THE DISAGREEMENT: human gap ~200 ms (Stivers mean 208, mode 0); Kramer 800 ms; LiveKit under
  1,000; Twilio 1,115 mouth-to-ear. Kramer's own component budget sums to 1,300, Twilio's
  components plus hops to 885 platform. Nobody's components sum to the 800 headline: preemptive
  generation and overlap are how builds get there.
- "500 ms is the magic number": no primary source found; marketing blogs only. Attribute or cut.
- "Callers hang up after N seconds": no primary source found. Do not state it.
- OpenAI voice agents guide: "Measure how long callers wait for a useful spoken answer"; "compare the
  median and 95th percentile"; measure acknowledgements separately from the answer [read at source].
- LiveKit preemptive generation: "enabled by default"; starts the LLM "as soon as a partial transcript
  of the user's speech is available"; if the final transcript forces a regeneration, "latency will not
  be improved" [read at source, field guide 2026-04-13].

### Session 3 - Turn-taking
- OpenAI `server_vad` defaults: threshold 0.5, prefix_padding_ms 300, silence_duration_ms 500;
  `semantic_vad` eagerness low/medium/high max timeouts 8 s / 4 s / 2 s, `auto` = medium default;
  `interrupt_response` and `create_response` default true and "only used in speech-to-speech
  conversations"; barge-in cancels the response (`response.done` status `cancelled`);
  `conversation.item.truncate` with `audio_end_ms` removes the unplayed part so the context matches
  what the caller heard; WebRTC/SIP auto-truncate, WebSocket clients must do it themselves [read at
  source].
- LiveKit turns: five modes (turn detector model = default, realtime model, VAD only, STT endpointing,
  manual); fixed endpointing with min/max delay by default (JS: minDelay 500 ms, maxDelay 3,000 ms);
  interruption `min_duration` and `min_words`; false-interruption resume on by default [read at
  source]; Python defaults 0.5 / 3.0 s [reported, PR snippet]; false-interruption timeout 2.0 s seen
  only as an example [reported].
- Pipecat: Silero VADParams confidence 0.7, start_secs 0.2, stop_secs 0.2, min_volume 0.6; Smart Turn
  v3 is the default user turn stop strategy (since v0.0.102), runs locally on ONNX, 23 languages,
  inference "under 100ms" on low-cost CPU [vendor-reported]; SmartTurnParams stop_secs 3.0 fallback
  [read at source].
- Deepgram endpointing default 10 ms of silence to finalise a transcript (`speech_final`); a
  transcript endpoint, not a turn decision [vendor, read at source].
- Heldner and Edlund 2010 (J Phonetics 38): gap mode about 200 ms in all three corpora; overlaps about
  40% of between-speaker intervals; 70-82% of intervals under 500 ms; a 500 ms threshold catches
  51.1% / 47.5% of gaps and 59.6% / 56.0% of pauses (Swedish Map Task / HCRC Map Task); "turn-taking
  is generally less precise than is often claimed" [read at source, author PDF].
- Measured on our sample: see the canon table above.

### Session 4 - Images in the loop (input only, never generation)
- OpenAI images and vision: inputs by URL, base64 data URL or file ID; `detail` low / high /
  original / auto; low "does not always use fewer tokens than high"; limitations include small text,
  rotated text, non-Latin text, approximate counting and localisation, no file names or metadata;
  "not suitable for interpreting specialized medical images like CT scans" [read at source].
- OpenAI Structured Outputs: "ensures the model will always generate responses that adhere to your
  supplied JSON Schema"; JSON mode does not ensure schema adherence; a refusal "does not necessarily
  follow the schema"; incomplete output may not match. Schema adherence is about SHAPE, not whether a
  value was read correctly [read at source].
- Anthropic vision docs: max 8000x8000 px per image (stricter with more than 20 images; safe rule keep
  each side under 3,000 px or send 20 or fewer); 10 MB per image on the API; JPEG/PNG/GIF/WebP; cost
  in 28x28 px patches; "make sure it's legible and not too small"; heavy JPEG compression hurts text;
  label pages "Image 1:", "Image 2:"; base64 images are resent every turn, use the Files API in agent
  loops; may "hallucinate or make mistakes when interpreting low-quality, rotated, or very small images
  under 200 pixels"; not designed for diagnostic scans [read at source].
- OpenAI `gpt-realtime-2` and `gpt-realtime` "also support image input" (realtime conversations
  guide) [read at source, dated].
- OCR vs vision model: no single source compares them on referral letters; teach the trade-off as a
  design choice (OCR gives text plus per-word confidence and boxes; a vision model reads layout and
  meaning but gives no per-field confidence unless asked), labelled as practice, not a measured
  ranking.

### Session 5 - Evals for a conversation you cannot read
- WER = (S + D + I) / N, N = words in the reference; can exceed 100%; weights every error equally
  [Wikipedia, reference tier]; NIST sclite scores with equal weights by default [reported].
- Deepgram Nova-3 launch post (2025-02-12): median streaming WER 6.84% vs 14.92% for an unnamed
  competitor, on Deepgram's own test set [vendor-reported]; the post says 54.2% and 54.3% in two
  places.
- Sibling seam: learn-ai-media session 5 already teaches that vendor WER figures are not comparable
  across normalisers; link, do not reteach.
- OpenAI: median and 95th percentile latency; acknowledgements measured separately [read at source].
- LiveKit metrics named: e2e latency, time to first token, time to first byte [read at source].
- Simulated callers and judging audio vs transcripts: practice, no single primary source read;
  teach as design guidance and label the limits (a transcript judge cannot hear tone, talk-over or
  silence; an audio judge is newer and less calibrated).

### Session 6 - Shipping the call
- Twilio Media Streams bidirectional via `<Connect><Stream>`; payload base64 mu-law 8 kHz, no header
  bytes [read at source].
- Twilio tutorial (2025-08-29): Elastic SIP Trunk pointed at `sip:<project-id>@sip.api.openai.com;
  transport=tls`; a `realtime.call.incoming` webhook; the app must accept the call [vendor tutorial,
  read at source]. OpenAI's own SIP guide returned 404 on 2026-11-08 [gap].
- Recording consent (US, general, not legal advice): one-party consent is the federal floor; about
  11 states primarily require all-party consent; on cross-state calls assume the stricter law
  applies [RCFP guide, read at source, no page date].
- FCC 24-17 (adopted 2024-02-02, released 2024-02-08): AI-generated voices are "artificial or
  prerecorded voice" under the TCPA, so such calls need prior express consent absent an emergency or
  exemption. Governs OUTBOUND calls; Callwell answers inbound calls [read at source, PDF].
- HIPAA and audio: HHS page returned 403; secondary summaries say audio-only telehealth is allowed with
  reasonable safeguards and that the Security Rule does not apply to a plain landline, while VoIP and
  stored audio are electronic [reported]. On the page: say only that recorded or transcribed calls
  are data your privacy rules and contracts cover, and point to the regulator.
- Prices 2026-11-08 [vendor list prices, re-verify]: OpenAI gpt-realtime-2.1 audio $32 in / $64 out
  per 1M tokens (no per-minute figure published), gpt-realtime-2.1-mini $10 / $20; gpt-4o-transcribe
  $0.006 per minute (estimated), gpt-4o-mini-transcribe $0.003; gpt-4o-mini-tts audio output $12 per
  1M tokens; Deepgram Nova-3 streaming $0.0077 per minute, Aura-2 TTS $0.030 per 1k characters,
  bundled Voice Agent API $0.075 per minute. Do not convert token prices to per-minute without a
  sourced tokens-per-second figure.

## Seams (say each out loud with an absolute link; never reteach)

- Agent loop, tools, memory, guardrails: https://phoebefu6.github.io/learn-ai-agents-with-phoebe/courses/b1-agent-loop.html ,
  guardrails b7-guardrails.html, agent evals b8-agent-evals.html. We teach only what changes when the
  channel is speech or images.
- Eval basics, golden sets, LLM-as-judge: https://phoebefu6.github.io/learn-ai-evals-with-phoebe/courses/b2-golden-set.html
  and b5-llm-as-judge.html (session 5).
- Tracing and spans for per-stage timing: https://phoebefu6.github.io/learn-ai-observability-with-phoebe/courses/b4-cost-and-latency-per-span.html
  (sessions 2 and 5).
- Launch gates: https://phoebefu6.github.io/learn-agent-launch-with-phoebe/courses/b9-the-launch-gate.html (session 6).
- Image generation and media rights; vendor WER comparisons: https://phoebefu6.github.io/learn-ai-media-with-phoebe/courses/05-how-it-fails-measured.html
  and 04-captions-are-not-optional.html; https://phoebefu6.github.io/learn-ai-design-with-phoebe/ .
  We cover images as INPUT only.
- Estate grep 2026-11-08 for voice/speech/realtime: learn-langchain b1 mentions voice briefly;
  learn-agent-launch b3 uses "320 tokens x 10 ms" streaming arithmetic (consistent with our
  per-token model). No conflict found.

## Session titles (locked after sibling h1 grep, 2026-11-08)

1. The voice pipeline: cascaded or speech-to-speech - `courses/01-the-voice-pipeline.html`
2. The latency waterfall: where the second goes - `courses/02-the-latency-waterfall.html` (bench)
3. Turn-taking: when to speak, when to stop - `courses/03-turn-taking.html`
4. Images in the loop: reading what callers send - `courses/04-images-in-the-loop.html`
5. Evals for a conversation you cannot read - `courses/05-evals-you-cannot-read.html`
6. Shipping the call: phones, handoffs and consent - `courses/06-shipping-the-call.html`

## Not covered (honest list)

- Image, voice or video GENERATION, voice cloning and its rights (seam: learn-ai-media, learn-ai-design).
- Building a telephony stack: SIP signalling, codecs beyond naming G.711, carrier contracts.
- Legal advice of any kind; per-state consent law; HIPAA compliance programmes; any jurisdiction
  outside a general US description.
- Training or fine-tuning ASR/TTS models (seam: learn-fine-tuning-slm-with-phoebe).
- Measured latency of any named product: every latency number is a vendor target or a modelled
  input; measure your own with traces.
- Avatars and video agents (the DeepLearning.AI course touches them).
- Accessibility of voice interfaces for speech-impaired callers, beyond the handoff rule.
- Languages other than English for WER and turn detection (Pipecat Smart Turn claims 23 languages).

## Citation appendix (form used on pages)

- Anderson, A. et al. (1991). The HCRC Map Task Corpus. Language and Speech 34(4). Data: groups.inf.ed.ac.uk/maptask, CC BY 4.0 per the download page.
- Stivers, T. et al. (2009). Universals and cultural variation in turn-taking in conversation. PNAS 106(26). doi:10.1073/pnas.0903616106
- Levinson, S. C. and Torreira, F. (2015). Timing in turn-taking and its implications for processing models of language. Frontiers in Psychology 6:731.
- Heldner, M. and Edlund, J. (2010). Pauses, gaps and overlaps in conversations. Journal of Phonetics 38, 555-568.
- OpenAI (read 2026-11-08). Realtime API reference; Realtime VAD guide; Realtime conversations guide; Voice agents guide; Images and vision; Structured Outputs; API pricing. developers.openai.com
- LiveKit (read 2026-11-08). Agents docs: Turns; Pipeline types; EndpointingOptions reference. Field guide "Homepage agent latency" (2026-04-13).
- Pipecat (read 2026-11-08). SileroVADAnalyzer; Smart Turn overview; Pipeline guide. docs.pipecat.ai
- Twilio (2025-11-17). A Guide to Core Latency in AI Voice Agents (Cascaded Edition). Twilio (2025-08-29). OpenAI Realtime SIP connector with Elastic SIP Trunking. Twilio Media Streams docs (2026-10).
- Kramer, K. H. (2025-06-23). Advice on Voice AI (GitHub gist, kwindla).
- Deepgram (read 2026-11-08). Endpointing docs; Introducing Nova-3 (2025-02-12); Pricing.
- ElevenLabs (read 2026-11-08). Latency optimization.
- Anthropic (read 2026-11-08). Claude vision docs. platform.claude.com
- DeepLearning.AI (updated 2026-07-17). Building AI Voice Agents for Production (with LiveKit and RealAvatar).
- Reporters Committee for Freedom of the Press (read 2026-11-08). Reporter's Recording Guide, introduction.
- FCC (2024). Declaratory Ruling FCC 24-17, CG Docket No. 23-362.
- Wikipedia (read 2026-11-08). Word error rate (reference tier).
