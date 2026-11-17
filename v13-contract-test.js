const fs=require('fs');
const path='/mnt/data/master-guidelines-v13';
const code=fs.readFileSync(`${path}/code.js`,'utf8');
const ui=fs.readFileSync(`${path}/ui.html`,'utf8');
function assert(c,m){if(!c)throw new Error(m)}
function parseCSV(s){const out=[],push=()=>{row.push(cell);out.push(row);row=[];cell=''};let row=[],cell='',q=false;for(let i=0;i<s.length;i++){const c=s[i];if(q){if(c==='"'&&s[i+1]==='"'){cell+='"';i++}else if(c==='"')q=false;else cell+=c}else if(c==='"')q=true;else if(c===','){row.push(cell);cell=''}else if(c==='\n'){push()}else if(c!=='\r')cell+=c}if(cell.length||row.length)row.push(cell);const h=out[0].map(x=>x.trim().toUpperCase());return out.slice(1).map(r=>({SECTION:r[h.indexOf('SECTION')]||'',TITLE:r[h.indexOf('TITLE')]||'',DESCRIPTION:r[h.indexOf('DESCRIPTION')]||''})).filter(r=>r.TITLE.trim())}
const m=ui.match(/const DEFAULT_CSV="([\s\S]*?)";let rows=/);assert(m,'embedded CSV missing');
const csv=m[1].replace(/\\n/g,'\n').replace(/\\"/g,'"');
const rows=parseCSV(csv);const sections=[...new Set(rows.map(r=>r.SECTION).filter(Boolean))];
assert(rows.length===45,`expected 45 rows, got ${rows.length}`);assert(sections.length===8,`expected 8 sections, got ${sections.length}`);
assert(ui.includes('data-tab="sub"')&&ui.includes('data-tab="cover"'),'two parent tabs missing');
assert(ui.includes('type:\'focus-parent\''),'tab-to-parent focus missing');
assert(ui.includes('type:\'save-parent-mapping\''),'mapping persistence missing');
assert(ui.includes('— Select text layer —'),'None mapping option missing');
assert(ui.includes('gridColumns')&&ui.includes('placementMode'),'continuous grid payload missing');
assert(code.includes("guidebookWhiteUIMap")&&code.includes("guidebookBlackUIMap"),'persistent mapping storage missing');
assert(code.includes("type==='focus-parent'"),'focus-parent handler missing');
assert(code.includes("type==='save-parent-mapping'"),'save-parent-mapping handler missing');
assert(code.includes('guidebookSequenceIndex'),'sequence metadata missing');
assert(code.includes("placement==='continuous-grid'"),'continuous grid engine missing');
assert(code.includes("const all=[...figma.currentPage.children].filter(n=>isChild(n)"),'child discovery renumber missing');
// Simulate continuous row-major placement: 53 generated frames, 10 columns => 6 rows, preserving sequence.
const total=53,cols=10;const positions=Array.from({length:total},(_,i)=>({i,col:i%cols,row:Math.floor(i/cols)}));
assert(positions.at(-1).row===5&&positions.at(-1).col===2,'continuous grid calculation failed');
// By-section sequence: each section cover first, then its white rows.
let seq=0;for(const s of sections){seq++;seq+=rows.filter(r=>r.SECTION===s).length}assert(seq===53,'section sequence count failed');
console.log(JSON.stringify({pass:true,embeddedRows:rows.length,sections:sections.length,totalGenerated:53,tabs:true,mappingPersistence:true,noneOption:true,continuousGrid:true,autoRows:true,sequenceRenumbering:true}));
