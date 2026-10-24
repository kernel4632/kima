/* Collect licenses from packages actually included in standalone output, not all dev dependencies. */
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, parse } from 'node:path';

export function thirdPartyNotices() {
  const owners = new Map(), packages = new Map();
  async function owner(directory) {
    if (owners.has(directory)) return owners.get(directory);
    let found;
    try {
      const manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
      if (manifest.name && manifest.version) found = { directory, manifest };
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (!found && directory !== parse(directory).root) found = await owner(dirname(directory));
    owners.set(directory, found);
    return found;
  }
  return {
    async collect(bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;
        for (const id of Object.keys(chunk.modules)) {
          if (!id.replaceAll('\\', '/').includes('/node_modules/') || id.startsWith('\0')) continue;
          const pkg = await owner(dirname(id.split('?')[0]));
          assert.ok(pkg, `Cannot identify bundled package: ${id}`);
          packages.set(`${pkg.manifest.name}@${pkg.manifest.version}`, pkg);
        }
      }
    },
    async write(file) {
      const sections = ['KIMA standalone bundles — third-party notices\n\nThe following packages are included in one or more of kima-elements.js,\nkima-elements-core.js and kima-theme.js. Their licenses apply to their respective code.\nKIMA itself is licensed under the MIT license supplied as LICENSE.'];
      const inventory = [];
      for (const [name, { directory, manifest }] of [...packages].sort(([a], [b]) => a.localeCompare(b))) {
        const texts = [];
        for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
          if (!/^(?:licen[cs]e|notice|copying|copyright)(?:[.\-_]|$)/i.test(entry.name)) continue;
          if (entry.isFile()) texts.push([entry.name, await readFile(join(directory, entry.name), 'utf8')]);
          // Some packages distribute additional notices in a dedicated directory.
          else if (entry.isDirectory()) {
            for (const child of (await readdir(join(directory, entry.name))).sort()) {
              const path = join(directory, entry.name, child);
              try { texts.push([`${entry.name}/${child}`, await readFile(path, 'utf8')]); }
              catch (error) { if (error.code !== 'EISDIR') throw error; }
            }
          }
        }
        // The published QR tarball omits LICENSE; keep its checked upstream text locally.
        // Version pin forces a fresh review instead of silently reusing an old exception.
        if (name === 'qrcode-generator@2.0.4' && !texts.length) {
          assert.equal(manifest.license, 'MIT');
          const source = await readFile(join(directory, 'dist/qrcode.mjs'), 'utf8');
          assert.ok(source.includes('Copyright (c) 2009 Kazuhiko Arase') && source.includes('Licensed under the MIT license:'));
          texts.push(['LICENSE (upstream supplement)', await readFile(new URL('./licenses/qrcode-generator-2.0.4.txt', import.meta.url), 'utf8')]);
        }
        assert.ok(texts.some(([file]) => /licen[cs]e|copying/i.test(file)), `Missing license text for bundled ${name}`);
        inventory.push({ name: manifest.name, version: manifest.version, license: manifest.license, files: texts.map(([file]) => file) });
        sections.push(`================================================================================\n${name}\nLicense: ${manifest.license || 'see license text'}\n\n${texts.map(([file, text]) => `--- ${file} ---\n${text.trim()}`).join('\n\n')}`);
      }
      assert.ok(inventory.length > 0, 'Standalone license inventory must not be empty');
      await writeFile(file, sections.join('\n\n') + '\n');
      return inventory;
    },
  };
}
