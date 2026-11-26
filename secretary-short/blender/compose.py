# Step 3: the finished Short. Puts the rendered frames (render/frames/####.png), the soundtrack (audio/mix.wav) and the
# word-group captions together in Blender's Video Sequencer and writes an H.264 MP4 with AAC sound.
#   blender -b -P compose.py                    -> ../out/secretary-short.mp4 (no captions, picture fills 1080x1920)
#   blender -b -P compose.py -- --caps          -> with burned-in captions
import bpy, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
FPS, TOTAL = 30, 1335
FRAMES = os.path.join(HERE, "render", "frames")
OUT = os.path.join(HERE, "..", "out", "secretary-short.mp4")

files = sorted(f for f in os.listdir(FRAMES) if f.endswith(".png"))
if len(files) < TOTAL:
    print(f"WARNING: only {len(files)} of {TOTAL} frames are rendered; the video will be incomplete")

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = FPS; sc.frame_start, sc.frame_end = 1, TOTAL
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1080, 1920, 100
sc.view_settings.view_transform = "Standard"  # the frames are already graded
se = sc.sequence_editor_create()

img = se.sequences.new_image("frames", os.path.join(FRAMES, files[0]), channel=1, frame_start=1)
for f in files[1:]:
    img.elements.append(f)
img.blend_type = "REPLACE"
# frames rendered at a smaller size (SCALE=50 test) are scaled up so the picture always fills the whole Short
fw, fh = bpy.data.images.load(os.path.join(FRAMES, files[0])).size
img.transform.scale_x = 1080 / fw
img.transform.scale_y = 1920 / fh
snd = se.sequences.new_sound("mix", os.path.join(HERE, "audio", "mix.wav"), channel=2, frame_start=1)

# fade to black over the last 0.6 s
col = se.sequences.new_effect("black", "COLOR", channel=3, frame_start=TOTAL - 18, frame_end=TOTAL + 1)
col.color = (0, 0, 0); col.blend_type = "ALPHA_OVER"
col.blend_alpha = 0.0; col.keyframe_insert("blend_alpha", frame=TOTAL - 18)
col.blend_alpha = 1.0; col.keyframe_insert("blend_alpha", frame=TOTAL)

if "--caps" in ARGS:
    words = json.load(open(os.path.join(HERE, "..", "voice", "words.json")))
    GOLD = {"nine", "million", "husband", "boss", "stealing", "sixty-seven", "subway", "nineties", "same", "less", "copied",
            "waited", "decades", "never", "anyone", "three", "eleven", "banks", "gave", "six", "scholarships", "long", "years"}
    norm = lambda x: re.sub(r"[^a-z0-9'-]", "", x.lower())
    groups, g = [], []
    for w in words:
        if g and (w["line"] != g[-1]["line"] or w["s"] - g[-1]["e"] > 0.25):
            groups.append(g); g = []
        g.append(w)
        txt = " ".join(x["w"] for x in g)
        if len(g) == 3 or re.search(r"[.,?!]$", w["w"]) or len(txt) > 15:
            groups.append(g); g = []
    if g:
        groups.append(g)
    font = bpy.data.fonts.load(os.path.join(HERE, "fonts", "InterDisplay-Black.otf"))
    for i, g in enumerate(groups):
        a = round(g[0]["s"] * FPS) + 1
        b = round((groups[i + 1][0]["s"] if i + 1 < len(groups) else g[-1]["e"] + 0.4) * FPS) + 1
        b = min(max(b, a + 6), TOTAL)
        t = se.sequences.new_effect(f"cap{i}", "TEXT", channel=4 + (i % 2), frame_start=a, frame_end=b)
        t.text = " ".join(re.sub(r"[.,]$", "", x["w"]) for x in g).upper()
        t.font = font; t.font_size = 92
        key = any(norm(x["w"]) in GOLD for x in g)
        t.color = (1.0, 0.78, 0.18, 1) if key else (1, 1, 1, 1)
        t.use_outline = True; t.outline_color = (0.14, 0.09, 0.15, 1); t.outline_width = 0.18
        t.use_shadow = True; t.shadow_color = (0, 0, 0, 0.45)
        t.location = (0.5, 0.33); t.align_x = "CENTER"; t.align_y = "CENTER"
        t.wrap_width = 0.85
        t.blend_type = "ALPHA_OVER"

r = sc.render
r.image_settings.file_format = "FFMPEG"
r.ffmpeg.format = "MPEG4"; r.ffmpeg.codec = "H264"
r.ffmpeg.constant_rate_factor = "HIGH"; r.ffmpeg.ffmpeg_preset = "GOOD"
r.ffmpeg.audio_codec = "AAC"; r.ffmpeg.audio_bitrate = 256; r.ffmpeg.audio_mixrate = 48000; r.ffmpeg.audio_channels = "STEREO"
os.makedirs(os.path.dirname(OUT), exist_ok=True)
r.filepath = OUT
bpy.ops.render.render(animation=True)
print("done:", os.path.abspath(OUT))
