# Per-project settings: <project>/video/studio.json, with defaults derived from <project>/video/theme.json.
# Every daily script reads its brand, spend caps and HeyGen settings from here, so one engine serves many projects.
#
# Usage:  python3 studio.py show <project-dir>      # resolved settings as JSON
#         python3 studio.py init <project-dir>      # write a draft video/studio.json (never overwrites)
#
# <project-dir> defaults to $VIDEO_PROJECT, then to the current directory.
import sys, os, json, re, datetime, csv


def _slugify(s):
    return re.sub(r'[^a-z0-9]+', '', s.lower())


def load(project=None):
    project = os.path.abspath(os.path.expanduser(project or os.environ.get('VIDEO_PROJECT') or os.getcwd()))
    vdir = os.path.join(project, 'video')
    theme_path = os.path.join(vdir, 'theme.json')
    theme = json.load(open(theme_path)) if os.path.exists(theme_path) else {}
    cfg_path = os.path.join(vdir, 'studio.json')
    cfg = json.load(open(cfg_path)) if os.path.exists(cfg_path) else {}
    name = cfg.get('name') or theme.get('name') or os.path.basename(project)
    slug = cfg.get('slug') or _slugify(os.path.basename(project))
    heygen = {'voice_id': None, 'engine': 'elevenlabs', 'library': 'takes', **cfg.get('heygen', {})}
    # the take library is a folder of base videos of you; relative paths are resolved from <project>/video
    heygen['library'] = os.path.join(vdir, os.path.expanduser(heygen['library']))
    return {
        'project': project, 'video_dir': vdir, 'config_file': cfg_path if cfg else None,
        'slug': slug, 'name': name,
        'prefix': cfg.get('prefix', slug),   # OpenMontage projects are <prefix>-diaNN, compositions <Prefix>DiaNN
        'language': cfg.get('language', 'en'),
        'caps_usd': {'heygen': 0, **cfg.get('caps_usd', {})},   # monthly spend caps in USD; 0 = feature off
        'heygen': heygen,
        'renders_dir': os.path.join(vdir, 'renders'),
        'media_dir': os.path.join(vdir, 'media'),   # reusable assets, e.g. media/broll/<topic>/
        'brand_dir': vdir if (theme or os.path.exists(os.path.join(vdir, 'brand.json'))) else None,
    }


def ledger(s, service):
    return os.path.join(s['video_dir'], f'spend-{service}.csv')


def spent(s, service, month=None):
    month = month or datetime.date.today().strftime('%Y-%m')
    f = ledger(s, service)
    if not os.path.exists(f):
        return 0.0
    return round(sum(float(r['usd']) for r in csv.DictReader(open(f)) if r['date'].startswith(month)), 4)


def init(project):
    s = load(project)
    if s['config_file']:
        return s['config_file'] + ' already exists'
    draft = {'name': s['name'], 'slug': s['slug'], 'prefix': s['slug'], 'language': 'en',
             'caps_usd': {'heygen': 0},
             'heygen': {'voice_id': None, 'engine': 'elevenlabs', 'library': 'takes'},
             '_note': 'Draft. Caps are USD per month; 0 = feature off. Put base videos of yourself (for HeyGen lip-sync) in video/takes/.'}
    path = os.path.join(s['video_dir'], 'studio.json')
    os.makedirs(s['video_dir'], exist_ok=True)
    json.dump(draft, open(path, 'w'), indent=2, ensure_ascii=False)
    return path


if __name__ == '__main__':
    cmd, proj = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else None)
    if cmd == 'init':
        print(init(proj))
    elif cmd == 'show':
        print(json.dumps(load(proj), indent=2, ensure_ascii=False))
    else:
        sys.exit('usage: studio.py show|init [project-dir]')
