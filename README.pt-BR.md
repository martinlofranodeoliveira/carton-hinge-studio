# Carton Hinge Studio

Versão de desenvolvimento **0.1.0**: bancada local no navegador, em React/Three.js, para uma planificação retangular de seis faces. Um único modelo tipado alimenta a maquete articulada, seleção SVG vinculada e medidas de folga. Português é o idioma inicial; controles, exemplos, ajuda e diagnósticos também existem em inglês. [English](README.md) · [Contrato](docs/contract.md) · [Design](docs/design.md) · [Lofrano Tecnologia](https://lofranotecnologia.com.br).

Estudo geométrico conceitual de espessura zero. Não calcula abas, espessura de material, compensação de dobra, percurso sem colisões, propriedades estruturais, calibração de corte ou prontidão industrial. SVG é um desenho conceitual da planificação, sem certificação de corte. Não são alegados clientes, adoção, certificações ou desempenho medido de GPU.

## Usar a bancada

Largura/profundidade/altura são inteiros de **1 a 4095 mm**. Edições válidas são aplicadas imediatamente; rascunhos inválidos mostram diagnóstico e preservam a última geometria válida. O controle sincronizado usa **0..1000 passos inteiros**, equivalentes a 0..90 graus por vinco. Selecione uma face pelos botões/SVG operável por teclado ou pela maquete e inspecione polígono local, vértices espaciais e árvore de vincos. A tabela distingue **cinco pares de vincos persistentes** e **sete pares de fechamento**, não doze junções independentes.

A câmera 3D exige ativação explícita. Escape, perda de foco da janela, mudança para 2D, perda de contexto e desmontagem liberam seus eventos e restauram o comportamento de toque anterior. Vistas isométrica, superior e frontal consideram a proporção atual da área. Sem WebGL utilizável, o mesmo estudo permanece operável em DOM/SVG vinculado, com controles de câmera desativados. Não existe órbita automática.

A importação confere `File.size` antes da leitura e valida os bytes reais com UTF-8 estrito. Limites: **8192 bytes** e **32 campos escalares**. Propriedades desconhecidas e chaves de protótipo são rejeitadas. Entrada inválida preserva o estudo. Uma leitura pendente não substitui importação, dimensões/dobra, seleção ou redefinição mais recentes. Diagnósticos seguem o idioma atual. JSON exportado é determinístico para o mesmo estudo/seleção.

```json
{"schema":"carton-hinge-studio/study@1","units":"mm","dimensions":{"width":120,"depth":80,"height":40},"foldTicks":500,"selectedFace":"lid"}
```

`selectedFace` também pode ser null ou omitido (padrão `lid`). O parser JSON mantido usa o último membro em chaves duplicadas; o formato não rejeita duplicatas. Falhas de leitura e de download possuem diagnósticos próprios. Estudos rejeitados ou numericamente indeterminados não geram exportação geométrica bem-sucedida.

## Compilar e verificar

Tupla técnica qualificada: Node **22.23.4**, npm **10.9.9**, React **19.3.1**, Fiber **9.8.2**, Three **0.184.0** e Vite **8.3.6**, com lock npm genuíno. Essa qualificação não estabelece versões anteriores de Node ou outras tuplas.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run demo -- --assert
npm run demo -- --json
npm run build
npm run dev
```

Desenvolvimento: `http://127.0.0.1:5173/carton-hinge-studio/`; preview na porta 4173 após `npm run preview`. A saída `dist/` reúne código, fontes e avisos de dependências da mesma origem. Não exige serviço, credenciais, ativos externos ou telemetria em execução. O build usa o carregador de configuração em memória qualificado do Vite para permitir dependências somente de leitura; esse recurso ainda é experimental na tupla fixada.

## API de fonte e CLI

`deriveCartonStudy(dimensions, foldTicks)`, em `src/core/carton.ts`, é independente de UI e rejeita escalares inválidos por exceção antes de retornar um estudo. `parseCartonStudyJson(string | Uint8Array)`, em `studyIo.ts`, retorna `ValidStudy`, `InvalidDocument`, `UnsupportedDocument` ou `NumericallyIndeterminate`. `serializeCartonStudyJson` e `generateSvgNet` recusam geometria inválida ou não finita. Esses helpers de fonte não constituem uma distribuição npm de SDK/CLI instalada e qualificada separadamente.

```ts
import { deriveCartonStudy } from './src/core/carton';
import { serializeCartonStudyJson } from './src/core/studyIo';
const estudo = deriveCartonStudy({ width: 120, depth: 80, height: 40 }, 1000);
console.log(estudo.physicalEdges['north-lid'].maxGap);
console.log(serializeCartonStudyJson(estudo, 'lid'));
```

O demo prepara um entrypoint Node local. Quando stdout precisar conter somente JSON/SVG, execute diretamente o entrypoint preparado; npm imprime seu próprio preâmbulo.

```sh
node build/checks/demo/demo.mjs study --width=120 --depth=80 --height=40 --fold=500 --format=json
node build/checks/demo/demo.mjs svg --width=120 --depth=80 --height=40 > net.svg
```

Modos: `demo [--assert] [--json]`, `study` com as cinco opções mostradas, ou `svg` com dimensões. Opções numéricas usam inteiros decimais canônicos. Opções desconhecidas, repetidas, malformadas ou fora de limites saem 2 antes de imprimir resultado. A CLI não aceita comandos, URLs ou caminhos de entrada arbitrários.

## Evidência e limites

As verificações nativas preservam testes originais e acrescentam expectativas literais, referência de matrizes em eixos globais escrita separadamente **após a fonte**, BufferGeometry/matrizes reais do Three, orientação externa, eventos de descarte, frustos de câmera, limites de DPR/pixels, JSON/XML e transições DOM reais. Não demonstram que fixtures tenham sido preparadas antes da implementação.

Renderização é solicitada sob demanda, DPR no máximo 2 e limite lógico de 4.194.304 pixels. Contadores e chamadas de descarte na CPU não garantem memória de navegador/GPU, tempo real ou liberação pelo driver. JSDOM, projeção por câmera Three e detector estático são apenas evidência técnica. **Capturas reais, renderização/interação WebGL, comportamento responsivo renderizado, leitores de tela, conformidade de acessibilidade e acabamento visual continuam sem verificação.** Código original [MIT](LICENSE), © 2026 Lofrano Tecnologia; fontes e dependências mantêm licenças separadas.
