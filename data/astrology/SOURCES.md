# Astrology V0.8 — Calculation & Interpretation Sources

## Calculation layer
- Astronomy Engine (Don Cross): https://github.com/cosinekitty/astronomy
  - Browser JavaScript package used at pinned version 2.1.19.
  - Used for apparent tropical Sun longitude, geocentric tropical Moon longitude, and Greenwich apparent sidereal time.
  - MIT License.
- Ascendant: standard spherical-astronomy formula using local sidereal time, geographic latitude and obliquity of the ecliptic (Meeus-style formula).
- Zodiac: tropical zodiac, 0° Aries = 0° ecliptic longitude.

## Interpretation layer
The site does not copy any one publisher's text. The V0.8 descriptions are original summaries cross-checked against conventional Western natal astrology references:
- Astrodienst / Astro.com (Sun and general natal chart definitions)
  - https://www.astro.com/astrowiki/en/Sun
  - https://www.astro.com/faq/fq_fh_natal_e.htm
- Cafe Astrology (sign, Sun/Moon/Ascendant reference material)
  - https://cafeastrology.com/articles/signsofthezodiac.html
  - https://cafeastrology.com/risingsignsascendant.html
  - https://cafeastrology.com/natal-chart-interpretations.html
- Astrology.com (Sun / Moon / Rising combination reference)
  - https://www.astrology.com/us/sun-moon-rising/index.aspx

## Important note
Astronomical positions are numerical calculations. Astrological interpretations are traditional/symbolic interpretations and are not established as scientific personality diagnosis or prediction.


## V0.9 full natal chart additions

### Planets
- Astronomy Engine `GeoVector(body, date, true)` + `Ecliptic(vector)` are used to obtain apparent geocentric true-ecliptic-of-date longitude for Mercury through Pluto.
- Sun and Moon continue to use Astronomy Engine's dedicated solar/lunar ecliptic functions.
- Retrograde state is determined from the sign of apparent geocentric longitude motion around the birth instant.

Reference:
- https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md

### Houses
- Default house system: Placidus.
- Intermediate cusps use the classic iterative semi-arc equations with ascensional difference.
- At |latitude| >= 66°, or when Placidus becomes mathematically undefined, the page falls back to Whole Sign instead of inventing invalid cusps.
- The implementation was regression-checked against Swiss Ephemeris 2.10.03 on representative charts at northern and southern mid-latitudes.

House-system references:
- https://www.ephemengine.com/docs/api/Function.housesPlacidus
- https://github.com/swisseph-js/swisseph/blob/main/docs/guides/house-systems.md

### Aspects
V0.9 includes the five major Ptolemaic aspects:
- Conjunction 0°
- Sextile 60°
- Square 90°
- Trine 120°
- Opposition 180°

Aspect text is original project copy, built compositionally from planet themes and aspect dynamics.


## V0.10 Synastry
- Synastry compares angular relationships between one natal chart and another.
- V0.10 uses the same tropical longitudes already calculated for each natal chart, then computes the five major cross-chart aspects by angular separation and orb.
- Interpretations are original compositional project text built from planet functions, aspect dynamics and relationship context.
- No single compatibility score is used.


## V0.10.1 Compatibility Index methodology

The compatibility index is an original Stellar Diary scoring layer built on the already-computed synastry aspects.

Design principles:
- Tight aspects contribute more strongly than wide aspects.
- Sun/Moon, Moon/Moon, Venus/Mars, Mercury/Mercury and other commonly emphasized synastry pairs receive higher relative importance than generic outer-planet contacts.
- Trines and sextiles contribute toward ease; squares and oppositions contribute toward adjustment pressure.
- Conjunctions are evaluated contextually rather than automatically treated as positive.
- Different relationship types change the final weights of emotional fit, communication, attraction, stability and growth.
- The score is explicitly not a probability of relationship success.

Reference framework consulted during product design:
- Cafe Astrology synastry compatibility scoring / weighting concepts.
- Conventional Western synastry emphasis on exactness (orb), luminaries, personal planets, Saturn and cross-chart aspects.

All numeric calibration, normalization, weighting and text in the implementation are original to this project.


## V0.10.3 Deep natal interpretation layer

The long-form interpretation layer follows the conventional synthesis model:
- Planets describe psychological / behavioral functions.
- Signs describe how those functions are expressed.
- Houses describe the life fields where they are expressed.
- A house cusp sign describes the style used in that life area.
- The ruler of the cusp sign links that house to the house occupied by the ruler.
- An empty house is still interpreted through its cusp sign and ruler.

Reference framework cross-checked:
- Astrodienst Astrowiki — House:
  https://www.astro.com/astrowiki/en/House
- Astrology.com — Houses in Birth Chart:
  https://www.astrology.com/article/houses-in-birth-chart/
- Cafe Astrology — Planets in the Houses:
  https://cafeastrology.com/natal/planetsinhouses.html
- Cafe Astrology — Houses:
  https://cafeastrology.com/houses.html
- Cafe Astrology — House Rulers in Houses:
  https://cafeastrology.com/natal/rulersofhousesinhouses.html

All V0.10.3 prose is original Stellar Diary text. Astrological interpretations are traditional / symbolic frameworks, not scientific personality diagnosis or prediction.


## V0.10.3.4 Birth-data expansion

China birthplace coordinate search:
- public-wheels/china-cities, `china_cities.txt`
  https://github.com/public-wheels/china-cities
  Runtime CDN:
  https://cdn.jsdelivr.net/gh/public-wheels/china-cities@master/china_cities.txt

The file provides Chinese place names, province / parent-city fields, latitude and longitude.
Mainland China entries use the civil timezone `Asia/Shanghai`.

Solar / Lunar conversion:
- solarlunar 3.1.0
  https://www.npmjs.com/package/solarlunar
  Supports Gregorian / Chinese lunar conversion for 1900–2100 and leap-month input.

The converted Gregorian date is what is passed to the existing astronomical calculation engine.


## V0.10.3.6 Lunar calendar local engine

The lunar month / leap-month table follows the widely used 1900–2100 Chinese calendar data structure originating from JJonline's public JavaScript calendar implementation.

Reference:
https://gist.github.com/pingdongyi/bf75e285bff445e4fb2820729ba913c4

V0.10.3.6 does not load a lunar-calendar library from a CDN at runtime.
The conversion logic is bundled locally so lunar birth-date input remains stable on Safari / GitHub Pages.
