// Master Guidelines v10 — clean rebuild
figma.showUI(__html__, { width: 360, height: 720, themeColors: true });
const WHITE_PARENT_NAME='Parent_Content_Sub-Section', BLACK_PARENT_NAME='Parent_Cover_Section';
const WHITE_CHILD_PREFIX='Child_Content_Sub-Section', BLACK_CHILD_PREFIX='Child_Cover_Section';
const META_VERSION='4', WHITE_PARENT='white-parent', BLACK_PARENT='black-parent', WHITE_CHILD='white-content', BLACK_CHILD='black-cover';
const OFFSET=500; let liveSync=true, syncTimer=null, syncRunning=false, syncQueued=false; const fonts=new Set(), dynamic=new Map();
function role(n){if(!n?.getPluginData)return null;const r=n.getPluginData('guidebookParentRole');if(r===WHITE_PARENT||r===BLACK_PARENT)return r;const t=n.getPluginData('templateType');if(t==='content')return WHITE_PARENT;if(t==='section_cover')return BLACK_PARENT;if(n.name===WHITE_PARENT_NAME)return WHITE_PARENT;if(n.name===BLACK_PARENT_NAME)return BLACK_PARENT;return null;}
const isParent=n=>!!role(n)&&n.getPluginData('guidebookIsChild')!=='true', isChild=n=>n?.getPluginData?.('guidebookIsChild')==='true';
const childRole=p=>role(p)===BLACK_PARENT?BLACK_CHILD:WHITE_CHILD;
function parentMeta(p,r){p.setPluginData('guidebookMetaVersion',META_VERSION);p.setPluginData('guidebookIsParent','true');p.setPluginData('guidebookParentRole',r);p.setPluginData('templateType',r===WHITE_PARENT?'content':'section_cover');}
function childMeta(c,p,r,s,col,i,sequence){c.setPluginData('guidebookMetaVersion',META_VERSION);c.setPluginData('guidebookIsChild','true');c.setPluginData('linkedParentId',p.id);c.setPluginData('generatedRole',r===WHITE_PARENT?WHITE_CHILD:BLACK_CHILD);c.setPluginData('guidebookParentRole',r);c.setPluginData('guidebookSectionIndex',String(s));c.setPluginData('guidebookColumnIndex',String(col));c.setPluginData('guidebookCsvIndex',String(i));c.setPluginData('guidebookSequenceIndex',String(sequence??0));}
function pathOf(root,target){const a=[];let c=target;while(c&&c!==root){const p=c.parent;if(!p||!('children'in p))return null;const i=p.children.indexOf(c);if(i<0)return null;a.unshift(i);c=p;}return c===root?a:null;}
function byPath(root,path){if(!root||!Array.isArray(path))return null;let c=root;for(const i of path){if(!c||!('children'in c)||!c.children[i])return null;c=c.children[i];}return c;}
function mid(n){return n?.getPluginData?.('masterId')||n?.id||null;}
function ensureIds(root){const used=new Set();function walk(n){let id=n.getPluginData('masterId');if(!id||used.has(id)){id=`${n.id}:${Math.random().toString(36).slice(2,8)}`;n.setPluginData('masterId',id);}used.add(id);if('children'in n)n.children.forEach(walk);}walk(root);}
function copyIds(s,d){d.setPluginData('masterId',mid(s));if('children'in s&&'children'in d){for(let i=0;i<Math.min(s.children.length,d.children.length);i++)copyIds(s.children[i],d.children[i]);}}
async function font(f){if(!f||f===figma.mixed)return;const k=`${f.family}:${f.style}`;if(fonts.has(k))return;try{await figma.loadFontAsync(f);fonts.add(k);}catch(_){}}
async function textFonts(t){if(!t||t.type!=='TEXT')return;try{if(t.fontName!==figma.mixed)return font(t.fontName);for(let i=0;i<t.characters.length;i++)await font(t.getRangeFontName(i,i+1));}catch(_){}
}
function safe(n,p,v){try{if(p in n)n[p]=v;}catch(_){} }
function setDynamic(p,ids){dynamic.set(p.id,new Set(ids.filter(Boolean)));} function isDyn(p,n){return dynamic.get(p.id)?.has(mid(n));}
async function mirrorTextStyle(s,d){if(s.type!=='TEXT'||d.type!=='TEXT')return;try{if(s.fontName!==figma.mixed){await font(s.fontName);d.fontName=s.fontName;}for(const p of ['fontSize','lineHeight','letterSpacing','textAlignHorizontal','textAlignVertical','textCase','textDecoration','textAutoResize','paragraphIndent','paragraphSpacing'])if(p in s&&s[p]!==figma.mixed)safe(d,p,s[p]);if(s.fills!==figma.mixed)safe(d,'fills',s.fills);if(s.strokes!==figma.mixed)safe(d,'strokes',s.strokes);if(s.strokeWeight!==figma.mixed)safe(d,'strokeWeight',s.strokeWeight);}catch(_){}
}
async function mirrorNode(p,s,d){if(!s||!d||s.type!==d.type)return;for(const x of ['visible','opacity','blendMode','rotation','fills','strokes','strokeWeight','strokeAlign','strokeCap','strokeJoin','dashPattern','effects','isMask','maskType','cornerRadius','cornerSmoothing','layoutGrids','guides'])if(x in s&&s[x]!==figma.mixed)safe(d,x,s[x]);if('topLeftRadius'in s){for(const x of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])safe(d,x,s[x]);}if('layoutMode'in s){try{d.layoutMode=s.layoutMode;if(s.layoutMode!=='NONE')for(const x of ['primaryAxisSizingMode','counterAxisSizingMode','primaryAxisAlignItems','counterAxisAlignItems','paddingLeft','paddingRight','paddingTop','paddingBottom','itemSpacing','layoutWrap','counterAxisSpacing'])if(x in s&&x in d)d[x]=s[x];}catch(_){} }if('resize'in d&&(s.type!=='TEXT'||s.textAutoResize!=='WIDTH_AND_HEIGHT'))try{d.resize(s.width,s.height);}catch(_){}if(s.type==='TEXT'){await mirrorTextStyle(s,d);if(!isDyn(p,s)){try{await textFonts(s);d.characters=s.characters;}catch(_){}}}if('x'in s)try{d.x=s.x;d.y=s.y;}catch(_){} }
async function reconcile(p,s,d){if(!('children'in s)||!('children'in d))return;const ss=[...s.children], ids=new Set(ss.map(mid));for(const x of [...d.children])if(!ids.has(mid(x)))try{x.remove();}catch(_){}const used=new Set();for(let i=0;i<ss.length;i++){const src=ss[i],id=mid(src);let dst=d.children.find(x=>!used.has(x.id)&&mid(x)===id);if(!dst){try{dst=src.clone();d.insertChild(Math.min(i,d.children.length),dst);copyIds(src,dst);}catch(_){continue;}}else{const at=d.children.indexOf(dst);if(at!==i)try{d.insertChild(Math.min(i,d.children.length),dst);}catch(_){} }used.add(dst.id);await mirrorNode(p,src,dst);if('children'in src&&'children'in dst)await reconcile(p,src,dst);}}
async function mirrorRoot(p,c){try{for(const x of ['visible','opacity','blendMode','clipsContent','fills','strokes','strokeWeight','strokeAlign','effects','layoutGrids','guides','cornerRadius','cornerSmoothing'])if(x in p)safe(c,x,p[x]);if('topLeftRadius'in p)for(const x of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])safe(c,x,p[x]);if('resize'in c)c.resize(p.width,p.height);await reconcile(p,p,c);}catch(e){console.error('mirror',e);}}
function parents(){return figma.currentPage.children.filter(isParent);} function children(p){const r=childRole(p);return figma.currentPage.children.filter(n=>isChild(n)&&n.getPluginData('linkedParentId')===p.id&&n.getPluginData('generatedRole')===r);}
function restoreDynamic(p){
 if(!p)return;
 if(role(p)===WHITE_PARENT){const b=json(p,'guidebookWhiteBinding',{}),ids=[b.pageMasterId,b.titleMasterId,b.descriptionMasterId];setDynamic(p,ids);}
 if(role(p)===BLACK_PARENT){const b=json(p,'guidebookBlackBinding',{}),ids=[b.sectionNameMasterId,b.pageNumberMasterId,b.subsectionMasterId,b.coverPageMasterId];setDynamic(p,ids);}
}
async function syncParent(p){if(!p)return 0;ensureIds(p);restoreDynamic(p);let n=0;for(const c of children(p)){if(!c.removed){await mirrorRoot(p,c);n++;}}if(role(p)===WHITE_PARENT)await applyAll(p);return n;}
function trigger(ids){if(!liveSync||!ids.size)return;if(syncTimer)clearTimeout(syncTimer);syncTimer=setTimeout(async()=>{if(syncRunning){syncQueued=true;return;}syncRunning=true;try{for(const id of ids){const p=figma.getNodeById(id);if(p)await syncParent(p);}}finally{syncRunning=false;if(syncQueued){syncQueued=false;trigger(ids);}}},35);}
function json(n,k,f){try{return JSON.parse(n.getPluginData(k)||'null')??f;}catch(_){return f;}}
function findMid(root,id){if(!root||!id)return null;if(mid(root)===id)return root;return 'findOne'in root?root.findOne(n=>mid(n)===id):null;}
function rowsNorm(rows){return(Array.isArray(rows)?rows:[]).map(r=>({SECTION:String(r?.SECTION??'').trim(),TITLE:String(r?.TITLE??'').trim(),DESCRIPTION:String(r?.DESCRIPTION??'')})).filter(r=>r.TITLE);}
function clean(v){return String(v??'').replace(/\s+/g,' ').trim().replace(/[\[\]]/g,'');} function whiteName(i,t){return `${WHITE_CHILD_PREFIX} ${String(i).padStart(2,'0')} [${clean(t)}]`;} function blackName(i,s){return `${BLACK_CHILD_PREFIX} ${String(i).padStart(2,'0')} [${clean(s)}]`;}
function fmt(n,f){if(f==='pad2')return String(n).padStart(2,'0');if(f==='pad3')return String(n).padStart(3,'0');if(f==='prefix-p')return`p. ${n}`;if(f==='prefix-page')return`Page ${n}`;return String(n);}
function inside(node,root){let c=node;while(c){if(c===root)return true;c=c.parent;}return false;}
function mapped(p,m,k){const id=m?.[`${k}LayerId`];if(id){const n=figma.getNodeById(id);if(n&&inside(n,p))return n;}return byPath(p,m?.[`${k}Path`]);}
function uiMapForParent(p){
 const r=role(p);
 const key=r===WHITE_PARENT?'guidebookWhiteUIMap':'guidebookBlackUIMap';
 const saved=json(p,key,null);
 if(saved)return saved;
 const defaults=r===WHITE_PARENT?json(p,'guidebookWhiteDefaultPaths',{}):json(p,'guidebookBlackDefaultPaths',{});
 const out={};
 const keys=r===WHITE_PARENT?['page','title','description']:['sectionName','pageNumber','subsection','coverPage'];
 for(const k of keys){const path=defaults[k]||null;const n=byPath(p,path);out[k]={path:path,id:n?.id||null};}
 return out;
}
function saveUIMap(p,m){if(!p||!m)return;const key=role(p)===WHITE_PARENT?'guidebookWhiteUIMap':'guidebookBlackUIMap';p.setPluginData(key,JSON.stringify(m));}
function saveWhite(p,m,rows){const a=mapped(p,m,'page'),b=mapped(p,m,'title'),c=mapped(p,m,'description');const binding={pageMasterId:mid(a),titleMasterId:mid(b),descriptionMasterId:mid(c),pagePath:pathOf(p,a),titlePath:pathOf(p,b),descriptionPath:pathOf(p,c),csvColumns:{title:'TITLE',description:'DESCRIPTION'}};p.setPluginData('guidebookWhiteBinding',JSON.stringify(binding));p.setPluginData('guidebookCsvRows',JSON.stringify(rows));return binding;}
function whiteBinding(p){return{binding:json(p,'guidebookWhiteBinding',{}),rows:rowsNorm(json(p,'guidebookCsvRows',[]))};}
function childMapped(c,b,k){return findMid(c,b?.[`${k}MasterId`])||byPath(c,b?.[`${k}Path`]);}
async function applyRow(p,c,i,b,rows){const r=rows[i];if(!r)return;for(const [k,v]of[['title',r.TITLE],['description',r.DESCRIPTION]]){const n=childMapped(c,b,k);if(n?.type==='TEXT')try{await textFonts(n);n.characters=String(v??'');}catch(e){console.error('CSV binding',k,e);}}c.setPluginData('guidebookChildTitle',r.TITLE);}
async function applyAll(p){const q=whiteBinding(p);for(const c of children(p)){const i=Number(c.getPluginData('guidebookCsvIndex'));if(Number.isInteger(i)&&q.rows[i]){await applyRow(p,c,i,q.binding,q.rows);c.name=whiteName(i+1,q.rows[i].TITLE);}}}
function textLayers(root){return root?.findAll?n=>{}:[];}
function layerData(root){if(!root||!('findAll'in root))return[];return root.findAll(n=>n.type==='TEXT').map(t=>({id:t.id,name:t.name,characters:t.characters.slice(0,70),path:pathOf(root,t)}));}
function send(){const s=figma.currentPage.selection[0],ps=parents(),r=role(s);const out={type:'selection-changed',hasSelection:!!s,parents:ps.map(p=>({id:p.id,name:p.name,role:role(p)}))};if(s){out.name=s.name;out.width=s.width;out.height=s.height;out.parentId=isParent(s)?s.id:null;out.templateType=r===WHITE_PARENT?'content':r===BLACK_PARENT?'section_cover':null;out.textLayers=layerData(s);out.linkedChildCount=isParent(s)?children(s).length:0;if(isParent(s))out.savedMapping=uiMapForParent(s);}figma.ui.postMessage(out);}
async function createParents(){
 const existing=parents(), haveW=existing.find(p=>role(p)===WHITE_PARENT), haveB=existing.find(p=>role(p)===BLACK_PARENT);
 if(haveW&&haveB){
   const top=Math.min(haveB.y,haveW.y), left=Math.min(haveB.x,haveW.x);
   haveB.x=left; haveB.y=top; haveW.x=left; haveW.y=top+haveB.height+150;
   figma.currentPage.selection=[haveB];figma.notify('Guidebook parents already exist.');send();return;
 }
 const b=figma.viewport.bounds;let x=Math.round(b.x+80),y=Math.round(b.y+80);for(const n of figma.currentPage.children)if('x'in n&&'width'in n)x=Math.max(x,Math.round(n.x+n.width+80));
 async function add(p,name,ch,size,col,x,y,w){const t=figma.createText();p.appendChild(t);await font({family:'Inter',style:'Regular'});t.fontName={family:'Inter',style:'Regular'};t.fontSize=size;t.characters=ch;t.fills=[{type:'SOLID',color:col}];t.x=x;t.y=y;if(w){t.textAutoResize='HEIGHT';t.resize(w,t.height);}return t;}
 let white=haveW,black=haveB;
 if(!black){black=figma.createFrame();black.name=BLACK_PARENT_NAME;black.resize(1920,1080);black.x=x;black.y=y;black.fills=[{type:'SOLID',color:{r:.09,g:.09,b:.09}}];const bs=await add(black,'Section Name','SECTION NAME',110,{r:1,g:1,b:1},630,150),bl=await add(black,'Sub-Sections','Primary Logo\nLogo Construction\nClear Space',12,{r:.85,g:.85,b:.85},640,500,360),bp=await add(black,'Page Number','01',13,{r:1,g:1,b:1},1830,60),bc=await add(black,'Cover Page','002',76,{r:1,g:1,b:1},60,430);bp.textAlignHorizontal='RIGHT';parentMeta(black,BLACK_PARENT);ensureIds(black);black.setPluginData('guidebookBlackDefaultPaths',JSON.stringify({sectionName:pathOf(black,bs),subsection:pathOf(black,bl),pageNumber:pathOf(black,bp),coverPage:pathOf(black,bc)}));}
 if(!white){white=figma.createFrame();white.name=WHITE_PARENT_NAME;white.resize(1920,1080);white.x=x;white.y=black?black.y+black.height+150:y+1230;white.fills=[{type:'SOLID',color:{r:1,g:1,b:1}}];const wt=await add(white,'TITLE SUB-SECTION','TITLE SUB-SECTION',22,{r:.08,g:.08,b:.08},60,60),wd=await add(white,'Description','Description for this specific section of the brand guidelines. Every topic will maintain a similar character count to preserve visual balance, clean structural layout, and consistent paragraph length throughout all documentation pages.',12,{r:.35,g:.35,b:.35},320,60,380),wp=await add(white,'Page Number','01',13,{r:.08,g:.08,b:.08},1830,60);wp.textAlignHorizontal='RIGHT';parentMeta(white,WHITE_PARENT);ensureIds(white);white.setPluginData('guidebookWhiteDefaultPaths',JSON.stringify({page:pathOf(white,wp),title:pathOf(white,wt),description:pathOf(white,wd)}));}
 figma.currentPage.selection=[black];figma.viewport.scrollAndZoomIntoView([black,white]);figma.notify('Guidebook parents ready.');send();
}
function groups(rows){const m=new Map(),g=[];rows.forEach((r,i)=>{const s=r.SECTION||'General';if(!m.has(s)){m.set(s,{section:s,rows:[]});g.push(m.get(s));}m.get(s).rows.push(i);});return g;}
async function generate(msg){
 const rows=rowsNorm(msg.csvRows);
 if(!rows.length){figma.notify('CSV has no valid TITLE rows.',{error:true});return;}
 let white=parents().find(p=>role(p)===WHITE_PARENT),black=parents().find(p=>role(p)===BLACK_PARENT);
 const sel=figma.currentPage.selection[0];
 if(isParent(sel)){if(role(sel)===WHITE_PARENT)white=sel;if(role(sel)===BLACK_PARENT)black=sel;}
 if(!white||!black){figma.notify('Create/select both parent frames first.',{error:true});return;}
 ensureIds(white);ensureIds(black);
 for(const n of[...figma.currentPage.children])if(isChild(n))try{n.remove();}catch(_){}
 saveUIMap(white,msg.whiteMapping||{});saveUIMap(black,msg.blackMapping||{});
 const wb=saveWhite(white,msg.whiteMapping||{},rows), wm=mapped(white,msg.whiteMapping||{},'page');
 const bm=msg.blackMapping||{},bn={sectionName:mapped(black,bm,'sectionName'),pageNumber:mapped(black,bm,'pageNumber'),subsection:mapped(black,bm,'subsection'),coverPage:mapped(black,bm,'coverPage')};
 setDynamic(white,[wm,findMid(white,wb.titleMasterId),findMid(white,wb.descriptionMasterId)].map(mid));
 setDynamic(black,Object.values(bn).map(mid));
 white.setPluginData('guidebookPageConfig',JSON.stringify({start:Number(msg.pageStart)||1,format:msg.pageFormat||'pad2'}));
 black.setPluginData('guidebookBlackBinding',JSON.stringify({sectionNameMasterId:mid(bn.sectionName),pageNumberMasterId:mid(bn.pageNumber),subsectionMasterId:mid(bn.subsection),coverPageMasterId:mid(bn.coverPage)}));
 const gs=groups(rows),startX=Math.max(white.x+white.width,black.x+black.width)+OFFSET,startY=Math.min(white.y,black.y),gapX=Math.max(0,Number(msg.gapX)||80),gapY=Math.max(0,Number(msg.gapY)||80),rowH=Math.max(white.height,black.height),format=msg.pageFormat||'pad2';
 let page=Number(msg.pageStart)||1;const all=[];const placement=msg.placementMode||'by-section';const gridCols=Math.max(1,Number(msg.gridColumns)||10);const pending=[];let sequence=0;
 for(let s=0;s<gs.length;s++){
   const g=gs[s];
   const cover=black.clone();figma.currentPage.appendChild(cover);copyIds(black,cover);cover.name=blackName(s+1,g.section);childMeta(cover,black,BLACK_PARENT,s,0,g.rows[0],sequence++);
   for(const[k,v]of Object.entries({sectionName:g.section.toUpperCase(),coverPage:fmt(s+1,format),pageNumber:g.rows.map((r,i)=>fmt(page+1+i,format)).join('\n'),subsection:g.rows.map(r=>rows[r].TITLE).join('\n')})){const n=findMid(cover,mid(bn[k]));if(n?.type==='TEXT')try{await textFonts(n);n.characters=v;}catch(_){} }
   pending.push({node:cover,type:'cover',section:s,column:0});all.push(cover.id);page++;
   for(let local=0;local<g.rows.length;local++){
     const i=g.rows[local],c=white.clone();figma.currentPage.appendChild(c);copyIds(white,c);c.name=whiteName(i+1,rows[i].TITLE);childMeta(c,white,WHITE_PARENT,s,local,i,sequence++);
     const pn=wm?findMid(c,mid(wm)):null;if(pn?.type==='TEXT')try{await textFonts(pn);pn.characters=fmt(page,format);}catch(_){}
     await applyRow(white,c,i,wb,rows);pending.push({node:c,type:'white',section:s,column:local+1});all.push(c.id);page++;
   }
 }
 if(placement==='continuous-grid'){
   const colW=Math.max(white.width,black.width),rowH2=Math.max(white.height,black.height);
   pending.forEach((item,index)=>{const col=index%gridCols,row=Math.floor(index/gridCols);item.node.x=startX+col*(colW+gapX);item.node.y=startY+row*(rowH2+gapY);});
 }else{
   for(let s=0;s<gs.length;s++){
     const y=startY+s*(rowH+gapY),items=pending.filter(x=>x.section===s);
     items.forEach((item,index)=>{item.node.x=startX+index*(Math.max(white.width,black.width)+gapX);item.node.y=y;});
   }
 }
 white.setPluginData('guidebookGeneratedIds',JSON.stringify(all.filter(id=>figma.getNodeById(id)?.getPluginData('generatedRole')===WHITE_CHILD)));
 black.setPluginData('guidebookGeneratedIds',JSON.stringify(all.filter(id=>figma.getNodeById(id)?.getPluginData('generatedRole')===BLACK_CHILD)));
 white.setPluginData('guidebookPlacementConfig',JSON.stringify({mode:placement,columns:gridCols,gapX,gapY}));
 black.setPluginData('guidebookPlacementConfig',JSON.stringify({mode:placement,columns:gridCols,gapX,gapY}));
 figma.currentPage.selection=all.map(id=>figma.getNodeById(id)).filter(Boolean);figma.viewport.scrollAndZoomIntoView(all.map(id=>figma.getNodeById(id)).filter(Boolean));figma.notify(`Generated ${gs.length} covers + ${rows.length} content pages.`);send();
}
async function renumber(){
 const w=parents().find(p=>role(p)===WHITE_PARENT),b=parents().find(p=>role(p)===BLACK_PARENT);if(!w||!b)return;
 const cfg=json(w,'guidebookPageConfig',{start:1,format:'pad2'}),rows=whiteBinding(w).rows,bb=json(b,'guidebookBlackBinding',{}),wb=json(w,'guidebookWhiteBinding',{});
 const all=[...figma.currentPage.children].filter(n=>isChild(n)&&((n.getPluginData('generatedRole')===BLACK_CHILD&&n.getPluginData('linkedParentId')===b.id)||(n.getPluginData('generatedRole')===WHITE_CHILD&&n.getPluginData('linkedParentId')===w.id)));
 const seq=n=>Number.parseInt(n.getPluginData('guidebookSequenceIndex'),10);
 all.sort((a,b)=>{const sa=seq(a),sb=seq(b);if(Number.isFinite(sa)&&Number.isFinite(sb)&&sa!==sb)return sa-sb;const ya=a.y-b.y;if(Math.abs(ya)>1)return ya;return a.x-b.x;});
 let p=Number(cfg.start)||1;
 for(const c of all){
   const blackC=c.getPluginData('generatedRole')===BLACK_CHILD,midPage=blackC?bb.pageNumberMasterId:wb.pageMasterId,n=findMid(c,midPage);
   if(n?.type==='TEXT')try{await textFonts(n);n.characters=fmt(p,cfg.format);}catch(_){}
   if(!blackC){const i=Number(c.getPluginData('guidebookCsvIndex'));if(rows[i])c.name=whiteName(i+1,rows[i].TITLE);}
   p++;
 }
}
figma.on('selectionchange',send);figma.on('documentchange',e=>{if(!liveSync)return;const ids=new Set(),ps=parents();for(const ch of e.documentChanges||[]){if(ch.type==='DELETE'){ps.forEach(p=>ids.add(p.id));continue;}const n=figma.getNodeById(ch.id);if(!n)continue;for(const p of ps){let c=n;while(c){if(c===p){ids.add(p.id);break;}c=c.parent;}}}trigger(ids);if((e.documentChanges||[]).some(x=>x.type==='DELETE'))setTimeout(renumber,70);});
figma.ui.onmessage=async m=>{try{if(m.type==='ui-ready'||m.type==='get-selection'){send();return;}if(m.type==='create-parents'){await createParents();return;}if(m.type==='generate-guidebook'){await generate(m);return;}if(m.type==='save-parent-mapping'){const p=figma.getNodeById(m.parentId);if(p&&isParent(p))saveUIMap(p,m.mapping||{});send();return;}if(m.type==='focus-parent'){const p=parents().find(x=>role(x)===m.role);if(p){figma.currentPage.selection=[p];figma.viewport.scrollAndZoomIntoView([p]);send();}return;}if(m.type==='toggle-live-sync'){liveSync=!!m.enabled;if(liveSync)trigger(new Set(parents().map(p=>p.id)));return;}if(m.type==='resync'){const s=figma.currentPage.selection[0],p=isParent(s)?s:parents().find(x=>x.id===m.parentId)||parents()[0];if(p){await syncParent(p);if(role(p)===WHITE_PARENT)await applyAll(p);await renumber();figma.notify(`Re-synced ${p.name}.`);}send();return;}if(m.type==='renumber'){await renumber();send();}}catch(e){console.error(e);figma.notify(`Master Guidelines: ${e.message||e}`,{error:true});figma.ui.postMessage({type:'error',message:e.message||String(e)});}};
send();
