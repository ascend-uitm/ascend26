import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contentTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = createServer(async (request, response) => {
  const requestPath = request.url === '/' ? '/index.html' : request.url.split('?')[0];
  const filePath = resolve(root, '.' + decodeURIComponent(requestPath));
  if (!filePath.startsWith(root)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(filePath);
    response.writeHead(200, { 'content-type': contentTypes[extname(filePath)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});

await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
const address = server.address();
const origin = 'http://127.0.0.1:' + address.port;

try {
  const routes = ['/', '/styles.css', '/script.js', '/assets/favicon.svg', '/assets/abstract-orbit.png'];
  for (const route of routes) {
    const response = await fetch(origin + route);
    if (!response.ok) throw new Error(route + ' returned HTTP ' + response.status);
  }
  const homepage = await (await fetch(origin + '/')).text();
  if (!homepage.includes("ASCEND'26")) throw new Error('Homepage title text is missing.');
  console.log('HTTP smoke test passed for ' + routes.length + ' public assets.');
} finally {
  await new Promise((resolveClose, rejectClose) => {
    server.close((error) => error ? rejectClose(error) : resolveClose());
  });
}
