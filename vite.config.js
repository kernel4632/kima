/* Build the site or one library target with the matching Vue style compiler.
 * Usage: pnpm build (site-dist), pnpm build:lib (both dist entries).
 * New components are discovered whenever Vite loads this configuration.
 */
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { generateExports } from "./scripts/components.js";
import { docsPlugin } from "./scripts/docs.js";

export default defineConfig(async ({ mode }) => {
  await generateExports();
  const library = ["lib", "elements", "elements-core", "theme"].includes(mode);
  // 两个自定义元素入口共用一个入口名判断：core 只是组件范围不同，构建行为一致。
  const elements = mode === "elements" || mode === "elements-core";
  const core = mode === "elements-core";
  const theme = mode === "theme";
  const entryName = theme ? "kima-theme" : core ? "kima-elements-core" : elements ? "kima-elements" : "kima";

  return {
    root: fileURLToPath(new URL("./", import.meta.url)),
    publicDir: library ? false : "public",
    // The self-contained browser entry must not depend on Node globals.
    define: elements ? { "process.env.NODE_ENV": JSON.stringify("production") } : {},
    // Ordinary Vue mounts need extracted CSS; only elements need component.styles.
    plugins: [vue({ customElement: elements }), ...(!library ? [docsPlugin()] : [])],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: library ? {
      outDir: "dist",
      // The Vue build clears old library files; the elements build preserves its CSS.
      emptyOutDir: mode === "lib",
      lib: {
        entry: fileURLToPath(new URL(theme ? "./src/utils/theme.js" : core ? "./src/elements-core.js" : elements ? "./src/elements.js" : "./src/index.js", import.meta.url)),
        formats: ["es"],
        fileName: () => `${entryName}.js`,
        cssFileName: "style",
      },
      rolldownOptions: {
        external: elements || theme ? [] : [/^vue(?:\/|$)/, /^@hugeicons\//],
      },
    } : {
      outDir: "site-dist",
    },
  };
});
