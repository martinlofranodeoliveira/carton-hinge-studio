import React from 'react';
import { CartonStudy, FaceId } from '../core/types';

interface NetViewerProps {
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

export const NetViewer: React.FC<NetViewerProps> = ({
  study,
  selectedFace,
  onSelectFace
}) => {
  const { faces, dimensions } = study;
  const { width: W, depth: D, height: H } = dimensions;
  const margin = 20;

  const minX = -(W / 2.0 + H);
  const maxX = W / 2.0 + H;
  const minY = -(D / 2.0 + H);
  const maxY = D / 2.0 + H + D;

  const totalWidth = maxX - minX + margin * 2;
  const totalHeight = maxY - minY + margin * 2;

  function toSvgX(x: number): number {
    return x - minX + margin;
  }
  function toSvgY(y: number): number {
    return maxY - y + margin;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      padding: '12px'
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
        Planificação 2D (Net SVG)
      </h3>
      <div style={{ width: '100%', height: '240px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          style={{ maxWidth: '100%', maxHeight: '100%', cursor: 'pointer' }}
        >
          {/* Faces */}
          {Object.values(faces).map(face => {
            const pts = face.cornersNet
              .map(p => `${toSvgX(p.x).toFixed(1)},${toSvgY(p.y).toFixed(1)}`)
              .join(' ');
            const centerX = face.cornersNet.reduce((sum, p) => sum + p.x, 0) / 4.0;
            const centerY = face.cornersNet.reduce((sum, p) => sum + p.y, 0) / 4.0;
            const isSelected = selectedFace === face.id;

            return (
              <g key={face.id} onClick={() => onSelectFace(face.id)}>
                <polygon
                  points={pts}
                  fill={isSelected ? '#2563eb' : FACE_COLORS[face.id]}
                  stroke="#1e293b"
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  opacity={isSelected ? 0.9 : 0.75}
                />
                <text
                  x={toSvgX(centerX)}
                  y={toSvgY(centerY)}
                  fontFamily="Public Sans, sans-serif"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#0f172a"
                >
                  {face.name.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* Hinges (dashed fold lines) */}
          <line
            x1={toSvgX(-W / 2)}
            y1={toSvgY(D / 2)}
            x2={toSvgX(W / 2)}
            y2={toSvgY(D / 2)}
            stroke="#235bd4"
            strokeWidth="1.5"
            strokeDasharray="4,3"
          />
          <line
            x1={toSvgX(-W / 2)}
            y1={toSvgY(-D / 2)}
            x2={toSvgX(W / 2)}
            y2={toSvgY(-D / 2)}
            stroke="#235bd4"
            strokeWidth="1.5"
            strokeDasharray="4,3"
          />
          <line
            x1={toSvgX(W / 2)}
            y1={toSvgY(D / 2)}
            x2={toSvgX(W / 2)}
            y2={toSvgY(-D / 2)}
            stroke="#235bd4"
            strokeWidth="1.5"
            strokeDasharray="4,3"
          />
          <line
            x1={toSvgX(-W / 2)}
            y1={toSvgY(D / 2)}
            x2={toSvgX(-W / 2)}
            y2={toSvgY(-D / 2)}
            stroke="#235bd4"
            strokeWidth="1.5"
            strokeDasharray="4,3"
          />
          <line
            x1={toSvgX(-W / 2)}
            y1={toSvgY(D / 2 + H)}
            x2={toSvgX(W / 2)}
            y2={toSvgY(D / 2 + H)}
            stroke="#235bd4"
            strokeWidth="1.5"
            strokeDasharray="4,3"
          />
        </svg>
      </div>
    </div>
  );
};
