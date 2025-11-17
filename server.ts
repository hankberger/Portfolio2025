import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT ?? 3000);
const distDir = path.resolve(__dirname, "dist");

app.use(express.static(distDir));

app.get("*", (_request, response) => {
  response.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Serving dist from ${distDir} on http://localhost:${port}`);
});
