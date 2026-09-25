const screen = document.querySelector('#presentation-access');

if (screen) {
  if (document.documentElement.hasAttribute('data-presentation-unlocked')) {
    screen.remove();
  } else {
    const form = screen.querySelector('form');
    const input = screen.querySelector('input');
    const submit = screen.querySelector('button[type="submit"]');
    const error = screen.querySelector('#access-error');

    // Native modal behavior keeps keyboard focus and assistive technology in the form.
    screen.removeAttribute('open');
    screen.showModal();
    input.focus({ preventScroll: true });
    screen.addEventListener('cancel', event => event.preventDefault());
    screen.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.key !== 'Tab') return;
      if (event.shiftKey && document.activeElement === input) {
        event.preventDefault();
        submit.focus();
      } else if (!event.shiftKey && document.activeElement === submit) {
        event.preventDefault();
        input.focus();
      }
    });
    input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      error.textContent = '';
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submit.disabled) return;
      submit.disabled = true;
      error.textContent = '';
      try {
        const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input.value));
        const digest = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
        if (digest !== screen.dataset.digest) {
          input.setAttribute('aria-invalid', 'true');
          error.textContent = "That password isn't correct. Please try again.";
          input.focus();
          input.select();
          return;
        }
        try { sessionStorage.setItem(screen.dataset.storageKey, digest); } catch { /* Entry still works without storage. */ }
        input.value = '';
        document.documentElement.setAttribute('data-presentation-unlocked', '');
        screen.close();
        screen.remove();
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('scroll'));
      } catch {
        error.textContent = 'Unable to check the password. Please reload the page and try again.';
      } finally {
        submit.disabled = false;
      }
    });
  }
}
