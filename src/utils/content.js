import xss from 'xss';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
const { FilterXSS, escapeAttrValue } = xss;

export function safeContentUrl(value) {
  const url=String(value??'').trim();
  if(!url || /[\u0000-\u0020\u007f\\]/.test(url))return false;
  return /^(?:https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(url);
}

// Same parser-based allowlist in SSR, paste, external models and emitted HTML.
// No CSS, class/data attributes, media, SVG, MathML or embedded content.
const filter=new FilterXSS({
  whiteList:{p:[],br:[],strong:[],b:[],em:[],i:[],s:[],h1:[],h2:[],h3:[],ul:[],ol:['start'],li:[],blockquote:[],pre:[],code:[],hr:[],a:['href','title','rel']},
  stripIgnoreTag:true,stripIgnoreTagBody:['script','style','iframe','object','svg','math'],css:false,
  safeAttrValue(tag,name,value){
    if(tag==='a'&&name==='href')return safeContentUrl(value)?escapeAttrValue(value):'';
    if(tag==='a'&&name==='rel')return 'noopener noreferrer nofollow';
    if(tag==='ol'&&name==='start')return /^-?\d+$/.test(value)?value:'';
    return escapeAttrValue(value);
  },
});
export function sanitizeContent(value){return filter.process(String(value??''));}

export function contentSelection(editor) {
  const {from,to}=editor.state.selection;
  return {from,to,empty:from===to,text:editor.state.doc.textBetween(from,to,'\n')};
}

// Observe reset after target handlers can cancel the native event.
export function useContentState(props,emit,root,normalize,afterReset){
  const local=ref(normalize(props.modelValue));let initial,doc;
  watch(()=>props.modelValue,value=>{local.value=normalize(value);});
  function update(value){if(props.disabled||props.readonly)return;local.value=normalize(value);emit('update:modelValue',local.value);emit('change',local.value);}
  function reset(event){
    const form=root.value?.querySelector('textarea')?.form;
    if(event.target!==form||event.defaultPrevented)return;
    queueMicrotask(()=>{if(event.defaultPrevented||!root.value)return;local.value=initial;afterReset?.(initial);emit('update:modelValue',local.value);});
  }
  onMounted(()=>{initial=local.value;doc=root.value?.ownerDocument;doc?.addEventListener('reset',reset);const proxy=root.value?.querySelector('textarea');if(proxy)proxy.defaultValue=local.value;});
  onBeforeUnmount(()=>doc?.removeEventListener('reset',reset));return {local,update};
}
