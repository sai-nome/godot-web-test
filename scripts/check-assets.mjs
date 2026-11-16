import { readdir, stat, readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { gunzipSync } from 'node:zlib';
const limit = 25 * 1024 * 1024;
const files = [];
async function scan(dir) {
  for (const name of await readdir(dir)) {
    if (name === '.gdignore') continue;
    const file = dir + '/' + name;
    const info = await stat(file);
    assert.ok(info.isFile(), 'Unexpected subdirectory in export: ' + file);
    assert.ok(info.size <= limit, file + ' exceeds 25 MiB: ' + info.size);
    files.push({ file: file.slice(5), bytes: info.size, MiB: +(info.size / 1048576).toFixed(3) });
  }
}
await scan('dist');
assert.ok(files.length <= 20000, 'Exceeds Workers Free file count');
for (const file of ['index.html', 'index.js', 'index.pck', 'index.wasm', '_headers']) assert.ok(files.some(row => row.file === file), 'Missing: ' + file);
const wasm = gunzipSync(await readFile('dist/index.wasm'));
assert.equal(wasm.subarray(0, 4).toString('hex'), '0061736d', 'Invalid WASM');
assert.match(await readFile('worker/index.js', 'utf8'), /encodeBody: 'manual'/);
console.table(files);
await mkdir('build', { recursive: true });
await writeFile('build/asset-report.json', JSON.stringify({ maxFileBytes: limit, fileCount: files.length, totalBytes: files.reduce((sum, row) => sum + row.bytes, 0), files }, null, 2) + '\n');
console.log('PASS: all deployment files fit Workers Free limits');
