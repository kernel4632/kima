import { nextTick, onBeforeUnmount, watch } from 'vue';
import { prefersReducedMotion, useLayoutFlip } from './motion.js';

// 集合统一契约：先退出，再分段让位/调整占位，最后显现新增项。
// 高度盒和子项容器可以分开，控制区始终跟随高度盒的正常排版。
export function useCollectionMotion(target, source, items = target) {
  useContentMotion(target, source, { collection: true });
  const layout = useLayoutFlip(items, source);
  return {
    name: 'kima-collection',
    moveClass: 'kima-collection-no-move',
    onBeforeLeave: layout.beforeLeave,
    onBeforeEnter: layout.beforeEnter,
    onLeaveCancelled: layout.leaveCancelled,
  };
}

/* 内容原位变化时，让承载盒从当前视觉高度过渡到更新后的自然高度。
 * 连续变化必须以被中断动画的当前帧为起点，而不是沿用上一次动画的终点。 */
function resolveElement(target) {
  const value = target?.value;
  return value?.nodeType === 1 ? value : value?.$el?.nodeType === 1 ? value.$el : null;
}

export function useContentMotion(target, source, { opacity = true, collection = false } = {}) {
  if (collection) opacity = false;
  const overflow = collection ? 'visible' : 'clip';
  let animation;
  let disposed = false;
  let revision = 0;
  let fromHeight = 0;
  let fromOpacity = 1;
  let lockedHeight = false;
  let originalStyles;

  function restoreStyles(element) {
    if (!originalStyles) return;
    element.style.height = originalStyles.height;
    element.style.overflow = originalStyles.overflow;
    element.style.boxSizing = originalStyles.boxSizing;
    if (opacity) element.style.opacity = originalStyles.opacity;
    originalStyles = undefined;
    lockedHeight = false;
  }

  watch(source, () => {
    const element = resolveElement(target);
    if (!element) {
      fromHeight = 0;
      return;
    }

    const view = element.ownerDocument.defaultView;
    const rect = element.getBoundingClientRect();
    fromHeight = rect.height > 0 ? rect.height : 0;
    fromOpacity = opacity ? Number(view.getComputedStyle(element).opacity) : 1;

    animation?.cancel();
    animation = undefined;
    if ((collection || fromHeight > 0) && !prefersReducedMotion(element) && element.animate) {
      // DOM 更新前锁当前占位，避免父级 FLIP 先把新自然高度当成另一次位移。
      // 被中断时也保存当前视觉高度，直到更新后读取自然目标再接续。
      originalStyles ??= {
        height: element.style.height,
        overflow: element.style.overflow,
        boxSizing: element.style.boxSizing,
        opacity: element.style.opacity,
      };
      element.style.height = `${fromHeight}px`;
      element.style.boxSizing = 'border-box';
      element.style.overflow = overflow;
      if (opacity) element.style.opacity = `${fromOpacity}`;
      lockedHeight = true;
    }
  }, { flush: 'pre', deep: true });

  watch(source, async () => {
    const currentRevision = ++revision;
    await nextTick();
    if (disposed || currentRevision !== revision) return;

    const element = resolveElement(target);
    const view = element?.ownerDocument.defaultView;
    if (!element || prefersReducedMotion(element) || !element.animate) {
      if (element && originalStyles) restoreStyles(element);
      return;
    }

    const style = view.getComputedStyle(element);
    const token = style.getPropertyValue(collection ? '--kima-duration-slow' : '--kima-duration-effects').trim();
    const duration = token ? parseFloat(token) * (token.endsWith('ms') ? 1 : 1000) : 180;
    if (!Number.isFinite(duration) || duration <= 0) {
      restoreStyles(element);
      return;
    }

    // 暂时移除前一帧的固定高度，读取 DOM 更新后的真实自然高度。
    if (lockedHeight) {
      element.style.height = originalStyles.height;
      element.style.boxSizing = originalStyles.boxSizing;
    }
    const toHeight = element.getBoundingClientRect().height;
    const heightChanged = (collection || fromHeight > 0) && Math.abs(toHeight - fromHeight) > 1;
    if (!heightChanged && !opacity) {
      restoreStyles(element);
      return;
    }

    originalStyles ??= {
      height: element.style.height,
      overflow: element.style.overflow,
      boxSizing: element.style.boxSizing,
      opacity: element.style.opacity,
    };

    if (heightChanged) {
      element.style.height = `${fromHeight}px`;
      element.style.boxSizing = 'border-box';
      element.style.overflow = overflow;
    }
    const from = opacity ? fromOpacity : 1;
    if (opacity) element.style.opacity = `${from}`;
    const easing = style.getPropertyValue('--kima-curve-emphasized').trim() || 'ease-out';
    const keyframes = heightChanged && collection ? [
      { height: `${fromHeight}px`, offset: 0, easing },
      { height: `${toHeight > fromHeight ? toHeight : fromHeight}px`, offset: 0.5, easing },
      { height: `${toHeight}px`, offset: 1 },
    ] : heightChanged
      ? [{ height: `${fromHeight}px`, opacity: from }, { height: `${toHeight}px`, opacity: 1 }]
      : [{ opacity: from }, { opacity: 1 }];
    const delayValue = collection ? style.getPropertyValue('--kima-duration-fast').trim() : '';
    const delay = delayValue ? parseFloat(delayValue) * (delayValue.endsWith('ms') ? 1 : 1000) : 0;
    const running = element.animate(keyframes, {
      duration,
      delay: Number.isFinite(delay) ? Math.max(0, delay) : 0,
      easing: collection ? 'linear' : easing,
      fill: 'both',
    });
    animation = running;
    running.finished.then(() => {
      if (animation !== running) return;
      animation = undefined;
      restoreStyles(element);
      running.cancel();
    }).catch(() => {});
  }, { deep: true });

  onBeforeUnmount(() => {
    disposed = true;
    revision++;
    const element = resolveElement(target);
    animation?.cancel();
    animation = undefined;
    if (element) restoreStyles(element);
  });
}
