// Quick incident logging. Real life matters as much as planned practice.

import {
  INCIDENT_CONTEXTS,
  INCIDENT_RESPONSES,
  INCIDENT_HELPERS,
  RECOVERY_BANDS,
} from '../content.js';
import { addIncident, isStorageOk } from '../store.js';
import { html, join, icon, toast } from '../ui.js';

let draft = null;

const reset = () => {
  draft = {
    context: null,
    responses: new Set(),
    helpers: new Set(),
    recoveryBand: null,
    note: '',
    when: 'now',
    customWhen: '',
  };
};

// Moments usually get logged after the dust settles, so "now" is a default
// rather than a fact. Recovery trends are built on these timestamps.
const WHEN_CHOICES = [
  { id: 'now', label: 'Just now' },
  { id: 'hours', label: 'Earlier today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'custom', label: 'Another time' },
];

function resolveWhen() {
  const now = new Date();
  if (draft.when === 'hours') {
    now.setHours(now.getHours() - 3);
    return now.toISOString();
  }
  if (draft.when === 'yesterday') {
    now.setDate(now.getDate() - 1);
    return now.toISOString();
  }
  if (draft.when === 'custom' && draft.customWhen) {
    const picked = new Date(draft.customWhen);
    if (!Number.isNaN(picked.getTime())) return picked.toISOString();
  }
  return now.toISOString();
}

/** Value for a datetime-local input, in the browser's own timezone. */
function localInputValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function render() {
  if (!draft) reset();

  return html`
    <div class="player">
      <div class="player-top">
        <button class="icon-btn" type="button" data-exit aria-label="Cancel">${icon('close')}</button>
        <span style="flex:1"></span>
        <span class="badge">Real life</span>
      </div>
      <div class="player-scroll">
        <div class="player-inner">
          <h1 class="step-instruction" style="margin-top: var(--s-4)">What happened?</h1>

          <div class="result-group">
            <div class="options" role="group" aria-label="What happened">
              ${join(
                INCIDENT_CONTEXTS.map(
                  (c) => html`<button
                    type="button"
                    class="option"
                    data-context="${c.id}"
                    aria-pressed="${String(draft.context === c.id)}"
                  >
                    <span><strong>${c.label}</strong></span>
                  </button>`
                )
              )}
            </div>
          </div>

          <div class="result-group">
            <h2>When was this?</h2>
            <div class="chips">
              ${join(
                WHEN_CHOICES.map(
                  (w) => html`<button
                    type="button"
                    class="chip"
                    data-when="${w.id}"
                    aria-pressed="${String(draft.when === w.id)}"
                  >
                    ${w.label}
                  </button>`
                )
              )}
            </div>
            ${draft.when === 'custom'
              ? html`<div class="field" style="margin-top: var(--s-3)">
                  <label for="moment-when">Date and time</label>
                  <input
                    id="moment-when"
                    type="datetime-local"
                    data-custom-when
                    value="${draft.customWhen || localInputValue()}"
                    max="${localInputValue()}"
                  />
                </div>`
              : ''}
          </div>

          <div class="result-group">
            <h2>Lucy’s response</h2>
            <div class="chips">
              ${join(
                INCIDENT_RESPONSES.map(
                  (r) => html`<button
                    type="button"
                    class="chip ${r.tone === 'watch' ? 'chip--watch' : ''}"
                    data-response="${r.id}"
                    aria-pressed="${String(draft.responses.has(r.id))}"
                  >
                    ${r.label}
                  </button>`
                )
              )}
            </div>
          </div>

          <div class="result-group">
            <h2>What helped?</h2>
            <div class="chips">
              ${join(
                INCIDENT_HELPERS.map(
                  (h) => html`<button
                    type="button"
                    class="chip"
                    data-helper="${h.id}"
                    aria-pressed="${String(draft.helpers.has(h.id))}"
                  >
                    ${h.label}
                  </button>`
                )
              )}
            </div>
          </div>

          <div class="result-group">
            <h2>How long to settle?</h2>
            <div class="options" role="group" aria-label="Recovery time">
              ${join(
                RECOVERY_BANDS.map(
                  (r) => html`<button
                    type="button"
                    class="option"
                    data-recovery="${r.id}"
                    aria-pressed="${String(draft.recoveryBand === r.id)}"
                  >
                    <span><strong>${r.label}</strong></span>
                  </button>`
                )
              )}
            </div>
          </div>

          <div class="result-group">
            <details class="disclosure">
              <summary>Add a note</summary>
              <div class="disclosure-body field" style="padding-top: var(--s-3)">
                <label for="moment-note">What was going on</label>
                <textarea id="moment-note" rows="3" data-note>${draft.note}</textarea>
              </div>
            </details>
          </div>
        </div>
      </div>
      <div class="player-foot">
        <button class="btn btn--lg btn--block" type="button" data-save ${draft.context ? '' : 'disabled'}>
          ${draft.context ? 'Save moment' : 'Pick what happened'}
        </button>
      </div>
    </div>
  `;
}

function refresh() {
  const root = document.getElementById('app');
  root.innerHTML = String(render());
  mount(root);
}

function mount(root) {
  const on = (selector, event, handler) =>
    root.querySelectorAll(selector).forEach((el) => el.addEventListener(event, handler));

  const toggle = (set, value, el) => {
    if (set.has(value)) set.delete(value);
    else set.add(value);
    el.setAttribute('aria-pressed', String(set.has(value)));
  };

  on('[data-exit]', 'click', () => {
    draft = null;
    history.length > 1 ? history.back() : (location.hash = '#/today');
  });

  on('[data-context]', 'click', (e) => {
    draft.context = e.currentTarget.dataset.context;
    refresh();
  });

  on('[data-response]', 'click', (e) =>
    toggle(draft.responses, e.currentTarget.dataset.response, e.currentTarget)
  );

  on('[data-helper]', 'click', (e) =>
    toggle(draft.helpers, e.currentTarget.dataset.helper, e.currentTarget)
  );

  on('[data-recovery]', 'click', (e) => {
    draft.recoveryBand = e.currentTarget.dataset.recovery;
    refresh();
  });

  on('[data-note]', 'input', (e) => {
    draft.note = e.currentTarget.value;
  });

  on('[data-when]', 'click', (e) => {
    const next = e.currentTarget.dataset.when;
    draft.when = draft.when === next && next !== 'now' ? 'now' : next;
    if (draft.when === 'custom' && !draft.customWhen) {
      draft.customWhen = localInputValue();
    }
    refresh();
  });

  on('[data-custom-when]', 'change', (e) => {
    draft.customWhen = e.currentTarget.value;
  });

  on('[data-save]', 'click', () => {
    addIncident({
      occurredAt: resolveWhen(),
      context: draft.context,
      responses: [...draft.responses],
      helpers: [...draft.helpers],
      recoveryBand: draft.recoveryBand,
      note: draft.note,
    });
    draft = null;
    if (!isStorageOk()) toast('Not saved. Storage is unavailable on this device.');
    else toast('Moment saved');
    location.hash = '#/progress';
  });

  const heading = root.querySelector('.step-instruction');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
}

export default { render, mount, tab: null, fullscreen: true };
