# Render one composition of a kit project through OpenMontage video_compose (atelier mode).
# Usage (from OpenMontage/): .venv/bin/python projects/motion-kit/daily/render.py <project-dir> <composition> <out.mp4> [scale]
import sys, time
sys.path.insert(0, '.')
from tools.tool_registry import registry
registry.discover()
proj, comp, out = sys.argv[1], sys.argv[2], sys.argv[3]
scale = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
P = __import__('os').path.abspath(proj)
b = {"entry": P + "/index.tsx", "composition_id": comp, "public_dir": P + "/public",
     "art_direction": "Motion Kit", "crf": 18}
if scale != 1:
    b["scale"] = scale
ed = {"version": "1.0", "render_runtime": "remotion", "composition_mode": "atelier",
      "renderer_family": "explainer-teacher", "cuts": [], "bespoke": b}
t = time.time()
r = registry._tools['video_compose'].execute({"operation": "render", "edit_decisions": ed, "output_path": P + "/renders/" + out})
print("OK" if r.success else "FAIL", (r.error or '')[:1500], round(time.time() - t, 1), "s")
sys.exit(0 if r.success else 1)
