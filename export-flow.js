/* One immutable snapshot for validation and export. No dialogs or data edits. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ExportFlow=api;})(typeof window==='object'?window:globalThis,function(){
'use strict';
function copy(value){if(Array.isArray(value))return value.map(copy);if(value&&typeof value==='object'){const out={};for(const k of Object.keys(value))out[k]=copy(value[k]);return out;}return value;}
function failure(code,message,report){const e=new Error(message);e.code=code;e.exportCancelled=/CANCELLED|STALE|BUSY/.test(code);if(report)e.report=report;return e;}
function create(options){
 let active=null,last=null;
 const revision=()=>options.revision?options.revision():'';
 const publish=(report,state)=>{last={report,state};if(options.report)options.report(report,state);};
 function cancel(){if(!active)return false;active.cancelled=true;publish(active.report||{status:'ready',issues:[]},'cancelled');return true;}
 async function run(params,opt){
  if(active)throw failure('EXPORT_BUSY','已有下載正在處理；請等待完成或取消。');
  const job={revision:revision(),cancelled:false};active=job;
  try{
   const p=copy(params),settings=copy(opt||{}),prepare=settings.prepare;delete settings.prepare;
   if(typeof prepare==='function'){
    job.report={status:'ready',issues:[]};publish(job.report,'preparing');
    settings.model=await prepare(p);
    if(job.cancelled)throw failure('EXPORT_CANCELLED','已取消匯出，未下載檔案。');
    if(job.stale||job.revision!==revision())throw failure('EXPORT_STALE','內容或樣式已變更，請重新下載以檢查目前版本。');
   }
   const model=settings.model||options.build(p,settings);
   settings.model=model;
   job.report=options.check(model,p);publish(job.report,'checked');
   if(job.report.status==='blocked')throw failure('EXPORT_BLOCKED','必須修正：請查看匯出前檢查的位置與原因。',job.report);
   if(job.cancelled)throw failure('EXPORT_CANCELLED','已取消匯出。');
   publish(job.report,'exporting');
   const result=await options.export(p,settings);
   if(job.cancelled)throw failure('EXPORT_CANCELLED','已取消匯出，未下載檔案。');
   if(job.stale||job.revision!==revision())throw failure('EXPORT_STALE','內容或樣式已變更，請重新下載以檢查目前版本。');
   publish(job.report,'complete');return result;
  }catch(error){
   if(error.code==='EXPORT_STALE')publish(job.report||{status:'ready',issues:[]},'stale');
   else if(error.code==='EXPORT_CANCELLED')publish(job.report||{status:'ready',issues:[]},'cancelled');
   else if(error.code!=='EXPORT_BLOCKED')publish(job.report||{status:'ready',issues:[]},'failed');
   throw error;
  }finally{if(active===job)active=null;}
 }
 function invalidate(){if(active)active.stale=true;else if(last)publish(last.report,'stale');}
 return{run,cancel,invalidate,busy:()=>!!active,last:()=>last};
}
return{create,copy};
});
