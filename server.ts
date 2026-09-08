import express, { Request, Response } from "express";
import morgan, { Options } from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT ?? 3000);

// ---------- ⭐ Morgan (prod-ready, static suppressed) ⭐ ----------
const staticExtensions = [
  ".js",
  ".css",
  ".map",
  ".ico",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".gif",
  ".webp",
  ".ttf",
  ".woff",
  ".woff2",
  ".mp4",
  ".glb",
  ".gltf"
];

const morganOptions: Options<Request, Response> = {
  skip: (req) => {
    const url = req.url.toLowerCase();
    return staticExtensions.some((ext) => url.endsWith(ext));
  },
};

// Always use production-grade logging
app.use(morgan("combined", morganOptions));

// --------------------------------------------------------------

const clientDist = path.resolve(__dirname, "../dist");

app.use((req, res, next) => {
  if (req.hostname === "www.h4nk.com") {
    res.redirect(308, `https://h4nk.com${req.originalUrl}`);
    return;
  }
  next();
});

// Keep one public résumé URL, before static middleware can serve the PDF.
app.get("/hank-berger-resume.pdf", (_req, res) => res.redirect(308, "/resume"));

app.use(express.static(clientDist, {
  setHeaders: (res, filePath) => {
    if (filePath.startsWith(path.join(clientDist, "assets") + path.sep)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
  },
}));

// Clean resume URL — must come before the SPA catch-all
app.get("/resume", (_req, res) => {
  res.setHeader("Link", '<https://h4nk.com/resume>; rel="canonical"');
  res.sendFile(path.join(clientDist, "hank-berger-resume.pdf"));
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.use((_req, res) => {
  res.status(404).type("html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found — Hank Berger</title>
<style>body{margin:0;padding:10vh 8vw;background:#0147ff;color:white;font:18px/1.6 system-ui}a{color:inherit}main{max-width:40rem}</style>
</head><body><main><h1>Page not found</h1><p>This page may have moved, or the link may be incorrect.</p>
<p><a href="/">Visit Hank Berger’s portfolio</a></p></main></body></html>`);
});

const server = app.listen(port, () => {
  const address = server.address();
  const boundPort = typeof address === "object" && address ? address.port : port;
  console.log(`Serving dist from ${clientDist} on http://localhost:${boundPort}`);
});
