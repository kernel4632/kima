import { onBeforeUnmount, ref, watch } from "vue";

/**
 * 选择器远程选项调度器。
 * loader(search, { signal }) 必须返回数组，或返回 { items: [] }。
 * 新查询会取消旧请求；即使 loader 忽略 AbortSignal，generation 也会阻止旧结果覆盖新结果。
 */
export function useRemoteOptions(loader, query, debounce, retry, emit) {
  const items = ref([]);
  const loading = ref(false);
  const error = ref("");
  let timer = null;
  let controller = null;
  let generation = 0;

  function cancel() {
    clearTimeout(timer);
    timer = null;
    controller?.abort();
    controller = null;
  }

  async function request(search, token) {
    const load = loader.value;
    if (typeof load !== "function") return;
    controller = new AbortController();
    const signal = controller.signal;
    loading.value = true;
    error.value = "";
    emit?.("options-loading", { search });
    const attempts = Math.max(0, Number(retry.value) || 0) + 1;
    try {
      let result;
      let lastError;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        if (signal.aborted || token !== generation) return;
        try {
          result = await load(search, { signal });
          lastError = null;
          break;
        } catch (reason) {
          lastError = reason;
          if (signal.aborted || token !== generation) return;
        }
      }
      if (lastError) throw lastError;
      if (signal.aborted || token !== generation) return;
      const next = Array.isArray(result) ? result : Array.isArray(result?.items) ? result.items : [];
      items.value = next;
      emit?.("options-load", { search, items: next });
    } catch (reason) {
      if (signal.aborted || token !== generation) return;
      error.value = reason?.message || "选项加载失败";
      items.value = [];
      emit?.("options-error", { search, error: reason });
    } finally {
      if (token === generation) {
        loading.value = false;
        controller = null;
      }
    }
  }

  function schedule(immediate = false) {
    cancel();
    const load = loader.value;
    if (typeof load !== "function") {
      loading.value = false;
      error.value = "";
      items.value = [];
      return;
    }
    const token = ++generation;
    const search = String(query.value ?? "");
    const wait = immediate ? 0 : Math.max(0, Number(debounce.value) || 0);
    timer = setTimeout(() => {
      timer = null;
      request(search, token);
    }, wait);
  }

  function retryRequest() {
    schedule(true);
  }

  watch([loader, query], () => schedule(), { immediate: true });
  onBeforeUnmount(() => {
    generation += 1;
    cancel();
  });

  return { items, loading, error, retry: retryRequest };
}
