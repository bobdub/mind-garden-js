import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const distDir = resolve(process.cwd(), "dist");
const source = resolve(distDir, "index.html");
const target = resolve(distDir, "404.html");

if (!existsSync(source)) {
  console.error(`Expected build output at ${source} but it was not found.`);
  process.exit(1);
}

copyFileSync(source, target);
console.log(`Copied ${source} to ${target}`);
