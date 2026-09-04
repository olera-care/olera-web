// Exercise the real Gmail transport with synthetic HTTP responses and a fake
// clock. No credentials, live requests, mailbox changes, or real sleeps.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');
const compiled = ts.transpileModule(readFileSync('lib/support-email/gmail.server.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function fixture(responses) {
  let now = Date.parse('2026-09-04T09:00:00Z');
  const calls = [], delays = [], timeouts = [], exports = {};
  class Clock extends Date { static now() { return now; } }
  runInNewContext(compiled, {
    exports, URLSearchParams, Error, Date: Clock, Math: Object.assign(Object.create(Math), { random: () => 0.5 }),
    require(name) { assert.equal(name, 'server-only'); return {}; },
    AbortSignal: { timeout(ms) { timeouts.push(ms); return {}; } },
    setTimeout(fn, ms) { delays.push(ms); now += ms; fn(); },
    fetch: async (url, init) => {
      calls.push({ url, method: init.method ?? 'GET' });
      assert.ok(responses.length, 'unexpected extra request');
      const next = responses.shift();
      now += next.elapsed ?? 0;
      if (next.error) throw next.error;
      return new Response(JSON.stringify(next.body ?? { historyId: '100' }), {
        status: next.status ?? 200, headers: next.headers,
      });
    },
  });
  return { api: exports, calls, delays, timeouts };
}
const limited = reason => ({ status: 403, body: { error: { errors: [{ reason }] } } });
(async () => {
  for (const reason of ['rateLimitExceeded', 'userRateLimitExceeded']) {
    const f = fixture([limited(reason), {}]);
    assert.equal((await f.api.getGmailProfile('synthetic')).historyId, '100');
    assert.deepEqual(f.delays, [1500]);
  }
  for (const reason of ['dailyLimitExceeded', 'domainPolicy', 'insufficientPermissions']) {
    const f = fixture([limited(reason)]);
    await assert.rejects(() => f.api.getGmailProfile('synthetic'), error =>
      error.status === 403 && error.message.includes(reason) && error.message.includes('HTTP 403'));
    assert.equal(f.calls.length, 1, 'permission/daily quota errors must not be retried');
  }
  let f = fixture([{ status: 429, headers: { 'Retry-After': '10' } }, {}]);
  await f.api.getGmailProfile('synthetic');
  assert.deepEqual(f.delays, [10000]);

  f = fixture([{ status: 503, headers: { 'Retry-After': 'Fri, 04 Sep 2026 09:00:08 GMT' } }, {}]);
  await f.api.getGmailProfile('synthetic');
  assert.deepEqual(f.delays, [8000]);

  f = fixture([{ status: 429, headers: { 'Retry-After': '120' } }]);
  await assert.rejects(() => f.api.getGmailProfile('synthetic'), /HTTP 429/);
  assert.equal(f.calls.length, 1, 'never retry earlier than a long Retry-After');
  assert.equal(f.delays.length, 0, 'long cooldown must not occupy the worker');

  f = fixture([{ status: 500 }, { status: 502 }, { status: 503 }, {}]);
  await f.api.getGmailProfile('synthetic');
  assert.deepEqual(f.delays, [1500, 2500, 4500]);

  f = fixture(Array.from({ length: 4 }, () => ({ status: 503 })));
  await assert.rejects(() => f.api.getGmailProfile('synthetic'), /HTTP 503/);
  assert.equal(f.calls.length, 4);

  f = fixture([{ error: new Error('network unavailable'), elapsed: 30000 },
    { error: new Error('network unavailable'), elapsed: 28500 }]);
  await assert.rejects(() => f.api.getGmailProfile('synthetic'), /network unavailable/);
  assert.deepEqual(f.timeouts, [30000, 28500], 'network retries share one bounded window');

  f = fixture([{ status: 503 }]);
  await assert.rejects(() => f.api.watchGmail('synthetic', 'topic'), /HTTP 503/);
  assert.equal(f.calls.length, 1, 'mutating requests must not be automatically replayed');

  f = fixture([{ status: 400, body: { error: { message: 'private body or token', errors: [{ reason: 'badRequest' }] } } }]);
  await assert.rejects(() => f.api.getGmailProfile('synthetic'), error =>
    error.message.includes('badRequest') && !error.message.includes('private body'));
  console.log('Gmail transport: rate-limit recovery, permissions, Retry-After, bounded backoff, network deadline, no write replay, and safe diagnostics pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
