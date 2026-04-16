import fs from "node:fs";
import path from "node:path";

const appDir = path.join(
  process.cwd(),
  ".next",
  "server",
  "app",
  "(dashboard)",
  "dashboard",
);

function findBuildManifests(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const manifests = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      manifests.push(...findBuildManifests(fullPath));
      continue;
    }

    if (
      entry.isFile() &&
      entry.name === "build-manifest.json" &&
      fullPath.includes(`${path.sep}page${path.sep}`)
    ) {
      manifests.push(fullPath);
    }
  }

  return manifests;
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

if (!fs.existsSync(appDir)) {
  console.error("Missing dashboard build manifests. Run `npm run build` first.");
  process.exit(1);
}

const manifests = findBuildManifests(appDir).sort();

if (manifests.length === 0) {
  console.error("No dashboard build manifests found.");
  process.exit(1);
}

const lines = manifests.map((manifestPath) => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const files = [...new Set([...(manifest.rootMainFiles ?? []), ...(manifest.polyfillFiles ?? [])])];
  const totalBytes = files.reduce((sum, file) => {
    const assetPath = path.join(process.cwd(), ".next", file);

    if (!fs.existsSync(assetPath)) {
      return sum;
    }

    return sum + fs.statSync(assetPath).size;
  }, 0);

  const route = manifestPath
    .replace(`${appDir}${path.sep}`, "")
    .replace(/(^|\/)page\/build-manifest\.json$/, "")
    .replaceAll(path.sep, "/");

  return {
    route: `/dashboard${route === "" ? "" : `/${route}`}`,
    totalBytes,
    fileCount: files.length,
  };
});

const sharedReference = JSON.parse(fs.readFileSync(manifests[0], "utf8"));
const sharedFiles = [
  ...new Set([...(sharedReference.rootMainFiles ?? []), ...(sharedReference.polyfillFiles ?? [])]),
];

console.log("Dashboard bundle footprint from app-route build manifests");
console.log("");

for (const line of lines) {
  console.log(
    `${line.route.padEnd(34)} ${formatBytes(line.totalBytes).padStart(10)}  ${String(line.fileCount).padStart(2)} files`,
  );
}

console.log("");
console.log("Shared root/polyfill files considered:");
for (const file of sharedFiles) {
  const assetPath = path.join(process.cwd(), ".next", file);
  const size = fs.existsSync(assetPath) ? fs.statSync(assetPath).size : 0;
  console.log(`- ${file} (${formatBytes(size)})`);
}
