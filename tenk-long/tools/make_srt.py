# English subtitles for YouTube from the aligned words: voice/words.json -> 10k-to-1m.en.srt
import json, os, re
H = os.path.dirname(os.path.abspath(__file__)) + "/.."
ww = json.load(open(f"{H}/voice/words.json"))
NUM = [("ten thousand dollars", "$10,000"), ("ten thousand", "10,000"), ("thirty days", "30 days"), ("eight percent", "8%"), ("twenty-four percent", "24%"),
       ("two thousand dollars", "$2,000"), ("six thousand dollars", "$6,000"), ("fifty cents", "50 cents"), ("fifty percent", "50%"), ("one percent", "1%"),
       ("one hundred and nine thousand", "$109,000"), ("six hundred dollars", "$600"), ("one hundred and thirty-two thousand", "$132,000"),
       ("four hundred thousand", "$400,000"), ("one million dollars", "$1 million"), ("two hundred and twenty-six thousand", "$226,000"),
       ("two thousand seven", "2007"), ("two thousand nine", "2009"), ("two thousand thirteen", "2013"), ("S&P five hundred", "S&P 500"),
       ("fifty-seven percent", "57%"), ("thirty years", "30 years"), ("ten years", "10 years"), ("eight years", "8 years"), ("five years", "5 years"),
       ("twenty years", "20 years"), ("three months", "3 months"), ("six hundred", "$600")]
cues, cur = [], []
def flush():
    global cur
    if cur: cues.append(cur); cur = []
for i, w in enumerate(ww):
    if cur and (w["beat"] != cur[-1]["beat"]): flush()
    cur.append(w)
    txt = " ".join(x["w"] for x in cur)
    end = w["w"][-1] in ".?!"
    if (end and len(txt) >= 20) or len(txt) >= 68 or (w["w"][-1] in ",:;" and len(txt) >= 46): flush()
flush()
def ts(t): h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f"{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)) % 1000:03d}"
out = []
for k, c in enumerate(cues):
    a = c[0]["s"]; b = c[-1]["e"] + 0.2
    if k + 1 < len(cues): b = min(b, cues[k + 1][0]["s"] - 0.02)
    b = max(b, a + 0.6)
    txt = " ".join(x["w"] for x in c)
    for p, r in NUM: txt = re.sub(p, r, txt, flags=re.I)
    if len(txt) > 42:
        mid = len(txt) // 2; sp = [i for i, ch in enumerate(txt) if ch == " "]; j = min(sp, key=lambda i: abs(i - mid)); txt = txt[:j] + "\n" + txt[j + 1:]
    out.append(f"{k + 1}\n{ts(a)} --> {ts(b)}\n{txt}\n")
open(f"{H}/10k-to-1m.en.srt", "w").write("\n".join(out))
print("cues", len(out)); print("\n".join(out[:3]))
