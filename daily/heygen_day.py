# No-recording day: the day's script spoken in the cloned voice (HeyGen TTS) and lip-synced onto a take
# from the take library (HeyGen Lipsync, precision). The output mp4 then goes through new_day.py like a recording.
# Spend guard: refuses when this month's total + this estimate would pass monthly_cap_usd in the config.
# Usage (from OpenMontage/): .venv/bin/python projects/motion-kit/daily/heygen_day.py <NN> <script.md|script.txt> <out.mp4> [--mood <word in the take file name>] [--take <file in the library>] [--project <dir>] [--dry-run]
# Exit codes: 0 ok, 2 bad input, 3 over the monthly cap or cap is 0, 4 HeyGen wallet too low, 5 HeyGen error.
import sys, os, re, json, csv, time, glob, subprocess, datetime, getpass, requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import studio   # settings come from <project>/video/studio.json (--project, VIDEO_PROJECT, default: current directory)
API = 'https://api.heygen.com'
PRICE = {'tts': 0.0035, 'lipsync': 0.03}   # US$ per second of speech, validated 2026-09-26
WPM = 150
VIDEO_EXT = ('.mp4', '.mov', '.m4v')

def die(code, msg): print(json.dumps({'ok': False, 'error': msg})); sys.exit(code)
def probe(f): return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).decode().strip())

args = [a for a in sys.argv[1:] if not a.startswith('--')]
flags = sys.argv[1:]
if len(args) < 3: die(2, 'usage: heygen_day.py <NN> <script.md|script.txt> <out.mp4> [--mood X] [--dry-run]')
nn, src, out = f"{int(args[0]):02d}", args[1], os.path.abspath(args[2])
dry = '--dry-run' in flags
mood = flags[flags.index('--mood') + 1] if '--mood' in flags else None
take_name = flags[flags.index('--take') + 1] if '--take' in flags else None   # the base video to lip-sync onto
if os.environ.get('HEYGEN_DAY_CONFIG'):   # explicit config file (tests)
    CFG = os.path.expanduser(os.environ['HEYGEN_DAY_CONFIG']); cfg = json.load(open(CFG))
    ledger = os.path.expanduser(cfg.get('ledger', os.path.join(os.path.dirname(CFG), 'heygen-spend.csv')))
else:
    S = studio.load(flags[flags.index('--project') + 1] if '--project' in flags else None)
    cfg = dict(S['heygen'], monthly_cap_usd=S['caps_usd']['heygen'], library=S['heygen']['library'])
    ledger = studio.ledger(S, 'heygen')
cap = float(cfg.get('monthly_cap_usd', 0))
library = os.path.expanduser(cfg['library'])
if not cfg.get('voice_id'): die(2, 'no HeyGen voice_id for this project')

# 1. script text: only what is read aloud. "## Teleprompter" (or a panel "=== TELEPROMPTER ===" block), else a "## Script" section, else the whole file
text = open(src).read()
m = (re.search(r'^={2,}\s*TELEPROMPTER\s*={2,}\s*\n(.*?)(?=^={2,}\s*\S|\Z)', text, re.M | re.S | re.I)
     or re.search(r'^##\s*Teleprompter[^\n]*\n(.*?)(?=^##\s|\Z)', text, re.M | re.S)
     or re.search(r'^##\s*Script[^\n]*\n(.*?)(?=^##\s|\Z)', text, re.M | re.S))
script = (m.group(1) if m else text)
script = re.sub(r'^\s*TITLE\s*:.*$|^\s*———.*$|^\s*\[[^\]]*\]\s*$|^\s*\d+ words.*$', '', script, flags=re.M | re.I)   # title, PART lines, [ON SCREEN]/[CUT] notes
script = re.sub(r'\[[^\]]*\]', '', script)
script = re.sub(r'[*_`>#]', '', script).strip()
words = len(script.split())
if words < 20: die(2, f'script too short ({words} words) in {src}')
est_sec = words / WPM * 60
est = round(est_sec * (PRICE['tts'] + PRICE['lipsync']), 2)

# 2. monthly cap
month = datetime.date.today().strftime('%Y-%m')
rows = list(csv.DictReader(open(ledger))) if os.path.exists(ledger) else []
spent = round(sum(float(r['usd']) for r in rows if r['date'].startswith(month)), 2)
if cap <= 0: die(3, 'monthly_cap_usd is 0: HeyGen mode is off until you set caps_usd.heygen in video/studio.json')
if spent + est > cap: die(3, f'over the monthly cap: spent US$ {spent} + estimate US$ {est} > cap US$ {cap}')

# 3. take: least recently used, preferring the mood word in the file name (e.g. shirt2-34-calm.mp4)
takes = sorted(f for f in glob.glob(os.path.join(library, '*')) if f.lower().endswith(VIDEO_EXT))
if not takes: die(2, f'no takes in {library}')
last_use = {}
for r in rows: last_use[r['take']] = r['date']
def usable(f): return probe(f) >= est_sec / 1.15
cands = [f for f in takes if usable(f)]
if not cands: die(2, f'no take is long enough for ~{est_sec:.0f} s of speech')
if take_name:
    if not any(os.path.basename(f) == take_name for f in takes): die(2, f'take {take_name} not in {library}')
    cands = [f for f in cands if os.path.basename(f) == take_name]
    if not cands: die(2, f'take {take_name} is too short for ~{est_sec:.0f} s of speech: shorten the script')
pref = [f for f in cands if mood and mood.lower() in os.path.basename(f).lower()] or cands
take = min(pref, key=lambda f: (last_use.get(os.path.basename(f), ''), os.path.basename(f)))

# 4. HeyGen key (macOS Keychain, never printed) and wallet (free call)
key = subprocess.run(['security', 'find-generic-password', '-a', getpass.getuser(), '-s', 'HEYGEN_API_KEY', '-w'], capture_output=True, text=True).stdout.strip()
if not key: die(5, 'HEYGEN_API_KEY not found in the Keychain')
H = {'x-api-key': key}
def api(method, path, **kw):
    r = requests.request(method, API + path, headers=H, timeout=120, **kw)
    try: j = r.json()
    except Exception: j = {}
    if not r.ok: die(5, f'HeyGen {method} {path} -> {r.status_code}: {json.dumps(j)[:300]}')
    return j.get('data', j) if isinstance(j, dict) else j
me = api('GET', '/v3/users/me')
w = (me.get('wallet') or {}) if isinstance(me, dict) else {}
bal = float(w['remaining_balance']) if w.get('remaining_balance') is not None else None
if bal is not None and bal < est: die(4, f'HeyGen wallet US$ {bal} is below the estimate US$ {est}')

work = os.path.join(os.path.dirname(out), '_heygen'); os.makedirs(work, exist_ok=True)
plan = {'day': nn, 'take': os.path.basename(take), 'words': words, 'est_seconds': round(est_sec, 1), 'est_usd': est,
        'month_spent_usd': spent, 'cap_usd': cap, 'wallet_usd': bal}
if dry:
    print(json.dumps(dict(plan, ok=True, dry_run=True))); sys.exit(0)

# 5. voice (HeyGen TTS with the cloned voice; try engines because the saved default can be unavailable)
audio = None
for eng in [cfg.get('engine'), 'elevenlabs', 'starfish', None]:
    body = {'text': script, 'voice_id': cfg['voice_id']}
    if eng: body['engine'] = eng
    r = requests.post(API + '/v3/voices/speech', headers=H, json=body, timeout=180)
    if r.ok: d = r.json().get('data', r.json()); audio = d.get('audio_url') or (d.get('audio') or {}).get('url'); break
    if r.status_code != 400: die(5, f'TTS -> {r.status_code}: {r.text[:300]}')
if not audio: die(5, 'TTS returned no audio_url')
voice = os.path.join(work, f'voice-day{nn}.mp3')
open(voice, 'wb').write(requests.get(audio, timeout=180).content)
vsec = probe(voice)

# 6. base: the take trimmed to 108% of the voice (HeyGen rejects >15% length difference), <= 32 MB, 1440p when it fits
base = os.path.join(work, f'base-dia{nn}.mp4')
for h, crf in [(1440, 26), (1440, 30), (1080, 26), (1080, 32)]:
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', take, '-t', f'{min(probe(take), vsec * 1.08):.2f}', '-vf', f'scale=-2:min({h}\\,ih)',
                    '-c:v', 'libx264', '-crf', str(crf), '-preset', 'fast', '-c:a', 'aac', '-b:a', '96k', base], check=True)   # keep the take's own audio: HeyGen lipsync rejects a video with no audio track (2026-11-10)
    if os.path.getsize(base) <= 31 * 1024 * 1024: break
else: die(5, 'could not fit the base under 32 MB')
with open(base, 'rb') as fh: asset = api('POST', '/v3/assets', files={'file': (os.path.basename(base), fh, 'video/mp4')})
asset_id = asset.get('asset_id') or asset.get('id')

# 7. lipsync, wait, download
d = api('POST', '/v3/lipsyncs', json={'video': {'type': 'asset_id', 'asset_id': asset_id}, 'audio': {'type': 'url', 'url': audio},
                                      'mode': 'precision', 'keep_the_same_format': True})
lid = d.get('lipsync_id') or d.get('id') or d.get('video_id')
url = None
for _ in range(150):
    time.sleep(8)
    s = api('GET', f'/v3/lipsyncs/{lid}'); st = str(s.get('status', '')).lower()
    if st in ('completed', 'complete', 'success'): url = s.get('video_url') or (s.get('video') or {}).get('url'); break
    if st in ('failed', 'error'): die(5, f'lipsync failed: {json.dumps(s)[:300]}')
if not url: die(5, 'lipsync took more than 20 minutes')
open(out, 'wb').write(requests.get(url, timeout=600).content)

# 8. ledger (cost from the real voice length)
usd = round(vsec * (PRICE['tts'] + PRICE['lipsync']), 2)
new = not os.path.exists(ledger)
with open(ledger, 'a', newline='') as fh:
    w = csv.writer(fh)
    if new: w.writerow(['date', 'day', 'take', 'seconds', 'usd'])
    w.writerow([datetime.date.today().isoformat(), nn, os.path.basename(take), round(vsec, 1), usd])
print(json.dumps(dict(plan, ok=True, output=out, seconds=round(vsec, 1), usd=usd, month_spent_usd=round(spent + usd, 2))))
