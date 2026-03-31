#!/usr/bin/env python3
"""Crop individual item images from 3x3 grid screenshots."""

from PIL import Image
import os

SS_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'ss')
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'items')
os.makedirs(OUT_DIR, exist_ok=True)

# Each entry: (screenshot_filename, rows, cols, grid_of_item_ids)
# None = skip (locked/empty)
SCREENSHOTS = [
    (
        'Screenshot 2026-03-31 at 03.25.47.png',
        3, 3,
        [
            [None, None, 'eroded-cave'],
            ['portal-gate', 'giant-egg', 'straw-hall'],
            ['sphinx-statue', 'pyramid', 'water-wheel'],
        ]
    ),
    (
        'Screenshot 2026-03-31 at 03.25.54.png',
        3, 3,
        [
            ['sandstorm-castle', 'sandstorm-fortress-i', 'sandstorm-fortress-ii'],
            ['blue-gem', 'straw-hut', 'outpost'],
            ['stone-totem', 'fern-cluster', 'sandstorm-bunker'],
        ]
    ),
    (
        'Screenshot 2026-03-31 at 03.26.01.png',
        3, 3,
        [
            [None, 'sandstorm-pavilion-a', 'sandstorm-pavilion-b'],
            ['colored-ore', 'stone-pillar', 'boss-throne'],
            ['shell', 'water-reservoir-i', 'water-reservoir-ii'],
        ]
    ),
    (
        'Screenshot 2026-03-31 at 03.26.10.png',
        3, 3,
        [
            ['beast-bone-totem', 'canopy-tent', 'signpost'],
            ['flower-bed', 'ruby-mine', 'stone-mine'],
            ['eroded-stone', 'eroded-arch-i', 'eroded-arch-ii'],
        ]
    ),
    (
        'Screenshot 2026-03-31 at 03.26.15.png',
        2, 3,
        [
            ['eroded-arch-iii', 'eroded-fountain', 'eroded-altar'],
            ['mineral-cave', None, None],
        ]
    ),
]


def crop_grid(img_path, num_rows, num_cols, item_grid):
    img = Image.open(img_path)
    w, h = img.size

    cell_w = w / num_cols
    cell_h = h / num_rows

    for row_idx in range(num_rows):
        for col_idx in range(num_cols):
            item_id = item_grid[row_idx][col_idx]
            if item_id is None:
                continue

            left = int(col_idx * cell_w)
            top = int(row_idx * cell_h)
            right = int((col_idx + 1) * cell_w)
            bottom = int((row_idx + 1) * cell_h)

            cell = img.crop((left, top, right, bottom))

            # Trim: remove bottom ~30% (text label + lock icon) and top/side margins
            margin_x = int(cell.width * 0.06)
            margin_top = int(cell.height * 0.04)
            img_bottom = int(cell.height * 0.68)
            cell_trimmed = cell.crop((margin_x, margin_top, cell.width - margin_x, img_bottom))

            # Resize to consistent thumbnail
            cell_trimmed = cell_trimmed.resize((128, 110), Image.LANCZOS)

            out_path = os.path.join(OUT_DIR, f'{item_id}.png')
            cell_trimmed.save(out_path, 'PNG', optimize=True)
            print(f'  Saved {item_id}.png')


for filename, rows, cols, grid in SCREENSHOTS:
    path = os.path.join(SS_DIR, filename)
    if not os.path.exists(path):
        print(f'MISSING: {filename}')
        continue
    print(f'Processing {filename}...')
    crop_grid(path, rows, cols, grid)

print(f'\nDone! {len(os.listdir(OUT_DIR))} images in {OUT_DIR}')
