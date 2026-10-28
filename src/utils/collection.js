import { toRaw } from 'vue';

// 集合身份跟随显式 id 或原始对象，不跟随会因增删改变的数组下标。
// 相同值重复出现时，以出现次数消歧；对象被完整替换且无 id 时视为新项。
export function createCollectionKey(source) {
  const objectKeys = new WeakMap();
  let nextKey = 0;
  return function itemKey(item, index) {
    let identity;
    if (item !== null && typeof item === 'object') {
      const raw = toRaw(item);
      if (raw.id != null) identity = `id:${typeof raw.id}:${raw.id}`;
      else {
        if (!objectKeys.has(raw)) objectKeys.set(raw, ++nextKey);
        identity = `object:${objectKeys.get(raw)}`;
      }
    } else identity = `value:${typeof item}:${item}`;
    const occurrence = source().slice(0, index).filter(other => Object.is(toRaw(other), toRaw(item))).length;
    return `${identity}:${occurrence}`;
  };
}
