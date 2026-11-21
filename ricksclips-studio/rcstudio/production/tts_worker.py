"""Isolated pyttsx3 synthesis (run as a subprocess by tts.Pyttsx3TTS).

usage: python -m rcstudio.production.tts_worker TEXT_FILE OUT_WAV RATE_WPM [VOICE_SUBSTRING]
"""
import sys


def main() -> int:
    import pyttsx3

    text = open(sys.argv[1], encoding="utf-8").read()
    out, rate = sys.argv[2], int(sys.argv[3])
    want = sys.argv[4].lower() if len(sys.argv) > 4 else ""
    engine = pyttsx3.init()
    engine.setProperty("rate", rate)
    if want:
        for v in engine.getProperty("voices"):
            if want in (v.name or "").lower() or want in (v.id or "").lower():
                engine.setProperty("voice", v.id)
                break
    engine.save_to_file(text, out)
    engine.runAndWait()
    engine.stop()
    return 0


if __name__ == "__main__":
    sys.exit(main())
