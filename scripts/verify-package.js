/* Check real outputs, SSR, scoped CSS and standalone module invariants. */
import assert from 'node:assert/strict';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { babelParse } from 'vue/compiler-sfc';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { componentTiers } from '../src/component-tiers.js';

const root = new URL('../', import.meta.url);
const report = { startedAt: new Date().toISOString(), exitCode: 1, components: 0, checks: [], sizes: {} };
await mkdir(new URL('artifacts/', root), { recursive: true });
function check(name, run) { run(); report.checks.push(name); }
async function componentFiles(folder) {
  const files = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), folder);
    if (entry.isDirectory()) files.push(...await componentFiles(path));
    else if (entry.name.endsWith('.ce.vue')) files.push(entry.name);
  }
  return files;
}
function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { for (const child of node) walk(child, visit); return; }
  visit(node);
  for (const [key, child] of Object.entries(node)) if (!['loc', 'start', 'end', 'extra', 'comments', 'tokens'].includes(key)) walk(child, visit);
}
try {
  const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  check('Both registration entries are declared side-effectful', () => {
    for (const file of ['./dist/kima-elements.js', './dist/kima-elements-core.js']) assert.ok(manifest.sideEffects.includes(file), `Missing side effect: ${file}`);
  });
  for (const target of Object.values(manifest.exports).flatMap(value => typeof value === 'string' ? [value] : Object.values(value)).filter(target => !target.includes('*'))) await readFile(new URL(target, root));
  report.checks.push('All declared export targets exist');
  const notices = await readFile(new URL('dist/THIRD_PARTY_NOTICES.txt', root), 'utf8');
  check('Standalone third-party license texts are shipped', () => {
    for (const name of ['vue@', 'reka-ui@', 'highlight.js@', '@material/material-color-utilities@', '@hugeicons/vue@']) assert.ok(notices.includes(name), `Missing notice: ${name}`);
    assert.match(notices, /Redistribution and use in source and binary forms/);
    assert.match(notices, /Apache License/);
    assert.match(notices, /Permission is hereby granted/);
  });
  // Imports are inside the failure boundary so SSR failures also leave an exit artifact.
  const library = await import('../dist/kima.js');
  const { elements } = await import('../dist/kima-elements.js');
  const { elements: coreElements } = await import('../dist/kima-elements-core.js');
  const { generatePalette } = await import('../dist/kima-theme.js');
  check('Core elements entry only registers core tier', () => {
    assert.deepEqual(Object.keys(coreElements).sort(), componentTiers.core.map((slug) => `kima-${slug}`).sort());
    for (const [tag, component] of Object.entries(coreElements)) {
      assert.ok(elements[tag], `core tag missing from full entry: ${tag}`);
      assert.ok(component.styles?.length, `missing inline element CSS for ${tag}`);
    }
  });
  check('SSR theme entry', () => assert.ok(Object.keys(generatePalette('#61afef')).length > 20));
  const codeHtml = await renderToString(createSSRApp({ render: () => h(library.KimaCodeBlock, { code: 'const value = 42;', language: 'javascript' }) }));
  check('SSR syntax highlighting', () => assert.match(codeHtml, /hljs-keyword/));
  const css = await readFile(new URL('dist/style.css', root), 'utf8');
  for (const file of ['kima.js', 'kima-elements.js', 'kima-elements-core.js', 'kima-theme.js', 'style.css']) {
    const content = await readFile(new URL(`dist/${file}`, root));
    report.sizes[file] = { bytes: content.length, gzipBytes: gzipSync(content).length };
  }
  const vueModules = [];
  async function measureVue(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const file = new URL(entry.name + (entry.isDirectory() ? '/' : ''), folder);
      if (entry.isDirectory()) await measureVue(file);
      else if (entry.name.endsWith('.js')) vueModules.push(await readFile(file));
    }
  }
  await measureVue(new URL('dist/vue/', root));
  report.vueModules = { files: vueModules.length + 1, bytes: vueModules.reduce((sum, content) => sum + content.length, report.sizes['kima.js'].bytes), excludesExternalDependencies: true };
  for (const file of ['kima-elements.js', 'kima-elements-core.js', 'kima-theme.js']) {
    const code = await readFile(new URL(`dist/${file}`, root), 'utf8');
    check(`${file}: AST standalone static/re-export/dynamic imports`, () => {
      const ast = babelParse(code, { sourceType: 'module' });
      walk(ast.program, node => {
        assert.ok(!(node.type === 'ImportDeclaration' || node.type === 'ImportExpression' || ((node.type === 'ExportNamedDeclaration' || node.type === 'ExportAllDeclaration') && node.source) || (node.type === 'CallExpression' && node.callee?.type === 'Import')), `${file} must not import another module (${node.type})`);
      });
      assert.doesNotMatch(code, /\bprocess(?:\.env|\s*\[)/, 'Standalone must not depend on Node process globals');
    });
  }
  // 主入口除组件外还导出代码块的语言登记工具；它们不算组件，但必须在产物里。
  const libraryExtras = ['codeLanguages', 'hasCodeLanguage', 'registerCodeLanguage'];
  check('Export registry parity', () => {
    assert.deepEqual(library.componentNames, Object.keys(library).filter(name => name !== 'componentNames' && !libraryExtras.includes(name)));
    assert.equal(library.componentNames.length, Object.keys(elements).length);
    for (const name of libraryExtras) assert.equal(typeof library[name], name === 'codeLanguages' ? 'object' : 'function', `Missing ${name}`);
    assert.ok(library.codeLanguages.length >= 35, 'Code block must ship the highlight.js common set');
    assert.equal(library.hasCodeLanguage('vue'), true);
    assert.equal(library.hasCodeLanguage('ts'), true);
  });
  check('CSS tokens and host isolation', () => {
    assert.match(css, /--kima-color-primary:/);
    assert.doesNotMatch(css, /(?:^|\})\s*(?:html|body|\*)(?:[\s,{.:>])/, 'Library CSS must not reset host page');
  });
  const sourceFiles = await componentFiles(new URL('src/components/', root));
  check('Published entries exactly match current source files', () => {
    const tags = sourceFiles.map(file => `kima-${file.slice(0, -'.ce.vue'.length)}`).sort();
    assert.deepEqual(Object.keys(elements).sort(), tags, 'Removed components must not survive in the published registry');
  });
  for (const file of sourceFiles) {
    const tag = `kima-${file.slice(0, -'.ce.vue'.length)}`;
    const name = `Kima${tag.slice(5).split('-').map(word => word[0].toUpperCase() + word.slice(1)).join('')}`;
    assert.ok(library[name], `Missing named Vue export ${name}`);
    assert.equal(library[name].styles, undefined, `${name} must use extracted Vue CSS`);
    assert.ok(elements[tag]?.styles?.length, `Missing inline element CSS for ${tag}`);
    assert.ok(css.includes(library[name].__scopeId), `Missing scoped Vue CSS for ${name}`);
    report.components++;
  }
  check('Source discovery matches actual exports', () => assert.equal(report.components, library.componentNames.length, 'Build is stale'));
  for (const slug of [...sourceFiles.map(file => file.slice(0, -'.ce.vue'.length)), 'core']) {
    const entry = new URL(`dist/styles/${slug}.css`, root);
    const imports = [...(await readFile(entry, 'utf8')).matchAll(/@import "([^"]+)";/g)].map(match => match[1]);
    assert.ok(imports.includes('_tokens.css'), `Missing tokens: ${slug}`);
    assert.equal(imports.length, new Set(imports).size, `Duplicate CSS dependency: ${slug}`);
    const contents = await Promise.all(imports.map(file => readFile(new URL(file, entry), 'utf8')));
    assert.ok(contents.every(content => content.length > 0));
    if (slug !== 'core') assert.ok(contents.join('\n').includes(elements[`kima-${slug}`].__scopeId), `Missing own scoped CSS: ${slug}`);
  }
  const publishedScopes = new Set(Object.values(elements).map(component => component.__scopeId));
  for (const slug of sourceFiles.map(file => file.slice(0, -'.ce.vue'.length))) {
    const entry = new URL(`dist/styles/${slug}.css`, root);
    const imports = [...(await readFile(entry, 'utf8')).matchAll(/@import "([^"]+)";/g)].map(match => match[1]);
    const scoped = (await Promise.all(imports.map(file => readFile(new URL(file, entry), 'utf8')))).join('\n');
    const runtimeScope = elements[`kima-${slug}`].__scopeId;
    const scopes = [...new Set([...scoped.matchAll(/data-v-[a-f0-9]+/g)].map(match => match[0]))];
    assert.ok(scopes.includes(runtimeScope), `${slug}: CSS must include own runtime scope ${runtimeScope}`);
    assert.ok(scopes.every(scope => publishedScopes.has(scope)), `${slug}: CSS contains unpublished scope ${scopes.join(', ')}`);
  }
  report.checks.push('All component CSS entries resolve tokens, transitive styles and runtime scope IDs');
  for (const [tag, selectors] of Object.entries({
    'kima-code-editor': ['.cm-editor', '.cm-textfield', '.cm-panel.cm-search'],
    'kima-rich-text-editor': ['.tiptap', ':first-child', 'text-decoration:underline'],
    'kima-menu': ['.kima-shell-menu__popup', '.kima-shell-menu__item'],
  })) {
    check(`${tag}: inline scoped nested styles`, () => {
      const component = elements[tag], inline = component.styles.join('\n');
      assert.ok(inline.includes(component.__scopeId), `${tag} inline CSS must keep scope ID`);
      for (const selector of selectors) assert.ok(inline.includes(selector), `${tag} lost nested style ${selector}`);
    });
  }
  const size = report.sizes['kima-elements.js'];
  const coreSize = report.sizes['kima-elements-core.js'];
  console.warn(`SIZE WARNING: default /elements includes ALL engines: ${size.bytes} bytes (${(size.bytes / 1e6).toFixed(2)} MB), gzip ${size.gzipBytes} bytes. Prefer /elements/core (${(coreSize.bytes / 1e3).toFixed(0)} KB, gzip ${(coreSize.gzipBytes / 1e3).toFixed(0)} KB) or Vue named imports.`);
  report.exitCode = 0;
} catch (error) {
  report.failure = error.stack || String(error);
  process.exitCode = 1;
  console.error(error);
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(new URL('artifacts/verify-package-result.json', root), JSON.stringify(report, null, 2));
  console.log(`verify:lib exit=${report.exitCode}; components=${report.components}; checks=${report.checks.length}; sizes=${JSON.stringify(report.sizes)}`);
}
