window.XingchenNatalSynthesis = (() => {
  const PLANET_ORDER = [
    'sun','moon','mercury','venus','mars',
    'jupiter','saturn','uranus','neptune','pluto'
  ];
  const ORDER = Object.fromEntries(PLANET_ORDER.map((key,index)=>[key,index]));

  function pairKey(a,b) {
    return ORDER[a] <= ORDER[b] ? `${a}|${b}` : `${b}|${a}`;
  }

  function aspectKey(a,b) {
    return pairKey(a,b);
  }

  function aspectMap(aspects=[]) {
    const map = new Map();
    aspects.forEach(aspect => map.set(aspectKey(aspect.body1,aspect.body2),aspect));
    return map;
  }

  function combinations(items,count) {
    const out = [];
    function walk(start,chosen) {
      if (chosen.length === count) {
        out.push([...chosen]);
        return;
      }
      for (let i=start;i<items.length;i++) {
        chosen.push(items[i]);
        walk(i+1,chosen);
        chosen.pop();
      }
    }
    walk(0,[]);
    return out;
  }

  function edge(map,a,b,key=null) {
    const aspect = map.get(aspectKey(a,b));
    if (!aspect) return null;
    return key && aspect.key !== key ? null : aspect;
  }

  function allEdges(map,bodies,key) {
    return combinations(bodies,2).every(([a,b]) => edge(map,a,b,key));
  }

  function uniquePush(list,item) {
    const bodyKey = [...item.bodies].sort((a,b)=>ORDER[a]-ORDER[b]).join('|');
    const key = `${item.type}:${bodyKey}:${item.apex || item.focus || ''}:${item.signIndex ?? ''}:${item.house ?? ''}`;
    if (!list.some(existing => existing._key === key)) {
      list.push({...item,_key:key});
    }
  }

  function detectGrandTrines(map) {
    const out=[];
    combinations(PLANET_ORDER,3).forEach(bodies => {
      if (allEdges(map,bodies,'trine')) uniquePush(out,{type:'grand-trine',bodies});
    });
    return out;
  }

  function detectTSquares(map) {
    const out=[];
    combinations(PLANET_ORDER,3).forEach(bodies => {
      for (const [a,b] of combinations(bodies,2)) {
        if (!edge(map,a,b,'opposition')) continue;
        const apex = bodies.find(x => x !== a && x !== b);
        if (edge(map,apex,a,'square') && edge(map,apex,b,'square')) {
          uniquePush(out,{type:'t-square',bodies,apex,opposition:[a,b]});
        }
      }
    });
    return out;
  }

  function edgeCounts(map,bodies) {
    const counts = {};
    combinations(bodies,2).forEach(([a,b]) => {
      const aspect = edge(map,a,b);
      if (!aspect) return;
      counts[aspect.key] = (counts[aspect.key] || 0) + 1;
    });
    return counts;
  }

  function detectGrandCrosses(map) {
    const out=[];
    combinations(PLANET_ORDER,4).forEach(bodies => {
      const counts=edgeCounts(map,bodies);
      const complete = combinations(bodies,2).every(([a,b]) => Boolean(edge(map,a,b)));
      if (complete && counts.opposition === 2 && counts.square === 4) {
        uniquePush(out,{type:'grand-cross',bodies});
      }
    });
    return out;
  }

  function detectMysticRectangles(map) {
    const out=[];
    combinations(PLANET_ORDER,4).forEach(bodies => {
      const counts=edgeCounts(map,bodies);
      const complete = combinations(bodies,2).every(([a,b]) => Boolean(edge(map,a,b)));
      if (complete && counts.opposition === 2 && counts.trine === 2 && counts.sextile === 2) {
        uniquePush(out,{type:'mystic-rectangle',bodies});
      }
    });
    return out;
  }

  function detectKites(map,grandTrines) {
    const out=[];
    grandTrines.forEach(triangle => {
      const tri=triangle.bodies;
      PLANET_ORDER.filter(p => !tri.includes(p)).forEach(focus => {
        tri.forEach(opposed => {
          const others=tri.filter(p => p !== opposed);
          if (
            edge(map,focus,opposed,'opposition') &&
            edge(map,focus,others[0],'sextile') &&
            edge(map,focus,others[1],'sextile')
          ) {
            uniquePush(out,{
              type:'kite',
              bodies:[...tri,focus],
              grandTrine:[...tri],
              focus,
              opposed
            });
          }
        });
      });
    });
    return out;
  }

  function detectStelliums(result) {
    const out=[];
    const bySign = new Map();
    const byHouse = new Map();

    PLANET_ORDER.forEach(key => {
      const p=result.planets?.[key];
      if (!p) return;
      if (!bySign.has(p.index)) bySign.set(p.index,[]);
      bySign.get(p.index).push(key);

      if (p.house) {
        if (!byHouse.has(p.house)) byHouse.set(p.house,[]);
        byHouse.get(p.house).push(key);
      }
    });

    bySign.forEach((bodies,signIndex) => {
      if (bodies.length >= 3) uniquePush(out,{type:'stellium-sign',bodies,signIndex});
    });

    byHouse.forEach((bodies,house) => {
      if (bodies.length >= 3) uniquePush(out,{type:'stellium-house',bodies,house});
    });

    return out;
  }

  function isSubset(a,b) {
    return a.every(x => b.includes(x));
  }

  function detectPatterns(result) {
    const map=aspectMap(result.aspects || []);
    const grandCrosses=detectGrandCrosses(map);
    const mysticRectangles=detectMysticRectangles(map);
    const rawGrandTrines=detectGrandTrines(map);
    const kites=detectKites(map,rawGrandTrines);
    const rawTSquares=detectTSquares(map);

    // A Grand Cross contains four overlapping T-squares. Suppress those duplicates.
    const tSquares=rawTSquares.filter(ts =>
      !grandCrosses.some(gc => isSubset(ts.bodies,gc.bodies))
    );

    // A Kite already names and interprets its embedded Grand Trine.
    const grandTrines=rawGrandTrines.filter(gt =>
      !kites.some(kite => isSubset(gt.bodies,kite.bodies))
    );

    const stelliums=detectStelliums(result);

    return [
      ...kites,
      ...grandCrosses,
      ...mysticRectangles,
      ...tSquares,
      ...grandTrines,
      ...stelliums
    ].map(({_key,...item})=>item);
  }

  function chartRulers(result, signs, deepSigns) {
    if (!result.ascendant || !Array.isArray(signs)) return null;
    const sign=signs[result.ascendant.index];
    const key=sign?.key;
    const rule=key ? deepSigns?.[key] : null;
    if (!rule?.ruler) return null;

    const modernKey=rule.ruler;
    const traditionalKey=rule.traditional || modernKey;

    return {
      ascSignIndex:result.ascendant.index,
      ascSignKey:key,
      modern:{
        key:modernKey,
        position:result.planets?.[modernKey] || null
      },
      traditional:traditionalKey !== modernKey ? {
        key:traditionalKey,
        position:result.planets?.[traditionalKey] || null
      } : null
    };
  }

  function analyze(result, signs, deepSigns) {
    return {
      patterns:detectPatterns(result),
      chartRulers:chartRulers(result,signs,deepSigns)
    };
  }

  return {
    PLANET_ORDER,
    pairKey,
    aspectMap,
    detectPatterns,
    chartRulers,
    analyze
  };
})();