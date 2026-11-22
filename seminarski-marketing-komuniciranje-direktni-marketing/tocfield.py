# Umotava rucno upisan sadrzaj u Word TOC polje (prikazuje se odmah, a moze se azurirati sa F9).
import re, sys, zipfile, shutil
src, dst = sys.argv[1:3]
zin = zipfile.ZipFile(src)
xml = zin.read('word/document.xml').decode('utf-8')
paras = list(re.finditer(r'<w:p>(?:(?!</w:p>).)*?<w:pStyle w:val="TOC[12]"/>.*?</w:p>', xml, flags=re.S))
assert paras, 'nema TOC pasusa'
first, last = paras[0], paras[-1]
begin = ('<w:r><w:fldChar w:fldCharType="begin"/></w:r>'
         '<w:r><w:instrText xml:space="preserve"> TOC \\o "1-2" \\h \\z \\u </w:instrText></w:r>'
         '<w:r><w:fldChar w:fldCharType="separate"/></w:r>')
end = '<w:r><w:fldChar w:fldCharType="end"/></w:r>'
# kraj ide u poslednji pasus (pre </w:p>), pocetak posle </w:pPr> prvog pasusa
lp = last.group(0); lp2 = lp[:-len('</w:p>')] + end + '</w:p>'
xml = xml[:last.start()] + lp2 + xml[last.end():]
fp = xml[first.start():first.end()]
fp2 = fp.replace('</w:pPr>', '</w:pPr>' + begin, 1)
xml = xml[:first.start()] + fp2 + xml[first.end():]
xml = re.sub(r'<w:highlightCs[^>]*/>', '', xml)
def _fix_pbdr(m):
    inner = m.group(1)
    parts = {k: re.search(r'<w:%s\b[^>]*/>' % k, inner) for k in ('top', 'left', 'bottom', 'right', 'between', 'bar')}
    return '<w:pBdr>' + ''.join(parts[k].group(0) for k in ('top', 'left', 'bottom', 'right', 'between', 'bar') if parts[k]) + '</w:pBdr>'
xml = re.sub(r'<w:pBdr>(.*?)</w:pBdr>', _fix_pbdr, xml, flags=re.S)

zout = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED)
for item in zin.infolist():
    if item.filename.endswith('/'): continue
    data = xml.encode('utf-8') if item.filename == 'word/document.xml' else zin.read(item.filename)
    if item.filename == 'word/footnotes.xml':
        data = re.sub(rb'<w:highlightCs[^>]*/>', b'', data)
    zout.writestr(item, data)
zout.close()
print('TOC polje:', len(paras), 'stavki')
