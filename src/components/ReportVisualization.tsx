
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
                
                {/* Mostrar fases na barra */}
                {(() => {
                  const fasesNaBarra = new Set((bar.pieces as any[])
                    .filter(p => p.fase)
                    .map(p => p.fase));
                  return fasesNaBarra.size > 0 && (
                    <span className="text-sm text-gray-600 mb-2 block">
                      Fases: {Array.from(fasesNaBarra).join(', ')}
                    </span>
                  );
                })()}
                
                {/* SVG Bar Visualization com cores diferenciadas */}
                <div className="bg-white border rounded-lg p-4 mb-4">
                  <svg width="100%" height="80" viewBox={`0 0 ${(bar.originalLength || barLength) / 10} 80`} className="border rounded">
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
                              y={20}
                              width={segmentWidth}
                              height={40}
                              fill={segmentColor}
                              stroke="#fff"
                              strokeWidth="1"
                              opacity={isLeftover ? 0.8 : 1}
                            />
                            <text
                              x={currentX + segmentWidth / 2}
                              y={45}
                              textAnchor="middle"
                              fontSize="10"
                              fill="white"
                              fontWeight="bold"
                            >
                              {piece.tag || (piece.length > 500 ? `${piece.length}` : '')}
                            </text>
                            {/* Indicador de sobra reutilizada */}
                            {isLeftover && (
                              <text
                                x={currentX + segmentWidth / 2}
                                y={35}
                                textAnchor="middle"
                                fontSize="8"
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
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead className={`${isLeftover ? 'bg-green-50' : 'bg-gray-100'}`}>
                      <tr>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Peça</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">TAG</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Posição</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Quantidade</th>                  
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Comprimento (mm)</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Perfil</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Peso</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                          {isLeftover ? 'Economia' : 'Status'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bar.pieces.map((piece: any, pieceIndex) => (
                        <tr key={pieceIndex} className={`hover:bg-gray-50 ${isLeftover ? 'bg-green-25' : ''}`}>
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded border" 
                                style={{ backgroundColor: isLeftover ? '#10B981' : piece.color }}
                              />
                              Peça {pieceIndex + 1}
                              {isLeftover && <Recycle className="w-3 h-3 text-green-600" />}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            {piece.tag ? (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                <Tag className="w-3 h-3 mr-1" />
                                {piece.tag}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            {piece.posicao ? (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                <Package className="w-3 h-3 mr-1" />
                                {piece.posicao }
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-xs">Manual</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 font-mono text-center">
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              {piece.quantidade || 1}
                            </Badge>
                          </td>
                           
                          <td className="border border-gray-300 px-3 py-2 font-mono">{piece.length}</td>
                          
                          <td className="border border-gray-300 px-3 py-2">
                            {piece.perfil ? (
                              <Badge variant="secondary" className="text-xs">
                                <Wrench className="w-3 h-3 mr-1" />
                                {piece.perfil}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 font-mono text-center">
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              {piece.peso}
                            </Badge>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {isLeftover ? (
                              <Badge variant="outline" className="text-green-700 bg-green-50">
                                <DollarSign className="w-3 h-3 mr-1" />
                                R$ {((piece.length / 1000) * 8).toFixed(2)}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600">
                                OK
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                      
                      {/* Linha de sobra */}
                      {bar.waste > 0 && (
                        <tr className={`${isLeftover ? 'bg-yellow-50' : 'bg-red-50'}`}>
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded border bg-gray-300" />
                              Sobra
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-gray-400">-</td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-gray-400">0</td>
                          <td className="border border-gray-300 px-3 py-2 font-mono text-red-600">{bar.waste}</td>
                          <td className="border border-gray-300 px-3 py-2 text-gray-400">-</td>
                          <td className="border border-gray-300 px-3 py-2 text-gray-400">
                            {isLeftover ? 'Sobra da Sobra' : 'Desperdício'}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-gray-400">
                            {isLeftover ? 'Retornar Estoque' : 'Descartar'}
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
