import React from 'react';
import { CartonStudy, FaceId } from '../core/types';

interface FaceInspectorProps {
  study: CartonStudy;
  selectedFace: FaceId | null;
}

export const FaceInspector: React.FC<FaceInspectorProps> = ({ study, selectedFace }) => {
  if (!selectedFace) {
    return (
      <div style={{
        padding: '12px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        fontSize: '12px',
        color: '#64748b',
        textAlign: 'center'
      }}>
        Selecione uma face no modelo 3D ou na planificação 2D para inspecionar.
      </div>
    );
  }

  const face = study.faces[selectedFace];
  const { normal3D, corners3D } = face;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      background: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      padding: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
          Face: {face.name}
        </h3>
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          {face.width} × {face.height} mm
        </span>
      </div>

      <div style={{ fontSize: '11px', color: '#475569' }}>
        <div style={{ marginBottom: '4px' }}>
          <strong>Normal Externa:</strong> ({normal3D.x.toFixed(2)}, {normal3D.y.toFixed(2)}, {normal3D.z.toFixed(2)})
        </div>
        <strong>Vértices no Espaço 3D (X, Y, Z):</strong>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '4px', fontFamily: 'monospace', fontSize: '10px' }}>
          {corners3D.map((c, i) => (
            <div key={i} style={{ padding: '3px 6px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              V{i}: ({c.x.toFixed(1)}, {c.y.toFixed(1)}, {c.z.toFixed(1)})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
