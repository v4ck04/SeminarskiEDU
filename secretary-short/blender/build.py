# "A Secretary Died With $9 Million": the whole film as one Blender scene, built from code.
# 2D character cards (cards/*.png, drawn by finance-short/src/videos/secretary/Cards.tsx) stand in 3D sets that cast
# and catch real shadows. Six sets sit side by side on the X axis (office, boss's office, subway car, home, street,
# gold stage); each shot has its own camera, bound to timeline markers, so cuts happen on the right frames.
# Timing comes from ../voice/words.json (story frame = word onset x 30; Blender frame = story frame + 1).
#
#   blender -b -P build.py                       -> writes secretary.blend next to this file
#   blender -b -P build.py -- --render           -> also renders the frames to render/frames/####.png
#   options after "--": --cycles (Cycles instead of EEVEE), --scale 50 (percent), --frames 1,60,200 (stills only),
#                       --samples N
import bpy, bmesh, json, math, os, sys
from mathutils import Vector, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(name, default=None):
    return ARGS[ARGS.index(name) + 1] if name in ARGS else default
CYCLES = "--cycles" in ARGS
FPS, TOTAL = 30, 1335

# ------------------------------------------------------------------ timing
WORDS = json.load(open(os.path.join(HERE, "..", "voice", "words.json")))
def W(word, nth=0, line=None):
    k = 0
    for w in WORDS:
        if (line is None or w["line"] == line) and w["w"].lower().strip(".,?!") == word.lower():
            if k == nth:
                return round(w["s"] * FPS)
            k += 1
    raise KeyError(word)
B = lambda f: int(f) + 1  # story frame -> Blender frame

# ------------------------------------------------------------------ reset
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.frame_start, sc.frame_end = 1, TOTAL
sc.render.fps = FPS
sc.render.resolution_x, sc.render.resolution_y = 1080, 1920
sc.render.resolution_percentage = int(arg("--scale", 100))
sc.view_settings.view_transform = "AgX"
sc.view_settings.look = "AgX - Medium High Contrast"

def link(o, coll=None):
    (coll or sc.collection).objects.link(o)
    return o

# ------------------------------------------------------------------ materials
MATS = {}
def mat(name, col, rough=0.6, metal=0.0, emit=None, estr=1.0, tex=None, tscale=4.0, tmix=0.25):
    """principled material; tex = 'wood' | 'noise' | 'stripes' | 'brick' adds a procedural variation of the colour"""
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; bsdf = nt.nodes["Principled BSDF"]
    c = hexc(col)
    bsdf.inputs["Base Color"].default_value = c
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if emit:
        bsdf.inputs["Emission Color"].default_value = hexc(emit)
        bsdf.inputs["Emission Strength"].default_value = estr
    if tex:
        co = nt.nodes.new("ShaderNodeTexCoord")
        mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (tscale, tscale, tscale)
        nt.links.new(co.outputs["Object"], mp.inputs["Vector"])
        if tex == "wood":
            t = nt.nodes.new("ShaderNodeTexWave"); t.wave_type = "BANDS"; t.bands_direction = "X"
            t.inputs["Scale"].default_value = 2.0; t.inputs["Distortion"].default_value = 6.0; t.inputs["Detail"].default_value = 3.0
            fac = t.outputs["Fac"]
        elif tex == "stripes":
            t = nt.nodes.new("ShaderNodeTexWave"); t.wave_type = "BANDS"; t.bands_direction = "X"; t.wave_profile = "SAW"
            t.inputs["Scale"].default_value = 3.0; t.inputs["Distortion"].default_value = 0.0
            fac = t.outputs["Fac"]
        elif tex == "brick":
            t = nt.nodes.new("ShaderNodeTexBrick")
            t.inputs["Color1"].default_value = c; t.inputs["Color2"].default_value = [v * 0.75 for v in c[:3]] + [1]
            t.inputs["Mortar"].default_value = hexc("#cdbfae"); t.inputs["Scale"].default_value = 1.0
            nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
            nt.links.new(t.outputs["Color"], bsdf.inputs["Base Color"])
            MATS[name] = m
            return m
        else:
            t = nt.nodes.new("ShaderNodeTexNoise"); t.inputs["Scale"].default_value = 6.0; t.inputs["Detail"].default_value = 6.0
            fac = t.outputs["Fac"]
        nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
        mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"
        mx.inputs["Factor"].default_value = tmix
        mx.inputs[6].default_value = c
        nt.links.new(fac, mx.inputs[7])
        nt.links.new(mx.outputs[2], bsdf.inputs["Base Color"])
    MATS[name] = m
    return m

def hexc(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, 1.0)

def emissive(name, col, strength):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    e = nt.nodes.new("ShaderNodeEmission"); e.inputs["Color"].default_value = hexc(col); e.inputs["Strength"].default_value = strength
    o = nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(e.outputs[0], o.inputs[0])
    return m

# ------------------------------------------------------------------ geometry helpers
def box(name, size, loc, m, bevel=0.015, rot=(0, 0, 0), coll=None):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me), coll)
    o.location = loc; o.rotation_euler = rot
    o.data.materials.append(m)
    if bevel:
        b = o.modifiers.new("bevel", "BEVEL"); b.width = bevel; b.segments = 2; b.limit_method = "ANGLE"
    for p in o.data.polygons:
        p.use_smooth = False
    return o

def cyl(name, r, h, loc, m, rot=(0, 0, 0), verts=24, coll=None):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r, depth=h)
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me), coll)
    o.location = loc; o.rotation_euler = rot; o.data.materials.append(m)
    for p in o.data.polygons:
        p.use_smooth = True
    return o

def plane(name, w, h, loc, m, rot=(math.pi / 2, 0, 0), coll=None):
    """a w x h quad standing in the XZ plane (facing -Y) unless rot says otherwise"""
    me = bpy.data.meshes.new(name)
    me.from_pydata([(-w / 2, -h / 2, 0), (w / 2, -h / 2, 0), (w / 2, h / 2, 0), (-w / 2, h / 2, 0)], [], [(0, 1, 2, 3)])
    me.uv_layers.new(); uv = me.uv_layers.active.data
    for i, c in enumerate([(0, 0), (1, 0), (1, 1), (0, 1)]):
        uv[i].uv = c
    o = link(bpy.data.objects.new(name, me), coll)
    o.location = loc; o.rotation_euler = rot; o.data.materials.append(m)
    return o

FONT_BLACK = bpy.data.fonts.load(os.path.join(HERE, "fonts", "InterDisplay-Black.otf"))
FONT_BOLD = bpy.data.fonts.load(os.path.join(HERE, "fonts", "InterDisplay-Bold.otf"))
def text(name, body, loc, size, m, extrude=0.0, bevel=0.0, rot=(math.pi / 2, 0, 0), font=None, align="CENTER", coll=None):
    cu = bpy.data.curves.new(name, "FONT"); cu.body = body; cu.font = font or FONT_BLACK
    cu.size = size; cu.extrude = extrude; cu.bevel_depth = bevel; cu.bevel_resolution = 3
    cu.align_x = align; cu.align_y = "CENTER"
    o = link(bpy.data.objects.new(name, cu), coll)
    o.location = loc; o.rotation_euler = rot; o.data.materials.append(m)
    return o

def show(o, frames_on):
    """keyframe visibility: frames_on = list of (a, b) story-frame ranges where the object is visible"""
    objs = [o] + list(o.children_recursive)
    for ob in objs:
        ob.hide_render = True; ob.hide_viewport = True
        ob.keyframe_insert("hide_render", frame=0); ob.keyframe_insert("hide_viewport", frame=0)
        for a, b in frames_on:
            ob.hide_render = False; ob.hide_viewport = False
            ob.keyframe_insert("hide_render", frame=B(a)); ob.keyframe_insert("hide_viewport", frame=B(a))
            ob.hide_render = True; ob.hide_viewport = True
            ob.keyframe_insert("hide_render", frame=B(b)); ob.keyframe_insert("hide_viewport", frame=B(b))
        ob.hide_render = True; ob.hide_viewport = True

def key(o, path, pts, interp="BEZIER", index=-1):
    """pts = [(story frame, value)], value a number or tuple"""
    for f, v in pts:
        setattr(o, path, v) if index < 0 else getattr(o, path).__setitem__(index, v)
        o.keyframe_insert(path, frame=B(f), index=index)
    if o.animation_data and o.animation_data.action:
        for fc in o.animation_data.action.fcurves:
            if fc.data_path == path:
                for k in fc.keyframe_points:
                    k.interpolation = interp

def pop_in(o, f0, s=1.0, n=8):
    """scale 0 -> overshoot -> s over n frames from story frame f0"""
    key(o, "scale", [(f0 - 1, (0.001,) * 3), (f0 + n * 0.6, (s * 1.15,) * 3), (f0 + n, (s,) * 3)])

def pulse(o, f0, f1, s=1.0, amp=0.05, period=24):
    pts = []
    f = f0
    while f <= f1:
        pts.append((f, (s * (1 + amp * math.sin((f - f0) / period * 2 * math.pi)),) * 3)); f += period / 4
    key(o, "scale", pts)

# ------------------------------------------------------------------ cameras + shots
CAMS = []
def camera(name, shot_a, shot_b, keys, lens=35, shake=0.0):
    """keys = [(story frame, (x, y, z) position, (x, y, z) look-at)]"""
    cd = bpy.data.cameras.new(name); cd.lens = lens; cd.sensor_width = 36; cd.clip_start = 0.05; cd.clip_end = 400
    cam = link(bpy.data.objects.new(name, cd))
    tgt = link(bpy.data.objects.new(name + "_tgt", None))
    c = cam.constraints.new("TRACK_TO"); c.target = tgt; c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"
    for f, p, l in keys:
        cam.location = p; cam.keyframe_insert("location", frame=B(f))
        tgt.location = l; tgt.keyframe_insert("location", frame=B(f))
    if shake:
        for fc in cam.animation_data.action.fcurves:
            md = fc.modifiers.new("NOISE"); md.scale = 40; md.strength = shake; md.phase = fc.array_index * 7.3
    m = sc.timeline_markers.new(name, frame=B(shot_a)); m.camera = cam
    CAMS.append((shot_a, shot_b, cam))
    return cam

# ------------------------------------------------------------------ character cards
# character sprites (sprites/*.png, cropped by prep_sprites.py: feet on the bottom edge); height in metres per sprite
SPRITES = json.load(open(os.path.join(HERE, "sprites", "sprites.json")))
HEIGHT = {"stand": 1.95, "sit": 1.45}
HEIGHT_OF = {"boss_sit_holding_paper": 1.75, "neco_sit_neutral_paper": 1.55, "huab_stand_confused": 2.0,
             "rider_stand_holding_pole": 2.2, "rider_sit_neutral_green": 1.9, "st1_happy_diploma": 2.1,
             "st2_laugh_diploma": 2.1, "st3_happy_diploma": 2.1, "st4_happy": 2.05, "syl_sit_typing": 1.5,
             "sj_sit_holding_paper": 1.5, "boss_sit_phone": 1.5, "boss_sit_neutral": 1.5, "boss_sit_happy": 1.5}
def sprite_h(n):
    return HEIGHT_OF.get(n, HEIGHT["sit"] if "_sit_" in n else HEIGHT["stand"])
CARD_MATS = {}
def card_mat(name):
    if name in CARD_MATS:
        return CARD_MATS[name]
    m = bpy.data.materials.new("card_" + name); m.use_nodes = True
    nt = m.node_tree; bsdf = nt.nodes["Principled BSDF"]
    im = nt.nodes.new("ShaderNodeTexImage"); im.image = bpy.data.images.load(os.path.join(HERE, "sprites", name + ".png"))
    im.interpolation = "Cubic"
    nt.links.new(im.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(im.outputs["Alpha"], bsdf.inputs["Alpha"])
    # flat cartoon look: mostly lit by the scene, plus a little of its own colour so faces never go muddy
    nt.links.new(im.outputs["Color"], bsdf.inputs["Emission Color"]); bsdf.inputs["Emission Strength"].default_value = 0.22
    bsdf.inputs["Roughness"].default_value = 1.0
    bsdf.inputs["Specular IOR Level"].default_value = 0.0
    m.surface_render_method = "DITHERED"
    m.use_transparent_shadow = True
    CARD_MATS[name] = m
    return m

def actor(name, loc, timeline, cam_face=None, scale=1.0, sway=1.0, blink=None):
    """a standing/sitting 2D character at loc (feet on the floor): timeline = [(story frame, card name)] in order;
    it turns to face the active camera around Z. blink = card name shown for 3 frames every ~2.3 s."""
    root = link(bpy.data.objects.new(name, None)); root.location = loc
    tr = root.constraints.new("LOCKED_TRACK"); tr.track_axis = "TRACK_NEGATIVE_Y"; tr.lock_axis = "LOCK_Z"
    tr.target = cam_face
    pivot = link(bpy.data.objects.new(name + "_sway", None)); pivot.parent = root
    if sway:
        pivot.rotation_euler = (0, 0, 0); pivot.keyframe_insert("rotation_euler", frame=1, index=1)
        fc = pivot.animation_data.action.fcurves.find("rotation_euler", index=1)
        md = fc.modifiers.new("NOISE"); md.scale = 26; md.strength = 0.035 * sway; md.phase = sum(map(ord, name)) % 50
    names = sorted({c for _, c in timeline} | ({blink} if blink else set()))
    planes = {}
    for n in names:
        h = sprite_h(n) * scale; w = h * SPRITES[n]["aspect"]
        p = plane(f"{name}_{n}", w, h, (0, 0, h / 2), card_mat(n))
        p.parent = pivot; planes[n] = p
    spans = []
    for i, (f, c) in enumerate(timeline):
        end = timeline[i + 1][0] if i + 1 < len(timeline) else TOTAL + 1
        spans.append((f, end, c))
    on = {n: [] for n in names}
    for a, b, c in spans:
        if blink and c != blink:
            f = a + 20 + (sum(map(ord, name)) % 30)
            cur = a
            while f + 3 < b:
                on[c].append((cur, f)); on[blink].append((f, f + 3)); cur = f + 3; f += 64 + (f * 7) % 23
            on[c].append((cur, b))
        else:
            on[c].append((a, b))
    for n, p in planes.items():
        show(p, on[n])
    return root

# =================================================================== THE SETS
# common materials
FLOOR_WOOD = mat("floor_wood", "#7a4e2e", 0.55, tex="wood", tscale=1.2, tmix=0.35)
DESK_WOOD = mat("desk_wood", "#5a3420", 0.4, tex="wood", tscale=2.0, tmix=0.4)
PANEL = mat("panel", "#6b4a32", 0.5, tex="wood", tscale=0.8, tmix=0.3)
WALL_CREAM = mat("wall_cream", "#e7dcc3", 0.85, tex="noise", tmix=0.08)
WALL_GREEN = mat("wall_green", "#7f9a7a", 0.85, tex="stripes", tscale=3.0, tmix=0.12)
METAL = mat("metal", "#9aa3ab", 0.3, metal=0.9)
BRASS = mat("brass", "#c9a24a", 0.25, metal=1.0)
BLACK = mat("black_lacquer", "#1d1b20", 0.25)
PAPER = mat("paper", "#f4efe2", 0.8)
GLASS_FROST = mat("frosted", "#dfe8ea", 0.15, emit="#fff4dc", estr=0.6)
GREEN_SHADE = mat("banker_green", "#1f6b45", 0.2, metal=0.2)
LAMP_GLOW = emissive("lamp_glow", "#ffd9a0", 18)
GOLD = mat("gold", "#f2c230", 0.18, metal=1.0)
SKY_DAY = emissive("sky_day", "#9cc7ea", 2.2)
SKY_DUSK = emissive("sky_dusk", "#f2a46a", 1.8)
CITY = mat("city", "#5d6a85", 0.9)
CITY_WIN = emissive("city_win", "#ffd38a", 3.0)

def room(x0, name, w=8.0, d=6.0, h=3.2, wall=WALL_CREAM, floor=FLOOR_WOOD, window=True, sky=SKY_DAY):
    """open-front room: floor, back wall (y = +d/2) with a window, side walls, ceiling, wainscot; city behind the window"""
    box(name + "_floor", (w, d, 0.1), (x0, 0, -0.05), floor, bevel=0)
    box(name + "_ceil", (w, d, 0.1), (x0, 0, h + 0.05), mat("ceil", "#efe9dc", 0.9), bevel=0)
    for s in (-1, 1):
        box(name + f"_side{s}", (0.12, d, h), (x0 + s * w / 2, 0, h / 2), wall, bevel=0)
    if window:
        ww, wh, wz = 2.2, 1.6, 1.75
        # back wall around the window
        box(name + "_bwL", ((w - ww) / 2, 0.12, h), (x0 - (w + ww) / 4, d / 2, h / 2), wall, bevel=0)
        box(name + "_bwR", ((w - ww) / 2, 0.12, h), (x0 + (w + ww) / 4, d / 2, h / 2), wall, bevel=0)
        box(name + "_bwB", (ww, 0.12, wz - wh / 2), (x0, d / 2, (wz - wh / 2) / 2), wall, bevel=0)
        box(name + "_bwT", (ww, 0.12, h - wz - wh / 2), (x0, d / 2, h - (h - wz - wh / 2) / 2), wall, bevel=0)
        for dx in (-ww / 2, 0, ww / 2):
            box(name + f"_mull{dx}", (0.06, 0.16, wh), (x0 + dx, d / 2, wz), BLACK, bevel=0.005)
        for dz in (-wh / 2, 0, wh / 2):
            box(name + f"_tran{dz}", (ww, 0.16, 0.06), (x0, d / 2, wz + dz), BLACK, bevel=0.005)
        # the city outside: sky + blocks with lit windows
        plane(name + "_sky", 40, 22, (x0, d / 2 + 22, 6), sky)
        for i in range(9):
            bx = x0 - 9 + i * 2.3 + (i * 37 % 7) * 0.12
            bh = 6 + (i * 53 % 11)
            box(name + f"_bld{i}", (2.0, 2.0, bh), (bx, d / 2 + 9 + (i % 3) * 2.5, bh / 2 - 2), CITY, bevel=0)
            for r in range(int(bh / 1.4)):
                for c in range(3):
                    if (i * 13 + r * 7 + c * 3) % 4:
                        plane(name + f"_w{i}_{r}_{c}", 0.32, 0.45, (bx - 0.6 + c * 0.6, d / 2 + 9 + (i % 3) * 2.5 - 1.01, r * 1.4 - 1.0), CITY_WIN)
    else:
        box(name + "_back", (w, 0.12, h), (x0, d / 2, h / 2), wall, bevel=0)
    # wainscot (wood panelling on the lower walls)
    box(name + "_wain", (w, 0.04, 1.0), (x0, d / 2 - 0.08, 0.5), PANEL, bevel=0.004)
    for s in (-1, 1):
        box(name + f"_wainS{s}", (0.04, d, 1.0), (x0 + s * (w / 2 - 0.08), 0, 0.5), PANEL, bevel=0.004)
    box(name + "_rail", (w, 0.07, 0.05), (x0, d / 2 - 0.1, 1.02), DESK_WOOD, bevel=0.01)

def point(name, loc, energy, col="#ffd9a0", radius=0.15, dist=8.0):
    ld = bpy.data.lights.new(name, "POINT"); ld.energy = energy; ld.color = hexc(col)[:3]; ld.shadow_soft_size = radius
    ld.use_custom_distance = True; ld.cutoff_distance = dist
    o = link(bpy.data.objects.new(name, ld)); o.location = loc
    return o

def area(name, loc, rot, energy, size=2.0, col="#fff2dc"):
    ld = bpy.data.lights.new(name, "AREA"); ld.energy = energy; ld.size = size; ld.color = hexc(col)[:3]
    o = link(bpy.data.objects.new(name, ld)); o.location = loc; o.rotation_euler = rot
    return o

def spot(name, loc, rot, energy, angle=0.6, col="#fff2dc", blend=0.4):
    ld = bpy.data.lights.new(name, "SPOT"); ld.energy = energy; ld.spot_size = angle; ld.spot_blend = blend; ld.color = hexc(col)[:3]
    ld.shadow_soft_size = 0.2
    o = link(bpy.data.objects.new(name, ld)); o.location = loc; o.rotation_euler = rot
    return o

# ---------------- 1. the law office (x = 0): Sylvia's desk, typewriter, banker's lamp, calendar, clock, cabinet
OX = 0.0
room(OX, "office", wall=WALL_GREEN)
DESK = Vector((OX, 0.9, 0))
box("desk_top", (1.7, 0.85, 0.06), (DESK.x, DESK.y, 0.76), DESK_WOOD, bevel=0.012)
box("desk_front", (1.66, 0.04, 0.7), (DESK.x, DESK.y - 0.4, 0.38), DESK_WOOD, bevel=0.006)
for s in (-1, 1):
    box(f"desk_ped{s}", (0.45, 0.8, 0.72), (DESK.x + s * 0.6, DESK.y, 0.36), DESK_WOOD, bevel=0.01)
    for k in range(3):
        box(f"desk_dr{s}{k}", (0.38, 0.02, 0.18), (DESK.x + s * 0.6, DESK.y - 0.415, 0.15 + k * 0.22), PANEL, bevel=0.004)
        cyl(f"desk_knob{s}{k}", 0.015, 0.03, (DESK.x + s * 0.6, DESK.y - 0.43, 0.15 + k * 0.22), BRASS, rot=(math.pi / 2, 0, 0))
# the drawer that closes in shot 8 (centre, under the top)
DRAWER = box("drawer", (0.6, 0.5, 0.1), (DESK.x, DESK.y - 0.2, 0.67), PANEL, bevel=0.005)
cyl("drawer_knob", 0.018, 0.03, (0, -0.26, 0), BRASS, rot=(math.pi / 2, 0, 0)).parent = DRAWER
# typewriter
TW = Vector((DESK.x - 0.15, DESK.y - 0.05, 0.79))
box("tw_body", (0.46, 0.36, 0.12), (TW.x, TW.y, TW.z + 0.06), BLACK, bevel=0.03)
box("tw_carriage", (0.56, 0.1, 0.07), (TW.x, TW.y + 0.13, TW.z + 0.16), BLACK, bevel=0.02)
cyl("tw_roll", 0.035, 0.6, (TW.x, TW.y + 0.13, TW.z + 0.2), mat("rubber", "#222", 0.6), rot=(0, math.pi / 2, 0))
plane("tw_paper", 0.24, 0.3, (TW.x, TW.y + 0.17, TW.z + 0.33), PAPER, rot=(math.radians(80), 0, 0))
for r in range(3):
    for c in range(9):
        cyl(f"tw_key{r}{c}", 0.016, 0.02, (TW.x - 0.17 + c * 0.042 + r * 0.01, TW.y - 0.12 + r * 0.045, TW.z + 0.13 + r * 0.01), mat("keycap", "#e9e4d8", 0.4), verts=12)
# banker's lamp
LAMP = Vector((DESK.x + 0.55, DESK.y + 0.15, 0.79))
cyl("lamp_base", 0.08, 0.03, (LAMP.x, LAMP.y, LAMP.z + 0.015), BRASS)
cyl("lamp_stem", 0.01, 0.3, (LAMP.x, LAMP.y, LAMP.z + 0.16), BRASS, verts=10)
cyl("lamp_shade", 0.1, 0.22, (LAMP.x, LAMP.y, LAMP.z + 0.33), GREEN_SHADE, rot=(0, math.pi / 2, 0), verts=24)
cyl("lamp_bulb", 0.035, 0.16, (LAMP.x, LAMP.y, LAMP.z + 0.3), LAMP_GLOW, rot=(0, math.pi / 2, 0), verts=12)
L_DESK = point("L_desk", (LAMP.x, LAMP.y - 0.05, LAMP.z + 0.25), 40, "#ffc98a", 0.06, 6)
# papers, pen, phone on the desk
for i in range(4):
    plane(f"paper{i}", 0.21, 0.29, (DESK.x + 0.25 + i * 0.012, DESK.y - 0.18 - i * 0.01, 0.795 + i * 0.002), PAPER, rot=(0, 0, 0.1 * i - 0.1))
# the stock certificate stack (grows in shot 7)
CERT_MAT = mat("cert", "#efe3c2", 0.7, tex="noise", tmix=0.1)
CERTS = []
for i in range(12):
    o = box(f"cert{i}", (0.3, 0.21, 0.012), (DESK.x - 0.55, DESK.y - 0.05, 0.8 + i * 0.013), CERT_MAT, bevel=0.002, rot=(0, 0, 0.06 * math.sin(i * 2.1)))
    CERTS.append(o)
# chair behind the desk
box("chair_seat", (0.5, 0.48, 0.06), (DESK.x, DESK.y + 0.55, 0.47), mat("leather", "#5a2620", 0.35), bevel=0.02)
box("chair_back", (0.5, 0.06, 0.55), (DESK.x, DESK.y + 0.8, 0.8), mat("leather", "#5a2620", 0.35), bevel=0.02)
cyl("chair_post", 0.03, 0.42, (DESK.x, DESK.y + 0.55, 0.22), METAL, verts=10)
# filing cabinet (right) and a coat stand (left)
for k in range(4):
    box(f"cab{k}", (0.5, 0.6, 0.32), (OX + 2.6, 2.4, 0.18 + k * 0.33), mat("cab_green", "#4d6b58", 0.45, metal=0.3), bevel=0.01)
    box(f"cab_h{k}", (0.14, 0.02, 0.03), (OX + 2.6, 2.09, 0.24 + k * 0.33), BRASS, bevel=0.003)
cyl("coat_pole", 0.025, 1.8, (OX - 2.9, 2.3, 0.9), DESK_WOOD, verts=10)
cyl("coat_hat", 0.16, 0.12, (OX - 2.9, 2.3, 1.75), mat("hat_felt", "#3a3440", 0.8))
# wall clock above the window line (back wall, left of the window)
CLOCK = Vector((OX - 2.3, 2.92, 2.3))
cyl("clock_rim", 0.26, 0.06, CLOCK, DESK_WOOD, rot=(math.pi / 2, 0, 0), verts=40)
cyl("clock_face", 0.22, 0.07, CLOCK, PAPER, rot=(math.pi / 2, 0, 0), verts=40)
HAND_M = box("clock_min", (0.012, 0.01, 0.19), (0, 0, 0.085), BLACK, bevel=0)
HAND_H = box("clock_hour", (0.018, 0.01, 0.13), (0, 0, 0.055), BLACK, bevel=0)
for hnd, ofs in ((HAND_M, -0.045), (HAND_H, -0.05)):
    piv = link(bpy.data.objects.new(hnd.name + "_piv", None)); piv.location = (CLOCK.x, CLOCK.y + ofs, CLOCK.z)
    hnd.parent = piv
    key(piv, "rotation_euler", [(0, (0, 0, 0)), (TOTAL, (0, -math.pi * 2 * (6 if hnd is HAND_M else 0.5), 0))], "LINEAR")
# the calendar on the left wall: a big page with the number of years worked (changes in shot 4 and 13)
CAL = Vector((OX - 3.93, 0.6, 1.9))
box("cal_board", (0.02, 0.7, 0.9), CAL, mat("cal_red", "#b83a35", 0.6), bevel=0.01)
plane("cal_page", 0.6, 0.62, (CAL.x + 0.02, CAL.y, CAL.z - 0.08), PAPER, rot=(math.pi / 2, 0, -math.pi / 2))
CAL_TXT_M = mat("ink", "#241726", 0.6)
CAL_NUMS = {}
for yrs in (1, 5, 12, 20, 31, 44, 58, 67):
    t = text(f"cal_{yrs}", str(yrs), (CAL.x + 0.035, CAL.y, CAL.z - 0.04), 0.34, CAL_TXT_M, rot=(math.pi / 2, 0, -math.pi / 2))
    CAL_NUMS[yrs] = t
text("cal_lbl", "YEARS", (CAL.x + 0.035, CAL.y, CAL.z - 0.3), 0.09, CAL_TXT_M, rot=(math.pi / 2, 0, -math.pi / 2), font=FONT_BOLD)
text("cal_hd", "CLEARY", (CAL.x + 0.03, CAL.y, CAL.z + 0.3), 0.07, mat("white_ink", "#ffffff", 0.6), rot=(math.pi / 2, 0, -math.pi / 2), font=FONT_BOLD)
# the boss's door (right wall) with a frosted pane
box("door", (0.08, 1.0, 2.15), (OX + 3.94, 0.2, 1.075), PANEL, bevel=0.01)
plane("door_glass", 0.7, 0.8, (OX + 3.89, 0.2, 1.55), GLASS_FROST, rot=(math.pi / 2, 0, math.pi / 2))
text("door_txt", "PARTNER", (OX + 3.88, 0.2, 1.55), 0.12, BLACK, rot=(math.pi / 2, 0, math.pi / 2), font=FONT_BOLD)
# office lights: window daylight + ceiling globes
area("A_office_win", (OX, 4.2, 1.9), (math.radians(-90), 0, 0), 900, size=2.4, col="#dcebff")
for x in (-2.0, 2.0):
    cyl(f"globe{x}", 0.2, 0.25, (OX + x, 0, 3.0), emissive(f"globe_m{x}", "#fff1d6", 6), verts=20)
    point(f"L_globe{x}", (OX + x, 0, 2.75), 180, "#ffe7c4", 0.2, 9)

# ---------------- 2. the boss's office (x = 20): big desk, phone, leather, window
BX = 20.0
room(BX, "boss", wall=mat("wall_red", "#8a5a4a", 0.8, tex="stripes", tscale=3.0, tmix=0.12))
BD = Vector((BX, 1.2, 0))
box("bdesk_top", (2.2, 1.0, 0.07), (BD.x, BD.y, 0.78), DESK_WOOD, bevel=0.015)
box("bdesk_front", (2.16, 0.05, 0.72), (BD.x, BD.y - 0.48, 0.39), PANEL, bevel=0.01)
box("bdesk_blotter", (0.9, 0.55, 0.01), (BD.x, BD.y - 0.05, 0.82), mat("blotter", "#2f4a3a", 0.8), bevel=0)
PHONE = Vector((BD.x + 0.7, BD.y - 0.1, 0.82))
box("phone_base", (0.24, 0.2, 0.08), (PHONE.x, PHONE.y, PHONE.z + 0.04), BLACK, bevel=0.03)
cyl("phone_dial", 0.06, 0.012, (PHONE.x, PHONE.y - 0.06, PHONE.z + 0.085), mat("dial", "#e8e2d2", 0.3), rot=(math.radians(-30), 0, 0))
box("phone_hand", (0.26, 0.06, 0.05), (PHONE.x, PHONE.y + 0.02, PHONE.z + 0.12), BLACK, bevel=0.02)
box("bchair_back", (0.7, 0.08, 0.8), (BD.x, BD.y + 0.95, 0.95), mat("leather_b", "#3a2018", 0.35), bevel=0.03)
for i in range(5):
    box(f"books{i}", (0.06, 0.25, 0.3), (BX - 3.2 + i * 0.07, 2.7, 1.2), mat(f"book{i}", ["#7a2e2e", "#2e4a7a", "#2e6a4a", "#6a5a2e", "#4a2e6a"][i], 0.6), bevel=0.004)
box("bshelf", (1.4, 0.3, 0.04), (BX - 2.9, 2.7, 1.03), DESK_WOOD, bevel=0.005)
area("A_boss_win", (BX, 4.2, 1.9), (math.radians(-90), 0, 0), 900, size=2.4, col="#dcebff")
point("L_boss", (BX, 0, 2.7), 220, "#ffe2b8", 0.3, 9)
L_BOSS_LAMP = point("L_boss_lamp", (BD.x - 0.8, BD.y + 0.1, 1.15), 25, "#ffc98a", 0.05, 4)
cyl("blamp_shade", 0.12, 0.18, (BD.x - 0.8, BD.y + 0.1, 1.2), GREEN_SHADE, rot=(0, math.pi / 2, 0))
cyl("blamp_stem", 0.012, 0.36, (BD.x - 0.8, BD.y + 0.1, 0.99), BRASS, verts=10)

# ---------------- 3. the subway car (x = 40): long car along X, benches both sides, poles, tunnel lights outside
SX = 40.0
CAR = mat("car_wall", "#c9c3b0", 0.5)
box("car_floor", (14, 2.8, 0.1), (SX, 0, -0.05), mat("car_floor", "#6a6458", 0.8, tex="noise", tmix=0.15), bevel=0)
box("car_ceil", (14, 2.8, 0.1), (SX, 0, 2.35), CAR, bevel=0)
for s in (-1, 1):
    y = s * 1.4
    box(f"car_low{s}", (14, 0.1, 0.95), (SX, y, 0.475), CAR, bevel=0)
    box(f"car_top{s}", (14, 0.1, 0.6), (SX, y, 2.05), CAR, bevel=0)
    for i in range(7):
        box(f"car_pil{s}{i}", (0.35, 0.1, 0.8), (SX - 6.3 + i * 2.1, y, 1.35), CAR, bevel=0)
    box(f"bench{s}", (12, 0.45, 0.08), (SX, y - s * 0.3, 0.45), mat("bench", "#c46a2f", 0.4), bevel=0.02)
    box(f"bench_back{s}", (12, 0.06, 0.45), (SX, y - s * 0.08, 0.7), mat("bench", "#c46a2f", 0.4), bevel=0.02)
    box(f"car_lightstrip{s}", (13, 0.15, 0.04), (SX, s * 0.7, 2.28), emissive(f"strip{s}", "#fff8e6", 9), bevel=0)
for i in range(6):
    cyl(f"pole{i}", 0.025, 2.4, (SX - 5 + i * 2.0, 0, 1.2), METAL, verts=12)
point("L_car1", (SX - 3, 0, 2.1), 300, "#fff4dc", 0.5, 7)
point("L_car2", (SX + 3, 0, 2.1), 300, "#fff4dc", 0.5, 7)
# tunnel outside both sides: dark walls with lights streaking past (animated X loop)
for s in (-1, 1):
    box(f"tunnel{s}", (40, 0.2, 4), (SX, s * 2.6, 1.2), mat("tunnel", "#24221f", 0.9), bevel=0)
    for i in range(10):
        o = box(f"tl{s}{i}", (0.35, 0.05, 0.1), (SX + 22, s * 2.45, 1.55), emissive("tunnel_light", "#ffcf7a", 12), bevel=0)
        # lights run from x = SX+22 to SX-18 at 0.9 m/frame, then jump back: one linear segment per pass
        speed, span = 0.9, 40.0
        period = span / speed
        f = -(i * 4.0) / speed
        while f < TOTAL:
            fa = max(0.0, f)
            o.location.x = SX + 22 - (fa - f) * speed; o.keyframe_insert("location", frame=fa + 1, index=0)
            fb = f + period - 0.05
            o.location.x = SX - 18; o.keyframe_insert("location", frame=fb + 1, index=0)
            f += period
        fc = o.animation_data.action.fcurves.find("location", index=0)
        for k in fc.keyframe_points:
            k.interpolation = "CONSTANT" if abs(k.co[1] - (SX - 18)) < 1e-3 else "LINEAR"

# ---------------- 4. home (x = 60): kitchen table, lamp, 14 bank books (2016) / the husband in the doorway
HX = 60.0
room(HX, "home", wall=mat("wallpaper", "#d8b98a", 0.85, tex="stripes", tscale=5.0, tmix=0.18), sky=SKY_DUSK)
TB = Vector((HX, 0.7, 0))
box("table_top", (1.6, 1.0, 0.05), (TB.x, TB.y, 0.76), mat("table", "#a9744a", 0.45, tex="wood", tscale=1.5, tmix=0.35), bevel=0.015)
for sx in (-1, 1):
    for sy in (-1, 1):
        box(f"table_leg{sx}{sy}", (0.06, 0.06, 0.74), (TB.x + sx * 0.72, TB.y + sy * 0.42, 0.37), mat("table", "#a9744a", 0.45), bevel=0.01)
plane("tablecloth", 1.1, 0.7, (TB.x, TB.y, 0.786), mat("cloth", "#e9e1cf", 0.9, tex="stripes", tscale=10, tmix=0.1), rot=(0, 0, 0))
# the 14 bank books + 3 brokerage folders, fanned on the table (pop in during shot 9)
BOOKS = []
cols = ["#2f5f9a", "#9a2f3a", "#2f7a4a", "#7a5a2f", "#5a2f7a", "#2f6a7a", "#9a6a2f"]
for i in range(14):
    a = -0.9 + i * (1.8 / 13)
    x = TB.x + 0.62 * math.sin(a); y = TB.y - 0.05 + 0.25 * math.cos(a) - 0.25
    o = box(f"bankbook{i}", (0.13, 0.19, 0.015), (x, y, 0.8 + i * 0.004), mat(f"bb{i % 7}", cols[i % 7], 0.5), bevel=0.003, rot=(0, 0, -a))
    BOOKS.append(o)
L_HOME = point("L_home", (TB.x, TB.y, 1.9), 160, "#ffd29a", 0.25, 6)
cyl("home_shade", 0.28, 0.22, (TB.x, TB.y, 2.05), mat("shade_cloth", "#e8c98a", 0.8, emit="#ffd29a", estr=1.5), verts=24)
cyl("home_cord", 0.008, 1.0, (TB.x, TB.y, 2.65), BLACK, verts=6)
box("home_door", (0.9, 0.08, 2.1), (HX + 2.6, 2.9, 1.05), PANEL, bevel=0.01)
for i in range(6):  # envelopes
    plane(f"env{i}", 0.22, 0.12, (TB.x - 0.5 + i * 0.07, TB.y + 0.32 - i * 0.01, 0.79 + i * 0.002), mat("envelope", "#efe2c6", 0.8), rot=(0, 0, 0.3 - i * 0.1))
area("A_home_win", (HX, 4.2, 1.9), (math.radians(-90), 0, 0), 500, size=2.4, col="#ffc8a0")

# ---------------- 5. the street (x = 80): brick building, steps, sign, lamp posts, sky
EX = 80.0
box("street", (30, 20, 0.1), (EX, 0, -0.05), mat("asphalt", "#4a4a52", 0.9, tex="noise", tmix=0.2), bevel=0)
box("sidewalk", (30, 4, 0.16), (EX, 3.0, 0.03), mat("concrete", "#b8b2a6", 0.85, tex="noise", tmix=0.15), bevel=0.01)
BRICK = mat("brick", "#9a4a36", 0.85, tex="brick", tscale=1.6)
box("facade", (12, 1.0, 9), (EX, 6.0, 4.5), BRICK, bevel=0)
for r in range(3):
    for c in range(5):
        x = EX - 4.4 + c * 2.2; z = 2.6 + r * 2.4
        if c == 2 and r == 0:
            continue
        box(f"fw{r}{c}", (1.0, 0.1, 1.4), (x, 5.48, z), mat("win_dark", "#2a3240", 0.15, metal=0.2), bevel=0.005)
        box(f"fsill{r}{c}", (1.2, 0.2, 0.08), (x, 5.42, z - 0.75), mat("stone", "#d8cfbe", 0.7), bevel=0.01)
        if (r + c) % 2:
            plane(f"fglow{r}{c}", 0.9, 1.3, (x, 5.42, z), emissive("warm_win", "#ffcf8a", 1.6))
box("door_frame", (1.8, 0.2, 2.8), (EX, 5.45, 1.4), mat("stone", "#d8cfbe", 0.7), bevel=0.02)
box("front_door", (1.3, 0.1, 2.4), (EX, 5.4, 1.2), mat("door_green", "#2f5a45", 0.35), bevel=0.01)
for i in range(3):
    box(f"step{i}", (2.6 - i * 0.2, 0.4, 0.15), (EX, 4.9 - i * 0.35 + 0.35, 0.18 + i * 0.15), mat("stone", "#d8cfbe", 0.7), bevel=0.01)
box("sign_board", (4.6, 0.08, 0.6), (EX, 5.42, 3.25), mat("sign_navy", "#1f2f4a", 0.4), bevel=0.02)
text("sign_txt", "HENRY STREET SETTLEMENT", (EX, 5.36, 3.25), 0.27, mat("sign_gold", "#e8c45a", 0.3, metal=0.8), font=FONT_BOLD)
for x in (-4.5, 4.5):
    cyl(f"lamppost{x}", 0.06, 3.6, (EX + x, 2.0, 1.8), BLACK, verts=12)
    cyl(f"lamphead{x}", 0.18, 0.35, (EX + x, 2.0, 3.7), emissive("lampglass", "#fff0c8", 5), verts=16)
plane("street_sky", 80, 40, (EX, 30, 10), SKY_DAY)
for i in range(6):
    tx = EX - 7.5 + i * 3
    if abs(tx - EX) < 3:
        continue
    cyl(f"trunk{i}", 0.12, 2.6, (tx, 1.6, 1.3), mat("trunk", "#5a3d2a", 0.9), verts=10)
    o = bpy.data.meshes.new(f"crown{i}"); bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0); bm.to_mesh(o); bm.free()
    cr = link(bpy.data.objects.new(f"crown{i}", o)); cr.location = (tx, 1.6, 3.2); cr.scale = (1.1, 1.1, 1.0)
    cr.data.materials.append(mat("leaves", "#4f8a3a", 0.8, tex="noise", tscale=3, tmix=0.35))
    for p in cr.data.polygons:
        p.use_smooth = True
GOLD_SMALL = mat("gold_small", "#f2c230", 0.2, metal=1.0)
GIFT = text("gift_txt", "$6.2M", (EX, 3.4, 4.3), 1.0, GOLD_SMALL, extrude=0.08, bevel=0.02)
GIFT2 = text("gift_lbl", "SCHOLARSHIPS", (EX, 3.4, 3.6), 0.34, mat("white_ink", "#ffffff", 0.6), font=FONT_BOLD)

# ---------------- 6. the gold stage (x = 100): dark void, spot-lit extruded "$9,000,000"
GX = 100.0
box("stage_floor", (30, 30, 0.1), (GX, 0, -0.05), mat("stage", "#14121a", 0.35), bevel=0)
plane("stage_back", 40, 20, (GX, 12, 6), mat("stage_back", "#1b1826", 0.9, tex="noise", tmix=0.3))
BIG = text("big_num", "$9,000,000", (GX, 0, 1.6), 0.95, GOLD, extrude=0.12, bevel=0.025)
spot("S_gold_key", (GX - 2.5, -4, 4.5), (math.radians(50), 0, math.radians(-30)), 2500, 0.7, "#fff1d0")
spot("S_gold_rim", (GX + 3, 3, 3.5), (math.radians(-60), 0, math.radians(140)), 1800, 0.8, "#9fc0ff")
point("L_gold_fill", (GX, -3, 1.2), 120, "#ffd9a0", 0.5, 8)
# a bank vault of coins: gold discs scattered on the floor
for i in range(40):
    a = i * 2.39996; r = 1.0 + 0.09 * i
    cyl(f"coin{i}", 0.12, 0.02, (GX + r * math.cos(a), 1.5 + r * math.sin(a) * 0.5, 0.01 + (i % 3) * 0.02), GOLD, rot=(0.2 * math.sin(i), 0.2 * math.cos(i), 0), verts=20)

# ---------------- world (a soft ambient so nothing goes fully black) + sun (strength keyed per shot)
wd = bpy.data.worlds.new("world"); sc.world = wd; wd.use_nodes = True
bg = wd.node_tree.nodes["Background"]; bg.inputs["Color"].default_value = hexc("#2a2c3a"); bg.inputs["Strength"].default_value = 0.35
sd = bpy.data.lights.new("sun", "SUN"); sd.energy = 3.5; sd.angle = math.radians(2.0); sd.color = hexc("#fff0d8")[:3]
SUN = link(bpy.data.objects.new("sun", sd)); SUN.rotation_euler = (math.radians(50), math.radians(10), math.radians(150))

# =================================================================== SHOTS
# story-frame boundaries from the voice
S = [0, 78, 141, 216, 333, 365, 432, 490, 563, 664, 705, 890, 940, 1097, 1262, TOTAL]

# ---- shot 1 (0-78): gold stage: "$9,000,000" rises into frame, slams on "nine", pulses; old Sylvia beside it
c1 = camera("C01", S[0], S[1], [(0, (GX - 0.4, -6.2, 1.9), (GX, 0, 1.55)), (78, (GX - 0.2, -4.6, 1.75), (GX, 0, 1.55))], lens=40)
key(BIG, "location", [(0, (GX, 0, -0.8)), (10, (GX, 0, 1.7)), (14, (GX, 0, 1.6))])
pulse(BIG, 14, 78, 1.0, 0.035, 20)
key(BIG, "scale", [(W("nine") - 2, (1.0,) * 3), (W("nine") + 2, (1.22,) * 3), (W("nine") + 8, (1.0,) * 3)])
key(BIG, "rotation_euler", [(0, (math.pi / 2, 0, -0.18)), (78, (math.pi / 2, 0, 0.12)), (890, (math.pi / 2, 0, -0.1)), (940, (math.pi / 2, 0, 0.1))])
syl_gold = actor("syl_gold", (GX - 1.9, 0.6, 0), [(0, "sj_stand_happy")], cam_face=c1, blink="sj_stand_happy_blink")
show(syl_gold, [(0, 78)])

# ---- shot 2 (78-141): home doorway: the husband, puzzled
c2 = camera("C02", S[1], S[2], [(78, (HX + 1.2, -2.4, 1.55), (HX + 2.3, 2.2, 1.35)), (141, (HX + 1.5, -1.6, 1.5), (HX + 2.3, 2.2, 1.35))], lens=35)
husb = actor("husb", (HX + 2.2, 2.3, 0), [(78, "huab_stand_neutral"), (W("husband"), "huab_stand_confused")], cam_face=c2)
show(husb, [(78, 141)])

# ---- shot 3 (141-216): the boss's office: boss at his desk, Sylvia at the door "without stealing a cent"
c3 = camera("C03", S[2], S[3], [(141, (BX - 1.2, -3.2, 1.6), (BX - 0.3, 1.5, 1.2)), (216, (BX - 0.8, -2.5, 1.55), (BX - 0.3, 1.5, 1.2))], lens=32)
boss3 = actor("boss3", (BX, 2.15, 0), [(141, "boss_sit_neutral")], cam_face=c3, blink=None)
syl3 = actor("syl3", (BX - 1.6, 0.2, 0), [(141, "syl_stand_happy"), (W("without"), "syl_stand_innocent")], cam_face=c3)
show(boss3, [(141, 216)]); show(syl3, [(141, 216)])

# ---- shot 4 (216-333): the office: Sylvia types at her desk; the calendar counts the years; young -> old on "sixty-seven"
c4 = camera("C04", S[3], S[4], [(216, (OX + 1.6, -3.6, 1.7), (OX - 0.3, 1.0, 1.15)), (300, (OX + 0.9, -2.6, 1.6), (OX - 0.5, 0.9, 1.2)), (333, (OX + 0.7, -2.3, 1.55), (OX - 0.6, 0.9, 1.2))], lens=30)
T67 = W("sixty-seven", line="who")
syl4 = actor("syl4", (DESK.x, DESK.y + 0.5, 0), [(216, "syl_sit_typing"), (T67, "sj_sit_neutral_lookside")], cam_face=c4)
show(syl4, [(216, 333)])
steps = [1, 5, 12, 20, 31, 44, 58, 67]
for i, yrs in enumerate(steps):
    a = 230 + i * ((T67 - 230) // (len(steps) - 1))
    b = 230 + (i + 1) * ((T67 - 230) // (len(steps) - 1)) if yrs != 67 else 333
    show(CAL_NUMS[yrs], [(a if i else 0, b)] + ([(1262, TOTAL)] if yrs == 67 else []))

# ---- shot 5a (333-365): a pay envelope on the desk, "SALARY"
c5 = camera("C05", S[4], S[5], [(333, (DESK.x + 0.45, DESK.y - 0.75, 1.15), (DESK.x + 0.3, DESK.y - 0.2, 0.8)), (365, (DESK.x + 0.4, DESK.y - 0.6, 1.05), (DESK.x + 0.3, DESK.y - 0.2, 0.8))], lens=45)
ENV = box("pay_env", (0.26, 0.14, 0.006), (DESK.x + 0.3, DESK.y - 0.2, 0.81), mat("payenv", "#c9a46a", 0.7), bevel=0.002, rot=(0, 0, 0.15))
ENV_T = text("pay_txt", "SALARY", (0, 0, 0.004), 0.045, CAL_TXT_M, rot=(0, 0, 0), font=FONT_BOLD); ENV_T.parent = ENV
show(ENV, [(333, 365)])

# ---- shot 5b (365-432): the subway car: old Sylvia on the bench with riders; lights streak past
c6 = camera("C06", S[5], S[6], [(365, (SX - 1.6, -0.6, 1.35), (SX, 1.2, 0.95)), (432, (SX - 0.9, -0.5, 1.3), (SX, 1.2, 0.95))], lens=28, shake=0.012)
syl6 = actor("syl6", (SX, 0.95, 0), [(365, "sj_sit_handbag")], cam_face=c6)
r1 = actor("rider1", (SX - 1.15, 0.95, 0), [(365, "rider_sit_neutral_red")], cam_face=c6)
r2 = actor("rider2", (SX + 1.3, 0.3, 0), [(365, "rider_sit_neutral_green")], cam_face=c6)
r3 = actor("rider3", (SX + 0.75, -0.25, 0), [(365, "rider_stand_holding_pole")], cam_face=c6)
for o in (syl6, r1, r2, r3):
    show(o, [(365, 432)])

# ---- shot 6 (432-563): the boss on the phone "BUY 100" -> Sylvia at her desk "BUY 5" -> the 5 shrinks on "less"
c7 = camera("C07", S[6], S[7], [(432, (BX + 0.9, -1.9, 1.55), (BX + 0.2, 1.6, 1.3)), (490, (BX + 0.6, -1.5, 1.5), (BX + 0.2, 1.6, 1.3))], lens=32)
boss7 = actor("boss7", (BX, 2.15, 0), [(432, "boss_sit_phone"), (W("bought", line="trick"), "boss_sit_holding_paper")], cam_face=c7)
show(boss7, [(432, 490)])
def bubble(name, txt, loc, f0, f1, s=1.0):
    root = link(bpy.data.objects.new(name, None)); root.location = loc
    bg_ = box(name + "_bg", (1.0 * s, 0.04, 0.42 * s), (0, 0.03, 0), mat("bubble", "#ffffff", 0.5, emit="#ffffff", estr=0.4), bevel=0.08 * s); bg_.parent = root
    tail = box(name + "_tail", (0.12 * s, 0.04, 0.16 * s), (-0.25 * s, 0.03, -0.25 * s), mat("bubble", "#ffffff", 0.5), bevel=0.02, rot=(0, 0.6, 0)); tail.parent = root
    t = text(name + "_t", txt, (0, -0.01, 0), 0.24 * s, mat("buy_green", "#2f9e57", 0.5)); t.parent = root
    show(root, [(f0, f1)]); pop_in(root, f0)
    return root
bubble("b100", "BUY 100", (BX + 0.55, 2.0, 2.25), W("bought", line="trick"), 490, 1.0)
c8 = camera("C08", S[7], S[8], [(490, (OX - 0.9, -1.9, 1.5), (OX - 0.1, 1.2, 1.2)), (563, (OX - 0.6, -1.5, 1.45), (OX - 0.1, 1.2, 1.2))], lens=32)
syl8 = actor("syl8", (DESK.x, DESK.y + 0.5, 0), [(490, "syl_sit_happy"), (W("same", line="trick"), "syl_sit_holding_paper")], cam_face=c8)
show(syl8, [(490, 563)])
b5 = bubble("b5", "BUY 5", (OX - 0.55, 1.6, 2.15), W("bought", 1, line="trick"), 563, 0.85)
key(b5, "scale", [(W("less") - 2, (0.85,) * 3), (W("less") + 6, (0.55,) * 3)])

# ---- shot 7 (563-664): the certificates pile up; daylight turns from spring to autumn to winter outside the window
c9 = camera("C09", S[8], S[9], [(563, (DESK.x - 1.3, DESK.y - 1.2, 1.25), (DESK.x - 0.55, DESK.y - 0.05, 0.9)), (664, (DESK.x - 0.8, DESK.y - 1.4, 1.5), (DESK.x - 0.55, DESK.y - 0.05, 0.95))], lens=40)
for i, o in enumerate(CERTS):
    f0 = 570 + i * 7
    show(o, ([(0, 333)] if i < 2 else []) + [(f0, TOTAL)])  # a low stack (2) in the early office shots
    pop_in(o, f0, 1.0, 5)
syl9 = actor("syl9", (DESK.x + 0.1, DESK.y + 0.5, 0), [(563, "syl_sit_neutral")], cam_face=c9)
show(syl9, [(563, 664)])
win_a = bpy.data.objects["A_office_win"]
key(win_a.data, "color", [(563, (1.0, 0.95, 0.85)), (600, (1.0, 0.75, 0.5)), (630, (0.75, 0.85, 1.0)), (664, (1.0, 0.95, 0.85))])
key(win_a.data, "energy", [(563, 900), (600, 650), (630, 1100), (664, 900)])

# ---- shot 8 (664-705): old Sylvia, a knowing smile; the drawer slides shut
c10 = camera("C10", S[9], S[10], [(664, (DESK.x + 0.8, DESK.y - 1.4, 1.3), (DESK.x, DESK.y + 0.3, 1.05)), (705, (DESK.x + 0.6, DESK.y - 1.15, 1.28), (DESK.x, DESK.y + 0.3, 1.05))], lens=34)
syl10 = actor("syl10", (DESK.x + 0.25, DESK.y + 0.5, 0), [(664, "sj_sit_neutral_lookside"), (W("told"), "sj_sit_holding_paper")], cam_face=c10)
show(syl10, [(664, 705)])
key(DRAWER, "location", [(0, (DESK.x, DESK.y - 0.2, 0.67)), (664, (DESK.x, DESK.y - 0.55, 0.67)), (W("anyone"), (DESK.x, DESK.y - 0.2, 0.67))])

# ---- shot 9 (705-890): home, 2016: the niece at the table; envelopes, then 3 + 11 books fan out
c11 = camera("C11", S[10], S[11], [(705, (HX - 1.6, -2.2, 1.75), (HX, 0.9, 0.95)), (800, (HX - 0.9, -1.7, 1.75), (HX, 0.7, 0.85)), (890, (HX - 0.2, -1.25, 1.85), (HX, 0.6, 0.8))], lens=30)
niece = actor("niece", (TB.x, TB.y + 0.75, 0), [(705, "neco_sit_neutral_paper"), (W("three", line="found"), "neco_sit_shocked_paper")], cam_face=c11)
show(niece, [(705, 890)])
t3, t11 = W("three", line="found"), W("eleven")
for i, o in enumerate(BOOKS):
    f0 = t3 + i * 3 if i < 3 else t11 + (i - 3) * 2
    show(o, [(f0, 890)]); pop_in(o, f0, 1.0, 5)

# ---- shot 10 (890-940): back on the gold stage: "around nine million dollars"
c12 = camera("C12", S[11], S[12], [(890, (GX + 0.6, -3.2, 1.3), (GX, 0, 1.6)), (940, (GX + 0.3, -4.4, 1.6), (GX, 0, 1.6))], lens=32)
key(BIG, "scale", [(889, (1.0,) * 3), (W("nine", line="total") - 1, (1.0,) * 3), (W("nine", line="total") + 3, (1.25,) * 3), (W("nine", line="total") + 9, (1.0,) * 3)])

# ---- shot 11 (940-1097): the street: students with diplomas in front of the Settlement; "$6.2M" pops on "six"
c13 = camera("C13", S[12], S[13], [(940, (EX - 3.5, -5.5, 1.6), (EX, 4.5, 2.6)), (1030, (EX - 1.2, -4.6, 1.7), (EX, 4.5, 2.6)), (1097, (EX + 0.8, -4.0, 1.7), (EX, 4.5, 2.4))], lens=26)
show(GIFT, [(W("Six"), 1097)]); pop_in(GIFT, W("Six"), 1.0, 9)
show(GIFT2, [(W("scholarships"), 1097)]); pop_in(GIFT2, W("scholarships"), 1.0, 9)
for i, (n, x) in enumerate((("st1_happy_diploma", -1.8), ("st2_laugh_diploma", -0.6), ("st3_happy_diploma", 0.6), ("st4_happy", 1.8))):
    a = actor(n[:3], (EX + x, 3.6 - (i % 2) * 0.4, 0.11), [(940, n)], cam_face=c13)
    show(a, [(940, 1097)])
key(SUN.data, "energy", [(0, 0.0), (939, 0.0), (940, 4.0), (1096, 4.0), (1097, 0.0)], "CONSTANT")

# ---- shot 12 (1097-1262): the empty desk at dusk, the clock; slow push
c14 = camera("C14", S[13], S[14], [(1097, (OX + 0.3, -3.6, 1.5), (OX - 0.1, 1.2, 1.1)), (1262, (OX + 0.1, -1.4, 1.25), (OX - 0.1, 1.2, 1.0))], lens=32)
key(win_a.data, "color", [(1096, (1.0, 0.95, 0.85)), (1097, (1.0, 0.6, 0.35))], "CONSTANT")
key(win_a.data, "energy", [(1096, 900), (1097, 500)], "CONSTANT")

# ---- shot 13 (1262-1335): the calendar "67" close-up, then fade (the compose step fades to black)
c15 = camera("C15", S[14], S[15], [(1262, (CAL.x + 1.6, CAL.y - 0.2, CAL.z + 0.05), (CAL.x, CAL.y, CAL.z - 0.05)), (TOTAL, (CAL.x + 0.95, CAL.y - 0.1, CAL.z), (CAL.x, CAL.y, CAL.z - 0.05))], lens=40)

# office actors that are only in some shots must be hidden in the empty-desk and calendar shots: done by show() above.
# the gold-stage objects are seen only from C01 / C12, the street only from C13 (separate places), so no hiding needed.

sc.camera = c1

# =================================================================== render settings
if CYCLES:
    sc.render.engine = "CYCLES"
    sc.cycles.samples = int(arg("--samples", 64)); sc.cycles.use_denoising = True
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        for t in ("OPTIX", "CUDA", "HIP", "ONEAPI", "METAL"):
            try:
                prefs.compute_device_type = t; prefs.get_devices()
                if any(d.type == t for d in prefs.devices):
                    for d in prefs.devices:
                        d.use = True
                    sc.cycles.device = "GPU"; break
            except Exception:
                pass
    except Exception:
        pass
else:
    try:
        sc.render.engine = "BLENDER_EEVEE_NEXT"   # Blender 4.2 - 4.5
    except TypeError:
        sc.render.engine = "BLENDER_EEVEE"
    ee = sc.eevee
    ee.taa_render_samples = int(arg("--samples", 32))
    ee.use_raytracing = True
    ee.use_shadows = True
    ee.fast_gi_method = "GLOBAL_ILLUMINATION"
sc.render.film_transparent = False
sc.render.use_motion_blur = True
sc.render.motion_blur_shutter = 0.35
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGB"
sc.render.filepath = os.path.join(HERE, "render", "frames", "")
# re-running continues where it stopped: finished frames are skipped, frames in progress are claimed by placeholders
sc.render.use_overwrite = False
sc.render.use_placeholder = True
# compositor: a soft glow on bright things (lamps, gold) + a vignette-ish lens distortion
sc.use_nodes = True
nt = sc.node_tree; nt.nodes.clear()
rl = nt.nodes.new("CompositorNodeRLayers")
gl = nt.nodes.new("CompositorNodeGlare"); gl.glare_type = "FOG_GLOW"; gl.quality = "MEDIUM"; gl.threshold = 1.0; gl.size = 7; gl.mix = -0.6
ld = nt.nodes.new("CompositorNodeLensdist"); ld.inputs["Dispersion"].default_value = 0.008
out = nt.nodes.new("CompositorNodeComposite")
nt.links.new(rl.outputs["Image"], gl.inputs["Image"]); nt.links.new(gl.outputs["Image"], ld.inputs["Image"]); nt.links.new(ld.outputs["Image"], out.inputs["Image"])

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "secretary.blend"), relative_remap=True)
print("saved secretary.blend")

frames = arg("--frames")
if frames:
    for f in [int(x) for x in frames.split(",")]:
        sc.frame_set(f)
        sc.render.filepath = os.path.join(arg("--out", os.path.join(HERE, "render", "stills")), f"f{f:04d}.png")
        bpy.ops.render.render(write_still=True)
        print("still", f)
elif "--render" in ARGS:
    bpy.ops.render.render(animation=True)
