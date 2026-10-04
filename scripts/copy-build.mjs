import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcPublic = path.resolve(root, "dist", "public");
const destBuild = path.resolve(root, "build");

if (fs.existsSync(srcPublic)) {
  fs.rmSync(destBuild, { recursive: true, force: true });
  fs.cpSync(srcPublic, destBuild, { recursive: true });
  console.log("✅ [Build Mirror] Successfully mirrored dist/public -> build/ for Vercel deployment.");
} else {
  console.warn("⚠️ [Build Mirror] dist/public does not exist yet.");
}
