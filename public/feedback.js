// Feedback button + modal. Posts to /api/feedback which creates a GitHub issue.

const MAX_LEN = 4000;

function gatherContext() {
  const $ = (id) => document.getElementById(id);
  const val = (id) => ($(id) ? $(id).value : null);
  const text = (id) => ($(id) ? $(id).textContent : null);
  return {
    base: val('base-text'),
    lightBg: val('light-bg-text'),
    darkBg: val('dark-bg-text'),
    target: document.querySelector('.target-opt.is-active')?.dataset.target || null,
    lightFg: text('light-fg-hex'),
    darkFg: text('dark-fg-hex'),
    lightRatio: text('light-ratio'),
    darkRatio: text('dark-ratio'),
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    url: window.location.href,
  };
}

function buildModal() {
  const wrap = document.createElement('div');
  wrap.className = 'fb-modal';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('aria-labelledby', 'fb-title');
  wrap.hidden = true;
  wrap.innerHTML = `
    <div class="fb-backdrop" data-fb-close></div>
    <div class="fb-panel">
      <h2 id="fb-title">Send feedback</h2>
      <p class="fb-hint">Tell us what's working, what's broken, or what's missing. Posts as a public GitHub issue.</p>
      <textarea id="fb-message" maxlength="${MAX_LEN}" rows="6" placeholder="Your feedback…"></textarea>
      <details class="fb-context">
        <summary>This information will be sent with your feedback</summary>
        <dl class="fb-context-list"></dl>
      </details>
      <div class="fb-actions">
        <button type="button" class="fb-cancel" data-fb-close>Cancel</button>
        <button type="button" class="fb-submit">Send</button>
      </div>
      <p class="fb-status" aria-live="polite"></p>
    </div>
  `;
  document.body.appendChild(wrap);
  return wrap;
}

function init() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'fb-trigger';
  btn.textContent = 'Feedback';
  document.body.appendChild(btn);

  const modal = buildModal();
  const textarea = modal.querySelector('#fb-message');
  const status = modal.querySelector('.fb-status');
  const submit = modal.querySelector('.fb-submit');
  const contextList = modal.querySelector('.fb-context-list');

  const renderContext = () => {
    const ctx = gatherContext();
    const ua = navigator.userAgent;
    const rows = [
      ['User-Agent', ua],
      ['URL', ctx.url],
      ['Viewport', ctx.viewport],
      ['Base hex', ctx.base],
      ['Light bg', ctx.lightBg],
      ['Dark bg', ctx.darkBg],
      ['Target', ctx.target],
      ['Light fg', ctx.lightFg],
      ['Dark fg', ctx.darkFg],
      ['Light ratio', ctx.lightRatio],
      ['Dark ratio', ctx.darkRatio],
    ];
    contextList.innerHTML = rows
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `<dt>${k}</dt><dd>${escapeHtml(String(v))}</dd>`)
      .join('');
  };

  const open = () => {
    modal.hidden = false;
    status.textContent = '';
    textarea.value = '';
    submit.disabled = false;
    submit.textContent = 'Send';
    renderContext();
    setTimeout(() => textarea.focus(), 0);
  };
  const close = () => { modal.hidden = true; btn.focus(); };

  btn.addEventListener('click', open);
  modal.addEventListener('click', (e) => {
    if (e.target.matches('[data-fb-close]')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (!modal.hidden && e.key === 'Escape') close();
  });

  submit.addEventListener('click', async () => {
    const message = textarea.value.trim();
    if (!message) {
      status.textContent = 'Please write something first.';
      return;
    }
    submit.disabled = true;
    submit.textContent = 'Sending…';
    status.textContent = '';
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context: gatherContext() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        status.textContent = data.error || `Error ${res.status}`;
        submit.disabled = false;
        submit.textContent = 'Send';
        return;
      }
      status.innerHTML = `Thanks! <a href="${data.url}" target="_blank" rel="noopener">View issue #${data.number}</a>`;
      submit.textContent = 'Sent';
    } catch (err) {
      status.textContent = 'Network error. Try again.';
      submit.disabled = false;
      submit.textContent = 'Send';
    }
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
