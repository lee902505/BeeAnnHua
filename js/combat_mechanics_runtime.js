// RO_WEB 0.9.81C - RA Renewal combat integration (priority 1-9)
(function(){
"use strict";
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const pct=(v,r)=>Math.max(0,Math.floor((Number(v)||0)*(100+Number(r||0))/100));
function derived(unit){
 if(unit===window.player && typeof window.calculateDerivedPlayerStats==='function') return window.calculateDerivedPlayerStats()||{};
 return unit||{};
}
const HitResolver={
 chance(attacker,defender,opt={}){
  if(opt.alwaysHit||opt.perfectHit||opt.ignoreFlee||['always','always_hit','ignore_flee'].includes(opt.hitMode)) return 100;
  const a=derived(attacker),d=derived(defender);
  const hit=Number(opt.hit??a.hit??attacker?.hit??0), flee=Number(opt.flee??d.flee??defender?.flee??0);
  return clamp(Number(opt.baseRate??80)+hit-flee,Number(opt.minimumRate??5),Number(opt.maximumRate??95));
 },
 resolve(attacker,defender,opt={}){ const chance=this.chance(attacker,defender,opt); return {hit:Math.random()*100<chance,chance}; }
};
const CriticalResolver={
 chance(attacker,defender,opt={}){
  if(opt.neverCrit||['disabled','never'].includes(opt.criticalMode)) return 0;
  if(opt.alwaysCrit||opt.criticalMode==='always') return 100;
  const a=derived(attacker),d=derived(defender);
  const rawCri=Number(opt.cri??a.cri??attacker?.cri??0), luk=Number(d?.stats?.luk??defender?.stats?.luk??defender?.luk??0);
  const scale=Number(opt.scale||1000), cri=(opt.useRaScale===true||rawCri>100)?rawCri/scale*100:rawCri;
  let chance=cri-(luk*Number(opt.targetLukPenaltyPerPoint??2)/scale*100)+Number(opt.criticalRateBonus||0);
  if(opt.criticalMode==='half_rate') chance/=2;
  chance*=Number(opt.criticalRateMultiplier||1);
  return clamp(chance,0,100);
 },
 resolve(attacker,defender,opt={}){ const chance=this.chance(attacker,defender,opt); return {critical:Math.random()*100<chance,chance,multiplier:Number(opt.criticalMultiplier||1.4)}; }
};
const PerfectDodgeResolver={
 chance(defender,opt={}){ const d=derived(defender),hasFlee2=(d.flee2!==undefined||defender?.flee2!==undefined),raw=Number(hasFlee2?(d.flee2??defender?.flee2??0):(d.perfectDodge??defender?.perfectDodge??defender?.perfectFlee??0)); return clamp(hasFlee2?raw/Number(opt.scale||1000)*100:raw,0,100); },
 resolve(defender,opt={}){ const chance=this.chance(defender,opt); return {dodged:Math.random()*100<chance,chance}; }
};
const DefenseResolver={
 physical(raw,target,opt={}){
  if(opt.ignoreDefense===true) return Math.max(1,Math.floor(raw));
  const d=derived(target), hard=Math.max(0,Number(opt.hardDef??d.hardDef??target?.hardDef??d.def??target?.def??0));
  const soft=Math.max(0,Number(opt.softDef??d.softDef??target?.softDef??0));
  const pierce=clamp(Number(opt.defPiercePercent||0),0,100), effective=hard*(100-pierce)/100;
  return Math.max(1,Math.floor((Number(raw)||0)*(4000+effective)/(4000+effective*10)-soft-Number(opt.flatReduction||0)));
 },
 magic(raw,target,opt={}){
  if(opt.ignoreMagicDefense===true||opt.ignoreMdef===true) return Math.max(1,Math.floor(raw));
  const d=derived(target), hard=Math.max(0,Number(opt.hardMdef??d.hardMdef??target?.hardMdef??d.mdef??target?.mdef??0));
  const soft=Math.max(0,Number(opt.softMdef??d.softMdef??target?.softMdef??0));
  const pierce=clamp(Number(opt.mdefPiercePercent||0),0,100), effective=hard*(100-pierce)/100;
  return Math.max(1,Math.floor((Number(raw)||0)*(1000+effective)/(1000+effective*10)-soft-Number(opt.flatReduction||0)));
 }
};
const STATUS_RULES={
 stun:{resistStat:'vit'},poison:{resistStat:'vit'},bleeding:{resistStat:'vit'},silence:{resistStat:'int'},blind:{resistStat:'int'},
 sleep:{resistStat:'int'},freeze:{resistStat:'mdef'},stone:{resistStat:'mdef'},curse:{resistStat:'luk'},confusion:{resistStat:'luk'},fear:{resistStat:'luk'},burning:{resistStat:'mdef'}
};
function stateOf(target){ target.runtimeState=target.runtimeState||{}; target.runtimeState.statuses=target.runtimeState.statuses||{}; return target.runtimeState.statuses; }
const StatusManager={
 normalize(name){return String(name||'').toLowerCase().replace(/[ _-]/g,'');},
 chance(target,status,base,opt={}){
  if(target?.isBoss||target?.isMvp||target?.boss) { if(opt.allowBoss!==true) return 0; }
  const id=this.normalize(status); if((target?.statusImmunities||[]).map(x=>this.normalize(x)).includes(id)) return 0;
  const rule=STATUS_RULES[id]||{}, d=derived(target), stat=Number(d?.stats?.[rule.resistStat]??target?.stats?.[rule.resistStat]??target?.[rule.resistStat]??0);
  let chance=Number(base||0)+Number(opt.bonusChance||0);
  if(opt.chanceFormula==='dex_vs_dex') chance+=Number(opt.attackerDex||0)-Number(d?.stats?.dex??target?.dex??0);
  else if(opt.chanceFormula==='luk_based') chance+=Number(opt.attackerLuk||0)/3-Number(d?.stats?.luk??target?.luk??0)/5;
  else if(opt.chanceFormula==='level_difference') chance+=Number(opt.attackerBaseLevel||1)-Number(target?.level||target?.baseLevel||1);
  chance-=Math.floor(stat/5)+Number(target?.statusResist?.[id]||0);
  return clamp(chance,Number(opt.minimumChance||0),Number(opt.maximumChance||100));
 },
 apply(target,status,opt={}){
  if(!target||!status) return {applied:false,chance:0}; const chance=this.chance(target,status,opt.chancePercent??100,opt);
  if(Math.random()*100>=chance) return {applied:false,chance};
  const id=this.normalize(status), duration=Math.max(0,Number(opt.durationMs||0));
  stateOf(target)[id]={id,name:status,level:Number(opt.level||1),effects:opt.effects||{[id]:1},expiresAt:duration?Date.now()+duration:0};
  return {applied:true,chance,id,duration};
 },
 has(target,status){ const id=this.normalize(status),s=stateOf(target)[id]; if(!s)return false; if(s.expiresAt&&s.expiresAt<=Date.now()){delete stateOf(target)[id];return false;} return true; },
 clearExpired(target){const s=stateOf(target),now=Date.now();Object.keys(s).forEach(k=>{if(s[k]?.expiresAt&&s[k].expiresAt<=now)delete s[k];});}
};
const MovementEffectResolver={
 knockback(target,source,cells=1,opt={}){
  if(!target||!source||target.knockbackImmune||target.isBoss||target.isMvp) return false;
  if(typeof window.knockbackMonsterFromPlayer==='function' && source===window.player) return window.knockbackMonsterFromPlayer(target,cells);
  const dx=Number(target.worldX||0)-Number(source.worldX||0),dy=Number(target.worldY||0)-Number(source.worldY||0),len=Math.hypot(dx,dy)||1,dist=Math.max(0,Number(cells))*Number(window.RO_WEB_CELL_SIZE||32);
  target.worldX=Number(target.worldX||0)+dx/len*dist; target.worldY=Number(target.worldY||0)+dy/len*dist;
  if(typeof window.clampMonsterToWorldBounds==='function') window.clampMonsterToWorldBounds(target); return true;
 },
 pull(target,source,cells=1){return this.knockback(target,{worldX:Number(target.worldX||0)+(Number(target.worldX||0)-Number(source.worldX||0))*2,worldY:Number(target.worldY||0)+(Number(target.worldY||0)-Number(source.worldY||0))*2},cells);},
 moveAdjacent(target){ if(typeof window.movePlayerAdjacentToMonster==='function') return window.movePlayerAdjacentToMonster(target); return false; }
};
const AreaShapeResolver={
 inRange(origin,target,shape='circle',range=1,opt={}){
  const ox=Number((origin?.worldX ?? origin?.x) || 0),oy=Number((origin?.worldY ?? origin?.y) || 0),tx=Number((target?.worldX ?? target?.x) || 0),ty=Number((target?.worldY ?? target?.y) || 0),cell=Number(window.RO_WEB_CELL_SIZE||32),r=Number(range)*cell,dx=tx-ox,dy=ty-oy;
  if(shape==='square') return Math.max(Math.abs(dx),Math.abs(dy))<=r;
  if(shape==='line') return Math.abs(dy)<=Number(opt.widthCells||1)*cell/2 && Math.abs(dx)<=r;
  if(shape==='cone'){const angle=Math.atan2(dy,dx),facing=Number(opt.facingRadians||0),diff=Math.abs(Math.atan2(Math.sin(angle-facing),Math.cos(angle-facing)));return Math.hypot(dx,dy)<=r&&diff<=Number(opt.halfAngleRadians||Math.PI/4);}
  return Math.hypot(dx,dy)<=r;
 }
};
const TargetingResolver={
 collect(origin,candidates,opt={}){return (candidates||[]).filter(t=>t&&t.currentHp!==0&&AreaShapeResolver.inRange(origin,t,opt.shape||'circle',opt.rangeCells||1,opt)).slice(0,Math.max(1,Number(opt.maxTargets||999)));}
};
const MultiHitResolver={
 normalize(profile={},level=1){
  const value=v=>Array.isArray(v)?Number(v[Math.max(0,Math.min(v.length-1,level-1))]||0):Number(v||0);
  return {damageHitCount:Math.max(1,value(profile.damageHitCount??profile.hitCount??1)),visualHitCount:Math.max(1,value(profile.visualHitCount??profile.hitCount??1)),statusProcMode:profile.statusProcMode||'once',hitCheckMode:profile.hitCheckMode||'once',criticalCheckMode:profile.criticalCheckMode||'once'};
 },
 split(total,hits){const n=Math.max(1,Number(hits||1)),base=Math.floor(Number(total||0)/n),out=Array(n).fill(base);out[0]+=Number(total||0)-base*n;return out;}
};
const ResourceFormulaResolver={
 cartAtkRate(skillLevel){return clamp(Number(skillLevel||0),0,10);},
 inputs(source,target){return {hp:Number(source?.hp||0),maxHp:Number(source?.maxHp||0),sp:Number(source?.sp||0),maxSp:Number(source?.maxSp||0),baseLevel:Number(source?.baseLevel||1),jobLevel:Number(source?.jobLevel||1),weaponWeight:Number(source?.weaponWeight||0),shieldWeight:Number(source?.shieldWeight||0),targetHp:Number((target?.currentHp ?? target?.hp) || 0)};}
};
const BossRuleResolver={isBoss:t=>!!(t?.isBoss||t?.isMvp||t?.boss),canKnockback(t){return !this.isBoss(t)&&!t?.knockbackImmune;},canInstantKill(t){return !this.isBoss(t)&&!t?.instantKillImmune;}};
const GroundEffectManager={
 effects:new Map(),seq:1,
 create(opt={}){const id=String(opt.id||`ground_${this.seq++}`),now=Date.now();this.effects.set(id,{id,x:Number(opt.x||0),y:Number(opt.y||0),shape:opt.shape||'circle',rangeCells:Number(opt.rangeCells||1),tickMs:Math.max(100,Number(opt.tickMs||1000)),maxTicks:Math.max(1,Number(opt.maxTicks||1)),ticks:0,nextTick:now,durationMs:Math.max(0,Number(opt.durationMs||0)),expiresAt:Number(opt.durationMs||0)?now+Number(opt.durationMs):0,overlapPolicy:opt.overlapPolicy||'refresh',onTick:opt.onTick});return id;},
 remove(id){this.effects.delete(String(id));},
 update(now=Date.now(),candidates=null){candidates=candidates||(typeof window.getCombatGroundCandidates==='function'?window.getCombatGroundCandidates():[window.currentMonster].filter(Boolean));for(const [id,e] of this.effects){if(e.expiresAt&&now>=e.expiresAt){this.effects.delete(id);continue;}if(now<e.nextTick)continue;e.nextTick=now+e.tickMs;e.ticks++;const targets=TargetingResolver.collect(e,candidates,{shape:e.shape,rangeCells:e.rangeCells});if(typeof e.onTick==='function')e.onTick(targets,e);if(e.ticks>=e.maxTicks)this.effects.delete(id);}}
};
let groundLoopTimer=null;
function startGroundRuntimeLoop(){if(groundLoopTimer)return;groundLoopTimer=setInterval(()=>GroundEffectManager.update(Date.now()),100);}
function stopGroundRuntimeLoop(){if(groundLoopTimer){clearInterval(groundLoopTimer);groundLoopTimer=null;}}
window.startGroundRuntimeLoop=startGroundRuntimeLoop; window.stopGroundRuntimeLoop=stopGroundRuntimeLoop;
if(typeof window.setInterval==='function') startGroundRuntimeLoop();
window.ROCombatMechanics={HitResolver,CriticalResolver,PerfectDodgeResolver,DefenseResolver,StatusManager,MovementEffectResolver,AreaShapeResolver,TargetingResolver,MultiHitResolver,ResourceFormulaResolver,BossRuleResolver,GroundEffectManager};
Object.assign(window,{HitResolver,CriticalResolver,PerfectDodgeResolver,DefenseResolver,StatusManager,MovementEffectResolver,AreaShapeResolver,TargetingResolver,MultiHitResolver,ResourceFormulaResolver,BossRuleResolver,GroundEffectManager});
})();
