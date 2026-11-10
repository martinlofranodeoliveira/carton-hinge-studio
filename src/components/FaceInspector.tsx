import React from 'react';
import { CartonStudy, FaceId, Locale } from '../core/types';
import { FACE_LABELS, FACE_SHORT_LABELS, HINGE_LABELS, UI_TEXT } from '../core/i18n';

interface FaceInspectorProps {
  locale: Locale;
  study: CartonStudy;
  selectedFace: FaceId | null;
}

export const FaceInspector: React.FC<FaceInspectorProps> = ({
  locale,
  study,
  selectedFace
}) => {
  const t = UI_TEXT[locale];

  return (
    <div className="chs-card" data-testid="face-inspector">
      <div className="chs-card-header">
        <h3 className="chs-card-title">{t.faceInspectorTitle}</h3>
      </div>

      {!selectedFace ? (
        <div style={{ fontSize: '0.875rem', color: '#526273', padding: '8px 0' }}>
          {t.faceSelectPrompt}
        </div>
      ) : (
        (() => {
          const face = study.faces[selectedFace];
          const { normal3D, corners3D, localCorners } = face;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.875rem', color: '#202b36' }} data-testid="inspected-face-name">
                  {FACE_LABELS[face.id][locale]}
                </strong>
                <span style={{ fontSize: '0.875rem', color: '#526273', fontVariantNumeric: 'tabular-nums' }}>
                  {face.width} × {face.height} mm
                </span>
              </div>

              <div style={{ fontSize: '0.875rem', color: '#334155', fontVariantNumeric: 'tabular-nums' }}>
                <div style={{ marginBottom: '6px' }}>
                  <strong>{t.outwardNormal}:</strong> ({normal3D.x.toFixed(3)}, {normal3D.y.toFixed(3)}, {normal3D.z.toFixed(3)})
                </div>

                <div style={{ marginBottom: '6px' }}>
                  <strong>{t.localPolygon}:</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '3px', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {localCorners.map((c, i) => (
                      <div key={i} style={{ padding: '2px 5px', background: '#f8fafb', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
                        L{i}: ({c.x.toFixed(1)}, {c.y.toFixed(1)})
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <strong>{t.worldCorners}:</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '3px', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {corners3D.map((c, i) => (
                      <div key={i} style={{ padding: '2px 5px', background: '#f8fafb', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
                        V{i}: ({c.x.toFixed(1)}, {c.y.toFixed(1)}, {c.z.toFixed(1)})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* 5 Revolute Hinges Inspector */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '6px', color: '#202b36' }}>
          {t.hingesSubheading}
        </div>
        <div className="chs-table-scroll"><table className="chs-table" data-testid="hinge-inspector-table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">{t.hingeParentChild}</th>
              <th scope="col">{t.hingeAxisSign}</th>
              <th scope="col">{t.hingeAngle}</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(study.hinges).map(hinge => (
              <tr key={hinge.id}>
                <td style={{ fontWeight: 600 }} title={HINGE_LABELS[hinge.id][locale]}>{hinge.id}</td>
                <td>
                  {FACE_SHORT_LABELS[hinge.parentFace][locale]} → {FACE_SHORT_LABELS[hinge.childFace][locale]}
                </td>
                <td style={{ fontFamily: 'monospace' }}>
                  {hinge.axis.toUpperCase()} ({hinge.signedQuarterTurn > 0 ? '+90°' : '-90°'})
                </td>
                <td style={{ fontFamily: 'monospace' }}>
                  {(hinge.signedQuarterTurn * hinge.angleDegrees).toFixed(1)}°
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
};
