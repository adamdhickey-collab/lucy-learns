// Small rendering helpers. No framework: template strings plus event delegation.

/** Escape anything the household typed before it goes back into the DOM. */
export const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Mark a string as already-safe markup. */
export function raw(value) {
  const wrapper = new String(value ?? '');
  wrapper.__raw = true;
  return wrapper;
}

const isRaw = (value) => Boolean(value && value.__raw);

const renderValue = (value) => {
  if (Array.isArray(value)) return value.map(renderValue).join('');
  return isRaw(value) ? String(value) : esc(value);
};

/**
 * Tagged template that escapes interpolations. Nested html`` results and
 * raw() values pass through untouched, so views can compose freely.
 */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    out += renderValue(values[i]) + strings[i + 1];
  }
  return raw(out);
}

/** Concatenate a list of already-rendered chunks. */
export const join = (parts) => raw(parts.map(renderValue).join(''));

export const ICONS = {
  today: '<svg viewBox="0 0 24 24"><path d="M12 3v2M5 6l1.4 1.4M3 13h2M19 13h2M17.6 7.4 19 6"/><path d="M8 20h8"/><path d="M9 17a5 5 0 1 1 6 0 2 2 0 0 0-.8 1.6V19H9.8v-.4A2 2 0 0 0 9 17z"/></svg>',
  activities:
    '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h4"/></svg>',
  progress:
    '<svg viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 3.5-4 3 2.5L20 7"/></svg>',
  // Dog head with floppy ears. Reads as Lucy at 24px without a paw print.
  dog:
    '<svg viewBox="0 0 24 24">' +
    '<path d="M8 7.4C6.4 6.8 4.8 7.9 4.8 10c0 2 1.3 3.6 3.2 4"/>' +
    '<path d="M16 7.4c1.6-.6 3.2.5 3.2 2.6 0 2-1.3 3.6-3.2 4"/>' +
    '<path d="M8 7.2A6.6 6.6 0 0 1 12 6c1.5 0 2.9.4 4 1.2v5.4a4.5 4.5 0 0 1-1.9 3.7l-1 .7a2 2 0 0 1-2.2 0l-1-.7A4.5 4.5 0 0 1 8 12.6z"/>' +
    '<path d="M10.3 11h.01M13.7 11h.01"/>' +
    '</svg>',
  back: '<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  spark:
    '<svg viewBox="0 0 24 24"><path d="M12 3v3M12 18v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M3 12h3M18 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/><circle cx="12" cy="12" r="3"/></svg>',
  check: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
  clock:
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  shield:
    '<svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.4 3 8.5 7 10 4-1.5 7-5.6 7-10V6l-7-3z"/><path d="M12 9v4"/></svg>',
};

export const icon = (name) => raw(ICONS[name] || '');

/** Mastery badge. Shape plus text, never color alone. */
export const badge = (mastery) =>
  raw(`<span class="badge badge--${mastery.id}">${esc(mastery.label)}</span>`);

export const difficultyDots = (difficulty) => {
  const level = { beginner: 1, intermediate: 2, advanced: 3 }[difficulty] || 1;
  const pips = [1, 2, 3].map((n) => `<i class="${n <= level ? 'on' : ''}"></i>`).join('');
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  return raw(
    `<span class="difficulty"><span class="pips" aria-hidden="true">${pips}</span>${esc(label)}</span>`
  );
};

/** Ask the router to redraw the current screen after stored data changed. */
export const refreshApp = () =>
  window.dispatchEvent(new CustomEvent('app:refresh'));

/**
 * Transient confirmation. Pass an action to make it undoable — a mis-tap
 * should never be permanent.
 */
export function toast(message, action) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');

  const text = document.createElement('span');
  text.textContent = message;
  el.appendChild(text);

  let timer = setTimeout(() => el.remove(), action ? 7000 : 2600);

  if (action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'toast-action';
    button.textContent = action.label;
    button.addEventListener('click', () => {
      clearTimeout(timer);
      el.remove();
      action.onAction();
    });
    el.appendChild(button);
  }

  document.body.appendChild(el);
  return () => {
    clearTimeout(timer);
    el.remove();
  };
}

/**
 * Replaces window.confirm for destructive actions. The native dialog is the
 * one place the app's visual language drops away, and it shows up exactly at
 * the highest-anxiety moments.
 */
export function confirmSheet({
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  extraLabel,
  onExtra,
  onConfirm,
}) {
  const previous = document.activeElement;
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';
  backdrop.innerHTML = `
    <div class="sheet sheet--dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <h2 id="confirm-title">${esc(title)}</h2>
      ${body ? `<p>${esc(body)}</p>` : ''}
      ${
        extraLabel
          ? `<button class="btn btn--quiet btn--block" type="button" data-extra>${esc(extraLabel)}</button>`
          : ''
      }
      <div class="btn-row" style="margin-top: var(--s-4)">
        <button class="btn btn--quiet" type="button" data-cancel>${esc(cancelLabel)}</button>
        <button class="btn ${tone === 'danger' ? 'btn--danger' : ''}" type="button" data-confirm>
          ${esc(confirmLabel)}
        </button>
      </div>
    </div>`;

  const close = () => {
    backdrop.remove();
    document.removeEventListener('keydown', onKey);
    if (previous && previous.focus) previous.focus({ preventScroll: true });
  };

  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  backdrop.querySelector('[data-cancel]').addEventListener('click', close);
  backdrop.querySelector('[data-confirm]').addEventListener('click', () => {
    close();
    onConfirm();
  });
  const extra = backdrop.querySelector('[data-extra]');
  if (extra) extra.addEventListener('click', () => onExtra());

  document.addEventListener('keydown', onKey);
  document.body.appendChild(backdrop);
  backdrop.querySelector('[data-confirm]').focus({ preventScroll: true });
  return close;
}

export const pct = (value) => (value === null || value === undefined ? '—' : `${Math.round(value * 100)}%`);

export const mmss = (seconds) => {
  if (seconds === null || seconds === undefined) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
};

/**
 * Move focus to the top of a freshly rendered screen for screen readers.
 * Skipped on in-place refreshes so a tap does not throw focus to the title.
 */
export function focusHeading(root, _params, options = {}) {
  if (options.isRefresh) return;
  const heading = root.querySelector('h1, h2');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
}
