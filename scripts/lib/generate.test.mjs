// node --test scripts/lib/*.test.mjs
//
// The generate path, driven end to end without a network, a key or macOS.
// fetch is stubbed, sips is stubbed, and the "image" is a real PNG header this
// repo builds itself — so every branch that matters is exercised here rather
// than discovered on a paid call: a refusal, a rate limit, a body with no
// image, and a model that returns the wrong canvas.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

import { apiKey, buildForm, callApi, REQUEST, SOURCE, MASTER } from './request.mjs';
import { pngSize } from './png.mjs';
import { CROPS, cropBox, THUMBS, renditionPlan, sipsCrop, sipsThumb } from './renditions.mjs';
import { reviewSheet } from './sheet.mjs';
import { loadScene, assemblePrompt } from './scene.mjs';
import { cmdGenerate } from './generate.mjs';

// --- a real PNG, so the header reader is tested against bytes not a mock ----

const crc = (buf) => {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
};

/** A minimal but genuinely valid 1×1-content PNG declaring w×h. */
function png(w, h) {
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 0;
  const raw = Buffer.alloc((w + 1) * h);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const ok = (buf) => ({
  ok: true,
  status: 200,
  json: async () => ({ data: [{ b64_json: buf.toString('base64') }] }),
});
const fail = (status, body) => ({
  ok: false,
  status,
  text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
});

// --- the PNG reader --------------------------------------------------------

test('pngSize reads the canvas out of real PNG bytes', () => {
  assert.deepEqual(pngSize(png(1472, 1104)), { width: 1472, height: 1104 });
});

test('pngSize refuses anything that is not a PNG', () => {
  assert.throws(() => pngSize(Buffer.from('GIF89a and then some padding bytes')), /signature/);
  assert.throws(() => pngSize(Buffer.alloc(4)), /too short/);
  assert.throws(() => pngSize('not even a buffer'), /too short/);
});

// --- the key ---------------------------------------------------------------

test('apiKey reads only OPENAI_API_KEY', () => {
  assert.equal(apiKey({ OPENAI_API_KEY: 'sk-test' }), 'sk-test');
});

test('a missing key fails with the --env-file instruction, not a stack trace', () => {
  assert.throws(() => apiKey({}), /--env-file=\.env\.local/);
});

test('the error for a missing key does not echo the environment', () => {
  try {
    apiKey({ SOME_OTHER_SECRET: 'hunter2' });
    assert.fail('should have thrown');
  } catch (e) {
    assert.doesNotMatch(e.message, /hunter2|SOME_OTHER_SECRET/);
  }
});

// --- the multipart body ----------------------------------------------------

const scene = loadScene('door-sound-03-name');
const stubRead = (p) => Buffer.from(`bytes of ${path.basename(p)}`);

test('every reference is appended as image[], in declared order', () => {
  const form = buildForm(scene, 'PROMPT', stubRead);
  const names = form.getAll('image[]').map((f) => f.name);
  assert.deepEqual(names, [
    'trainer-reference.jpg',
    'lucy-reference.jpg',
    'door-sound-02-self.png',
  ]);
  assert.deepEqual(names, scene.references.map((r) => path.basename(r.path)));
});

test('jpg and png references get the right content type', () => {
  const files = buildForm(scene, 'PROMPT', stubRead).getAll('image[]');
  assert.equal(files[0].type, 'image/jpeg');
  assert.equal(files[2].type, 'image/png');
});

test('the body carries the documented parameters and the prompt', () => {
  const form = buildForm(scene, 'PROMPT TEXT', stubRead);
  assert.equal(form.get('model'), 'gpt-image-2');
  assert.equal(form.get('size'), `${SOURCE.width}x${SOURCE.height}`);
  assert.equal(form.get('prompt'), 'PROMPT TEXT');
  assert.equal(form.has('input_fidelity'), false);
});

test('the body carries no credential of any kind', () => {
  const form = buildForm(scene, assemblePrompt(scene), stubRead);
  for (const k of [...form.keys()]) {
    assert.doesNotMatch(k, /key|auth|token|secret/i, `unexpected field "${k}"`);
  }
});

test('more references than the API takes is refused before sending', () => {
  const many = { ...scene, references: Array.from({ length: 17 }, (_, i) => ({ ...scene.references[0], order: i + 1 })) };
  assert.throws(() => buildForm(many, 'P', stubRead), /at most 16/);
});

// --- the call --------------------------------------------------------------

test('a 200 yields the decoded PNG bytes', async () => {
  const buf = png(1472, 1104);
  const got = await callApi({ form: new FormData(), key: 'k', fetchImpl: async () => ok(buf) });
  assert.deepEqual(pngSize(got), { width: 1472, height: 1104 });
});

test('the key travels in the Authorization header and nowhere else', async () => {
  let seen;
  await callApi({
    form: new FormData(),
    key: 'sk-secret',
    fetchImpl: async (url, init) => {
      seen = { url, init };
      return ok(png(8, 6));
    },
  });
  assert.equal(seen.url, REQUEST.endpoint);
  assert.equal(seen.init.headers.Authorization, 'Bearer sk-secret');
  assert.equal(Object.keys(seen.init.headers).length, 1);
});

test('a 400 throws with the API\'s own message, and nothing of the request', async () => {
  await assert.rejects(
    () =>
      callApi({
        form: new FormData(),
        key: 'sk-secret',
        fetchImpl: async () => fail(400, { error: { message: 'your prompt was rejected' } }),
      }),
    (e) => {
      assert.match(e.message, /400: your prompt was rejected/);
      assert.doesNotMatch(e.message, /sk-secret|Bearer|Authorization/);
      return true;
    }
  );
});

test('a non-JSON error body is still reported rather than swallowed', async () => {
  await assert.rejects(
    () => callApi({ form: new FormData(), key: 'k', fetchImpl: async () => fail(502, '<html>bad gateway</html>') }),
    /502: <html>bad gateway<\/html>/
  );
});

test('a 429 is retried once, then succeeds', async () => {
  let calls = 0;
  const buf = png(1472, 1104);
  const got = await callApi({
    form: new FormData(),
    key: 'k',
    sleep: async () => {},
    fetchImpl: async () => (++calls === 1 ? fail(429, { error: { message: 'slow down' } }) : ok(buf)),
  });
  assert.equal(calls, 2);
  assert.deepEqual(pngSize(got), { width: 1472, height: 1104 });
});

test('a 400 is not retried — it would just be charged twice', async () => {
  let calls = 0;
  await assert.rejects(() =>
    callApi({
      form: new FormData(),
      key: 'k',
      sleep: async () => {},
      fetchImpl: async () => {
        calls++;
        return fail(400, { error: { message: 'no' } });
      },
    })
  );
  assert.equal(calls, 1);
});

test('a 200 with no image is an error, not an empty file', async () => {
  await assert.rejects(
    () =>
      callApi({
        form: new FormData(),
        key: 'k',
        fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ data: [] }) }),
      }),
    /no image in data\[0\]\.b64_json/
  );
});

// --- the renditions --------------------------------------------------------

test('every crop and both thumbnails are planned, thumbs after the square', () => {
  const plan = renditionPlan('m.png', 'crops', 'sc', MASTER.width, MASTER.height);
  assert.equal(plan.length, CROPS.length + THUMBS.length);
  const squareAt = plan.findIndex((r) => r.name === 'square');
  for (const t of THUMBS) {
    assert.ok(plan.findIndex((r) => r.name === `square-${t}`) > squareAt,
      'a thumbnail is cut from the square, so it must come after it');
  }
});

test('thumbnails are cut from the square crop, not from the master', () => {
  const plan = renditionPlan('m.png', 'crops', 'sc', MASTER.width, MASTER.height);
  const square = plan.find((r) => r.name === 'square');
  for (const t of THUMBS) {
    const thumb = plan.find((r) => r.name === `square-${t}`);
    assert.ok(thumb.argv.includes(square.path), `${t}px must resample ${square.path}`);
    assert.ok(!thumb.argv.includes('m.png'));
  }
});

test('the 21:9 and square crops fit inside the master', () => {
  for (const c of CROPS) {
    const b = cropBox(c, MASTER.width, MASTER.height);
    assert.ok(b.w <= MASTER.width && b.h <= MASTER.height, `${c.name} would be padded, not cropped`);
    assert.ok(b.top >= 0 && b.left >= 0);
  }
});

test('sips argv puts height before width, in both builders', () => {
  assert.deepEqual(sipsThumb('a.png', 'b.png', 56).slice(1, 4), ['--resampleHeightWidth', '56', '56']);
  const c = sipsCrop('a.png', 'b.png', { w: 100, h: 50, top: 3, left: 7 });
  assert.deepEqual(c.slice(2, 8), ['--cropToHeightWidth', '50', '100', '--cropOffset', '3', '7']);
});

// --- the sheet -------------------------------------------------------------

test('the sheet states what has to be true and renders thumbs at true size', () => {
  const out = { round: 3, master: 'art/pilot/restyle/round-03/sc.png' };
  const plan = renditionPlan(out.master, 'crops', 'sc', MASTER.width, MASTER.height);
  const html = reviewSheet(scene, out, plan);
  assert.match(html, /Must be true/);
  assert.ok(html.includes(scene.mustBeTrue.slice(0, 40)));
  assert.match(html, /width="84" height="84"/);
  assert.match(html, /width="56" height="56"/);
  assert.match(html, /approval is a human step/);
});

test('the sheet escapes scene text rather than pasting it into markup', () => {
  const nasty = { ...scene, title: 'a <script>alert(1)</script> title', mustBeTrue: 'x & y' };
  const html = reviewSheet(nasty, { round: 1, master: 'm.png' }, []);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /x &amp; y/);
});

test('the sheet names no credential and no absolute path', () => {
  const out = { round: 1, master: 'art/pilot/restyle/round-01/sc.png' };
  const html = reviewSheet(scene, out, renditionPlan(out.master, 'crops', 'sc', 1448, 1086));
  assert.doesNotMatch(html, /api[_-]?key|bearer|sk-/i);
  assert.doesNotMatch(html, new RegExp(os.homedir().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

// --- the whole run, on Linux, with no network and no sips ------------------

/**
 * Run with a throwaway key in the environment, then put it back.
 *
 * The key is deliberately NOT an injected option: request.mjs is the only
 * module allowed to reach process.env, and request.test.mjs asserts that. So
 * the tests set the variable rather than routing around it.
 */
async function withKey(key, fn) {
  const before = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = key;
  try {
    return await fn();
  } finally {
    if (before === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = before;
  }
}

const run = (id, argv, opts, key = 'sk-test') =>
  withKey(key, () => cmdGenerate(id, argv, opts));

/**
 * A run in a temp directory. `sips` is stubbed to produce a real PNG at the
 * size its argv asks for, so the orchestrator's own dimension checks are
 * exercised rather than bypassed.
 */
function harness({ returns = png(SOURCE.width, SOURCE.height), status = 200 } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-'));
  const lines = [];
  const calls = [];
  return {
    dir,
    lines,
    calls,
    opts: {
      outBase: dir,
      restyleDir: path.join(dir, 'art/pilot/restyle'),
      log: (...a) => lines.push(a.join(' ')),
      fetchImpl: async () => (status === 200 ? ok(returns) : fail(status, { error: { message: 'no' } })),
      sips: (argv) => {
        calls.push(argv);
        const out = argv[argv.indexOf('--out') + 1];
        // Both builders put HEIGHT then WIDTH after their verb.
        const at = argv.findIndex((a) => a === '--resampleHeightWidth' || a === '--cropToHeightWidth');
        const [h, w] = [Number(argv[at + 1]), Number(argv[at + 2])];
        fs.mkdirSync(path.dirname(path.resolve(dir, out)), { recursive: true });
        fs.writeFileSync(path.resolve(dir, out), png(w, h));
      },
    },
  };
}

test('a full run writes raw, master, every rendition, a sheet and a manifest', async () => {
  const h = harness();
  const res = await run('door-sound-03-name', ['--yes'], h.opts);
  assert.equal(res.sent, true);
  assert.equal(res.round, 1, 'the restyle counter starts at 1');

  const at = (p) => path.join(h.dir, p);
  assert.deepEqual(pngSize(fs.readFileSync(at(res.out.raw))), SOURCE, 'raw is kept as returned');
  assert.deepEqual(pngSize(fs.readFileSync(at(res.out.master))), MASTER);
  assert.ok(fs.existsSync(at(res.out.sheet)));

  for (const r of res.renditions) assert.ok(fs.existsSync(at(r.path)), `${r.name} missing`);
  assert.equal(fs.readdirSync(at(res.out.crops)).length, CROPS.length + THUMBS.length);
});

test('the manifest records the run and is still not approved', async () => {
  const h = harness();
  const res = await run('door-sound-03-name', ['--yes'], h.opts);
  const m = JSON.parse(fs.readFileSync(path.join(h.dir, res.out.manifest), 'utf8'));
  assert.equal(m.approved, false);
  assert.equal(m.briefId, 'cool-flat-v1');
  assert.equal(m.output.rawSize, '1472x1104');
  assert.equal(m.generatedAt, res.generatedAt);
  assert.match(m.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('nothing is written outside the round directory', async () => {
  const h = harness();
  const res = await run('door-sound-03-name', ['--yes'], h.opts);
  const walk = (d, acc = []) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      e.isDirectory() ? walk(p, acc) : acc.push(path.relative(h.dir, p));
    }
    return acc;
  };
  for (const f of walk(h.dir)) {
    assert.ok(f.startsWith(res.out.dir + path.sep), `${f} escaped the round directory`);
    assert.doesNotMatch(f, /(^|\/)(img|approved)(\/|$)/);
  }
});

test('without --yes it neither calls the API nor writes anything', async () => {
  const h = harness();
  let called = false;
  const res = await run('door-sound-03-name', [], {
    ...h.opts,
    fetchImpl: async () => {
      called = true;
      throw new Error('must not be reached');
    },
  });
  assert.equal(res.sent, false);
  assert.equal(called, false);
  assert.equal(fs.existsSync(path.join(h.dir, 'art')), false);
  assert.ok(h.lines.join('\n').includes('This spends money'));
});

test('an existing round is refused rather than overwritten', async () => {
  const h = harness();
  await run('door-sound-03-name', ['--yes'], h.opts);
  // Round 1 now exists, so the next run takes round 2 — and if something
  // rewinds the counter, it must refuse rather than clobber.
  const second = await run('door-sound-03-name', ['--yes'], h.opts);
  assert.equal(second.round, 2);
  await assert.rejects(
    () => run('door-sound-03-name', ['--yes'], { ...h.opts, restyleDir: path.join(h.dir, 'nowhere') }),
    /already exists — refusing to overwrite/
  );
});

test('a wrong canvas keeps the raw file but refuses to make a master', async () => {
  const h = harness({ returns: png(1536, 1024) });
  await assert.rejects(
    () => run('door-sound-03-name', ['--yes'], h.opts),
    /returned 1536×1024, not the 1472×1104/
  );
  const raw = path.join(h.dir, 'art/pilot/restyle/round-01/raw/door-sound-03-name.png');
  assert.ok(fs.existsSync(raw), 'the raw result must be kept for inspection');
  assert.equal(fs.existsSync(path.join(h.dir, 'art/pilot/restyle/round-01/door-sound-03-name.png')), false);
  assert.equal(h.calls.length, 0, 'sips must not run on a wrong-ratio result');
});

test('an API failure writes nothing at all', async () => {
  const h = harness({ status: 400 });
  await assert.rejects(() => run('door-sound-03-name', ['--yes'], h.opts), /400/);
  assert.equal(fs.existsSync(path.join(h.dir, 'art')), false);
});

test('the run prints and writes no credential, even when one is set', async () => {
  const h = harness();
  const res = await run('door-sound-03-name', ['--yes'], h.opts, 'sk-must-not-appear');
  const written = [res.out.sheet, res.out.manifest]
    .map((p) => fs.readFileSync(path.join(h.dir, p), 'utf8'))
    .join('\n');
  assert.doesNotMatch(h.lines.join('\n'), /sk-must-not-appear/);
  assert.doesNotMatch(written, /sk-must-not-appear/);
});
