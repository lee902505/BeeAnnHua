// RO_WEB 0.9.82 - RA Renewal damage calculation core
(function(){
"use strict";
const floor=n=>Math.floor(Number(n)||0), clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
function derived(u){return u===window.player&&typeof window.calculateDerivedPlayerStats==='function'?(window.calculateDerivedPlayerStats()||{}):(u||{});}
function weapon(){const id=window.player?.equipment?.weapon;return id&&typeof window.getItemData==='function'?window.getItemData(id):null;}
function stats(){const d=derived(window.player),s=d.stats||window.player?.stats||{};return {d,s,baseLevel:Number(window.player?.baseLevel||1)};}
function isRangedWeapon(w){const t=String(w?.weaponType||w?.subCategory||w?.SubType||'').toLowerCase();return /bow|instrument|whip|gun|rifle|shotgun|gatling|grenade/.test(t);}
function attackElement(profile={}){
 const mode=String(profile.elementSource||'').toLowerCase();
 if(mode==='forced'||mode==='skill') return profile.element||'Neutral';
 if(profile.element && mode!=='weapon') return profile.element;
 if(window.player?.attackElement) return window.player.attackElement;
 const w=weapon(); return w?.element||w?.attackElement||'Neutral';
}
function buildPhysicalParts(opt={}){
 const {d,s,baseLevel}=stats(),w=weapon();
 const ranged=isRangedWeapon(w), primary=ranged?Number(s.dex||1):Number(s.str||1);
 const statusAtk=floor(baseLevel/4)+Number(s.str||0)+floor(Number(s.dex||0)/5)+floor(Number(s.luk||0)/3);
 const watk=Math.max(0,Number(w?.atk||w?.Attack||0));
 const wlv=Math.max(0,Number(w?.weaponLevel||w?.WeaponLevel||0));
 const variance=Math.max(0,floor(watk*0.05*wlv));
 const statBonus=floor(watk*primary/200);
 const critical=!!opt.critical;
 const weaponAtk=critical?watk+variance+statBonus:Math.max(0,watk+statBonus+(variance?floor(Math.random()*(variance*2+1))-variance:0));
 const equipTotal=Math.max(0,Number(d.atk||1)-statusAtk-watk);
 const masteryAtk=Number(opt.masteryAtk||0);
 const atkRate=Number(opt.atkRate||0);
 const percentAtk=floor((weaponAtk+Math.max(0,equipTotal))*atkRate/100);
 return {statusAtk,weaponAtk,equipmentAtk:Math.max(0,equipTotal),masteryAtk,percentAtk,weapon:w};
}
function sumParts(p){return p.statusAtk+p.weaponAtk+p.equipmentAtk+p.masteryAtk+p.percentAtk;}
function finalModifiers(raw,target,opt={}){
 if(typeof window.applyROCombatDamageModifiers!=='function') return Math.max(1,floor(raw));
 return Math.max(1,window.applyROCombatDamageModifiers(raw,{damageType:opt.damageType||'physical',target,source:window.player,attackElement:opt.element,weaponType:opt.weaponType,applyWeaponSize:opt.applyWeaponSize!==false,applyDefense:opt.applyDefense!==false,ignoreDefense:opt.ignoreDefense,ignoreMagicDefense:opt.ignoreMagicDefense,defPiercePercent:opt.defPiercePercent,mdefPiercePercent:opt.mdefPiercePercent,hardDef:opt.hardDef,hardMdef:opt.hardMdef,flatReduction:opt.flatReduction}));
}
function passiveProc(profile={}){
 const p=typeof window.getPassiveSkillBonusTotals==='function'?window.getPassiveSkillBonusTotals():{};
 const tripleChance=clamp(p.tripleAttackChance||0,0,100);
 if(profile.allowNormalProc!==false&&tripleChance>0&&Math.random()*100<tripleChance)return {key:'triple',ratio:Number(p.tripleAttackRatio||100),hits:Number(p.tripleAttackHits||3)};
 const doubleChance=clamp(p.doubleAttackChance||0,0,100),doubleHits=Math.max(1,Number(p.doubleAttackHits||1));
 if(profile.allowNormalProc!==false&&doubleHits>1&&Math.random()*100<doubleChance)return {key:'double',ratio:doubleHits*100,hits:doubleHits};
 return null;
}
function resolveNormalAttack(target,opt={}){
 const crit=opt.criticalResult||window.CriticalResolver?.resolve(window.player,target,{criticalMode:'normal'})||{critical:false,multiplier:1.4};
 const parts=buildPhysicalParts({critical:crit.critical,atkRate:Number(opt.atkRate||0),masteryAtk:Number(opt.masteryAtk||0)});
 let proc=opt.procOverride||null; if(!proc&&opt.allowNormalProc!==false)proc=passiveProc(opt); let ratio=Number(opt.ratioOverride||100); if(proc)ratio=proc.ratio;
 let raw=floor(sumParts(parts)*ratio/100);
 const globalRate=(typeof window.getTrainingBonusTotals==='function'?Number(window.getTrainingBonusTotals().damageRate||0):0)+(typeof window.getPassiveSkillBonusTotals==='function'?Number(window.getPassiveSkillBonusTotals().damageRate||0):0)+(typeof window.getActiveBuffBonusTotals==='function'?Number(window.getActiveBuffBonusTotals().damageRate||0):0);
 raw=floor(raw*(100+globalRate)/100);
 raw+=typeof window.getPassiveTargetDamageBonus==='function'?Number(window.getPassiveTargetDamageBonus(target)||0):0;
 if(crit.critical)raw=floor(raw*Number(crit.multiplier||1.4));
 const element=attackElement({elementSource:'weapon'}),damage=finalModifiers(raw,target,{damageType:'physical',element});
 const result={damage,raw,parts,critical:!!crit.critical,proc,visualHits:proc?.hits||1,element}; window.lastRADamageTrace={type:'normal',...result}; return result;
}
function resolvePhysicalSkill(profile,level,target,opt={}){
 const crit=opt.criticalResult||{critical:false,multiplier:1};
 const parts=buildPhysicalParts({critical:crit.critical,atkRate:Number(profile.atkRate||0),masteryAtk:Number(profile.masteryAtk||0)});
 let ratio=Number(opt.ratio??profile.ratio??100),flat=Number(opt.flatAddition??profile.flatAddition??0);
 let raw=floor(sumParts(parts)*ratio/100)+flat;
 raw+=typeof window.getPassiveTargetDamageBonus==='function'?Number(window.getPassiveTargetDamageBonus(target)||0):0;
 if(crit.critical)raw=floor(raw*Number(crit.multiplier||1.4));
 const element=attackElement(profile);
 const defenseMode=String(profile.defenseMode||'normal');
 const mod={damageType:'physical',element,ignoreDefense:defenseMode==='ignore',defPiercePercent:defenseMode==='half'?50:Number(profile.defensePiercePercent||0),applyWeaponSize:profile.applyWeaponSize!==false};
 const damage=finalModifiers(raw,target,mod),result={damage,raw,parts,ratio,flat,critical:!!crit.critical,element,defenseMode}; window.lastRADamageTrace={type:'physical_skill',...result}; return result;
}
function resolveMagicSkill(profile,level,target,opt={}){
 const {d}=stats(); const min=Math.max(1,Number(d.matkMin??d.matk??window.player?.matk??1)),max=Math.max(min,Number(d.matkMax??d.matk??window.player?.matk??min));
 const matk=min+floor(Math.random()*(max-min+1)); const smatk=Number(d.smatkRate||d.sMatk||0);
 const ratio=Number(opt.ratio??profile.matkRatioPerHit??profile.ratio??100),hits=Math.max(1,Number(opt.hits||1)),flat=Number(opt.flatAddition??profile.flatAddition??0);
 let raw=floor(matk*(100+smatk)/100*ratio/100*hits)+flat;
 const element=attackElement({...profile,elementSource:profile.elementSource||'skill'}),defenseMode=String(profile.defenseMode||'normal');
 const damage=finalModifiers(raw,target,{damageType:'magic',element,ignoreMagicDefense:defenseMode==='ignore',mdefPiercePercent:defenseMode==='half'?50:Number(profile.mdefPiercePercent||0),applyWeaponSize:false});
 const result={damage,raw,matk,matkMin:min,matkMax:max,smatk,ratio,hits,element,defenseMode}; window.lastRADamageTrace={type:'magic_skill',...result}; return result;
}
window.RARenewalDamagePipeline={buildPhysicalParts,resolveNormalAttack,resolvePhysicalSkill,resolveMagicSkill,resolveAttackElement:attackElement,finalModifiers};
})();
