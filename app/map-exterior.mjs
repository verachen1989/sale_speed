// Cancel shared province edges, then join the remaining national border edges.
export function exteriorPaths(polygons) {
  const edges = new Map();
  const pointKey = (p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`;
  for (const polygon of polygons) {
    const ring = polygon[0] ?? [];
    for (let i = 0; i < ring.length - 1; i++) {
      const a = pointKey(ring[i]), b = pointKey(ring[i + 1]);
      if (a === b) continue;
      const key = [a, b].sort().join('|');
      const edge = edges.get(key);
      if (edge) edge.count++;
      else edges.set(key, { a, b, count: 1 });
    }
  }
  const adjacency = new Map();
  const border = [...edges.values()].filter((e) => e.count === 1);
  border.forEach((edge, i) => {
    for (const key of [edge.a, edge.b]) {
      if (!adjacency.has(key)) adjacency.set(key, []);
      adjacency.get(key).push(i);
    }
  });
  const used = new Set(), paths = [];
  border.forEach((edge, i) => {
    if (used.has(i)) return;
    const path = [edge.a];
    let current = edge.a, nextIndex = i;
    while (nextIndex !== undefined) {
      used.add(nextIndex);
      const next = border[nextIndex];
      current = next.a === current ? next.b : next.a;
      path.push(current);
      nextIndex = adjacency.get(current)?.find((j) => !used.has(j));
    }
    paths.push(path.map((key) => key.split(',').map(Number)));
  });
  return paths;
}
