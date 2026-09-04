// Exercise the real inbox component against a synthetic API, including slow
// requests and connection loss. No server or live support data is used.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

(async () => {
  const { Window } = await import('happy-dom');
  const window = new Window({ url: 'http://localhost/admin/support-email' });
  global.window = window;
  global.document = window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  const React = require('react');
  const { createRoot } = require('react-dom/client');
  const thread = { id: 'thread', participants: ['sender@example.com'], subject: 'Synthetic support question',
    snippet: 'Synthetic preview', state: 'needs_reply', category: 'other', priority: 'normal',
    last_message_at: '2026-09-04T00:00:00Z', unread: false };
  const payload = { mailboxes: [{ id: 'mailbox', sync_status: 'connected', full_sync_complete: true }], threads: [thread], total: 899 };
  let fetchCount = 0;
  let respond = async () => ({ ok: true, json: async () => payload });
  let poll;
  const exports = {};
  const code = ts.transpileModule(readFileSync('app/admin/support-email/page.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(code, {
    exports, Error, window, document, URLSearchParams, AbortSignal, console, setTimeout, clearTimeout,
    setInterval(fn) { poll = fn; return 1; }, clearInterval() { poll = null; },
    fetch: async (...args) => { fetchCount++; return respond(...args); },
    require(name) {
      if (name === 'react' || name === 'react/jsx-runtime') return require(name);
      if (name === 'next/link') return { default: ({ prefetch, ...props }) => React.createElement('a', props), __esModule: true };
      if (name === '@/components/admin/AdminWorkspace') return { default: ({ children }) => children, __esModule: true };
      if (name === 'lucide-react') return new Proxy({}, { get: () => () => null });
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  await React.act(async () => { root.render(React.createElement(exports.default)); });
  assert.match(container.textContent, /899 conversations/);

  respond = async () => { throw new Error('Connection lost'); };
  await React.act(async () => { poll(); });
  assert.match(container.textContent, /Synthetic support question/);
  assert.match(container.textContent, /899 conversations/);
  assert.match(container.textContent, /retrying automatically/);
  assert.doesNotMatch(container.textContent, /Nothing here/);

  let release;
  respond = () => new Promise(resolve => { release = resolve; });
  const before = fetchCount;
  await React.act(async () => { poll(); });
  await React.act(async () => { poll(); poll(); });
  assert.equal(fetchCount, before + 1, 'background polls must not supersede slow requests');
  await React.act(async () => { release({ ok: true, json: async () => ({ ...payload, total: 900 }) }); });
  assert.match(container.textContent, /900 conversations/);
  assert.doesNotMatch(container.textContent, /retrying automatically/);

  // A failed action remains visible even after a successful background poll.
  respond = async (_url, options) => options?.method === 'POST'
    ? { ok: false, json: async () => ({ error: 'Synthetic sync failure' }) }
    : { ok: true, json: async () => payload };
  await React.act(async () => {
    [...container.querySelectorAll('button')].find(button => button.textContent === 'Sync').click();
  });
  assert.match(container.textContent, /Synthetic sync failure/);
  await React.act(async () => { poll(); });
  assert.match(container.textContent, /Synthetic sync failure/, 'polling must not erase action errors');

  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
  const hiddenCount = fetchCount;
  await React.act(async () => { poll(); });
  assert.equal(fetchCount, hiddenCount);
  await React.act(async () => { root.unmount(); });
  assert.equal(poll, null);
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  respond = async () => { throw new Error('Initial connection lost'); };
  const retryRoot = createRoot(container);
  await React.act(async () => { retryRoot.render(React.createElement(exports.default)); });
  assert.match(container.textContent, /Initial connection lost/);
  assert.doesNotMatch(container.textContent, /Connect the Olera support mailbox/);
  respond = async () => ({ ok: true, json: async () => payload });
  await React.act(async () => { poll(); });
  assert.match(container.textContent, /899 conversations/);
  assert.doesNotMatch(container.textContent, /Initial connection lost/);
  await React.act(async () => { retryRoot.unmount(); });
  await window.happyDOM.close();
  console.log('Support polling: preserves rows on failure, recovers counts, waits for slow requests, retains action errors, pauses when hidden, cleans up.');
})().catch(error => { console.error(error); process.exitCode = 1; });
