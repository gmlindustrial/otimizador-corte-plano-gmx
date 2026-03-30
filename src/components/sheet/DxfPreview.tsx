/**
 * DxfPreview — Visualização SVG de uma peça DXF importada
 * Mostra contorno, furos, dimensões
 */

interface DxfPoint {
  x: number;
  y: number;
}

interface DxfPreviewProps {
  piece: {
    contour: DxfPoint[];
    holes: Array<{ center: DxfPoint; radius: number }>;
    boundingBox: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
    area: number;
    perimeter: number;
  };
}

export const DxfPreview = ({ piece }: DxfPreviewProps) => {
  const { contour, holes, boundingBox } = piece;

  if (contour.length < 2) return null;

  // Calcular escala para caber no viewBox (com padding)
  const padding = 20;
  const viewWidth = boundingBox.width + padding * 2;
  const viewHeight = boundingBox.height + padding * 2;

  // Gerar path SVG do contorno
  const contourPath = contour
    .map((p, i) => {
      const x = p.x - boundingBox.minX + padding;
      const y = boundingBox.height - (p.y - boundingBox.minY) + padding; // Inverter Y (SVG = top-down)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ') + ' Z';

  return (
    <div className="w-full bg-secondary/50 rounded-lg p-3 border">
      <svg
        viewBox={`0 0 ${viewWidth.toFixed(0)} ${viewHeight.toFixed(0)}`}
        className="w-full h-48 md:h-64"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid de fundo */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" className="stroke-border" strokeWidth="0.5" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Contorno da peça */}
        <path
          d={contourPath}
          fill="hsl(var(--primary) / 0.1)"
          className="stroke-primary"
          strokeWidth={Math.max(1, viewWidth / 300)}
          strokeLinejoin="round"
        />

        {/* Furos */}
        {holes.map((hole, idx) => {
          const cx = hole.center.x - boundingBox.minX + padding;
          const cy = boundingBox.height - (hole.center.y - boundingBox.minY) + padding;
          return (
            <circle
              key={idx}
              cx={cx.toFixed(2)}
              cy={cy.toFixed(2)}
              r={hole.radius.toFixed(2)}
              fill="hsl(var(--background))"
              className="stroke-destructive"
              strokeWidth={Math.max(0.5, viewWidth / 400)}
            />
          );
        })}

        {/* Dimensão largura */}
        <line
          x1={padding}
          y1={viewHeight - 5}
          x2={viewWidth - padding}
          y2={viewHeight - 5}
          className="stroke-muted-foreground"
          strokeWidth="0.5"
          strokeDasharray="4 2"
        />
        <text
          x={viewWidth / 2}
          y={viewHeight - 1}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={Math.max(8, viewWidth / 40)}
        >
          {boundingBox.width.toFixed(1)}mm
        </text>

        {/* Dimensão altura */}
        <line
          x1={5}
          y1={padding}
          x2={5}
          y2={viewHeight - padding}
          className="stroke-muted-foreground"
          strokeWidth="0.5"
          strokeDasharray="4 2"
        />
        <text
          x={3}
          y={viewHeight / 2}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={Math.max(8, viewWidth / 40)}
          transform={`rotate(-90, 3, ${viewHeight / 2})`}
        >
          {boundingBox.height.toFixed(1)}mm
        </text>
      </svg>
    </div>
  );
};
