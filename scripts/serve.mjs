import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const portIndex = process.argv.indexOf("--port");
const port = portIndex === -1 ? 4173 : Number(process.argv[portIndex + 1]);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

function resolveRequestPath(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath); } catch { return undefined; }
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^[/\\]+/, "");
  const path = resolve(root, normalize(relative));
  return path === root || path.startsWith(`${root}${sep}`) ? path : null;
}

createServer((request, response) => {
  let path;
  try { path = resolveRequestPath(new URL(request.url, "http://127.0.0.1").pathname); } catch { response.writeHead(400).end("Bad request"); return; }
  if (path === undefined) { response.writeHead(400).end("Bad request"); return; }
  if (!path) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    if (!statSync(path).isFile()) throw new Error("Not a file");
    response.writeHead(200, { "Content-Type": mimeTypes[extname(path)] ?? "application/octet-stream" });
    createReadStream(path).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Static server listening on http://127.0.0.1:${port}`);
});
