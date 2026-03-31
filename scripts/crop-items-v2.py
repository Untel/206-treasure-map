#!/usr/bin/env python3
"""Crop item images from Collection Pool screenshots (ss2/).
Crops a centered square from each colored card area — no resize."""

from PIL import Image
import os

SS_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'ss2')
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'items')
os.makedirs(OUT_DIR, exist_ok=True)

# Pixel-perfect Y ranges for colored squares (from color transition analysis)
# X: 3 columns spanning x=68..1110 (each ~347px wide)
COL_LEFT = 68
COL_RIGHT = 1110
COLS = 3

GRIDS = [
    {
        'file': 'IMG_5821.png',
        'rows_y': [(513, 741), (884, 1111), (1254, 1482), (1625, 1853)],
        'items': [
            ['tower-of-barrens', 'giant-egg', 'portal-gate'],
            ['eroded-cave', 'straw-hall', 'stone-totem'],
            ['outpost', 'sandstorm-fortress-ii', 'straw-hut'],
            ['blue-gem', 'sandstorm-fortress-i', 'flower-bed'],
        ]
    },
    {
        'file': 'IMG_5822.png',
        'rows_y': [(542, 770), (913, 1141), (1284, 1512), (1654, 1882)],
        'items': [
            [None, None, None],
            ['signpost', 'canopy-tent', 'beast-bone-totem'],
            ['water-reservoir-ii', 'water-reservoir-i', 'shell'],
            ['boss-throne', 'stone-pillar', None],
        ]
    },
]


def crop_grid(config):
    path = os.path.join(SS_DIR, config['file'])
    img = Image.open(path)
    col_w = (COL_RIGHT - COL_LEFT) / COLS

    for row_idx, row in enumerate(config['items']):
        y_top, y_bottom = config['rows_y'][row_idx]
        h = y_bottom - y_top  # height of colored area

        for col_idx, item_id in enumerate(row):
            if item_id is None:
                continue

            cl = int(COL_LEFT + col_idx * col_w)
            cr = int(COL_LEFT + (col_idx + 1) * col_w)
            w = cr - cl  # width of cell

            # Crop a centered square: use height as the side length (it's smaller than width)
            side = h
            cx = (cl + cr) // 2  # center x of cell
            sq_left = cx - side // 2
            sq_right = sq_left + side

            square = img.crop((sq_left, y_top, sq_right, y_bottom))

            out_path = os.path.join(OUT_DIR, f'{item_id}.png')
            square.save(out_path, 'PNG', optimize=True)
            print(f'  {item_id}.png  ({square.size[0]}x{square.size[1]})')


for g in GRIDS:
    print(f'Processing {g["file"]}...')
    crop_grid(g)

print(f'\nDone! {len(os.listdir(OUT_DIR))} images')
