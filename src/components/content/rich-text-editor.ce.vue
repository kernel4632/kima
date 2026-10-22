<script setup>
import { presenceTransition } from "../../utils/motion.js";
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { contentSelection, safeContentUrl, sanitizeContent } from '../../utils/content.js';
import { useContentState } from '../../utils/content.js';
import KimaButton from '../core/button.ce.vue';
const props=defineProps({modelValue:{type:String,default:''},name:String,form:String,label:{type:String,default:'富文本编辑器'},placeholder:{type:String,default:'开始书写…'},disabled:Boolean,readonly:Boolean,required:Boolean});
const emit=defineEmits(['update:modelValue','change','selection-change']);
const root=ref(null),mount=ref(null),proxy=ref(null),editor=shallowRef(null),revision=ref(0),linkOpen=ref(false),linkValue=ref(''),linkError=ref('');let savedSelection=null,pendingExternal=null,lastEditorFocused=false;
const {local,update}=useContentState(props,emit,root,sanitizeContent,()=>createEditor());
const editable=computed(()=>!props.disabled&&!props.readonly);
const selection=computed(()=>{revision.value;return editor.value?contentSelection(editor.value):{from:0,to:0,empty:true,text:''};});
const empty=computed(()=>{revision.value;return editor.value?editor.value.isEmpty:!local.value.replace(/<[^>]*>/g,'').trim();});
const active=type=>{revision.value;return editor.value?.isActive(type)??false;};
const canUndo=computed(()=>{revision.value;return editable.value&&!!editor.value?.can().undo();});
const canRedo=computed(()=>{revision.value;return editable.value&&!!editor.value?.can().redo();});
function syncValidity(){proxy.value?.setCustomValidity(props.required&&empty.value?'请填写内容':'');}
function announceSelection(){revision.value++;if(editor.value)emit('selection-change',contentSelection(editor.value));syncValidity();}
function createEditor(){
  if(!mount.value)return;
  editor.value?.destroy();
  editor.value=new Editor({element:mount.value,content:sanitizeContent(local.value),editable:editable.value,
    extensions:[StarterKit.configure({heading:{levels:[1,2,3]},link:{openOnClick:false,autolink:false,linkOnPaste:false,isAllowedUri:url=>safeContentUrl(url),HTMLAttributes:{target:null,rel:'noopener noreferrer nofollow'}}}),Placeholder.configure({placeholder:()=>props.placeholder})],
    editorProps:{attributes:{role:'textbox','aria-multiline':'true','aria-label':props.label,'aria-readonly':String(props.readonly),'aria-disabled':String(props.disabled),tabindex:props.disabled?'-1':'0'},transformPastedHTML:sanitizeContent,handleDOMEvents:{focus:()=>{lastEditorFocused=true;return false;},blur:()=>{setTimeout(()=>{if(document.activeElement!==editor.value?.view.dom)lastEditorFocused=false;},0);return false;},compositionend:()=>{queueMicrotask(()=>{if(pendingExternal!==null){const value=pendingExternal;pendingExternal=null;receive(value);}});return false;}}},
    onUpdate:({editor:current})=>{update(sanitizeContent(current.getHTML()));announceSelection();},
    onSelectionUpdate:announceSelection,onTransaction:()=>{revision.value++;},
  });
  local.value=sanitizeContent(editor.value.getHTML());announceSelection();
}
function receive(value){
  const current=editor.value;if(!current)return;
  const html=sanitizeContent(value);if(html===sanitizeContent(current.getHTML()))return;
  if(current.view.composing){pendingExternal=html;return;}
  const {from,to}=current.state.selection;
  const restoreFocus=lastEditorFocused||current.isFocused;
  current.commands.setContent(html,{emitUpdate:false});
  const max=current.state.doc.content.size;
  const nextSelection={from:Math.min(from,max),to:Math.min(to,max)};
  current.commands.setTextSelection(nextSelection);
  // External model updates can be caused by a button click that first blurs the editor.
  // Restore the browser DOM selection as well as Tiptap state when the editor owned focus.
  if(restoreFocus)current.commands.focus(undefined,{scrollIntoView:false});
  local.value=sanitizeContent(current.getHTML());announceSelection();
}
watch(local,receive);
watch([()=>props.disabled,()=>props.readonly,()=>props.label],()=>{editor.value?.setEditable(editable.value,false);editor.value?.setOptions({editorProps:{...editor.value.options.editorProps,attributes:{role:'textbox','aria-multiline':'true','aria-label':props.label,'aria-readonly':String(props.readonly),'aria-disabled':String(props.disabled),tabindex:props.disabled?'-1':'0'}}});syncValidity();});
watch(()=>props.required,syncValidity);
function command(type){if(!editable.value||!editor.value)return;const chain=editor.value.chain().focus();({bold:()=>chain.toggleBold(),italic:()=>chain.toggleItalic(),heading:()=>chain.toggleHeading({level:2}),bulletList:()=>chain.toggleBulletList(),orderedList:()=>chain.toggleOrderedList(),undo:()=>chain.undo(),redo:()=>chain.redo()})[type]?.().run();announceSelection();}
function openLink(){savedSelection={from:selection.value.from,to:selection.value.to};linkValue.value=editor.value?.getAttributes('link').href||'';linkError.value='';linkOpen.value=true;}
function applyLink(){if(!editor.value||!editable.value)return;const url=linkValue.value.trim();if(url&&!safeContentUrl(url)){linkError.value='仅允许 http、https、mailto、tel、站内路径和锚点';return;}const chain=editor.value.chain().focus().setTextSelection(savedSelection||selection.value).extendMarkRange('link');(url?chain.setLink({href:url}):chain.unsetLink()).run();linkOpen.value=false;announceSelection();}
onMounted(createEditor);onBeforeUnmount(()=>editor.value?.destroy());
defineExpose({focus:()=>editor.value?.commands.focus(),getHTML:()=>sanitizeContent(editor.value?.getHTML()||local.value),getJSON:()=>editor.value?.getJSON(),getSelection:()=>selection.value});
</script>
<template>
  <div ref="root" class="kima-rich-text-editor" :aria-disabled="disabled">
    <div class="kima-rich-text-editor__toolbar" role="toolbar" aria-label="文本格式">
      <KimaButton v-for="item in [{type:'bold',label:'粗体'},{type:'italic',label:'斜体'},{type:'heading',label:'标题'},{type:'bulletList',label:'无序列表'},{type:'orderedList',label:'有序列表'}]" :key="item.type" variant="text" :aria-pressed="active(item.type)" :disabled="!editable" @mousedown.prevent @click="command(item.type)">{{ item.label }}</KimaButton>
      <KimaButton variant="text" :disabled="!editable" :aria-expanded="linkOpen" @mousedown.prevent @click="openLink">链接</KimaButton><KimaButton variant="text" :disabled="!canUndo" @mousedown.prevent @click="command('undo')">撤销</KimaButton><KimaButton variant="text" :disabled="!canRedo" @mousedown.prevent @click="command('redo')">重做</KimaButton>
    </div>
    <Transition name="kima-popup" v-bind="presenceTransition"><div v-if="linkOpen" class="kima-rich-text-editor__link"><input v-model="linkValue" aria-label="链接地址" :disabled="!editable" placeholder="https://example.com" @keydown.enter.prevent="applyLink" @keydown.esc.prevent="linkOpen=false;editor?.commands.focus()"/><KimaButton :disabled="!editable" @click="applyLink">应用链接</KimaButton><KimaButton variant="text" @click="linkOpen=false;editor?.commands.focus()">取消</KimaButton><span v-if="linkError" role="alert">{{ linkError }}</span></div></Transition>
    <div v-if="!editor" class="kima-rich-text-editor__document" v-html="sanitizeContent(local)"></div>
    <div ref="mount" class="kima-rich-text-editor__document"></div>
    <output class="kima-rich-text-editor__selection" aria-live="off">选区 {{ selection.from }}–{{ selection.to }}{{ selection.text ? ` · ${selection.text}` : '' }}</output>
    <textarea ref="proxy" class="kima-rich-text-editor__proxy" :name="name" :form="form" :value="local" :disabled="disabled" tabindex="-1" aria-hidden="true" @invalid.prevent="editor?.commands.focus()"></textarea>
  </div>
</template>
<style scoped lang="scss">
@use '../../styles/content' as *;
.kima-rich-text-editor{@include content-editor;@include content-reduced;position:relative;&__toolbar{display:flex;flex-wrap:wrap;gap:var(--kima-space-1);padding:var(--kima-space-2)}&__document{padding:var(--kima-space-4);:deep(.tiptap){outline:none;min-height:12em;overflow-wrap:anywhere;line-height:1.8;> :first-child{margin-top:0}a{color:var(--kima-color-primary);text-decoration:underline}blockquote{margin-inline:0;padding-inline:var(--kima-space-4);background:var(--kima-color-layer-2)}code{background:var(--kima-color-layer-2);font:inherit}p.is-editor-empty:first-child::before{content:attr(data-placeholder);float:left;height:0;pointer-events:none;color:var(--kima-color-on-surface-variant)}}}&__selection{display:block;padding:var(--kima-space-2) var(--kima-space-4);color:var(--kima-color-on-surface-variant);font-size:var(--kima-font-size-label-medium);overflow-wrap:anywhere}&__link{display:flex;flex-wrap:wrap;gap:var(--kima-space-2);padding:var(--kima-space-3);background:var(--kima-color-popup);input{min-width:0;flex:1;background:var(--kima-color-layer-2);border:0;border-radius:var(--kima-radius-s);padding:var(--kima-space-3);color:inherit;font:inherit}span{color:var(--kima-color-error)}}&__proxy{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;clip-path:inset(50%)}}
</style>
