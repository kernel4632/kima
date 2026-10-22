import { nextTick, onBeforeUnmount, watch } from 'vue';
import { prefersReducedMotion } from './motion.js';

/* 内容原位变化（展开全文、切换面板、换一张幻灯片这类）：数据立刻更新，
 * 承载它的盒子高度顺着走过去，不要一帧跳到位。
 *
 * 高度必须"先记旧值、后量新值"：watch 的 pre 阶段 DOM 还没更新，量到的是旧高度；
 * nextTick 之后量到新高度，两个值之间就是这次变化要跨过去的距离。
 * 只动高度和透明度：文字、选中、焦点和语义都不等动画。
 *
 * opacity: false 用于内容自己已经有淡入淡出的场景（标签面板、轮播），
 * 这时只补高度，免得两层淡入叠在一起。 */
export function useContentMotion(target, source, { opacity = true } = {}) {
  let animation, disposed = false, revision = 0, fromHeight = 0;

  watch(source, () => {
    const rect = target.value?.getBoundingClientRect();
    fromHeight = rect && rect.height > 0 ? rect.height : 0;
  }, { flush: 'pre' });

  watch(source, async () => {
    const currentRevision = ++revision;
    await nextTick();
    if (disposed || currentRevision !== revision) return;
    const element = target.value;
    const view = element?.ownerDocument.defaultView;
    if (!element || prefersReducedMotion(element) || !element.animate) return;
    const style = view.getComputedStyle(element);
    const token = style.getPropertyValue('--kima-duration-effects').trim();
    const duration = token ? parseFloat(token) * (token.endsWith('ms') ? 1 : 1000) : 180;
    if (!Number.isFinite(duration) || duration <= 0) return;
    const toHeight = element.getBoundingClientRect().height;
    const heightChanged = fromHeight > 0 && Math.abs(toHeight - fromHeight) > 1;
    if (!heightChanged && !opacity) return;
    const fromOpacity = opacity ? (animation ? style.opacity : 0.55) : 1;
    const keyframes = heightChanged
      ? [{ height: `${fromHeight}px`, opacity: fromOpacity }, { height: `${toHeight}px`, opacity: 1 }]
      : [{ opacity: fromOpacity }, { opacity: 1 }];
    animation?.cancel();
    animation = element.animate(keyframes, {
      duration,
      easing: style.getPropertyValue('--kima-curve-emphasized').trim() || 'ease-out',
    });
    if (heightChanged) element.style.overflow = 'clip';
    const running = animation;
    running.finished.then(() => {
      if (animation === running) animation = undefined;
      if (heightChanged) element.style.overflow = '';
    }).catch(() => {});
  }, { deep: true });

  onBeforeUnmount(() => { disposed = true; revision++; animation?.cancel(); });
}
