const TAU = Math.PI * 2;

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function cross(a, b, p) {
  return (b.x - a.x) * (p.y - a.y) - (p.x - a.x) * (b.y - a.y);
}

function distanceToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return distance(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

// Nonzero winding keeps an overlapping or twice-traced loop filled.
// Joining the last point back to the first also forgives an unfinished gap.
export function containsPoint(points, p) {
  let winding = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[j], b = points[i];
    if (distanceToSegment(p, a, b) <= 1.5) return true;
    if (a.y <= p.y && b.y > p.y && cross(a, b, p) > 0) winding++;
    if (a.y > p.y && b.y <= p.y && cross(a, b, p) < 0) winding--;
  }
  return winding !== 0;
}

// Remember a completed turn even if the player draws back the other way,
// adds a tail, or keeps scribbling after enclosing the prisoner.
function completedTurn(points, p) {
  let angle = 0, low = 0, high = 0;
  for (let i = 1; i < points.length; i++) {
    const a = {x: points[i - 1].x - p.x, y: points[i - 1].y - p.y};
    const b = {x: points[i].x - p.x, y: points[i].y - p.y};
    angle += Math.atan2(a.x * b.y - a.y * b.x, a.x * b.x + a.y * b.y);
    low = Math.min(low, angle);
    high = Math.max(high, angle);
    if (high - low >= TAU - 0.25) return true;
  }
  return false;
}

function hasArea(points) {
  if (points.length < 3) return false;
  const a = points[0], b = points.find(p => distance(a, p) > 0.5);
  return !!b && points.some(p => Math.abs(cross(a, b, p)) > 1);
}

export function captures(points, target) {
  // Only a tap or a straight line is excluded; there are no size,
  // circularity, endpoint-distance, or minimum-sample-count requirements.
  if (!hasArea(points)) return false;
  // Check overlap with the whole visible character, including its outline.
  // A small loop around the head or body must not miss a single test point.
  const rx = target.radiusX ?? 0, ry = target.radiusY ?? 0;
  if (rx > 0 && ry > 0) {
    const normalized = points.map(p => ({x: (p.x - target.x) / rx, y: (p.y - target.y) / ry}));
    for (let i = 0, j = normalized.length - 1; i < normalized.length; j = i++) {
      if (distanceToSegment({x: 0, y: 0}, normalized[j], normalized[i]) <= 1) return true;
    }
  }
  return containsPoint(points, target) || completedTurn(points, target);
}
