import re, subprocess, pymupdf, figs_s2 as F
for n, svg in {4: F.fig4(), 5: F.fig5()}.items():
    m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
    w_in, h_in = float(m.group(1))/100.0, float(m.group(2))/100.0
    html = ('<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
            f'@page{{size:{w_in}in {h_in}in;margin:0}}html,body{{margin:0;padding:0}}'
            f'svg{{width:{w_in}in;height:{h_in}in;display:block}}'
            '</style></head><body>' + svg + '</body></html>')
    open(f'png/fig{n}.html','w').write(html)
    subprocess.run(['/opt/pw-browsers/chromium','--headless','--disable-gpu','--no-sandbox',
                    '--no-pdf-header-footer', f'--print-to-pdf=png/fig{n}.pdf', f'png/fig{n}.html'],
                   capture_output=True)
    d = pymupdf.open(f'png/fig{n}.pdf')
    assert d.page_count == 1, f'fig{n} spilled to {d.page_count} pages'
    d[0].get_pixmap(dpi=300).save(f'png/fig{n}.png')
    print(f'fig{n}: {w_in:.2f} x {h_in:.2f}in')
    d.close()
