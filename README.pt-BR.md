# Carton Hinge Studio

Versão de desenvolvimento **0.1.0** — um estúdio paramétrico original da Lofrano Tecnologia para embalagens dobráveis, sob licença MIT. Inspecione a cinemática de dobra de chapas e papelão, avalie padrões de vinco, observe rotações contínuas de dobradiças em tempo real, verifique a convergência 3D de junções/arestas e exporte moldes 2D em SVG padrão CAD. A aplicação utiliza renderização espacial real com Three.js e alternativa bidimensional em SVG de alto contraste. Português é a interface padrão; a chave de idioma alterna os textos para inglês.

[English](README.md) · [Contrato](docs/contract.md) · [Design](docs/design.md) · [Lofrano Tecnologia](https://lofranotecnologia.com.br)

## Recursos

- **Modelo Cinemático Exato**: Rotação analítica em forma fechada de 5 dobradiças contínuas mapeando o molde plano ($t = 0$) na caixa prismática 3D fechada ($t = 1000$).
- **Dimensionamento Paramétrico**: Dimensões retangulares arbitrárias (largura $W$, profundidade $D$, altura $H$) com limites estritos validados $[10, 1000]\,\text{mm}$.
- **Verificação de Convergência de Junções**: Rastreamento em tempo real do espaçamento euclidiano em 7 junções (4 verticais laterais e 3 superiores da tampa), atestando fechamento estanque a $t = 1000$ dentro da tolerância de $10^{-9} \times \max(W, D, H)$.
- **Exportação de Molde 2D (Faca de Corte)**: Geração determinística de SVG com convenções CAD de embalagem (linhas contínuas pretas para corte, tracejadas ciano para vinco e dobra).
- **Estúdio Interativo 3D / 2D**: Visualização WebGL com destaque de faces, inspetor numérico de junções e modo alternativo 2D funcional sem GPU.

## Cinemática Matemática

O molde da caixa é composto por 6 faces planares ancoradas na face **Fundo** (Bottom) fixa no plano $XY$ ($z = 0$, $x \in [-W/2, W/2]$, $y \in [-D/2, D/2]$).

Para o parâmetro normalizado de dobra $t \in [0, 1000]$, o ângulo de dobra angular é $\theta(t) = \frac{t}{1000} \cdot \frac{\pi}{2}$:
1. **Fundo (Bottom)**: Fixo em $z = 0$.
2. **Norte (North)**: Conectado ao fundo em $y = +D/2$. Rotaciona para cima no eixo $X$ por $+\theta$.
3. **Sul (South)**: Conectado ao fundo em $y = -D/2$. Rotaciona para cima no eixo $X$ por $-\theta$.
4. **Leste (East)**: Conectado ao fundo em $x = +W/2$. Rotaciona para cima no eixo $Y$ por $-\theta$.
5. **Oeste (West)**: Conectado ao fundo em $x = -W/2$. Rotaciona para cima no eixo $Y$ por $+\theta$.
6. **Tampa (Lid)**: Conectada à aresta distal superior da face Norte. Realiza rotação composta: varre um ângulo $2\theta$ em relação à referência horizontal plana, atingindo $\pi$ a $t = 1000$ ($\theta = \pi/2$), fechando perfeitamente a caixa na altura $z = H$.

## Instalação e Uso

Requer Node 22 ou superior (alvo Node 22.23.4 / npm 10.9.9). Dependências diretas são versões exatas fixadas.

```sh
npm ci --ignore-scripts
npm run dev
```

Abra `http://127.0.0.1:5173/carton-hinge-studio/`.

### Verificação e Compilação

```sh
npm test
npm run demo -- --assert
npm run demo -- --json
npm run build
npm run preview
```

O preview executa em `http://127.0.0.1:4173/carton-hinge-studio/`. A saída de compilação de produção é estática, autocontida e configurada para `/carton-hinge-studio/`.

## Qualidade e Determinismo

- Todas as funções cinemáticas centrais são puras e executadas deterministicamente sem chamadas de rede.
- O script de demonstração headless (`src/demo.ts`) valida 4 configurações padrão de embalagens e verifica o fechamento de arestas offline.
- A geração do SVG segue rigorosamente o escape de entidades XML e padrões industriais de embalagem.
