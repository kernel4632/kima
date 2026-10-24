/* Sequential library builds; enforce standalone output before writing acceptance evidence. */
import assert from 'node:assert/strict';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { thirdPartyNotices } from './third-party-notices.js';
import { emitComponentStyles } from './component-styles.js';

const root = new URL('../', import.meta.url);
const configFile = fileURLToPath(new URL('vite.config.js', root));
const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const vueExternals = [...Object.keys(manifest.dependencies), ...Object.keys(manifest.peerDependencies)];
const report = { startedAt: new Date().toISOString(), exitCode: 1, outputs: [] };
const notices = thirdPartyNotices();
await mkdir(new URL('artifacts/', root), { recursive: true });
try {
  for (const mode of ['lib', 'elements', 'elements-core', 'theme']) {
    await build({ configFile, mode,
      // Preserve engine package boundaries so consumer bundlers can remove unused engines.
      ...(mode === 'lib' ? { build: { cssCodeSplit: true, rolldownOptions: {
        external: vueExternals.map(name => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:/|$)`)),
        output: { preserveModules: true, preserveModulesRoot: fileURLToPath(new URL('src/', root)), entryFileNames: chunk => chunk.name === 'index' ? 'kima.js' : 'vue/[name].js' },
      } } } : {}),
      ...(mode === 'elements' ? { define: { 'process.env.LOG': 'undefined', 'process.env': '{}' } } : {}),
      plugins: [{ name: 'kima-final-output-invariants', async generateBundle(_, bundle) {
        if (mode !== 'lib') await notices.collect(bundle);
        else report.componentStyles = emitComponentStyles(bundle, asset => this.emitFile(asset));
        for (const output of Object.values(bundle)) {
          if (output.type !== 'chunk') continue;
          const bytes = Buffer.byteLength(output.code), gzipBytes = gzipSync(output.code).length;
          report.outputs.push({ mode, fileName: output.fileName, bytes, gzipBytes, imports: output.imports, dynamicImports: output.dynamicImports });
          if (mode === 'elements' || mode === 'elements-core' || mode === 'theme') {
            assert.deepEqual(output.imports, [], `${mode} must have no external/static imports`);
            assert.deepEqual(output.dynamicImports, [], `${mode} must have no browser runtime dynamic imports`);
          }
          if (mode === 'elements') console.warn(`SIZE WARNING: /elements eagerly includes ALL components and engines: ${bytes} bytes (${(bytes / 1e6).toFixed(2)} MB); gzip ${gzipBytes} bytes. Vue named imports support tree shaking.`);
          if (mode === 'elements-core') console.log(`/elements/core: ${bytes} bytes (${(bytes / 1e6).toFixed(2)} MB); gzip ${gzipBytes} bytes.`);
        }
        if (mode === 'elements' || mode === 'elements-core' || mode === 'theme') assert.equal(Object.values(bundle).filter(output => output.type === 'chunk').length, 1, `${mode} must remain a single standalone JS file`);
      } }],
    });
  }
  report.bundledLicenses = await notices.write(new URL('dist/THIRD_PARTY_NOTICES.txt', root));
  report.exitCode = 0;
} catch (error) {
  report.failure = error.stack || String(error);
  process.exitCode = 1;
  console.error(error);
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(new URL('artifacts/build-lib-result.json', root), JSON.stringify(report, null, 2));
  console.log(`build:lib exit=${report.exitCode}; outputs=${report.outputs.length}`);
}
