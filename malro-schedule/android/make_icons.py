# 말로 일정 안드로이드 아이콘 생성 — 웹앱 아이콘(../icon-*.png)에서 런처 아이콘을 만듦
# 실행: python3 make_icons.py   (Pillow 필요)
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(HERE)
BG = (28, 27, 25)  # 아이콘 바탕색 #1c1b19

legacy = Image.open(os.path.join(WEB, 'icon-512.png')).convert('RGBA')        # 둥근 사각형(투명 모서리)
mask = Image.open(os.path.join(WEB, 'icon-maskable-512.png')).convert('RGB')  # 꽉 찬 사각형

dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for name, k in dens.items():
    d = os.path.join(HERE, 'res', 'mipmap-' + name)
    os.makedirs(d, exist_ok=True)
    # 옛 방식 아이콘(48dp)
    legacy.resize((int(48 * k),) * 2, Image.LANCZOS).save(os.path.join(d, 'ic_launcher.png'), optimize=True)
    # 적응형 아이콘 앞면(108dp) — 9와 주황 점이 원형·물방울 모양 마스크에도 잘리지 않게 86% 크기로 가운데 배치
    s = int(108 * k)
    fg = Image.new('RGB', (s, s), BG)
    inner = int(s * 0.86)
    fg.paste(mask.resize((inner, inner), Image.LANCZOS), ((s - inner) // 2,) * 2)
    fg.save(os.path.join(d, 'ic_launcher_fg.png'), optimize=True)
    # 테마 아이콘(단색) — 글자와 점만 남긴 흰색 실루엣
    src = mask.resize((inner, inner), Image.LANCZOS)
    mono = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    px = src.load()
    lay = Image.new('RGBA', (inner, inner), (0, 0, 0, 0))
    lp = lay.load()
    for y in range(inner):
        for x in range(inner):
            r, g, b = px[x, y]
            a = max(abs(r - BG[0]), abs(g - BG[1]), abs(b - BG[2]))
            if a > 20:
                lp[x, y] = (255, 255, 255, min(255, a * 255 // 200))
    mono.paste(lay, ((s - inner) // 2,) * 2)
    mono.save(os.path.join(d, 'ic_launcher_mono.png'), optimize=True)
print('icons ok')
