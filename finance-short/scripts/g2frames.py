# usage: python3 scripts/g2frames.py beat[:frac[:frac...]] ...   -> comma list of global frames (default fracs .5 and .92 of the speech)
import json, sys
t = json.load(open('src/videos/genius/timing.json')); B = {b['id']: b for b in t['beats']}
out = []
for a in sys.argv[1:]:
    parts = a.split(':'); b = B[parts[0]]; fr = [float(x) for x in parts[1:]] or [0.5, 0.95]
    for x in fr: out.append(b['f0'] + int((b['fe'] - b['f0']) * x))
print(','.join(map(str, out)))
