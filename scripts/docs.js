/* 文档元数据：用 Vue/JS 解析器读取组件属性，不执行组件代码。
 * vite.config.js 注册 docsPlugin()；虚拟目录由 components/ 自动生成。
 */
import { readdir, readFile } from 'node:fs/promises';
import { parse, babelParse } from 'vue/compiler-sfc';
import { fileURLToPath } from 'node:url';

async function collect(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) files.push(...await collect(path));
    else if (entry.name.endsWith('.ce.vue')) files.push({ filename: entry.name, path });
  }
  return files;
}

export function docsPlugin() {
  return {
    name: 'kima-docs',
    resolveId(id) { if (id === 'virtual:kima-docs') return '\0kima-docs'; },
    async load(id) {
      if (id !== '\0kima-docs') return;
      const directory = new URL('../src/components/', import.meta.url);
      const entries = [];
      for (const { filename, path } of await collect(directory)) {
        this.addWatchFile(fileURLToPath(path));
        const source = await readFile(path, 'utf8');
        const { descriptor } = parse(source);
        const script = descriptor.scriptSetup.content;
        const ast = babelParse(script, { sourceType: 'module' });
        const declarations = ast.program.body.filter((node) => node.type === 'VariableDeclaration').flatMap((node) => node.declarations);
        const props = declarations.find((node) => node.init?.callee?.name === 'defineProps')?.init.arguments[0]?.properties || [];
        const attributes = props.map((property) => {
          const value = property.value;
          const type = value.type === 'ObjectExpression' ? value.properties.find((node) => node.key?.name === 'type')?.value : value;
          const initial = value.type === 'ObjectExpression' ? value.properties.find((node) => node.key?.name === 'default')?.value : null;
          return { name: property.key.name, type: type ? script.slice(type.start, type.end) : '—', default: initial ? script.slice(initial.start, initial.end) : type?.name === 'Boolean' ? 'false' : '—' };
        });
        const emit = declarations.find((node) => node.init?.callee?.name === 'defineEmits')?.init.arguments[0];
        const events = emit?.elements?.map((node) => node.value) || [];
        const description = source.match(/<!--\s*([^\n]+)/)?.[1] || filename;
        const examples = source.match(/调用示例[：:]([\s\S]*?)-->/)?.[1]?.trim() || `<kima-${filename.replace('.ce.vue', '')} />`;
        entries.push({ slug: filename.replace('.ce.vue', ''), attributes, events, description, examples });
      }
      return `export default ${JSON.stringify(entries)};`;
    },
  };
}
