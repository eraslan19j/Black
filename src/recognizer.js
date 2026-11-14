// Yönü ve en-boy oranını koruyan, örneklenmiş tek vuruşlu rün tanıyıcı.
const SAMPLES = 48;
function normalize(points) {
  if (points.length < 2) return null;
  const distances = [0];
  for (let i = 1; i < points.length; i++) distances.push(distances[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  const length = distances.at(-1);
  if (length < 20) return null;
  const sampled = [];
  for (let i = 0, segment = 1; i < SAMPLES; i++) {
    const target = length * i / (SAMPLES - 1);
    while (segment < distances.length - 1 && distances[segment] < target) segment++;
    const span = distances[segment] - distances[segment - 1];
    const t = span ? (target - distances[segment - 1]) / span : 0;
    sampled.push({ x: points[segment - 1].x + (points[segment].x - points[segment - 1].x) * t, y: points[segment - 1].y + (points[segment].y - points[segment - 1].y) * t });
  }
  const xs = sampled.map(p => p.x), ys = sampled.map(p => p.y);
  const scale = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  if (!scale) return null;
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  return sampled.map(p => ({ x: (p.x - cx) / scale, y: (p.y - cy) / scale }));
}
const shapes = {
  kor: Array.from({ length: 65 }, (_, i) => ({ x: 50 + 45 * Math.sin(i * Math.PI * 2 / 64), y: 50 - 45 * Math.cos(i * Math.PI * 2 / 64) })),
  su: [{ x: 0, y: 0 }, { x: 50, y: 90 }, { x: 100, y: 0 }],
  siper: [{ x: 0, y: 90 }, { x: 50, y: 0 }, { x: 100, y: 90 }],
};
const templates = Object.fromEntries(Object.entries(shapes).map(([name, points]) => [name, name === 'kor' ? Array.from({ length: 8 }, (_, offset) => normalize(Array.from({ length: 65 }, (_, i) => ({ x: 50 + 45 * Math.sin((i / 64 + offset / 8) * Math.PI * 2), y: 50 - 45 * Math.cos((i / 64 + offset / 8) * Math.PI * 2) })))) : [normalize(points)]]));
export function recognize(points) {
  const candidate = normalize(points);
  if (!candidate) return null;
  let best = { name: null, distance: Infinity };
  for (const [name, variants] of Object.entries(templates)) {
    for (const template of variants) for (const ordered of [template, [...template].reverse()]) {
      const distance = candidate.reduce((sum, p, i) => sum + Math.hypot(p.x - ordered[i].x, p.y - ordered[i].y), 0) / SAMPLES;
      if (distance < best.distance) best = { name, distance };
    }
  }
  return best.distance < 0.19 ? { name: best.name, confidence: Math.max(0, 1 - best.distance / 0.19) } : null;
}
