// A local browser game. No measurements are sent or stored.
const game = document.getElementById('reaction-game');
const pad = document.getElementById('reaction-pad');
const label = document.getElementById('reaction-label');
const symbol = document.getElementById('reaction-symbol');
const guidance = document.getElementById('reaction-guidance');
const summary = document.getElementById('reaction-summary');
const target = 300;
let state = 'idle', timer, frame, signalAt = 0;
let times = [];

function clearPending() { clearTimeout(timer); cancelAnimationFrame(frame); }
function display(next, text, icon, message) {
  state = next;
  game.dataset.state = next;
  label.textContent = text;
  symbol.textContent = icon;
  guidance.textContent = message;
}
function reset() {
  clearPending(); times = []; summary.hidden = true;
  for (let i = 0; i < 3; i++) document.getElementById(`attempt-${i}`).textContent = '—';
  display('idle', 'Start attempt 1', '↗', 'Wait for NOW before responding.');
}
function startAttempt() {
  clearPending();
  display('waiting', 'Wait for NOW', '···', `Attempt ${times.length + 1} of 3. Wait for the circle to light up.`);
  timer = setTimeout(() => {
    frame = requestAnimationFrame(() => {
      display('go', 'NOW', '↓', 'Respond now. Tap the circle or press Space.');
      signalAt = performance.now();
      // A missed signal is retried rather than recorded as a misleading result.
      timer = setTimeout(() => display('paused', 'Try this attempt again', '↻', 'That signal timed out. This attempt was not counted.'), 10000);
    });
  }, 1400 + Math.random() * 2000);
}
function activate() {
  if (state === 'waiting') {
    clearPending();
    display('early', 'Retry this attempt', '↻', 'A little early. Wait for NOW. This attempt was not counted.');
  } else if (state === 'go') {
    const elapsed = Math.round(performance.now() - signalAt);
    clearPending();
    if (elapsed < 80) {
      display('early', 'Retry this attempt', '↻', 'That response may have anticipated the signal. Please try again.');
      return;
    }
    times.push(elapsed);
    document.getElementById(`attempt-${times.length - 1}`).textContent = `${elapsed} ms`;
    if (times.length < 3) {
      display('result', `Start attempt ${times.length + 1}`, String(elapsed), `${elapsed} ms recorded. Start the next attempt when ready.`);
    } else {
      const median = [...times].sort((a, b) => a - b)[1];
      summary.hidden = false;
      document.getElementById('reaction-median').textContent = `${median} ms`;
      const won = median <= target;
      const verdict = won ? 'You beat the demo target.' : 'The dealer takes this demo round.';
      document.getElementById('reaction-verdict').textContent = verdict;
      display('complete', 'Play again', won ? '✓' : '↻', `Your middle time: ${median} ms. ${verdict} This is one browser round, not the full experience.`);
    }
  } else if (state === 'complete') reset();
  else startAttempt();
}

// Pointer-down avoids measuring a finger's release time. Keyboard and assistive
// clicks remain available without counting the following synthetic click twice.
pad.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary || event.button !== 0) return;
  event.preventDefault(); pad.focus({ preventScroll: true }); activate();
});
pad.addEventListener('keydown', (event) => {
  if (event.key !== ' ' && event.key !== 'Enter') return;
  event.preventDefault();
  if (!event.repeat) activate();
});
pad.addEventListener('click', (event) => { if (event.detail === 0) activate(); });
document.getElementById('reaction-reset').addEventListener('click', reset);
function pauseAttempt() {
  if (state !== 'waiting' && state !== 'go') return;
  clearPending();
  display('paused', 'Resume this attempt', '↻', 'The game paused when you left it. This attempt was not counted.');
}
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseAttempt(); });
window.addEventListener('blur', pauseAttempt);
window.addEventListener('pagehide', clearPending);

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
