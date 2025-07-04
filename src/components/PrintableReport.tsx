
import type { OptimizationResult } from '@/types/optimization';
import type { Project } from '@/types/project';
import { ReportVisualization } from './ReportVisualization';

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

  // Função para quebrar barras em páginas - corrigida para mostrar todas as barras
  const getBarGroups = () => {
    const barsPerPage = mode === 'simplified' ? 6 : 4; // Reduzido para garantir que caiba na página
    const groups = [];
    for (let i = 0; i < results.bars.length; i += barsPerPage) {
      groups.push(results.bars.slice(i, i + barsPerPage));
    }
    return groups;
  };

  const barGroups = getBarGroups();

  return (
    <div className="bg-white min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: headerFooterStyles }} />
      
      {/* Print Header */}
      <div className="print-header hidden print:block">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {mode === 'complete' ? 'Relatório Completo de Otimização' : 'Plano de Corte Simplificado'}
            </h1>
            <div className="text-xs text-gray-600 mt-1">
              Projeto: {project?.projectNumber || 'N/A'} | Cliente: {project?.client || 'N/A'}
            </div>
          </div>
          <div className="text-right text-xs text-gray-600">
            <div>Data: {currentDate}</div>
            <div>Total de Barras: {results.totalBars}</div>
          </div>
        </div>
      </div>

      {/* Print Footer */}
      <div className="print-footer hidden print:block">
        <div className="flex justify-between items-center">
          <div>Versão: {version}</div>
          <div>© Sistema de Otimização - Elite Soldas</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="print-content p-4">
        {mode === 'complete' && (
          <>
            {/* Executive Summary */}
            <div className="mb-6 pb-4 border-b">
              <h2 className="text-lg font-semibold mb-3">Resumo Executivo</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-xl font-bold text-blue-600">{results.totalBars}</div>
                  <div className="text-xs text-gray-600">Barras Utilizadas</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-xl font-bold text-green-600">{results.efficiency.toFixed(1)}%</div>
                  <div className="text-xs text-gray-600">Eficiência</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <div className="text-xl font-bold text-red-600">{(results.totalWaste / 1000).toFixed(2)}m</div>
                  <div className="text-xs text-gray-600">Desperdício</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <div className="text-xl font-bold text-yellow-600">{results.wastePercentage.toFixed(1)}%</div>
                  <div className="text-xs text-gray-600">% Desperdício</div>
                </div>
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

        {/* Bar Visualizations - TODAS as barras agrupadas por página */}
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
                  return (
                    <div key={bar.id} className="mb-4 border rounded p-2">
                      <h4 className="text-sm font-medium mb-2">Barra {globalBarIndex + 1}</h4>
                      
                      {/* SVG simplificado para impressão */}
                      <div className="bg-gray-50 p-2 rounded mb-2">
                        <svg width="100%" height="40" viewBox={`0 0 ${barLength / 20} 40`} className="border">
                          {(() => {
                            let currentX = 0;
                            return bar.pieces.map((piece, pieceIndex) => {
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
                                  {piece.length > 1000 && (
                                    <text
                                      x={currentX + segmentWidth / 2}
                                      y={22}
                                      textAnchor="middle"
                                      fontSize="6"
                                      fill="white"
                                      fontWeight="bold"
                                    >
                                      {piece.length}
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

                      {/* Tabela de peças para cada barra */}
                      <table className="w-full border-collapse border border-gray-300 text-xs mb-2">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-300 px-1 py-1">Peça</th>
                            <th className="border border-gray-300 px-1 py-1">Comprimento (mm)</th>
                            <th className="border border-gray-300 px-1 py-1">Posição</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bar.pieces.map((piece, pieceIndex) => (
                            <tr key={pieceIndex}>
                              <td className="border border-gray-300 px-1 py-1">Peça {pieceIndex + 1}</td>
                              <td className="border border-gray-300 px-1 py-1 font-mono text-center">{piece.length}</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">{pieceIndex + 1}</td>
                            </tr>
                          ))}
                          {bar.waste > 0 && (
                            <tr className="bg-red-50">
                              <td className="border border-gray-300 px-1 py-1">Sobra</td>
                              <td className="border border-gray-300 px-1 py-1 font-mono text-center text-red-600">{bar.waste}</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">Final</td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      {/* Eficiência da barra */}
                      <div className="text-xs text-gray-600">
                        <strong>Eficiência:</strong> {((bar.totalUsed / barLength) * 100).toFixed(1)}% | 
                        <strong> Utilizado:</strong> {bar.totalUsed}mm | 
                        <strong> Sobra:</strong> {bar.waste}mm
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
          <h2 className="text-lg font-semibold mb-3">Resumo Final das Barras</h2>
          <table className="w-full border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Barra</th>
                <th className="border border-gray-300 p-2">Peças</th>
                <th className="border border-gray-300 p-2">Utilizado (mm)</th>
                <th className="border border-gray-300 p-2">Sobra (mm)</th>
                <th className="border border-gray-300 p-2">Eficiência (%)</th>
              </tr>
            </thead>
            <tbody>
              {results.bars.map((bar, index) => (
                <tr key={bar.id}>
                  <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                  <td className="border border-gray-300 p-2 text-center">{bar.pieces.length}</td>
                  <td className="border border-gray-300 p-2 text-center">{bar.totalUsed}</td>
                  <td className="border border-gray-300 p-2 text-center">{bar.waste}</td>
                  <td className="border border-gray-300 p-2 text-center">{((bar.totalUsed / barLength) * 100).toFixed(1)}</td>
                </tr>
              ))}
              <tr className="bg-blue-50 font-bold">
                <td className="border border-gray-300 p-2 text-center">TOTAL</td>
                <td className="border border-gray-300 p-2 text-center">{results.bars.reduce((sum, bar) => sum + bar.pieces.length, 0)}</td>
                <td className="border border-gray-300 p-2 text-center">{results.bars.reduce((sum, bar) => sum + bar.totalUsed, 0)}</td>
                <td className="border border-gray-300 p-2 text-center">{results.totalWaste}</td>
                <td className="border border-gray-300 p-2 text-center">{results.efficiency.toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
