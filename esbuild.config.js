const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const isWatch = process.argv.includes("--watch");

const sharedOptions = {
  bundle: true,
  minify: false,
  sourcemap: isWatch ? "inline" : false,
  logLevel: "info",
};

// Ensure dist directory exists
if (!fs.existsSync("dist")) fs.mkdirSync("dist");

function inlineUiJs() {
  const htmlSrc = fs.readFileSync("src/ui.html", "utf8");
  const uiJs = fs.readFileSync("dist/ui.js", "utf8");
  const uiCssPath = "dist/ui.css";
  const uiCss = fs.existsSync(uiCssPath) ? fs.readFileSync(uiCssPath, "utf8") : "";

  let htmlOut = htmlSrc.replace(
    /<script\s+src=["']ui\.js["']\s*><\/script>/,
    `${uiCss ? `<style>${uiCss}</style>` : ""}<script>${uiJs}</script>`
  );
  if (htmlOut === htmlSrc) {
    throw new Error('inlineUiJs: could not find <script src="ui.js"> placeholder in src/ui.html');
  }
  fs.unlinkSync("dist/ui.js");
  if (fs.existsSync(uiCssPath)) fs.unlinkSync(uiCssPath);
  fs.writeFileSync("dist/ui.html", htmlOut);
  console.log("Built dist/ui.html");
}

const codeOptions = {
  ...sharedOptions,
  entryPoints: ["src/code.ts"],
  outfile: "dist/code.js",
  platform: "browser", // Figma sandbox is browser-like
  target: "es2017",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
};

const uiOptions = {
  ...sharedOptions,
  entryPoints: ["src/ui.tsx"],
  outfile: "dist/ui.js",
  platform: "browser",
  target: "es2017",
  jsx: "automatic",
  jsxImportSource: "preact",
  loader: { ".png": "dataurl", ".svg": "dataurl" },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
};

async function main() {
  if (isWatch) {
    // Watch mode: use esbuild context API
    const codeCtx = await esbuild.context(codeOptions);
    const uiCtx = await esbuild.context({
      ...uiOptions,
      plugins: [
        {
          name: "inline-ui-html",
          setup(build) {
            build.onEnd((result) => {
              if (result.errors.length === 0) {
                inlineUiJs();
              }
            });
          },
        },
      ],
    });

    await Promise.all([codeCtx.watch(), uiCtx.watch()]);
    console.log("Watching for changes...");
  } else {
    // One-shot build
    await esbuild.build(codeOptions);
    await esbuild.build(uiOptions);
    inlineUiJs();
    console.log("Build complete.");
    process.exit(0);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
