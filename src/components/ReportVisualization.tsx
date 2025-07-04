import type { OptimizationResult } from '@/types/optimization';

interface ReportVisualizationProps {
  results: OptimizationResult;
  barLength: number;
  showLegend?: boolean;
}

export const ReportVisualization = ({ results, barLength, showLegend = true }: ReportVisualizationProps) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
  
  // Create color legend mapping
  const colorLegend = new Map<string, string>();
  results.bars.forEach(bar => {
    bar.pieces.forEach((piece, index) => {
      if (!colorLegend.has(piece.label)) {
        colorLegend.set(piece.label, piece.color);
      }
    });
  });

  return (
    <div className="space-y-6">
      {showLegend && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3 text-gray-900">Legenda de Cores</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from(colorLegend.entries()).map(([label, color]) => (
              <div key={label} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border bg-gray-300" />
              <span className="text-sm text-gray-700">Sobra</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {results.bars.map((bar, barIndex) => (
          <div key={bar.id} className="break-inside-avoid">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Barra {barIndex + 1}
              </h3>
              
              {/* SVG Bar Visualization */}
              <div className="bg-white border rounded-lg p-4 mb-4">
                <svg width="100%" height="80" viewBox={`0 0 ${barLength / 10} 80`} className="border rounded">
                  {/* Bar segments */}
                  {(() => {
                    let currentX = 0;
                    return bar.pieces.map((piece, pieceIndex) => {
                      const segmentWidth = piece.length / 10;
                      const segment = (
                        <g key={pieceIndex}>
                          <rect
                            x={currentX}
                            y={20}
                            width={segmentWidth}
                            height={40}
                            fill={piece.color}
                            stroke="#fff"
                            strokeWidth="1"
                          />
                          <text
                            x={currentX + segmentWidth / 2}
                            y={45}
                            textAnchor="middle"
                            fontSize="10"
                            fill="white"
                            fontWeight="bold"
                          >
                            {piece.length > 500 ? `${piece.length}` : ''}
                          </text>
                        </g>
                      );
                      currentX += segmentWidth;
                      return segment;
                    });
                  })()}
                  
                  {/* Waste segment */}
                  {bar.waste > 0 && (
                    <g>
                      <rect
                        x={bar.totalUsed / 10}
                        y={20}
                        width={bar.waste / 10}
                        height={40}
                        fill="#9CA3AF"
                        stroke="#fff"
                        strokeWidth="1"
                      />
                      <text
                        x={(bar.totalUsed + bar.waste / 2) / 10}
                        y={45}
                        textAnchor="middle"
                        fontSize="10"
                        fill="white"
                        fontWeight="bold"
                      >
                        {bar.waste > 200 ? `${bar.waste}` : ''}
                      </text>
                    </g>
                  )}
                  
                  {/* Scale marks */}
                  {Array.from({ length: Math.ceil(barLength / 1000) + 1 }, (_, i) => (
                    <g key={i}>
                      <line
                        x1={i * 100}
                        y1={15}
                        x2={i * 100}
                        y2={65}
                        stroke="#666"
                        strokeWidth="0.5"
                        strokeDasharray="2,2"
                      />
                      <text
                        x={i * 100}
                        y={12}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#666"
                      >
                        {i}m
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* Detailed Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Peça</th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Comprimento (mm)</th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Qtde</th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">TAG/Projeto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bar.pieces.map((piece, pieceIndex) => (
                      <tr key={pieceIndex} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded border" 
                              style={{ backgroundColor: piece.color }}
                            />
                            Peça {pieceIndex + 1}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 font-mono">{piece.length}</td>
                        <td className="border border-gray-300 px-3 py-2">1</td>
                        <td className="border border-gray-300 px-3 py-2 text-gray-600">-</td>
                      </tr>
                    ))}
                    {bar.waste > 0 && (
                      <tr className="bg-red-50">
                        <td className="border border-gray-300 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded border bg-gray-300" />
                            Sobra
                          </div>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 font-mono text-red-600">{bar.waste}</td>
                        <td className="border border-gray-300 px-3 py-2">1</td>
                        <td className="border border-gray-300 px-3 py-2 text-gray-400">Desperdício</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
