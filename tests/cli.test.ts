import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
function cli(args:string[]){return spawnSync(process.execPath,['scripts/check.mjs','demo',...args],{encoding:'utf8',timeout:20000});}
test('actual CLI rejects malformed, duplicate, unknown and out-of-range arguments before output',()=>{
  for(const args of [['study','--width=1oops'],['study','--width=12','--width=13'],['study','--fold=500.5'],['study','--width=4096'],['study','--format=unknown'],['unknown'],['demo','--json','--json']]){
    const result=cli(args);assert.equal(result.error,undefined);assert.equal(result.status,2,args.join(' '));assert.equal(result.stdout,'');assert.match(result.stderr,/Invalid command or study parameters/);
  }
});
test('actual CLI produces valid deterministic JSON and genuine SVG',()=>{
  const first=cli(['study','--width=201','--depth=80','--height=40','--fold=500','--format=json']);const second=cli(['study','--width=201','--depth=80','--height=40','--fold=500','--format=json']);assert.equal(first.status,0);assert.equal(first.stdout,second.stdout);const value=JSON.parse(first.stdout);assert.equal(value.dimensions.width,201);assert.equal(value.foldTicks,500);
  const svg=cli(['svg','--width=120','--depth=80','--height=40']);assert.equal(svg.status,0);assert.match(svg.stdout,/^<\?xml/);assert.match(svg.stdout,/not a manufacturing/);
});
