// Only the WASM URL invokes this Worker; other known assets use static delivery.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/index.wasm') return env.ASSETS.fetch(request);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 200 && asset.status !== 304) return asset;
    const headers = new Headers(asset.headers);
    headers.set('Content-Type', 'application/wasm');
    headers.set('Content-Encoding', 'gzip');
    // Assets are already compressed at build time. Do not compress them twice.
    return new Response(asset.body, {
      status: asset.status,
      headers,
      encodeBody: 'manual',
    });
  },
};
