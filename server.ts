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

app.use(express.static(clientDist));

app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(port, () => {
  console.log(`Serving dist from ${clientDist} on http://localhost:${port}`);
});
