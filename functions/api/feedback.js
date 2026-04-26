// Cloudflare Pages Function: POST /api/feedback
// Creates a GitHub issue labelled "feedback" using a server-side PAT.
// Required env (set in Pages dashboard):
//   GITHUB_TOKEN  fine-grained PAT, Issues: Read+Write, scoped to one repo
//   GITHUB_REPO   "owner/name"
// Optional:
//   TURNSTILE_SECRET  if set, requires a valid cf-turnstile-response token

const MAX_MESSAGE = 4000;
const MAX_CONTEXT = 2000;

export async function onRequestPost(ctx) {
  const { request, env } = ctx;

  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    return json({ error: 'Server not configured' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const message = String(body.message || '').trim();
  const contextStr = body.context ? JSON.stringify(body.context, null, 2).slice(0, MAX_CONTEXT) : '';
  const turnstileToken = body.turnstileToken;

  if (!message) return json({ error: 'Message required' }, 400);
  if (message.length > MAX_MESSAGE) return json({ error: 'Message too long' }, 400);

  if (env.TURNSTILE_SECRET) {
    const ok = await verifyTurnstile(env.TURNSTILE_SECRET, turnstileToken, request.headers.get('cf-connecting-ip'));
    if (!ok) return json({ error: 'Captcha failed' }, 403);
  }

  const ua = request.headers.get('user-agent') || 'unknown';
  const title = `[Feedback] ${message.split('\n')[0].slice(0, 80)}`;
  const issueBody = [
    message,
    '',
    '---',
    '<details><summary>Context</summary>',
    '',
    '```',
    `User-Agent: ${ua}`,
    contextStr,
    '```',
    '',
    '</details>',
  ].join('\n');

  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'wcag-colour-finder-feedback',
    },
    body: JSON.stringify({ title, body: issueBody, labels: ['feedback'] }),
  });

  if (!res.ok) {
    const text = await res.text();
    return json({ error: 'GitHub API error', detail: text.slice(0, 500) }, 502);
  }

  const issue = await res.json();
  return json({ url: issue.html_url, number: issue.number });
}

async function verifyTurnstile(secret, token, ip) {
  if (!token) return false;
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  return Boolean(data.success);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
