// A disposable PostgreSQL cluster, bound to localhost. Never reads application env files.
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'node:net';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const directory = await mkdtemp(join(tmpdir(), 'bogbes-crm-test-'));
const dataDir = join(directory, 'data');
const bin = (name) => process.env.PG_TEST_BIN ? join(process.env.PG_TEST_BIN, name) : name;
async function run(command, args, input) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(bin(command), args, { windowsHide: true, shell: false });
    let output = ''; let errors = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { errors += chunk; });
    child.on('error', reject);
    // pg_ctl's child server can inherit pipe handles on Windows after pg_ctl exits.
    child.on(command === 'pg_ctl' ? 'exit' : 'close', code => code === 0 ? resolvePromise(output.trim()) : reject(new Error(errors || output)));
    child.stdin.end(input);
  });
}
const port = await new Promise((resolvePort, reject) => {
  const server = createServer();
  server.on('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const value = server.address().port;
    server.close(() => resolvePort(value));
  });
});
const args = ['-X', '-h', '127.0.0.1', '-p', String(port), '-U', 'crm_test', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-Atq'];
const sql = (text) => run('psql', args, text);
const file = async (path) => sql(await readFile(join(root, path), 'utf8'));
const actor = "SET ROLE authenticated; SET request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000001';";
let started = false;
try {
  await run('initdb', ['-D', dataDir, '-A', 'trust', '-U', 'crm_test', '--encoding=UTF8', '--no-locale']);
  await run('pg_ctl', ['-D', dataDir, '-l', join(directory, 'postgres.log'), '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start']);
  started = true;
  await file('supabase/tests/fixtures/crm-baseline.sql');
  for (const migration of ['027_prospect_crm_pipeline.sql', '028_crm_traceability.sql', '029_crm_duplicate_view.sql']) {
    await file(`supabase/migrations/${migration}`);
  }
  const migration = 'supabase/migrations/031_crm_atomic_operations.sql';
  if (!process.argv.includes('--baseline-only')) {
    try { await access(join(root, migration)); await file(migration); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (!process.argv.includes('--baseline-only')) await file('supabase/migrations/032_crm_catalogue_indexes.sql');
  assert.equal(await sql("SELECT to_regprocedure('public.crm_validate_request(text,uuid,text,text)') IS NOT NULL"), 't', 'Atomic validation RPC must exist');
  await file('supabase/tests/crm_atomic_operations.sql');
  const validation = `${actor} SELECT public.crm_validate_request('reservation', 'cccccccc-0000-4000-8000-000000000003', 'approve', null);`;
  const outcomes = await Promise.allSettled([sql(validation), sql(validation)]);
  assert.equal(outcomes.filter(r => r.status === 'fulfilled').length, 1, 'Only one concurrent validation may win');
  assert.equal(await sql("SELECT count(*) FROM crm_events WHERE entity_id='cccccccc-0000-4000-8000-000000000003' AND event_type='validation_changed'"), '1');
  console.log('CRM SQL: permissions, rollback, history, idempotency and concurrent validation passed.');
} finally {
  if (started) await run('pg_ctl', ['-D', dataDir, '-m', 'fast', '-w', 'stop']);
  // Keep the isolated test log for diagnosis; do not recursively delete paths through another shell.
  console.log(`Isolated PostgreSQL stopped. Test files: ${directory}`);
}
