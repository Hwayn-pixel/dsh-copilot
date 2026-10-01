/**
 * dsh-prompt-desk build script.
 *
 *   src/index.ts        -> lib/index.js   (ESM — Host half)
 *   src/client/index.ts -> lib/client.js  (CommonJS wrapped for the client-module loader)
 */
import { readFileSync, writeFileSync, watch, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = dirname(fileURLToPath(import.meta.url));
const srcDir = join(root, "src");
const libDir = join(root, "lib");

function transpile(file, moduleKind) {
  const source = readFileSync(join(srcDir, file), "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: moduleKind,
      esModuleInterop: false,
      sourceMap: false,
    },
    fileName: file,
  });
  return result.outputText;
}

const CLIENT_ID = "dsh-prompt-desk";
const clientBanner = [
  `window.__ModuleLoader__.load({`,
  `\tid: ${JSON.stringify(CLIENT_ID)},`,
  `\tfactory: (require) => {`,
  `\t\tvar module = { exports: {} };`,
  `\t\tvar exports = module.exports;`,
  `\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });`,
].join("\n");
const clientFooter = `\n\t\treturn module.exports;\n\t}\n});\n`;

function build() {
  mkdirSync(libDir, { recursive: true });
  writeFileSync(join(libDir, "index.js"), transpile("index.ts", ts.ModuleKind.ESNext));
  const client = transpile(join("client", "index.ts"), ts.ModuleKind.CommonJS);
  writeFileSync(join(libDir, "client.js"), `${clientBanner}\n${client}\n${clientFooter}`);
  console.log("dsh-prompt-desk: built lib/index.js + lib/client.js");
}

build();

if (process.argv.includes("--watch")) {
  console.log("dsh-prompt-desk: watching src/ for changes…");
  watch(srcDir, { recursive: true }, () => {
    try { build(); } catch (error) { console.error("build failed:", error); }
  });
}
