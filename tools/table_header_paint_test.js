/* Focused row/column header paint regression: one 3x3 fixture, no site matrix. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),D=require('../deck'),{PptxGenJS,JSZip}=require('./bundled_export_env');
const {JSDOM}=require('jsdom');
const rows=[['名稱','數值','備註'],['Google','15GB','正常'],['Gmail','20GB','確認']];
const params={...D.PRESETS[0],tbSizingVersion:2,tbWidthMode:'45',tbHeightMode:'optimal',tbHeaderStyle:'primary',tbStripes:true};
const fixture=mode=>D.tableSetHeaderMode({rows:JSON.parse(JSON.stringify(rows)),title:mode,unit:'',note:'',lastTotal:false,bold:[],his:[],rules:[],types:{0:'text',1:'text',2:'text'},sizingFont:{bodyPt:13,headerPt:11,scale:1,autoBoost:1}},mode);
const cellTable=m=>m.slides[0].items.find(i=>i.t==='tbl');
const render=(mode,p=params,t=fixture(mode))=>D.buildModel(p,{table:t});
const dir=process.env.HEADER_FIXTURE_DIR;
(async()=>{
 const reference=cellTable(render('row')).cells[0][0];let count=0;
 for(const mode of ['row','col','both']){
  const t=fixture(mode),before=JSON.stringify(t),m=render(mode,params,t),tb=cellTable(m);D.assertTableExportComplete(m);
  assert.equal(JSON.stringify(t),before);assert.deepEqual(m.slides[0].table.rawRows,rows);assert(Math.abs(tb.w-D.W*.45)<1e-7);
  for(let r=0;r<3;r++)for(let c=0;c<3;c++)if(mode==='row'&&r===0||mode==='col'&&c===0||mode==='both'&&(r===0||c===0)){
   assert.equal(tb.cells[r][c].fill,reference.fill,mode+' header fill');assert.equal(tb.cells[r][c].color,reference.color,mode+' header ink');assert(tb.cells[r][c].bold);
  }
  if(mode==='both')assert.deepEqual(tb.cells[0][0],reference,'corner matches a single header application');
  const html=new JSDOM(D.tableHtml(m)).window.document;assert.equal(html.querySelectorAll('th[scope="col"]').length,mode==='col'?0:3);assert.equal(html.querySelectorAll('th[scope="row"]').length,mode==='row'?0:mode==='col'?3:2);
  const result=await D.exportPptx({PptxGenJS,JSZip},params,{model:m,type:'nodebuffer'}),zip=await JSZip.loadAsync(result.data),xml=await zip.file('ppt/slides/slide1.xml').async('string');
  const doc=new JSDOM(xml,{contentType:'application/xml'}).window.document,cells=[...doc.getElementsByTagName('a:tc')],pr=doc.getElementsByTagName('a:tblPr')[0];
  assert.equal(pr.getAttribute('firstRow'),mode==='col'?'0':'1');assert.equal(pr.getAttribute('firstCol'),mode==='row'?'0':'1');assert.equal(cells.length,9);
  for(let i=0;i<9;i++){assert.equal([...cells[i].getElementsByTagName('a:t')].map(n=>n.textContent).join(''),rows.flat()[i]);const r=Math.floor(i/3),c=i%3;if(mode==='row'&&r===0||mode==='col'&&c===0||mode==='both'&&(r===0||c===0)){const cp=cells[i].getElementsByTagName('a:tcPr')[0];assert.equal(cp.querySelector('solidFill > srgbClr')?.getAttribute('val')||[...cp.children].find(n=>n.localName==='solidFill')?.firstElementChild?.getAttribute('val'),reference.fill);}}
  if(dir){fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'header-'+mode+'.pptx'),result.data);fs.writeFileSync(path.join(dir,'header-'+mode+'.html'),D.tableHtml(m));}
  console.log('PASS '+mode+' selected header paint, corner/roles/data, 45% and native output');count++;
 }
 const plain={...params,tbHeaderStyle:'normal'},row=cellTable(render('row',plain)),col=cellTable(render('col',plain));assert.equal(col.cells[1][0].fill,row.cells[0][0].fill);assert.equal(col.cells[1][0].color,row.cells[0][0].color);console.log('PASS column follows normal header appearance');count++;
 const t=fixture('col');t.his=[{type:'range',r0:1,r1:1,c0:0,c1:0,presetId:'v4-role-deep'}];const marked=cellTable(render('col',params,t)).cells[1][0];const t2=fixture('row');t2.his=JSON.parse(JSON.stringify(t.his));const ordinary=cellTable(render('row',params,t2)).cells[1][0];assert.equal(marked.fill,params.PD);assert.equal(marked.fill,ordinary.fill);assert.equal(marked.color,ordinary.color);console.log('PASS manual range paint stays after header paint');count++;
 console.log(JSON.stringify({passed:count,fixture:'one 3x3 table',nativeFiles:3}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
