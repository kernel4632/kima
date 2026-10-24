/* Release policy is tested without publishing or requiring credentials. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { analyzeCommits } from '@semantic-release/commit-analyzer';
import config from '../release.config.js';

const options = config.plugins[0][1];
const analyze = messages => analyzeCommits(options, {
  cwd: process.cwd(), commits: messages.map(message => ({ message })), logger: { log() {} },
});

test('release policy: docs/fixes patch, features minor, breaking changes major', async () => {
  assert.equal(await analyze(['docs(README): 更新公开接入指南']), 'patch');
  assert.equal(await analyze(['fix(按钮): 修复点击事件']), 'patch');
  assert.equal(await analyze(['feat(按钮): 增加新能力']), 'minor');
  assert.equal(await analyze(['feat!: 删除旧接口\n\nBREAKING CHANGE: 旧接口已移除']), 'major');
  assert.equal(await analyze(['refactor: 删除旧接口\n\nBREAKING CHANGE: 旧接口已移除']), 'major');
  assert.equal(await analyze(['chore(release): 发布 0.6.1 [skip ci]', 'feat: 新能力']), 'minor');
});

test('npm official registry uses the exact trusted-publishing URL', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(manifest.publishConfig.registry, 'https://registry.npmjs.org/');
});

test('release config keeps version writeback before GitHub release', () => {
  assert.deepEqual(config.branches, ['main']);
  assert.equal(config.tagFormat, 'v${version}');
  assert.equal(config.plugins[2], '@semantic-release/npm');
  assert.equal(config.plugins[3][0], '@semantic-release/git');
  assert.deepEqual(config.plugins[3][1].assets, ['package.json']);
  assert.match(config.plugins[3][1].message, /\[skip ci\]/);
});
