import re, subprocess, pymupdf, figs_s7 as F
for name, svg in {'fig11': F.fig11(), 'fig12': F.fig12(), 'chain': F.chain()}.items():
    m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
    w_in, h_in = float(m.group(1))/100.0, float(m.group(2))/100.0
    open(f'png/{name}.html','w').write(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
        f'@page{{size:{w_in}in {h_in}in;margin:0}}html,body{{margin:0;padding:0}}'
        f'svg{{width:{w_in}in;height:{h_in}in;display:block}}'
        '</style></head><body>' + svg + '</body></html>')
    subprocess.run(['/opt/pw-browsers/chromium','--headless','--disable-gpu','--no-sandbox',
                    '--no-pdf-header-footer', f'--print-to-pdf=png/{name}.pdf', f'png/{name}.html'],
                   capture_output=True)
    d = pymupdf.open(f'png/{name}.pdf')
    assert d.page_count == 1, f'{name} spilled to {d.page_count} pages'
    d[0].get_pixmap(dpi=300).save(f'png/{name}.png')
    print(f'{name}: {w_in:.2f} x {h_in:.2f}in'); d.close()
