// Мини-сервер статики с поддержкой Range (нужен CheerpJ). Запуск: node server.js [порт]
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, port = +process.argv[2] || 8080;
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm',
  '.jar':'application/java-archive','.zip':'application/zip','.png':'image/png','.json':'application/json','.css':'text/css'};
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, path.normalize(p));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Not found'); }
    const h = {'Content-Type': types[path.extname(file)] || 'application/octet-stream',
               'Accept-Ranges': 'bytes', 'Access-Control-Allow-Origin': '*'};
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (m) {
      let s = m[1] === '' ? Math.max(0, st.size - +m[2]) : +m[1];
      let e = m[1] === '' || m[2] === '' ? st.size - 1 : Math.min(+m[2], st.size - 1);
      if (s > e || s >= st.size) { res.writeHead(416, {'Content-Range': `bytes */${st.size}`}); return res.end(); }
      res.writeHead(206, {...h, 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Content-Length': e - s + 1});
      fs.createReadStream(file, {start: s, end: e}).pipe(res);
    } else {
      res.writeHead(200, {...h, 'Content-Length': st.size});
      fs.createReadStream(file).pipe(res);
    }
  });
}).listen(port, () => console.log(`Открой http://localhost:${port}/`));
