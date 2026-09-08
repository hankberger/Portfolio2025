import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { request } from "node:http";
import { test } from "node:test";

// Run against the compiled production server, not Vite's development fallback.
test("production routes, canonical URLs, and asset caching", async () => {
  const server = spawn(process.execPath, ["build-server/server.js"], {
    env: { ...process.env, PORT: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    const base = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Server did not start")), 5000);
      let output = "";
      server.stdout.on("data", (chunk) => {
        output += chunk;
        const match = output.match(/http:\/\/localhost:\d+/);
        if (match) {
          clearTimeout(timer);
          resolve(match[0]);
        }
      });
      server.once("error", (error) => { clearTimeout(timer); reject(error); });
      server.once("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`Server exited before startup: ${code}`));
      });
    });
    const home = await fetch(`${base}/`);
    assert.equal(home.status, 200);
    const html = await home.text();
    assert.match(html, /rel="canonical" href="https:\/\/h4nk.com\/"/);

    for (const missing of ["/missing-page", "/assets/missing.js"]) {
      const response = await fetch(base + missing);
      assert.equal(response.status, 404, missing);
      assert.match(await response.text(), /Page not found/);
    }
    const legacy = await fetch(`${base}/hank-berger-resume.pdf`, { redirect: "manual" });
    assert.equal(legacy.status, 308);
    assert.equal(legacy.headers.get("location"), "/resume");
    const resume = await fetch(`${base}/resume`, { method: "HEAD" });
    assert.equal(resume.status, 200);
    assert.match(resume.headers.get("content-type"), /application\/pdf/);
    assert.equal(resume.headers.get("link"), '<https://h4nk.com/resume>; rel="canonical"');

    // Fetch controls Host itself; use HTTP directly to exercise host routing.
    const www = await new Promise((resolve, reject) => {
      const req = request(`${base}/resume?source=test`, {
        method: "HEAD", headers: { Host: "www.h4nk.com" },
      }, (res) => { res.resume(); resolve(res); });
      req.once("error", reject);
      req.end();
    });
    assert.equal(www.statusCode, 308);
    assert.equal(www.headers.location, "https://h4nk.com/resume?source=test");

    const asset = html.match(/src="(\/assets\/[^" ]+\.js)"/)?.[1];
    assert.ok(asset, "built entry script exists");
    const script = await fetch(base + asset, { method: "HEAD" });
    assert.equal(script.status, 200);
    assert.equal(script.headers.get("cache-control"), "public, max-age=31536000, immutable");
    assert.doesNotMatch(home.headers.get("cache-control") ?? "", /immutable/);
  } finally {
    const exited = once(server, "exit");
    server.kill();
    if (server.exitCode === null && server.signalCode === null) await exited;
  }
});
