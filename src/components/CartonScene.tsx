import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CartonFace, CartonStudy, FaceId } from '../core/types';

interface CartonSceneProps {
  study: CartonStudy;
  selectedFace: FaceId | null;
  onSelectFace: (face: FaceId) => void;
}

const FACE_COLORS: Record<FaceId, string> = {
  base: '#cbd5e1',
  north: '#93c5fd',
  south: '#fde047',
  east: '#86efac',
  west: '#fca5a5',
  lid: '#d8b4fe'
};

const FaceMesh: React.FC<{
  face: CartonFace;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ face, isSelected, onSelect }) => {
  const { geometry, edgesGeometry } = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const pts = face.corners3D;
    const positions = new Float32Array([
      pts[0].x, pts[0].y, pts[0].z,
      pts[1].x, pts[1].y, pts[1].z,
      pts[2].x, pts[2].y, pts[2].z,
      pts[0].x, pts[0].y, pts[0].z,
      pts[2].x, pts[2].y, pts[2].z,
      pts[3].x, pts[3].y, pts[3].z
    ]);
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.computeVertexNormals();

    const edges = new THREE.EdgesGeometry(geom);
    return { geometry: geom, edgesGeometry: edges };
  }, [face.corners3D]);

  const color = isSelected ? '#2563eb' : FACE_COLORS[face.id];

  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={color}
          side={THREE.DoubleSide}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color={isSelected ? '#1d4ed8' : '#1e293b'} linewidth={2} />
      </lineSegments>
    </group>
  );
};

export const CartonScene: React.FC<CartonSceneProps> = ({
  study,
  selectedFace,
  onSelectFace
}) => {
  const scale = 0.01; // mm to decimeters for camera view

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '380px', background: '#f8fafc', borderRadius: '8px', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [1.8, -2.2, 2.0], fov: 45, up: [0, 0, 1] }}
        frameloop="demand"
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, -5, 8]} intensity={1.2} />
        <directionalLight position={[-5, 5, -2]} intensity={0.4} />

        <group scale={[scale, scale, scale]}>
          {Object.values(study.faces).map(face => (
            <FaceMesh
              key={face.id}
              face={face}
              isSelected={selectedFace === face.id}
              onSelect={() => onSelectFace(face.id)}
            />
          ))}
        </group>

        <gridHelper
          args={[6, 30, '#94a3b8', '#e2e8f0']}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, -0.001]}
        />
        <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  );
};
