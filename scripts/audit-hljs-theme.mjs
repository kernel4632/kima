/* 语法着色覆盖检查：拿 highlight.js 官方主题的类名清单对比 KIMA 的映射，
 * 少一个类就说明那种 token 在页面上没有颜色。故意保持正文色的类列在 intentional 里。
 * 用法：node scripts/audit-hljs-theme.mjs
 */
import { readFile } from 'node:fs/promises';

const theme = await readFile('node_modules/highlight.js/styles/github.css', 'utf8');
const source = await readFile('src/components/core/code-block.ce.vue', 'utf8');

const official = [...new Set([...theme.matchAll(/\.(hljs-[a-zA-Z0-9_.-]+)/g)].map((match) => match[1]))].sort();
// 这些类故意不上色：标识符用正文色，避免整页花掉；复合类由它们的第一个片段覆盖。
const intentional = new Set(['hljs-params', 'hljs-subst', 'hljs-title.class', 'hljs-title.function', 'hljs-variable.language', 'hljs-title.class_.inherited_']);

const covered = (name) => {
  const base = name.split('.')[0];
  return source.includes(`.${name}`) || source.includes(`.${base}`);
};
const missing = official.filter((name) => !intentional.has(name) && !covered(name));

console.log(`official=${official.length} intentional=${intentional.size} missing=${missing.length}`);
if (missing.length) {
  console.log(missing.join('\n'));
  process.exitCode = 1;
}
