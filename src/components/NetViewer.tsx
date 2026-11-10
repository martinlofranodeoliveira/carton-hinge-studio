import React from 'react';
import { CartonStudy, FaceId, Locale } from '../core/types';
import { FACE_LABELS, FACE_SHORT_LABELS, UI_TEXT } from '../core/i18n';
import { FACE_PALETTE } from '../core/threeScene';
import { VALID_FACE_IDS } from '../core/validator';

interface NetViewerProps {
  locale: Locale;
  study: CartonStudy;
  selectedFace: FaceId | null;
  onSelectFace: (face: FaceId) => void;
}

export const NetViewer: React.FC<NetViewerProps> = ({
  locale,
  study,
  selectedFace,
  onSelectFace
}) => {
  const t = UI_TEXT[locale];
  const { faces, dimensions } = study;
  const { width: W, depth: D, height: H } = dimensions;
  const margin = Math.max(16, Math.max(W, D, H) * 0.12);

  const minX = -(W / 2.0 + H);
  const maxX = W / 2.0 + H;
  const minY = -(D / 2.0 + H);
  const maxY = D / 2.0 + H + D;

  const totalWidth = maxX - minX + margin * 2;
  const totalHeight = maxY - minY + margin * 2;
  const labelFontSize = Math.max(8, Math.min(W, D, H) * 0.22);
  const strokeScale = Math.max(1, Math.max(W, D, H) * 0.015);

  function toSvgX(x: number): number {
    return x - minX + margin;
  }
  function toSvgY(y: number): number {
    return maxY - y + margin;
  }

  return (
    <div className="chs-card" data-testid="net-viewer">
      <div className="chs-card-header">
        <h3 className="chs-card-title">{t.netTitle}</h3>
      </div>
      <p style={{ margin: '0 0 8px 0', fontSize: '0.875rem', color: '#526273' }}>
        {t.netHelp}
      </p>

      {/* Keyboard-friendly face selector pills */}
      <div
        role="group"
        aria-label={t.netTitle}
        style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}
      >
        {VALID_FACE_IDS.map(faceId => {
          const isSelected = selectedFace === faceId;
          return (
            <button
              key={faceId}
              type="button"
              data-testid={`select-face-pill-${faceId}`}
              aria-pressed={isSelected}
              onClick={() => onSelectFace(faceId)}
              className={`chs-btn ${isSelected ? 'chs-btn-active' : ''}`}
            >
              {FACE_SHORT_LABELS[faceId][locale]}
            </button>
          );
        })}
      </div>

      <div style={{ width: '100%', height: '240px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          style={{ maxWidth: '100%', maxHeight: '100%' }}
          role="group"
          aria-label={t.netTitle}
        >
          {/* Faces */}
          {Object.values(faces).map(face => {
            const pts = face.cornersNet
              .map(p => `${toSvgX(p.x).toFixed(2)},${toSvgY(p.y).toFixed(2)}`)
              .join(' ');
            const centerX = face.cornersNet.reduce((sum, p) => sum + p.x, 0) / 4.0;
            const centerY = face.cornersNet.reduce((sum, p) => sum + p.y, 0) / 4.0;
            const isSelected = selectedFace === face.id;

            return (
              <g
                key={face.id}
                className="chs-svg-face"
                data-testid={`net-face-${face.id}`}
                role="button"
                tabIndex={0}
                aria-label={`${FACE_LABELS[face.id][locale]} (${face.width} × ${face.height} mm)`}
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
                  points={pts}
                  fill={isSelected ? '#235bd4' : FACE_PALETTE[face.id]}
                  stroke="#202b36"
                  strokeWidth={isSelected ? strokeScale * 1.8 : strokeScale}
                  opacity={isSelected ? 0.92 : 0.8}
                />
                <text
                  x={toSvgX(centerX)}
                  y={toSvgY(centerY)}
                  fontFamily="Public Sans, sans-serif"
                  fontSize={labelFontSize}
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

          {/* 5 Hinges (dashed crease lines) */}
          <line
            x1={toSvgX(-W / 2)}
            y1={toSvgY(D / 2)}
            x2={toSvgX(W / 2)}
            y2={toSvgY(D / 2)}
            stroke="#235bd4"
            strokeWidth={strokeScale * 1.2}
            strokeDasharray={`${strokeScale * 3},${strokeScale * 2}`}
          />
          <line
            x1={toSvgX(-W / 2)}
            y1={toSvgY(-D / 2)}
            x2={toSvgX(W / 2)}
            y2={toSvgY(-D / 2)}
            stroke="#235bd4"
            strokeWidth={strokeScale * 1.2}
            strokeDasharray={`${strokeScale * 3},${strokeScale * 2}`}
          />
          <line
            x1={toSvgX(W / 2)}
            y1={toSvgY(D / 2)}
            x2={toSvgX(W / 2)}
            y2={toSvgY(-D / 2)}
            stroke="#235bd4"
            strokeWidth={strokeScale * 1.2}
            strokeDasharray={`${strokeScale * 3},${strokeScale * 2}`}
          />
          <line
            x1={toSvgX(-W / 2)}
            y1={toSvgY(D / 2)}
            x2={toSvgX(-W / 2)}
            y2={toSvgY(-D / 2)}
            stroke="#235bd4"
            strokeWidth={strokeScale * 1.2}
            strokeDasharray={`${strokeScale * 3},${strokeScale * 2}`}
          />
          <line
            x1={toSvgX(-W / 2)}
            y1={toSvgY(D / 2 + H)}
            x2={toSvgX(W / 2)}
            y2={toSvgY(D / 2 + H)}
            stroke="#235bd4"
            strokeWidth={strokeScale * 1.2}
            strokeDasharray={`${strokeScale * 3},${strokeScale * 2}`}
          />
        </svg>
      </div>
    </div>
  );
};
