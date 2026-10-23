/* 代码着色：分词交给 highlight.js（MIT），颜色留给 KIMA token。
 *
 * 只注册 highlight.js 的 "common" 语言集（36 种，覆盖绝大多数实际代码）+ dockerfile。
 * 全部 190 多种语法都内联进来会让组件包多出好几兆，所以其余语言由宿主按需登记：
 *
 *   import python from 'highlight.js/lib/languages/python';
 *   import { registerCodeLanguage } from '@kernel4632/kima';
 *   registerCodeLanguage('python', python);
 *
 * 用独立实例（newInstance）注册，不改宿主项目自己的 highlight.js 配置。
 */
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import diff from 'highlight.js/lib/languages/diff';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import go from 'highlight.js/lib/languages/go';
import graphql from 'highlight.js/lib/languages/graphql';
import ini from 'highlight.js/lib/languages/ini';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import kotlin from 'highlight.js/lib/languages/kotlin';
import less from 'highlight.js/lib/languages/less';
import lua from 'highlight.js/lib/languages/lua';
import makefile from 'highlight.js/lib/languages/makefile';
import markdown from 'highlight.js/lib/languages/markdown';
import objectivec from 'highlight.js/lib/languages/objectivec';
import perl from 'highlight.js/lib/languages/perl';
import php from 'highlight.js/lib/languages/php';
import plaintext from 'highlight.js/lib/languages/plaintext';
import python from 'highlight.js/lib/languages/python';
import r from 'highlight.js/lib/languages/r';
import ruby from 'highlight.js/lib/languages/ruby';
import rust from 'highlight.js/lib/languages/rust';
import scss from 'highlight.js/lib/languages/scss';
import shell from 'highlight.js/lib/languages/shell';
import sql from 'highlight.js/lib/languages/sql';
import swift from 'highlight.js/lib/languages/swift';
import typescript from 'highlight.js/lib/languages/typescript';
import vbnet from 'highlight.js/lib/languages/vbnet';
import wasm from 'highlight.js/lib/languages/wasm';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

const grammars = {
  bash, c, cpp, csharp, css, diff, dockerfile, go, graphql, ini, java, javascript, json,
  kotlin, less, lua, makefile, markdown, objectivec, perl, php, plaintext, python, r, ruby,
  rust, scss, shell, sql, swift, typescript, vbnet, wasm, xml, yaml,
};

const highlighter = hljs.newInstance();
for (const [name, grammar] of Object.entries(grammars)) highlighter.registerLanguage(name, grammar);

/* 常见别名：文档里写 vue / ts / sh / yml 都能着上色，不用使用者背 hljs 的正式名。 */
const aliases = {
  xml: ['html', 'vue', 'svg', 'svelte', 'xhtml', 'plist'],
  bash: ['sh', 'zsh', 'console', 'shellsession'],
  javascript: ['js', 'mjs', 'cjs'],
  typescript: ['ts'],
  json: ['jsonc', 'json5'],
  yaml: ['yml'],
  markdown: ['md'],
  python: ['py'],
  ruby: ['rb'],
  rust: ['rs'],
  go: ['golang'],
  csharp: ['cs'],
  kotlin: ['kt'],
  objectivec: ['objc', 'obj-c'],
  ini: ['toml', 'properties'],
  dockerfile: ['docker'],
  plaintext: ['text', 'txt'],
  diff: ['patch'],
  makefile: ['make', 'mk'],
  php: ['php3', 'php4', 'php5'],
  sql: ['mysql', 'pgsql'],
  vbnet: ['vb'],
};
for (const [languageName, list] of Object.entries(aliases)) {
  if (highlighter.getLanguage(languageName)) highlighter.registerAliases(list, { languageName });
}

export const codeLanguages = Object.keys(grammars);

/** 宿主按需补一种语言；重复登记同名语法时以最后一次为准。 */
export function registerCodeLanguage(name, grammar) {
  if (!name || !grammar) return false;
  highlighter.registerLanguage(name, grammar);
  return true;
}

/** 这个语言名（含别名）能不能着色。 */
export function hasCodeLanguage(language) {
  return Boolean(language) && Boolean(highlighter.getLanguage(String(language).toLowerCase()));
}

function escapeHtml(code) {
  return code.replace(/[&<>]/g, (character) => String.fromCharCode(38) + ({ '&': 'amp;', '<': 'lt;', '>': 'gt;' })[character]);
}

/** 把整段代码着色后按行拆开；跨行的字符串/注释会在每行补齐 span，行号才对得齐。 */
export function highlightCodeLines(code, language) {
  const name = String(language || '').toLowerCase();
  const html = hasCodeLanguage(name)
    ? highlighter.highlight(code, { language: name, ignoreIllegals: true }).value
    : escapeHtml(code);
  const open = [];
  const rows = [];
  let row = '';
  for (const token of html.split(/(<span\b[^>]*>|<\/span>|\n)/)) {
    if (token === '\n') {
      rows.push(row + '</span>'.repeat(open.length));
      row = open.join('');
    } else {
      row += token;
      if (token.startsWith('<span')) open.push(token);
      else if (token === '</span>') open.pop();
    }
  }
  rows.push(row + '</span>'.repeat(open.length));
  return rows;
}
