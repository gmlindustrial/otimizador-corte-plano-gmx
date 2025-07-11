
import { OptimizationResult, Project } from '@/pages/Index';
import { Badge } from '@/components/ui/badge';
import { Package, Tag, Wrench, Recycle, MapPin, DollarSign } from 'lucide-react';

interface ReportVisualizationProps {
  results: OptimizationResult;
  barLength: number;
  project?: Project | null;
  showLegend?: boolean;
}

export const ReportVisualization = ({ results, barLength, project }: ReportVisualizationProps) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  return (
    <div className="space-y-6">
      <div className="space-y-8">
        {results.bars.filter((bar: any) => bar.pieces.length > 0).map((bar: any, barIndex) => {
          const isLeftover = bar.type === 'leftover';
          const isNew = bar.type === 'new';
          
          return (
            <div key={bar.id} className="break-inside-avoid">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    Barra {barIndex + 1}
                    
                    {/* Indicadores NOVA/SOBRA */}
                    {isLeftover ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <Recycle className="w-3 h-3 mr-1" />
                        SOBRA
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        NOVA
                      </Badge>
                    )}
                    
                    {/* Localização para sobras */}
                    {isLeftover && bar.location && (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                        <MapPin className="w-3 h-3 mr-1" />
                        {bar.location}
                      </Badge>
                    )}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm">
                    {/* Economia para sobras */}
                    {isLeftover && bar.economySaved && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Economia: R$ {bar.economySaved.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Mostrar conjuntos na barra */}
                {(() => {
                  const conjuntosNaBarra = new Set((bar.pieces as any[])
                    .filter(p => p.conjunto)
                    .map(p => p.conjunto));
                  return conjuntosNaBarra.size > 0 && (
                    <span className="text-sm text-gray-600 mb-2 block">
                      Conjuntos: {Array.from(conjuntosNaBarra).join(', ')}
                    </span>
                  );
                })()}
                
                {/* SVG Bar Visualization com cores diferenciadas */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
                  <svg width="100%" height="100" viewBox={`0 0 ${(bar.originalLength || barLength) / 10} 100`} className="border border-gray-300 rounded-lg bg-gray-50">
                    {/* Bar segments */}
                    {(() => {
                      let currentX = 0;
                      return bar.pieces.map((piece: any, pieceIndex) => {
                        const segmentWidth = piece.length / 10;
                        // Usar cor verde para sobras, cores normais para barras novas
                        const segmentColor = isLeftover ? '#10B981' : piece.color;
                        
                        const segment = (
                          <g key={pieceIndex}>
                            <rect
                              x={currentX}
                              y={25}
                              width={segmentWidth}
                              height={50}
                              fill={segmentColor}
                              stroke="#fff"
                              strokeWidth="2"
                              opacity={isLeftover ? 0.85 : 1}
                              rx="2"
                            />
                            <text
                              x={currentX + segmentWidth / 2}
                              y={55}
                              textAnchor="middle"
                              fontSize="12"
                              fill="white"
                              fontWeight="bold"
                            >
                              {piece.tag || (piece.length > 300 ? `${piece.length}` : '')}
                            </text>
                            {/* Indicador de sobra reutilizada */}
                            {isLeftover && (
                              <text
                                x={currentX + segmentWidth / 2}
                                y={42}
                                textAnchor="middle"
                                fontSize="12"
                                fill="white"
                              >
                                ♻
                              </text>
                            )}
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
                          y={25}
                          width={bar.waste / 10}
                          height={50}
                          fill="#DC2626"
                          stroke="#fff"
                          strokeWidth="2"
                          opacity="0.7"
                          rx="2"
                        />
                        <text
                          x={(bar.totalUsed + bar.waste / 2) / 10}
                          y={55}
                          textAnchor="middle"
                          fontSize="12"
                          fill="white"
                          fontWeight="bold"
                        >
                          {bar.waste > 150 ? `${bar.waste}mm` : ''}
                        </text>
                      </g>
                    )}
                    
                    {/* Scale marks */}
                    {Array.from({ length: Math.ceil((bar.originalLength || barLength) / 1000) + 1 }, (_, i) => (
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

                {/* Tabela Detalhada */}
                <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
                  <table className="w-full border-collapse border-2 border-gray-300 text-base">
                    <thead className={`${isLeftover ? 'bg-green-100' : 'bg-blue-50'}`}>
                      <tr>
                        <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">Peça</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">TAG</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">Comprimento (mm)</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">Conjunto</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">Perfil</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">
                          {isLeftover ? 'Economia' : 'Posição'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bar.pieces.map((piece: any, pieceIndex) => (
                        <tr key={pieceIndex} className={`hover:bg-gray-50 ${isLeftover ? 'bg-green-50/30' : 'bg-blue-50/20'} transition-colors`}>
                          <td className="border border-gray-300 px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded border" 
                                style={{ backgroundColor: isLeftover ? '#10B981' : piece.color }}
                              />
                              Peça {pieceIndex + 1}
                              {isLeftover && <Recycle className="w-3 h-3 text-green-600" />}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            {piece.tag ? (
                              <Badge variant="default" className="text-sm bg-green-100 text-green-800">
                                <Tag className="w-4 h-4 mr-1" />
                                {piece.tag}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 font-mono text-lg font-semibold">{piece.length}</td>
                          <td className="border border-gray-300 px-4 py-3">
                            {piece.conjunto ? (
                              <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700">
                                <Package className="w-4 h-4 mr-1" />
                                {piece.conjunto}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">Manual</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            {piece.perfil ? (
                              <Badge variant="secondary" className="text-sm">
                                <Wrench className="w-4 h-4 mr-1" />
                                {piece.perfil}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            {isLeftover ? (
                              <Badge variant="outline" className="text-green-700 bg-green-50 text-sm">
                                <DollarSign className="w-4 h-4 mr-1" />
                                R$ {((piece.length / 1000) * 8).toFixed(2)}
                              </Badge>
                            ) : (
                              <span className="text-lg font-semibold">{piece.posicao || pieceIndex + 1}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      
                      {/* Linha de sobra */}
                      {bar.waste > 0 && (
                        <tr className={`${isLeftover ? 'bg-yellow-100' : 'bg-red-100'}`}>
                          <td className="border border-gray-300 px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded border-2 bg-red-400 border-red-600" />
                              <span className="font-semibold text-red-700">Sobra</span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-500 text-sm">-</td>
                          <td className="border border-gray-300 px-4 py-3 font-mono text-xl font-bold text-red-700">{bar.waste}mm</td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-500 text-sm">-</td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-600 font-medium">
                            {isLeftover ? 'Sobra da Sobra' : 'Desperdício'}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-600 font-medium">
                            {isLeftover ? 'Retornar Estoque' : 'Final'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
