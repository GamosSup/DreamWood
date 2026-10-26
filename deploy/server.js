// Небольшой сервер для «облака» (Google Drive) на своём сервере: запускает те же функции, что и Cloudflare Pages (functions/api/*),
// поэтому поведение на обоих адресах одинаковое. Слушает только 127.0.0.1, наружу его отдаёт Caddy (/api/* → сюда).
import http from 'node:http';
import {Readable} from 'node:stream';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const ROOT = process.env.DW_ROOT || '/srv/dreamwood';
const PORT = +process.env.PORT || 8787;

// файл с секретами (/etc/dreamwood.env: строки ИМЯ=значение) — читаем сами, чтобы не зависеть от systemd
try {
  const f = process.env.DW_ENV || '/etc/dreamwood.env';
  for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#')) process.env[m[1]] ??= m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch (e) { /* файла может не быть — тогда /api вернёт 501 */ }

// в Node потоковому телу запроса нужен duplex:'half' (в Cloudflare — нет)
const nativeFetch = globalThis.fetch;
globalThis.fetch = (input, init = {}) => {
  if (init.body && typeof init.body === 'object' && typeof init.body.getReader === 'function' && !init.duplex) init = {...init, duplex: 'half'};
  return nativeFetch(input, init);
};

const load = f => import(pathToFileURL(path.join(ROOT, 'functions/api', f)).href);
const routes = {
  'GET /api/file': ['file.js', 'onRequestGet'],
  'GET /api/link': ['link.js', 'onRequestGet'],
  'GET /api/site': ['site.js', 'onRequestGet'],
  'POST /api/upload': ['upload.js', 'onRequestPost'],
};

const send = (res, status, obj) => {
  res.writeHead(status, {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'});
  res.end(JSON.stringify(obj));
};

const srv = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const r = routes[req.method + ' ' + url.pathname];
    if (!r) return send(res, url.pathname === '/api/push' ? 501 : 404, {error: 'not_here'});
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (!['host', 'connection', 'transfer-encoding'].includes(k)) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const request = new Request('http://localhost' + req.url, {method: req.method, headers, body: hasBody ? Readable.toWeb(req) : undefined, duplex: 'half'});
    const mod = await load(r[0]);
    const resp = await mod[r[1]]({request, env: process.env, params: {}});
    const out = {};
    resp.headers.forEach((v, k) => { out[k] = v; });
    res.writeHead(resp.status, out);
    if (!resp.body) return res.end();
    const body = Readable.fromWeb(resp.body);
    res.on('close', () => body.destroy());
    body.on('error', () => res.destroy());
    body.pipe(res);
  } catch (e) {
    console.error(new Date().toISOString(), req.method, req.url, e && e.stack || e);
    if (!res.headersSent) send(res, 500, {error: 'server_error', message: String(e && e.message || e).slice(0, 200)});
    else res.destroy();
  }
});
srv.requestTimeout = 0; // большие видео по мобильному интернету идут дольше 5 минут
srv.headersTimeout = 30000;
srv.listen(PORT, '127.0.0.1', () => console.log('dreamwood api on 127.0.0.1:' + PORT));
