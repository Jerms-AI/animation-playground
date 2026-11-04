# Radial outpaint: every pixel outside the drawing box takes the value found just inside the box edge along its
# ray (with a spiral twist), tapered so arms narrow with distance (f141) or chunks end (f142), and roughened.
import sys, math, json
sys.path.insert(0, '/home/jermsai/.local/lib/python3.12/site-packages'); sys.path.insert(0, '.')
import numpy as np
from PIL import Image, ImageSequence
import tracelib
twist, taper141, taper142, rough = float(sys.argv[1]), float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
im = Image.open('ref/3394567-liquid-fbf.gif'); frames = [f.convert('RGB').copy() for f in ImageSequence.Iterator(im)]
W, H = im.size; cx, cy = 397.9, 286.3
C = 2000; ox, oy = C/2 - cx, C/2 - cy
yy, xx = np.mgrid[0:C, 0:C]; dx, dy = xx - C/2, yy - C/2; rr = np.hypot(dx, dy); th = np.arctan2(dy, dx)
# distance from centre to the box edge along each ray
with np.errstate(divide='ignore'):
    tx = np.where(np.cos(th) > 0, (ox + W - 1 - C/2) / np.cos(th), (ox - C/2) / np.cos(th))
    ty = np.where(np.sin(th) > 0, (oy + H - 1 - C/2) / np.sin(th), (oy - C/2) / np.sin(th))
re = np.minimum(np.where(np.isfinite(tx), tx, 1e9), np.where(np.isfinite(ty), ty, 1e9))
inbox = (xx >= ox + 3) & (xx < ox + W - 3) & (yy >= oy + 3) & (yy < oy + H - 3)   # trim the anti-aliased border of the drawing
noise = 1 + rough * (0.5 * np.sin(7 * th + 1.3) + 0.3 * np.sin(13 * th - 0.4) + 0.2 * np.sin(23 * th + 2.1))
def mask(f): return (np.asarray(frames[f]).astype(int).min(axis=2) > 200)
res = {}
for f, mode in ((141, 'purple'), (142, 'white')):
    m = mask(f)
    base = np.zeros((C, C), bool); base[int(round(oy)):int(round(oy)) + H, int(round(ox)):int(round(ox)) + W] = m
    out = base.copy()
    rs = re - 8
    g = np.log(np.maximum(rr, 1) / np.maximum(re, 1)); g = np.where(inbox, 0, g)
    taper = taper141 if f == 141 else taper142
    w = taper * (rr / np.maximum(re, 1) - 1) * noise
    acc = None
    for off in np.linspace(-1, 1, 11):
        t2 = th + twist * g + off * w
        sx = (C/2 + rs * np.cos(t2)).round().astype(int).clip(0, C - 1); sy = (C/2 + rs * np.sin(t2)).round().astype(int).clip(0, C - 1)
        samp = base[sy, sx]
        acc = samp if acc is None else (acc | samp if mode == 'purple' else acc & samp)   # purple-tapering keeps white if ANY sample is white; white-tapering needs ALL
    out = np.where(inbox, base, acc)
    d = ''
    for loop in tracelib.loops_of(out):
        pts = tracelib.simplify(loop, 1.0)
        if len(pts) < 3: continue
        area = abs(sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))) / 2
        if area < 5: continue
        d += 'M' + ' '.join(f'{x - 1 - ox:.1f},{y - 1 - oy:.1f}' for x, y in pts) + 'Z'
    res[f] = d; print(f, 'chars', len(d))
    Image.fromarray((out * 255).astype(np.uint8)).resize((500, 500)).save(f'trace_out/outpaint_{f}.png')
json.dump(res, open('trace_out/outpaint.json', 'w'))
