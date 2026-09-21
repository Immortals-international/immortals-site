import { createGrip, stepGrip, createBalance, stepBalance, matchSummary, ROUND_SECONDS, BALANCE_ZONE } from './dealer-game-models.js';

// Results stay in memory on this page. No sensors, accounts or data uploads.
const el = id => document.getElementById(id);
const panels = ['reaction-game', 'grip-game', 'balance-game', 'game-scorecard'];
const descriptions = [
  ['Your move.', 'Three attempts. One target. See how quickly you respond.', ['Start an attempt and wait for the signal.', 'When the circle says NOW, tap it or press Space.', 'Your middle time decides this round. Match or beat 300 ms.']],
  ['Find your hold.', 'A little pressure. A little restraint. Find the right rhythm.', ['Start the round. Hold the button or Space to raise the gauge.', 'Release to let it fall. Keep it inside the green target zone.', 'Hold the zone for three continuous seconds within 15 seconds.']],
  ['Hold your centre.', 'Small corrections. A steady board. Keep your balance.', ['Start the round. The board will begin to tip.', 'If it tips right, hold the left arrow. If it tips left, hold right.', 'Keep it near level for a total of 10 seconds during the 15-second round.']],
  ['The reveal.', 'Three different challenges. One personal game card.', ['Your card uses the results from the rounds you played.', 'Win at least two of all three rounds to beat the dealer.', 'Select a round on the card to revisit it, or play all three again.']],
];
let active = 0, results = [null, null, null];
let reactionState = 'idle', reactionTimer, reactionFrame, signalAt = 0, times = [];
let grip = createGrip(), balance = createBalance();
let gripMode = 'idle', balanceMode = 'idle', loop, previousFrame = null;
const keys = new Set();
const pointerHolds = { grip: new Set(), left: new Set(), right: new Set() };
const toggles = { grip: false, left: false, right: false };
const held = kind => pointerHolds[kind].size > 0 || toggles[kind] || (kind === 'grip' ? keys.has('Space') : keys.has(kind === 'left' ? 'ArrowLeft' : 'ArrowRight'));
const buttonIds = { grip: 'grip-hold', left: 'balance-left', right: 'balance-right' };
const seconds = value => (Math.floor((value + 1e-7) * 10) / 10).toFixed(1);

function syncInputs() { for (const kind of Object.keys(buttonIds)) el(buttonIds[kind]).setAttribute('aria-pressed', String(held(kind))); }
function releaseInputs() {
  keys.clear();
  for (const kind of Object.keys(pointerHolds)) { pointerHolds[kind].clear(); toggles[kind] = false; }
  syncInputs();
}
function clearReaction() { clearTimeout(reactionTimer); cancelAnimationFrame(reactionFrame); }
function displayReaction(state, label, symbol, message) {
  reactionState = state; el('reaction-game').dataset.state = state;
  el('reaction-label').textContent = label; el('reaction-symbol').textContent = symbol; el('reaction-guidance').textContent = message;
}
function resetReaction() {
  clearReaction(); times = []; el('reaction-summary').hidden = true;
  for (let i = 0; i < 3; i++) el(`attempt-${i}`).textContent = '—';
  displayReaction('idle', 'Start attempt 1', '↗', 'Wait for NOW before responding.');
}
function startAttempt() {
  clearReaction();
  displayReaction('waiting', 'Wait for NOW', '···', `Attempt ${times.length + 1} of 3. Wait for the circle to light up.`);
  reactionTimer = setTimeout(() => {
    reactionFrame = requestAnimationFrame(() => {
      displayReaction('go', 'NOW', '↓', 'Respond now. Tap the circle or press Space.'); signalAt = performance.now();
      reactionTimer = setTimeout(() => displayReaction('paused', 'Retry this attempt', '↻', 'That signal timed out. This attempt was not counted.'), 10000);
    });
  }, 1400 + Math.random() * 2000);
}
function activateReaction() {
  if (active !== 0) return;
  if (reactionState === 'complete') { resetRound(0); return; }
  if (reactionState === 'waiting') {
    clearReaction(); displayReaction('early', 'Retry this attempt', '↻', 'A little early. Wait for NOW. This attempt was not counted.');
  } else if (reactionState === 'go') {
    const elapsed = Math.round(performance.now() - signalAt); clearReaction();
    if (elapsed < 80) { displayReaction('early', 'Retry this attempt', '↻', 'That response may have anticipated the signal. Please try again.'); return; }
    times.push(elapsed); el(`attempt-${times.length - 1}`).textContent = `${elapsed} ms`;
    if (times.length < 3) displayReaction('result', `Start attempt ${times.length + 1}`, String(elapsed), `${elapsed} ms recorded. Start the next attempt when ready.`);
    else {
      const median = [...times].sort((a, b) => a - b)[1], won = median <= 300;
      el('reaction-summary').hidden = false; el('reaction-median').textContent = `${median} ms`;
      el('reaction-verdict').textContent = won ? 'You won this round.' : 'The dealer takes this round.';
      displayReaction('complete', 'Retry round', won ? '✓' : '↻', `${median} ms. ${won ? 'Round won.' : 'Target missed.'} Continue to grip control when ready.`);
      results[0] = { status: 'played', won, value: `${median} ms`, detail: 'Middle reaction time' }; updateProgress();
    }
  } else { if (results[0]?.status === 'skipped') { results[0] = null; updateProgress(); } startAttempt(); }
}
el('reaction-pad').addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  event.preventDefault(); el('reaction-pad').focus({ preventScroll: true }); activateReaction();
});
el('reaction-pad').addEventListener('keydown', event => {
  if (event.key !== ' ' && event.key !== 'Enter') return;
  event.preventDefault(); if (!event.repeat) activateReaction();
});
el('reaction-pad').addEventListener('click', event => { if (event.detail === 0) activateReaction(); });

function paintGrip() {
  el('grip-game').dataset.state = gripMode; el('grip-game').dataset.inZone = String(grip.level >= 60 && grip.level <= 75);
  el('grip-meter-fill').style.width = `${grip.level}%`; el('grip-meter-pointer').style.left = `${grip.level}%`;
  el('grip-meter').setAttribute('aria-valuenow', String(Math.round(grip.level)));
  el('grip-device-value').textContent = String(Math.round(grip.level));
  el('grip-moving-handle').setAttribute('transform', `translate(${-grip.level * .18} 0)`);
  el('grip-streak').firstChild.textContent = `${seconds(grip.done ? grip.best : grip.streak)} `;
  el('grip-time').firstChild.textContent = `${Math.max(0, ROUND_SECONDS - grip.elapsed).toFixed(1)} `;
  el('grip-hold').disabled = gripMode !== 'running'; el('grip-start').disabled = gripMode === 'complete';
  el('grip-start').firstChild.textContent = ({ idle: 'Start grip round ', running: 'Pause round ', paused: 'Resume round ', complete: grip.won ? 'Round won ✓ ' : 'Round complete ' })[gripMode];
}
function paintBalance() {
  const level = Math.abs(balance.angle) <= BALANCE_ZONE;
  el('balance-game').dataset.state = balanceMode; el('balance-game').dataset.inZone = String(level);
  el('balance-board').style.transform = `rotate(${balance.angle}deg)`;
  el('balance-level').textContent = balanceMode === 'idle' ? 'FIND YOUR CENTRE' : balanceMode === 'paused' ? 'PAUSED' : level ? 'IN BALANCE' : balance.angle > 0 ? 'LEAN LEFT ←' : 'LEAN RIGHT →';
  el('balance-score').firstChild.textContent = `${seconds(balance.balanced)} `;
  el('balance-time').firstChild.textContent = `${Math.max(0, ROUND_SECONDS - balance.elapsed).toFixed(1)} `;
  el('balance-left').disabled = el('balance-right').disabled = balanceMode !== 'running'; el('balance-start').disabled = balanceMode === 'complete';
  el('balance-start').firstChild.textContent = ({ idle: 'Start balance round ', running: 'Pause round ', paused: 'Resume round ', complete: balance.won ? 'Round won ✓ ' : 'Round complete ' })[balanceMode];
}
function finishControl(index) {
  releaseInputs(); cancelAnimationFrame(loop); previousFrame = null;
  if (index === 1) {
    gripMode = 'complete'; results[1] = { status: 'played', won: grip.won, value: `${seconds(grip.best)} sec`, detail: 'Best continuous hold' };
    el('grip-guidance').textContent = grip.won ? 'Three seconds in the zone. You won the grip-control round.' : `Time is up. Your best continuous hold was ${seconds(grip.best)} seconds. Try again or continue.`; paintGrip();
  } else {
    balanceMode = 'complete'; results[2] = { status: 'played', won: balance.won, value: `${seconds(balance.balanced)} sec`, detail: 'Time in balance' };
    el('balance-guidance').textContent = `${seconds(balance.balanced)} seconds in balance. ${balance.won ? 'You won this round.' : 'The dealer takes this round.'} Reveal your game card when ready.`; paintBalance();
  }
  updateProgress();
}
function tick(now) {
  if ((active !== 1 || gripMode !== 'running') && (active !== 2 || balanceMode !== 'running')) return;
  const dt = previousFrame === null ? 0 : (now - previousFrame) / 1000; previousFrame = now;
  if (dt > .25) { pauseGames('The game paused after an interruption. Resume when ready.'); return; }
  if (active === 1) { stepGrip(grip, dt, held('grip')); paintGrip(); if (grip.done) { finishControl(1); return; } }
  else { stepBalance(balance, dt, Number(held('right')) - Number(held('left'))); paintBalance(); if (balance.done) { finishControl(2); return; } }
  loop = requestAnimationFrame(tick);
}
function startControl(index) {
  if (index !== active) return;
  if ((index === 1 && gripMode === 'running') || (index === 2 && balanceMode === 'running')) { pauseGames('Paused. Resume when you are ready.'); return; }
  if ((index === 1 && gripMode === 'complete') || (index === 2 && balanceMode === 'complete')) return;
  results[index] = null; releaseInputs(); previousFrame = null;
  if (index === 1) { gripMode = 'running'; el('grip-guidance').textContent = 'Hold to raise the gauge; release to lower it. Keep it in the green zone.'; paintGrip(); el('grip-hold').focus({ preventScroll: true }); }
  else { balanceMode = 'running'; el('balance-guidance').textContent = 'Counter a right tilt with left; counter a left tilt with right. Small corrections work best.'; paintBalance(); el('balance-stage').focus({ preventScroll: true }); }
  updateProgress(); cancelAnimationFrame(loop); loop = requestAnimationFrame(tick);
}
function pauseGames(message = 'Paused while you left the round. Resume when ready.') {
  clearReaction(); cancelAnimationFrame(loop); previousFrame = null; releaseInputs();
  if (reactionState === 'waiting' || reactionState === 'go') displayReaction('paused', 'Resume this attempt', '↻', 'This attempt paused and was not counted. Start it again when ready.');
  if (gripMode === 'running') { gripMode = 'paused'; grip.streak = 0; el('grip-guidance').textContent = `${message} The continuous hold starts again on resume.`; paintGrip(); }
  if (balanceMode === 'running') { balanceMode = 'paused'; el('balance-guidance').textContent = message; paintBalance(); }
}
el('grip-start').addEventListener('click', () => startControl(1));
el('balance-start').addEventListener('click', () => startControl(2));
for (const [kind, id] of Object.entries(buttonIds)) {
  const button = el(id);
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 || button.disabled) return;
    event.preventDefault(); button.focus({ preventScroll: true }); button.setPointerCapture(event.pointerId); pointerHolds[kind].add(event.pointerId); syncInputs();
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, event => { pointerHolds[kind].delete(event.pointerId); syncInputs(); });
  // Assistive activation toggles a hold. Pointer input uses capture instead.
  button.addEventListener('click', event => { if (event.detail === 0 && !button.disabled) { toggles[kind] = !toggles[kind]; syncInputs(); } });
}
window.addEventListener('keydown', event => {
  if (!(active < 3 && el(panels[active]).contains(document.activeElement))) return;
  const code = event.code || (event.key === ' ' ? 'Space' : event.key);
  if ((active === 1 && gripMode === 'running' && code === 'Space') || (active === 2 && balanceMode === 'running' && ['ArrowLeft', 'ArrowRight'].includes(code))) { event.preventDefault(); keys.add(code); syncInputs(); }
});
window.addEventListener('keyup', event => { keys.delete(event.code || (event.key === ' ' ? 'Space' : event.key)); syncInputs(); });
document.addEventListener('focusin', event => { if (active < 3 && !el(panels[active]).contains(event.target)) releaseInputs(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGames(); });
window.addEventListener('blur', () => pauseGames()); window.addEventListener('pagehide', () => pauseGames());
if ('IntersectionObserver' in window) new IntersectionObserver(entries => { if (!entries[0].isIntersecting) pauseGames('Paused while the game was out of view. Resume when ready.'); }, { threshold: 0 }).observe(el('play'));

function updateProgress() {
  const match = matchSummary(results);
  for (let i = 0; i < 3; i++) {
    const result = results[i];
    el(`progress-${i}`).textContent = result?.status === 'skipped' ? 'Skipped' : result?.status === 'played' ? result.won ? 'Round won' : 'Target missed' : i === active ? 'Your turn' : 'Ready to play';
    el(`mark-${i}`).textContent = result?.status === 'skipped' ? '—' : result?.status === 'played' ? result.won ? '✓' : '·' : i === active ? '↗' : '○';
    const button = document.querySelector(`[data-round="${i}"]`); button.setAttribute('aria-pressed', String(i === active));
    button.dataset.outcome = result?.status === 'played' ? result.won ? 'won' : 'missed' : result?.status || 'unplayed';
  }
  el('match-count').textContent = `${match.played} / 3 rounds played${match.skipped ? ` · ${match.skipped} skipped` : ''}`;
  el('match-wins').textContent = match.played ? `${match.won} ${match.won === 1 ? 'round' : 'rounds'} won · two wins take the game.` : 'Win two to beat the dealer.';
  el('show-game-card').disabled = !results.some(Boolean);
  el('round-next').disabled = active > 2 || results[active]?.status !== 'played';
  el('round-next').textContent = active === 0 ? 'Next: grip control →' : active === 1 ? 'Next: balance →' : 'Reveal my game card ↗';
  el('round-skip').hidden = active > 2 || results[active]?.status === 'played';
  if (active === 3) renderCard();
}
function renderCard() {
  const match = matchSummary(results);
  el('game-card-title').textContent = match.complete ? match.winner ? 'You beat the dealer.' : 'The dealer takes this one.' : 'Your game, so far.';
  el('game-card-seal').textContent = `${match.won}/3`; el('game-scorecard').dataset.winner = String(match.winner);
  el('game-card-description').textContent = match.complete ? `${match.won} of three rounds won. ${match.winner ? 'A little competition. Your own result.' : 'A rematch is one click away.'}` : `${match.played} of three rounds played. ${match.skipped ? `${match.skipped} skipped. ` : ''}Complete all three for the final result.`;
  results.forEach((result, i) => {
    el(`card-value-${i}`).textContent = result?.status === 'played' ? result.value : result?.status === 'skipped' ? 'Skipped' : 'Not played';
    el(`card-status-${i}`).textContent = result?.status === 'played' ? `${result.won ? 'Round won' : 'Target missed'} ↗` : 'Play round ↗';
    el(`card-status-${i}`).dataset.won = String(Boolean(result?.won)); el(`card-value-${i}`).title = result?.detail || '';
  });
}
function showRound(index, focus = true) {
  pauseGames(); active = index; panels.forEach((id, i) => { el(id).hidden = i !== index; });
  const [title, description, instructions] = descriptions[index];
  el('demo-title').textContent = title; el('demo-description').textContent = description;
  el('demo-instructions').replaceChildren(...instructions.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
  el('round-navigation').hidden = index === 3; updateProgress();
  if (focus) {
    const target = index === 3 ? el('game-scorecard') : document.querySelector(`[data-round="${index}"]`); target.focus({ preventScroll: true });
    const anchor = index === 3 ? el('game-scorecard') : matchMedia('(max-width:760px)').matches ? el(panels[index]) : el('play');
    anchor.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
}
function resetRound(index) {
  pauseGames(); results[index] = null;
  if (index === 0) resetReaction();
  else if (index === 1) { grip = createGrip(); gripMode = 'idle'; el('grip-guidance').textContent = 'Start the round. Keep the gauge in the green zone for three continuous seconds.'; paintGrip(); }
  else { balance = createBalance(); balanceMode = 'idle'; el('balance-guidance').textContent = 'Start the round. Counter the tilt with small left and right corrections.'; paintBalance(); }
  updateProgress();
}
document.querySelectorAll('[data-round], [data-card-round]').forEach(button => button.addEventListener('click', () => showRound(Number(button.dataset.round ?? button.dataset.cardRound))));
el('round-retry').addEventListener('click', () => resetRound(active));
el('round-skip').addEventListener('click', () => { resetRound(active); results[active] = { status: 'skipped' }; showRound(active + 1); });
el('round-next').addEventListener('click', () => showRound(active + 1));
el('show-game-card').addEventListener('click', () => showRound(3));
el('restart-match').addEventListener('click', () => { for (let i = 0; i < 3; i++) resetRound(i); showRound(0); });
paintGrip(); paintBalance(); updateProgress();

// The separate in-clinic scorecard remains an explicitly fictional example.
const reveal = document.getElementById('reveal-scorecard');
reveal.addEventListener('click', () => {
  const opening = reveal.getAttribute('aria-expanded') !== 'true';
  reveal.setAttribute('aria-expanded', String(opening));
  document.getElementById('example-scorecard').dataset.revealed = String(opening);
  document.getElementById('scorecard-cover').hidden = opening;
  document.getElementById('scorecard-results').hidden = !opening;
  reveal.firstChild.textContent = opening ? 'Hide the example scorecard ' : 'Reveal an example scorecard ';
});
const resultDetails = {
  reaction: ['THE REACTION ROUND', 'The time between the visual signal and the response. This fictional guest beat the example game target of 300 ms.'],
  grip: ['THE GRIP ROUND', 'The force recorded by the grip device. This fictional guest recorded 42 kg against an illustrative game target of 40 kg. The host would explain the agreed technique and what was measured.'],
  balance: ['THE BALANCE ROUND', 'Time maintained in an agreed position. This fictional guest recorded 18 seconds against an illustrative game target of 20 seconds. A missed game target is not a diagnosis.'],
};
for (const button of document.querySelectorAll('[data-result]')) {
  button.addEventListener('click', () => {
    for (const other of document.querySelectorAll('[data-result]')) other.setAttribute('aria-pressed', String(other === button));
    const [title, copy] = resultDetails[button.dataset.result];
    document.getElementById('scorecard-detail-title').textContent = title;
    document.getElementById('scorecard-detail-copy').textContent = copy;
  });
}
