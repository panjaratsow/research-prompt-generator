import { spawn } from "node:child_process";
import { once } from "node:events";
import { describe, expect, it } from "vitest";

async function startServer() {
  const port = 46000 + Math.floor(Math.random() * 1000);
  const child = spawn(process.execPath, ["scripts/serve.mjs", "--port", String(port)], { stdio: ["ignore", "pipe", "pipe"] });
  await once(child.stdout, "data");
  return { port, process: child };
}

describe("static server", () => {
  it("returns an error for malformed paths and continues serving requests", async () => {
    const server = await startServer();
    try {
      const malformed = await fetch(`http://127.0.0.1:${server.port}/%`);
      expect(malformed.status).toBeGreaterThanOrEqual(400);
      const index = await fetch(`http://127.0.0.1:${server.port}/`);
      expect(index.status).toBe(200);
    } finally {
      server.process.kill();
      await once(server.process, "exit");
    }
  });
});
