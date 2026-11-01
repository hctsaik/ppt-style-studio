'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),D=require('../deck'),C=require('../component-workspace'),Z=require('../jszip.min');
const PptxGenJS=require('pptxgenjs');
(async()=>{
 for(const [q,k] of [['結論','decide'],['對比','cmp3'],['風險','mtx'],['流程','steps'],['KPI','kpi']])assert(C.purposeMatches(k,q));
 assert(!C.purposeMatches('cover','風險'));assert.throws(()=>C.cleanPages(['cards','cards']));assert.throws(()=>C.cleanPages(['unknown']));
 const params={...D.BASE},labels={},original=JSON.stringify({params,labels});
 const pack=C.packPlan(params,['kpi','cards','decide'],labels);assert.equal(pack.kind,'pptx');assert.deepEqual(pack.models[0].slides.map(s=>s.key),['kpi','cards','decide']);
 const mixed=C.packPlan(params,['cards','schemebody','kpi'],labels);assert.equal(mixed.kind,'zip');assert.deepEqual(mixed.models.map(m=>m.slides[0].key),['cards','schemebody','kpi']);assert(mixed.models[1].slides[0].schemeCatalogue);assert.equal(JSON.stringify({params,labels}),original);
 const input={title:'相同內容 <img onerror=bad>',body:'第一段保留 001 與 0\n第二段：比較兩個方向\n第三段：下一步'},models=C.LAYOUTS.map(l=>C.comparison(params,input,l.id));
 for(const m of models){assert.deepEqual(m.comparison.paragraphs,input.body.split('\n'));const texts=m.slides[0].items.filter(i=>i.name&&i.name.startsWith('共同內文'));assert.deepEqual(texts.slice(0,3).map(i=>i.runs[0].t),input.body.split('\n'));assert(texts.every(i=>i.noAutoShrink&&i.runs[0].o.size===20));const svg=D.toSvg(m.slides[0]);assert(!svg.includes('<img onerror'));assert(svg.includes('&lt;img'));}
 assert.throws(()=>C.comparison(params,{title:'A',body:'1\n2\n3\n4\n5\n6\n7'},'single'),/最多 6/);
 const light=['5470C6','91CC75','FAC858','EE6666','73C0DE','3BA272'];for(const ratio of [1,.5,1/3]){const m=C.comparison(params,input,'cards',{look:'solid',rule:'each',ratio,accents:light,icons:['check_circle']});assert.equal(m.comparison.region.w,(D.W-1.3)*ratio);for(const b of m.slides[0].items.filter(i=>i.name&&i.name.startsWith('內容容器')))assert(1.05/(C.luminance(b.fill)+.05)>=4.5);assert.equal(m.params.P,light[0]);assert.equal(params.P,D.BASE.P);}
 const boxes=m=>m.slides[0].items.filter(i=>i.name&&i.name.startsWith('內容容器'));
 const compact=C.comparison(params,{title:'三項卡片',body:'第一項內容\n第二項內容\n第三項內容'},'cards');
 const cb=boxes(compact);assert.equal(new Set(cb.map(b=>b.y)).size,1);assert(cb.every(b=>b.h<2));assert.equal(new Set(cb.map(b=>b.w)).size,1);
 const narrow=C.comparison(params,{title:'三項卡片',body:'第一項內容\n第二項內容\n第三項內容'},'cards',{ratio:.5});assert.equal(new Set(boxes(narrow).map(b=>b.x)).size,1);
 const pairedInput={title:'前後比較',body:'40 分鐘\n25 分鐘\n12 次\n3 次'},pair=C.comparison(params,pairedInput,'beforeafter',{look:'solid',icons:['check_circle','check_circle','flag']});
 const pb=boxes(pair);assert.equal(pb[0].fill,pb[2].fill);assert.equal(pb[1].fill,pb[3].fill);assert.notEqual(pb[0].fill,pb[1].fill);
 const texts=pair.slides[0].items.filter(i=>i.name&&i.name.startsWith('共同內文'));assert(Math.abs((texts[2].x-pb[2].x)-(texts[3].x-pb[3].x))<1e-6);assert.equal(texts[2].y,texts[3].y);
 const multi=C.comparison(params,pairedInput,'beforeafter',{rule:'each',accents:light});assert.notEqual(boxes(multi)[0].fill,boxes(multi)[2].fill);
 const timelineInput={title:'進度',body:'11/01｜需求確認｜已完成\n11/08|試行驗證|進行中\n保留 | 原始 | 其他 | 文字'},timeline=C.comparison(params,timelineInput,'timeline',{ratio:.5});assert.deepEqual(timeline.comparison.paragraphs,timelineInput.body.split('\n'));assert.deepEqual(timeline.comparison.milestones.map(e=>e.parsed),[true,true,false]);
 assert.equal(timeline.slides[0].items.find(i=>i.name==='共同內文 1').runs[0].t,'需求確認');assert.equal(timeline.slides[0].items.find(i=>i.name==='里程碑日期 1').runs[0].t,'11/01');assert.equal(timeline.slides[0].items.find(i=>i.name==='里程碑狀態 1').runs[0].t,'已完成');assert.equal(timeline.slides[0].items.find(i=>i.name==='共同內文 3').runs[0].t,'保留 | 原始 | 其他 | 文字');assert(boxes(timeline).every(b=>b.h<1.5));
 for(const m of [pack.models[0],...models]){const r=await D.exportPptx({JSZip:Z,PptxGenJS},params,{model:m,type:'nodebuffer'}),z=await Z.loadAsync(r.data);assert.equal(Object.keys(z.files).filter(k=>/^ppt\/slides\/slide\d+\.xml$/.test(k)).length,m.slides.length);const xml=await z.file('ppt/slides/slide1.xml').async('string');assert(xml.includes('<p:sp>'));assert(!xml.includes('<p:pic>'));if(m.comparison){assert(xml.includes('第一段保留 001 與 0'));assert(!xml.includes('<a:normAutofit'));}
  if(m.comparison&&m.comparison.layout==='cards'){const out=path.resolve(__dirname,'../../acceptance/component-polish/component-comparison.pptx');fs.writeFileSync(out,r.data);}
 }
 console.log('PASS scoped component groups: preserved purpose/pack/content contracts; compact balanced cards; semantic pairs/icon gutter; parsed timeline with raw fallback; native PPTX');
})().catch(e=>{console.error(e);process.exitCode=1});
