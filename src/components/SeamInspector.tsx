import React from 'react';
import { CartonStudy, Locale, SeamId } from '../core/types';
import { FACE_SHORT_LABELS, HINGE_LABELS, SEAM_LABELS, UI_TEXT } from '../core/i18n';

interface SeamInspectorProps {
  locale: Locale;
  study: CartonStudy;
}

export const SeamInspector: React.FC<SeamInspectorProps> = ({ locale, study }) => {
  const t = UI_TEXT[locale];
  const { physicalEdges, isFullyClosed, maxSeamGap, tolerance } = study;

  return (
    <div className="chs-card" data-testid="seam-inspector">
      <div className="chs-card-header">
        <h3 className="chs-card-title">{t.seamInspectorTitle}</h3>
        <span
          data-testid="seam-summary-badge"
          style={{
            fontSize: '0.875rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '999px',
            backgroundColor: isFullyClosed ? 'var(--chs-coincident-bg)' : 'var(--chs-open-bg)',
            color: isFullyClosed ? 'var(--chs-coincident-fg)' : 'var(--chs-open-fg)'
          }}
        >
          {isFullyClosed
            ? t.seamClosedBadge
            : `${t.seamMaxGapBadge}: ${maxSeamGap.toFixed(2)} mm`}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="chs-table" data-testid="physical-edges-table">
          <thead>
            <tr>
              <th scope="col">{t.colEdge}</th>
              <th scope="col">{t.colKind}</th>
              <th scope="col">{t.colFaces}</th>
              <th scope="col">{t.colGap}</th>
              <th scope="col">{t.colState}</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(physicalEdges).map(pair => {
              const pairTitle =
                pair.kind === 'hinge'
                  ? HINGE_LABELS[pair.id as keyof typeof HINGE_LABELS][locale]
                  : SEAM_LABELS[pair.id as SeamId][locale];
              return (
                <tr key={pair.id} data-testid={`edge-row-${pair.id}`}>
                  <td style={{ fontWeight: 600 }} title={pairTitle}>
                    {pair.id}
                  </td>
                  <td>{pair.kind === 'hinge' ? t.kindHinge : t.kindSeam}</td>
                  <td>
                    {FACE_SHORT_LABELS[pair.faceA][locale]} ↔ {FACE_SHORT_LABELS[pair.faceB][locale]}
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>
                    {pair.maxGap < 1e-4 ? '0.0000' : pair.maxGap.toFixed(2)}
                  </td>
                  <td>
                    <span
                      style={{
                        color: pair.isCoincident ? 'var(--chs-coincident-fg)' : 'var(--chs-open-fg)',
                        fontWeight: 700
                      }}
                    >
                      {pair.isCoincident ? t.stateCoincident : t.stateOpen}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: '0.875rem', color: '#526273', marginTop: '8px' }}>
        {t.toleranceCaption}: {tolerance.toExponential(2)} mm
      </div>
    </div>
  );
};
