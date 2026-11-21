# Storytelling and script writing

## Workflow
1. Read `production/scripts/<slug>/STYLE-BRIEF.md` - the word budget, hook length and the hook/ending
   patterns learned from the references (frequent ones are rules, occasional ones are options).
2. Research. Use authoritative sources (NASA/ESA, journals, universities, museums, encyclopedias).
   Cross-check numbers. If two sources disagree, use the cautious wording ("about", "no confirmed
   explanation") or drop the claim. Never invent a statistic.
3. Find the angle: one surprising, concrete through-line (e.g. "three real observations nobody can explain").
4. Write `script.json`, validate with `studio script <slug>`, show the user, iterate until approved.

## Structure that works for Shorts
- **Hook (beat 1, role `hook`)** - one sentence, said within the learned hook time (default 3.5 s,
  roughly 10 words). Lead with the most surprising concrete fact. Patterns the analyser recognises:
  question, number/statistic, direct address ("you"), superlative, curiosity gap, contrarian/negation,
  imperative/scene-setting ("Imagine..."). Prefer what the profile marks as frequent.
- **Body beats** - 1-2 short sentences each (aim for the learned words-per-sentence). Every beat adds one
  new fact or escalation and hands off to the next ("Then...", "But...", "And..."). Keep information
  density high, no restating.
- **Ending (last beat, role `ending`)** - land a payoff: reveal/twist, a question to the viewer, or a line
  that loops back to the opening (a loop makes replays seamless). A call to action only if the
  references use one frequently.
- Never pad to reach a duration. Shorter and complete beats longer and thin.

## Language rules
- Conversational, concrete, active voice. Numbers as spoken words where TTS might stumble
  ("seventy-two" or "72" both work; years as digits).
- No filler: "in this video", "let's dive in", "without further ado", "make sure to subscribe",
  "basically", "hey guys", "today we're going to", "stay tuned".
- Original wording only. The validator flags any 6-word sequence that also appears in a reference
  transcript - reword those.
- Unusual names get a `pronunciations` entry (spoken respelling) - captions still show the real word.

## Visual planning per beat
- `visual.type`:
  - `footage` - stock video. `query` = 2-5 concrete, searchable nouns ("radio telescope dish night").
  - `image` - still photo/illustration (NASA, Wikimedia, Pexels photos); animated with zoom/pan.
  - `generated` - procedural, original: `starfield`, `planet`, `gradient_flow`, `particles`, `grid`,
    `waves`, `text_card` (needs `on_screen_text`, short: 1-3 words such as "72 SECONDS").
- `extra_shots`: more visuals for long beats. Plan about one shot per learned shot length
  (`STYLE-BRIEF.md` gives cuts per sentence).
- `description`: what the viewer should see - used for placeholders and AI image prompts.
- Text cards are placed in the upper third so they never collide with the captions.

## `script.json` schema

```json
{
  "title": "3 Space Mysteries Nobody Has Solved",
  "topic": "The most mysterious discoveries in space",
  "angle": "Real, unexplained observations",
  "target_duration_s": 40,
  "music_mood": "mysterious",            // mysterious | epic | upbeat | tense | calm | inspiring
  "beats": [
    {
      "id": 1,
      "role": "hook",                     // hook | body | ending
      "text": "This 72-second signal from space still has no confirmed explanation.",
      "visual": {"type": "footage", "query": "radio telescope", "description": "a radio telescope dish",
                 "generator": "", "on_screen_text": ""},
      "extra_shots": [
        {"type": "generated", "query": "", "description": "seventy-two seconds",
         "generator": "text_card", "on_screen_text": "72 SECONDS"}
      ],
      "emphasis": ["72-second"],         // words highlighted in captions (must appear in text)
      "sfx": "impact"                     // auto | none | whoosh | impact | riser | pop | ding
    }
  ],
  "sources": [{"claim": "The Wow! signal lasted 72 seconds", "source": "https://..."}],
  "pronunciations": [{"word": "Oumuamua", "say_as": "oh moo ah moo ah"}],
  "notes": ""
}
```

(JSON does not allow comments - they are here for explanation only.)

All fields are required by the API generator; for hand-written scripts the loader fills defaults for
`angle`, `music_mood`, `sources`, `pronunciations`, `notes`, `extra_shots`, `emphasis`, `sfx`.

## Validation messages
| Message | Meaning / fix |
|---|---|
| hook takes ~Xs to say | shorten the first sentence |
| estimated Xs is much longer than the target | cut beats or sentences |
| N factual-sounding sentence(s) but no sources | add `sources` entries |
| originality: '...' also appears in reference | reword |
| filler phrase | delete it |
| N beats start with 'X' | vary sentence openings |
