const fs=require('fs');
const root=__dirname;
const ui=fs.readFileSync(`${root}/ui.html`,'utf8');
const code=fs.readFileSync(`${root}/code.js`,'utf8');
function assert(c,m){if(!c)throw new Error(m)}
assert(ui.indexOf('data-tab="cover"') < ui.indexOf('data-tab="sub"'),'Cover Parent must be left tab');
assert(ui.includes('id="coverPanel" class="panel active"'),'Cover Parent should be active initially');
assert(ui.includes("let activeTab='cover'"),'active tab default must be cover');
assert(ui.includes('const hasAssigned=!!(mapping&&mapping.id)'),'assigned mapping lock state missing');
assert(ui.includes('(previous[id]||v)'),'previous mapping preservation missing');
assert(!ui.includes('Title uses CSV column 2: TITLE'),'obsolete mapping hint remains');
assert(!ui.includes('Description uses CSV column 3: DESCRIPTION'),'obsolete description hint remains');
assert(ui.includes('d.textContent=`${i+1}. ${n}`'),'sections must be numbered by first CSV appearance');
assert(code.includes('coverPage:fmt(s+1,format)'),'cover page must use section ordinal');
assert(code.includes("const all=[...figma.currentPage.children].filter(n=>isChild(n)"),'renumber must discover generated children');
// deterministic section order from the embedded CSV
const m=ui.match(/const DEFAULT_CSV="([\s\S]*?)";let rows=/);assert(m,'embedded CSV missing');
const csv=m[1].replace(/\\n/g,'\n').replace(/\\"/g,'"');
function parse(s){const out=[];let row=[],cell='',q=false;for(let i=0;i<s.length;i++){const ch=s[i];if(q){if(ch==='"'&&s[i+1]==='"'){cell+='"';i++}else if(ch==='"')q=false;else cell+=ch}else if(ch==='"')q=true;else if(ch===','){row.push(cell);cell=''}else if(ch==='\n'){row.push(cell);out.push(row);row=[];cell=''}else if(ch!=='\r')cell+=ch}if(cell.length||row.length){row.push(cell);out.push(row)}const h=out[0].map(x=>x.trim().toUpperCase());return out.slice(1).map(r=>({SECTION:r[h.indexOf('SECTION')]||'',TITLE:r[h.indexOf('TITLE')]||''})).filter(r=>r.TITLE.trim())}
const rows=parse(csv),sections=[...new Set(rows.map(r=>r.SECTION.trim()).filter(Boolean))];
assert(rows.length===45,'expected 45 valid rows');
assert(JSON.stringify(sections)===JSON.stringify(['About Us','Logo','Color','Font','Graphic','Imagery','Grid','Brand Usage']),'section order must follow CSV first appearance');
assert(sections.length===8,'expected 8 unique sections');
assert(code.includes("coverPage:fmt(s+1,format)"),'cover values must be 1..sectionCount, formatted by selected page format');
console.log(JSON.stringify({pass:true,rows:rows.length,sections:sections.length,sectionOrder:sections,tabs:'cover-left/sub-right',mappingLock:true,noneOnlyBeforeAssignment:true,coverPageSource:'CSV SECTION ordinal'}));
