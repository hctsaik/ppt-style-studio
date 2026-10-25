// Portable one-command environment overrides for Windows and POSIX test runs.
'use strict';
const cp=require('node:child_process'),args=process.argv.slice(2),env={...process.env};
while(args.length&&/^[A-Za-z_][A-Za-z0-9_]*=/.test(args[0])){const v=args.shift(),i=v.indexOf('=');env[v.slice(0,i)]=v.slice(i+1);}
if(!args.length)throw new Error('A command is required');
const executable=args.shift(),result=cp.spawnSync(executable==='node'?process.execPath:executable,args,{env,stdio:'inherit'});
if(result.error){console.error(result.error.message);process.exitCode=1;}else process.exitCode=result.status==null?1:result.status;
