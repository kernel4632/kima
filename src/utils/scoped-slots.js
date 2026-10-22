// Light-DOM CE outlets must not let an outer CE consume nested CE slot outlets.
// Capture only this host's initial children; ordinary Vue continues using Vue slots.
import { getCurrentInstance, useHost } from 'vue';
export function useScopedSlots() {
  const native = Boolean(getCurrentInstance()?.ce);
  const host = native ? useHost() : null;
  // Vue captures light-DOM children before setup and exposes their original node arrays here.
  // Vue 3.5 light-DOM slot scanning includes nested CE outlets. Filter this host only;
  // keep this version-specific compatibility adapter isolated and covered by nested tests.
  const nodes = host ? Object.values(host._slots || {}).flat() : [];
  if (host && !host.__kimaScopedOutlets) {
    host.__kimaScopedOutlets = true;
    const getSlots = host._getSlots;
    host._getSlots = function () {
      return getSlots.call(this).filter((outlet) => {
        for (let parent = outlet.parentElement; parent; parent = parent.parentElement) {
          if (parent.localName.startsWith('kima-')) return parent === host;
        }
        return false;
      });
    };
  }
  const vOutlet = {
    mounted(element, binding) { for (const node of nodes) if ((node.nodeType === 1 ? node.getAttribute('slot') || 'default' : 'default') === (binding.value || 'default')) element.append(node); },
  };
  return { native, vOutlet };
}
