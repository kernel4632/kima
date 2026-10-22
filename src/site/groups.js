/* 统一分组注册表：catalog（元数据 label/group）与 examples（lazy 视图）的唯一来源。
 * 后注册的分组条目覆盖先注册的，避免目录/示例两处映射漂移。
 */
import { inputCatalog } from './input-catalog.js';
import { displayCatalog } from './display-catalog.js';
import { navigationCatalog } from './navigation-catalog.js';
import { interactionCatalog } from './interaction-catalog.js';
import { advancedInputCatalog } from './advanced-input-catalog.js';
import { dataCatalog } from './data-catalog.js';
import { formCompletionCatalog } from './form-completion-catalog.js';
import { utilityCatalog } from './utility-catalog.js';
import { foundationCatalog } from './foundation-catalog.js';
import { contentCatalog } from './content-catalog.js';
import { shellCatalog } from './shell-catalog.js';

const groupSets = [
  [inputCatalog, () => import('./input-examples.vue')],
  [displayCatalog, () => import('./display-examples.vue')],
  [navigationCatalog, () => import('./navigation-examples.vue')],
  [interactionCatalog, () => import('./interaction-examples.vue')],
  [advancedInputCatalog, () => import('./advanced-input-examples.vue')],
  [dataCatalog, () => import('./data-examples.vue')],
  [formCompletionCatalog, () => import('./form-completion-examples.vue')],
  [utilityCatalog, () => import('./utility-examples.vue')],
  [foundationCatalog, () => import('./foundation-examples.vue')],
  [contentCatalog, () => import('./content-examples.vue')],
  [shellCatalog, () => import('./shell-examples.vue')],
];

// Later entries intentionally override earlier entries in both metadata and view maps.
export const groupEntries = groupSets.reduce((merged, [catalog]) => ({ ...merged, ...catalog }), {});
export const exampleLoaders = groupSets.reduce((merged, [catalog, load]) => {
  for (const slug of Object.keys(catalog)) merged[slug] = load;
  return merged;
}, {});
