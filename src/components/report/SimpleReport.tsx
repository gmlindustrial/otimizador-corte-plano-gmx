import { OptimizationResult, Project } from '@/pages/Index';
import { Badge } from '@/components/ui/badge';
import { Package, Tag, Wrench, Recycle, MapPin, DollarSign } from 'lucide-react';

interface SimpleReportProps {
  results: OptimizationResult;
  barLength: number;
  project?: Project | null;
}

export const SimpleReport = ({ results, barLength }: SimpleReportProps) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  return (
    <div className="space-y-6">
      <div className="space-y-8">
        {results.bars.map((bar: any, barIndex) => {
          const isLeftover = bar.type === 'leftover';
          return (
            <div key={bar.id} className="break-inside-avoid">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    Barra {barIndex + 1}
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
                    {isLeftover && bar.location && (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                        <MapPin className="w-3 h-3 mr-1" />
                        {bar.location}
                      </Badge>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    {isLeftover && bar.economySaved && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Economia: R$ {bar.economySaved.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>
                {(() => {
                  const conjuntosNaBarra = new Set((bar.pieces as any[])
                    .filter(p => p.conjunto)
                    .map(p => p.conjunto));
                  return (
                    conjuntosNaBarra.size > 0 && (
                      <span className="text-sm text-gray-600 mb-2 block">
                        Conjuntos: {Array.from(conjuntosNaBarra).join(', ')}
                      </span>
                    )
                  );
                })()}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead className={`${isLeftover ? 'bg-green-50' : 'bg-gray-100'}`}>
                      <tr>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Peça</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">TAG</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Comprimento (mm)</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Conjunto</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Perfil</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                          {isLeftover ? 'Economia' : 'Posição'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bar.pieces.map((piece: any, pieceIndex: number) => (
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
                          <td className="border border-gray-300 px-3 py-2 font-mono">{piece.length}</td>
                          <td className="border border-gray-300 px-3 py-2">
                            {piece.conjunto ? (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                <Package className="w-3 h-3 mr-1" />
                                {piece.conjunto}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-xs">Manual</span>
                            )}
                          </td>
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
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {isLeftover ? (
                              <Badge variant="outline" className="text-green-700 bg-green-50">
                                <DollarSign className="w-3 h-3 mr-1" />
                                R$ {((piece.length / 1000) * 8).toFixed(2)}
                              </Badge>
                            ) : (
                              piece.posicao || pieceIndex + 1
                            )}
                          </td>
                        </tr>
                      ))}
                      {bar.waste > 0 && (
                        <tr className={`${isLeftover ? 'bg-yellow-50' : 'bg-red-50'}`}>
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded border bg-gray-300" />
                              Sobra
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-gray-400">-</td>
                          <td className="border border-gray-300 px-3 py-2 font-mono text-red-600">{bar.waste}</td>
                          <td className="border border-gray-300 px-3 py-2 text-gray-400">-</td>
                          <td className="border border-gray-300 px-3 py-2 text-gray-400">
                            {isLeftover ? 'Sobra da Sobra' : 'Desperdício'}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-gray-400">
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
