
import { OptimizationResult, Project } from '@/pages/Index';
import { Badge } from '@/components/ui/badge';
import { Package, Tag, Wrench } from 'lucide-react';

interface PrintableReportProps {
  results: OptimizationResult;
  barLength: number;
  project: Project | null;
  mode: 'complete' | 'simplified';
}

export const PrintableReport = ({ results, barLength, project, mode }: PrintableReportProps) => {
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const version = '1.0';

  const headerFooterStyles = `
    @media print {
      @page {
        margin: 1.5cm 1cm;
        size: A4;
      }
      .page-break {
        page-break-before: always;
      }
      .no-print {
        display: none !important;
      }
      .print-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 70px;
        background: white;
        border-bottom: 2px solid #e5e7eb;
        padding: 10px;
        z-index: 1000;
      }
      .print-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 40px;
        background: white;
        border-top: 1px solid #e5e7eb;
        padding: 8px 10px;
        font-size: 10px;
        color: #666;
        z-index: 1000;
      }
      .print-content {
        margin-top: 85px;
        margin-bottom: 55px;
      }
      .bars-per-page {
        page-break-inside: avoid;
      }
    }
  `;

  // Função para quebrar barras em páginas
  const getBarGroups = () => {
    const barsPerPage = mode === 'simplified' ? 6 : 4;
    const groups = [];
    for (let i = 0; i < results.bars.length; i += barsPerPage) {
      groups.push(results.bars.slice(i, i + barsPerPage));
    }
    return groups;
  };

  // Agrupar resumo por conjunto
  const getConjuntoSummary = () => {
    const conjuntoMap = new Map<string, { 
      pieces: number; 
      totalLength: number; 
      bars: Set<number>;
      tags: string[];
    }>();
    
    results.bars.forEach((bar, barIndex) => {
      bar.pieces.forEach((piece: any) => {
        const conjunto = piece.conjunto || 'Entrada Manual';
        if (!conjuntoMap.has(conjunto)) {
          conjuntoMap.set(conjunto, { 
            pieces: 0, 
            totalLength: 0, 
            bars: new Set(),
            tags: []
          });
        }
        const summary = conjuntoMap.get(conjunto)!;
        summary.pieces++;
        summary.totalLength += piece.length;
        summary.bars.add(barIndex + 1);
        if (piece.tag && !summary.tags.includes(piece.tag)) {
          summary.tags.push(piece.tag);
        }
      });
    });
    
    return conjuntoMap;
  };

  const barGroups = getBarGroups();
  const conjuntoSummary = getConjuntoSummary();

  return (
    <div className="bg-white min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: headerFooterStyles }} />
      
      {/* Print Header */}
      <div className="print-header hidden print:block">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {mode === 'complete' ? 'Relatório Completo de Otimização' : 'Plano de Corte por Conjunto'}
            </h1>
            <div className="text-xs text-gray-600 mt-1">
              Projeto: {project?.projectNumber || 'N/A'} | Cliente: {project?.client || 'N/A'} | Obra: {project?.obra || 'N/A'}
            </div>
          </div>
          <div className="text-right text-xs text-gray-600">
            <div>Data: {currentDate}</div>
            <div>Total de Barras: {results.totalBars} | Eficiência: {results.efficiency.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Print Footer */}
      <div className="print-footer hidden print:block">
        <div className="flex justify-between items-center">
          <div>Operador: {project?.operador || '_________'} | Turno: {project?.turno || '___'} | QA: {project?.aprovadorQA || '_________'}</div>
          <div>© Sistema de Otimização - Elite Soldas</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="print-content p-4">
        {mode === 'complete' && (
          <>
            {/* Executive Summary */}
            <div className="mb-6 pb-4 border-b">
              <h2 className="text-lg font-semibold mb-3">Resumo por Conjunto</h2>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300 text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 p-2">Conjunto</th>
                      <th className="border border-gray-300 p-2">Peças</th>
                      <th className="border border-gray-300 p-2">Comprimento Total</th>
                      <th className="border border-gray-300 p-2">Barras</th>
                      <th className="border border-gray-300 p-2">TAGs Principais</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(conjuntoSummary.entries()).map(([conjunto, data]) => (
                      <tr key={conjunto}>
                        <td className="border border-gray-300 p-2 font-medium">{conjunto}</td>
                        <td className="border border-gray-300 p-2 text-center">{data.pieces}</td>
                        <td className="border border-gray-300 p-2 text-center">{(data.totalLength / 1000).toFixed(2)}m</td>
                        <td className="border border-gray-300 p-2 text-center">
                          {Array.from(data.bars).sort((a, b) => a - b).join(', ')}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {data.tags.slice(0, 3).join(', ')}{data.tags.length > 3 ? '...' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Project Details */}
            <div className="mb-6 pb-4 border-b">
              <h2 className="text-lg font-semibold mb-3">Detalhes do Projeto</h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><strong>Projeto:</strong> {project?.projectNumber || 'N/A'}</div>
                <div><strong>Cliente:</strong> {project?.client || 'N/A'}</div>
                <div><strong>Obra:</strong> {project?.obra || 'N/A'}</div>
                <div><strong>Material:</strong> {project?.tipoMaterial || 'N/A'}</div>
                <div><strong>Operador:</strong> {project?.operador || 'N/A'}</div>
                <div><strong>Turno:</strong> {project?.turno || 'N/A'}</div>
                <div><strong>Aprovador QA:</strong> {project?.aprovadorQA || 'N/A'}</div>
                <div><strong>Validação QA:</strong> {project?.validacaoQA ? 'Validado' : 'Pendente'}</div>
              </div>
            </div>
          </>
        )}

        {/* Bar Visualizations */}
        <div className="space-y-6">
          {barGroups.map((barGroup, groupIndex) => (
            <div key={groupIndex} className={`bars-per-page ${groupIndex > 0 ? 'page-break' : ''}`}>
              <div className="mb-3">
                <h3 className="text-base font-semibold">
                  Barras {groupIndex * (mode === 'simplified' ? 6 : 4) + 1} a {Math.min((groupIndex + 1) * (mode === 'simplified' ? 6 : 4), results.totalBars)} de {results.totalBars}
                </h3>
              </div>
              
              {/* Visualização das barras do grupo */}
              <div className="mb-4">
                {barGroup.map((bar, barIndex) => {
                  const globalBarIndex = groupIndex * (mode === 'simplified' ? 6 : 4) + barIndex;
                  const conjuntosNaBarra = new Set((bar.pieces as any[])
                    .filter(p => p.conjunto)
                    .map(p => p.conjunto));
                  
                  return (
                    <div key={bar.id} className="mb-4 border rounded p-2">
                      <h4 className="text-sm font-medium mb-2">
                        Barra {globalBarIndex + 1}
                        {conjuntosNaBarra.size > 0 && (
                          <span className="ml-2 text-xs text-blue-600 font-normal">
                            Conjuntos: {Array.from(conjuntosNaBarra).join(', ')}
                          </span>
                        )}
                      </h4>
                      
                      {/* SVG simplificado para impressão */}
                      <div className="bg-gray-50 p-2 rounded mb-2">
                        <svg width="100%" height="40" viewBox={`0 0 ${barLength / 20} 40`} className="border">
                          {(() => {
                            let currentX = 0;
                            return bar.pieces.map((piece: any, pieceIndex) => {
                              const segmentWidth = piece.length / 20;
                              const segment = (
                                <g key={pieceIndex}>
                                  <rect
                                    x={currentX}
                                    y={10}
                                    width={segmentWidth}
                                    height={20}
                                    fill={piece.color}
                                    stroke="#fff"
                                    strokeWidth="0.5"
                                  />
                                  {piece.length > 800 && (
                                    <text
                                      x={currentX + segmentWidth / 2}
                                      y={22}
                                      textAnchor="middle"
                                      fontSize="6"
                                      fill="white"
                                      fontWeight="bold"
                                    >
                                      {piece.tag || piece.length}
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
                            <rect
                              x={bar.totalUsed / 20}
                              y={10}
                              width={bar.waste / 20}
                              height={20}
                              fill="#9CA3AF"
                              stroke="#fff"
                              strokeWidth="0.5"
                            />
                          )}
                        </svg>
                      </div>

                      {/* Tabela melhorada com informações do operador */}
                      <table className="w-full border-collapse border border-gray-300 text-xs mb-2">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-300 px-1 py-1">Seq.</th>
                            <th className="border border-gray-300 px-1 py-1">TAG</th>
                            <th className="border border-gray-300 px-1 py-1">Comprimento</th>
                            <th className="border border-gray-300 px-1 py-1">Conjunto</th>
                            <th className="border border-gray-300 px-1 py-1">Perfil</th>
                            <th className="border border-gray-300 px-1 py-1">✓</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bar.pieces.map((piece: any, pieceIndex) => (
                            <tr key={pieceIndex}>
                              <td className="border border-gray-300 px-1 py-1 text-center">{pieceIndex + 1}</td>
                              <td className="border border-gray-300 px-1 py-1 font-mono text-center">
                                {piece.tag || `P${pieceIndex + 1}`}
                              </td>
                              <td className="border border-gray-300 px-1 py-1 font-mono text-center">{piece.length}mm</td>
                              <td className="border border-gray-300 px-1 py-1 text-center text-xs">
                                {piece.conjunto || 'Manual'}
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center text-xs">
                                {piece.perfil || '-'}
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">☐</td>
                            </tr>
                          ))}
                          {bar.waste > 0 && (
                            <tr className="bg-red-50">
                              <td className="border border-gray-300 px-1 py-1 text-center">Sobra</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 font-mono text-center text-red-600">{bar.waste}mm</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">Descarte</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">☐</td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      {/* Informações da barra */}
                      <div className="text-xs text-gray-600 grid grid-cols-3 gap-2">
                        <div><strong>Eficiência:</strong> {((bar.totalUsed / barLength) * 100).toFixed(1)}%</div>
                        <div><strong>Utilizado:</strong> {(bar.totalUsed / 1000).toFixed(2)}m</div>
                        <div><strong>Sobra:</strong> {(bar.waste / 1000).toFixed(3)}m</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Tabela Resumo Final - sempre na última página */}
        <div className="page-break">
          <h2 className="text-lg font-semibold mb-3">Resumo Final e Controle</h2>
          
          {/* Tabela resumo das barras */}
          <table className="w-full border border-gray-300 text-xs mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Barra</th>
                <th className="border border-gray-300 p-2">Peças</th>
                <th className="border border-gray-300 p-2">Conjuntos</th>
                <th className="border border-gray-300 p-2">Utilizado</th>
                <th className="border border-gray-300 p-2">Sobra</th>
                <th className="border border-gray-300 p-2">Eficiência</th>
                <th className="border border-gray-300 p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.bars.map((bar, index) => {
                const conjuntos = new Set((bar.pieces as any[])
                  .filter(p => p.conjunto)
                  .map(p => p.conjunto));
                return (
                  <tr key={bar.id}>
                    <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                    <td className="border border-gray-300 p-2 text-center">{bar.pieces.length}</td>
                    <td className="border border-gray-300 p-2 text-center text-xs">
                      {conjuntos.size > 0 ? Array.from(conjuntos).join(', ') : 'Manual'}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">{(bar.totalUsed / 1000).toFixed(2)}m</td>
                    <td className="border border-gray-300 p-2 text-center">{(bar.waste / 1000).toFixed(3)}m</td>
                    <td className="border border-gray-300 p-2 text-center">{((bar.totalUsed / barLength) * 100).toFixed(1)}%</td>
                    <td className="border border-gray-300 p-2 text-center">☐</td>
                  </tr>
                );
              })}
              <tr className="bg-blue-50 font-bold">
                <td className="border border-gray-300 p-2 text-center">TOTAL</td>
                <td className="border border-gray-300 p-2 text-center">{results.bars.reduce((sum, bar) => sum + bar.pieces.length, 0)}</td>
                <td className="border border-gray-300 p-2 text-center">{conjuntoSummary.size}</td>
                <td className="border border-gray-300 p-2 text-center">{((results.bars.reduce((sum, bar) => sum + bar.totalUsed, 0)) / 1000).toFixed(2)}m</td>
                <td className="border border-gray-300 p-2 text-center">{(results.totalWaste / 1000).toFixed(2)}m</td>
                <td className="border border-gray-300 p-2 text-center">{results.efficiency.toFixed(1)}%</td>
                <td className="border border-gray-300 p-2 text-center">-</td>
              </tr>
            </tbody>
          </table>

          {/* Check-list para operador */}
          <div className="mt-6 p-4 border rounded">
            <h3 className="font-semibold mb-3">Check-list do Operador</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>☐ Material conferido e correto</div>
              <div>☐ Barras verificadas e posicionadas</div>
              <div>☐ TAGs das peças conferidas</div>
              <div>☐ Conjuntos organizados por prioridade</div>
              <div>☐ Primeira peça cortada e validada</div>
              <div>☐ Dimensões conferidas com padrão</div>
              <div>☐ Sobras identificadas e separadas</div>
              <div>☐ Relatório validado pelo inspetor QA</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
