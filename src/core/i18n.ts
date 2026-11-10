import { FaceId, HingeId, Locale, SeamId, StudyDiagnosticCode } from './types';

export interface PresetDefinition {
  id: string;
  width: number;
  depth: number;
  height: number;
  foldTicks: number;
  label: Record<Locale, string>;
  description: Record<Locale, string>;
}

export const STUDY_PRESETS: readonly PresetDefinition[] = [
  {
    id: 'standard',
    width: 120,
    depth: 80,
    height: 40,
    foldTicks: 500,
    label: {
      'pt-BR': 'Padrão (120×80×40)',
      en: 'Standard (120×80×40)'
    },
    description: {
      'pt-BR': 'Caixa retangular de referência para inspeção de vincos e tampa.',
      en: 'Reference rectangular carton for inspecting hinges and lid closure.'
    }
  },
  {
    id: 'cube',
    width: 100,
    depth: 100,
    height: 100,
    foldTicks: 1000,
    label: {
      'pt-BR': 'Cubo (100×100×100)',
      en: 'Cube (100×100×100)'
    },
    description: {
      'pt-BR': 'Volume cúbico simétrico em estado de fechamento geométrico.',
      en: 'Symmetric cubic volume at full geometric closure.'
    }
  },
  {
    id: 'tall',
    width: 80,
    depth: 80,
    height: 160,
    foldTicks: 650,
    label: {
      'pt-BR': 'Torre (80×80×160)',
      en: 'Tall (80×80×160)'
    },
    description: {
      'pt-BR': 'Prisma vertical alto evidenciando o curso angular das paredes laterais.',
      en: 'Tall vertical prism highlighting side-wall angular sweep.'
    }
  },
  {
    id: 'tray',
    width: 200,
    depth: 140,
    height: 30,
    foldTicks: 0,
    label: {
      'pt-BR': 'Bandeja Plana (200×140×30)',
      en: 'Flat Tray (200×140×30)'
    },
    description: {
      'pt-BR': 'Planificação aberta em folha plana (0°) para conferência de coordenadas 2D.',
      en: 'Unfolded flat sheet (0°) for 2D net coordinate verification.'
    }
  }
];

export const FACE_LABELS: Record<FaceId, Record<Locale, string>> = {
  base: { 'pt-BR': 'Base (Fundo)', en: 'Base (Bottom)' },
  north: { 'pt-BR': 'Norte (Traseira)', en: 'North (Back)' },
  south: { 'pt-BR': 'Sul (Frontal)', en: 'South (Front)' },
  east: { 'pt-BR': 'Leste (Direita)', en: 'East (Right)' },
  west: { 'pt-BR': 'Oeste (Esquerda)', en: 'West (Left)' },
  lid: { 'pt-BR': 'Tampa (Superior)', en: 'Lid (Top)' }
};

export const FACE_SHORT_LABELS: Record<FaceId, Record<Locale, string>> = {
  base: { 'pt-BR': 'Base', en: 'Base' },
  north: { 'pt-BR': 'Norte', en: 'North' },
  south: { 'pt-BR': 'Sul', en: 'South' },
  east: { 'pt-BR': 'Leste', en: 'East' },
  west: { 'pt-BR': 'Oeste', en: 'West' },
  lid: { 'pt-BR': 'Tampa', en: 'Lid' }
};

export const HINGE_LABELS: Record<HingeId, Record<Locale, string>> = {
  'base-north': { 'pt-BR': 'Vinco Base–Norte', en: 'Base–North Hinge' },
  'base-south': { 'pt-BR': 'Vinco Base–Sul', en: 'Base–South Hinge' },
  'base-east': { 'pt-BR': 'Vinco Base–Leste', en: 'Base–East Hinge' },
  'base-west': { 'pt-BR': 'Vinco Base–Oeste', en: 'Base–West Hinge' },
  'north-lid': { 'pt-BR': 'Vinco Norte–Tampa', en: 'North–Lid Hinge' }
};

export const SEAM_LABELS: Record<SeamId, Record<Locale, string>> = {
  'north-east': { 'pt-BR': 'Aresta Norte–Leste', en: 'North–East Seam' },
  'north-west': { 'pt-BR': 'Aresta Norte–Oeste', en: 'North–West Seam' },
  'south-east': { 'pt-BR': 'Aresta Sul–Leste', en: 'South–East Seam' },
  'south-west': { 'pt-BR': 'Aresta Sul–Oeste', en: 'South–West Seam' },
  'lid-east': { 'pt-BR': 'Aresta Tampa–Leste', en: 'Lid–East Seam' },
  'lid-west': { 'pt-BR': 'Aresta Tampa–Oeste', en: 'Lid–West Seam' },
  'lid-south': { 'pt-BR': 'Aresta Tampa–Sul', en: 'Lid–South Seam' }
};

export function formatDiagnosticMessage(
  code: StudyDiagnosticCode,
  locale: Locale,
  detail?: string
): string {
  const messages: Record<StudyDiagnosticCode, Record<Locale, string>> = {
    VALID: {
      'pt-BR': 'Estudo válido.',
      en: 'Valid study.'
    },
    EMPTY_DOCUMENT: {
      'pt-BR': 'Documento JSON vazio. O estudo atual foi preservado.',
      en: 'Empty JSON document. The current study was preserved.'
    },
    BYTE_LIMIT_EXCEEDED: {
      'pt-BR': 'Arquivo excede o limite de 8192 bytes UTF-8. Importação rejeitada.',
      en: 'File exceeds the 8192-byte UTF-8 ceiling. Import rejected.'
    },
    INVALID_UTF8: { 'pt-BR': 'O arquivo não contém UTF-8 válido. O estudo atual foi preservado.', en: 'The file is not valid UTF-8. The current study was preserved.' },
    READ_FAILED: { 'pt-BR': 'Não foi possível ler o arquivo. Selecione-o novamente; o estudo atual foi preservado.', en: 'The file could not be read. Select it again; the current study was preserved.' },
    EXPORT_FAILED: { 'pt-BR': 'Não foi possível baixar o arquivo. Tente novamente; o estudo atual foi preservado.', en: 'The file could not be downloaded. Try again; the current study was preserved.' },
    MALFORMED_JSON: {
      'pt-BR': 'Sintaxe JSON inválida. O estudo atual foi preservado.',
      en: 'Invalid JSON syntax. The current study was preserved.'
    },
    NON_OBJECT_ROOT: {
      'pt-BR': 'O documento deve ser um objeto JSON no nível raiz.',
      en: 'The document root must be a plain JSON object.'
    },
    FORBIDDEN_KEY: {
      'pt-BR': 'Chave de protótipo proibida detectada no JSON.',
      en: 'Forbidden prototype key detected in JSON.'
    },
    SCALAR_LIMIT_EXCEEDED: {
      'pt-BR': 'O documento excede o limite de 32 campos escalares.',
      en: 'The document exceeds the maximum of 32 scalar fields.'
    },
    UNKNOWN_FIELD: {
      'pt-BR': `Campo desconhecido não permitido pelo esquema fechado${detail ? `: ${detail}` : ''}.`,
      en: `Unknown field rejected by closed schema${detail ? `: ${detail}` : ''}.`
    },
    MISSING_FIELD: {
      'pt-BR': `Campo obrigatório ausente ou inválido${detail ? `: ${detail}` : ''}.`,
      en: `Required field missing or invalid${detail ? `: ${detail}` : ''}.`
    },
    UNSUPPORTED_SCHEMA: {
      'pt-BR': `Identificador de esquema não suportado${detail ? `: ${detail}` : ''}.`,
      en: `Unsupported schema identifier${detail ? `: ${detail}` : ''}.`
    },
    UNSUPPORTED_UNITS: {
      'pt-BR': `Unidade dimensional não suportada (use 'mm')${detail ? `: ${detail}` : ''}.`,
      en: `Unsupported dimensional unit (expected 'mm')${detail ? `: ${detail}` : ''}.`
    },
    INVALID_DIMENSIONS: {
      'pt-BR': 'Dimensões inválidas: largura, profundidade e altura devem ser inteiros entre 1 e 4095 mm.',
      en: 'Invalid dimensions: width, depth and height must be integers between 1 and 4095 mm.'
    },
    INVALID_FOLD_TICKS: {
      'pt-BR': 'Passo de dobra inválido: informe um inteiro entre 0 e 1000.',
      en: 'Invalid fold ticks: provide an integer between 0 and 1000.'
    },
    INVALID_SELECTED_FACE: {
      'pt-BR': 'Identificador de face selecionada inválido.',
      en: 'Invalid selected face identifier.'
    },
    NUMERICALLY_INDETERMINATE: {
      'pt-BR': 'Indeterminação numérica detectada; exportação e veredito geométrico bloqueados.',
      en: 'Numerical indeterminacy detected; export and geometric verdict blocked.'
    }
  };
  return messages[code][locale];
}

export const UI_TEXT = {
  'pt-BR': {
    subtitle: 'Bancada cinemática de planificação retangular de seis faces (espessura zero)',
    langSwitchLabel: 'English',
    langSwitchAria: 'Alternar idioma para inglês',
    headerDimensions: 'Dimensões',
    headerFold: 'Dobra',
    headerStatus: 'Estado Geométrico',
    statusClosed: 'Geometria Fechada',
    statusArticulated: 'Geometria Articulada',
    statusFlat: 'Planificação Plana',
    toolbarTitle: 'Parâmetros da Planificação (1–4095 mm)',
    resetButton: 'Redefinir',
    dismissError: 'Dispensar diagnóstico',
    rangeLabel: 'controle deslizante',
    widthLabel: 'Largura (W, mm)',
    depthLabel: 'Profundidade (D, mm)',
    heightLabel: 'Altura (H, mm)',
    applyDimensionsButton: 'Aplicar dimensões',
    foldProgressLabel: 'Progresso da Dobra',
    foldTicksLabel: 'Passos de dobra (0–1000)',
    foldFlatBtn: 'Plana (0°)',
    foldHalfBtn: '50% (45°)',
    foldClosedBtn: 'Fechada (90°)',
    presetsHeading: 'Estudos de Exemplo',
    exportSvgBtn: 'Exportar SVG',
    exportJsonBtn: 'Exportar JSON',
    importJsonBtn: 'Importar JSON',
    netTitle: 'Planificação 2D Articulada (SVG)',
    netHelp: 'Clique ou pressione Enter/Espaço sobre uma face para inspecionar seus vértices e vincos.',
    sceneTitle: 'Maquete Técnica 3D Articulada',
    cameraEnableBtn: 'Ativar câmera 3D',
    cameraDisableBtn: 'Encerrar câmera (Esc)',
    cameraHintInactive: 'Rolagem de página livre. Ative a câmera para orbitar ou use os ângulos predefinidos.',
    cameraHintActive: 'Câmera ativa: arraste para orbitar ou pressione Esc para liberar a rolagem.',
    presetIso: 'Isométrica',
    presetTop: 'Topo',
    presetFront: 'Frente',
    fallbackToggle2D: 'Projeção 2D',
    fallbackToggle3D: 'WebGL 3D',
    webglUnavailableNotice: 'WebGL indisponível ou contexto perdido. Operando na projeção isométrica 2D vinculada.',
    faceInspectorTitle: 'Inspetor de Face e Vincos',
    faceSelectPrompt: 'Selecione uma face na maquete 3D ou na planificação 2D.',
    outwardNormal: 'Normal Externa',
    localPolygon: 'Polígono Local (u, v mm)',
    worldCorners: 'Vértices no Espaço 3D (X, Y, Z mm)',
    hingesSubheading: 'Árvore de 5 Vincos Articulados',
    hingeParentChild: 'Pai → Filho',
    hingeAxisSign: 'Eixo / Sinal',
    hingeAngle: 'Ângulo',
    seamInspectorTitle: 'Pares de Arestas Físicas (5 Vincos + 7 Junções)',
    seamClosedBadge: 'Coincidência Geométrica Total',
    seamMaxGapBadge: 'Folga Máx',
    colEdge: 'Par Físico',
    colKind: 'Tipo',
    colFaces: 'Faces',
    colGap: 'Folga (mm)',
    colState: 'Estado',
    kindHinge: 'Vinco',
    kindSeam: 'Junção',
    stateCoincident: 'Coincidente',
    stateOpen: 'Aberto',
    toleranceCaption: 'Tolerância de fechamento no estado 1000',
    conceptualDisclaimer: 'Modelo geométrico conceitual de espessura zero e topologia fixa (6 faces, 5 vincos). Não representa gabarito de corte industrial, compensação de dobra ou certificação estrutural.',
    footerCopyright: '© 2026 Lofrano Tecnologia · Licença MIT'
  },
  en: {
    subtitle: 'Six-face rectangular carton net kinematic workbench (zero-thickness study)',
    langSwitchLabel: 'Português',
    langSwitchAria: 'Switch interface language to Portuguese',
    headerDimensions: 'Dimensions',
    headerFold: 'Fold',
    headerStatus: 'Geometric State',
    statusClosed: 'Closed Geometry',
    statusArticulated: 'Articulated Geometry',
    statusFlat: 'Flat Net',
    toolbarTitle: 'Net Parameters (1–4095 mm)',
    resetButton: 'Reset',
    dismissError: 'Dismiss diagnostic',
    rangeLabel: 'slider',
    widthLabel: 'Width (W, mm)',
    depthLabel: 'Depth (D, mm)',
    heightLabel: 'Height (H, mm)',
    applyDimensionsButton: 'Apply dimensions',
    foldProgressLabel: 'Fold Progress',
    foldTicksLabel: 'Fold ticks (0–1000)',
    foldFlatBtn: 'Flat (0°)',
    foldHalfBtn: '50% (45°)',
    foldClosedBtn: 'Closed (90°)',
    presetsHeading: 'Example Studies',
    exportSvgBtn: 'Export SVG',
    exportJsonBtn: 'Export JSON',
    importJsonBtn: 'Import JSON',
    netTitle: 'Linked 2D Net Plan (SVG)',
    netHelp: 'Click or press Enter/Space on any face to inspect its vertices and hinges.',
    sceneTitle: 'Articulated 3D Technical Maquette',
    cameraEnableBtn: 'Enable 3D camera',
    cameraDisableBtn: 'Exit camera (Esc)',
    cameraHintInactive: 'Page scroll stays free. Enable camera to orbit or use preset views.',
    cameraHintActive: 'Camera active: drag to orbit or press Esc to release page scroll.',
    presetIso: 'Isometric',
    presetTop: 'Top',
    presetFront: 'Front',
    fallbackToggle2D: '2D Projection',
    fallbackToggle3D: '3D WebGL',
    webglUnavailableNotice: 'WebGL unavailable or context lost. Operating in linked 2D isometric projection.',
    faceInspectorTitle: 'Face & Hinge Inspector',
    faceSelectPrompt: 'Select a face in the 3D maquette or 2D net to inspect.',
    outwardNormal: 'Outward Normal',
    localPolygon: 'Face-Local Polygon (u, v mm)',
    worldCorners: 'World-Space 3D Corners (X, Y, Z mm)',
    hingesSubheading: '5-Hinge Kinematic Crease Tree',
    hingeParentChild: 'Parent → Child',
    hingeAxisSign: 'Axis / Sign',
    hingeAngle: 'Angle',
    seamInspectorTitle: 'Paired Physical Edges (5 Hinges + 7 Closure Seams)',
    seamClosedBadge: 'Full Geometric Coincidence',
    seamMaxGapBadge: 'Max Gap',
    colEdge: 'Physical Pair',
    colKind: 'Kind',
    colFaces: 'Faces',
    colGap: 'Gap (mm)',
    colState: 'State',
    kindHinge: 'Hinge',
    kindSeam: 'Closure',
    stateCoincident: 'Coincident',
    stateOpen: 'Open',
    toleranceCaption: 'Closed-state (tick 1000) endpoint tolerance',
    conceptualDisclaimer: 'Zero-thickness, fixed-topology conceptual geometry study (6 faces, 5 hinges). Not a manufacturing die-line, bend-allowance calculator, or structural certification tool.',
    footerCopyright: '© 2026 Lofrano Tecnologia · MIT License'
  }
} as const;
