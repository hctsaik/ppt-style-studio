/* One current fixture only: page identities, native sections/samples and the
 * two approved material rows. No site-wide export or palette matrix. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),Z=require('../jszip.min'),F=require('../fixed-master'),N=require('../native-styles');
const {JSDOM}=require('jsdom'),parser=new(new JSDOM('').window.DOMParser)();
const P='http://schemas.openxmlformats.org/presentationml/2006/main',A='http://schemas.openxmlformats.org/drawingml/2006/main',R='http://schemas.openxmlformats.org/officeDocument/2006/relationships',P14='http://schemas.microsoft.com/office/powerpoint/2010/main';
const els=(d,ns,n)=>[...d.getElementsByTagNameNS(ns,n)],parse=s=>{const d=parser.parseFromString(s,'application/xml');assert.equal(d.getElementsByTagName('parsererror').length,0);return d;};
const read=(z,n)=>z.file(n).async('string'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const resolve=(owner,t)=>path.posix.normalize(t.startsWith('/')?t.slice(1):path.posix.join(path.posix.dirname(owner),t));
(async()=>{
 const bytes=process.argv[2]?fs.readFileSync(process.argv[2]):await F.exportPptx(Z),z=await Z.loadAsync(bytes),pres=parse(await read(z,'ppt/presentation.xml')),rels=parse(await read(z,'ppt/_rels/presentation.xml.rels'));
 const links=new Map(els(rels,'http://schemas.openxmlformats.org/package/2006/relationships','Relationship').map(r=>[r.getAttribute('Id'),resolve('ppt/presentation.xml',r.getAttribute('Target'))]));
 const ids=els(pres,P,'sldId'),ordered=ids.map(s=>links.get(s.getAttributeNS(R,'id')));
 assert.equal(ordered.length,24);assert.equal(F.DOWNLOAD_PAGES.length,24);assert(!z.file('ppt/slides/slideCover.xml'));assert(!z.file('ppt/slides/slide2.xml'));assert(!z.file('ppt/notesSlides/notesSlide2.xml'));
 assert.deepEqual(F.DOWNLOAD_PAGES.slice(0,5).map(p=>p.schemeId),['07','06','03','10','04']);
 assert.deepEqual(F.DOWNLOAD_PAGES.slice(8).map(p=>[p.styleId,p.key]),['navy','teal','green','frame'].flatMap(s=>['catalog','cards','schemebody','schemeiconbody'].map(k=>[s,k])));
 const sec=els(pres,P14,'section');assert.equal(sec.length,6);assert.deepEqual(sec.map(s=>els(s,P14,'sldId').length),[5,3,4,4,4,4]);assert.deepEqual(sec.flatMap(s=>els(s,P14,'sldId').map(x=>x.getAttribute('id'))),ids.map(x=>x.getAttribute('id')));
 const tuples=[[2,1,0,'lt1','dk1'],[2,1,0,'self','lt1'],[3,1,1,'self','lt1'],[1,2,1,'self','dk1'],[1,3,2,'self','lt1'],[0,3,3,'self','lt1']];
 for(let i=0;i<ordered.length;i++){
  const d=parse(await read(z,ordered[i])),fields=els(d,A,'fld').filter(n=>n.getAttribute('type')==='slidenum');assert.equal(fields.length,1);assert.equal(els(fields[0],A,'t')[0].textContent,String(i+1));
  if(i<5){const samples=els(d,P,'sp').filter(s=>/^Native ShapeStyle /.test(els(s,P,'cNvPr')[0]?.getAttribute('name')));assert.equal(samples.length,36);assert.equal(els(d,P,'pic').length,0);
   for(const [j,s]of samples.entries()){const row=Math.floor(j/6),col=j%6,role='accent'+(col+1),tuple=tuples[row],spPr=els(s,P,'spPr')[0];assert.equal(els(spPr,A,'solidFill').length,0);assert.equal(els(spPr,A,'ln').length,0);assert.equal(els(spPr,A,'effectLst').length,0);for(const[k,type]of ['lnRef','fillRef','effectRef'].entries())assert.equal(+els(s,A,type)[0].getAttribute('idx'),tuple[k]);assert.equal(els(els(s,A,'fillRef')[0],A,'schemeClr')[0].getAttribute('val'),tuple[3]==='self'?role:tuple[3]);assert.equal(els(els(s,A,'fontRef')[0],A,'schemeClr')[0].getAttribute('val'),tuple[4]);}
   const content=els(d,P,'sp').find(s=>els(s,P,'ph').some(p=>p.getAttribute('idx')==='1'));assert.equal(els(content,A,'p').length,3);assert.deepEqual(els(content,A,'pPr').map(p=>p.getAttribute('lvl')),['0','1','2']);assert.equal(els(d,A,'highlight').length,0);
  }
 }
 const mat=parse(await read(z,ordered[5]));for(let row=0;row<2;row++)for(let col=0;col<7;col++){
  const role=col?'accent'+col:'tx1',s=els(mat,P,'sp').find(s=>els(s,P,'cNvPr')[0]?.getAttribute('name')==='Material card '+(row+1)+' '+role),pr=els(s,P,'spPr')[0];assert(s);assert.equal(els(pr,A,'outerShdw').length,1);
  const fc=els(pr,A,'solidFill')[0].firstElementChild;
  if(col===0)assert.equal(fc.getAttribute('val'),'lt1');else{assert.equal(fc.getAttribute('val'),role);if(row===0)assert.equal(els(fc,A,'tint')[0].getAttribute('val'),'20000');else{const mods=[...fc.children].map(n=>[n.localName,+n.getAttribute('val')]),bg=N.transform(F.SINGLE_SCHEMES[0].accents[col-1],mods);assert(N.contrast(bg,'FFFFFF')>=4.5);}}
 }
 assert.equal(els(parse(await read(z,ordered[7])),A,'highlight').length,8);assert.equal(els(parse(await read(z,'ppt/presProps.xml')),P,'clrMru')[0].children.length,8);
 const original=F.originalBytes(),source=await Z.loadAsync(original);assert.equal(hash(original),'1d42e27915855f57c1bee5ad185526ee62c51818223e9cfde20609dcf47c1fae');for(const n of Object.keys(source.files).filter(n=>!source.files[n].dir&&(/^ppt\/(media|slideLayouts)\//.test(n)||n==='ppt/slideMasters/slideMaster1.xml'||/^ppt\/notes/.test(n)&&z.file(n))))assert.deepEqual(await z.file(n).async('uint8array'),await source.file(n).async('uint8array'),n);
 // Resolve every internal relationship, including the shifted catalogue links.
 for(const n of Object.keys(z.files).filter(n=>n.endsWith('.rels'))){const owner=n==='_rels/.rels'?'':n.replace(/_rels\//,'').replace(/\.rels$/,'');for(const rel of els(parse(await read(z,n)),'http://schemas.openxmlformats.org/package/2006/relationships','Relationship'))if(!rel.hasAttribute('TargetMode'))assert(z.file(resolve(owner,rel.getAttribute('Target'))),n+' '+rel.getAttribute('Target'));}
 const m=require('../fixed-master/download-manifest.json');assert.equal(m.slideCount,24);assert.deepEqual(m.secondary.mainPageNumbers,[6,7,8]);assert.deepEqual(m.sections.map(s=>s.pages.length),[5,3,4,4,4,4]);
 console.log(JSON.stringify({status:'pass',pages:24,sections:6,nativeSamples:180,materialChanges:12,highlights:8,sha256:hash(bytes)}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
