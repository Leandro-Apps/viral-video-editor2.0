# Re-skin a project's copy of the Motion Kit with a brand pack (colors, fonts, logo, names, CTA texts, music, sfx).
# The kit is written with the WiseFunnel defaults; this swaps them for the pack's values in <project>/kit and <project>/public.
# Usage: python3 apply_brand.py <brand-dir> <project-dir>      (called by sync-kit.sh when a brand is given)
# <brand-dir> is a brand pack (brand.json, logo.png, fonts/, optional music/, sfx/, brands/; see brand-packs/README.md)
# or a project's video/ folder: its brand.json wins over the draft theme.json, and paths are relative to that folder.
import sys, os, re, json, shutil, glob, subprocess

pack, proj = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
B = json.load(open(os.path.join(pack, 'brand.json'))) if os.path.exists(os.path.join(pack, 'brand.json')) else {}
T = json.load(open(os.path.join(pack, 'theme.json'))) if os.path.exists(os.path.join(pack, 'theme.json')) else {}
if T:   # fill gaps from the project's theme.json (draft tokens used by the older video-studio renderer)
    tc = T.get('colors', {})
    B.setdefault('name', T.get('name')); B.setdefault('wordmark', T.get('wordmark') or T.get('name'))
    B.setdefault('handle', (T.get('handle') or '').lstrip('@')); B.setdefault('logo', T.get('logo'))
    c = B.setdefault('colors', {})
    for k_theme, k_brand in (('accent', 'accent'), ('dark', 'dark'), ('accentLight', 'accent_light'), ('positive', 'green'), ('paper', 'paper'), ('ink', 'ink'), ('muted', 'muted')):
        if tc.get(k_theme): c.setdefault(k_brand, tc[k_theme])
B['handle'] = (B.get('handle') or re.sub(r'[^a-z0-9.]', '', B['name'].lower())).lstrip('@')
B.setdefault('site', B.get('handle') or B['name'].lower().replace(' ', '') + '.com')
B.setdefault('cta', {'button': 'Saiba mais', 'en': {'trial': ['Link in bio', 'take a look'], 'build': ['See it at', B['site']], 'build_big': 'TODAY'},
                     'pt': {'trial': ['Link na bio', 'dá uma olhada'], 'build': ['Veja em', B['site']], 'build_big': 'HOJE'}})

def rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def hexc(t): return '#%02X%02X%02X' % tuple(max(0, min(255, round(v))) for v in t)
def mix(a, b, k): return hexc(tuple(x + (y - x) * k for x, y in zip(rgb(a), rgb(b))))

col = B['colors']
acc, dark = col['accent'], col['dark']
pal = {   # WiseFunnel default -> pack value (tints derived when the pack does not set them)
    '#F97316': acc, '#FB923C': col.get('accent_light', mix(acc, '#FFFFFF', 0.2)), '#FDBA74': col.get('accent_pale', mix(acc, '#FFFFFF', 0.45)),
    '#FFF1E6': col.get('accent_soft', mix(acc, '#FFFFFF', 0.9)), '#1A2B3B': dark, '#0F1B27': col.get('dark_deep', mix(dark, '#000000', 0.4)),
}
for k in ('green', 'red', 'paper', 'ink', 'muted'):     # optional overrides of the support colors in tokens.ts
    if k in col: pal[{'green': '#2EA56A', 'red': '#E15A36', 'paper': '#F4F4F4', 'ink': '#202020', 'muted': '#646464'}[k]] = col[k]
reps = []
for old, new in pal.items():
    reps.append((re.compile(re.escape(old), re.I), new))
    o, n = rgb(old), rgb(new)
    reps.append((re.compile(r'rgba\(\s*%d\s*,\s*%d\s*,\s*%d\s*,' % o), 'rgba(%d,%d,%d,' % n))

name, site = B['name'], B['site']
cta = B.get('cta', {})
en, pt = cta.get('en', {}), cta.get('pt', {})
texts = [  # whole CTA/tagline literals first, then names and URLs longest first
    ('>wisefunnel<', '>' + B.get('wordmark', name.lower()) + '<'), ("'Buyers first.'", json.dumps(B.get('tagline', ''))),
    ("'Start free trial'", json.dumps(cta.get('button', 'Start free trial'))),
    ("['Try it free', 'no credit card']", json.dumps(en.get('trial', ['Try it free', 'no credit card']), ensure_ascii=False)),
    ("['Teste grátis', 'sem cartão de crédito']", json.dumps(pt.get('trial', ['Teste grátis', 'sem cartão de crédito']), ensure_ascii=False)),
    ("['Build your funnel in', 'wisefunnel.io']", json.dumps(en.get('build', ['Build yours in', site]), ensure_ascii=False)),
    ("['Crie seu funil em', 'wisefunnel.io']", json.dumps(pt.get('build', ['Crie o seu em', site]), ensure_ascii=False)),
    ("'15 SEGUNDOS'", json.dumps(pt.get('build_big', '15 SEGUNDOS'), ensure_ascii=False)),
    ("'15 SECONDS'", json.dumps(en.get('build_big', '15 SECONDS'), ensure_ascii=False)),
    ('app.wisefunnel.io', B.get('app_url', 'app.' + site)), ('wiseform.io/roofing', B.get('offer_url', site)),
    ('wisefunnel.io', site), ("'yourhandle'", json.dumps(B.get('handle', 'yourhandle'))),
    ('WiseFunnel AI', B.get('ai_name', name + ' AI')), ('WISEFUNNEL', name.upper()), ('WiseFunnel', name),
]

# fonts: the kit loads 'fonts/Inter-latin.woff2' as the body face and the two Caveat files as the hand face
F = B.get('fonts', {})
os.makedirs(os.path.join(proj, 'public', 'fonts'), exist_ok=True)
fontmap = {}
bold_file = None   # optional heavy cut of the body family: body file serves 100-500, bold file 600-900
for slot, olds in (('body', ['fonts/Inter-latin.woff2']), ('bold', []), ('hand', ['fonts/Caveat-400-latin.woff2', 'fonts/Caveat-700-latin.woff2'])):
    if F.get(slot) and os.path.exists(os.path.join(pack, F[slot])):
        src = os.path.join(pack, F[slot]); shutil.copy(src, os.path.join(proj, 'public', 'fonts', os.path.basename(src)))
        for o in olds: fontmap[o] = 'fonts/' + os.path.basename(src)
        if slot == 'bold': bold_file = 'fonts/' + os.path.basename(src)
FMT = {'.woff2': 'woff2', '.woff': 'woff', '.ttf': 'truetype', '.otf': 'opentype'}

n = 0
for f in glob.glob(os.path.join(proj, 'kit', '**', '*.ts*'), recursive=True):
    s0 = s = open(f).read()
    for rx, new in reps: s = rx.sub(new, s)
    for old, new in texts: s = s.replace(old, new)
    if f.endswith('fonts.ts'):
        if bold_file:
            s = s.replace("['WFInter', 'fonts/Inter-latin.woff2', '100 900'],", f"['WFInter', 'fonts/Inter-latin.woff2', '100 500'],\n  ['WFInter', '{bold_file}', '600 900'],")
        for old, new in fontmap.items(): s = s.replace(f"'{old}'", f"'{new}'")
        s = s.replace("format('woff2')", "format('${FMT[file.slice(file.lastIndexOf('.'))] || 'woff2'}')")
        s = s.replace('let started = false;', 'const FMT: Record<string, string> = ' + json.dumps(FMT) + ';\nlet started = false;')
    if s != s0: open(f, 'w').write(s); n += 1

pub = os.path.join(proj, 'public')
def logo_png(src, dst):   # png/jpg copied; svg rasterised with headless Chrome; no logo -> monogram on the accent color
    chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    tmp = os.path.join(proj, '_logo.html')
    if src and os.path.exists(src) and not src.lower().endswith('.svg'):
        shutil.copy(src, dst); return 'file'
    if src and os.path.exists(src):
        body = f'<img src="file://{src}" style="width:512px;height:512px;object-fit:contain">'
    else:
        body = (f'<div style="width:512px;height:512px;border-radius:120px;background:{acc};color:#fff;display:flex;align-items:center;'
                f'justify-content:center;font:900 300px system-ui">{B["name"].strip()[:1].upper()}</div>')
    open(tmp, 'w').write(f'<html><body style="margin:0;background:transparent">{body}</body></html>')
    subprocess.run([chrome, '--headless=new', '--disable-gpu', '--default-background-color=00000000', '--hide-scrollbars',
                    '--window-size=512,512', f'--screenshot={dst}', 'file://' + tmp], capture_output=True)
    os.remove(tmp); return 'svg' if src and os.path.exists(src) else 'monogram'
logo_src = os.path.join(pack, B['logo']) if B.get('logo') else None
logo_kind = logo_png(logo_src, os.path.join(pub, 'logo.png'))
for d in ('music', 'sfx', 'brands'):   # pack files override the kit's files of the same name
    src = os.path.join(pack, d)
    if os.path.isdir(src): shutil.copytree(src, os.path.join(pub, d), dirs_exist_ok=True)
json.dump(B, open(os.path.join(proj, 'kit', 'brand.json'), 'w'), indent=1, ensure_ascii=False)
print(f'brand "{name}" applied to {proj} ({n} kit files changed, logo: {logo_kind})')
