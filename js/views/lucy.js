import { DOG, MEMBERS, PROGRAMS } from '../content.js';
import {
  getState,
  updateCommand,
  setWeeklyGoal,
  setActiveMember,
  activeMember,
  exportSummary,
  hasDemoData,
  clearDemoData,
  clearAll,
} from '../store.js';
import { html, join, focusHeading, toast, confirmSheet } from '../ui.js';

function render() {
  const state = getState();
  const me = activeMember();
  const program = PROGRAMS[0];

  const cues = state.commands.map(
    (c) => html`<div class="cue-row">
      <label class="situation" for="cue-${c.id}">${c.situation}</label>
      <input id="cue-${c.id}" type="text" value="${c.cue}" data-cue="${c.id}" />
    </div>`
  );

  const who = MEMBERS.map(
    (m) => html`<button type="button" data-member="${m.id}"
      aria-pressed="${String(m.id === me.id)}">${m.name}</button>`
  );

  return html`
    <div class="screen">
      <div class="screen-head">
        <p class="eyebrow">Profile</p>
        <h1>${DOG.name}</h1>
      </div>

      <div class="card">
        <div class="profile">
          <img src="${DOG.photo}" alt="Lucy, a black Lab and German Wirehaired Pointer mix." />
          <div>
            <h2>${DOG.name}</h2>
            <p>${DOG.breed}</p>
            <p>${DOG.about}</p>
          </div>
        </div>
      </div>

      <section class="section">
        <h2>Who is practicing</h2>
        <p class="section-note" style="margin-bottom: var(--s-3)">
          Every session records who ran it. That is how “Reliable” gets earned.
        </p>
        <div class="who" role="group" aria-label="Active household member">${join(who)}</div>
      </section>

      <section class="section">
        <h2>Commands we use</h2>
        <p class="section-note" style="margin-bottom: var(--s-3)">
          Change these once, and every activity screen updates. Confirm the wording with The
          Canine Coach first.
        </p>
        <div class="card">${join(cues)}</div>
      </section>

      <section class="section">
        <h2>Practice goal</h2>
        <div class="card">
          <div class="cue-row">
            <span class="situation">Sessions per week</span>
            <div class="stepper">
              <button type="button" data-goal="-1" aria-label="Lower the weekly goal">−</button>
              <output data-goal-out aria-live="polite">${state.weeklyGoal}</output>
              <button type="button" data-goal="1" aria-label="Raise the weekly goal">+</button>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>Trainer material</h2>
        <div class="card">
          <div class="card-body">
            <strong>${program.source.label}</strong>
            <p class="section-note" style="margin-top: var(--s-2)">${program.source.note}</p>
          </div>
        </div>
        <p class="section-note" style="margin-top: var(--s-3)">
          Lucy Learns is here to help you practice what your trainer assigned. It does not
          diagnose behavior and it does not replace professional guidance.
        </p>
      </section>

      <section class="section">
        <h2>Data</h2>
        <div class="card">
          <button class="setting-row" type="button" data-export>
            <span>
              Export progress
              <small>CSV of every session and moment, for The Canine Coach</small>
            </span>
            <span class="value">${state.sessions.length + state.incidents.length} records</span>
          </button>
          ${hasDemoData()
            ? html`<button class="setting-row" type="button" data-clear-demo>
                <span>
                  Clear example data
                  <small>Remove the seeded sessions and keep your own</small>
                </span>
              </button>`
            : ''}
          <button class="setting-row danger" type="button" data-clear-all>
            <span>
              Delete everything
              <small>All sessions, moments, and cue edits on this device</small>
            </span>
          </button>
        </div>
      </section>

      <div class="card" style="margin-top: var(--s-4)">
        <div class="card-body">
          <h3 style="font-size: var(--step-0)">This device only</h3>
          <p class="section-note" style="margin-top: var(--s-2)">
            Sessions are saved in this browser and nowhere else. They do not sync between
            phones, so Adam and Fabiola each build their own log. Export a copy if you want
            them combined, or before you clear Safari's data.
          </p>
        </div>
      </div>

      <p class="section-note" style="margin-top: var(--s-6); text-align: center">
        Lucy Learns
      </p>
    </div>
  `;
}

function downloadExport() {
  const csv = exportSummary();
  // The BOM keeps Excel from mangling the curly quotes in notes.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lucy-training-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function mount(root) {
  const on = (selector, event, handler) =>
    root.querySelectorAll(selector).forEach((el) => el.addEventListener(event, handler));

  on('[data-cue]', 'change', (e) => {
    const value = e.currentTarget.value.trim();
    if (value) updateCommand(e.currentTarget.dataset.cue, value);
    else e.currentTarget.value = getState().commands.find(
      (c) => c.id === e.currentTarget.dataset.cue
    ).cue;
  });

  on('[data-member]', 'click', (e) => {
    setActiveMember(e.currentTarget.dataset.member);
    root.querySelectorAll('[data-member]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.member === e.currentTarget.dataset.member))
    );
  });

  on('[data-goal]', 'click', (e) => {
    const next = Math.min(14, Math.max(1, getState().weeklyGoal + Number(e.currentTarget.dataset.goal)));
    setWeeklyGoal(next);
    const out = root.querySelector('[data-goal-out]');
    if (out) out.textContent = next;
  });

  on('[data-export]', 'click', downloadExport);

  on('[data-clear-demo]', 'click', () => {
    confirmSheet({
      title: 'Remove the example sessions?',
      body: 'The ten seeded sessions go. Anything you logged yourselves stays.',
      confirmLabel: 'Remove examples',
      onConfirm: () => {
        clearDemoData();
        toast('Example data cleared');
        location.reload();
      },
    });
  });

  on('[data-clear-all]', 'click', () => {
    confirmSheet({
      title: 'Delete everything?',
      body:
        'Every session, moment, and cue edit on this device. This cannot be undone, and there is no copy anywhere else.',
      confirmLabel: 'Delete it all',
      tone: 'danger',
      extraLabel: 'Export a copy first',
      onExtra: downloadExport,
      onConfirm: () => {
        clearAll();
        toast('All data deleted');
        location.reload();
      },
    });
  });

  focusHeading(root);
}

export default { render, mount, tab: 'lucy' };
