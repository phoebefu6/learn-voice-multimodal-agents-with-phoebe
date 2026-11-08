# Research notes - Voice and Multimodal Agents

Compiled 2026-11-08. **Re-verify the changelog before delivery: every product, model name, price and latency figure is dated.**

Tiers: "read at source 2026-11-08" = the fact was read on the page named. "reported (secondary, via <url>)" = read elsewhere, not on the primary page. Vendor figures are vendor-reported, not independently measured.

## OpenAI - Realtime VAD guide

URL: https://developers.openai.com/api/docs/guides/realtime-vad (platform.openai.com/docs/guides/realtime-vad now 301-redirects here). Read at source 2026-11-08. No doc date shown.

- server_vad threshold is a 0-1 activation threshold. Quote: "Activation threshold (0 to 1)." The guide shows 0.5 in its example config but does NOT label it a default.
- prefix_padding_ms = audio kept before detected speech. Quote: "Amount of audio (in milliseconds) to include before the VAD detected speech." Example value 300, not labelled default.
- silence_duration_ms = silence needed to call speech stop. Quote: "Duration of silence (in milliseconds) to detect speech stop." Example value 500, not labelled default.
- semantic_vad eagerness default is auto = medium. Quote: "`auto` is the default value, and is equivalent to `medium`."
- eagerness low. Quote: "`low` will let the user take their time to speak."
- eagerness high. Quote: "`high` will chunk the audio as soon as possible."
- The guide says eagerness tunes the maximum wait timeout but gives NO numeric max wait times on this page.
- create_response / interrupt_response scope. Quote: "The `create_response` and `interrupt_response` fields are only used in speech-to-speech conversations."
- In transcription sessions VAD only chunks. Quote: "In transcription sessions, VAD only controls how audio is chunked."
- Caveat: defaults for server_vad must come from the API reference (see below).

## OpenAI - Voice agents guide

URL: https://developers.openai.com/api/docs/guides/voice-agents (redirected from platform.openai.com/docs/guides/voice-agents). Read at source 2026-11-08. No doc date shown.

- Speech-to-speech path = one model for audio understanding, reasoning and speech. Quote: "Use one model to interpret audio, decide what to do, and respond in speech."
- The realtime session owns turns, tools, interruptions. Quote: "The session handles audio turns, tools, interruptions, and handoffs."
- Chained path = STT, agent workflow, TTS managed by the app; chosen for inspectability. Quote: "Use the chained path when you want to inspect or transform text between speech recognition"
- Chained path lets you swap components. Quote: "Inspect or transform intermediate text and replace each component independently."
- Quote: "Use this path when each stage needs to be visible or replaceable."
- No explicit pros/cons list and no latency comparison between the two on this page.
- Model names on page: the chained code sample uses `gpt-6-astra` as the agent model; the page also refers to "GPT-Live" and "the Realtime API" without other model ids. (Re-verify: names are as shown on 2026-11-08.)
- Latency measurement advice, no numeric target. Quote: "Measure how long callers wait for a useful spoken answer."
- Quote: "compare the median and 95th percentile across similar calls."
- Quote: "Measure acknowledgments such as "I'm checking" separately from the answer the caller needs."

## OpenAI - Realtime API reference (client events, session.update turn_detection)

URL: https://developers.openai.com/api/reference/resources/realtime/client-events . Read at source 2026-11-08. No version date shown.

- turn_detection null turns detection off; client then triggers responses manually. Quote: "Configuration for turn detection, ether Server VAD or Semantic VAD." (typo "ether" is the doc's own)
- server_vad threshold DEFAULT 0.5. Quote: "Activation threshold for VAD (0.0 to 1.0), this defaults to 0.5."
- prefix_padding_ms DEFAULT 300 ms. Quote: "Amount of audio to include before the VAD detected speech (in milliseconds). Defaults to 300ms."
- silence_duration_ms DEFAULT 500 ms. Quote: "Duration of silence to detect speech stop (in milliseconds). Defaults to 500ms."
- interrupt_response default true. Quote: "Whether or not to automatically interrupt (cancel) any ongoing response with output to the default" (sentence truncated in extraction)
- create_response default true. Quote: "Whether or not to automatically generate a response when a VAD stop event occurs."
- idle_timeout_ms (server_vad only), range 5000 to 30000 ms, nullable, no default listed. Quote: "Optional timeout after which a model response will be triggered automatically."
- semantic_vad eagerness max timeouts. Quote: "`low`, `medium`, and `high` have max timeouts of 8s, 4s, and 2s respectively."
- eagerness default. Quote: "`auto` is the default and is equivalent to `medium`."
- conversation.item.truncate. Quote: "Send this event to truncate a previous assistant message's audio."
- Truncation also deletes the server-side transcript of the unplayed part. Quote: "Truncating audio will delete the server-side text transcript to ensure there" (sentence cut in extraction)
- Audio formats: audio/pcm (24 kHz only), audio/pcmu (G.711 mu-law), audio/pcma (G.711 A-law). Quote: "The PCM audio format. Only a 24kHz sample rate is supported."

## OpenAI - Realtime conversations guide

URL: https://developers.openai.com/api/docs/guides/realtime-conversations . Read at source 2026-11-08. No doc date shown.

- VAD on by default. Quote: "By default, Realtime sessions have **voice activity detection (VAD)** enabled."
- Interruptions need VAD. Quote: "Realtime API handles interruptions when VAD is enabled."
- Barge-in cancels the response. Quote: "When VAD interrupts an in-progress response, the server cancels it and sends `response.done` with `response.status` set to `cancelled`."
- Why truncate: keep context honest about what the user actually heard. Quote: "removing the unplayed portion of the model's last response from the conversation."
- Truncate carries played duration. Quote: "the audio content index, and that played duration as `audio_end_ms`."
- WebRTC / SIP auto-truncate; WebSocket clients must stop playback and send truncate themselves. Quote: "The server will automatically truncate unplayed audio when there's a user interruption."
- PCM is 24 kHz mono. Quote: "For PCM, use `{"type": "audio/pcm", "rate": 24000}` and send 24 kHz mono audio."
- Model names on page (2026-11-08): example "such as `gpt-realtime-2.1`"; image input note: "`gpt-realtime-2` and `gpt-realtime` also support image input."

## OpenAI - API pricing

URL tried first: https://openai.com/api/pricing/ - returned HTTP 403 to the fetcher. Used instead: https://developers.openai.com/api/docs/pricing . Read at source 2026-11-08. The realtime/audio sections show NO effective date; the page notes "Priority processing was renamed Fast mode on July 30, 2026" (use as a freshness marker only). Prices are per 1M tokens unless noted. Extracted as a table by the fetch tool; re-check the live page before quoting.

Realtime (speech-to-speech) models, audio tokens per 1M:
- gpt-realtime-2.1: audio input $32.00, cached input $0.40, audio output $64.00. Text $4.00 in / $24.00 out. Image input $5.00.
- gpt-realtime-2.1-mini: audio input $10.00, cached $0.30, output $20.00.
- gpt-realtime-2: audio $32.00 in / $64.00 out, cached $0.40.
- gpt-realtime-1.5: audio $32.00 in / $64.00 out, cached $0.40.
- gpt-realtime-mini: audio $10.00 in / $20.00 out, cached $0.30.
- gpt-realtime: audio $32.00 in / $64.00 out, cached $0.40. Text $4.00 / $16.00.
- Short quote: "gpt-realtime-2.1 | Audio | $32.00 | $64.00 | $0.40" (table row as extracted)

Cascaded building blocks on the same page:
- gpt-4o-mini-tts: audio output $12.00 per 1M tokens; text input $0.60.
- tts-1 $15.00 and tts-1-hd $30.00 per 1M characters.
- gpt-4o-transcribe $0.006 / minute (estimated); gpt-4o-mini-transcribe $0.003 / minute; gpt-transcribe $0.0045 / minute; Whisper $0.006 / minute.
- Live (streaming) transcription: gpt-live-transcribe $0.017 / minute; gpt-realtime-whisper $0.017 / minute. gpt-realtime-translate $0.034 / minute.
- GPT-Live sessions: gpt-live-1 listed at $0.05 per minute, billed per second, backend model and tool use charged separately.
- No per-minute figure is given for gpt-realtime-* audio; per-minute cost depends on tokens per second of audio, which this page does not state. Do not convert without a sourced tokens-per-minute figure.

## LiveKit Agents - Turns (turn detection and interruptions)

URL: https://docs.livekit.io/agents/build/turns/ . Read at source 2026-11-08 (page rendered 2026-11-08, no publication date). Note: current docs use a `turn_handling` config with renamed options (min_delay / max_delay / min_duration / min_words) rather than the older min_endpointing_delay etc.

- Five turn detection modes: turn detector model (default), realtime model, VAD only, STT endpointing, manual.
- Turn detector model = default, semantic + acoustic on top of VAD. Quote: "Predicts end of turn from both the meaning of speech and its acoustic properties, on top of VAD."
- Realtime model mode (`turn_detection="realtime_llm"`). Quote: "rely on its built-in server-side detection or pair it with the turn detector model."
- VAD only. Quote: "When you need minimal latency, or support for a spoken language the turn detector model doesn't cover."
- STT endpointing. Quote: "When you're already using an STT with its own turn detection (for example, AssemblyAI or Deepgram Flux)."
- Manual. Quote: "For push-to-talk or fully explicit control over turn boundaries."
- Endpointing: fixed by default, using min_delay and max_delay. Quote: "By default, the agent uses fixed endpointing and always uses the configured `min_delay` and `max_delay`." No numeric defaults on this page (see reference / source below).
- Disable interruptions. Quote: "To disable them for a whole session or agent, set `turn_handling.interruption.enabled` to `false`."
- min_duration. Quote: "Minimum duration of speech (in seconds) to register as an interruption."
- min_words. Quote: "Minimum number of words to be considered as an interruption."
- False interruption resume is on by default. Quote: "By default, the agent resumes speaking from where it left off after a false interruption." Example timeout shown 2.0 s (Python) / 2000 ms (Node), not labelled default.
- Preemptive generation only mentioned in passing. Quote: "Turn-taking is also affected by features that live in other parts of the agent pipeline (preemptive generation, background voice cancellation"

## LiveKit Agents - EndpointingOptions reference (agents-js)

URL: https://docs.livekit.io/reference/agents-js/interfaces/agents.voice.EndpointingOptions.html . Read at source 2026-11-08. No version shown on page.

- minDelay default 500 ms. Quote: "Minimum time in milliseconds since the last detected speech before the agent declares the user's turn complete."
- maxDelay default 3000 ms. Quote: "Maximum time in milliseconds the agent will wait before terminating the turn. In dynamic mode this is a fixed ceiling."
- mode default "fixed". Quote: ""fixed" uses a fixed delay, "dynamic" adjusts delay based on end-of-utterance prediction."
- alpha default 0.9 (EMA weight for dynamic mode).
- Reported (secondary, via search snippet of https://github.com/livekit/agents/pull/5243/files): Python `_ENDPOINTING_DEFAULTS` = mode fixed, min_delay 0.5, max_delay 3.0, alpha 0.9; top-level min_endpointing_delay / max_endpointing_delay are deprecated in favour of endpointing options. Not read at source.
- min_interruption_duration / min_duration default: NOT found at source.
- Reported (secondary, search snippet, LiveKit homepage-agent docs): "min_endpointing_delay = 0.2 (default: 0.5)" and "false_interruption_timeout = 1.0 (default: 2.0)". Not confirmed on the field guide page below.

## LiveKit - Field guide "homepage agent latency"

URL: https://livekit.com/field-guides/guide/homepage-agent-latency . Read at source 2026-11-08. Page dated 2026-04-13, author Darryn Campbell.

- Preemptive generation on by default. Quote: "Preemptive generation is enabled by default."
- What it does. Quote: "causes the LLM to start generating a response as soon as a partial transcript of the user's speech is available."
- Not a guaranteed win: if the reply must be regenerated after the final transcript, "latency will not be improved."
- No numeric latency targets or measured figures on this page; names metrics e2e_latency, time to first token, time to first byte.

## LiveKit Agents - overview

URL: https://docs.livekit.io/agents/ . Read at source 2026-11-08 (render timestamp only).

- Names the cascaded pipeline as a core job. Quote: "streaming audio through an STT-LLM-TTS pipeline"
- Lists realtime APIs among supported model types; no pipeline-vs-realtime tradeoff text and no latency numbers on this page. (Gap: a LiveKit page comparing the two was not read.)

## Pipecat - SileroVADAnalyzer

URL: https://docs.pipecat.ai/server/utilities/audio/silero-vad-analyzer . Read at source 2026-11-08. No page date.

- confidence default 0.7. Quote: "Confidence threshold for speech detection. Higher values make detection more strict. Must be between 0 and 1."
- start_secs default 0.2. Quote: "Time in seconds that speech must be detected before transitioning to SPEAKING state."
- stop_secs default 0.2. Quote: "Time in seconds of silence required before transitioning back to QUIET state."
- min_volume default 0.6. Quote: "Minimum audio volume threshold for speech detection. Must be between 0 and 1."
- This page does not mention Smart Turn.

## Pipecat - Smart Turn overview

URL: https://docs.pipecat.ai/server/utilities/turn-detection/smart-turn-overview . Read at source 2026-11-08. No page date; references Pipecat v0.0.102.

- Smart Turn = ML end-of-turn classifier. Quote: "uses a machine learning model to recognize natural conversational cues like intonation patterns and linguistic signals"
- Runs locally. Quote: "runs inference locally using ONNX."
- Languages. Quote: "The model supports 23 languages."
- Speed (vendor-reported). Quote: "inference can be performed on low-cost cloud instances in under 100ms."
- Default strategy since v0.0.102: TurnAnalyzerUserTurnStopStrategy with LocalSmartTurnAnalyzerV3 is "the **default** user turn stop strategy in Pipecat."
- SmartTurnParams.stop_secs default 3.0. Quote: "Duration of silence in seconds required before triggering a silence-based end of turn."
- pre_speech_ms default 500.0; max_duration_secs default 8.0. Quote: "Maximum allowed segment duration in seconds."
- Pair with short VAD stop_secs. Quote: "We recommend 0.2 seconds, which is the default value."
- Fallback: an "incomplete" turn still ends after stop_secs of silence. Quote: "the turn is automatically marked as complete."
- Teaching note: two different stop_secs exist (VAD 0.2 s vs Smart Turn 3.0 s).

## Pipecat - Pipeline guide

URL: https://docs.pipecat.ai/guides/learn/pipeline . Read at source 2026-11-08. No page date.

- Pipeline definition. Quote: "the core orchestration component in Pipecat that connects frame processors together"
- Frames. Quote: "data containers that carry information through your pipeline."
- Processors. Quote: "the workers in your pipeline."
- Direction: push_frame() can "Send frames upstream or downstream."
- SystemFrames are high priority and "interruptions do not discard them."; InterruptionFrame listed as "Interruption control."; UserStartedSpeakingFrame listed as a SystemFrame for speech detection events.
- No latency numbers on this page. BotStartedSpeakingFrame not on this page.

## DeepLearning.AI - Building AI Voice Agents for Production (short course)

URL: https://www.deeplearning.ai/short-courses/building-ai-voice-agents-for-production . Read at source 2026-11-08. Page shows "Updated Jul 17, 2026". Reported (secondary, search result for the course platform): original release 2025-05-07.

- Partners. Quote: "created in collaboration with LiveKit and RealAvatar"; ElevenLabs is "a supporting contributor to the project."
- Instructors: Russ d'Sa (Co-founder and CEO of LiveKit), Shayne Parmelee (Developer Advocate at LiveKit), Nedelina Teneva (Head of AI at RealAvatar).
- Format: intermediate, 7 video lessons, 2 code examples, 1 graded quiz. (Page says about 1 hour; search snippet listed "50 Minutes" - minor discrepancy, re-check.)
- Lessons: Introduction (3m); Voice Agent Overview (13m); End-to-end architecture Part 1 (12m); Part 2 (8m); Voice Agent Components (5m, code); Optimizing Latency (7m, code); Conclusion (1m); Quiz (10m).
- Learning outcomes include comparing modular pipelines with speech-to-speech APIs, WebRTC transport, VAD + end-of-turn detection, and measuring latency per stage.
- The course landing page states NO latency figures.
- Context: the course teaches the architecture behind the "Andrew Avatar" project (reported, secondary via search summary of the course page).

## Deepgram - Endpointing docs (vendor)

URL: https://developers.deepgram.com/docs/endpointing . Read at source 2026-11-08. No page date or version.

- What it is. Quote: "Endpointing helps to detects sufficiently long pauses that are likely to represent an endpoint in speech." (grammar is the doc's own)
- Default 10 ms. Quote: "Endpointing is enabled by default and set to 10 milliseconds."
- Configurable in ms. Quote: "This will wait until 500 milliseconds of silence has passed to finalize and return transcripts."
- endpointing=false disables it. On endpoint, "the JSON response is returned with a `speech_final` parameter set to `true`."
- UtteranceEnd needs interim_results=True and utterance_end_ms (example "1000"); behaviour not described on this page.
- Teaching note: 10 ms is a transcript-finalisation endpoint, not a turn-taking decision - an agent still needs a turn policy on top.

## Deepgram - Introducing Nova-3 (vendor blog)

URL: https://deepgram.com/learn/introducing-nova-3-speech-to-text-api . Read at source 2026-11-08. Posted February 12, 2025 (last modified April 15, 2025). All figures vendor-reported on Deepgram's own test set.

- Streaming WER. Quote: "Nova-3 boasts a median WER of 6.84% on real-time audio streams"
- vs unnamed competitor. Quote: "This marks a 54.2% improvement over the next-best competitor" with "a median WER of 14.92%". (The TL;DR says 54.3% - internal inconsistency on the page.)
- Batch WER. Quote: "Nova-3 achieves a median WER of 5.26%" ... "a 47.4% improvement over the next-best competitor with a WER of 10%."
- Latency: no millisecond figure. Quote: "comparable latency to Nova-2"
- Competitor not named in text.

## AssemblyAI - Universal-Streaming quickstart (vendor)

URL: https://www.assemblyai.com/docs/universal-streaming . Read at source 2026-11-08. No page date.

- No latency figure and no end-of-turn parameter defaults on this page (see turn detection page below if read).
- Turns. `end_of_turn: true` marks a finalized turn, emitted at natural pauses.
- Default audio. Quote: "mono 16-bit PCM by default; set `sample_rate` to match your source."
- Billing basis (no rate on page): streaming billed on how long the WebSocket stays open, not audio sent. Sessions auto-close after 3 hours.

## ElevenLabs - Latency optimization (vendor)

URL: https://elevenlabs.io/docs/developers/best-practices/latency-optimization . Read at source 2026-11-08. No calendar date on page. Models named: Eleven v4 Turbo, Flash v2.5 (`eleven_flash_v2_5`), Multilingual v2.

- Model latency (vendor-reported, excludes network). Quote: "with a median latency of ~100ms" (stated for Eleven v4 Turbo and Flash v2.5). The older "~75ms" Flash figure is NOT on this page as of 2026-11-08.
- Reported TTFB over WebSockets with Flash: 100-150 ms for North America, Europe, South East Asia; 150-200 ms for South Asia and North East Asia.
- Four principles. Quote: "Use Flash models," "Leverage streaming," "Consider geographic proximity," and "Choose appropriate voices."
- Output format matters. Quote: "Higher audio quality output formats can increase latency."
- Professional Voice Clones are slower than default, synthetic and Instant Voice Clones.

## Stivers et al. 2009, PNAS - Universals and cultural variation in turn-taking in conversation

URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC2705608/ (doi 10.1073/pnas.0903616106). Read at source 2026-11-08 (PMC full text). Published 2009 (PNAS 106(26)).

- 10 languages. Quote: "Using a worldwide sample of 10 languages drawn from traditional indigenous communities to major world languages"
- Universal: avoid overlap, minimise silence. Quote: "all of the languages tested provide clear evidence for a general avoidance of overlapping talk"
- Overall mode 0 ms. Quote: "an overall mode of 0 ms"
- Median +100 ms. Quote: "overall cross-linguistic median +100 ms"
- Mean +208 ms. Quote: "The mean response offset for the full dataset is +208 ms"
- Fastest / slowest languages. Quote: "Danish has the slowest response time on average (+469 ms) and Japanese has the fastest (+7 ms)."
- Spread. Quote: "the language-specific means fall within ≈250 ms either side of this cross-language mean"
- Method: question-response pairs. Quote: "Each contributor identified 350 consecutive questions across 5-17 separate interactions." Total pairs analysed not stated in main text (may be in SI table S4).
- Teaching note: data are polar-question responses in face-to-face/video conversation, not all turn types.

## Levinson and Torreira 2015, Frontiers in Psychology - Timing in turn-taking and its implications for processing models of language

URL: https://www.frontiersin.org/articles/10.3389/fpsyg.2015.00731/full . Read at source 2026-11-08 (first ~100k of 167k characters read). Published 2015.

- Gap ~200 ms. Quote: "the gaps between turns are short (of the order of 200 ms)."
- Quote (Introduction): "the gaps between turns average around 200 ms."
- Word production latency. Quote: "the language production system has latencies of around 600 ms and up for encoding a new word."
- Multiword. Quote: "900 ms is required for three word utterances."
- Scene description (specific task, not sentences in general). Quote: "it takes about 1500 ms before speech output begins," (pictured scenes such as "boy kicking ball")
- Implication (framed as inference by the authors). Quote: "participants planning to respond are already encoding their responses while the incoming turn from the other speaker is still unfinished."
- Teaching note: humans hit ~200 ms only by predicting the end of the other turn and planning in parallel - the analogue of preemptive generation.

## Heldner and Edlund 2010, Journal of Phonetics - Pauses, gaps and overlaps in conversations

URL read: https://staff.fnwi.uva.nl/r.fernandezrovira/teaching/cosp/cosp2016/docs/HeldnerEdlund2010.pdf (author PDF hosted on a UvA course page; journal version doi 10.1016/j.wocn.2010.08.002, J Phonetics 38 (2010) 555-568). Read at source 2026-11-08 (PDF text extracted).

- Terms: pause = silence within one speaker; gap / overlap = interval at a speaker change.
- Headline. Quote: "It is shown that turn-taking is generally less precise than is often claimed"
- Mode of the gap distribution ~200 ms. Quote: "The mode of the distribution function was offset from zero by about 200 ms in the histograms for all three corpora"
- Overlaps are common. Quote: "The overlaps represented about 40% of all between- speaker intervals in our material."
- Short intervals dominate. Quote: "70-82% of all between-speaker intervals (i.e. gaps and overlaps) were shorter than 500 ms" and "82-95% of all intervals were shorter than 1000 ms."
- Direct speech-tech implication. Quote: "a speech technology application using a 500 ms acoustic silence threshold would have captured only 18-30%" (and a 1000 ms threshold only 5-18%) of between-speaker intervals.
- Silence thresholds cannot separate pauses from gaps: a 500 ms threshold "captured 51.1% and 47.5% of all gaps, but also 59.6% and 56.0% of all pauses" (Swedish Map Task and HCRC Map Task corpora).
- Reaction is viable for a large minority. Quote: "about 40% of all between-speaker intervals in genuine conversa- tions are long enough for the next speaker to react"
- Minimal vocal reaction time cited as ~200 ms. Quote: "the fastest a human can react to some stimulus with a vocal response under maximally favorable conditions is about 200 ms"
- Teaching note: this is the empirical case for semantic / model-based turn detection over a fixed silence timer - silence length alone cannot tell "thinking pause" from "done talking".

## Word error rate - Wikipedia (reference tier)

URL: https://en.wikipedia.org/wiki/Word_error_rate . Read at source 2026-11-08. Tier: reference (Wikipedia).

- Formula: WER = (S + D + I) / N, with N = S + D + C (formula markup garbled in extraction; reconstructed from the defined terms below).
- Definitions. Quote: "S is the number of substitutions," "D is the number of deletions," "I is the number of insertions,"
- N. Quote: "N is the number of words in the reference (N=S+D+C)"
- Can exceed 100%. Quote: "the word error rate can be larger than 1.0," (when insertions are many)
- Limitation: equal weighting of all errors; and the formula "cannot distinguish a substitution error from a combined deletion plus insertion error,"
- Limitation: lower WER does not guarantee better understanding (Wikipedia attributes this to a Microsoft Research study; secondary).

## NIST SCTK sclite docs (standard scorer)

URL: https://raw.githubusercontent.com/usnistgov/SCTK/master/doc/sclite.htm - NOT fetched directly; reported (secondary, via web search summary). Re-read before citing.
- sclite aligns hypothesis to reference and reports errors. Quote (as returned by search): "The program sclite is a tool for scoring and evaluating the output of speech recognition systems."
- Default scoring treats every word error equally. Quote (search): "The default scoring method computes scores treating word errors with equal weight."
- Reported (secondary, NIST TREC slide https://trec.nist.gov/pubs/trec9/sdrt9_slides/tsld017.htm): WER = insertions + deletions + substitutions over total reference words.

## Latency targets - who says what (vendor and practitioner guidance)

### Twilio - A Guide to Core Latency in AI Voice Agents (Cascaded Edition)
URL: https://www.twilio.com/en-us/blog/developers/best-practices/guide-core-latency-ai-voice-agents . Read at source 2026-11-08. Dated November 17, 2025; author Phil Bredeson (reviewed by Jungsuk Kim, Paul Kamp). Vendor guidance.
- Mouth-to-ear turn gap (median): target 1,115 ms, upper limit 1,400 ms.
- Platform turn gap (excludes internet/PSTN transit): target 885 ms, upper limit 1,100 ms.
- Component budget (target / upper limit): STT 350 / 500 ms; LLM time-to-first-token 375 / 750 ms; TTS time-to-first-byte 100 / 250 ms.
- Diagram caption: device to media edge ~40 ms, buffering ~30 ms, decoding ~25 ms, service hops ~10 ms each.
- Framing. Quote: "starting benchmarks, not best-in-class."
- Quote: "Humans have a deeply ingrained aversion to pauses in conversation."
- No statement about callers hanging up.

### Kwindla Hultman Kramer (GitHub user "kwindla") - Advice on Voice AI, June 2025 (gist)
URL: https://gist.github.com/kwindla/f755284ef2b14730e1075c2ac803edcf . Read at source 2026-11-08. Created June 23, 2025. Practitioner guidance; the gist itself does not state the author's affiliation (widely known as Daily / Pipecat - confirm before naming the company on the page).
- 800 ms target. Quote: "A good rule of thump is that you should be aiming for 800ms median voice-to-voice latency (eventually)." ("thump" is the author's typo)
- Proof-of-concept looser target. Quote: "It's okay to start with a looser target (1,500ms in initial proof of concept, for example)."
- Budget: network 200 ms ("if you use WebRTC, worse with WebSockets"); turn detection and transcription 400 ms; LLM 500 ms; TTS 200 ms.
- Quote: "The above are P50 numbers for the best hosted services today."

### Other numbers seen (NOT primary, do not cite as fact)
- Search results surfaced marketing blogs (rayvoc, hamming.ai, futureagi, simbavoice, raftlabs, AWS Builder Center "The 800ms rule") with sub-500 ms and 800 ms claims and an uncited "support deflection rate drops 20-30% when latency exceeds 800ms". Not read at source; no primary data.
- OpenAI voice-agents guide and LiveKit field guide give NO numeric target (see above).

### "Callers hang up after N seconds"
- No primary source found (search for a sourced hang-up threshold returned none; Twilio guide explicitly makes no such claim).

## Telephony - Twilio Media Streams overview

URL: https://www.twilio.com/docs/voice/media-streams . Read at source 2026-11-08. dateModified 2026-10-30.

- What it does. Quote: "Use Twilio Media Streams to stream raw audio from live phone calls over WebSockets to your application in near real-time."
- Two-way. Quote: "With a bidirectional stream, your application can also send audio back into the call." Bidirectional streams start with `<Connect><Stream>`.

## Telephony - Twilio Media Streams WebSocket messages

URL: https://www.twilio.com/docs/voice/media-streams/websocket-messages . Read at source 2026-11-08. dateModified 2026-10-08.

- Phone audio is 8 kHz mu-law mono. Quotes on mediaFormat: encoding "Value is always `audio/x-mulaw`."; sampleRate "Value is always `8000`,"; channels "Value is always `1`,"
- Outbound to Twilio. Quote: "The payload must be encoded `audio/x-mulaw` with a sample rate of `8000` and must be base64 encoded."
- Quote: "The `media.payload` should not contain audio file type header bytes."
- Teaching note: G.711 mu-law at 8 kHz is the phone-call format; the OpenAI Realtime API accepts it natively as `audio/pcmu` (see API reference above), otherwise PCM must be resampled to 24 kHz.

## Telephony - OpenAI Realtime SIP

- Official guide URL https://developers.openai.com/api/docs/guides/realtime-sip returned HTTP 404 to the fetcher on 2026-11-08 (also /index.html). Not read at source.
- Reported (secondary, via web search summary of the official guide): a SIP trunking provider converts the phone call to IP traffic and is pointed at OpenAI's SIP endpoint; the app gets a `realtime.call.incoming` webhook and uses REST endpoints to accept, reject, refer (transfer) or hang up.

## Telephony - Twilio tutorial: Connect the OpenAI Realtime SIP Connector with Twilio Elastic SIP Trunking

URL: https://www.twilio.com/en-us/blog/developers/tutorials/product/openai-realtime-api-elastic-sip-trunking . Read at source 2026-11-08. Dated August 29, 2025. Vendor tutorial.

- Trunk role. Quote: "To forward calls to OpenAI via SIP, you'll need to create a SIP Trunk."
- OpenAI SIP URI. Quote: "Set the URI to: `sip: project-id@sip.api.openai.com;transport=tls`" (spacing as shown)
- Webhook. Quote: "First we will define a webhook in your project that will fire on a `realtime.call.incoming` event type."
- Must accept. Quote: "When the endpoint is invoked, the first thing you have to do is respond and say you are accepting the call:"

## Recording consent (US, general) - Reporters Committee for Freedom of the Press, Reporter's Recording Guide intro

URL: https://www.rcfp.org/introduction-to-reporters-recording-guide/ . Read at source 2026-11-08. No page date shown. General journalism reference, not legal advice; state laws change.

- One-party. Quote: "Under a one-party consent requirement, you can record a conversation if you are a party to that conversation."
- All-party. Quote: "These laws require consent of all parties involved in a conversation before it can be recorded."
- Federal floor. Quote: "one-party consent is the minimum requirement for these conversations across the country."
- Count. Quote: "About 11 states primarily have all-party consent requirements for recording." Listed: California, Delaware, Florida, Illinois, Maryland, Massachusetts, Michigan (at least for third-party recordings), Montana, New Hampshire, Pennsylvania, Washington.
- Cross-state calls. Quote: "[J]ournalists should err on the side of caution and assume that the stricter state law will apply."
- (Index page https://www.rcfp.org/reporters-recording-guide/ links the 50-state guides; it carries no consent text itself.)

## FCC 24-17 - AI-generated voices are "artificial" under the TCPA

URL: https://docs.fcc.gov/public/attachments/FCC-24-17A1.pdf . Read at source 2026-11-08 (PDF text extracted). The FCC news page https://www.fcc.gov/document/fcc-makes-ai-generated-voices-robocalls-illegal returned HTTP 403.

- Declaratory Ruling FCC 24-17, CG Docket No. 23-362. Quote: "Adopted: February 2, 2024 Released: February 8, 2024"
- Core holding. Quote: "the TCPA's restrictions on the use of "artificial or prerecorded voice" encompass current AI technologies that generate human voices."
- Consequence. Quote: "therefore require the prior express consent of the called party to initiate such calls absent an emergency purpose or exemption."
- The TCPA itself does not define the term. Quote: "The TCPA does not define the terms "artificial" or "prerecorded voice.""
- Reported (secondary, law-firm notes e.g. https://wsgr.com/en/insights/fcc-rules-ai-generated-voices-are-artificial-under-the-tcpa.html): the ruling gives state attorneys general a further enforcement tool; it followed AI-voice robocalls to New Hampshire voters imitating President Biden.
- Scope note for the course: this governs outbound calls using an AI voice (robocalls), not inbound customer-service agents answering calls the customer placed.

## HIPAA and voice - HHS OCR audio-only telehealth guidance

- HHS page https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/hipaa-audio-telehealth/index.html returned HTTP 403 to the fetcher on 2026-11-08. Not read at source.
- Reported (secondary, via web search summary quoting the HHS page): audio-only telehealth is permitted "so long as the covered entity applies reasonable safeguards to limit incidental use or disclosure of protected health information".
- Reported (secondary, same): "If a covered entity uses a standard telephone line (i.e., a landline), the HIPAA Security Rule will not apply because the PHI transmitted is not electronic in nature." By implication, VoIP / app / recorded or transcribed audio is electronic PHI and falls under the Security Rule (secondary NFP summary says so explicitly - verify on the HHS page).
- HHS press release (2022-06-13) URL from search: https://www.hhs.gov/about/news/2022/06/13/hhs-issues-guidance-hipaa-audio-telehealth.html - not fetched.

## OpenAI - Images and vision guide

URL: https://developers.openai.com/api/docs/guides/images-vision . Read at source 2026-11-08. No page date.

- Three input methods: "By providing a fully qualified URL to an image file", "By providing an image as a Base64-encoded data URL", "By providing a file ID (created with the Files API)".
- detail defaults to auto; values low / high / original / auto (support varies by model).
- low. Quote: "Coarse image understanding." Caveat quote: "`low` does not always use fewer tokens than `high`."
- high. Quote: "Standard high-fidelity image understanding when precise original-image coordinates are not required."
- original. Quote: "Large, dense, spatially sensitive, or computer-use images, when supported by the model." (not supported by e.g. gpt-5.2, gpt-4.1-mini per the page)
- Token cost example (patch-based model gpt-6-astra, multiplier 1.2): a 1024 x 1024 image at high costs 1,229 tokens.
- Limits: "Up to 512 MB total payload per request"; "Up to 1,500 images per request"; up to 30,000 patches per image (over-limit images are rejected, not resized); PNG, JPEG, WEBP, non-animated GIF.
- Limitations (document-reading relevant): small text should be enlarged (or use `original`); rotated text may be misread; non-Latin text may degrade; graphs with varying line style/colour are hard; counting is approximate; precise localisation is weak ("identifying chess positions"); no access to file names or metadata.
- Medical. Quote: "The model is not suitable for interpreting specialized medical images like CT scans."

## OpenAI - Structured Outputs guide

URL: https://developers.openai.com/api/docs/guides/structured-outputs . Read at source 2026-11-08 (first 100k of 145k characters). No page date.

- Guarantee is about SHAPE. Quote: "ensures the model will always generate responses that adhere to your supplied JSON Schema."
- vs JSON mode. Quote: "only Structured Outputs ensure schema adherence." JSON mode gives valid JSON but not schema adherence.
- Enabled with `"strict": true` in a json_schema format.
- Schema subset. Quote: "some features are unavailable either for performance or technical reasons."
- Refusals break the shape. Quote: "a refusal does not necessarily follow the schema you have supplied." (returned in a `refusal` field)
- Incomplete output (e.g. max tokens) also may not match: "the model might not generate a valid response that matches the provided JSON schema."
- Teaching note: schema adherence does not mean the extracted VALUES are correct - a misread invoice total still fits the schema. The page does not claim value accuracy.

## Anthropic - Claude Vision docs

URL: https://platform.claude.com/docs/en/build-with-claude/vision (docs.claude.com redirects here). Read at source 2026-11-08. No page date; status "stable"; supported-model list on the page includes claude-opus-5-5, claude-sonnet-5-5, claude-haiku-5-5, claude-haiku-4-5-20251001 and others.

- Images per request: 20 per message on claude.ai; 100 per API request for 200k-context models; 600 for all other models.
- Max dimensions. Quote: "The maximum dimensions for each image are 8000x8000 px." With more than 20 images, a stricter per-image limit applies; safe rule quoted: "resize each image so that neither dimension exceeds 3,000 px, or keep the request to 20 or fewer image and document blocks."
- Size: 10 MB per image (base64) on the Claude API; 5 MB on Amazon Bedrock; overall request limit 128 MB on the first-party API.
- Formats: JPEG, PNG, GIF, WebP; animations use the first frame only.
- Token cost formula (current page, replaces the older width*height/750 rule). Quote: "Each patch is a 28x28-pixel block of the image, referred to as a visual token." Cost = ceil(width/28) x ceil(height/28).
- Resolution tiers: high-resolution (Claude 4.7 and later) long edge 2,576 px / 4,784 visual tokens; standard (other models) 1,568 px / 1,568 tokens. Example: 1000x1000 px = 1,296 tokens.
- Dense documents. Quote: "High-resolution images can use up to roughly three times more visual tokens than the same image on a standard-tier model."
- Document tip. Quote: "If the image contains important text, make sure it's legible and not too small."
- Compression warning. Quote: "heavy JPEG compression can make text difficult to read."
- Multi-page tip: label images "Image 1:", "Image 2:" when sending pages of a document.
- Agent loops: base64 images are resent every turn; use the Files API `file_id` to keep payloads small.
- Limitations. Quote: "Claude might hallucinate or make mistakes when interpreting low-quality, rotated, or very small images under 200 pixels."
- Quote: "Claude's coordinate and localization outputs are approximate." Counting is approximate. Cannot name people. Cannot detect AI-generated images. Not designed to interpret complex diagnostic scans such as CTs or MRIs.

## Deepgram - Pricing (cascaded vendor, per minute)

URL: https://deepgram.com/pricing . Read at source 2026-11-08. No effective date on page (a Flux TTS credit promo runs "through Dec. 31, 2026", a freshness marker only). Pay-as-you-go, vendor list prices.

- Nova-3 streaming STT monolingual. Quote: "$0.0077 / min"; multilingual "$0.0092 / min".
- Flux STT streaming: English "$0.0077 / min"; multilingual "$0.0078 / min".
- Aura-2 TTS "$0.030 /1k characters"; Aura-1 TTS "$0.0150 /1k characters".
- Bundled Voice Agent API (STT + LLM orchestration + TTS), Standard. Quote: "$0.075 / min"
- Compare with OpenAI (same date): gpt-live-1 sessions $0.05 per minute (backend model extra); gpt-realtime-2.1 audio $32 / $64 per 1M input/output tokens (no per-minute conversion published on the pricing page).

## LiveKit Agents - Pipeline types (cascaded vs realtime vs hybrid)

URL: https://docs.livekit.io/agents/models/pipelines/ . Read at source 2026-11-08. No page date.

- Cascaded definition. Quote: "A cascaded pipeline, also called an STT-LLM-TTS or sequential pipeline, strings together three specialized models."
- LiveKit's default recommendation. Quote: "For most production agents, a cascaded pipeline is the right default."
- Cascaded cost 1. Quote: "Higher total latency: Each stage adds latency."
- Cascaded cost 2. Quote: "Loss of vocal nuance: Because STT produces text, prosody and emotional cues in the user's speech don't reach the LLM."
- Realtime definition. Quote: "A realtime model consumes and produces speech directly, in a single model."
- Realtime gain. Quote: "Lower end-to-end latency: Combining stages into one model removes the inter-stage hand-offs."
- Realtime costs. Quotes: "Delayed transcripts: Realtime models don't produce interim transcripts." / "Less provider flexibility: You're committed to a single provider's model for the full speech-to-speech path." / "Harder to audit: Without a text trail at every stage, debugging and compliance review take more work."
- Hybrid. Quote: "To keep realtime speech understanding and add scripted speech, pair a realtime model with a separate TTS in a realtime hybrid architecture."
- Latency target stated by LiveKit. Quote: "Voice conversations feel natural when end-to-end response latency stays under one second."
- Comparison table rates end-to-end latency "Moderate" (cascaded) vs "Fastest" (both realtime types).
- (Overview page https://docs.livekit.io/agents/models/ only names the two options and links here.)

## Gaps

What could not be read at source on 2026-11-08, and what to do before publishing:

- openai.com/api/pricing returned 403; prices were read on developers.openai.com/api/docs/pricing instead, which shows no effective date for the audio sections.
- No OpenAI page gives a per-minute cost for gpt-realtime-* audio (tokens only). Do not convert to per-minute without a sourced tokens-per-second figure.
- OpenAI Realtime SIP guide (developers.openai.com/api/docs/guides/realtime-sip) returned 404. SIP flow is covered only by the Twilio tutorial (read) and a search summary (secondary).
- The OpenAI VAD guide gives no server_vad defaults; the defaults (0.5 / 300 ms / 500 ms) and eagerness max timeouts (8 s / 4 s / 2 s) come from the API reference page.
- LiveKit: no numeric default found at source for min_interruption_duration (now `min_duration`) or for the false-interruption timeout (2.0 s seen only as an example, and as "default: 2.0" in a search snippet). The Python endpointing defaults (0.5 s / 3.0 s) are secondary (PR snippet); the JS reference (500 ms / 3000 ms) was read at source.
- Pipecat: BotStartedSpeakingFrame / BotStoppedSpeakingFrame and detailed interruption docs were not read; no Pipecat latency figure was found.
- AssemblyAI turn detection page (/docs/universal-streaming/turn-detection) returned 404; no AssemblyAI latency or end-of-turn defaults were recorded.
- Deepgram Nova-3: no millisecond latency figure on the launch post (only "comparable latency to Nova-2"). Flux docs not read.
- ElevenLabs: the older "~75ms" Flash figure is not on the current page; only "~100ms" median was read. Cartesia Sonic not checked.
- Heldner and Edlund 2010 was read from an author PDF on a university course page, not the Elsevier version (same text expected).
- Levinson and Torreira 2015: last ~67k characters of the article not read.
- Stivers et al. 2009: total number of question-response pairs not in the main text (supplementary table S4 not read).
- FCC news release page returned 403; the ruling PDF itself was read.
- HHS HIPAA audio-only telehealth guidance returned 403; HIPAA lines are secondary (search summary). Read the HHS page before using any HIPAA line.
- NIST sclite docs not fetched directly (secondary via search). Wikipedia WER read at source (reference tier).
- RCFP: no page date shown; state consent rules change, re-check per state before quoting.
- "Callers hang up after N seconds": no primary source found.
- Model names seen on 2026-11-08 (gpt-realtime-2.1, gpt-realtime-2, gpt-realtime, gpt-live-1, gpt-6-astra, GPT-Live, Eleven v4 Turbo, Flash v2.5, Nova-3, Flux) change often; re-verify the changelog before delivery.
