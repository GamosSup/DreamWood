// Мини-генератор .xlsx без библиотек (работает офлайн): листы, цвета, объединение ячеек, закрепление, формулы.
// makeXlsx([{name,cols:[ширины],rows:[[ячейка,…]],merges:['A1:C1'],freeze:{x,y},landscape:true,heights:{3:30}}]) -> Uint8Array
// ячейка: значение | {v:значение, s:{b,sz,color,bg,al:'l|c|r',vt,wrap,bd}, f:'SUM(A1:A3)'}
(function(){
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
const col=i=>{let s='';for(i++;i>0;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s};
const argb=c=>'FF'+String(c).replace('#','').toUpperCase();
let T=null;const crc=b=>{if(!T){T=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;T[n]=c>>>0}}
  let c=~0;for(let i=0;i<b.length;i++)c=T[(c^b[i])&255]^(c>>>8);return ~c>>>0};
function zip(files){ // только хранение (без сжатия)
  const te=new TextEncoder(),parts=[],cd=[];let off=0;
  const u16=n=>[n&255,n>>8&255],u32=n=>[n&255,n>>8&255,n>>16&255,n>>>24&255];
  for(const [name,data] of files){
    const nb=te.encode(name),db=typeof data==='string'?te.encode(data):data,c=crc(db);
    const lh=new Uint8Array([0x50,0x4b,3,4,...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0)]);
    parts.push(lh,nb,db);
    cd.push(new Uint8Array([0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nb);
    off+=lh.length+nb.length+db.length}
  const cdLen=cd.reduce((a,b)=>a+b.length,0);
  const end=new Uint8Array([0x50,0x4b,5,6,...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cdLen),...u32(off),...u16(0)]);
  const all=[...parts,...cd,end],out=new Uint8Array(all.reduce((a,b)=>a+b.length,0));let p=0;all.forEach(b=>{out.set(b,p);p+=b.length});return out}
function makeXlsx(sheets){
  const fonts=['<font><sz val="11"/><name val="Calibri"/></font>'],fills=['<fill><patternFill patternType="none"/></fill>','<fill><patternFill patternType="gray125"/></fill>'],xfs=['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'],cache={};
  const bd='<border><left style="thin"><color rgb="FFD8CDBB"/></left><right style="thin"><color rgb="FFD8CDBB"/></right><top style="thin"><color rgb="FFD8CDBB"/></top><bottom style="thin"><color rgb="FFD8CDBB"/></bottom><diagonal/></border>';
  const style=s=>{if(!s)return 0;const k=JSON.stringify(s);if(cache[k]!=null)return cache[k];
    const f=`<font>${s.b?'<b/>':''}<sz val="${s.sz||11}"/>${s.color?`<color rgb="${argb(s.color)}"/>`:''}<name val="Calibri"/></font>`;
    let fi=fonts.indexOf(f);if(fi<0)fi=fonts.push(f)-1;
    let bi=0;if(s.bg){const g=`<fill><patternFill patternType="solid"><fgColor rgb="${argb(s.bg)}"/><bgColor indexed="64"/></patternFill></fill>`;bi=fills.indexOf(g);if(bi<0)bi=fills.push(g)-1}
    const al={l:'left',c:'center',r:'right'}[s.al]||'';
    const x=`<xf numFmtId="0" fontId="${fi}" fillId="${bi}" borderId="${s.bd?1:0}" xfId="0" applyFont="1" applyFill="1" applyBorder="1"${al||s.vt||s.wrap?' applyAlignment="1"><alignment'+(al?` horizontal="${al}"`:'')+(s.vt?` vertical="${s.vt==='m'?'center':'top'}"`:'')+(s.wrap?' wrapText="1"':'')+'/></xf>':'/>'}`;
    return cache[k]=xfs.push(x)-1};
  const sheetXml=sh=>{
    const rows=sh.rows.map((r,ri)=>{
      const cells=r.map((c,ci)=>{if(c==null||c==='')return '';const o=typeof c==='object'?c:{v:c},ref=col(ci)+(ri+1),s=style(o.s),sa=s?` s="${s}"`:'';
        if(o.f)return `<c r="${ref}"${sa}><f>${esc(o.f)}</f>${o.v!=null?`<v>${o.v}</v>`:''}</c>`;
        if(typeof o.v==='number')return `<c r="${ref}"${sa}><v>${o.v}</v></c>`;
        return `<c r="${ref}"${sa} t="inlineStr"><is><t xml:space="preserve">${esc(o.v)}</t></is></c>`}).join('');
      const h=sh.heights&&sh.heights[ri+1];return `<row r="${ri+1}"${h?` ht="${h}" customHeight="1"`:''}>${cells}</row>`}).join('');
    const fz=sh.freeze,pane=fz?`<sheetViews><sheetView workbookViewId="0"><pane${fz.x?` xSplit="${fz.x}"`:''}${fz.y?` ySplit="${fz.y}"`:''} topLeftCell="${col(fz.x||0)}${(fz.y||0)+1}" activePane="${fz.x&&fz.y?'bottomRight':fz.y?'bottomLeft':'topRight'}" state="frozen"/></sheetView></sheetViews>`:'';
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>${pane}<sheetFormatPr defaultRowHeight="15"/>${sh.cols?`<cols>${sh.cols.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols>`:''}<sheetData>${rows}</sheetData>${sh.merges&&sh.merges.length?`<mergeCells count="${sh.merges.length}">${sh.merges.map(m=>`<mergeCell ref="${m}"/>`).join('')}</mergeCells>`:''}<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="${sh.landscape?'landscape':'portrait'}" fitToWidth="1" fitToHeight="0"/></worksheet>`};
  const xml=sheets.map(sheetXml); // стили собираются при генерации листов
  const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="${fonts.length}">${fonts.join('')}</fonts><fills count="${fills.length}">${fills.join('')}</fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>${bd}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const files=[
    ['[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],
    ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${esc(s.name).slice(0,31)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml',styles],
    ...xml.map((x,i)=>[`xl/worksheets/sheet${i+1}.xml`,x])];
  return zip(files);
}
const api={makeXlsx,xlsxCol:col};
if(typeof window!=='undefined')Object.assign(window,api);
if(typeof module!=='undefined')module.exports=api;
})();
