const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const host = '127.0.0.1';
const port = 8765;
const outputPath = path.resolve(__dirname, '..', '.ftp-deploy.env');

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function page(message = '') {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>QR IEOSUIA deployment details</title>
<style>
body{font-family:system-ui,sans-serif;background:#f3f6fb;margin:0;color:#162033}main{max-width:620px;margin:48px auto;background:white;padding:32px;border-radius:16px;box-shadow:0 12px 40px #18315318}h1{margin-top:0}label{display:block;font-weight:600;margin-top:18px}input,select{box-sizing:border-box;width:100%;margin-top:7px;padding:12px;border:1px solid #bac4d2;border-radius:8px;font:inherit}button{margin-top:24px;width:100%;padding:13px;border:0;border-radius:8px;background:#1769e0;color:white;font-weight:700;font-size:16px;cursor:pointer}.note{background:#edf5ff;padding:12px;border-radius:8px}.success{background:#e8f8ee;color:#176a37;padding:12px;border-radius:8px}</style>
</head><body><main><h1>Deployment credentials</h1>
<p class="note">This page runs only on your computer at 127.0.0.1. Details are saved to a Git-ignored local file.</p>
${message ? `<p class="success">${escapeHtml(message)}</p>` : ''}
<form method="post" action="/save" autocomplete="off">
<label>Protocol<select name="protocol"><option value="ftps">FTPS (recommended)</option><option value="sftp">SFTP</option><option value="ftp">FTP</option></select></label>
<label>Host<input name="host" required placeholder="ftp.example.com"></label>
<label>Port<input name="port" required inputmode="numeric" value="21"></label>
<label>Username<input name="username" required autocomplete="username"></label>
<label>Password<input name="password" required type="password" autocomplete="current-password"></label>
<label>Frontend server path<input name="frontendPath" required placeholder="/public_html"></label>
<label>API server path<input name="apiPath" required placeholder="/public_html/api"></label>
<button type="submit">Save deployment details</button>
</form></main></body></html>`;
}

function envValue(value) {
  return `"${String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\r', '').replaceAll('\n', '')}"`;
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
    return res.end(page());
  }
  if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', chunk => { if ((body += chunk).length > 16384) req.destroy(); });
    req.on('end', () => {
      const data = querystring.parse(body);
      if (!data.host || !data.port || !data.username || !data.password || !data.frontendPath || !data.apiPath) {
        res.writeHead(400, {'Content-Type': 'text/html; charset=utf-8'});
        return res.end(page('Please complete every field.'));
      }
      const protocol = ['ftp', 'ftps', 'sftp'].includes(data.protocol) ? data.protocol : 'ftps';
      const contents = [
        '# Local deployment credentials. Excluded from Git.',
        `FTP_HOST=${envValue(data.host)}`,
        `FTP_PORT=${envValue(data.port)}`,
        `FTP_USERNAME=${envValue(data.username)}`,
        `FTP_PASSWORD=${envValue(data.password)}`,
        `FTP_PROTOCOL=${envValue(protocol)}`,
        `FTP_FRONTEND_PATH=${envValue(data.frontendPath)}`,
        `FTP_API_PATH=${envValue(data.apiPath)}`,
        ''
      ].join('\n');
      fs.writeFileSync(outputPath, contents, {encoding: 'utf8', mode: 0o600});
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
      res.end(page('Saved. Return to Codex and say “deploy now.”'));
    });
    return;
  }
  res.writeHead(404); res.end('Not found');
});

server.listen(port, host, () => process.stdout.write(`Credential form ready at http://${host}:${port}/\n`));
