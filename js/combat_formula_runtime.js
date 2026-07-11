// RO_WEB 0.9.81A - RA Renewal shared combat formula runtime
(function () {
  "use strict";
  const FALLBACK = {
    elements:["Neutral","Water","Earth","Fire","Wind","Poison","Holy","Dark","Ghost","Undead"],
    attributeLevels:{"1":{}}, weaponSizeModifiers:{}, weaponTypeToRa:{},
    defaults:{attackElement:"Neutral",defenseElement:"Neutral",defenseElementLevel:1,race:"Formless",size:"Medium"}
  };
  let tables = FALLBACK;

  function cap(n,min,max){ return Math.max(min,Math.min(max,Number(n)||0)); }
  function canon(value, allowed, fallback){
    const raw=String(value??"").trim().toLowerCase().replace(/[ _-]/g,"");
    const found=allowed.find(x=>String(x).toLowerCase().replace(/[ _-]/g,"")===raw);
    return found||fallback;
  }
  function normalizeElement(v){ return canon(v,tables.elements||FALLBACK.elements,"Neutral"); }
  function normalizeSize(v){ return canon(v,["Small","Medium","Large"],"Medium"); }
  function normalizeRace(v){ return canon(v,tables.races||FALLBACK.races,"Formless"); }
  function levelOf(v){ return String(cap(Math.floor(Number(v)||1),1,4)); }
  function percentStage(damage, rate){ return Math.floor(Number(damage||0)*(100+Number(rate||0))/100); }
  function mapRate(source,key,aliases=[]){
    if(!source) return 0;
    const maps=[source,source.combatModifiers,source.runtimeCombatModifiers];
    for(const obj of maps){
      if(!obj) continue;
      for(const name of [key,...aliases]){
        const value=obj[name];
        if(typeof value==='number') return Number(value)||0;
        if(value && typeof value==='object'){
          const direct=value.current ?? value.all ?? value.All ?? value.ALL;
          if(typeof direct==='number') return Number(direct)||0;
        }
      }
    }
    return 0;
  }
  function keyedRate(source, group, key){
    if(!source) return 0;
    let total=0;
    for(const obj of [source,source.combatModifiers,source.runtimeCombatModifiers]){
      const map=obj?.[group]; if(!map||typeof map!=='object') continue;
      total += Number(map[key] ?? map[String(key).toLowerCase()] ?? map.all ?? map.All ?? 0)||0;
    }
    return total;
  }
  function getWeaponItem(){
    const id=window.player?.equipment?.weapon;
    return id && typeof window.getItemData==='function' ? window.getItemData(id) : null;
  }
  function equippedItems(){
    if(!window.player?.equipment||typeof window.getItemData!=='function') return [];
    return Object.values(window.player.equipment).filter(Boolean).map(window.getItemData).filter(Boolean);
  }
  function sumEquipmentKeyed(group,key){ return equippedItems().reduce((n,item)=>n+keyedRate(item,group,key),0); }
  function getAttackElement(override=null){
    if(override) return normalizeElement(override);
    const weapon=getWeaponItem();
    return normalizeElement(weapon?.element || weapon?.attackElement || window.player?.attackElement || "Neutral");
  }
  function getTargetProfile(target){
    return {
      race:normalizeRace(target?.race||target?.Race||"Formless"),
      size:normalizeSize(target?.size||target?.Size||"Medium"),
      element:normalizeElement(target?.element||target?.Element||target?.defElement||"Neutral"),
      elementLevel:cap(Math.floor(Number(target?.elementLevel||target?.ElementLevel||target?.eleLv||1)),1,4)
    };
  }
  function getElementMultiplier(atk,def,lv){
    const row=tables.attributeLevels?.[levelOf(lv)]||{};
    return Number(row?.[normalizeElement(atk)]?.[normalizeElement(def)] ?? 100);
  }
  function getWeaponSizeMultiplier(type,size){
    const web=String(type||"fist").toLowerCase();
    const raKey=String(tables.weaponTypeToRa?.[web]||web).toLowerCase();
    return Number(tables.weaponSizeModifiers?.[raKey]?.[normalizeSize(size).toLowerCase()] ?? 100);
  }
  function collectAttackBonuses(targetProfile, source=window.player){
    const r=targetProfile.race,s=targetProfile.size,e=targetProfile.element;
    return {
      race:keyedRate(source,'raceDamage',r)+(source===window.player?sumEquipmentKeyed('raceDamage',r):0),
      size:keyedRate(source,'sizeDamage',s)+(source===window.player?sumEquipmentKeyed('sizeDamage',s):0),
      element:keyedRate(source,'elementDamage',e)+(source===window.player?sumEquipmentKeyed('elementDamage',e):0),
      all:mapRate(source,'damageRate',['allDamageRate'])
    };
  }
  function collectDefenseBonuses(target, attackerProfile){
    const r=attackerProfile.race,s=attackerProfile.size,e=attackerProfile.element;
    return {
      race:keyedRate(target,'raceResist',r)+(target===window.player?sumEquipmentKeyed('raceResist',r):0),
      size:keyedRate(target,'sizeResist',s)+(target===window.player?sumEquipmentKeyed('sizeResist',s):0),
      element:keyedRate(target,'elementResist',e)+(target===window.player?sumEquipmentKeyed('elementResist',e):0),
      all:mapRate(target,'damageReduction',['allDamageReduction'])
    };
  }
  function applyDamage(raw, context={}){
    let damage=Math.max(0,Math.floor(Number(raw)||0));
    if(!damage) return 0;
    const target=context.target||window.currentMonster||{};
    const targetProfile=getTargetProfile(target);
    const attackElement=getAttackElement(context.attackElement);
    const sourceRace=normalizeRace(context.sourceRace||window.player?.race||"Player");
    const sourceSize=normalizeSize(context.sourceSize||window.player?.size||"Medium");
    const attackProfile={race:sourceRace,size:sourceSize,element:attackElement};
    const type=String(context.damageType||'physical').toLowerCase();
    const trace={raw:damage,type,attackElement,target:targetProfile};
    if(type==='physical' && context.applyWeaponSize!==false){
      const weaponType=context.weaponType || (typeof window.getEquippedWeaponTypeRuntime==='function'?window.getEquippedWeaponTypeRuntime():'fist');
      const rate=getWeaponSizeMultiplier(weaponType,targetProfile.size);
      damage=Math.floor(damage*rate/100); trace.weaponSize=rate;
    }
    const elem=getElementMultiplier(attackElement,targetProfile.element,targetProfile.elementLevel);
    damage=Math.floor(damage*elem/100); trace.element=elem;
    const atk=collectAttackBonuses(targetProfile,context.source||window.player);
    damage=percentStage(damage,atk.race); damage=percentStage(damage,atk.size); damage=percentStage(damage,atk.element); damage=percentStage(damage,atk.all);
    if(window.DefenseResolver && context.applyDefense!==false){
      damage = type==='magic' ? window.DefenseResolver.magic(damage,target,context) : window.DefenseResolver.physical(damage,target,context);
      trace.defenseApplied=true;
    }
    const def=collectDefenseBonuses(target,attackProfile);
    damage=percentStage(damage,-def.race); damage=percentStage(damage,-def.size); damage=percentStage(damage,-def.element); damage=percentStage(damage,-def.all);
    trace.attackBonuses=atk; trace.defenseBonuses=def; trace.final=Math.max(0,damage);
    window.lastCombatFormulaTrace=trace;
    return Math.max(0,damage);
  }
  async function load(){
    try{
      tables=typeof window.loadJson==='function' ? await window.loadJson('./data/combat_runtime/renewal_combat_tables.json',FALLBACK) : FALLBACK;
    }catch(err){ console.warn('[CombatFormulaRuntime] table fallback',err); tables=FALLBACK; }
    window.ROCombatFormulaTables=tables;
    return tables;
  }
  window.CombatFormulaRuntime={load,applyDamage,getElementMultiplier,getWeaponSizeMultiplier,getTargetProfile,normalizeElement,normalizeRace,normalizeSize};
  window.applyROCombatDamageModifiers=applyDamage;
})();
