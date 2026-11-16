import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const mf = new Miniflare(convertV4MiniflareOptions({ compatibilityDate: "2026-11-16", modules: true, script: await readFile("worker/index.js", "utf8"), assets: {directory:"dist", binding:"ASSETS", run_worker_first:["/index.wasm"], routerConfig:{has_user_worker:true}}, port:0 }));
try {
 const url = await mf.ready;
 const response = await fetch(new URL('/index.wasm',url));
 console.log('WASM HTTP', response.status, response.headers.get('content-type'),response.headers.get('content-encoding'));
 if(response.status !== 200) console.log(await response.clone().text());
 assert.equal(response.status,200);
 assert.equal(response.headers.get('content-type'),'application/wasm');
 const bytes = Buffer.from(await response.arrayBuffer());
 console.log('Decoded bytes', bytes.length, bytes.subarray(0,8).toString('hex'));
 assert.ok(bytes.equals(await readFile('build/web/index.wasm')), 'HTTP gzip decoding must reproduce original WASM');
 await WebAssembly.compile(bytes);
 const head = await fetch(new URL('/index.wasm',url), {method:'HEAD'});
 assert.equal(head.status,200);
 assert.equal(head.headers.get('content-encoding'),'gzip');
 assert.equal((await head.arrayBuffer()).byteLength,0);
 const post = await fetch(new URL('/index.wasm',url), {method:'POST'});
 assert.equal(post.status,405);
 const html = await fetch(url);
 assert.equal(html.status,200);
 assert.ok((await html.text()).includes('Engine'));
 assert.equal((await fetch(new URL('/missing-file.wasm',url))).status,404);
 console.log('PASS: Workers local assets, headers, gzip decoding, WASM compilation, HTML and 404');
} finally {await mf.dispose();}
