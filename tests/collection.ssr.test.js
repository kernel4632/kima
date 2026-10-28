import test from 'node:test';
import assert from 'node:assert/strict';
import { reactive } from 'vue';
import { createCollectionKey } from '../src/utils/collection.js';

test('collection keys follow raw objects through removal, reorder and Vue proxies', () => {
  const a = { title: 'A' }, b = { title: 'B' }, c = { title: 'C' };
  let items = [a, b, c];
  const key = createCollectionKey(() => items);
  const before = items.map(key);
  items = reactive([c, b]);
  assert.equal(key(items[0], 0), before[2]);
  assert.equal(key(items[1], 1), before[1]);
  items = [{ title: 'B' }];
  assert.notEqual(key(items[0], 0), before[1], '无 id 的新对象不能伪装成旧项');
});

test('collection keys preserve explicit ids across replacement and distinguish id types', () => {
  let items = [{ id: 1 }, { id: '1' }];
  const key = createCollectionKey(() => items);
  const before = items.map(key);
  assert.notEqual(before[0], before[1]);
  items = [{ id: '1', title: '更新' }, { id: 1 }];
  assert.deepEqual(items.map(key), [before[1], before[0]]);
});

test('collection keys disambiguate repeated primitive values and repeated object references', () => {
  const shared = { title: '重复' };
  const items = ['a', 'a', 1, '1', shared, shared];
  const key = createCollectionKey(() => items);
  const keys = items.map(key);
  assert.equal(new Set(keys).size, items.length);
  assert.deepEqual(items.map(key), keys);
});
