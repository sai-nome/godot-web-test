import { mkdir, readFile, readdir, writeFile, copyFile } from 'node:fs/promises';
import { gzipSync, gunzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
const source = 'build/web';
const output = 'dist';
const files = await readdir(source);
for (const name of ['index.html', 'index.js', 'index.pck', 'index.wasm']) assert.ok(files.includes(name), 'Missing export: ' + name);
await mkdir(output, { recursive: true });
const allowed = new Set([...files, '_headers', '.gdignore']);
for (const name of await readdir(output)) assert.ok(allowed.has(name), 'Stale output detected; use a fresh dist directory: ' + name);
for (const name of files) {
  assert.ok(/^index[.][a-z0-9._-]+$/i.test(name), 'Unexpected export file: ' + name);
  if (name.endsWith('.wasm')) {
    const original = await readFile(source + '/' + name);
    const compressed = gzipSync(original, { level: 9 });
    assert.ok(gunzipSync(compressed).equals(original), 'gzip round-trip failed');
    await writeFile(output + '/' + name, compressed);
    console.log(name + ': ' + original.length + ' -> ' + compressed.length + ' bytes (gzip)');
  } else await copyFile(source + '/' + name, output + '/' + name);
}
// Keep the .wasm URL unchanged. Browsers decode gzip before WebAssembly sees it.
// worker/index.js returns these bytes with Content-Encoding: gzip and encodeBody: manual.
await writeFile(output + '/_headers', '/*\n  X-Content-Type-Options: nosniff\n');
await import('./check-assets.mjs');
