'use strict';
const fs=require('node:fs'),path=require('node:path'),D=require('../deck'),C=require('../component-workspace'),F=require('../fixed-master'),Z=require('../jszip.min'),PptxGenJS=require('pptxgenjs');
const fixtures=[
 ['cards','soft','auto',1,{title:'重點卡片',body:'結論先行：試行結果符合目標。\n主要證據：完成 001 項檢核，待處理 0 項。\n下一步：擴大驗證並持續追蹤。'}],
 ['beforeafter','solid','auto',1,{title:'改善前與改善後',body:'處理時間 40 分鐘\n處理時間 25 分鐘\n每週人工核對 12 次\n每週人工核對 3 次'}],
 ['cause','soft','each',1,{title:'問題、原因與對策',body:'交付延遲，資訊分散\n缺少共同進度表\n每週確認負責人與時程'}],
 ['timeline','outline','focus',.5,{title:'里程碑與進度',body:'11/01｜需求確認｜已完成\n11/08｜試行驗證｜進行中\n11/15｜結果回顧｜待開始'}]
];
(async()=>{const out=path.resolve(process.argv[2]||'out/component-fixtures.pptx');const models=fixtures.map(([layout,look,rule,ratio,content])=>C.comparison(D.BASE,content,layout,{look,rule,ratio,focus:2,accents:F.SINGLE_SCHEMES[0].accents.slice(),icons:['check_circle','schedule','flag']}));const model={...models[0],slides:models.flatMap(m=>m.slides),warns:[]};const r=await D.exportPptx({JSZip:Z,PptxGenJS},D.BASE,{model,type:'nodebuffer'});fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,r.data);console.log('Wrote four affected component fixtures: '+out);})().catch(e=>{console.error(e);process.exitCode=1});
