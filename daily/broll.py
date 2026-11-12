# B-roll library for every project: real stock footage (Pexels, Pixabay as fallback; both free, keys in OpenMontage/.env or env vars)
# saved once in <project>/video/media/broll/<topic>/ and reused across videos. Clips are cut to a few seconds,
# 1920x1080 30 fps H.264, muted, ready for the kit's `broll` element (it crops to 9:16 by itself).
# Usage (from OpenMontage/):
#   python3 DAILY/broll.py fetch "<search>" [--topic roofing] [--n 3] [--len 4] --project <project-dir>
#   python3 DAILY/broll.py list --project <project-dir>
#   python3 DAILY/broll.py use <topic> <project public dir> [--n 2]   # copies clips into public/broll/, prints their src
# Prints JSON. Credits (author, page url, source) are kept in <project>/video/media/broll/broll.json.
import sys, os, json, re, subprocess, shutil, urllib.request, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import studio

OM = os.environ.get('OPENMONTAGE_DIR', os.getcwd())   # run from the OpenMontage checkout, or set OPENMONTAGE_DIR

def env_key(name):
    if os.environ.get(name): return os.environ[name]
    try:   # macOS Keychain (env var and OpenMontage/.env are checked first)
        v = subprocess.run(['security', 'find-generic-password', '-s', name, '-w'], capture_output=True, text=True).stdout.strip()
        if v: return v
    except Exception: pass
    p = os.path.join(OM, '.env')
    if os.path.exists(p):
        for line in open(p):
            if line.strip().startswith(name + '='): return line.split('=', 1)[1].strip().strip('"\'')
    return None

def get_json(url, headers=None):
    req = urllib.request.Request(url, headers={'User-Agent': 'motion-kit/1.0', **(headers or {})})
    with urllib.request.urlopen(req, timeout=30) as r: return json.load(r)

def pexels(q, n):
    k = env_key('PEXELS_API_KEY')
    if not k: return []
    d = get_json('https://api.pexels.com/videos/search?' + urllib.parse.urlencode({'query': q, 'per_page': n * 3, 'orientation': 'landscape', 'size': 'medium'}), {'Authorization': k})
    out = []
    for v in d.get('videos', []):
        files = sorted([f for f in v['video_files'] if f.get('width') and 1280 <= f['width'] <= 2560 and f.get('file_type') == 'video/mp4'], key=lambda f: abs(f['width'] - 1920))
        if files and v.get('duration', 0) >= 3:
            out.append({'source': 'pexels', 'id': str(v['id']), 'url': files[0]['link'], 'page': v['url'], 'author': v['user']['name'], 'duration': v['duration']})
    return out

def pixabay(q, n):
    k = env_key('PIXABAY_API_KEY')
    if not k: return []
    d = get_json('https://pixabay.com/api/videos/?' + urllib.parse.urlencode({'key': k, 'q': q, 'per_page': max(3, n * 4), 'safesearch': 'true', 'video_type': 'film'}))
    out = []
    for v in d.get('hits', []):
        f = v['videos'].get('large') if v['videos'].get('large', {}).get('url') else v['videos'].get('medium')
        if f and f.get('url') and v.get('duration', 0) >= 3:
            out.append({'source': 'pixabay', 'id': str(v['id']), 'url': f['url'], 'page': v['pageURL'], 'author': v['user'], 'duration': v['duration']})
    return out

def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def fetch(S, query, topic, n, length):
    root = os.path.join(S['media_dir'], 'broll'); os.makedirs(root, exist_ok=True)
    idx_p = os.path.join(root, 'broll.json')
    idx = json.load(open(idx_p)) if os.path.exists(idx_p) else {'clips': []}
    topic = slug(topic or query); d = os.path.join(root, topic); os.makedirs(d, exist_ok=True)
    have = {(c['source'], c['id']) for c in idx['clips']} | {tuple(x) for x in idx.get('blocked', [])}
    if not (env_key('PEXELS_API_KEY') or env_key('PIXABAY_API_KEY')):
        return {'error': 'no stock key: add PEXELS_API_KEY (free, pexels.com/api) to OpenMontage/.env or the Keychain', 'topic': topic, 'new': []}
    cands = [c for c in pexels(query, n) + pixabay(query, n) if (c['source'], c['id']) not in have]
    got = []
    for c in cands:
        if len(got) >= n: break
        out = os.path.join(d, f"{topic}-{c['source']}-{c['id']}.mp4")
        tmp = out + '.dl'
        try:
            subprocess.run(['curl', '-sSfL', '--max-time', '120', '-o', tmp, c['url']], check=True)
            start = 1.0 if c['duration'] > length + 2 else 0       # skip the first second (often a fade-in)
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(start), '-t', str(length), '-i', tmp, '-an',
                            '-vf', 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30',
                            '-c:v', 'libx264', '-crf', '21', '-preset', 'fast', '-pix_fmt', 'yuv420p', out], check=True)
        except Exception as e:
            print(json.dumps({'skip': c['id'], 'error': str(e)[:200]}), file=sys.stderr); continue
        finally:
            if os.path.exists(tmp): os.remove(tmp)
        rec = {**{k: c[k] for k in ('source', 'id', 'page', 'author')}, 'topic': topic, 'query': query, 'file': os.path.relpath(out, root)}
        idx['clips'].append(rec); got.append(rec)
    json.dump(idx, open(idx_p, 'w'), indent=1)
    return {'topic': topic, 'dir': d, 'new': got, 'total_in_topic': len([c for c in idx['clips'] if c['topic'] == topic])}

def use(S, topic, public, n):
    root = os.path.join(S['media_dir'], 'broll'); d = os.path.join(root, slug(topic))
    files = sorted(f for f in os.listdir(d) if f.endswith('.mp4'))[:n] if os.path.isdir(d) else []
    os.makedirs(os.path.join(public, 'broll'), exist_ok=True)
    srcs = []
    for f in files:
        shutil.copy(os.path.join(d, f), os.path.join(public, 'broll', f)); srcs.append('broll/' + f)
    return {'topic': slug(topic), 'src': srcs}

if __name__ == '__main__':
    a = sys.argv[1:]
    def opt(k, dflt=None):
        if k in a: i = a.index(k); v = a[i + 1]; del a[i:i + 2]; return v
        return dflt
    project = opt('--project'); topic = opt('--topic'); n = int(opt('--n', 3)); length = float(opt('--len', 4))
    S = studio.load(project)
    cmd = a[0] if a else 'list'
    if cmd == 'fetch': print(json.dumps(fetch(S, a[1], topic, n, length)))
    elif cmd == 'drop':   # broll.py drop <file name> [...]: remove bad clips from the library and broll.json
        root = os.path.join(S['media_dir'], 'broll'); idx_p = os.path.join(root, 'broll.json'); idx = json.load(open(idx_p))
        names = set(a[1:]); keep = []
        for c in idx['clips']:
            if os.path.basename(c['file']) in names:
                f = os.path.join(root, c['file'])
                if os.path.exists(f): os.remove(f)
            else: keep.append(c)
        idx.setdefault('blocked', []).extend([[c['source'], c['id']] for c in idx['clips'] if os.path.basename(c['file']) in names])
        idx['clips'] = keep; json.dump(idx, open(idx_p, 'w'), indent=1); print(json.dumps({'dropped': sorted(names)}))
    elif cmd == 'use': print(json.dumps(use(S, a[1], a[2], n)))
    else:
        p = os.path.join(S['media_dir'], 'broll', 'broll.json')
        idx = json.load(open(p)) if os.path.exists(p) else {'clips': []}
        topics = {}
        for c in idx['clips']: topics[c['topic']] = topics.get(c['topic'], 0) + 1
        print(json.dumps({'media': os.path.join(S['media_dir'], 'broll'), 'topics': topics}))
