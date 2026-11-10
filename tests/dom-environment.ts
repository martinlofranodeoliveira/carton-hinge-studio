import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
export const dom=new JSDOM('<!doctype html><html lang="pt-BR"><body></body></html>',{url:'https://synthetic.invalid/',pretendToBeVisual:true});
for(const name of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLAnchorElement','HTMLCanvasElement','Node','Event','MouseEvent','KeyboardEvent','File','FileReader','getComputedStyle']){
  Object.defineProperty(globalThis,name,{configurable:true,writable:true,value:name==='getComputedStyle'?dom.window.getComputedStyle.bind(dom.window):dom.window[name]});
}
Object.defineProperty(globalThis,'IS_REACT_ACT_ENVIRONMENT',{configurable:true,writable:true,value:true});
// No ResizeObserver/WebGL renderer is supplied: App must use its real DOM/SVG fallback.
