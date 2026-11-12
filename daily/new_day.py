# Set up the project for day NN from your recording: sync the kit, prepare the presenter,
# transcribe word by word (OpenMontage transcriber) and write words.ts + index.tsx.
# Usage (from OpenMontage/): .venv/bin/python projects/motion-kit/daily/new_day.py <NN|name> <recording> [language] [--project <project-dir>]
# --project (or VIDEO_PROJECT) picks the studio project: its prefix names the OpenMontage project and its brand re-skins the kit.
# Without it the project prefix comes from the folder name (e.g. myproj-day01, MyprojDay01).
import sys, os, json, shutil, subprocess
sys.path.insert(0, '.')
from tools.tool_registry import registry
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import studio
registry.discover()
# NN = day number (project wf-diaNN, compositions WfDiaNN / WfDiaNN169) or a name such as "clip-pricing"
argv = sys.argv[1:]
project = None
if '--project' in argv:
    i = argv.index('--project'); project = argv[i + 1]; del argv[i:i + 2]
S = studio.load(project)
pre = S['prefix']; Pre = pre[:1].upper() + pre[1:]
arg = argv[0]
if arg.isdigit():
    nn = f"{int(arg):02d}"; proj, comp = f"{pre}-dia{nn}", f"{Pre}Dia{nn}"
else:
    proj = f"{pre}-" + arg; comp = Pre + "".join(w.capitalize() for w in arg.replace("_", "-").split("-"))
rec = os.path.abspath(argv[1])
lang = argv[2] if len(argv) > 2 else None
KIT = os.path.abspath('projects/motion-kit')
P = os.path.abspath(f'projects/{proj}')
os.makedirs(P + '/artifacts', exist_ok=True); os.makedirs(P + '/renders', exist_ok=True)
subprocess.run([KIT + '/sync-kit.sh', P] + ([S['brand_dir']] if S['brand_dir'] else []), check=True)
# presenter: H.264/AAC mp4, loudness normalised (same as the reference days)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', rec, '-c:v', 'libx264', '-crf', '18', '-preset', 'fast',
                '-pix_fmt', 'yuv420p', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k',
                P + '/public/presenter.mp4'], check=True)
# background music is optional: drop your own file at <project>/public/music.mp3
inp = {"input_path": P + '/public/presenter.mp4', "model_size": "small", "output_dir": P + '/artifacts'}
if lang:
    inp["language"] = lang
r = registry._tools['transcriber'].execute(inp)
if not r.success:
    sys.exit("transcriber failed: " + (r.error or ''))
words = [{"word": w["word"].strip(), "start": round(w["start"], 2), "end": round(w["end"], 2)}
         for w in (r.data.get("word_timestamps") or [])]
json.dump(r.data, open(P + '/artifacts/transcript.json', 'w'), indent=1)
open(P + '/words.ts', 'w').write("// Word-level transcript (seconds).\nimport type { Word } from './kit/Stage';\nexport const WORDS: Word[] = "
                                 + json.dumps(words) + ";\n")
# entry with every animation family (kit/fx included), 
idx = open(os.path.join(KIT, 'daily', 'index-template.tsx')).read().replace('__COMP__', comp)
open(P + '/index.tsx', 'w').write(idx)
# STACK house-style scaffold for video.ts (never overwrite an existing one)
vt = P + '/video.ts'
if not os.path.exists(vt):
    _dur = subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', P + '/public/presenter.mp4']).decode().strip()
    open(vt, 'w').write(open(os.path.join(KIT, 'daily', 'video-template.ts')).read().replace('__PROJECT__', os.path.basename(P)).replace('__DURATION__', str(round(float(_dur), 1))))
# presenter cut-out (Apple Vision, local) for the cutout / depth layouts
cut = P + '/public/presenter-cutout.webm'
cut_ok = subprocess.run([KIT + '/daily/make_cutout.sh', P + '/public/presenter.mp4', cut]).returncode == 0
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', P + '/public/presenter.mp4']).decode().strip())
print(json.dumps({"project": P, "compositions": [comp, comp + "169"], "studio": S["project"], "duration": round(dur, 2), "cutout": "presenter-cutout.webm" if cut_ok else None, "words": len(words), "language": r.data.get("language"),
                  "text": " ".join(s["text"].strip() for s in r.data.get("segments", []))}))
