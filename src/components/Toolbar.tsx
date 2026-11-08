import React from 'react';
import { CartonDimensions } from '../core/types';

interface ToolbarProps {
  dimensions: CartonDimensions;
  foldTicks: number;
  onDimensionsChange: (dims: CartonDimensions) => void;
  onFoldTicksChange: (ticks: number) => void;
  onExportSvg: () => void;
  onExportJson: () => void;
  onReset: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  dimensions,
  foldTicks,
  onDimensionsChange,
  onFoldTicksChange,
  onExportSvg,
  onExportJson,
  onReset
}) => {
  const presets = [
    { label: 'Padrão (120×80×40)', dims: { width: 120, depth: 80, height: 40 } },
    { label: 'Cubo (100×100×100)', dims: { width: 100, depth: 100, height: 100 } },
    { label: 'Alta (80×80×160)', dims: { width: 80, depth: 80, height: 160 } },
    { label: 'Plana (200×140×30)', dims: { width: 200, depth: 140, height: 30 } }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
          Parâmetros da Caixa (mm)
        </h2>
        <button
          onClick={onReset}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Redefinir
        </button>
      </div>

      {/* Dimension Sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>
            Largura (W): {dimensions.width}
          </label>
          <input
            type="range"
            min={20}
            max={300}
            value={dimensions.width}
            onChange={e => onDimensionsChange({ ...dimensions, width: parseInt(e.target.value, 10) })}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>
            Profundidade (D): {dimensions.depth}
          </label>
          <input
            type="range"
            min={20}
            max={300}
            value={dimensions.depth}
            onChange={e => onDimensionsChange({ ...dimensions, depth: parseInt(e.target.value, 10) })}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>
            Altura (H): {dimensions.height}
          </label>
          <input
            type="range"
            min={20}
            max={300}
            value={dimensions.height}
            onChange={e => onDimensionsChange({ ...dimensions, height: parseInt(e.target.value, 10) })}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Fold State Slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
            Dobra das Faces: {(foldTicks / 10).toFixed(1)}% ({((foldTicks / 1000) * 90).toFixed(1)}°)
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => onFoldTicksChange(0)}
              style={{
                padding: '2px 6px',
                fontSize: '11px',
                background: foldTicks === 0 ? '#235bd4' : '#f1f5f9',
                color: foldTicks === 0 ? '#ffffff' : '#334155',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Plana (0°)
            </button>
            <button
              onClick={() => onFoldTicksChange(500)}
              style={{
                padding: '2px 6px',
                fontSize: '11px',
                background: foldTicks === 500 ? '#235bd4' : '#f1f5f9',
                color: foldTicks === 500 ? '#ffffff' : '#334155',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              50% (45°)
            </button>
            <button
              onClick={() => onFoldTicksChange(1000)}
              style={{
                padding: '2px 6px',
                fontSize: '11px',
                background: foldTicks === 1000 ? '#235bd4' : '#f1f5f9',
                color: foldTicks === 1000 ? '#ffffff' : '#334155',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Fechada (90°)
            </button>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={1000}
          step={5}
          value={foldTicks}
          onChange={e => onFoldTicksChange(parseInt(e.target.value, 10))}
          style={{ width: '100%', accentColor: '#235bd4' }}
        />
      </div>

      {/* Presets and Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => onDimensionsChange(p.dims)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={onExportSvg}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#235bd4',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Exportar SVG
          </button>
          <button
            onClick={onExportJson}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Exportar JSON
          </button>
        </div>
      </div>
    </div>
  );
};
