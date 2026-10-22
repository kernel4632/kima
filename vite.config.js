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
  const library = ["lib", "elements", "theme"].includes(mode);
  const elements = mode === "elements";
  const theme = mode === "theme";
  const entryName = theme ? "kima-theme" : elements ? "kima-elements" : "kima";

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
        entry: fileURLToPath(new URL(theme ? "./src/utils/theme.js" : elements ? "./src/elements.js" : "./src/index.js", import.meta.url)),
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
