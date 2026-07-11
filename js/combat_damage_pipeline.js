// RO_WEB 0.9.82 - RA Renewal common combat pipeline / registry runtime
(function(){
"use strict";
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,num(v)));
function registry(name){
  const entries=[];
  return {
    name,
    register(entry){ if(entry&&entry.key&&typeof entry.apply==='function'&&!entries.some(x=>x.key===entry.key)) entries.push(entry); return this; },
    run(ctx){ for(const entry of entries){ try{ if(entry.condition && !entry.condition(ctx)) continue; const out=entry.apply(ctx); if(out&&typeof out==='object') Object.assign(ctx,out); if(ctx.stopRegistry) break; }catch(err){ console.warn(`[${name}] ${entry.key} skipped`,err); } } ctx.stopRegistry=false; return ctx; },
    list(){ return entries.map(x=>x.key); }
  };
}
const PassiveProcRegistry=registry('PassiveProcRegistry');
const ElementModifierRegistry=registry('ElementModifierRegistry');
const RaceModifierRegistry=registry('RaceModifierRegistry');
const SizeModifierRegistry=registry('SizeModifierRegistry');
const DefenseModifierRegistry=registry('DefenseModifierRegistry');
const StatusModifierRegistry=registry('StatusModifierRegistry');

function passiveTotals(){ return typeof window.getPassiveSkillBonusTotals==='function'?(window.getPassiveSkillBonusTotals()||{}):{}; }
PassiveProcRegistry
.register({key:'triple_attack',condition:ctx=>ctx.kind==='normal'&&ctx.allowNormalProc!==false&&num(passiveTotals().tripleAttackChance)>0,apply(ctx){const p=passiveTotals();if(Math.random()*100>=clamp(p.tripleAttackChance,0,100))return;ctx.proc={key:'triple',ratio:num(p.tripleAttackRatio,100),hits:num(p.tripleAttackHits,3)};ctx.ratio=ctx.proc.ratio;ctx.visualHits=ctx.proc.hits;ctx.stopRegistry=true;}})
.register({key:'double_attack',condition:ctx=>ctx.kind==='normal'&&ctx.allowNormalProc!==false&&num(passiveTotals().doubleAttackHits,1)>1,apply(ctx){const p=passiveTotals();if(Math.random()*100>=clamp(p.doubleAttackChance,0,100))return;ctx.proc={key:'double',ratio:num(p.doubleAttackHits,2)*100,hits:num(p.doubleAttackHits,2)};ctx.ratio=ctx.proc.ratio;ctx.visualHits=ctx.proc.hits;ctx.stopRegistry=true;}})
.register({key:'falcon_auto_attack',condition:ctx=>ctx.kind==='normal'&&ctx.source?.hasFalcon===true&&num(ctx.source?.falconAutoAttackChance)>0,apply(ctx){if(Math.random()*100>=clamp(ctx.source.falconAutoAttackChance,0,100))return;ctx.secondaryProcs=ctx.secondaryProcs||[];ctx.secondaryProcs.push({key:'falcon',pendingDamageRuntime:true});}})
.register({key:'auto_spell',condition:ctx=>ctx.kind==='normal'&&Array.isArray(ctx.source?.autoSpellProcs)&&ctx.source.autoSpellProcs.length>0,apply(ctx){ctx.secondaryProcs=ctx.secondaryProcs||[];for(const p of ctx.source.autoSpellProcs){if(Math.random()*100<clamp(p.chance,0,100))ctx.secondaryProcs.push({key:'auto_spell',skillId:p.skillId,level:p.level||1});}}})
.register({key:'weapon_proc',condition:ctx=>ctx.kind==='normal'&&Array.isArray(ctx.weapon?.procs),apply(ctx){ctx.secondaryProcs=ctx.secondaryProcs||[];for(const p of ctx.weapon.procs){if(Math.random()*100<clamp(p.chance,0,100))ctx.secondaryProcs.push({key:'weapon_proc',...p});}}})
.register({key:'card_proc',condition:ctx=>ctx.kind==='normal'&&Array.isArray(ctx.source?.cardProcs),apply(ctx){ctx.secondaryProcs=ctx.secondaryProcs||[];for(const p of ctx.source.cardProcs){if(Math.random()*100<clamp(p.chance,0,100))ctx.secondaryProcs.push({key:'card_proc',...p});}}});

ElementModifierRegistry.register({key:'resolve_attack_element',apply(ctx){ctx.element=window.RARenewalDamagePipeline?.resolveAttackElement(ctx.profile||{})||ctx.element||'Neutral';}});
RaceModifierRegistry.register({key:'race_metadata',apply(ctx){ctx.targetRace=ctx.target?.race||ctx.target?.Race||'Formless';}});
SizeModifierRegistry.register({key:'size_metadata',apply(ctx){ctx.targetSize=ctx.target?.size||ctx.target?.Size||'Medium';}});
DefenseModifierRegistry.register({key:'defense_mode',apply(ctx){const mode=String(ctx.profile?.defenseMode||'normal');ctx.defenseMode=mode;ctx.ignoreDefense=mode==='ignore';ctx.defPiercePercent=mode==='half'?50:num(ctx.profile?.defensePiercePercent);ctx.mdefPiercePercent=mode==='half'?50:num(ctx.profile?.mdefPiercePercent);}});
StatusModifierRegistry.register({key:'collect_status',condition:ctx=>!!ctx.profile?.status||Array.isArray(ctx.profile?.statuses),apply(ctx){ctx.pendingStatuses=Array.isArray(ctx.profile.statuses)?ctx.profile.statuses:(ctx.profile.status?[ctx.profile.status]:[]);}});

function buildContext(kind,profile,level,target,options={}){
 return {kind,profile:profile||{},level:num(level,1),target,source:options.source||window.player,weapon:null,ratio:num(options.ratio,profile?.ratio??100),flatAddition:num(options.flatAddition,profile?.flatAddition??0),visualHits:num(options.visualHits,1),allowNormalProc:options.allowNormalProc!==false,skipHitCheck:!!options.skipHitCheck,criticalResult:options.criticalResult||null,options};
}
function resolveHit(ctx){
 if(ctx.skipHitCheck||ctx.kind==='magic') {ctx.hit=true;return ctx;}
 const hitMode=ctx.profile.hitMode||(ctx.profile.alwaysHit?'always_hit':'normal');
 const r=window.HitResolver?.resolve(ctx.source,ctx.target,{hitMode,alwaysHit:ctx.profile.alwaysHit,perfectHit:ctx.profile.perfectHit,ignoreFlee:ctx.profile.ignoreFlee});
 ctx.hit=r?r.hit:true;ctx.hitRate=r?.rate;return ctx;
}
function resolveCritical(ctx){
 if(ctx.kind==='magic'){ctx.critical={critical:false,multiplier:1};return ctx;}
 const mode=ctx.kind==='normal'?'normal':(ctx.profile.criticalMode||'never');
 ctx.critical=ctx.criticalResult||window.CriticalResolver?.resolve(ctx.source,ctx.target,{criticalMode:mode,criticalRateBonus:ctx.profile.criticalRateBonus,criticalRateMultiplier:ctx.profile.criticalRateMultiplier,criticalMultiplier:ctx.profile.criticalMultiplier})||{critical:false,multiplier:1};return ctx;
}
function resolvePerfectDodge(ctx){
 if(ctx.skipHitCheck||ctx.kind==='magic'||ctx.profile.canPerfectDodge!==true&&ctx.kind!=='normal')return ctx;
 if(window.PerfectDodgeResolver?.resolve(ctx.target).dodged){ctx.hit=false;ctx.perfectDodged=true;}return ctx;
}
function calculate(ctx){
 if(!window.RARenewalDamagePipeline) throw new Error('RARenewalDamagePipeline missing');
 if(ctx.kind==='normal') return window.RARenewalDamagePipeline.resolveNormalAttack(ctx.target,{criticalResult:ctx.critical,allowNormalProc:false,ratioOverride:ctx.ratio,procOverride:ctx.proc,atkRate:ctx.options.atkRate,masteryAtk:ctx.options.masteryAtk});
 if(ctx.kind==='magic') return window.RARenewalDamagePipeline.resolveMagicSkill(ctx.profile,ctx.level,ctx.target,{ratio:ctx.ratio,hits:num(ctx.options.hits,1),flatAddition:ctx.flatAddition});
 return window.RARenewalDamagePipeline.resolvePhysicalSkill(ctx.profile,ctx.level,ctx.target,{ratio:ctx.ratio,flatAddition:ctx.flatAddition,criticalResult:ctx.critical});
}
function resolve(kind,profile,level,target,options={}){
 const ctx=buildContext(kind,profile,level,target,options);
 ctx.weapon=(window.player?.equipment?.weapon&&typeof window.getItemData==='function')?window.getItemData(window.player.equipment.weapon):null;
 resolveHit(ctx); if(!ctx.hit)return {...ctx,damage:0,miss:true};
 resolvePerfectDodge(ctx); if(!ctx.hit)return {...ctx,damage:0,miss:true};
 resolveCritical(ctx);
 if(kind==='normal') PassiveProcRegistry.run(ctx);
 ElementModifierRegistry.run(ctx);RaceModifierRegistry.run(ctx);SizeModifierRegistry.run(ctx);DefenseModifierRegistry.run(ctx);StatusModifierRegistry.run(ctx);
 const result=calculate(ctx);
 return {...ctx,...result,miss:false,secondaryProcs:ctx.secondaryProcs||[]};
}
const API={
 resolveNormalAttack:(target,options={})=>resolve('normal',{elementSource:'weapon'},1,target,options),
 resolvePhysicalSkill:(profile,level,target,options={})=>resolve('physical',profile,level,target,options),
 resolveMagicSkill:(profile,level,target,options={})=>resolve('magic',profile,level,target,options),
 resolve,
 registries:{PassiveProcRegistry,ElementModifierRegistry,RaceModifierRegistry,SizeModifierRegistry,DefenseModifierRegistry,StatusModifierRegistry},
 buildAttackContext:buildContext
};
window.CombatDamagePipeline=API;
window.AttackPipeline=API;
})();
