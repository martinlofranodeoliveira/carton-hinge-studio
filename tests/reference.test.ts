import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {deriveCartonStudy} from '../src/core/carton';
import {FaceId} from '../src/core/types';
// Post-source coordinator reference: global flat-net rectangles rotated about
// fixed global hinge lines with maintained Three matrix operations. It does not
// use the implementation's local polygons, basis matrices or matrix helpers.
function reference(w:number,d:number,h:number,ticks:number){
  const corners:Record<FaceId,number[][]>={base:[[-w/2,-d/2,0],[w/2,-d/2,0],[w/2,d/2,0],[-w/2,d/2,0]],north:[[-w/2,d/2,0],[w/2,d/2,0],[w/2,d/2+h,0],[-w/2,d/2+h,0]],south:[[w/2,-d/2,0],[-w/2,-d/2,0],[-w/2,-d/2-h,0],[w/2,-d/2-h,0]],east:[[w/2,d/2,0],[w/2,-d/2,0],[w/2+h,-d/2,0],[w/2+h,d/2,0]],west:[[-w/2,-d/2,0],[-w/2,d/2,0],[-w/2-h,d/2,0],[-w/2-h,-d/2,0]],lid:[[-w/2,d/2+h,0],[w/2,d/2+h,0],[w/2,d/2+h+d,0],[-w/2,d/2+h+d,0]]};
  const angle=ticks*Math.PI/2000;
  const around=(x:number,y:number,rotation:THREE.Matrix4)=>new THREE.Matrix4().makeTranslation(x,y,0).multiply(rotation).multiply(new THREE.Matrix4().makeTranslation(-x,-y,0));
  const transforms:Record<FaceId,THREE.Matrix4>={base:new THREE.Matrix4(),north:around(0,d/2,new THREE.Matrix4().makeRotationX(angle)),south:around(0,-d/2,new THREE.Matrix4().makeRotationX(-angle)),east:around(w/2,0,new THREE.Matrix4().makeRotationY(-angle)),west:around(-w/2,0,new THREE.Matrix4().makeRotationY(angle)),lid:new THREE.Matrix4()};
  transforms.lid.copy(transforms.north).multiply(around(0,d/2+h,new THREE.Matrix4().makeRotationX(angle)));
  return{corners,transforms};
}
test('post-source global-hinge reference agrees at intermediate ticks and extreme dimensions',()=>{
  for(const [w,d,h] of [[120,80,40],[1,1,1],[4095,1,2048],[1,4095,4095],[4095,4095,4095]])for(const ticks of [0,1,249,500,751,999,1000]){
    const expected=reference(w,d,h,ticks);const study=deriveCartonStudy({width:w,depth:d,height:h},ticks);const tolerance=1e-9*Math.max(w,d,h);
    for(const face of Object.values(study.faces))for(let i=0;i<4;i++){const point=new THREE.Vector3(...expected.corners[face.id][i] as [number,number,number]).applyMatrix4(expected.transforms[face.id]);const actual=face.corners3D[i];assert.ok(point.distanceTo(new THREE.Vector3(actual.x,actual.y,actual.z))<=tolerance,`${face.id}/${ticks}`);}
  }
});
test('closed topology recovers eight cuboid corners, twelve edges and reciprocal identities',()=>{
  const study=deriveCartonStudy({width:120,depth:80,height:40},1000);const key=(p:{x:number;y:number;z:number})=>`${p.x},${p.y},${p.z}`;const vertices=new Set(Object.values(study.faces).flatMap(face=>face.corners3D.map(key)));assert.equal(vertices.size,8);const expected=new Set<string>();for(const x of [-60,60])for(const y of [-40,40])for(const z of [0,40])expected.add(`${x},${y},${z}`);assert.deepEqual(vertices,expected);
  const edges=new Set<string>();for(const edge of Object.values(study.faceEdges)){const paired=study.faceEdges[edge.pairedEdgeId];assert.equal(paired.pairedEdgeId,edge.id);assert.equal(paired.physicalEdgeId,edge.physicalEdgeId);edges.add([key(edge.start3D),key(edge.end3D)].sort().join('|'));}assert.equal(edges.size,12);assert.equal(Object.keys(study.physicalEdges).length,12);
});
