import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CartonFace, CartonStudy, FaceId, Locale } from '../core/types';
import {
  CameraPresetId,
  computeCameraFraming,
  computeClampedViewport,
  createFaceGeometryBundle,
  FACE_PALETTE,
  projectIsometricPoint,
  SCENE_UNIT_SCALE
} from '../core/threeScene';
import { FACE_SHORT_LABELS, UI_TEXT } from '../core/i18n';
import { leaseCameraInteraction, observeCanvasContext } from '../core/cameraLifecycle';

interface CartonSceneProps {
  locale: Locale;
  study: CartonStudy;
  selectedFace: FaceId | null;
  onSelectFace: (face: FaceId) => void;
  forceFallback?: boolean;
}

function detectWebGLSupport(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  if (typeof ResizeObserver === 'undefined') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    (gl as WebGLRenderingContext | null)?.getExtension?.('WEBGL_lose_context')?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

const CameraRig: React.FC<{
  study: CartonStudy;
  preset: CameraPresetId;
  cameraEnabled: boolean;
}> = ({ study, preset, cameraEnabled }) => {
  const { camera, gl, size, invalidate } = useThree();
  const framing = useMemo(() => computeCameraFraming(study, preset, size.width / Math.max(1, size.height)), [study, preset, size.width, size.height]);

  useEffect(() => {
    const policy = computeClampedViewport(
      size.width,
      size.height,
      typeof window !== 'undefined' ? window.devicePixelRatio : 1
    );
    gl.setPixelRatio(policy.effectiveDpr);
  }, [gl, size.width, size.height]);

  useEffect(() => {
    camera.position.set(framing.position[0], framing.position[1], framing.position[2]);
    camera.up.set(framing.up[0], framing.up[1], framing.up[2]);
    if ('near' in camera) {
      camera.near = framing.near;
      camera.far = framing.far;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(framing.target[0], framing.target[1], framing.target[2]);
    invalidate();
  }, [camera, framing, invalidate]);

  if (!cameraEnabled) {
    return null;
  }

  return (
    <OrbitControls
      makeDefault
      target={framing.target}
      enableDamping={false}
      autoRotate={false}
      onChange={() => invalidate()}
    />
  );
};

const FaceMesh: React.FC<{
  face: CartonFace;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ face, isSelected, onSelect }) => {
  const bundle = useMemo(() => createFaceGeometryBundle(face), [face]);
  const meshMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isSelected ? '#235bd4' : FACE_PALETTE[face.id],
        side: THREE.DoubleSide,
        roughness: 0.45,
        metalness: 0.08
      }),
    [face.id, isSelected]
  );
  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: isSelected ? '#1d4ed8' : '#202b36'
      }),
    [isSelected]
  );

  useEffect(() => {
    return () => {
      bundle.dispose();
    };
  }, [bundle]);

  useEffect(() => {
    return () => {
      meshMaterial.dispose();
    };
  }, [meshMaterial]);

  useEffect(() => {
    return () => {
      lineMaterial.dispose();
    };
  }, [lineMaterial]);

  return (
    <group
      matrixAutoUpdate={false}
      matrix={bundle.matrix}
      onClick={e => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <mesh geometry={bundle.geometry} material={meshMaterial} />
      <lineSegments geometry={bundle.edgesGeometry} material={lineMaterial} />
    </group>
  );
};

const IsometricSvgFallback: React.FC<{
  locale: Locale;
  study: CartonStudy;
  selectedFace: FaceId | null;
  onSelectFace: (face: FaceId) => void;
  showNotice: boolean;
}> = ({ locale, study, selectedFace, onSelectFace, showNotice }) => {
  const t = UI_TEXT[locale];

  const projectedFaces = useMemo(() => {
    const entries = Object.values(study.faces).map(face => {
      const pts2d = face.corners3D.map(projectIsometricPoint);
      const avgDepth = face.corners3D.reduce((acc, p) => acc + (p.x + p.y + p.z), 0) / 4;
      const center = pts2d.reduce(
        (acc, p) => ({ x: acc.x + p.x / 4, y: acc.y + p.y / 4 }),
        { x: 0, y: 0 }
      );
      return { face, pts2d, avgDepth, center };
    });
    entries.sort((a, b) => a.avgDepth - b.avgDepth);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const item of entries) {
      for (const p of item.pts2d) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    }
    const spanX = Math.max(10, maxX - minX);
    const spanY = Math.max(10, maxY - minY);
    const pad = Math.max(spanX, spanY) * 0.18;
    return {
      entries,
      viewBox: `${(minX - pad).toFixed(2)} ${(minY - pad).toFixed(2)} ${(spanX + pad * 2).toFixed(2)} ${(spanY + pad * 2).toFixed(2)}`,
      fontSize: Math.max(spanX, spanY) * 0.045
    };
  }, [study]);

  return (
    <div
      data-testid="scene-2d-fallback"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '12px',
        backgroundColor: '#f8fafb'
      }}
    >
      {showNotice && (
        <div
          role="status"
          style={{
            fontSize: '0.875rem',
            padding: '6px 10px',
            borderRadius: '4px',
            backgroundColor: '#eef2f6',
            color: '#334155',
            marginBottom: '8px'
          }}
        >
          {t.webglUnavailableNotice}
        </div>
      )}
      <svg
        viewBox={projectedFaces.viewBox}
        style={{ width: '100%', flex: 1, minHeight: 0, maxHeight: '380px' }}
        aria-label={t.sceneTitle}
        role="group"
      >
        {projectedFaces.entries.map(({ face, pts2d, center }) => {
          const isSelected = selectedFace === face.id;
          const pointsAttr = pts2d.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
          return (
            <g
              key={face.id}
              className="chs-svg-face"
              data-testid={`iso-face-${face.id}`}
              role="button"
              tabIndex={0}
              aria-label={FACE_SHORT_LABELS[face.id][locale]}
              aria-pressed={isSelected}
              onClick={() => onSelectFace(face.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectFace(face.id);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <polygon
                points={pointsAttr}
                fill={isSelected ? '#235bd4' : FACE_PALETTE[face.id]}
                fillOpacity={isSelected ? 0.9 : 0.82}
                stroke="#202b36"
                strokeWidth={projectedFaces.fontSize * 0.12}
              />
              <text
                x={center.x}
                y={center.y}
                fontSize={projectedFaces.fontSize}
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isSelected ? '#ffffff' : '#202b36'}
              >
                {FACE_SHORT_LABELS[face.id][locale]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const CartonScene: React.FC<CartonSceneProps> = ({
  locale,
  study,
  selectedFace,
  onSelectFace,
  forceFallback = false
}) => {
  const t = UI_TEXT[locale];
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasDomRef = useRef<HTMLCanvasElement | null>(null);
  const contextCleanup = useRef<(() => void) | null>(null);

  const [webglSupported] = useState<boolean>(() => detectWebGLSupport());
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [prefer2DFallback, setPrefer2DFallback] = useState<boolean>(false);
  const [cameraEnabled, setCameraEnabled] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('isometric');
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 520
  });

  const useFallback = forceFallback || !webglSupported || contextLost || prefer2DFallback;

  const viewportPolicy = useMemo(
    () =>
      computeClampedViewport(
        containerSize.width,
        containerSize.height,
        typeof window !== 'undefined' ? window.devicePixelRatio : 1
      ),
    [containerSize.width, containerSize.height]
  );

  const framing = useMemo(
    () => computeCameraFraming(study, cameraPreset, containerSize.width / Math.max(1, containerSize.height)),
    [study, cameraPreset, containerSize.width, containerSize.height]
  );

  // Measure container size when ResizeObserver is available
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!cameraEnabled || useFallback || !stageRef.current) return;
    return leaseCameraInteraction(stageRef.current, canvasDomRef.current,
      () => setCameraEnabled(false), window);
  }, [cameraEnabled, useFallback]);
  useEffect(() => {
    if (useFallback) {
      contextCleanup.current?.(); contextCleanup.current = null;
      canvasDomRef.current = null;
      setCameraEnabled(false);
    }
  }, [useFallback]);
  useEffect(() => () => { contextCleanup.current?.(); }, []);

  return (
    <div
      ref={stageRef}
      className="chs-stage-container"
      data-testid="carton-3d-stage"
      style={{ touchAction: 'pan-y pinch-zoom' }}
    >
      {/* Stage Control Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #d5dfe5',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>{t.sceneTitle}</h2>
          <button
            type="button"
            data-testid="toggle-projection-mode"
            onClick={() => {
              setCameraEnabled(false); setContextLost(false);
              setPrefer2DFallback(!useFallback);
            }}
            disabled={!webglSupported || forceFallback}
            className="chs-btn"
          >
            {useFallback ? t.fallbackToggle3D : t.fallbackToggle2D}
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            data-testid="camera-preset-isometric"
            disabled={useFallback}
            onClick={() => setCameraPreset('isometric')}
            className={`chs-btn ${cameraPreset === 'isometric' ? 'chs-btn-active' : ''}`}
          >
            {t.presetIso}
          </button>
          <button
            type="button"
            data-testid="camera-preset-top"
            disabled={useFallback}
            onClick={() => setCameraPreset('top')}
            className={`chs-btn ${cameraPreset === 'top' ? 'chs-btn-active' : ''}`}
          >
            {t.presetTop}
          </button>
          <button
            type="button"
            data-testid="camera-preset-front"
            disabled={useFallback}
            onClick={() => setCameraPreset('front')}
            className={`chs-btn ${cameraPreset === 'front' ? 'chs-btn-active' : ''}`}
          >
            {t.presetFront}
          </button>
          <button
            type="button"
            data-testid="camera-toggle-button"
            aria-pressed={cameraEnabled}
            disabled={useFallback}
            onClick={() => setCameraEnabled(prev => !prev)}
            className={`chs-btn ${cameraEnabled ? 'chs-btn-primary' : ''}`}
          >
            {cameraEnabled ? t.cameraDisableBtn : t.cameraEnableBtn}
          </button>
        </div>
      </div>

      {/* Camera / Scroll status bar */}
      <div
        style={{
          padding: '4px 12px',
          fontSize: '0.875rem',
          color: '#526273',
          backgroundColor: '#f3f6f7',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        {cameraEnabled ? t.cameraHintActive : t.cameraHintInactive}
      </div>

      {/* Stage Viewport */}
      {useFallback ? (
        <IsometricSvgFallback
          locale={locale}
          study={study}
          selectedFace={selectedFace}
          onSelectFace={onSelectFace}
          showNotice={!webglSupported || contextLost}
        />
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          <Canvas
            dpr={viewportPolicy.effectiveDpr}
            frameloop="demand"
            camera={{
              position: framing.position,
              fov: 45,
              up: framing.up,
              near: framing.near,
              far: framing.far
            }}
            onCreated={({ gl }) => {
              canvasDomRef.current = gl.domElement;
              gl.domElement.style.touchAction = cameraEnabled ? 'none' : 'pan-y pinch-zoom';
              gl.setPixelRatio(viewportPolicy.effectiveDpr);

              contextCleanup.current?.();
              contextCleanup.current = observeCanvasContext(gl.domElement, () => {
                setCameraEnabled(false); setContextLost(true);
              }, () => setContextLost(false));
            }}
          >
            <ambientLight intensity={0.85} />
            <directionalLight position={[6, -7, 10]} intensity={1.15} />
            <directionalLight position={[-6, 6, -3]} intensity={0.35} />

            <CameraRig
              study={study}
              preset={cameraPreset}
              cameraEnabled={cameraEnabled}
            />

            <group scale={[SCENE_UNIT_SCALE, SCENE_UNIT_SCALE, SCENE_UNIT_SCALE]}>
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
              args={[framing.gridSize, 24, '#94a3b8', '#dbe4ea']}
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, 0, -0.001]}
            />
          </Canvas>
        </div>
      )}
    </div>
  );
};
