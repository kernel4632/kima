import { nextTick, onBeforeUnmount, watch } from 'vue';
import { prefersReducedMotion } from './motion.js';

/* 内容原位变化时，让承载盒从当前视觉高度过渡到更新后的自然高度。
 * 连续变化必须以被中断动画的当前帧为起点，而不是沿用上一次动画的终点。 */
function resolveElement(target) {
  const value = target?.value;
  return value?.nodeType === 1 ? value : value?.$el?.nodeType === 1 ? value.$el : null;
}

export function useContentMotion(target, source, { opacity = true } = {}) {
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

    if (animation) {
      // 先把动画当前帧固化到 inline style，再取消动画，防止取消时跳回旧布局。
      originalStyles ??= {
        height: element.style.height,
        overflow: element.style.overflow,
        boxSizing: element.style.boxSizing,
        opacity: element.style.opacity,
      };
      animation.cancel();
      animation = undefined;
      element.style.height = `${fromHeight}px`;
      element.style.boxSizing = 'border-box';
      element.style.overflow = 'clip';
      if (opacity) element.style.opacity = `${fromOpacity}`;
      lockedHeight = true;
    }
  }, { flush: 'pre' });

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
    const token = style.getPropertyValue('--kima-duration-effects').trim();
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
    const heightChanged = fromHeight > 0 && Math.abs(toHeight - fromHeight) > 1;
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
      element.style.overflow = 'clip';
    }
    const from = opacity ? fromOpacity : 1;
    if (opacity) element.style.opacity = `${from}`;
    const keyframes = heightChanged
      ? [{ height: `${fromHeight}px`, opacity: from }, { height: `${toHeight}px`, opacity: 1 }]
      : [{ opacity: from }, { opacity: 1 }];
    const running = element.animate(keyframes, {
      duration,
      easing: style.getPropertyValue('--kima-curve-emphasized').trim() || 'ease-out',
    });
    animation = running;
    running.finished.then(() => {
      if (animation !== running) return;
      animation = undefined;
      restoreStyles(element);
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
