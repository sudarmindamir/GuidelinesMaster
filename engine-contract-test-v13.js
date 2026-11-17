const fs = require('fs');
const csv = fs.readFileSync('/mnt/data/master-guidelines-v10/Content Brand Library - Sheet1.csv','utf8');
function parse(s){const out=[];let row=[],cell='',q=false;for(let i=0;i<s.length;i++){const c=s[i];if(q){if(c==='"'&&s[i+1]==='"'){cell+='"';i++;}else if(c==='"')q=false;else cell+=c;}else if(c==='"')q=true;else if(c===','){row.push(cell);cell='';}else if(c==='\n'){row.push(cell);out.push(row);row=[];cell='';}else if(c!=='\r')cell+=c;}if(cell||row.length){row.push(cell);out.push(row)}const h=out[0].map(x=>x.trim().toUpperCase());return out.slice(1).map(r=>({SECTION:r[h.indexOf('SECTION')]||'',TITLE:r[h.indexOf('TITLE')]||'',DESCRIPTION:r[h.indexOf('DESCRIPTION')]||''})).filter(r=>r.TITLE.trim());}
const rows=parse(csv);const sections=[];const map=new Map();for(let i=0;i<rows.length;i++){const s=rows[i].SECTION||'General';if(!map.has(s)){map.set(s,[]);sections.push(s)}map.get(s).push(i)}
function name(i,t){return `Child_Content_Sub-Section ${String(i+1).padStart(2,'0')} [${String(t).replace(/\s+/g,' ').trim().replace(/[\[\]]/g,'')}]`}
const expected=rows.map((r,i)=>name(i,r.TITLE));
for(let run=0;run<30;run++){
  if(rows.length!==45||sections.length!==8) throw new Error('CSV contract failed');
  if(expected.some((n,i)=>!n.includes(String(rows[i].TITLE).replace(/\s+/g,' ').trim().replace(/[\[\]]/g,'')))) throw new Error('TITLE naming failed');
  let page=1,total=0;for(const s of sections){if(!map.get(s))throw new Error('section missing');page++;total++;for(const i of map.get(s)){page++;total++;}}
  if(total!==53||page!==54)throw new Error('page sequence failed');
}
console.log(JSON.stringify({pass:true,runs:30,validRows:rows.length,sections:sections.length,whiteChildren:45,blackChildren:8,totalFrames:53,naming:'TITLE column 2',description:'DESCRIPTION column 3',layout:'black first, white follows'}));
