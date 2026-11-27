/* 统一注册目录：catalog 元数据（label/group）与示例视图共用这一份映射。
 * 2026-11 裁员后库收缩为 30 个原语组件，全部演示由 base-examples 承担，
 * 扩展组注册表不再存在；文件保留 exampleLoaders 接口供 examples.vue 平滑分发。
 */
const groupSets = [];

// Later entries intentionally override earlier entries in both metadata and view maps.
export const groupEntries = groupSets.reduce((merged, [catalog]) => ({ ...merged, ...catalog }), {});
export const exampleLoaders = groupSets.reduce((merged, [catalog, load]) => {
  for (const slug of Object.keys(catalog)) merged[slug] = load;
  return merged;
}, {});
