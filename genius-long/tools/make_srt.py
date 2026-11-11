# English subtitles for YouTube from the aligned words: voice/words.json -> 4-geniuses.en.srt
import json, os, re
H = os.path.dirname(os.path.abspath(__file__)) + "/.."
ww = json.load(open(f"{H}/voice/words.json"))
NUM = [("seventeen twenty", "1720"), ("eighteen eighty", "1880"), ("eighteen ninety-four", "1894"), ("nineteen twenty-nine", "1929"), ("nineteen thirty-two", "1932"),
       ("nineteen ninety-four", "1994"), ("nineteen ninety-seven", "1997"), ("nineteen ninety-eight", "1998"), ("nineteen twenties", "1920s"), ("nineteen nineties", "1990s"),
       ("twenty fourteen", "2014"), ("two thousand eight", "2008"), ("early two thousand", "early 2000"), ("eight million dollars", "$8 million"), ("twenty thousand pounds", "£20,000"),
       ("three hundred thousand dollars", "$300,000"), ("ten million dollars", "$10 million"), ("four point six billion dollars", "$4.6 billion"),
       ("three point six billion dollars", "$3.6 billion"), ("one point nine billion dollars", "$1.9 billion"), ("six million dollars", "$6 million"),
       ("eighty-nine percent", "89%"), ("twenty-one percent", "21%"), ("ten percent", "10%"), ("four percent", "4%"), ("a thousand pounds", "£1,000"),
       ("five billion dollars", "$5 billion"), ("a hundred and twenty-five billion", "$125 billion"), ("twenty-five dollars", "$25"), ("ten dollars", "$10"),
       ("seventy-seven", "77"), ("ninety-five", "95"), ("ninety-two", "92"), ("eighteen thousand", "18,000"), ("twenty-five years", "25 years"), ("fifty years", "50 years"), ("fourteen years", "14 years")]
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
open(f"{H}/4-geniuses.en.srt", "w").write("\n".join(out))
print("cues", len(out)); print("\n".join(out[:3]))
