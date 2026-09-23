// Tiny static server + save endpoint for the Figma export.
// usage: node server.js <repoRoot> <outDir> <port>
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(process.argv[2]), OUT = path.resolve(process.argv[3]), PORT = +process.argv[4] || 8970, TOOL = __dirname;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
function safe(base, rel) { const p = path.resolve(base, '.' + path.sep + rel); return p.startsWith(base) ? p : null; }
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'POST' && u.pathname === '/__save') {
    const name = u.searchParams.get('name') || 'out.svg';
    const dest = safe(OUT, name);
    if (!dest) { res.writeHead(400); return res.end('bad'); }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => { fs.mkdirSync(path.dirname(dest), { recursive: true }); const b = Buffer.concat(chunks); fs.writeFileSync(dest, b); console.log('SAVED ' + name + ' ' + b.length); res.writeHead(200); res.end('ok'); });
    return;
  }
  if (u.pathname === '/__log') { console.log('LOG ' + decodeURIComponent(u.search.slice(1))); res.writeHead(200); return res.end('ok'); }
  let file;
  if (u.pathname.startsWith('/__tool/')) file = safe(TOOL, decodeURIComponent(u.pathname.slice(8)));
  else { let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html'; file = safe(ROOT, p); }
  if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log('READY ' + PORT));
