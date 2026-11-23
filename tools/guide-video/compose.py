# Puts the voice, captions and a soft music bed on a recorded run, then writes the small copy
# the app plays (public/guide/) and its first frame.
# Usage: python3 tools/guide-video/compose.py <en|es>
import json, re, subprocess, sys
from pathlib import Path

LANG = sys.argv[1]
HERE = Path(__file__).resolve().parent
V = HERE / '.work'
REPO = HERE.parents[1]
script = {s['id']: s[LANG] for s in json.load(open(HERE / 'script.json'))}  # in scene order
run = json.load(open(V / f'marks-{LANG}.json'))
marks, end = run['marks'], run['end']
LEAD = 0.15  # the voice starts just after each scene does
start = max(0.0, marks['s1-intro'] - 0.4)
length = end - start


def dur(p):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)]))


def ts(t):
    t = max(0.0, t)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


# Captions: each line split into sentences, timed by length across its narration.
events = []
for sid, text in script.items():
    t0 = marks[sid] - start + LEAD
    d = dur(V / 'audio' / f'{LANG}-{sid}.mp3')
    parts = [p.strip() for p in re.split(r'(?<=[.!?:])\s+', text) if p.strip()]
    # Keep tiny fragments ("Not feeling it?") with the next one.
    merged = []
    for p in parts:
        if merged and len(merged[-1]) < 28:
            merged[-1] += ' ' + p
        else:
            merged.append(p)
    # Long sentences split at a comma near the middle, so a caption never runs past two lines.
    short = []
    for p in merged:
        while len(p) > 64 and ', ' in p:
            cuts = [i for i in range(len(p)) if p.startswith(', ', i)]
            cut = min(cuts, key=lambda i: abs(i - len(p) / 2))
            short.append(p[:cut + 1]); p = p[cut + 2:]
        short.append(p)
    merged = short
    total = sum(len(p) for p in merged)
    t = t0
    for p in merged:
        span = d * len(p) / total
        events.append((t, t + span + 0.15, p))
        t += span

ass = [
    '[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 780', 'PlayResY: 1688', 'WrapStyle: 0', '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    # White on a translucent plum box (the app ink), near the top, below the camera cutout, so taps stay visible.
    'Style: Cap,Inter SemiBold,40,&H00FFFFFF,&H00FFFFFF,&H3A221A2B,&H3A221A2B,0,0,0,0,100,100,0,0,3,14,0,8,60,60,130,1',
    '', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
]
for a, b, text in events:
    ass.append(f'Dialogue: 0,{ts(a)},{ts(b)},Cap,,0,0,0,,{text}')
(V / f'captions-{LANG}.ass').write_text('\n'.join(ass), encoding='utf-8')

# Audio: each line at its scene, plus the intro music, soft and looping, under it all.
inputs = ['-ss', f'{start:.3f}', '-t', f'{length:.3f}', '-i', str(V / f'screen-{LANG}.mp4')]
filters = []
labels = []
for i, sid in enumerate(script, start=1):
    inputs += ['-i', str(V / 'audio' / f'{LANG}-{sid}.mp3')]
    delay = int((marks[sid] - start + LEAD) * 1000)
    filters.append(f'[{i}:a]aresample=48000,adelay={delay}|{delay},volume=1.0[v{i}]')
    labels.append(f'[v{i}]')
m = len(script) + 1
inputs += ['-stream_loop', '-1', '-i', str(REPO / 'public/intro/music.m4a')]
filters.append(f'[{m}:a]aresample=48000,atrim=0:{length:.3f},volume=0.10,afade=t=in:d=1.5,afade=t=out:st={length - 2.5:.3f}:d=2.5[music]')
filters.append(f'{"".join(labels)}[music]amix=inputs={len(labels) + 1}:normalize=0:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]')
filters.append(f"[0:v]subtitles='{V / f'captions-{LANG}.ass'}',fade=t=in:d=0.4,fade=t=out:st={length - 0.6:.3f}:d=0.6[v]")

(V / 'out').mkdir(exist_ok=True)
out = V / 'out' / ('Closet-guide-English.mp4' if LANG == 'en' else 'Closet-guia-Espanol.mp4')
cmd = ['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(filters), '-map', '[v]', '-map', '[a]',
       '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', '30',
       '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-t', f'{length:.3f}', str(out)]
subprocess.run(cmd, check=True)
print(out, f'{dur(out):.1f}s', f'{out.stat().st_size / 1e6:.1f} MB')

# The copy the app plays: under 5 MB (docs/assets.md), text still sharp at phone size.
name = 'guia-es' if LANG == 'es' else 'guide-en'
small = REPO / 'public' / 'guide' / f'{name}.mp4'
small.parent.mkdir(exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(out), '-c:v', 'libx264', '-crf', '31', '-preset', 'slow',
                '-tune', 'stillimage', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k',
                '-ac', '1', '-movflags', '+faststart', str(small)], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '1.2', '-i', str(small), '-frames:v', '1', '-vf', 'scale=586:-1',
                '-c:v', 'libwebp', '-quality', '78', str(small.parent / f'poster-{LANG}.webp')], check=True)
size = small.stat().st_size / 1e6
print(small, f'{size:.2f} MB', '(over 5 MB: raise -crf)' if size > 5 else '')
