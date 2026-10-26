/* Independent effect/contrast contracts, not expectations from the resolver. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),Z=require('../jszip.min.js'),N=require('../native-styles.js');
const root=path.resolve(__dirname,'..'),box={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'stylekit-data.js'),'utf8'),box);
const block=(s,t)=>(s.match(new RegExp('<a:'+t+'\\b[^>]*>[\\s\\S]*?</a:'+t+'>'))||[])[0];
const blocks=(s,t)=>[...s.matchAll(new RegExp('<a:'+t+'\\b[^>]*>[\\s\\S]*?</a:'+t+'>','g'))].map(m=>m[0]);
const channel=h=>h.match(/../g).map(v=>parseInt(v,16)),linear=v=>(v/=255)<=.04045?v/12.92:((v+.055)/1.055)**2.4;
function ratio(a,b){const l=h=>channel(h).map(linear).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),x=l(a),y=l(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function resolve(xml,palette){const scheme=xml.match(/<a:schemeClr val="([^"]+)"/),fixed=xml.match(/<a:srgbClr val="([A-F0-9]+)"/);let values=channel(scheme?palette[scheme[1]]:fixed[1]).map(linear);for(const m of xml.matchAll(/<a:(tint|shade) val="(\d+)"\/>/g)){const k=+m[2]/100000;values=values.map(v=>m[1]==='tint'?v*k+1-k:v*k);}return values.map(v=>Math.round(255*(v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055)).toString(16).padStart(2,'0')).join('').toUpperCase();}
function matrixContract(theme){const fmt=block(theme,'fmtScheme');assert(fmt.includes('name="PPT Style Studio rectangle presets"'));const fills=blocks(block(fmt,'fillStyleLst'),'solidFill'),lines=blocks(block(fmt,'lnStyleLst'),'ln'),effects=blocks(block(fmt,'effectStyleLst'),'effectStyle');assert.equal(fills.length,3);assert.equal(lines.length,3);assert.equal(effects.length,3);
 assert(!block(fmt,'fillStyleLst').includes('<a:gradFill'));assert(fills[1].includes('<a:tint val="20000"/>'));assert(fills[2].includes('<a:srgbClr val="F2F2F2"/>'));
 assert.deepEqual(lines.map(x=>+x.match(/<a:ln w="(\d+)"/)[1]),[12700,6350,22225]);assert(lines[0].includes('val="BFBFBF"'));assert(lines[1].includes('val="D9D9D9"'));assert(lines[2].includes('<a:schemeClr val="phClr"'));
 assert.deepEqual(effects.slice(0,2).map(x=>[+x.match(/blurRad="(\d+)"/)[1],+x.match(/dist="(\d+)"/)[1],+x.match(/<a:alpha val="(\d+)"/)[1]]),[[88900,25400,24000],[53340,19050,28000]]);assert.equal(effects[2],'<a:effectStyle><a:effectLst/></a:effectStyle>');assert(!/<a:(?:bevel|scene3d|sp3d|glow)\b/.test(fmt));return{fmt,fills,lines};}
// Literal role contract: outer cards first, then the seven distinct rectangles.
const REFS=[[1,1,1],[1,2,1],[1,3,1],[1,1,0],[2,0,0],[3,0,0],[1,3,0],[1,0,2],[1,3,2],[1,0,0]];
function gridContract(slides,theme){assert.equal(slides.length,2);const palette={tx1:resolve(block(theme,'dk1'),{}),lt1:resolve(block(theme,'lt1'),{}),dk2:resolve(block(theme,'dk2'),{})};for(let i=1;i<=6;i++)palette['accent'+i]=resolve(block(theme,'accent'+i),{});const {fills,lines}=matrixContract(theme),all=[];let min=99;
 for(const [page,slide]of slides.entries()){
  const shapes=[...slide.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)].map(m=>m[0]).filter(s=>s.includes('name="Native style row '));assert.equal(shapes.length,35,'five rows per page');
  const seen=new Set();for(const s of shapes){const match=s.match(/name="Native style row (\d+) (tx1|accent[1-6])"/),row=+match[1]-1,role=match[2];assert(row>=page*5&&row<page*5+5,'row on expected page');const key=row+'/'+role;assert(!seen.has(key));seen.add(key);all.push({row,role,s});
   const style=s.match(/<p:style>[\s\S]*?<\/p:style>/)[0],fill=block(style,'fillRef'),font=block(style,'fontRef'),line=block(style,'lnRef'),effect=block(style,'effectRef'),run=block(s,'rPr'),fillIndex=+fill.match(/idx="(\d+)"/)[1];
   assert.deepEqual([fillIndex,+line.match(/idx="(\d+)"/)[1],+effect.match(/idx="(\d+)"/)[1]],REFS[row],'native matrix references');
   assert(fill.includes('<a:schemeClr val="'+([0,1,2,3,6].includes(row)?'lt1':role)+'"'),'fill role');
   const base=resolve(fill,palette),bg=resolve(fills[fillIndex-1],{phClr:base}),actual=resolve(block(run,'solidFill'),palette);assert.equal(actual,resolve(font,palette),'run must agree with fontRef');const c=ratio(actual,bg);min=Math.min(min,c);assert(c>=4.5,'Contrast below 4.5: row '+(row+1)+' '+actual+'/'+bg+'='+c);
   const expectedRole=[0,1,2,3,5].includes(row)?'dk2':row>=7?'lt1':role;assert(font.includes('<a:schemeClr val="'+expectedRole+'"'),'font role');
   assert(s.includes('<a:prstGeom prst="roundRect">'));assert(s.includes('<a:gd name="adj" fmla="val 17241"/>'));assert(run.includes('b="'+(row>=6?1:0)+'"'));assert(s.includes('<a:t>'+(row<3?'外層卡片':row>=7?'關鍵步驟':'處理步驟')+'</a:t>'));
   if([0,1,2,3,6].includes(row))assert.equal(bg,'FFFFFF');if(row===5)assert.equal(bg,'F2F2F2');if(row>=7)assert.equal(actual,'FFFFFF');
   const pr=s.match(/<p:spPr>[\s\S]*?<\/p:spPr>/)[0],direct=block(pr,'ln'),widths=[1.25,.5,1.75,1,0,0,2.25,0,2.25,0];
   if(widths[row]===0){assert(direct.includes('<a:noFill/>'));}else{
    if([0,6,8].includes(row))assert(direct,'override required for border not present in matrix');else assert(!direct,'matrix line should be used');
    const resolvedLine=direct||lines[REFS[row][1]-1];assert.equal(+resolvedLine.match(/w="(\d+)"/)[1],Math.round(widths[row]*12700));
    const lineColor=resolve(block(resolvedLine,'solidFill'),{...palette,phClr:resolve(line,palette)});assert.equal(lineColor,row===0?'666666':row===1?'D9D9D9':row===3?'BFBFBF':row===8?'FFFFFF':palette[role]);
   }
   if(row===7||row===8)assert(+fill.match(/<a:shade val="(\d+)"\/>/)[1]<=65000,'deep fill is deliberately shaded');
   if(row===9&&ratio('FFFFFF',palette[role])>=4.6)assert.equal(bg,palette[role],'bright solid retains readable source color');
  }
 }
 assert.equal(new Set(all.map(x=>x.row+'/'+x.role)).size,70);return min;
}
async function packageContract(z){const presentation=await z.file('ppt/presentation.xml').async('string'),rels=await z.file('ppt/_rels/presentation.xml.rels').async('string'),types=await z.file('[Content_Types].xml').async('string');assert.equal((presentation.match(/<p:sldId /g)||[]).length,5);assert.equal(Object.keys(z.files).filter(f=>/^ppt\/slides\/slide\d+\.xml$/.test(f)).length,5);const r=rels.match(/<Relationship Id="([^"]+)"[^>]*Type="[^"]+\/slide" Target="slides\/slide5.xml"\/?>/);assert(r,'fifth slide relationship');assert(presentation.includes('r:id="'+r[1]+'"'));assert(types.includes('PartName="/ppt/slides/slide5.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"'));assert.equal(await z.file('ppt/slides/_rels/slide5.xml.rels').async('string'),await z.file('ppt/slides/_rels/slide4.xml.rels').async('string'));assert((await z.file('docProps/app.xml').async('string')).includes('<Slides>5</Slides>'));}
(async()=>{let packages=0,min=99;const generated=process.argv.includes('--generated'),builder=generated?require('./build_native_stylekit.js'):null;let mutationZip;
 for(const t of box.window.STYLEKIT_THEMES)for(const source of ['common','theme']){const built=generated?(await builder.buildOne(t,source)).out:null;for(const ext of ['pptx','potx']){const z=await Z.loadAsync(built?built[ext]:fs.readFileSync(path.join(root,'native-stylekit',source,t.id+'.'+ext))),seed=await Z.loadAsync(fs.readFileSync(path.join(root,'stylekit',t.id+'.pptx'))),theme=await z.file('ppt/theme/theme1.xml').async('string'),old=await seed.file('ppt/theme/theme1.xml').async('string');matrixContract(theme);assert.equal(block(theme,'fontScheme'),block(old,'fontScheme'));assert.equal(block(theme,'bgFillStyleLst'),block(old,'bgFillStyleLst'));await packageContract(z);min=Math.min(min,gridContract(await Promise.all([4,5].map(n=>z.file('ppt/slides/slide'+n+'.xml').async('string'))),theme));packages++;if(t.id==='navy'&&source==='common'&&ext==='pptx')mutationZip=z;}}
 const xml=await mutationZip.file('ppt/theme/theme1.xml').async('string'),slides=await Promise.all([4,5].map(n=>mutationZip.file('ppt/slides/slide'+n+'.xml').async('string')));
 assert.throws(()=>matrixContract(xml.replace('blurRad="53340"','blurRad="203200"')));
 assert.throws(()=>gridContract([slides[0].replace(/<a:fontRef idx="minor">[\s\S]*?<\/a:fontRef>/,'<a:fontRef idx="minor"><a:schemeClr val="lt1"/></a:fontRef>'),slides[1]],xml));
 const wrongGray=xml.replace('<a:solidFill><a:srgbClr val="F2F2F2"/></a:solidFill>','<a:solidFill><a:srgbClr val="D5A80C"/></a:solidFill>');assert.notEqual(wrongGray,xml);assert.throws(()=>matrixContract(wrongGray));
 assert.throws(()=>gridContract([slides[0].replace('prst="roundRect"','prst="diamond"'),slides[1]],xml));
 assert.throws(()=>gridContract([slides[0].replace('w="15875"','w="3175"'),slides[1]],xml));
 const wrongShadow=slides[1].replace(/(name="Native style row 10 tx1"[\s\S]*?<a:effectRef) idx="0"/,'$1 idx="2"');assert.notEqual(wrongShadow,slides[1]);assert.throws(()=>gridContract([slides[0],wrongShadow],xml));
 // General palette application must never apply the Kit matrix to the fixed master.
 const fixed=await Z.loadAsync(fs.readFileSync(path.join(root,'fixed-master/Fixed_Red_Template.pptx'))),before={};for(const n of Object.keys(fixed.files).filter(n=>/(?:^|\/)theme[^/]*\.xml$/.test(n)))before[n]=block(await fixed.file(n).async('string'),'fmtScheme');await N.applyToZip(fixed,{source:'common'});for(const n of Object.keys(before))assert.equal(block(await fixed.file(n).async('string'),'fmtScheme'),before[n]);
 // Literal values observed in PowerPoint 16.0.20527.20088, not resolver-generated.
 assert.equal(N.transform('E7BF4A',[['shade',45000]]),'A28531');assert.equal(N.transform('7D8795',[['shade',45000]]),'565D67');
 for(const color of ['FFFFFF','FFFF00','777777','123456','AC0571','03DAE1'])for(let row=0;row<10;row++){const e=N.kitEffect(color,row);assert(e.backgrounds.every(bg=>ratio(e.foreground,bg)>=4.5));}
 console.log(JSON.stringify({packages,galleryPages:packages*2,shapeContrastChecks:packages*70,minimumContrast:min,mutations:6,fixedMasterFmtScheme:'unchanged',mode:generated?'generated in memory':'built assets',ribbonUI:'not covered'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
