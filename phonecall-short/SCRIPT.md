# The $100 Million Phone Call — script, shots and posting

**A FICTIONAL finance story, not a real event.** The video says so on screen ("A FICTIONAL STORY", first 2.5 s and
last 2.3 s) and the description must say so too. Never present it as a true story.

Vertical 1080x1920, 30 fps, 57.0 s (1710 frames). Built from the user's scene brief and the ANIMATION MASTER ENGINE
guide (same three.js + Remotion engine as the channel's other shorts): 28 shots, none longer than about 3 s, the camera
always moving, a white flash on the first frame. The look is the channel's cartoon 3D style (not photo-realistic): New
York sets are painted cards (night skyline from a penthouse window, a mansion, a sports car, a private jet, an office,
trading screens, a sunrise skyline) standing on the landing stage, with the businessman, his advisor and two bankers.

Voice: Kokoro am_fenrir at 0.95, 131 words, the brief's voice-over word for word ("$100 MILLION" read as "a hundred
million dollars"). On-screen lines from the brief, slammed in at the top with key words in yellow; word captions at the
bottom with key words in yellow. Score: D minor suspense pulse, heartbeat and ticking under the phone call, a hit on
"collapsed", the music stops on the lesson line, warm D major at sunrise. A smartphone ringtone on "his phone rang".
Mix -14.1 LUFS, true peak -1.5 dBTP (measured, not listened to).

| scene | frames | shots |
|---|---|---|
| 1 hook | 0-172 | night penthouse: close-up, low angle, wide at the window, close-up; "$100,000,000... GONE?" |
| 2 perfect life | 172-410 | day penthouse, the mansion, the red car, the private jet, coins raining; "HE HAD EVERYTHING." |
| 3 the call | 410-498 | the phone ringing on the desk; he answers; "ONE PHONE CALL." |
| 4 bad news | 498-748 | the advisor in his dark office; him listening, close-ups; flash on "collapsed"; "YOUR INVESTMENT HAS COLLAPSED." |
| 5 collapse | 748-915 | trading screens falling to -87 %, papers flying, two bankers with briefcases; "MILLIONS LOST." |
| 6 everything changes | 915-1075 | dusk, empty office, alone on a stool; "FROM MILLIONS TO NOTHING." |
| 7 the lesson | 1075-1305 | at the night window, close-up, low angle; "NEVER THINK YOU'RE UNTOUCHABLE." |
| 8 final message | 1305-1710 | sunrise skyline: wide, close-ups, wide, aerial; "WHAT WOULD YOU DO?" |

## Render (cmd, drive D)
```
cd /d D:\Projekti\SeminarskiEDU
git stash
git pull
cd finance-short
set TEMP=D:\remotion-tmp
set TMP=D:\remotion-tmp
npx remotion render src/index.ts PhonecallShort D:\Videi\100m-phone-call.mp4 --codec h264 --crf 17 --gl=angle
```

## Posting
**Title:** The $100 Million Phone Call

**Description:**
```
He had $100 million. Then one phone call destroyed his entire life.
A fictional story about the one mistake rich people make: believing their money can never disappear.
Making money makes you rich. Protecting it keeps you wealthy. Would you risk everything to become a millionaire?

This is a fictional story, not a real event.

#shorts #money #finance #wealth #moneystories
```
**Tags:** money story, rich to broke, lost everything, millionaire mindset, wealth protection, investment collapse,
financial disaster, risk management, diversification, money lessons, finance shorts, fictional story, vacko money
