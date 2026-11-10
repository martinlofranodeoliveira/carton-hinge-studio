import React, { useState, useEffect, useRef } from 'react';
import { CartonDimensions, Locale, StudyDiagnosticCode } from '../core/types';
import { MIN_DIMENSION, MAX_DIMENSION, MIN_FOLD_TICKS, MAX_FOLD_TICKS, validateDimensions, validateFoldTicks } from '../core/validator';
import { STUDY_PRESETS, UI_TEXT } from '../core/i18n';

interface ToolbarProps {
  locale: Locale;
  dimensions: CartonDimensions;
  foldTicks: number;
  onDimensionsChange: (dims: CartonDimensions) => void;
  onFoldTicksChange: (ticks: number) => void;
  onApplyPreset: (dims: CartonDimensions, foldTicks: number) => void;
  onValidationError: (code: StudyDiagnosticCode) => void;
  onClearError: () => void;
  onExportSvg: () => void;
  onExportJson: () => void;
  onImportJsonFile: (file: File) => void;
  onReset: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  locale,
  dimensions,
  foldTicks,
  onDimensionsChange,
  onFoldTicksChange,
  onApplyPreset,
  onValidationError,
  onClearError,
  onExportSvg,
  onExportJson,
  onImportJsonFile,
  onReset
}) => {
  const t = UI_TEXT[locale];
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [draftWidth, setDraftWidth] = useState<string>(String(dimensions.width));
  const [draftDepth, setDraftDepth] = useState<string>(String(dimensions.depth));
  const [draftHeight, setDraftHeight] = useState<string>(String(dimensions.height));
  const [draftFold, setDraftFold] = useState<string>(String(foldTicks));

  useEffect(() => {
    setDraftWidth(String(dimensions.width));
    setDraftDepth(String(dimensions.depth));
    setDraftHeight(String(dimensions.height));
  }, [dimensions.width, dimensions.depth, dimensions.height]);

  useEffect(() => {
    setDraftFold(String(foldTicks));
  }, [foldTicks]);

  const commitDimensionField = (field: keyof CartonDimensions, raw: string) => {
    const parsed = Number(raw.trim());
    const candidate: CartonDimensions = {
      ...dimensions,
      [field]: parsed
    };
    const err = validateDimensions(candidate);
    if (err || raw.trim() === '') {
      onValidationError('INVALID_DIMENSIONS');
      return;
    }
    onClearError();
    onDimensionsChange(candidate);
  };

  const handleApplyAllDimensions = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftWidth.trim() === '' || draftDepth.trim() === '' || draftHeight.trim() === '') {
      onValidationError('INVALID_DIMENSIONS');
      return;
    }
    const candidate: CartonDimensions = {
      width: Number(draftWidth.trim()),
      depth: Number(draftDepth.trim()),
      height: Number(draftHeight.trim())
    };
    const err = validateDimensions(candidate);
    if (err) {
      onValidationError('INVALID_DIMENSIONS');
      return;
    }
    onClearError();
    onDimensionsChange(candidate);
  };

  const commitFoldInput = (raw: string) => {
    const parsed = Number(raw.trim());
    const err = validateFoldTicks(parsed);
    if (err || raw.trim() === '') {
      onValidationError('INVALID_FOLD_TICKS');
      return;
    }
    onClearError();
    onFoldTicksChange(parsed);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJsonFile(file);
      e.target.value = '';
    }
  };

  return (
    <div className="chs-card" data-testid="parameter-toolbar">
      <div className="chs-card-header">
        <h2 className="chs-card-title">{t.toolbarTitle}</h2>
        <button
          type="button"
          onClick={() => {
            setDraftWidth(String(dimensions.width)); setDraftDepth(String(dimensions.depth));
            setDraftHeight(String(dimensions.height)); setDraftFold(String(foldTicks));
            onReset();
          }}
          className="chs-btn"
          data-testid="reset-study-button"
        >
          {t.resetButton}
        </button>
      </div>

      {/* Dimension Controls (1..4095 mm) */}
      <form onSubmit={handleApplyAllDimensions} noValidate>
        <div className="chs-dim-grid">
          <div className="chs-field">
            <label htmlFor="input-width-mm" className="chs-label">
              {t.widthLabel}
            </label>
            <input
              id="input-width-mm"
              data-testid="input-width-mm"
              type="number"
              min={MIN_DIMENSION}
              max={MAX_DIMENSION}
              step={1}
              value={draftWidth}
              onChange={e => {
                setDraftWidth(e.target.value);
                commitDimensionField('width', e.target.value);
              }}
              className="chs-num-input"
            />
            <input
              aria-label={`${t.widthLabel} (${t.rangeLabel})`}
              type="range"
              min={MIN_DIMENSION}
              max={MAX_DIMENSION}
              value={dimensions.width}
              onChange={e => {
                onClearError();
                onDimensionsChange({ ...dimensions, width: parseInt(e.target.value, 10) });
              }}
              className="chs-range-input"
            />
          </div>

          <div className="chs-field">
            <label htmlFor="input-depth-mm" className="chs-label">
              {t.depthLabel}
            </label>
            <input
              id="input-depth-mm"
              data-testid="input-depth-mm"
              type="number"
              min={MIN_DIMENSION}
              max={MAX_DIMENSION}
              step={1}
              value={draftDepth}
              onChange={e => {
                setDraftDepth(e.target.value);
                commitDimensionField('depth', e.target.value);
              }}
              className="chs-num-input"
            />
            <input
              aria-label={`${t.depthLabel} (${t.rangeLabel})`}
              type="range"
              min={MIN_DIMENSION}
              max={MAX_DIMENSION}
              value={dimensions.depth}
              onChange={e => {
                onClearError();
                onDimensionsChange({ ...dimensions, depth: parseInt(e.target.value, 10) });
              }}
              className="chs-range-input"
            />
          </div>

          <div className="chs-field">
            <label htmlFor="input-height-mm" className="chs-label">
              {t.heightLabel}
            </label>
            <input
              id="input-height-mm"
              data-testid="input-height-mm"
              type="number"
              min={MIN_DIMENSION}
              max={MAX_DIMENSION}
              step={1}
              value={draftHeight}
              onChange={e => {
                setDraftHeight(e.target.value);
                commitDimensionField('height', e.target.value);
              }}
              className="chs-num-input"
            />
            <input
              aria-label={`${t.heightLabel} (${t.rangeLabel})`}
              type="range"
              min={MIN_DIMENSION}
              max={MAX_DIMENSION}
              value={dimensions.height}
              onChange={e => {
                onClearError();
                onDimensionsChange({ ...dimensions, height: parseInt(e.target.value, 10) });
              }}
              className="chs-range-input"
            />
          </div>
        </div>
      </form>

      {/* Fold State Controls (0..1000 ticks) */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <label htmlFor="input-fold-ticks" style={{ fontSize: '0.875rem', fontWeight: 700 }}>
            {t.foldProgressLabel}: {(foldTicks / 10).toFixed(1)}% ({((foldTicks / 1000) * 90).toFixed(1)}°)
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => { onClearError(); onFoldTicksChange(0); }}
              className={`chs-btn ${foldTicks === 0 ? 'chs-btn-active' : ''}`}
              data-testid="fold-preset-flat"
            >
              {t.foldFlatBtn}
            </button>
            <button
              type="button"
              onClick={() => { onClearError(); onFoldTicksChange(500); }}
              className={`chs-btn ${foldTicks === 500 ? 'chs-btn-active' : ''}`}
              data-testid="fold-preset-half"
            >
              {t.foldHalfBtn}
            </button>
            <button
              type="button"
              onClick={() => { onClearError(); onFoldTicksChange(1000); }}
              className={`chs-btn ${foldTicks === 1000 ? 'chs-btn-active' : ''}`}
              data-testid="fold-preset-closed"
            >
              {t.foldClosedBtn}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '8px', alignItems: 'center' }}>
          <input
            aria-label={t.foldTicksLabel}
            data-testid="slider-fold-ticks"
            type="range"
            min={MIN_FOLD_TICKS}
            max={MAX_FOLD_TICKS}
            step={1}
            value={foldTicks}
            onChange={e => {
              onClearError();
              onFoldTicksChange(parseInt(e.target.value, 10));
            }}
            className="chs-range-input"
          />
          <input
            id="input-fold-ticks"
            data-testid="input-fold-ticks"
            type="number"
            min={MIN_FOLD_TICKS}
            max={MAX_FOLD_TICKS}
            step={1}
            value={draftFold}
            onChange={e => {
              setDraftFold(e.target.value);
              commitFoldInput(e.target.value);
            }}
            className="chs-num-input"
          />
        </div>
      </div>

      {/* Example Studies */}
      <div style={{ marginBottom: '12px' }}>
        <div className="chs-label" style={{ marginBottom: '6px' }}>{t.presetsHeading}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {STUDY_PRESETS.map(p => (
            <button
              key={p.id}
              type="button"
              title={p.description[locale]}
              onClick={() => {
                onClearError();
                onApplyPreset(
                  { width: p.width, depth: p.depth, height: p.height },
                  p.foldTicks
                );
              }}
              className="chs-btn"
              data-testid={`preset-${p.id}`}
            >
              {p.label[locale]}
            </button>
          ))}
        </div>
      </div>

      {/* Portable Study Import / Export */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '8px', borderTop: '1px solid #eef2f5' }}>
        <button
          type="button"
          onClick={onExportSvg}
          className="chs-btn chs-btn-primary"
          data-testid="export-svg-button"
        >
          {t.exportSvgBtn}
        </button>
        <button
          type="button"
          onClick={onExportJson}
          className="chs-btn chs-btn-dark"
          data-testid="export-json-button"
        >
          {t.exportJsonBtn}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="chs-btn"
          data-testid="import-json-trigger"
        >
          {t.importJsonBtn}
        </button>
        <input
          ref={fileInputRef}
          data-testid="import-json-input"
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-label={t.importJsonBtn}
        />
      </div>
    </div>
  );
};
