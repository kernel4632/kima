// 每个应用/SSR 请求创建独立实例；不在模块作用域持有用户通知或计时器。
export function createNotifications({ capacity = 3 } = {}) {
  let items = [], sequence = 0, limit = normalize(capacity);
  const listeners = new Set();
  function normalize(value) { return Math.max(0, Math.floor(Number(value) || 0)); }
  function snapshot() { return items.map(item => ({ ...item })); }
  function publish() { const state = snapshot(); for (const listener of [...listeners]) listener(state); }
  function push(input) {
    const item = typeof input === 'string' ? { message: input } : { ...input };
    const previous = items.find(entry => (item.dedupeKey != null && entry.dedupeKey === item.dedupeKey) || (item.id != null && entry.id === item.id));
    const id = previous?.id ?? item.id ?? `kima-notice-${++sequence}`;
    if (previous) items = items.map(entry => entry === previous ? { ...entry, ...item, id, open: true } : entry);
    else items = [...items, { ...item, id, open: true }];
    items = limit ? items.slice(-limit) : [];
    publish(); return id;
  }
  function update(id, patch) {
    if (!items.some(item => item.id === id)) return false;
    items = items.map(item => item.id === id ? { ...item, ...patch, id } : item);
    publish(); return true;
  }
  function dismiss(id) { const next = items.filter(item => item.id !== id); if (next.length === items.length) return false; items = next; publish(); return true; }
  function clear() { items = []; publish(); }
  function subscribe(listener) { listeners.add(listener); listener(snapshot()); return () => listeners.delete(listener); }
  function setCapacity(value) { limit = normalize(value); items = limit ? items.slice(-limit) : []; publish(); }
  return { push, update, dismiss, clear, subscribe, setCapacity, snapshot, get capacity() { return limit; } };
}
