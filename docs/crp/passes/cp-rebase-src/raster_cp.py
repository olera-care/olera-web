import pymupdf, sys, os
d = pymupdf.open('cp_rebased.pdf')
os.makedirs('png', exist_ok=True)
for i, p in enumerate(d):
    p.get_pixmap(dpi=105).save(f'png/pg{i+1:02d}.png')
print(d.page_count, 'pages rasterized')
