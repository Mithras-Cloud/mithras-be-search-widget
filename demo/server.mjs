import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const demoDir = join(__dirname);
const distDir = join(__dirname, '..', 'dist');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/octet-stream',
};

const resolvePath = async (pathname) => {
  const segments = pathname.replace(/^\/+/, '');
  const target = segments === '' ? 'index.html' : segments;
  for (const base of [demoDir, distDir]) {
    const candidate = normalize(join(base, target));
    if (!candidate.startsWith(base)) continue;
    try {
      const stats = await stat(candidate);
      if (stats.isFile()) {
        return candidate;
      }
    } catch (error) {
      if (error && error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
  return null;
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) {
      pathname += 'index.html';
    }
    const filePath = await resolvePath(pathname);
    if (!filePath) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const body = await readFile(filePath);
    const type = mimeTypes[extname(filePath)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(body);
  } catch (error) {
    console.error('[demo-server]', error);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal server error');
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 4173;
server.listen(port, () => {
  console.log(`Demo server running at http://localhost:${port}`);
});
