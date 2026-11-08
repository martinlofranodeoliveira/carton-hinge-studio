import React, { useState, useMemo } from 'react';
import { deriveCartonStudy } from './core/carton';
import { generateSvgNet } from './core/svg';
import { CartonDimensions, FaceId } from './core/types';
import { Toolbar } from './components/Toolbar';
import { CartonScene } from './components/CartonScene';
import { NetViewer } from './components/NetViewer';
import { SeamInspector } from './components/SeamInspector';
import { FaceInspector } from './components/FaceInspector';

export const App: React.FC = () => {
  const [dimensions, setDimensions] = useState<CartonDimensions>({
    width: 120,
    depth: 80,
    height: 40
  });
  const [foldTicks, setFoldTicks] = useState<number>(500);
  const [selectedFace, setSelectedFace] = useState<FaceId | null>('lid');

  const study = useMemo(() => {
    return deriveCartonStudy(dimensions, foldTicks);
  }, [dimensions, foldTicks]);

  const handleExportSvg = () => {
    const svgContent = generateSvgNet(study);
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carton-net-${dimensions.width}x${dimensions.depth}x${dimensions.height}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const jsonContent = JSON.stringify(study, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carton-study-${dimensions.width}x${dimensions.depth}x${dimensions.height}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setDimensions({ width: 120, depth: 80, height: 40 });
    setFoldTicks(500);
    setSelectedFace('lid');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#f1f5f9',
      color: '#0f172a',
      fontFamily: '"Public Sans", system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
            Carton Hinge Studio
          </h1>
          <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e2e8f0', color: '#475569' }}>
            v0.1.0
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b' }}>
          <span>Dimensões: <strong>{dimensions.width} × {dimensions.depth} × {dimensions.height} mm</strong></span>
          <span>Dobra: <strong>{((foldTicks / 1000) * 90).toFixed(1)}°</strong></span>
          <span>Status: <strong style={{ color: study.isFullyClosed ? '#16a34a' : '#d97706' }}>
            {study.isFullyClosed ? 'Vedado' : 'Articulado'}
          </strong></span>
        </div>
      </header>

      {/* Main Workspace */}
      <main style={{
        display: 'grid',
        gridTemplateColumns: '380px 1fr 340px',
        gap: '16px',
        padding: '16px',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Left Column: Controls & 2D Net */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          <Toolbar
            dimensions={dimensions}
            foldTicks={foldTicks}
            onDimensionsChange={setDimensions}
            onFoldTicksChange={setFoldTicks}
            onExportSvg={handleExportSvg}
            onExportJson={handleExportJson}
            onReset={handleReset}
          />
          <NetViewer
            study={study}
            selectedFace={selectedFace}
            onSelectFace={setSelectedFace}
          />
        </section>

        {/* Center Column: 3D Articulated Maquette */}
        <section style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 10,
            fontSize: '12px',
            fontWeight: 600,
            color: '#475569',
            backgroundColor: 'rgba(255,255,255,0.85)',
            padding: '4px 8px',
            borderRadius: '4px',
            backdropFilter: 'blur(4px)'
          }}>
            Vista 3D Dinâmica (WebGL)
          </div>
          <CartonScene
            study={study}
            selectedFace={selectedFace}
            onSelectFace={setSelectedFace}
          />
        </section>

        {/* Right Column: Seam Table & Face Details */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          <FaceInspector
            study={study}
            selectedFace={selectedFace}
          />
          <SeamInspector
            study={study}
          />
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '8px 24px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <span>Planificação cinemática com fechamento milimétrico exato e modelo de 5 vincos.</span>
        <span>© 2026 Lofrano Tecnologia · Software Livre (MIT)</span>
      </footer>
    </div>
  );
};
