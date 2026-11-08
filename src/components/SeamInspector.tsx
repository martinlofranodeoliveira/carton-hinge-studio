import React from 'react';
import { CartonStudy } from '../core/types';

interface SeamInspectorProps {
  study: CartonStudy;
}

export const SeamInspector: React.FC<SeamInspectorProps> = ({ study }) => {
  const { seams, isFullyClosed, maxSeamGap, tolerance } = study;

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
          Acompanhamento de Arestas (7 Junções)
        </h3>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: '999px',
          backgroundColor: isFullyClosed ? '#dcfce7' : '#fef9c3',
          color: isFullyClosed ? '#15803d' : '#854d0e'
        }}>
          {isFullyClosed ? 'Totalmente Fechada' : `Folga Máx: ${maxSeamGap.toFixed(2)} mm`}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
              <th style={{ padding: '4px 6px' }}>Junção</th>
              <th style={{ padding: '4px 6px' }}>Faces</th>
              <th style={{ padding: '4px 6px' }}>Folga (mm)</th>
              <th style={{ padding: '4px 6px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(seams).map(seam => (
              <tr key={seam.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '4px 6px', fontWeight: 500, color: '#334155' }}>{seam.id}</td>
                <td style={{ padding: '4px 6px', color: '#64748b' }}>{seam.faceA} ↔ {seam.faceB}</td>
                <td style={{ padding: '4px 6px', fontFamily: 'monospace' }}>
                  {seam.maxGap < 1e-4 ? '0.0000' : seam.maxGap.toFixed(2)}
                </td>
                <td style={{ padding: '4px 6px' }}>
                  <span style={{
                    color: seam.isClosed ? '#16a34a' : '#d97706',
                    fontWeight: 600
                  }}>
                    {seam.isClosed ? 'Vedado' : 'Aberto'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: '10px', color: '#94a3b8' }}>
        Tolerância numérica de fechamento: {tolerance.toExponential(2)} mm
      </div>
    </div>
  );
};
