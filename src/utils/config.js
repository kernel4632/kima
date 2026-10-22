// Vue descendants use injection. Independent CE apps read observable DOM context instead.
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue';
export const kimaConfigKey = Symbol.for('kima.config');
export const defaultConfig = Object.freeze({ locale: 'zh-CN', direction: 'ltr', reducedMotion: 'system', theme: 'dark' });
export function useKimaConfig(root) {
  const inherited = inject(kimaConfigKey, null);
  const dom = ref({}); let observer;
  onMounted(() => {
    function read() {
      const element = root.value?.$el || root.value;
      const result = {};
      for (let node = element?.parentElement; node; node = node.parentElement) {
        if (!node.hasAttribute('data-kima-config')) continue;
        for (const key of ['locale', 'direction', 'reducedMotion', 'theme', 'seed', 'variant']) { const attr = `data-kima-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`; if (result[key] == null && node.hasAttribute(attr)) result[key] = node.getAttribute(attr); }
      }
      dom.value = result;
    }
    const element = root.value?.$el || root.value;
    observer = new MutationObserver(read);
    observer.observe(element.ownerDocument.documentElement, { attributes: true, subtree: true, childList: true, attributeFilter: ['data-kima-locale', 'data-kima-direction', 'data-kima-reduced-motion', 'data-kima-theme', 'data-kima-seed', 'data-kima-variant'] });
    read();
  });
  onBeforeUnmount(() => observer?.disconnect());
  return computed(() => ({ ...defaultConfig, ...(inherited?.value || {}), ...dom.value }));
}
