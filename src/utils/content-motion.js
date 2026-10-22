import { nextTick, onBeforeUnmount, watch } from 'vue';
import { prefersReducedMotion } from './motion.js';

// Decorate the already-current DOM. Values, selection, focus and semantics never wait.
export function useContentMotion(target, source) {
  let animation, disposed = false, revision = 0;
  watch(source, async () => {
    const currentRevision = ++revision;
    await nextTick();
    if (disposed || currentRevision !== revision) return;
    const element = target.value;
    const view = element?.ownerDocument.defaultView;
    const from = animation && element ? view.getComputedStyle(element).opacity : .55;
    animation?.cancel();
    animation = undefined;
    if (!element || prefersReducedMotion(element) || !element.animate) return;
    const style = view.getComputedStyle(element);
    const token = style.getPropertyValue('--kima-duration-effects').trim();
    const duration = token ? parseFloat(token) * (token.endsWith('ms') ? 1 : 1000) : 180;
    if (!Number.isFinite(duration) || duration <= 0) return;
    animation = element.animate([{ opacity: from }, { opacity: 1 }], {
      duration, easing: style.getPropertyValue('--kima-curve-standard').trim() || 'ease-out',
    });
    const running = animation;
    running.finished.then(() => { if (animation === running) animation = undefined; }).catch(() => {});
  }, { deep: true });
  onBeforeUnmount(() => { disposed = true; revision++; animation?.cancel(); });
}
