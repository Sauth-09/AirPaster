import { build, context } from "esbuild";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SHARED_OPTIONS = {
  bundle: true,
  minify: true,
  sourcemap: false,
  target: ["chrome110"],
  charset: "utf8",
  logLevel: "info",
};

const EXTENSION_POPUP_CONFIG = {
  ...SHARED_OPTIONS,
  entryPoints: ["extension/src/popup.js"],
  outfile: "extension/dist/popup.bundle.js",
  format: "iife", // Manifest V3 requires IIFE (no ES modules in popup)
};

const EXTENSION_OPTIONS_CONFIG = {
  ...SHARED_OPTIONS,
  entryPoints: ["extension/src/options.js"],
  outfile: "extension/dist/options.bundle.js",
  format: "iife",
};

const MOBILE_CONFIG = {
  ...SHARED_OPTIONS,
  entryPoints: ["mobile-web/src/app.js"],
  outfile: "mobile-web/dist/app.bundle.js",
  format: "iife",
};

const SHARE_TARGET_CONFIG = {
  ...SHARED_OPTIONS,
  entryPoints: ["mobile-web/src/share-target.js"],
  outfile: "mobile-web/dist/share-target.bundle.js",
  format: "iife",
};

// ---------------------------------------------------------------------------
// CLI Handling
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const target = args[0] || "all";
const isWatch = args.includes("--watch");

const configs = {
  extension: [EXTENSION_POPUP_CONFIG, EXTENSION_OPTIONS_CONFIG],
  mobile: [MOBILE_CONFIG, SHARE_TARGET_CONFIG],
  all: [EXTENSION_POPUP_CONFIG, EXTENSION_OPTIONS_CONFIG, MOBILE_CONFIG, SHARE_TARGET_CONFIG],
};

const selectedConfigs = configs[target];

if (!selectedConfigs) {
  console.error(`Unknown target: "${target}". Use: extension | mobile | all`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Build or Watch
// ---------------------------------------------------------------------------

const run = async () => {
  if (isWatch) {
    console.log("👀 Watching for changes...\n");
    const contexts = await Promise.all(
      selectedConfigs.map((cfg) => context(cfg))
    );
    await Promise.all(contexts.map((ctx) => ctx.watch()));
  } else {
    await Promise.all(selectedConfigs.map((cfg) => build(cfg)));
    console.log("\n✅ Build completed successfully!");
  }
};

run().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
