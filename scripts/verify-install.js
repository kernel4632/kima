/* Actual tarball acceptance: isolated production consumers, served only by node:http.
 * No repository source aliases, Vite server, or runtime dependency rewriting.
 */
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile, copyFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import { chromium, firefox, webkit, expect } from '@playwright/test';
import { componentTiers } from '../src/component-tiers.js';

const requestedBrowsers = new Set(
  (process.env.KIMA_VERIFY_BROWSERS || 'chromium,firefox,webkit')
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean),
);

const root = fileURLToPath(new URL('../', import.meta.url));
const artifacts = join(root, 'artifacts');
const report = { startedAt: new Date().toISOString(), exitCode: 1, tests: [], builds: {}, errors: [], consoleMessages: [], requests: [] };
let consumer, browser, server, page;
function npm(args, cwd = root) {
  try {
    return execFileSync(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    console.error(error.stdout?.toString(), error.stderr?.toString());
    throw error;
  }
}
async function test(name, run) {
  const start = Date.now();
  try { await run(); report.tests.push({ name, status: 'passed', durationMs: Date.now() - start }); console.log(`PASS ${name}`); }
  catch (error) { report.tests.push({ name, status: 'failed', error: error.stack }); throw error; }
}
const menuItems = [{ value: 'file', label: 'File', children: [{ value: 'export', label: 'Export', children: [{ value: 'save', label: 'Save package' }] }] }];
const documentShell = (body, script) => `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="data:,"><style>body{margin:24px;background:var(--kima-color-surface);color:var(--kima-color-on-surface);font-family:var(--kima-font-family)}kima-code-editor,kima-rich-text-editor,.kima-code-editor,.kima-rich-text-editor{display:block;margin-block:24px}</style></head><body>${body}<script type="module" src="${script}"></script></body></html>`;
const nativeBody = `<kima-button id="action">Native action</kima-button><output id="result">Native 0</output>
<kima-textarea label="Notes"></kima-textarea><kima-popover label="Details" content-label="Project details"><p>Installed popover</p></kima-popover>
<kima-code-editor id="code" label="Package code" model-value="const initial = 1;"></kima-code-editor><output id="code-value"></output>
<kima-rich-text-editor id="rich" label="Package document" model-value="<p>Initial document</p>"></kima-rich-text-editor><output id="rich-value"></output>
<kima-qr-code id="qr" value="https://kima.example/initial" label="Package QR"></kima-qr-code><button id="qr-update">Update QR</button>
<kima-menu id="menu" label="Package menu"></kima-menu><output id="menu-value"></output>`;
const nativeSetup = `let count=0;document.querySelector('#action').addEventListener('click',()=>{document.querySelector('#result').textContent='Native '+ ++count;});
const code=document.querySelector('#code'),rich=document.querySelector('#rich'),menu=document.querySelector('#menu');
menu.items=${JSON.stringify(menuItems)};
code.addEventListener('update:modelValue',e=>document.querySelector('#code-value').textContent=e.detail[0]);
rich.addEventListener('update:modelValue',e=>document.querySelector('#rich-value').textContent=e.detail[0]);
menu.addEventListener('select',e=>document.querySelector('#menu-value').textContent=e.detail[0]);
document.querySelector('#qr-update').onclick=()=>document.querySelector('#qr').value='https://kima.example/updated-二维码';`;

try {
  await mkdir(artifacts, { recursive: true });
  const packed = JSON.parse(npm(['pack', '--ignore-scripts', '--json', '--pack-destination', 'artifacts']))[0];
  const tarball = resolve(artifacts, packed.filename);
  report.tarball = { filename: packed.filename, bytes: packed.size, unpackedBytes: packed.unpackedSize, integrity: packed.integrity };
  const files = packed.files.map(file => file.path);
  for (const file of ['dist/kima.js', 'dist/kima-elements.js', 'dist/kima-elements-core.js', 'dist/kima-theme.js', 'dist/style.css', 'dist/THIRD_PARTY_NOTICES.txt', 'README.md', 'LICENSE']) assert.ok(files.includes(file), `缺少发布文件 ${file}`);
  assert.ok(files.every(file => file.startsWith('dist/') || ['package.json', 'README.md', 'LICENSE'].includes(file)), '不应打包源码、测试或站点资产');
  consumer = await mkdtemp(join(tmpdir(), 'kima-consumer-'));
  report.isolatedDirectory = consumer;
  await writeFile(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  console.log(`Installing ${packed.filename} into isolated consumer...`);
  const installLog = npm(['install', '--ignore-scripts', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org', tarball, 'vue@^3.5.42', 'vite@^8.3.5'], consumer);
  await writeFile(join(artifacts, 'verify-install-npm.log'), installLog);
  console.log(installLog);
  await writeFile(join(consumer, 'index.html'), documentShell('<div id="app"></div>', '/vue.js'));
  await writeFile(join(consumer, 'vue.js'), `import {createApp,h,ref} from 'vue';
import {File01Icon} from '@hugeicons/core-free-icons';
import {KimaButton,KimaTextField,KimaSelect,KimaTextarea,KimaRadioGroup,KimaListbox,KimaList,KimaDrawer,KimaPopover,KimaCodeEditor,KimaRichTextEditor,KimaQrCode,KimaMenu} from '@kernel4632/kima';
${['button', 'text-field', 'select', 'textarea', 'radio-group', 'listbox', 'list', 'drawer', 'popover', 'code-editor', 'rich-text-editor', 'qr-code', 'menu'].map(slug => "import '@kernel4632/kima/styles/" + slug + ".css';").join('\n')}
import {applyPalette} from '@kernel4632/kima/theme';
applyPalette('#61afef');
createApp({setup(){const count=ref(0),notes=ref('Initial'),code=ref('const initial = 1;'),rich=ref('<p>Initial document</p>'),qr=ref('https://kima.example/initial'),selected=ref(''),drawerOpen=ref(false);return()=>h('main',[
 h(KimaButton,{onClick:()=>count.value++},()=> 'Vue '+count.value),
 h('div',{id:'field-width',style:{width:'760px',maxWidth:'100%',display:'flex',flexDirection:'column',gap:'16px'}},[
   h(KimaTextField,{label:'Provider name'}),h(KimaSelect,{label:'Provider type',items:[{value:'a',label:'Provider A'}]})]),
 h(KimaTextarea,{modelValue:notes.value,'onUpdate:modelValue':v=>notes.value=v,label:'Notes'}),h('output',{id:'notes'},notes.value),
 h(KimaRadioGroup,{label:'Direction',name:'direction',options:[{value:'design',label:'Design',description:'Design mode'},{value:'code',label:'Code',description:'Implementation mode'},{value:'locked',label:'Locked',disabled:true}],modelValue:'design'}),
 h(KimaListbox,{id:'permissions',label:'Permissions',name:'permission',options:[{value:'read',label:'Read',description:'Read files'},{value:'write',label:'Write',icon:File01Icon}],modelValue:selected.value,'onUpdate:modelValue':v=>selected.value=v}),
 h(KimaListbox,{id:'custom-permissions',label:'Custom permissions',options:[{value:'read',label:'Read',description:'Read files'},{value:'write',label:'Write'}],modelValue:'read'},{option:({item,selected})=>h('div',{class:'consumer-custom-option','data-selected':String(selected)},[h('strong',item.label),h('small',item.description || 'No description')])}),
 h(KimaList,{id:'plain-list',variant:'plain',gap:20,items:[{id:'one',title:'Plain one'},{id:'two',title:'Plain two'}]}),
 h(KimaMenu,{label:'More actions',iconOnly:true,size:'small',items:[{value:'run',label:'Run task'}]}),
 h('button',{id:'drawer-open',onClick:()=>drawerOpen.value=true},'Open long drawer'),
 h(KimaDrawer,{open:drawerOpen.value,title:'Persistent heading',onClose:()=>drawerOpen.value=false},{default:()=>Array.from({length:24},(_,i)=>h('p',{class:'drawer-test-row'},'Long content row '+(i+1))),footer:()=>h('button',{id:'drawer-footer'},'Drawer action')}),
 h(KimaPopover,{label:'Details',contentLabel:'Project details'},()=>h('p','Installed popover')),
 h(KimaCodeEditor,{modelValue:code.value,'onUpdate:modelValue':v=>code.value=v,label:'Package code'}),h('output',{id:'code-value'},code.value),
 h(KimaRichTextEditor,{modelValue:rich.value,'onUpdate:modelValue':v=>rich.value=v,label:'Package document'}),h('output',{id:'rich-value'},rich.value),
 h(KimaQrCode,{value:qr.value,label:'Package QR'}),h('button',{id:'qr-update',onClick:()=>qr.value='https://kima.example/updated-二维码'},'Update QR'),
 h(KimaMenu,{items:${JSON.stringify(menuItems)},label:'Package menu',onSelect:v=>selected.value=v}),h('output',{id:'menu-value'},selected.value)
])}}).mount('#app');`);
  await writeFile(join(consumer, 'native.html'), documentShell(nativeBody, '/native.js'));
  await writeFile(join(consumer, 'native.js'), `import '@kernel4632/kima/elements';\n${nativeSetup}`);
  const coreBody = '<kima-button id="action">Core action</kima-button><output id="result">0</output><div id="field-width" style="width:760px;max-width:100%;display:flex;flex-direction:column;gap:16px"><kima-text-field label="Core input"></kima-text-field><kima-select label="Core select"></kima-select></div><kima-radio-group id="radio" label="Mode"></kima-radio-group>';
  const coreSetup = `const radio=document.querySelector('#radio');radio.options=[{value:'design',label:'Design',description:'Design mode'},{value:'code',label:'Code'}];document.querySelector('#action').addEventListener('click',()=>document.querySelector('#result').textContent='1');`;
  await writeFile(join(consumer, 'core.html'), documentShell(coreBody, '/core.js'));
  // Deliberately use a bare import: a binding import would mask a missing sideEffects declaration.
  await writeFile(join(consumer, 'core.js'), `import '@kernel4632/kima/elements/core';\n${coreSetup}`);
  const controls = { button: ['KimaButton'], code: ['KimaButton', 'KimaCodeEditor'], rich: ['KimaButton', 'KimaRichTextEditor'], equation: ['KimaButton', 'KimaEquation'], qr: ['KimaButton', 'KimaQrCode'], highlight: ['KimaButton', 'KimaCodeBlock'] };
  for (const [name, exports] of Object.entries(controls)) {
    await writeFile(join(consumer, `${name}.html`), documentShell('<div id="app"></div>', `/${name}.js`));
    await writeFile(join(consumer, `${name}.js`), `import {createApp,h} from 'vue';import {${exports.join(',')}} from '@kernel4632/kima';import '@kernel4632/kima/styles/button.css';createApp({render:()=>h('main',[${exports.map(value => `h(${value},null,()=> 'Tree shaking button')`).join(',') }])}).mount('#app');`);
  }
  for (const [name, css] of [['core-css', 'styles/core.css'], ['legacy-css', 'style.css']]) {
    await writeFile(join(consumer, `${name}.html`), documentShell('<div id="app"></div>', `/${name}.js`));
    await writeFile(join(consumer, `${name}.js`), `import {createApp,h} from 'vue';import {KimaButton} from '@kernel4632/kima';import '@kernel4632/kima/${css}';createApp({render:()=>h(KimaButton,null,()=> '${name}')}).mount('#app');`);
  }
  // Capture actual output module metadata, not a grep for minified engine strings.
  await writeFile(join(consumer, 'build.mjs'), `import {build} from 'vite';import {writeFile} from 'node:fs/promises';
const reports={};for(const [name,input] of Object.entries({production:{vue:'index.html',native:'native.html',core:'core.html',coreCss:'core-css.html',legacyCss:'legacy-css.html'},${Object.keys(controls).map(name => `${name}:'${name}.html'`).join(',')}})){
await build({configFile:false,logLevel:'warn',plugins:[{name:'consumer-output-evidence',generateBundle(_,bundle){reports[name]=Object.values(bundle).filter(v=>v.type==='chunk').map(chunk=>({fileName:chunk.fileName,bytes:Buffer.byteLength(chunk.code),imports:chunk.imports,dynamicImports:chunk.dynamicImports,modules:Object.entries(chunk.modules).map(([id,module])=>({id,renderedLength:module.renderedLength,renderedExports:module.renderedExports,removedExports:module.removedExports}))}));}}],build:{outDir:name==='production'?'dist':'control-'+name,rolldownOptions:{input}}});}
await writeFile('consumer-builds.json',JSON.stringify(reports,null,2));`);
  const buildLog = execFileSync(process.execPath, ['build.mjs'], { cwd: consumer, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  await writeFile(join(artifacts, 'verify-install-consumer-build.log'), buildLog);
  const metadata = JSON.parse(await readFile(join(consumer, 'consumer-builds.json'), 'utf8'));
  await writeFile(join(artifacts, 'verify-install-build-modules.json'), JSON.stringify(metadata, null, 2));
  for (const [name, chunks] of Object.entries(metadata)) report.builds[name] = { jsBytes: chunks.reduce((sum, chunk) => sum + chunk.bytes, 0), chunks: chunks.length };
  await test('button-only component CSS is small and excludes unrelated styles', async () => {
    const assets = await readdir(join(consumer, 'control-button/assets'));
    const sheets = await Promise.all(assets.filter(file => file.endsWith('.css')).map(file => readFile(join(consumer, 'control-button/assets', file), 'utf8')));
    const css = sheets.join('\n');
    report.buttonCssBytes = Buffer.byteLength(css);
    assert.ok(report.buttonCssBytes > 1_000 && report.buttonCssBytes < 30_000, `Unexpected button CSS: ${report.buttonCssBytes}`);
    assert.match(css, /--kima-color-primary:/);
    assert.match(css, /\.kima-button/);
    assert.doesNotMatch(css, /\.kima-(?:text-field|code-editor|rich-text-editor|shell-menu|date-picker)[\s.:{_]/);
  });
  await test('button-only named import tree shaking (module metadata + five positive size controls)', async () => {
    const buttonBytes = report.builds.button.jsBytes;
    assert.ok(buttonBytes < 200_000, `Button-only includes unexpected code: ${buttonBytes} bytes`);
    const modules = metadata.button.flatMap(chunk => chunk.modules);
    // 组件按文档分组放在子目录里，路径中间多一层组名。
    assert.ok(modules.some(module => /@kernel4632\/kima\/dist\/vue\/components\/(?:[^/]+\/)?button\.ce\.js$/.test(module.id.replaceAll('\\', '/'))), '必须消费真实发布包的按钮模块');
    for (const module of modules) assert.doesNotMatch(module.id.replaceAll('\\', '/'), /\/(?:@codemirror|@lezer|@tiptap|prosemirror-[^/]+|katex|qrcode-generator|highlight\.js)\//, 'Button-only must not include engine modules');
    for (const [name, exports] of Object.entries(controls)) {
      if (name === 'button') continue;
      assert.ok(report.builds[name].jsBytes > buttonBytes + 1_000, `${name} engine positive control must add real code`);
      const component = exports[1].slice(4).replace(/[A-Z]/g, (letter, index) => `${index ? '-' : ''}${letter.toLowerCase()}`);
      const rendered = metadata[name].flatMap(chunk => chunk.modules);
      assert.ok(rendered.some(module => { const id = module.id.replaceAll('\\', '/'); return id.includes('/components/') && id.endsWith(`/${component}.ce.js`) && module.renderedLength > 0; }), `${name} positive control component missing in build metadata`);
      const engine = { code: '/@codemirror/', rich: '/@tiptap/', equation: '/katex/', qr: '/qrcode-generator/', highlight: '/highlight.js/' }[name];
      assert.ok(rendered.some(module => module.id.replaceAll('\\', '/').includes(engine) && module.renderedLength > 0), `${name} positive control engine missing in build metadata`);
    }
    assert.ok(buttonBytes < Math.min(report.builds.code.jsBytes, report.builds.rich.jsBytes, report.builds.equation.jsBytes) * 0.35, 'Button must be substantially smaller than each large engine consumer');
    const buttonExports = modules.flatMap(module => module.renderedExports || []);
    for (const name of Object.values(controls).flat().filter(name => name !== 'KimaButton')) assert.ok(!buttonExports.includes(name), `${name} must be tree shaken`);
  });
  const standalone = await readFile(join(consumer, 'node_modules/@kernel4632/kima/dist/kima-elements.js'));
  report.elements = { bytes: standalone.length, gzipBytes: gzipSync(standalone).length };
  console.warn(`SIZE WARNING: default /elements registers ALL components and bundles ALL engines: ${standalone.length} bytes (${(standalone.length / 1e6).toFixed(2)} MB), gzip ${report.elements.gzipBytes} bytes. Use Vue named imports for tree shaking.`);
  await copyFile(join(consumer, 'node_modules/@kernel4632/kima/dist/kima-elements.js'), join(consumer, 'dist/kima-elements.js'));
  // standalone has precisely one library file plus a consumer-owned setup script, no CSS or node_modules.
  await writeFile(join(consumer, 'dist/standalone.html'), documentShell(nativeBody, './standalone.js'));
  await writeFile(join(consumer, 'dist/standalone.js'), `import './kima-elements.js';\n${nativeSetup}`);
  await copyFile(join(consumer, 'node_modules/@kernel4632/kima/dist/kima-elements-core.js'), join(consumer, 'dist/kima-elements-core.js'));
  await writeFile(join(consumer, 'dist/core-standalone.html'), documentShell(coreBody, './core-standalone.js'));
  await writeFile(join(consumer, 'dist/core-standalone.js'), `import './kima-elements-core.js';\n${coreSetup}`);
  for (const [first, second] of [['core', 'full'], ['full', 'core']]) {
    const file = name => name === 'core' ? 'kima-elements-core.js' : 'kima-elements.js';
    await writeFile(join(consumer, `dist/${first}-then-${second}.html`), documentShell(coreBody, `./${first}-then-${second}.js`));
    await writeFile(join(consumer, `dist/${first}-then-${second}.js`), `import './${file(first)}';\n${coreSetup}\nwindow.loadOther=()=>import('./${file(second)}');`);
  }
  server = createServer(async (request, response) => {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(consumer, 'dist', `.${path === '/' ? '/index.html' : path}`);
    report.requests.push(path);
    try {
      assert.ok(file.startsWith(resolve(consumer, 'dist') + sep));
      const content = await readFile(file);
      response.setHeader('Content-Type', { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2' }[extname(file)] || 'application/octet-stream');
      response.end(content);
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(15_000);
  page.on('pageerror', error => report.errors.push(error.stack || error.message));
  page.on('console', message => { if (['warning', 'error'].includes(message.type())) report.consoleMessages.push({ type: message.type(), text: message.text() }); });
  page.on('response', response => { if (response.status() >= 400) report.errors.push(`HTTP ${response.status()} ${response.url()}`); });
  page.on('requestfailed', request => report.errors.push(`Request failed ${request.url()}: ${request.failure()?.errorText}`));
  const style = (locator, property) => locator.evaluate((node, property) => getComputedStyle(node).getPropertyValue(property), property);
  async function fieldWidths(name) {
    await test(`${name}: select and text field fill the same responsive column`, async () => {
      const column = page.locator('#field-width');
      for (const width of [760, 280]) {
        await column.evaluate((node, width) => node.style.width = `${width}px`, width);
        const input = await column.locator('.kima-text-field').boundingBox();
        const select = await column.locator('.kima-select').boundingBox();
        assert.ok(input && select);
        assert.ok(Math.abs(input.width - width) < 1, `Input must fill ${width}px`);
        assert.ok(Math.abs(select.width - input.width) < 1, `Select ${select.width}px differs from input ${input.width}px`);
      }
      await column.evaluate(node => node.style.width = '760px');
      await column.evaluate(node => { node.style.height = '80px'; node.style.overflow = 'auto'; });
      await column.locator('.kima-select__trigger').click();
      const popup = page.locator('.kima-select__popup');
      await expect(popup).toBeVisible();
      assert.equal(await style(popup, 'position'), 'fixed', 'Select popup must escape scroll containers');
      const popupBox = await popup.boundingBox();
      const popupDiagnostic = await popup.evaluate(node => ({ top: node.getBoundingClientRect().top, bottom: node.getBoundingClientRect().bottom, height: node.getBoundingClientRect().height, inline: node.getAttribute('style'), maxHeight: getComputedStyle(node).maxHeight }));
      assert.ok(popupBox && popupBox.y + popupBox.height <= 1000, `Select popup must remain in viewport: ${JSON.stringify({ popupBox, popupDiagnostic })}`);
      await page.keyboard.press('Escape');
      await column.evaluate(node => { node.style.height = ''; node.style.overflow = ''; });
    });
  }
  async function interactions(kind, path) {
    await page.goto(origin + path);
    if (kind === 'Vue') await fieldWidths(kind);
    await test(`${kind}: button click + actual style`, async () => {
      const button = page.getByRole('button', { name: kind === 'Vue' ? 'Vue 0' : 'Native action', exact: true });
      await expect(button).toBeVisible();
      assert.ok(parseFloat(await style(button, 'border-radius')) >= 12);
      await button.click();
      if (kind === 'Vue') await expect(page.getByRole('button', { name: 'Vue 1', exact: true })).toBeVisible();
      else await expect(page.locator('#result')).toHaveText('Native 1');
    });
    await test(`${kind}: textarea + popover close`, async () => {
      await page.getByRole('textbox', { name: 'Notes', exact: true }).fill('Installed input');
      const nativeSelect = page.locator('.kima-select__native');
      if (await nativeSelect.count()) {
        const nativeBox = await nativeSelect.boundingBox();
        assert.ok(nativeBox && nativeBox.width <= 2 && nativeBox.height <= 2, 'Native select must remain visually hidden');
      }
      await expect(page.getByRole('textbox', { name: 'Notes', exact: true })).toHaveValue('Installed input');
      if (kind === 'Vue') {
        await expect(page.locator('#notes')).toHaveText('Installed input');
        const readOption = page.locator('#permissions [role="option"]', { hasText: 'Read' }).first();
        await expect(readOption).toBeVisible();
        await readOption.click();
        await expect(readOption).toHaveAttribute('aria-selected', 'true');
        await expect(readOption.locator('svg')).toHaveCount(1);
        await expect(page.locator('input[type="hidden"][name="permission"]')).toHaveValue('read');
        await page.getByRole('radio', { name: /^Code/ }).check();
        await expect(page.getByRole('radio', { name: /^Code/ })).toBeChecked();
        assert.equal(await style(page.locator('.kima-radio-group__item--disabled'), 'cursor'), 'not-allowed');
        const customListboxOption = page.locator('#custom-permissions .consumer-custom-option').first();
        await expect(customListboxOption).toContainText('Read files');
        await expect(customListboxOption).toHaveAttribute('data-selected', 'true');
        const menuTrigger = page.getByRole('button', { name: 'More actions', exact: true });
        await expect(menuTrigger).toBeVisible();
        assert.ok(parseFloat(await style(menuTrigger, 'min-height')) <= 48);
        await menuTrigger.click();
        await expect(page.getByRole('menuitemradio', { name: 'Run task' })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(menuTrigger).toBeFocused();
        const plainItem = page.locator('#plain-list .kima-list__item').first();
        assert.equal(await style(plainItem, 'padding-top'), '0px');
        assert.equal(await style(page.locator('#plain-list'), 'row-gap'), '20px');
        await page.setViewportSize({ width: 320, height: 700 });
        await page.locator('#drawer-open').click();
        const drawer = page.getByRole('dialog', { name: 'Persistent heading' });
        await expect(drawer).toBeVisible();
        const close = drawer.getByRole('button', { name: '关闭' });
        await expect(close).toBeVisible();
        const initialHeaderY = await drawer.locator('.kima-drawer__header').evaluate(node => node.getBoundingClientRect().top);
        await drawer.locator('.kima-drawer__body').evaluate(node => { node.scrollTop = node.scrollHeight; });
        assert.equal(await drawer.locator('.kima-drawer__header').evaluate(node => node.getBoundingClientRect().top), initialHeaderY, 'Drawer header must stay fixed while body scrolls');
        await expect(close).toBeVisible();
        await expect(drawer.locator('#drawer-footer')).toBeVisible();
        await close.click();
        await page.setViewportSize({ width: 1440, height: 1000 });
      }
      await page.getByRole('button', { name: 'Details', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Project details' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog', { name: 'Project details' })).toBeHidden();
    });
    await test(`${kind}: CodeMirror edit/model + search nested scoped CSS + undo/redo`, async () => {
      const editor = page.locator('.cm-content');
      await expect(editor).toHaveAttribute('contenteditable', 'true');
      await editor.fill('const installed = 42;');
      await expect(page.locator('#code-value')).toHaveText('const installed = 42;');
      const host = page.locator('.kima-code-editor');
      await host.getByRole('button', { name: '查找', exact: true }).click();
      const search = page.locator('.cm-search input[name="search"]');
      await expect(search).toBeVisible();
      await search.pressSequentially('installed');
      await search.press('Enter');
      await expect(page.locator('.kima-code-editor__selection')).toContainText('选区 6–15');
      assert.equal(await style(search, 'border-top-width'), '0px', 'Scoped nested search field border must survive CE build');
      assert.ok(parseFloat(await style(search, 'border-radius')) >= 8, 'Scoped nested search field radius must survive CE build');
      assert.ok(parseFloat(await style(page.locator('.cm-panel.cm-search'), 'padding-top')) >= 12);
      assert.ok(parseFloat(await style(page.locator('.cm-editor'), 'max-height')) >= 400, 'Scoped editor max-height must survive');
      await search.press('Escape');
      await host.getByRole('button', { name: '撤销', exact: true }).click();
      await expect(editor).toHaveText('const initial = 1;');
      await host.getByRole('button', { name: '重做', exact: true }).click();
      await expect(editor).toHaveText('const installed = 42;');
    });
    await test(`${kind}: Tiptap edit/model + formatting + link nested scoped CSS`, async () => {
      const editor = page.getByRole('textbox', { name: 'Package document', exact: true });
      const host = page.locator('.kima-rich-text-editor');
      await editor.fill('Installed rich text');
      await expect(page.locator('#rich-value')).toContainText('Installed rich text');
      await editor.press('ControlOrMeta+a');
      await host.getByRole('button', { name: '粗体', exact: true }).click();
      await expect(editor.locator('strong')).toHaveText('Installed rich text');
      await expect(page.locator('#rich-value')).toContainText('<strong>');
      await host.getByRole('button', { name: '链接', exact: true }).click();
      await page.getByRole('textbox', { name: '链接地址' }).fill('https://example.com/package');
      await host.getByRole('button', { name: '应用链接', exact: true }).click();
      const link = editor.locator('a');
      await expect(link).toHaveAttribute('href', 'https://example.com/package');
      assert.equal(await style(link, 'text-decoration-line'), 'underline');
      const lineHeight = parseFloat(await style(editor, 'line-height')), fontSize = parseFloat(await style(editor, 'font-size'));
      assert.ok(Math.abs(lineHeight / fontSize - 1.8) < 0.02, 'Tiptap deep scoped line-height must survive');
      assert.equal(await style(editor.locator('p'), 'margin-top'), '0px', 'Nested first-child CSS must survive');
      assert.ok(parseFloat(await style(editor, 'min-height')) >= 190);
    });
    await test(`${kind}: QR encoder SVG + token styles + reactive update`, async () => {
      const svg = page.getByRole('img', { name: 'Package QR', exact: true });
      await expect(svg).toBeVisible();
      const path = svg.locator('path'), previous = await path.getAttribute('d');
      assert.ok(previous.length > 1000, '必须生成真实二维码矩阵');
      assert.equal(await style(svg, 'shape-rendering'), 'crispedges');
      assert.notEqual(await style(path, 'fill'), await style(svg.locator('rect'), 'fill'));
      await page.locator('#qr-update').click();
      await expect(path).not.toHaveAttribute('d', previous);
    });
    await test(`${kind}: three-level menu keyboard selection + nested popup/item styles`, async () => {
      await page.getByRole('button', { name: 'Package menu', exact: true }).click();
      const file = page.getByRole('menuitem', { name: 'File', exact: true });
      await file.focus(); await file.press('ArrowRight');
      const exp = page.getByRole('menuitem', { name: 'Export', exact: true });
      await expect(exp).toBeVisible();
      await exp.focus(); await exp.press('ArrowRight');
      const save = page.getByRole('menuitemradio', { name: 'Save package', exact: true });
      await expect(save).toBeVisible();
      assert.equal(await style(save, 'display'), 'flex');
      assert.ok(parseFloat(await style(save, 'min-height')) >= 40);
      const popup = page.locator('[data-kima-submenu]').last();
      assert.ok(parseFloat(await style(popup, 'border-radius')) >= 8);
      assert.ok(!['rgba(0, 0, 0, 0)', 'transparent'].includes(await style(popup, 'background-color')));
      await save.press('Enter');
      await expect(page.locator('#menu-value')).toHaveText('save');
      await expect(save).toBeHidden();
      await expect(page.getByRole('button', { name: 'Save package', exact: true })).toBeFocused();
      await expect(page.locator('[data-kima-submenu]')).toHaveCount(0);
    });
    await page.screenshot({ path: join(artifacts, `verify-install-${kind.toLowerCase()}.png`), fullPage: true });
  }
  await interactions('Vue', '/');
  await interactions('Native', '/native.html');
  const requestStart = report.requests.length;
  await interactions('Standalone', '/standalone.html');
  await test('standalone static HTTP requests have no Vite, CSS, node_modules, or runtime chunks', async () => {
    const requests = report.requests.slice(requestStart);
    assert.ok(requests.includes('/kima-elements.js'));
    assert.deepEqual([...new Set(requests)].sort(), ['/kima-elements.js', '/standalone.html', '/standalone.js']);
  });
  const fullCssLength = await page.locator('#kima-component-styles').evaluate(node => node.textContent.length);
  async function coreChecks(name, path) {
    await test(`${name}: core registration, native interaction and inline styles`, async () => {
      await page.goto(origin + path);
      const button = page.getByRole('button', { name: 'Core action', exact: true });
      await expect(button).toBeVisible();
      assert.ok(parseFloat(await style(button, 'border-radius')) >= 12);
      await button.click(); await expect(page.locator('#result')).toHaveText('1');
      await page.getByRole('textbox', { name: 'Core input', exact: true }).fill('Published core');
      await expect(page.getByRole('radio', { name: /^Design/ })).toBeVisible();
      const registered = await page.evaluate(slugs => slugs.filter(slug => customElements.get(`kima-${slug}`)), Object.values(componentTiers).flat());
      assert.deepEqual(registered.sort(), [...componentTiers.core].sort(), 'Core must register exactly its tier, without extras');
      await expect(page.locator('#kima-component-styles')).toHaveCount(1);
    });
    await fieldWidths(name);
  }
  await coreChecks('Chromium production bare import', '/core.html');
  await coreChecks('Chromium standalone', '/core-standalone.html');
  await page.screenshot({ path: join(artifacts, 'verify-install-core.png'), fullPage: true });
  for (const [first, second] of [['core', 'full'], ['full', 'core']]) {
    await test(`${first} then ${second}: stable constructors and nonduplicated CSS`, async () => {
      await page.goto(`${origin}/${first}-then-${second}.html`);
      await expect(page.getByRole('button', { name: 'Core action', exact: true })).toBeVisible();
      const result = await page.evaluate(async () => {
        const constructor = customElements.get('kima-button');
        await window.loadOther(); await window.loadOther();
        return { stable: constructor === customElements.get('kima-button'), cssLength: document.getElementById('kima-component-styles').textContent.length, extra: Boolean(customElements.get('kima-code-editor')) };
      });
      assert.equal(result.stable, true); assert.equal(result.extra, true);
      assert.equal(result.cssLength, fullCssLength);
      await expect(page.locator('#kima-component-styles')).toHaveCount(1);
      await page.getByRole('button', { name: 'Core action', exact: true }).click();
      await expect(page.locator('#result')).toHaveText('1');
    });
  }
  // Small release-consumer smoke only; not a claim of all-component cross-browser/a11y review.
  for (const engine of [firefox, webkit].filter((engine) => requestedBrowsers.has(engine.name()))) {
    const otherBrowser = await engine.launch();
    const previousPage = page;
    try {
      page = await otherBrowser.newPage();
      page.on('pageerror', error => report.errors.push(`${engine.name()}: ${error.message}`));
      await coreChecks(`${engine.name()} production bare import`, '/core.html');
      await coreChecks(`${engine.name()} standalone`, '/core-standalone.html');
    } finally { page = previousPage; await otherBrowser.close(); }
  }
  // Serve the button-only result as a second production root, then restore for diagnostics.
  await mkdir(join(consumer, 'dist/button-control'), { recursive: true });
  async function copyTree(from, to) {
    await mkdir(to, { recursive: true });
    for (const entry of await readdir(from, { withFileTypes: true })) {
      if (entry.isDirectory()) await copyTree(join(from, entry.name), join(to, entry.name));
      else await copyFile(join(from, entry.name), join(to, entry.name));
    }
  }
  await copyTree(join(consumer, 'control-button'), join(consumer, 'dist/button-control'));
  // Vite emits root-absolute asset URLs; copy button assets into the same static root.
  await copyTree(join(consumer, 'control-button/assets'), join(consumer, 'dist/assets'));
  await test('button-only tree-shaken production bundle mounts in browser', async () => {
    await page.goto(`${origin}/button-control/button.html`);
    const button = page.getByRole('button', { name: 'Tree shaking button' });
    await expect(button).toBeVisible();
    assert.ok(parseFloat(await style(button, 'border-radius')) >= 12);
    assert.ok(parseFloat(await style(button, 'min-height')) >= 40);
    await button.click();
    await page.screenshot({ path: join(artifacts, 'verify-install-button-css.png') });
  });
  for (const name of ['core-css', 'legacy-css']) {
    await test(`${name}: compatible styled button in production consumer`, async () => {
      await page.goto(`${origin}/${name}.html`);
      const button = page.getByRole('button', { name, exact: true });
      await expect(button).toBeVisible();
      assert.ok(parseFloat(await style(button, 'border-radius')) >= 12);
      assert.ok(parseFloat(await style(button, 'min-height')) >= 40);
      await button.click();
    });
  }
  await test('all production consumers: no runtime, network, or console errors', async () => {
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.consoleMessages.filter(message => message.type === 'error'), []);
  });
  report.exitCode = 0;
} catch (error) {
  report.failure = error.stack || String(error);
  console.error(error);
  if (page) {
    await writeFile(join(artifacts, 'verify-install-failure.json'), JSON.stringify({ url: page.url(), errors: report.errors, consoleMessages: report.consoleMessages, accessibility: await page.locator('body').ariaSnapshot().catch(() => ''), dom: await page.content().catch(() => '') }, null, 2));
    await page.screenshot({ path: join(artifacts, 'verify-install-failure.png'), fullPage: true }).catch(() => {});
  }
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (server) { server.closeAllConnections(); await new Promise(done => server.close(done)); }
  if (consumer) await rm(consumer, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  report.finishedAt = new Date().toISOString();
  report.passed = report.tests.filter(test => test.status === 'passed').length;
  report.failed = report.tests.filter(test => test.status === 'failed').length;
  await writeFile(join(artifacts, 'verify-install-result.json'), JSON.stringify(report, null, 2));
  console.log(`verify:install exit=${report.exitCode}; consumer tests=${report.tests.length}; passed=${report.passed}; failed=${report.failed}; sizes=${JSON.stringify(report.builds)}`);
}
