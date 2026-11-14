// Dairesel sınırlama hem çapraz harekette hızı korur hem de merkezde titremeyi önler.
export function joystickVector(dx, dy, radius, deadZone = 0.16) {
  if (!Number.isFinite(radius) || radius <= 0) return { x: 0, y: 0 };
  const distance = Math.hypot(dx, dy);
  if (distance <= radius * deadZone) return { x: 0, y: 0 };
  const magnitude = Math.min(1, (distance / radius - deadZone) / (1 - deadZone));
  return { x: dx / distance * magnitude, y: dy / distance * magnitude };
}
export function keyboardVector(keys) {
  const x = Number(keys.has('right')) - Number(keys.has('left'));
  const y = Number(keys.has('down')) - Number(keys.has('up'));
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}
