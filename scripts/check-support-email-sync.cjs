// Regression checks run the real worker with in-memory Gmail and Supabase.
// No live credentials, mailbox writes, or outbound email are used.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');
const compiled = ts.transpileModule(readFileSync('lib/support-email/sync.server.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const ACTIVE = '__olera_support_sync_active__';

function fixture({ pages = [], failAt = -1, failCursor = null, stepMs = 0, mailbox = {}, tables = {} } = {}) {
  let now = Date.now();
  const row = {
    id: 'mailbox', email: 'support@example.com', encrypted_refresh_token: 'encrypted',
    gmail_history_id: '10', full_sync_complete: true, full_sync_messages_imported: 100,
    sync_status: 'backfilling', last_error: null, updated_at: new Date(now - 600_000).toISOString(),
    ...mailbox,
  };
  const calls = [], checkpoints = [], messageIds = [];
  const db = { from(table) {
    let payload = null;
    const filters = [];
    const q = {
      select() { return q; }, update(value) { payload = value; return q; },
      eq(key, value) { filters.push([key, value]); return q; },
      in(key, values) { filters.push([key, values]); return q; }, order() { return q; }, limit() { return q; },
      single() { return q; }, maybeSingle() { return q; },
      then(resolve, reject) {
        try {
          if (table !== 'support_mailboxes') {
            const selected = (tables[table] ?? []).filter(item => filters.every(([key, value]) =>
              Array.isArray(value) ? value.includes(item[key]) : item[key] === value));
            if (payload) selected.forEach(item => Object.assign(item, payload));
            return Promise.resolve({ data: selected.map(item => ({ ...item })), error: null }).then(resolve, reject);
          }
          if (!filters.every(([key, value]) => row[key] === value)) return Promise.resolve({ data: null, error: null }).then(resolve, reject);
          if (payload?.gmail_history_id === failCursor) return Promise.resolve({ data: null, error: new Error('checkpoint failed') }).then(resolve, reject);
          if (payload) {
            Object.assign(row, payload);
            if (payload.gmail_history_id) checkpoints.push({ ...row });
          }
          return Promise.resolve({ data: { ...row }, error: null }).then(resolve, reject);
        } catch (error) { return Promise.reject(error).then(resolve, reject); }
      },
    };
    return q;
  } };
  class GmailApiError extends Error { constructor(message, status) { super(message); this.status = status; } }
  const gmail = {
    GmailApiError,
    gmailAccessToken: async () => 'access',
    listGmailHistory: async (_access, cursor, _token, size) => {
      assert.equal(row.last_error, ACTIVE, 'lease must survive every history checkpoint');
      calls.push({ cursor, size });
      now += stepMs;
      if (calls.length - 1 === failAt) throw new Error('Gmail unavailable');
      const page = pages[calls.length - 1];
      if (page instanceof Error) throw page;
      return page ?? { historyId: cursor };
    },
    getGmailMessage: async (_access, id) => { messageIds.push(id); return { labelIds: ['DRAFT'] }; },
    getGmailProfile: async () => ({ historyId: '500' }),
    listGmailMessages: async () => {
      assert.equal(row.last_error, ACTIVE, 'lease must survive cursor-expiry reset');
      return { messages: [] };
    },
  };
  class Clock extends Date { static now() { return now; } }
  const exports = {};
  runInNewContext(compiled, {
    exports, Error, Date: Clock, process: { env: {} }, console: { log() {}, warn() {}, error() {} },
    require(name) {
      if (name === 'server-only') return {};
      if (name === './crypto.server') return { decryptGmailToken: () => 'refresh' };
      if (name === './gmail.server') return gmail;
      if (name === './classify.server') return {};
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return { run: () => exports.syncSupportMailbox(db, { ...row }), row, calls, checkpoints, messageIds, GmailApiError, pages, gmail };
}

(async () => {
  let f = fixture({ pages: [
    { history: [{ id: '11' }, { id: '12' }], nextPageToken: 'more', historyId: '99' },
    { history: [{ id: '13' }], historyId: '99' },
  ] });
  let result = await f.run();
  assert.equal(result.history.chunks, 2);
  assert.deepEqual(f.calls.map(x => x.cursor), ['10', '12']);
  assert.equal(f.row.gmail_history_id, '99');
  assert.equal(f.row.sync_status, 'connected');
  assert.equal(f.row.last_error, null);
  assert.ok(f.checkpoints.every(x => x.last_error === ACTIVE));

  f = fixture({ pages: [{ history: [{ id: '11' }], nextPageToken: 'more', historyId: '99' }], failAt: 1 });
  await assert.rejects(f.run, /Gmail unavailable/);
  assert.equal(f.row.gmail_history_id, '11', 'failed chunk must retain previous checkpoint');
  assert.equal(f.row.sync_status, 'error');
  assert.equal(f.row.last_error, 'Gmail unavailable');

  f = fixture({ pages: [{ history: [{ id: '11' }], historyId: '99' }], failCursor: '99' });
  await assert.rejects(f.run, /checkpoint failed/);
  assert.equal(f.row.gmail_history_id, '10', 'failed persistence cannot advance cursor');

  f = fixture({ stepMs: 181_000, pages: [{ history: [{ id: '11' }], nextPageToken: 'more', historyId: '99' }] });
  result = await f.run();
  assert.equal(f.calls.length, 1, 'time budget stops further chunks');
  assert.equal(f.row.gmail_history_id, '11');
  assert.equal(result.history.hasMore, true);
  assert.equal(f.row.sync_status, 'backfilling');
  assert.equal(f.row.last_error, null, 'partial catch-up releases lease');

  f = fixture({ mailbox: { last_error: ACTIVE, updated_at: new Date().toISOString() } });
  assert.equal((await f.run()).skipped, 'already_syncing');
  assert.equal(f.calls.length, 0);
  f = fixture({ mailbox: { last_error: ACTIVE } });
  assert.equal((await f.run()).history.hasMore, false, 'expired lease is reclaimable');

  // 100-message budget must stop BEFORE the second record; the first cursor
  // cannot jump to page.historyId even when Gmail has no additional API page.
  const record = (id, size, offset = 0) => ({ id, messagesAdded: Array.from({ length: size }, (_, i) => ({ message: { id: `m${offset + i}` } })) });
  f = fixture({ pages: [
    { history: [record('11', 60), record('12', 60, 60)], historyId: '99' },
    { history: [record('12', 60, 60)], historyId: '99' },
  ] });
  result = await f.run();
  assert.deepEqual(f.calls.map(x => x.cursor), ['10', '11']);
  assert.equal(f.messageIds.length, 120);
  assert.equal(new Set(f.messageIds).size, 120, 'all truncated-page messages are processed');

  f = fixture({ pages: [{ history: [record('11', 1400)], historyId: '99' }] });
  await f.run();
  assert.equal(f.messageIds.length, 1400, 'a single bulk record stays atomic');
  assert.equal(f.checkpoints.length, 1);

  f = fixture({ pages: [{ history: [], nextPageToken: 'more', historyId: '99' }] });
  await assert.rejects(f.run, /without advancing/);
  assert.equal(f.row.gmail_history_id, '10');

  f = fixture();
  f.pages.push(new f.GmailApiError('expired', 404));
  result = await f.run();
  assert.equal(result.history.restartedFullSync, true);
  assert.equal(f.row.gmail_history_id, '500');
  assert.equal(f.row.full_sync_messages_imported, 0);
  assert.equal(f.row.full_sync_complete, true, 'empty recovery scan completes in same worker');
  assert.equal(f.row.last_error, null);

  // Changes to the same message must retain their event order. Explicitly
  // marking a handled thread unread reopens it; merely reading it afterward
  // must not undo that operator intent.
  const message = { id: 'row', gmail_message_id: 'm1', thread_id: 'thread', mailbox_id: 'mailbox',
    gmail_label_ids: ['INBOX'], direction: 'in', internal_date: '2026-09-01T00:00:00Z' };
  const thread = { id: 'thread', gmail_label_ids: ['INBOX'], state: 'handled', last_message_at: message.internal_date };
  const unread = { id: '11', labelsAdded: [{ message: { id: 'm1' }, labelIds: ['UNREAD'] }] };
  const read = { id: '12', labelsRemoved: [{ message: { id: 'm1' }, labelIds: ['UNREAD'] }] };
  f = fixture({ pages: [{ history: [unread, read], historyId: '99' }, { history: [read], historyId: '99' }],
    tables: { support_email_messages: [message], support_email_threads: [thread] } });
  await f.run();
  assert.equal(thread.state, 'needs_reply', 'read-after-unread must retain the reopened state');
  assert.equal(thread.unread, false);

  // A rejected import must wait for its siblings before releasing the lease.
  f = fixture({ pages: [{ history: [record('11', 2)], historyId: '99' }] });
  let finishSibling;
  const sibling = new Promise(resolve => { finishSibling = resolve; });
  f.gmail.getGmailMessage = async (_token, id) => {
    if (id === 'm0') throw new Error('full payload failed');
    await sibling;
    return { labelIds: ['DRAFT'] };
  };
  f.gmail.getGmailMessageMetadata = async () => { throw new Error('metadata failed'); };
  const failedRun = assert.rejects(f.run, /metadata failed/);
  await new Promise(resolve => setImmediate(resolve));
  const leaseWhileSiblingPending = f.row.last_error;
  finishSibling();
  await failedRun;
  assert.equal(leaseWhileSiblingPending, ACTIVE, 'lease cannot be released while another import is pending');
  assert.equal(f.row.gmail_history_id, '10');

  console.log('Support sync: 12 regression scenarios passed (drain, checkpoints, budgets, leases, atomic records, cursor recovery, label order, failed concurrent imports).');
})().catch(error => { console.error(error); process.exitCode = 1; });
