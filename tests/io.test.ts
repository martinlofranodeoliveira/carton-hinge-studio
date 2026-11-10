import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {deriveCartonStudy} from '../src/core/carton';
import {parseCartonStudyJson, serializeCartonStudyJson} from '../src/core/studyIo';
import {generateSvgNet} from '../src/core/svg';
import {STUDY_SCHEMA_ID, MAX_STUDY_JSON_BYTES} from '../src/core/types';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const study=deriveCartonStudy({width:120,depth:80,height:40},500);
const valid=serializeCartonStudyJson(study,'north');
function failed(input:string|Uint8Array, code:string){const result=parseCartonStudyJson(input);assert.equal(result.ok,false);if(!result.ok)assert.equal(result.code,code);return result;}
test('portable study uses deterministic owned JSON and preserves exact bounds',()=>{
  assert.equal(valid,serializeCartonStudyJson(study,'north'));
  const result=parseCartonStudyJson(valid);assert.equal(result.ok,true);
  if(result.ok){assert.equal(result.document.selectedFace,'north');assert.deepEqual(result.study.dimensions,study.dimensions);assert.equal(result.study.foldTicks,500);}
  const exact=valid+' '.repeat(MAX_STUDY_JSON_BYTES-new TextEncoder().encode(valid).byteLength);
  assert.equal(parseCartonStudyJson(exact).ok,true);failed(exact+' ','BYTE_LIMIT_EXCEEDED');
  failed(valid+'é'.repeat(4096),'BYTE_LIMIT_EXCEEDED');
});
test('malformed UTF8 and closed-schema failures are typed and do not throw',()=>{
  failed(new Uint8Array([0xff]),'INVALID_UTF8');failed(new Uint8Array([0xc3,0x28]),'INVALID_UTF8');
  failed('','EMPTY_DOCUMENT');failed(' \n\t','EMPTY_DOCUMENT');failed('{','MALFORMED_JSON');failed('[]','NON_OBJECT_ROOT');
  const document=JSON.parse(valid);document.extra=true;failed(JSON.stringify(document),'UNKNOWN_FIELD');
  for(const key of ['__proto__','constructor','prototype'])failed(valid.trimEnd().replace(/}$/,`,"${key}":{}}`),'FORBIDDEN_KEY');
  failed(JSON.stringify({...JSON.parse(valid),schema:'other@1'}),'UNSUPPORTED_SCHEMA');
  failed(JSON.stringify({...JSON.parse(valid),units:'in'}),'UNSUPPORTED_UNITS');
  failed(JSON.stringify({...JSON.parse(valid),selectedFace:'unknown'}),'INVALID_SELECTED_FACE');
  failed(JSON.stringify({...JSON.parse(valid),foldTicks:500.5}),'INVALID_FOLD_TICKS');
  failed(JSON.stringify({...JSON.parse(valid),dimensions:{width:0,depth:80,height:40}}),'INVALID_DIMENSIONS');
  failed(JSON.stringify({...JSON.parse(valid),extra:Array(33).fill(1)}),'SCALAR_LIMIT_EXCEEDED');
  const duplicate=valid.trimEnd().replace(/}$/,',"foldTicks":1000}');const last=parseCartonStudyJson(duplicate);assert.equal(last.ok,true);if(last.ok)assert.equal(last.document.foldTicks,1000);
  assert.equal(JSON.parse(valid).schema,STUDY_SCHEMA_ID);
});
test('SVG is parsed as real XML and indeterminate geometry cannot export',()=>{
  const document=new JSDOM(generateSvgNet(study),{contentType:'image/svg+xml'}).window.document;
  assert.equal(document.querySelectorAll('polygon[data-face-id]').length,6);
  assert.equal(document.querySelectorAll('line[data-hinge-id]').length,5);
  assert.equal(document.documentElement.namespaceURI,'http://www.w3.org/2000/svg');
  assert.match(document.querySelector('desc')!.textContent!,/not a manufacturing/);
  const invalid=structuredClone(study);invalid.status='NumericallyIndeterminate';assert.throws(()=>generateSvgNet(invalid));assert.throws(()=>serializeCartonStudyJson(invalid));
  const poisoned=structuredClone(study);poisoned.faces.base.cornersNet[0].x=NaN;assert.throws(()=>generateSvgNet(poisoned));assert.throws(()=>serializeCartonStudyJson(poisoned));
  for(const margin of [-1,NaN,Infinity,1001])assert.throws(()=>generateSvgNet(study,margin));
});
