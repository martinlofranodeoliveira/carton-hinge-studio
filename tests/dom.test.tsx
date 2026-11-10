import './dom-environment';
import React from 'react';
import test,{afterEach,after} from 'node:test';
import assert from 'node:assert/strict';
// Dynamic DOM imports run after the bundled JSDOM setup body. Static SSR
// externals would initialize ReactDOM before a document exists.
const {render,fireEvent,cleanup,act}=await import('@testing-library/react');
import {dom} from './dom-environment';
const {App}=await import('../src/App');
import {deriveCartonStudy} from '../src/core/carton';
import {serializeCartonStudyJson} from '../src/core/studyIo';
import {leaseCameraInteraction,observeCanvasContext} from '../src/core/cameraLifecycle';
afterEach(()=>cleanup());after(()=>dom.window.close());
const studyBytes=(width=140,face:'north'|'west'='north')=>new TextEncoder().encode(serializeCartonStudyJson(deriveCartonStudy({width,depth:80,height:40},1000),face));
function file(bytes:Uint8Array,read?:()=>Promise<ArrayBuffer>):File{const value=new File([bytes as BlobPart],'synthetic.json',{type:'application/json'});Object.defineProperty(value,'arrayBuffer',{value:read??(async()=>bytes.slice().buffer as ArrayBuffer)});return value;}
function beginImport(view:ReturnType<typeof render>,value:File){fireEvent.change(view.getByTestId('import-json-input'),{target:{files:[value]}});}
function deferred(){let resolve!:(value:ArrayBuffer)=>void;const promise=new Promise<ArrayBuffer>(r=>{resolve=r;});return{promise,resolve};}
test('fallback has linked keyboard selection, strict controls and live PT/EN diagnostics',async()=>{
  const view=render(<App/>);assert.ok(view.getByTestId('scene-2d-fallback'));assert.equal(view.getByTestId('camera-toggle-button').getAttribute('aria-pressed'),'false');assert.equal((view.getByTestId('camera-toggle-button') as HTMLButtonElement).disabled,true);
  fireEvent.keyDown(view.getByTestId('net-face-west'),{key:'Enter'});assert.match(view.getByTestId('inspected-face-name').textContent!,/Oeste/);assert.equal(view.getByTestId('select-face-pill-west').getAttribute('aria-pressed'),'true');
  fireEvent.change(view.getByTestId('input-width-mm'),{target:{value:'-1'}});assert.match(view.getByTestId('header-dimensions-readout').textContent!,/120 × 80 × 40/);assert.match(view.getByRole('alert').textContent!,/Dimensões inválidas/);
  fireEvent.click(view.getByTestId('locale-toggle-button'));assert.equal(document.documentElement.lang,'en');assert.match(view.getByRole('alert').textContent!,/Invalid dimensions/);assert.equal(view.getByRole('button',{name:'Dismiss diagnostic'}).getAttribute('aria-label'),'Dismiss diagnostic');
  fireEvent.click(view.getByTestId('reset-study-button'));assert.equal((view.getByTestId('input-width-mm') as HTMLInputElement).value,'120');assert.equal(view.queryByRole('alert'),null);
  fireEvent.change(view.getByTestId('input-width-mm'),{target:{value:'1'}});assert.match(view.getByTestId('header-dimensions-readout').textContent!,/^1 ×/);fireEvent.click(view.getByTestId('fold-preset-closed'));assert.match(view.getByTestId('header-status-readout').textContent!,/Closed/);
  assert.equal(view.getByTestId('physical-edges-table').querySelectorAll('tbody tr').length,12);
});
test('bounded import is atomic, rejects bad UTF8 and checks size before reading',async()=>{
  const view=render(<App/>);let reads=0;await act(async()=>beginImport(view,file(new Uint8Array(8193),async()=>{reads++;return new ArrayBuffer(0);})));assert.equal(reads,0);assert.match(view.getByRole('alert').textContent!,/8192/);
  await act(async()=>beginImport(view,file(new Uint8Array([255]))));assert.match(view.getByRole('alert').textContent!,/UTF-8/);assert.match(view.getByTestId('header-dimensions-readout').textContent!,/120 × 80 × 40/);
  await act(async()=>beginImport(view,file(studyBytes())));assert.match(view.getByTestId('header-dimensions-readout').textContent!,/140 × 80 × 40/);assert.match(view.getByTestId('inspected-face-name').textContent!,/Norte/);
});
test('newer imports and intervening edits/selection/reset defeat stale async completion',async()=>{
  const view=render(<App/>);const first=deferred();const second=deferred();beginImport(view,file(new Uint8Array([1]),()=>first.promise));beginImport(view,file(new Uint8Array([1]),()=>second.promise));
  await act(async()=>second.resolve(studyBytes(180).buffer as ArrayBuffer));await act(async()=>first.resolve(studyBytes(60).buffer as ArrayBuffer));assert.match(view.getByTestId('header-dimensions-readout').textContent!,/180 ×/);
  const selection=deferred();beginImport(view,file(new Uint8Array([1]),()=>selection.promise));fireEvent.click(view.getByTestId('select-face-pill-west'));await act(async()=>selection.resolve(studyBytes(60).buffer as ArrayBuffer));assert.match(view.getByTestId('header-dimensions-readout').textContent!,/180 ×/);assert.match(view.getByTestId('inspected-face-name').textContent!,/Oeste/);
  const edited=deferred();beginImport(view,file(new Uint8Array([1]),()=>edited.promise));fireEvent.change(view.getByTestId('input-width-mm'),{target:{value:'200'}});await act(async()=>edited.resolve(studyBytes(60).buffer as ArrayBuffer));assert.match(view.getByTestId('header-dimensions-readout').textContent!,/200 ×/);
  const reset=deferred();beginImport(view,file(new Uint8Array([1]),()=>reset.promise));fireEvent.click(view.getByTestId('reset-study-button'));await act(async()=>reset.resolve(studyBytes(60).buffer as ArrayBuffer));assert.match(view.getByTestId('header-dimensions-readout').textContent!,/120 × 80 × 40/);
  const removed=deferred();beginImport(view,file(new Uint8Array([1]),()=>removed.promise));view.unmount();await act(async()=>removed.resolve(studyBytes(60).buffer as ArrayBuffer));
});
test('exports release object URLs even when download initiation fails',()=>{
  const view=render(<App/>);const previousCreate=URL.createObjectURL;const previousRevoke=URL.revokeObjectURL;const previousClick=HTMLAnchorElement.prototype.click;const revoked:string[]=[];let created=0;
  try{URL.createObjectURL=()=>`blob:synthetic-${++created}`;URL.revokeObjectURL=url=>revoked.push(url);HTMLAnchorElement.prototype.click=()=>{throw new Error('synthetic browser download failure');};fireEvent.click(view.getByTestId('export-json-button'));assert.deepEqual(revoked,['blob:synthetic-1']);assert.match(view.getByRole('alert').textContent!,/baixar/);assert.equal(document.querySelectorAll('a[download]').length,0);}
  finally{URL.createObjectURL=previousCreate;URL.revokeObjectURL=previousRevoke;HTMLAnchorElement.prototype.click=previousClick;}
});
test('camera opt-in leases and context listeners restore owned DOM state and detach',()=>{
  const stage=document.createElement('div');const canvas=document.createElement('canvas');stage.style.touchAction='pan-y pinch-zoom';canvas.style.touchAction='manipulation';let exits=0;
  let release=leaseCameraInteraction(stage,canvas,()=>exits++,window);assert.equal(stage.style.touchAction,'none');window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));assert.equal(exits,1);assert.equal(stage.style.touchAction,'pan-y pinch-zoom');assert.equal(canvas.style.touchAction,'manipulation');release();window.dispatchEvent(new Event('blur'));assert.equal(exits,1);
  release=leaseCameraInteraction(stage,canvas,()=>exits++,window);window.dispatchEvent(new Event('blur'));assert.equal(exits,2);release();assert.equal(stage.style.touchAction,'pan-y pinch-zoom');
  let lost=0,restored=0;const detach=observeCanvasContext(canvas,()=>lost++,()=>restored++);const event=new Event('webglcontextlost',{cancelable:true});canvas.dispatchEvent(event);canvas.dispatchEvent(new Event('webglcontextrestored'));assert.equal(event.defaultPrevented,true);assert.equal(lost,1);assert.equal(restored,1);detach();canvas.dispatchEvent(new Event('webglcontextlost'));canvas.dispatchEvent(new Event('webglcontextrestored'));assert.equal(lost,1);assert.equal(restored,1);
});

for(const entry of [
  {label:'malformed numeric lexeme',raw:'1oops',draft:''},
  {label:'empty numeric draft',raw:'',draft:''},
  {label:'below minimum',raw:'0',draft:'0'},
  {label:'above maximum',raw:'4096',draft:'4096'},
  {label:'noninteger',raw:'1.5',draft:'1.5'}
]) test(`invalid dimension ${entry.label} defeats a pending import and preserves the newer draft`,async()=>{
  const view=render(<App/>);
  fireEvent.change(view.getByTestId('input-width-mm'),{target:{value:'200'}});
  fireEvent.click(view.getByTestId('fold-preset-flat'));
  fireEvent.click(view.getByTestId('select-face-pill-west'));
  const pending=deferred();beginImport(view,file(new Uint8Array([1]),()=>pending.promise));
  fireEvent.change(view.getByTestId('input-width-mm'),{target:{value:entry.raw}});
  // HTML number inputs sanitize a malformed lexeme to the empty DOM value in
  // JSDOM; this observes that DOM contract, not browser keyboard/pixel behavior.
  assert.equal((view.getByTestId('input-width-mm') as HTMLInputElement).value,entry.draft);
  assert.match(view.getByRole('alert').textContent!,/Dimensões inválidas/);
  fireEvent.click(view.getByTestId('locale-toggle-button'));
  assert.match(view.getByRole('alert').textContent!,/Invalid dimensions/);
  await act(async()=>pending.resolve(studyBytes(60,'north').buffer as ArrayBuffer));
  assert.match(view.getByTestId('header-dimensions-readout').textContent!,/^200 × 80 × 40/);
  assert.equal((view.getByTestId('input-width-mm') as HTMLInputElement).value,entry.draft);
  assert.match(view.getByTestId('header-fold-readout').textContent!,/^0\.0°$/);
  assert.match(view.getByTestId('inspected-face-name').textContent!,/West/);
  assert.match(view.getByRole('alert').textContent!,/Invalid dimensions/);
});

test('locale-only changes keep a pending import current and render its result in the active locale',async()=>{
  const view=render(<App/>);const pending=deferred();
  beginImport(view,file(new Uint8Array([1]),()=>pending.promise));
  fireEvent.click(view.getByTestId('locale-toggle-button'));
  await act(async()=>pending.resolve(studyBytes(160,'north').buffer as ArrayBuffer));
  assert.match(view.getByTestId('header-dimensions-readout').textContent!,/^160 × 80 × 40/);
  assert.equal((view.getByTestId('input-width-mm') as HTMLInputElement).value,'160');
  assert.match(view.getByTestId('inspected-face-name').textContent!,/North/);
  assert.match(view.getByTestId('header-fold-readout').textContent!,/^90\.0°$/);
  assert.equal(view.queryByRole('alert'),null);assert.equal(document.documentElement.lang,'en');
});
