import json, subprocess, sys
pdf, toc_json, out = sys.argv[1:4]
entries = json.load(open(toc_json, encoding='utf-8'))
n = int([l for l in subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout.split('\n') if l.startswith('Pages')][0].split()[1])
pages = {i: [l.strip() for l in subprocess.run(['pdftotext', '-f', str(i), '-l', str(i), '-layout', pdf, '-'], capture_output=True, text=True).stdout.split('\n')] for i in range(3, n + 1)}
res = {}
start = 3
for e in entries:
    key = e[:28]
    for i in range(start, n + 1):
        if any(l.startswith(key) for l in pages[i]):
            res[e] = i - 2; start = i; break
    else:
        print('NOT FOUND', e)
json.dump(res, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for k, v in res.items(): print(v, k)
