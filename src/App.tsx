import React, { useState, useMemo, useRef, useEffect } from 'react';
import './styles.css';
import { X } from 'lucide-react';
import { deriveCartonStudy } from './core/carton';
import { generateSvgNet } from './core/svg';
import { parseCartonStudyJson, serializeCartonStudyJson } from './core/studyIo';
import { CartonDimensions, FaceId, Locale, MAX_STUDY_JSON_BYTES, StudyDiagnosticCode } from './core/types';
import { formatDiagnosticMessage, UI_TEXT } from './core/i18n';
import { Toolbar } from './components/Toolbar';
import { CartonScene } from './components/CartonScene';
import { NetViewer } from './components/NetViewer';
import { SeamInspector } from './components/SeamInspector';
import { FaceInspector } from './components/FaceInspector';

export const App: React.FC = () => {
  const [locale, setLocale] = useState<Locale>('pt-BR');
  const [dimensions, setDimensions] = useState<CartonDimensions>({
    width: 120,
    depth: 80,
    height: 40
  });
  const [foldTicks, setFoldTicks] = useState<number>(500);
  const [selectedFace, setSelectedFace] = useState<FaceId | null>('lid');
  const [diagnosticError, setDiagnosticError] = useState<{ code: StudyDiagnosticCode; field?: string } | null>(null);

  // Monotonic counter to guard against stale async file reads
  const asyncEpochRef = useRef<number>(0);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const study = useMemo(() => {
    return deriveCartonStudy(dimensions, foldTicks);
  }, [dimensions, foldTicks]);

  const t = UI_TEXT[locale];

  useEffect(() => () => { asyncEpochRef.current += 1; }, []);

  const bumpEpoch = () => {
    asyncEpochRef.current += 1;
    return asyncEpochRef.current;
  };

  const handleDimensionsChange = (nextDims: CartonDimensions) => {
    bumpEpoch();
    setDimensions(nextDims);
  };

  const handleFoldTicksChange = (nextTicks: number) => {
    bumpEpoch();
    setFoldTicks(nextTicks);
  };

  const handleApplyPreset = (nextDims: CartonDimensions, nextTicks: number) => {
    bumpEpoch();
    setDimensions(nextDims);
    setFoldTicks(nextTicks);
  };

  const handleSelectFace = (face: FaceId) => { bumpEpoch(); setSelectedFace(face); };
  const download = (content: string, type: string, filename: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    try {
      link.href = url; link.download = filename;
      document.body.appendChild(link); link.click();
    } finally { link.remove(); URL.revokeObjectURL(url); }
  };

  const handleExportSvg = () => {
    try {
      const svgContent = generateSvgNet(study);
      download(svgContent, 'image/svg+xml;charset=utf-8', `carton-net-${dimensions.width}x${dimensions.depth}x${dimensions.height}.svg`);
    } catch {
      setDiagnosticError({ code: 'EXPORT_FAILED' });
    }
  };

  const handleExportJson = () => {
    try {
      const jsonContent = serializeCartonStudyJson(study, selectedFace);
      download(jsonContent, 'application/json;charset=utf-8', `carton-study-${dimensions.width}x${dimensions.depth}x${dimensions.height}.json`);
    } catch {
      setDiagnosticError({ code: 'EXPORT_FAILED' });
    }
  };

  const handleImportJsonFile = async (file: File) => {
    const requestEpoch = bumpEpoch();

    // Pre-read byte ceiling check
    if (file.size > MAX_STUDY_JSON_BYTES) {
      setDiagnosticError({ code: 'BYTE_LIMIT_EXCEEDED' });
      return;
    }
    if (file.size === 0) {
      setDiagnosticError({ code: 'EMPTY_DOCUMENT' });
      return;
    }

    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      if (asyncEpochRef.current !== requestEpoch) return;
      setDiagnosticError({ code: 'READ_FAILED' });
      return;
    }

    // Discard stale async completion if user mutated state or started a newer import
    if (asyncEpochRef.current !== requestEpoch) {
      return;
    }

    const result = parseCartonStudyJson(bytes);
    if (!result.ok) {
      setDiagnosticError({ code: result.code, field: result.field });
      return;
    }

    setDiagnosticError(null);
    setDimensions(result.document.dimensions);
    setFoldTicks(result.document.foldTicks);
    if (result.document.selectedFace !== undefined) {
      setSelectedFace(result.document.selectedFace);
    }
  };

  const handleReset = () => {
    bumpEpoch();
    setDiagnosticError(null);
    setDimensions({ width: 120, depth: 80, height: 40 });
    setFoldTicks(500);
    setSelectedFace('lid');
  };

  const statusLabel = study.isFullyClosed
    ? t.statusClosed
    : foldTicks === 0
      ? t.statusFlat
      : t.statusArticulated;

  return (
    <div className="chs-app">
      {/* Header */}
      <header className="chs-header">
        <div className="chs-brand">
          <h1 className="chs-title">Carton Hinge Studio</h1>
          <span className="chs-version">v0.1.0</span>
          <p className="chs-subtitle">{t.subtitle}</p>
        </div>

        <div className="chs-header-meta">
          <span>
            {t.headerDimensions}:{' '}
            <strong data-testid="header-dimensions-readout">
              {dimensions.width} × {dimensions.depth} × {dimensions.height} mm
            </strong>
          </span>
          <span>
            {t.headerFold}:{' '}
            <strong data-testid="header-fold-readout">
              {((foldTicks / 1000) * 90).toFixed(1)}°
            </strong>
          </span>
          <span>
            {t.headerStatus}:{' '}
            <strong
              data-testid="header-status-readout"
              style={{
                color: study.isFullyClosed ? 'var(--chs-coincident-fg)' : 'var(--chs-open-fg)'
              }}
            >
              {statusLabel}
            </strong>
          </span>
          <button
            type="button"
            data-testid="locale-toggle-button"
            aria-label={t.langSwitchAria}
            onClick={() => setLocale(prev => (prev === 'pt-BR' ? 'en' : 'pt-BR'))}
            className="chs-btn"
          >
            {t.langSwitchLabel}
          </button>
        </div>
      </header>

      {/* Diagnostic Banner */}
      {diagnosticError && (
        <div role="alert" className="chs-alert" data-testid="diagnostic-alert">
          <span>{formatDiagnosticMessage(diagnosticError.code, locale, diagnosticError.field)}</span>
          <button
            type="button"
            className="chs-btn"
            onClick={() => setDiagnosticError(null)}
            data-testid="dismiss-alert-button"
            aria-label={t.dismissError}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Main Drafting Workspace */}
      <main className="chs-workspace">
        {/* Left Column: Parameter Toolbar & Linked 2D SVG Net */}
        <section className="chs-col-left">
          <Toolbar
            locale={locale}
            dimensions={dimensions}
            foldTicks={foldTicks}
            onDimensionsChange={handleDimensionsChange}
            onFoldTicksChange={handleFoldTicksChange}
            onApplyPreset={handleApplyPreset}
            onValidationError={code => { bumpEpoch(); setDiagnosticError({ code }); }}
            onClearError={() => setDiagnosticError(null)}
            onExportSvg={handleExportSvg}
            onExportJson={handleExportJson}
            onImportJsonFile={handleImportJsonFile}
            onReset={handleReset}
          />
          <NetViewer
            locale={locale}
            study={study}
            selectedFace={selectedFace}
            onSelectFace={handleSelectFace}
          />
        </section>

        {/* Center Column: 3D Articulated Technical Maquette (or 2D Isometric Fallback) */}
        <section className="chs-col-center">
          <CartonScene
            locale={locale}
            study={study}
            selectedFace={selectedFace}
            onSelectFace={handleSelectFace}
          />
        </section>

        {/* Right Column: Face/Hinge Inspector & 12 Paired Physical Edges Table */}
        <section className="chs-col-right">
          <FaceInspector
            locale={locale}
            study={study}
            selectedFace={selectedFace}
          />
          <SeamInspector
            locale={locale}
            study={study}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="chs-footer">
        <span>{t.conceptualDisclaimer}</span>
        <span>{t.footerCopyright}</span>
      </footer>
    </div>
  );
};
