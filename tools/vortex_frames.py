# Draw the vortex frames one by one: a ragged purple vortex with the tan swirl-e opening inside it as the hole,
# arcs of thrown chunks, and a per-frame hand wobble. Output: evenodd paths of the TAN region in drawing coords.
import sys, math, json
sys.path.insert(0, '/home/jermsai/.local/lib/python3.12/site-packages'); sys.path.insert(0, '.')
import numpy as np
from PIL import Image
import tracelib
C = 2000; W, H = 800, 600; cx, cy = 397.9, 286.3; LX, LY = 400.0, 276.0      # vortex centre (drawn) and logo centre
ox, oy = C/2 - cx, C/2 - cy
yy, xx = np.mgrid[0:C, 0:C]
logo = np.zeros((C, C), bool)
lm = np.asarray(Image.open('trace_out/logo_mask.png').convert('L')) > 128
logo[int(round(oy)):int(round(oy)) + H, int(round(ox)):int(round(ox)) + W] = lm
def polar(x0, y0): dx, dy = xx - (x0 + ox), yy - (y0 + oy); return np.hypot(dx, dy), np.arctan2(dy, dx)
def noise(th, seed, amps=(0.12, 0.08, 0.05, 0.03), freqs=(2, 3, 5, 9)):
    rng = np.random.RandomState(seed); v = np.zeros_like(th)
    for a, f in zip(amps, freqs): v += a * np.sin(f * th + rng.uniform(0, 2 * math.pi))
    return v
def wobble(mask, seed, amp):
    # hand jitter: resample through a smooth random displacement field
    rng = np.random.RandomState(seed)
    def field():
        v = np.zeros((C, C))
        for f in (3, 5, 8): v += np.sin(f * 2 * math.pi * xx / C + rng.uniform(0, 6)) * np.cos(f * 2 * math.pi * yy / C + rng.uniform(0, 6)) / f
        return v
    dx, dy = field() * amp * 2, field() * amp * 2
    sx = (xx + dx).round().astype(int).clip(0, C - 1); sy = (yy + dy).round().astype(int).clip(0, C - 1)
    return mask[sy, sx]
def vortex(k, R, rho, arms, chunks, spin, seed, hole=True, cover=False, armlen=1.0):
    rng = np.random.RandomState(seed)
    r, th = polar(cx, cy)
    body = R * (1 + noise(th, seed)) if not cover else R * (1 + 0.5 * noise(th, seed))
    # spiral arms: bulges that trail off clockwise, thinning with length
    for i in range(arms):
        a0 = spin + i * 2 * math.pI if False else spin + i * 2 * math.pi / max(1, arms) + rng.uniform(-0.3, 0.3)
        d = (th - a0 + math.pi) % (2 * math.pi) - math.pi
        body = body + R * armlen * 0.9 * np.exp(-(d / 0.35) ** 2) * (1 + 0.3 * np.sin(6 * th + seed))
        body = body + R * armlen * 0.5 * np.exp(-((d - 0.9) / 0.6) ** 2)
    purple = r < body
    # thrown chunks: crescents on arcs outside the body, plus small drops
    for j in range(chunks):
        rc = R * rng.uniform(1.25, 1.75); a = rng.uniform(0, 2 * math.pi); span = rng.uniform(0.15, 0.7); w = R * rng.uniform(0.05, 0.14)
        d = (th - a + math.pi) % (2 * math.pi) - math.pi
        band = np.abs(r - rc * (1 + 0.04 * np.sin(5 * th + j))) < w * (1 - (d / span) ** 2).clip(0, 1)
        purple |= band & (np.abs(d) < span)
    for j in range(chunks):
        rc = R * rng.uniform(1.3, 2.0); a = rng.uniform(0, 2 * math.pi); rr = rng.uniform(4, 11)
        px, py = cx + ox + rc * math.cos(a), cy + oy + rc * math.sin(a)
        purple |= (xx - px) ** 2 + (yy - py) ** 2 < rr ** 2
    tan = ~purple
    if cover:
        for j in range(6):
            rc = rng.uniform(380, 650); a = rng.uniform(0, 2 * math.pi); span = rng.uniform(0.1, 0.4); w = rng.uniform(6, 16)
            d = (th - a + math.pi) % (2 * math.pi) - math.pi
            tan |= (np.abs(r - rc * (1 + 0.03 * np.sin(4 * th + j))) < w * (1 - (d / span) ** 2).clip(0, 1)) & (np.abs(d) < span)
    if hole:
        rl, _ = polar(LX, LY)
        rim = rl < rho * (1 + 0.12 * noise(_, seed + 7, amps=(0.5, 0.3, 0.2), freqs=(3, 7, 11)))
        tan |= logo & rim
    return wobble(tan, seed + 100, 2.5 if not cover else 4)
FRAMES = [
    # (R body, rho = logo reveal radius, arms, chunks, spin, seed, hole, cover, armlen)
    (85, 0, 0, 2, 0.0, 11, False, False, 1.0),     # gathered ball, first notch
    (100, 28, 1, 4, 0.4, 12, True, False, 0.7),    # vortex starts, the eye opens
    (115, 50, 2, 6, 0.9, 13, True, False, 0.8),
    (130, 75, 2, 8, 1.5, 14, True, False, 0.9),
    (150, 100, 3, 9, 2.0, 15, True, False, 1.0),
    (175, 130, 3, 10, 2.6, 16, True, False, 1.0),
    (205, 175, 3, 10, 3.3, 17, True, False, 1.1),  # the whole mark is open
    (300, 400, 4, 12, 3.9, 18, True, False, 1.7),  # arms reach the edges, tan still between them
    (900, 400, 3, 14, 4.4, 19, True, True, 0.6),   # cover: purple to every edge, a few tan chunks left
]
out = []
for k, (R, rho, arms, chunks, spin, seed, hole, cover, armlen) in enumerate(FRAMES):
    tan = vortex(k, R, rho, arms, chunks, spin, seed, hole, cover, armlen)
    d = ''
    for loop in tracelib.loops_of(tan):
        pts = tracelib.simplify(loop, 1.0)
        if len(pts) < 3: continue
        area = abs(sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))) / 2
        if area < 6: continue
        d += 'M' + ' '.join(f'{x - 1 - ox:.1f},{y - 1 - oy:.1f}' for x, y in pts) + 'Z'
    out.append(d); print(k, 'chars', len(d))
    Image.fromarray((tan * 255).astype(np.uint8)).crop((int(ox) - 200, int(oy) - 150, int(ox) + W + 200, int(oy) + H + 150)).resize((400, 300)).save(f'trace_out/vx_{k}.png')
json.dump(out, open('trace_out/vortex.json', 'w'))
