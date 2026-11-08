<!-- learn-with-phoebe hub banner -->
> ### 📚 Part of [**Learn with Phoebe**](https://phoebefu6.github.io/learn-with-phoebe/)
> The shelf of 189 free, hands-on courses on AI, data, and the craft around them. **[Browse every course ↗](https://phoebefu6.github.io/learn-with-phoebe/)**
<!-- /learn-with-phoebe hub banner -->

# Learn Voice and Multimodal Agents with Phoebe

Speech in, speech out, and images in the loop: latency, turn-taking, evals for a conversation you
cannot read. Six 45-minute sessions for builders who have shipped a text agent and now need it to
listen, talk, or read a photo. By Phoebe Fu.

Site: https://phoebefu6.github.io/learn-voice-multimodal-agents-with-phoebe/

## Sessions

1. The voice pipeline: cascaded or speech-to-speech
2. The latency waterfall: where the second goes (the bench)
3. Turn-taking: when to speak, when to stop
4. Images in the loop: reading what callers send
5. Evals for a conversation you cannot read
6. Shipping the call: phones, handoffs and consent

The running case, the Callwell clinic booking line, is constructed for teaching.

## The bench

`assets/vox-live.js` computes a latency waterfall in the browser from dated vendor targets and
labelled modelled inputs, and measures the false cut-in cost of a silence threshold on real pause and
gap durations from 24 no-eye-contact dialogues of the HCRC Map Task Corpus
(groups.inf.ed.ac.uk/maptask; CC BY 4.0 per its download page; Anderson et al. 1991). Only derived
silence durations are shipped (`assets/vox-sample.js`), no audio and no words.

Every product name, default, latency figure and price is dated 2026-11-08. Re-verify before relying
on any of them.

## Reproduce the numbers

```bash
python3 materials/vox_reference.py .        # Python reference canon
node materials/vox-node.js .                # the browser engine, run in node
python3 materials/compare-ladder.py .       # compares the two by value
```

Rebuilding the sample needs the corpus annotations zip (hcrcmaptask.nxtformatv2-1.zip):
`python3 materials/build-vox-sample.py <unzipped maptaskv2-1 dir> .`
