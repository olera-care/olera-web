const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');
function load(path, mocks, extra = {}) {
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, Error, Date, console, ...extra,
    require(name) { if (name === 'server-only') return {}; assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
}
(async () => {
  const db = { from(table) {
    let selected;
    // No insert/update/upsert/delete methods: any write fails this check.
    const query = {
      select(columns) { selected = columns; return query; }, not() { return query; },
      eq() { return query; }, in() { return query; }, order() { return query; }, limit() { return query; },
      then(resolve, reject) {
        const data = table === 'support_mailboxes'
          ? [{ id: 'box', email: 'support@example.com', encrypted_refresh_token: 'encrypted', gmail_history_id: '10' }]
          : selected === 'internal_date' ? [{ internal_date: '2026-08-14T00:00:00Z' }] : [{ gmail_message_id: 'old' }];
        return Promise.resolve({ data, error: null }).then(resolve, reject);
      },
    };
    return query;
  } };
  class GmailApiError extends Error {}
  const gmail = {
    GmailApiError, gmailAccessToken: async () => 'private-token',
    getGmailProfile: async () => ({ historyId: '99', messagesTotal: 100 }),
    listGmailHistory: async () => ({ history: [{ id: '11' }], nextPageToken: 'more' }),
    listGmailMessages: async (_token, _page, size, q) => {
      assert.equal(size, 20); assert.equal(q, 'newer_than:30d');
      return { messages: [{ id: 'new' }, { id: 'old' }] };
    },
    getGmailMessageSyncMetadata: async (_token, id) => ({ id, internalDate: '1788480000000' }),
  };
  const diagnostic = load('lib/support-email/diagnostics.server.ts', {
    './crypto.server': { decryptGmailToken: () => 'private-refresh' }, './gmail.server': gmail,
  });
  const result = await diagnostic.diagnoseSupportGmail(db);
  assert.equal(result.readOnly, true);
  assert.equal(result.mailboxes[0].recentSampleMissing, 1);
  assert.equal(result.mailboxes[0].recentSamples[0].stored, false);
  assert.equal(result.mailboxes[0].recentSamples[1].stored, true);
  assert.ok(!JSON.stringify(result).includes('private-'));
  let called = 0;
  const env = { CRON_SECRET: 'secret' };
  const route = load('app/api/cron/support-email-sync/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, options }) } },
    '@/lib/admin': { getServiceClient: () => db },
    '@/lib/crons/run': { withCronRun() { throw new Error('diagnostics must not write cron records'); } },
    '@/lib/support-email/sync.server': { syncSupportMailbox() { throw new Error('diagnostics must not run sync'); } },
    '@/lib/support-email/diagnostics.server': { diagnoseSupportGmail: async () => { called++; return result; } },
  }, { process: { env } });
  const req = auth => ({ headers: new Headers(auth ? { authorization: auth } : {}),
    nextUrl: new URL('https://preview.example/api/cron/support-email-sync?diagnostics=true') });
  assert.equal((await route.GET(req())).options.status, 401);
  assert.equal(called, 0);
  const response = await route.GET(req('Bearer secret'));
  assert.equal(response.body.readOnly, true);
  assert.equal(response.options.headers['Cache-Control'], 'no-store');
  assert.equal(called, 1);
  delete env.CRON_SECRET;
  assert.equal((await route.GET(req('Bearer undefined'))).options.status, 401);
  assert.equal(called, 1);
  let user = null;
  let admin = null;
  const adminRoute = load('app/api/admin/support-email/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, options }) } },
    '@/lib/admin': { getAuthUser: async () => user, getAdminUser: async () => admin,
      getServiceClient: () => db },
    '@/lib/support-email/sync.server': { syncSupportMailbox() { throw new Error('diagnostics must not run sync'); } },
    '@/lib/support-email/diagnostics.server': { diagnoseSupportGmail: async () => { called++; return result; } },
  });
  const adminRequest = { nextUrl: new URL('https://preview.example/api/admin/support-email?diagnostics=true') };
  assert.equal((await adminRoute.GET(adminRequest)).options.status, 401);
  user = { id: 'operator' };
  assert.equal((await adminRoute.GET(adminRequest)).options.status, 403);
  assert.equal(called, 1);
  admin = { id: 'admin' };
  const adminResponse = await adminRoute.GET(adminRequest);
  assert.equal(adminResponse.body.readOnly, true);
  assert.equal(adminResponse.options.headers['Cache-Control'], 'no-store');
  assert.equal(called, 2);
  console.log('Support diagnostics: read-only database/source probe, missing-mail comparison, secret exclusion, authorization, and no sync/cron writes pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
