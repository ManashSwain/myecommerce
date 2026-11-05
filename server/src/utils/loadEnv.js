import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// This module is imported first in index.js so every env var is in place
// before modules that read configuration at import time are evaluated.
const serverDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

// Earlier files win, so:
//   1. real environment variables (Hostinger, Docker, shell) — highest
//   2. .env.local — local development overrides, gitignored
//   3. .env — shared/deployed defaults
dotenv.config({
  path: [path.join(serverDir, ".env.local"), path.join(serverDir, ".env")],
  quiet: true,
});
