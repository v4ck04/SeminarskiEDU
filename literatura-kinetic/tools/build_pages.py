"""Writes the shot pages of the kinetic-typography reel. Run from the project folder."""
import textwrap

def star(cls, x, y, size, ph, amp, rot, sid, a='#2A43A8', b='#D4AF6A', pop=None):
    p = f' data-pop="{pop}"' if pop is not None else ''
    return (f'<div class="star {cls}" style="left:{x}px;top:{y}px;width:{size}px;height:{size}px" data-float="{ph},{amp},{rot}"{p}>'
            f'<script>document.currentScript.parentElement.innerHTML=window.__STAR("{sid}","{a}","{b}")</script></div>')

HEAD = '''<!doctype html>
<html lang="sr">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="lib/kin.css">
<script>window.__STAR=(id,a,b)=>`<svg viewBox="-100 -100 200 200"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><path d="M0 -96 C10 -26 26 -10 96 0 C26 10 10 26 0 96 C-10 26 -26 10 -96 0 C-26 -10 -10 -26 0 -96Z" fill="url(#${id})"/></svg>`</script>
<style>%s</style>
</head>
<body>
<div id="root">
  <div class="grid"></div><div class="arc a1"></div><div class="arc a2"></div>
  <div id="content">
    <div class="brand">SEMINARSKI<b>EDU</b></div>
%s
  </div>
  <canvas class="grain" id="grain"></canvas>
</div>
<script type="module">
import { shot, seg, E, clamp } from './lib/kin.js';
%s
</script>
</body>
</html>
'''

def page(name, css, body, js):
    open(name, 'w').write(HEAD % (textwrap.dedent(css), textwrap.indent(textwrap.dedent(body), '    '), textwrap.dedent(js)))

def tags(items, at, step, top, cls='', gap=30):
    out = f'<div class="tags" style="top:{top}px;gap:{gap}px">'
    for i, s in enumerate(items):
        out += f'<div class="tag {cls}" data-in="{at + i * step:.2f}" data-dy="40"><i></i><i></i><i></i><i></i>{s}</div>'
    return out + '</div>'

def lens(x, y, svg, pop, size=380):
    return f'<div class="lens" style="left:{x}px;top:{y}px;width:{size}px;height:{size}px" data-pop="{pop}">{svg}</div>'

# ---------- icons (SVG, soft 3D shading) ----------
BOOKS = '''<svg viewBox="0 0 300 300">
 <defs><linearGradient id="bk1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2A43A8"/><stop offset="1" stop-color="#0B1D45"/></linearGradient>
 <linearGradient id="bk2" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#F1D28E"/><stop offset="1" stop-color="#B8893A"/></linearGradient>
 <linearGradient id="bk3" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7C88A8"/><stop offset="1" stop-color="#3F4A68"/></linearGradient></defs>
 <ellipse cx="150" cy="262" rx="120" ry="14" fill="rgba(11,29,69,.18)"/>
 <rect x="40" y="196" width="220" height="56" rx="8" fill="url(#bk1)"/><rect x="52" y="204" width="200" height="12" rx="3" fill="#F6F1E4"/><rect x="40" y="228" width="220" height="5" fill="#D4AF6A"/>
 <rect x="58" y="140" width="196" height="54" rx="8" fill="url(#bk2)" transform="rotate(-4 156 167)"/><rect x="68" y="150" width="176" height="10" rx="3" fill="#FFF8E8" transform="rotate(-4 156 167)"/>
 <rect x="48" y="86" width="206" height="52" rx="8" fill="url(#bk3)" transform="rotate(3 151 112)"/><rect x="60" y="95" width="186" height="10" rx="3" fill="#F6F1E4" transform="rotate(3 151 112)"/><rect x="48" y="118" width="206" height="5" fill="#D4AF6A" transform="rotate(3 151 112)"/>
 <path d="M96 30 h108 a10 10 0 0 1 10 10 v40 h-128 v-40 a10 10 0 0 1 10 -10z" fill="#FFFFFF" stroke="#C9CEDA" stroke-width="3"/>
 <path d="M110 48 h80 M110 62 h56" stroke="#13297A" stroke-width="7" stroke-linecap="round"/>
</svg>'''

ARTICLE = '''<svg viewBox="0 0 300 300">
 <ellipse cx="150" cy="276" rx="104" ry="12" fill="rgba(11,29,69,.16)"/>
 <rect x="56" y="22" width="188" height="244" rx="14" fill="#FFFFFF" stroke="#D3D8E3" stroke-width="3"/>
 <circle cx="98" cy="70" r="22" fill="#13297A"/><circle cx="98" cy="64" r="8" fill="#fff"/><path d="M84 84 a14 12 0 0 1 28 0z" fill="#fff"/>
 <path d="M134 60 h84 M134 80 h58" stroke="#13297A" stroke-width="8" stroke-linecap="round"/>
 <path d="M80 122 h140 M80 144 h140 M80 166 h116 M80 188 h132 M80 210 h90" stroke="#C3C9D6" stroke-width="7" stroke-linecap="round"/>
 <circle cx="222" cy="226" r="44" fill="url(#ckg)"/><defs><radialGradient id="ckg" cx=".35" cy=".3"><stop offset="0" stop-color="#FFF1C9"/><stop offset=".5" stop-color="#E2BC6E"/><stop offset="1" stop-color="#A8792E"/></radialGradient></defs>
 <path d="M202 226 l14 14 l26 -28" fill="none" stroke="#0B1D45" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''

DB = '''<svg viewBox="0 0 300 300">
 <defs><linearGradient id="dbg" x1="0" x2="1"><stop offset="0" stop-color="#0B1D45"/><stop offset=".45" stop-color="#2A43A8"/><stop offset="1" stop-color="#13297A"/></linearGradient></defs>
 <ellipse cx="150" cy="276" rx="110" ry="12" fill="rgba(11,29,69,.18)"/>
 <path d="M60 70 v160 a90 30 0 0 0 180 0 v-160" fill="url(#dbg)"/>
 <path d="M60 123 a90 30 0 0 0 180 0 M60 176 a90 30 0 0 0 180 0" fill="none" stroke="#D4AF6A" stroke-width="6"/>
 <ellipse cx="150" cy="70" rx="90" ry="30" fill="#3550B8"/><ellipse cx="150" cy="70" rx="90" ry="30" fill="none" stroke="#D4AF6A" stroke-width="6"/>
 <circle cx="206" cy="150" r="7" fill="#F4D899"/><circle cx="206" cy="203" r="7" fill="#F4D899"/><circle cx="206" cy="256" r="7" fill="#F4D899"/>
</svg>'''

QUOTE = '''<svg viewBox="0 0 300 300">
 <defs><linearGradient id="qg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4D899"/><stop offset=".5" stop-color="#D4AF6A"/><stop offset="1" stop-color="#A8792E"/></linearGradient></defs>
 <ellipse cx="150" cy="270" rx="100" ry="12" fill="rgba(11,29,69,.14)"/>
 <rect x="46" y="40" width="208" height="214" rx="20" fill="#FFFFFF" stroke="#D3D8E3" stroke-width="3"/>
 <text x="150" y="190" text-anchor="middle" font-family="Playfair Display" font-weight="700" font-size="230" fill="url(#qg)">„</text>
 <path d="M84 214 h132" stroke="#13297A" stroke-width="8" stroke-linecap="round"/>
</svg>'''

TARGET = '''<svg viewBox="0 0 300 300" style="overflow:visible">
 <ellipse cx="150" cy="282" rx="100" ry="12" fill="rgba(11,29,69,.18)"/>
 <circle cx="150" cy="150" r="124" fill="#13297A"/><circle cx="150" cy="150" r="98" fill="#fff"/><circle cx="150" cy="150" r="72" fill="#13297A"/>
 <circle cx="150" cy="150" r="46" fill="#fff"/><circle cx="150" cy="150" r="22" fill="#D4AF6A"/>
 <g id="arrow"><path d="M150 150 L330 150" stroke="#0B1D45" stroke-width="8" stroke-linecap="round"/><path d="M300 150 l34 -20 l-6 20 l6 20z" fill="#D4AF6A"/>
 <path d="M150 150 l22 -9 v18z" fill="#0B1D45"/></g>
</svg>'''

STD = '''
  .head { position: absolute; left: 100px; right: 100px; top: 260px; }
  .head .serif { font-size: 84px; line-height: 1.05; }
  .head .sans { font-size: 92px; line-height: 1.02; }
  .head .cond { font-size: 190px; }
  .stepn { position: absolute; left: 100px; top: 250px; }
'''

# A — badge hook (0–2.4)
page('a-badge.html', STD + '''
  #badge { left: 540px; top: 860px; width: 820px; height: 380px; transform: translate(-50%,-50%); align-items: flex-start; }
  #badge .t { font-size: 118px; line-height: .95; white-space: nowrap; }
  #ball { left: 860px; top: 640px; }
''', f'''
<div class="badge" id="badge"><div class="t w" id="t1">Seminarski</div><div class="t w" id="t2">savet<span style="color:#E2BC6E">.</span></div></div>
<div class="ball" id="ball"></div>
{star('soft', 70, 1380, 220, 1.2, 14, 10, 'sa')}
{star('', 830, 1500, 120, 4.1, 10, -12, 'sb', '#D4AF6A', '#F4D899')}
''', '''
const badge = document.getElementById('badge'), ball = document.getElementById('ball');
const t1 = document.getElementById('t1'), t2 = document.getElementById('t2');
shot({ duration: 2.4, enter: 0, exit: 0, frame(t) {
  // line -> box -> text, then the badge zooms through the camera
  const w = E.outCubic(seg(t, 0.0, 0.35)), h = E.outBack(seg(t, 0.3, 0.4));
  badge.style.width = `${80 + 740 * w}px`; badge.style.height = `${14 + 366 * Math.max(0, h)}px`;
  const z = E.inCubic(seg(t, 1.95, 0.45));
  badge.style.transform = `translate(-50%,-50%) scale(${1 + 2.4 * z})`; badge.style.filter = z > 0 ? `blur(${z * 14}px)` : '';
  badge.style.opacity = 1 - seg(t, 2.25, 0.15);
  [t1, t2].forEach((el, i) => { const p = seg(t, 0.55 + i * 0.16, 0.38), e = E.outCubic(p);
    el.style.opacity = clamp(p * 2); el.style.filter = p < 1 ? `blur(${(1 - e) * 14}px)` : ''; el.style.transform = `translateY(${(1 - e) * 40}px)`; });
  // gold ball drops onto the badge corner and bounces
  const b = seg(t, 0.75, 0.7), y = b <= 0 ? -900 : -260 * Math.abs(Math.cos(b * Math.PI * 1.5)) * (1 - b);
  ball.style.transform = `translateY(${b <= 0 ? -900 : y}px) scale(${1 + z * 1.5})`;
  ball.style.opacity = (b > 0 ? 1 : 0) * (1 - seg(t, 2.2, 0.15));
}});
''')

# B — hook headline (2.4–6.2)
page('b-hook.html', STD + '''
  .head { top: 300px; }
  .head .cond { font-size: 200px; margin: 6px 0 4px; }
''', f'''
<div class="head" data-words="0.12" data-stagger="0.16">
  <span class="ln serif">Kako pravilno</span>
  <span class="ln sans">izabrati</span>
  <span class="ln cond"><span data-at="0.62">LITERATURU</span></span>
  <span class="ln serif">za <span class="goldt" data-at="1.12">seminarski</span> <span data-at="1.26">rad?</span></span>
</div>
{lens(350, 1080, BOOKS, 1.55)}
{star('', 830, 1020, 150, 0.4, 12, 8, 'sc', pop=1.7)}
{star('soft', 60, 1500, 230, 3.7, 16, -6, 'sd')}
''', '''
shot({ duration: 3.8 });
''')

def step(fname, n, lines_html, extra_body, dur, css=''):
    page(fname, STD + css, f'''
<div class="stepn"><span class="num goldt glow" data-pop="0.08">{n}</span></div>
<div class="head" style="top:440px" data-words="0.3" data-stagger="0.14">
{lines_html}
</div>
{extra_body}
''', f'''
shot({{ duration: {dur} }});
''')

# C — 01 (6.2–10.4)
step('c-izvori.html', '01', '''  <span class="ln serif">Biraj stručne</span>
  <span class="ln sans">i naučne</span>
  <span class="ln cond">IZVORE</span>''',
  lens(640, 280, BOOKS, 0.5, 300) + tags(['Knjige', 'Naučni časopisi', 'Akademske publikacije'], 1.3, 0.4, 1110) +
  star('soft', 820, 1560, 200, 2.2, 14, 4, 'se'), 4.2)

# D — 02 (10.4–14.6)
step('d-autor.html', '02', '''  <span class="ln serif">Proveri autora i</span>
  <span class="ln cond">KREDIBILITET</span>''',
  '<div class="morph" id="m" style="left:465px;top:1020px"></div>' + lens(350, 905, ARTICLE, 1.15) +
  tags(['Stručnost autora', 'Pouzdanost publikacije'], 1.75, 0.4, 1335, 'ok') + star('', 70, 1000, 130, 5.0, 10, 20, 'sf', pop=1.3), 4.2)

# E — 03 (14.6–18.2)
step('e-godina.html', '03', '''  <span class="ln serif">Obrati pažnju</span>
  <span class="ln sans">na godinu</span>
  <span class="ln cond">IZDANJA</span>''', '''
<div class="lens" style="left:290px;top:920px;width:500px;height:500px" data-pop="0.9">
  <div class="cond goldt glow" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:190px;background-clip:text" data-count="1998,2024,1.0,1.4">1998</div>
</div>
<div class="blk" style="top:1450px;text-align:center" data-words="1.9" data-stagger="0.11">
  <span class="ln serif" style="font-size:54px">Za savremene teme koristi</span>
  <span class="ln sans" style="font-size:60px">aktuelna istraživanja.</span>
</div>''' + star('soft', 840, 860, 190, 1.0, 12, 0, 'sg'), 3.6)

# F — 04 (18.2–22.2)
step('f-baze.html', '04', '''  <span class="ln serif">Koristi proverene</span>
  <span class="ln sans">akademske</span>
  <span class="ln cond">BAZE</span>''',
  lens(640, 560, DB, 0.6, 300) +
  '<div style="position:absolute;left:90px;right:90px;top:1110px;display:grid;grid-template-columns:1fr 1fr;gap:40px 30px;justify-items:center">' +
  ''.join(f'<div class="tag" style="font-size:54px" data-in="{1.2 + i * 0.3:.2f}" data-dy="40"><i></i><i></i><i></i><i></i>{s}</div>'
          for i, s in enumerate(['Google Scholar', 'PubMed', 'DOAJ', 'CORE'])) + '</div>' +
  star('', 120, 1480, 140, 2.8, 12, -10, 'sh', pop=2.2), 4.0)

# G — 05 (22.2–25.4)
step('g-citiranje.html', '05', '''  <span class="ln serif">Pravilno citiraj</span>
  <span class="ln sans">svaki</span>
  <span class="ln cond">IZVOR</span>''',
  lens(640, 560, QUOTE, 0.55, 300) +
  '<div style="position:absolute;left:60px;right:60px;top:1130px;display:flex;justify-content:center;gap:34px">' +
  ''.join(f'<div class="tag" style="font-size:56px" data-in="{1.1 + i * 0.25:.2f}" data-dy="40"><i></i><i></i><i></i><i></i>{s}</div>'
          for i, s in enumerate(['APA', 'Harvard', 'Chicago'])) + '</div>' +
  '''<div class="blk" style="top:1310px;text-align:center" data-words="1.9" data-stagger="0.1">
  <span class="ln serif" style="font-size:56px">ili stil koji zahteva fakultet.</span>
</div>''', 3.2)

# H — conclusion + target (25.4–28.0)
page('h-zakljucak.html', STD + '''
  .head { top: 300px; }
  .head .cond { font-size: 150px; }
  #tg { left: 340px; top: 1060px; }
  #tg svg { inset: 0; width: 400px; height: 400px; }
''', f'''
<div class="head" data-words="0.1" data-stagger="0.15" data-max="900">
  <span class="ln serif">Kvalitetan rad</span>
  <span class="ln sans">počinje</span>
  <span class="ln cond">KVALITETNOM</span>
  <span class="ln cond"><span class="goldt glow" data-at="0.75">LITERATUROM.</span></span>
</div>
<div class="lens" id="tg" style="width:400px;height:400px" data-pop="0.6">{TARGET}</div>
{star('', 120, 1180, 130, 0.9, 10, 0, 'si', pop=1.0)}
{star('soft', 840, 1500, 210, 3.3, 14, 0, 'sj')}
''', '''
const arrow = document.getElementById('arrow'), tg = document.getElementById('tg');
shot({ duration: 2.6, frame(t) {
  const p = E.outCubic(seg(t, 1.05, 0.3));
  arrow.style.transform = `translate(${(1 - p) * 700}px, ${(1 - p) * -120}px)`;
  arrow.style.opacity = t < 1.05 ? 0 : 1;
  const hit = seg(t, 1.35, 0.35), k = Math.sin(hit * Math.PI * 3) * (1 - hit);
  tg.style.rotate = `${k * 4}deg`;
}});
''')

# I — brand CTA (28.0–30.5)
page('i-cta.html', STD + '''
  #badge { left: 540px; top: 720px; width: 900px; height: 250px; padding: 0 40px; transform: translate(-50%,-50%); align-items: center; }
  #badge .t { font-size: 104px; white-space: nowrap; }
  #ball { left: 920px; top: 560px; }
  .cta { position: absolute; left: 100px; right: 100px; top: 960px; text-align: center; }
  .cta .serif { font-size: 76px; } .cta .sans { font-size: 80px; }
  .handle { position: absolute; left: 0; right: 0; top: 1250px; text-align: center; }
''', f'''
<div class="badge" id="badge" data-pop="0.05" data-base="translate(-50%,-50%)"><div class="t">Seminarski<span style="color:#E2BC6E">Edu</span></div></div>
<div class="ball" id="ball" data-pop="0.4"></div>
<div class="cta" data-words="0.55" data-stagger="0.13">
  <span class="ln serif">Prati nas za još</span>
  <span class="ln sans">akademskih saveta.</span>
</div>
<div class="handle"><span class="tag" style="font-size:52px;font-style:normal;font-family:var(--sans);font-weight:700" data-in="1.3"><i></i><i></i><i></i><i></i>@seminarski_edu</span></div>
{star('', 110, 1420, 150, 1.4, 12, 0, 'sk', pop=0.9)}
{star('soft', 820, 1480, 220, 4.4, 14, 0, 'sl')}
''', '''
shot({ duration: 2.5, exit: 0 });
''')
print('pages ok')
