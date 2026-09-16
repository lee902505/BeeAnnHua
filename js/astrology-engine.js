window.XingchenAstrologyEngine = (() => {
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;

  const PLANET_ORDER = [
    'sun','moon','mercury','venus','mars',
    'jupiter','saturn','uranus','neptune','pluto'
  ];

  const BODY_NAMES = {
    mercury:'Mercury',
    venus:'Venus',
    mars:'Mars',
    jupiter:'Jupiter',
    saturn:'Saturn',
    uranus:'Uranus',
    neptune:'Neptune',
    pluto:'Pluto'
  };

  const ASPECTS = [
    {key:'conjunction', angle:0, luminaryOrb:8, normalOrb:6},
    {key:'sextile', angle:60, luminaryOrb:6, normalOrb:5},
    {key:'square', angle:90, luminaryOrb:7, normalOrb:6},
    {key:'trine', angle:120, luminaryOrb:7, normalOrb:6},
    {key:'opposition', angle:180, luminaryOrb:8, normalOrb:6}
  ];

  function norm360(x) {
    return ((x % 360) + 360) % 360;
  }

  function signedAngleDiff(a, b) {
    return ((a - b + 540) % 360) - 180;
  }

  function julianDay(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  function meanObliquityDegrees(date) {
    const T = (julianDay(date) - 2451545.0) / 36525;
    const arcsec = 84381.448 - 46.8150*T - 0.00059*T*T + 0.001813*T*T*T;
    return arcsec / 3600;
  }

  function timeZoneParts(date, timeZone) {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', second:'2-digit',
      hourCycle:'h23'
    });
    return Object.fromEntries(
      dtf.formatToParts(date)
        .filter(p => p.type !== 'literal')
        .map(p => [p.type, Number(p.value)])
    );
  }

  function getTimeZoneOffsetMillis(date, timeZone) {
    const p = timeZoneParts(date, timeZone);
    const representedAsUtc = Date.UTC(p.year, p.month-1, p.day, p.hour, p.minute, p.second);
    return representedAsUtc - date.getTime();
  }

  function localWallTimeToUtc(dateString, timeString, timeZone) {
    const [year,month,day] = dateString.split('-').map(Number);
    const [hour,minute] = timeString.split(':').map(Number);
    const wallAsUtc = Date.UTC(year, month-1, day, hour, minute, 0);

    let utcMillis = wallAsUtc;
    for (let i=0; i<4; i++) {
      const offset = getTimeZoneOffsetMillis(new Date(utcMillis), timeZone);
      const next = wallAsUtc - offset;
      if (Math.abs(next - utcMillis) < 500) {
        utcMillis = next;
        break;
      }
      utcMillis = next;
    }
    return new Date(utcMillis);
  }

  function signFromLongitude(longitude) {
    const lon = norm360(longitude);
    return {
      index: Math.floor(lon / 30),
      degree: lon % 30,
      longitude: lon
    };
  }

  function ascendantLongitude(dateUtc, latitude, longitude) {
    if (!window.Astronomy) throw new Error('Astronomy Engine not loaded.');

    const ramcDeg = norm360(Astronomy.SiderealTime(dateUtc) * 15 + longitude);
    const theta = ramcDeg * DEG;
    const eps = meanObliquityDegrees(dateUtc) * DEG;
    const phi = latitude * DEG;

    const asc = Math.atan2(
      Math.cos(theta),
      -(Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))
    ) * RAD;

    return norm360(asc);
  }

  function eclipticLongitudeFromRA(raDeg, epsDeg) {
    const a = raDeg * DEG;
    const e = epsDeg * DEG;
    return norm360(Math.atan2(Math.sin(a) / Math.cos(e), Math.cos(a)) * RAD);
  }

  function declinationFromEclipticLongitude(lonDeg, epsDeg) {
    return Math.asin(
      Math.sin(epsDeg * DEG) * Math.sin(lonDeg * DEG)
    ) * RAD;
  }

  function placidusIntermediateCusp(armcDeg, latitude, epsDeg, offsetDeg, fraction) {
    let lon = eclipticLongitudeFromRA(armcDeg + offsetDeg, epsDeg);

    for (let i=0; i<80; i++) {
      const decl = declinationFromEclipticLongitude(lon, epsDeg);
      const x = Math.tan(latitude * DEG) * Math.tan(decl * DEG);

      if (!Number.isFinite(x) || Math.abs(x) >= 1) {
        throw new Error('Placidus undefined at this latitude.');
      }

      const ascensionalDifference = Math.asin(x) * RAD;
      const targetRA = armcDeg + offsetDeg + fraction * ascensionalDifference;
      const next = eclipticLongitudeFromRA(targetRA, epsDeg);
      const delta = signedAngleDiff(next, lon);
      lon = norm360(lon + delta);

      if (Math.abs(delta) < 1e-9) break;
    }
    return lon;
  }

  function wholeSignCusps(ascendant) {
    const start = Math.floor(norm360(ascendant) / 30) * 30;
    return Array.from({length:12}, (_,i) => norm360(start + i*30));
  }

  function calculateHouses(dateUtc, latitude, longitude, ascendant) {
    const armc = norm360(Astronomy.SiderealTime(dateUtc) * 15 + longitude);
    const eps = meanObliquityDegrees(dateUtc);
    const mc = eclipticLongitudeFromRA(armc, eps);

    const angles = {
      ascendant: signFromLongitude(ascendant),
      descendant: signFromLongitude(norm360(ascendant + 180)),
      mc: signFromLongitude(mc),
      ic: signFromLongitude(norm360(mc + 180))
    };

    // Classical Placidus becomes undefined around/past the polar circles.
    // At extreme latitudes we use Whole Sign instead of generating false cusps.
    if (Math.abs(latitude) >= 66) {
      return {
        system:'whole-sign',
        fallback:true,
        fallbackReason:'high-latitude',
        cusps:wholeSignCusps(ascendant).map(signFromLongitude),
        angles
      };
    }

    try {
      const c = new Array(12);
      c[0] = ascendant;
      c[6] = norm360(ascendant + 180);
      c[9] = mc;
      c[3] = norm360(mc + 180);

      // Classic iterative semi-arc construction.
      c[10] = placidusIntermediateCusp(armc, latitude, eps, 30, 1/3);  // H11
      c[11] = placidusIntermediateCusp(armc, latitude, eps, 60, 2/3);  // H12
      c[1]  = placidusIntermediateCusp(armc, latitude, eps, 120, 2/3); // H2
      c[2]  = placidusIntermediateCusp(armc, latitude, eps, 150, 1/3); // H3

      c[4] = norm360(c[10] + 180);
      c[5] = norm360(c[11] + 180);
      c[7] = norm360(c[1] + 180);
      c[8] = norm360(c[2] + 180);

      return {
        system:'placidus',
        fallback:false,
        fallbackReason:null,
        cusps:c.map(signFromLongitude),
        angles
      };
    } catch (error) {
      return {
        system:'whole-sign',
        fallback:true,
        fallbackReason:'placidus-undefined',
        cusps:wholeSignCusps(ascendant).map(signFromLongitude),
        angles
      };
    }
  }

  function bodyLongitude(key, dateUtc) {
    if (!window.Astronomy) throw new Error('Astronomy Engine not loaded.');

    if (key === 'sun') {
      return norm360(Astronomy.SunPosition(dateUtc).elon);
    }
    if (key === 'moon') {
      return norm360(Astronomy.EclipticGeoMoon(dateUtc).lon);
    }

    const bodyName = BODY_NAMES[key];
    const body = Astronomy.Body[bodyName];
    const vector = Astronomy.GeoVector(body, dateUtc, true);
    return norm360(Astronomy.Ecliptic(vector).elon);
  }

  function planetPosition(key, dateUtc) {
    const lon = bodyLongitude(key, dateUtc);
    let retrograde = false;
    let speedDegPerDay = 0;

    if (key !== 'sun' && key !== 'moon') {
      const before = new Date(dateUtc.getTime() - 12*3600000);
      const after  = new Date(dateUtc.getTime() + 12*3600000);
      const lonBefore = bodyLongitude(key, before);
      const lonAfter = bodyLongitude(key, after);
      speedDegPerDay = signedAngleDiff(lonAfter, lonBefore);
      retrograde = speedDegPerDay < -0.002;
    }

    return {
      key,
      ...signFromLongitude(lon),
      retrograde,
      speedDegPerDay
    };
  }

  function planetaryPositions(dateUtc) {
    const result = {};
    PLANET_ORDER.forEach(key => {
      result[key] = planetPosition(key, dateUtc);
    });
    return result;
  }

  function forwardDistance(start, end) {
    return norm360(end - start);
  }

  function houseForLongitude(longitude, houseInfo) {
    if (!houseInfo?.cusps?.length) return null;
    const lon = norm360(longitude);

    for (let i=0; i<12; i++) {
      const start = houseInfo.cusps[i].longitude;
      const end = houseInfo.cusps[(i+1)%12].longitude;
      const span = forwardDistance(start, end);
      const pos = forwardDistance(start, lon);
      if (pos < span || Math.abs(pos - span) < 1e-10) {
        return i + 1;
      }
    }
    return null;
  }

  function attachHouses(planets, houseInfo) {
    Object.values(planets).forEach(p => {
      p.house = houseForLongitude(p.longitude, houseInfo);
    });
    return planets;
  }

  function angularSeparation(a, b) {
    const d = Math.abs(signedAngleDiff(a, b));
    return d > 180 ? 360 - d : d;
  }

  function calculateAspects(planets) {
    const result = [];
    for (let i=0; i<PLANET_ORDER.length; i++) {
      for (let j=i+1; j<PLANET_ORDER.length; j++) {
        const aKey = PLANET_ORDER[i];
        const bKey = PLANET_ORDER[j];
        const a = planets[aKey];
        const b = planets[bKey];
        const separation = angularSeparation(a.longitude, b.longitude);
        const luminary = ['sun','moon'].includes(aKey) || ['sun','moon'].includes(bKey);

        let best = null;
        ASPECTS.forEach(def => {
          const orb = Math.abs(separation - def.angle);
          const limit = luminary ? def.luminaryOrb : def.normalOrb;
          if (orb <= limit && (!best || orb < best.orb)) {
            best = {
              key:def.key,
              angle:def.angle,
              separation,
              orb,
              limit,
              body1:aKey,
              body2:bKey
            };
          }
        });

        if (best) result.push(best);
      }
    }

    result.sort((x,y) => x.orb - y.orb);
    return result;
  }

  function positionForInstant(dateUtc, latitude, longitude, includeHouses=true) {
    const planets = planetaryPositions(dateUtc);
    const ascLon = includeHouses ? ascendantLongitude(dateUtc, latitude, longitude) : null;
    const houses = includeHouses ? calculateHouses(dateUtc, latitude, longitude, ascLon) : null;

    if (houses) attachHouses(planets, houses);

    return {
      utc:dateUtc,
      planets,
      sun:planets.sun,
      moon:planets.moon,
      ascendant:houses?.angles?.ascendant || null,
      angles:houses?.angles || null,
      houses,
      aspects:calculateAspects(planets)
    };
  }

  function calculate(input) {
    const {date, time, city, unknownTime} = input;
    if (!date || !city) throw new Error('Missing birth data.');

    if (!unknownTime) {
      const utc = localWallTimeToUtc(date, time, city.timezone);
      return {
        mode:'exact',
        city,
        ...positionForInstant(utc, city.lat, city.lon, true)
      };
    }

    const noonUtc = localWallTimeToUtc(date, '12:00', city.timezone);
    const startUtc = localWallTimeToUtc(date, '00:00', city.timezone);
    const endUtc = localWallTimeToUtc(date, '23:59', city.timezone);

    const noon = positionForInstant(noonUtc, city.lat, city.lon, false);
    const startPlanets = planetaryPositions(startUtc);
    const endPlanets = planetaryPositions(endUtc);

    const uncertainPlanets = {};
    PLANET_ORDER.forEach(key => {
      const a = startPlanets[key];
      const b = endPlanets[key];
      if (a.index !== b.index) {
        uncertainPlanets[key] = [a.index, b.index];
        noon.planets[key].signUncertain = true;
        noon.planets[key].possibleSignIndexes = [a.index, b.index];
      }
    });

    return {
      mode:'unknown-time',
      city,
      utc:noonUtc,
      planets:noon.planets,
      sun:noon.planets.sun,
      moon:noon.planets.moon,
      moonDayStart:startPlanets.moon,
      moonDayEnd:endPlanets.moon,
      moonSignUncertain:startPlanets.moon.index !== endPlanets.moon.index,
      uncertainPlanets,
      ascendant:null,
      angles:null,
      houses:null,
      aspects:noon.aspects
    };
  }

  return {
    calculate,
    norm360,
    signedAngleDiff,
    signFromLongitude,
    ascendantLongitude,
    calculateHouses,
    calculateAspects,
    houseForLongitude,
    localWallTimeToUtc,
    meanObliquityDegrees,
    PLANET_ORDER
  };
})();