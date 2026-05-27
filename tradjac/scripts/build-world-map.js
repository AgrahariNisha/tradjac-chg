const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../assets/worldLow.json');
const outPath = path.join(__dirname, '../assets/world-map-light.svg');

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const W = 1000;
const H = 500;
const proj = ([lon, lat]) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];

function ringPath(ring) {
  return ring
    .map((c, i) => {
      const [x, y] = proj(c);
      return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ') + ' Z';
}

function geomToPaths(geom) {
  const paths = [];
  if (geom.type === 'Polygon') paths.push(ringPath(geom.coordinates[0]));
  else if (geom.type === 'MultiPolygon') {
    geom.coordinates.forEach((p) => paths.push(ringPath(p[0])));
  }
  return paths;
}

const paths = [];
data.features.forEach((f) => {
  geomToPaths(f.geometry).forEach((d) => paths.push(d));
});

const svg =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">` +
  `<rect width="${W}" height="${H}" fill="#F8FAFC"/>` +
  `<g fill="#D1D5DB" stroke="#B8BFC8" stroke-width="0.35">` +
  paths.map((d) => `<path d="${d}"/>`).join('') +
  '</g></svg>';

fs.writeFileSync(outPath, svg);
console.log('Wrote', outPath, 'paths:', paths.length, 'bytes:', svg.length);
