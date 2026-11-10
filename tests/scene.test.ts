import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {deriveCartonStudy} from '../src/core/carton';
import {buildCartonSceneGraph,computeClampedViewport,computeCameraFraming,MAX_BACKING_BUFFER_PIXELS,SCENE_UNIT_SCALE} from '../src/core/threeScene';
test('actual BufferGeometry and world matrices match all core vertices and outward normals',()=>{
  for(const ticks of [0,500,1000]){
    const study=deriveCartonStudy({width:120,depth:80,height:40},ticks);const scene=buildCartonSceneGraph(study,'lid');
    assert.equal(scene.totalVertices,24);assert.equal(scene.totalTriangles,12);scene.rootGroup.updateMatrixWorld(true);
    for(const face of Object.values(study.faces)){
      const mesh=scene.faceMeshes[face.id];const positions=mesh.geometry.getAttribute('position');assert.equal(positions.count,4);assert.equal(mesh.geometry.getIndex()!.count,6);
      for(let i=0;i<4;i++){const p=new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);const expected=face.corners3D[i];assert.ok(p.distanceTo(new THREE.Vector3(expected.x,expected.y,expected.z).multiplyScalar(SCENE_UNIT_SCALE))<1e-9);}
      const normal=new THREE.Vector3().fromBufferAttribute(mesh.geometry.getAttribute('normal'),0).transformDirection(mesh.matrixWorld);
      assert.ok(normal.dot(new THREE.Vector3(face.normal3D.x,face.normal3D.y,face.normal3D.z))>.999999,face.id);
    }
    const resources=new Set<THREE.BufferGeometry|THREE.Material>();scene.rootGroup.traverse(object=>{const item=object as THREE.Mesh;if(item.geometry)resources.add(item.geometry);if(item.material)for(const material of Array.isArray(item.material)?item.material:[item.material])resources.add(material);});
    const disposed=new Map<object,number>();for(const resource of resources)resource.addEventListener('dispose',()=>disposed.set(resource,(disposed.get(resource)??0)+1));
    scene.dispose();scene.dispose();assert.equal(disposed.size,resources.size);for(const count of disposed.values())assert.equal(count,1);
  }
});
test('DPR and backing-buffer pixel ceilings hold for normal, extreme and invalid viewport inputs',()=>{
  for(const [width,height,dpr] of [[800,600,3],[1e12,1,2],[1,1e12,2],[1e308,1e308,2],[NaN,Infinity,NaN],[1,1,2],[0,-2,1]]){
    const policy=computeClampedViewport(width,height,dpr);assert.ok(Number.isFinite(policy.effectiveDpr)&&policy.effectiveDpr>0&&policy.effectiveDpr<=2);
    assert.ok(Number.isInteger(policy.backingPixels)&&policy.backingPixels>=1&&policy.backingPixels<=MAX_BACKING_BUFFER_PIXELS);
  }
});
test('actual perspective projections frame admitted dimensions in portrait and landscape presets',()=>{
  for(const dims of [{width:1,depth:1,height:1},{width:4095,depth:1,height:1},{width:1,depth:4095,height:4095},{width:4095,depth:4095,height:4095}])for(const ticks of [0,500,1000])for(const aspect of [296/520,2])for(const preset of ['isometric','top','front'] as const){
    const study=deriveCartonStudy(dims,ticks);const frame=computeCameraFraming(study,preset,aspect);const camera=new THREE.PerspectiveCamera(45,aspect,frame.near,frame.far);camera.position.fromArray(frame.position);camera.up.fromArray(frame.up);camera.lookAt(...frame.target);camera.updateMatrixWorld();
    for(const face of Object.values(study.faces))for(const point of face.corners3D){const projected=new THREE.Vector3(point.x,point.y,point.z).multiplyScalar(SCENE_UNIT_SCALE).project(camera);assert.ok(Math.abs(projected.x)<=1&&Math.abs(projected.y)<=1&&projected.z>=-1&&projected.z<=1,`${preset}/${aspect}/${face.id}`);}
  }
});
