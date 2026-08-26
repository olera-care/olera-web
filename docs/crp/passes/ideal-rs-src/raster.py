import re, subprocess, pymupdf, figs, figs2
SVGS = {1:figs.fig1(), 2:figs.fig2(), 3:figs.fig3(), 4:figs2.fig4(), 5:figs2.fig5()}
for n, svg in SVGS.items():
    m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
    w_in, h_in = float(m.group(1))/100.0, float(m.group(2))/100.0
    html = ('<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
            f'@page{{size:{w_in}in {h_in}in;margin:0}}html,body{{margin:0;padding:0}}'
            f'svg{{width:{w_in}in;height:{h_in}in;display:block}}'
            '</style></head><body>'+svg+'</body></html>')
    open(f'png/fig{n}.html','w').write(html)
    subprocess.run(['/opt/pw-browsers/chromium','--headless','--disable-gpu','--no-sandbox',
                    '--no-pdf-header-footer',f'--print-to-pdf=png/fig{n}.pdf',f'png/fig{n}.html'],
                   capture_output=True)
    d = pymupdf.open(f'png/fig{n}.pdf')
    pix = d[0].get_pixmap(dpi=300)
    pix.save(f'png/fig{n}.png')
    # ink-extent check
    import io
    rects = d[0].get_text('dict')
    print(f'fig{n}: {w_in:.2f}x{h_in:.2f}in -> {pix.width}x{pix.height}px, pages={d.page_count}')
    d.close()
