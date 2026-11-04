# Trace the WHITE region of each GIF frame to closed polygons (marching squares on the binary mask),
# simplify (Douglas-Peucker), and emit one evenodd SVG path per frame.
import sys, json, math
sys.path.insert(0, '/home/jermsai/.local/lib/python3.12/site-packages')
import numpy as np
from PIL import Image, ImageSequence
def loops_of(mask):
    # Directed pixel-boundary edges, clockwise around white (screen coords); link into closed loops.
    m = np.pad(mask, 1)
    H2, W2 = m.shape
    yy, xx = np.mgrid[0:H2, 0:W2]
    up = np.zeros_like(m); up[1:] = m[:-1]
    dn = np.zeros_like(m); dn[:-1] = m[1:]
    lf = np.zeros_like(m); lf[:, 1:] = m[:, :-1]
    rt = np.zeros_like(m); rt[:, :-1] = m[:, 1:]
    E = []
    for cond, sx, sy, ex, ey in ((m & ~up, 0, 0, 1, 0), (m & ~rt, 1, 0, 1, 1), (m & ~dn, 1, 1, 0, 1), (m & ~lf, 0, 1, 0, 0)):
        ys, xs = np.nonzero(cond)
        E.append(np.stack([xs + sx, ys + sy, xs + ex, ys + ey], 1))
    E = np.concatenate(E)
    nxt = {}
    for x0, y0, x1, y1 in E.tolist():
        nxt.setdefault((x0, y0), []).append((x1, y1))
    loops = []
    while nxt:
        s = next(iter(nxt)); loop = [s]; p = nxt[s].pop()
        if not nxt[s]: del nxt[s]
        while p != s:
            loop.append(p); outs = nxt.get(p)
            if not outs: break
            # at a diagonal-touch vertex prefer the right turn (tightest loop)
            if len(outs) > 1:
                dx, dy = p[0] - loop[-2][0], p[1] - loop[-2][1]
                outs.sort(key=lambda q: (q[0] - p[0]) * dy - (q[1] - p[1]) * dx)   # cross product: right turn first in screen coords
            q = outs.pop(0)
            if not outs: del nxt[p]
            p = q
        if len(loop) > 3: loops.append(loop)
    return loops
def dp(pts, eps):
    if len(pts) < 3: return pts
    (x0, y0), (x1, y1) = pts[0], pts[-1]; dx, dy = x1 - x0, y1 - y0; L = math.hypot(dx, dy) or 1e-9
    d = [abs(dy * (x - x0) - dx * (y - y0)) / L for x, y in pts]; i = max(range(len(pts)), key=lambda k: d[k])
    if d[i] > eps: return dp(pts[:i + 1], eps)[:-1] + dp(pts[i:], eps)
    return [pts[0], pts[-1]]
def simplify(loop, eps):
    # closed: split at farthest point from start, DP both halves
    x0, y0 = loop[0]; j = max(range(len(loop)), key=lambda k: (loop[k][0] - x0) ** 2 + (loop[k][1] - y0) ** 2)
    a = dp(loop[:j + 1], eps); b = dp(loop[j:] + [loop[0]], eps)
    return a[:-1] + b[:-1]

if __name__ == '__main__':
    gif, out, f0, f1, eps = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), float(sys.argv[5])
    im = Image.open(gif); frames = [f.convert('RGB').copy() for f in ImageSequence.Iterator(im)]
    W, H = im.size
    paths = []; total = 0
    for f in range(f0, f1 + 1):
        a = np.asarray(frames[f]).astype(int); mask = a.min(axis=2) > 200
        d = ''
        for loop in loops_of(mask):
            pts = simplify(loop, eps)
            if len(pts) < 3: continue
            area = abs(sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))) / 2
            if area < 5: continue   # anti-alias speckle
            # unpad (−1) and round to 1 decimal
            d += 'M' + ' '.join(f'{x - 1:g},{y - 1:g}' if (x-1)==int(x-1) and (y-1)==int(y-1) else f'{x - 1:.1f},{y - 1:.1f}' for x, y in pts) + 'Z'
        paths.append(d); total += len(d)
    json.dump({'w': W, 'h': H, 'frames': paths, 'first': f0, 'ms': 40}, open(out, 'w'))
    print('frames', len(paths), 'chars', total, 'avg', total // len(paths))
