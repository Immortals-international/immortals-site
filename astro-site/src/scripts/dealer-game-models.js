// Deterministic game mechanics. These scores are not physical measurements.
export const ROUND_SECONDS = 15;
export const GRIP_TARGET = 3;
export const BALANCE_TARGET = 10;
export const GRIP_ZONE = [60, 75];
export const BALANCE_ZONE = 5;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function createGrip() {
  return { level: 0, elapsed: 0, streak: 0, best: 0, done: false, won: false };
}
export function stepGrip(game, delta, held) {
  if (game.done || delta <= 0 || !Number.isFinite(delta)) return game;
  let remaining = Math.min(delta, ROUND_SECONDS - game.elapsed);
  while (remaining > 1e-8 && !game.done) {
    const dt = Math.min(remaining, 1 / 120);
    game.level = clamp(game.level + (held ? 32 : -21) * dt, 0, 100);
    game.elapsed += dt;
    game.streak = game.level >= GRIP_ZONE[0] && game.level <= GRIP_ZONE[1] ? game.streak + dt : 0;
    game.best = Math.max(game.best, game.streak);
    if (game.best >= GRIP_TARGET - 1e-7) { game.best = GRIP_TARGET; game.streak = GRIP_TARGET; game.won = true; game.done = true; }
    remaining -= dt;
  }
  if (game.elapsed >= ROUND_SECONDS - 1e-7) { game.elapsed = ROUND_SECONDS; game.done = true; }
  return game;
}

export function createBalance() {
  return { angle: 4, velocity: 0, elapsed: 0, balanced: 0, done: false, won: false };
}
export function stepBalance(game, delta, direction) {
  if (game.done || delta <= 0 || !Number.isFinite(delta)) return game;
  let remaining = Math.min(delta, ROUND_SECONDS - game.elapsed);
  const input = clamp(direction, -1, 1);
  while (remaining > 1e-8) {
    const dt = Math.min(remaining, 1 / 120);
    const drift = 6 * Math.sin(game.elapsed * .7 + .8) + 3 * Math.sin(game.elapsed * 2.3);
    game.velocity += (game.angle * .85 + drift + input * 32 - game.velocity * .65) * dt;
    game.angle += game.velocity * dt;
    if (Math.abs(game.angle) > 22) { game.angle = Math.sign(game.angle) * 22; game.velocity = 0; }
    game.elapsed += dt;
    if (Math.abs(game.angle) <= BALANCE_ZONE) game.balanced += dt;
    remaining -= dt;
  }
  if (game.elapsed >= ROUND_SECONDS - 1e-7) { game.elapsed = ROUND_SECONDS; game.done = true; game.won = game.balanced >= BALANCE_TARGET - 1e-7; }
  return game;
}

export function matchSummary(results) {
  const played = results.filter(r => r?.status === 'played').length;
  const won = results.filter(r => r?.status === 'played' && r.won).length;
  const skipped = results.filter(r => r?.status === 'skipped').length;
  return { played, won, skipped, complete: played === 3, winner: played === 3 && won >= 2 };
}
