/* Derive public CSS entries from Vite's real chunk graph, including nested components. */
import assert from 'node:assert/strict';
import { posix } from 'node:path';
import { componentPaths } from '../src/component-paths.js';
import { componentTiers } from '../src/component-tiers.js';

export function emitComponentStyles(bundle, emit) {
  const tokens = 'vue/styles/_tokens.js';
  assert.ok(bundle[tokens], 'Missing shared token module');
  function stylesFor(entries) {
    const visited = new Set(), css = new Set();
    function visit(file) {
      if (visited.has(file)) return;
      visited.add(file);
      const chunk = bundle[file];
      if (!chunk || chunk.type !== 'chunk') return; // External packages own their styles.
      for (const imported of chunk.imports) visit(imported);
      for (const asset of chunk.viteMetadata?.importedCss || []) {
        assert.ok(bundle[asset], `Missing CSS asset ${asset}`);
        css.add(asset);
      }
    }
    visit(tokens);
    for (const entry of entries) visit(entry);
    return [...css];
  }
  const moduleFor = slug => `vue/${componentPaths[slug].replace(/^\/src\//, '').replace(/\.vue$/, '.js')}`;
  const entries = {};
  for (const slug of Object.keys(componentPaths)) {
    const module = moduleFor(slug);
    assert.ok(bundle[module], `Missing component module: ${module}`);
    entries[slug] = stylesFor([module]);
  }
  entries.core = stylesFor(componentTiers.core.map(moduleFor));
  for (const [slug, css] of Object.entries(entries)) {
    emit({ type: 'asset', fileName: `styles/${slug}.css`, source: css.map(file => `@import ${JSON.stringify(posix.relative('styles', file))};`).join('\n') + '\n' });
  }
  // Preserve the existing all-in-one API with tokens first; CSS chunks may minify differently.
  const tokenAssets = stylesFor([]);
  const assets = [...tokenAssets, ...Object.keys(bundle).filter(file => file.endsWith('.css') && !tokenAssets.includes(file))];
  emit({ type: 'asset', fileName: 'style.css', source: assets.map(file => bundle[file].source).join('\n') });
  return entries;
}
