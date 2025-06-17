
import { OptimizationResult, Project } from '@/pages/Index';
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
        margin: 2cm 1.5cm;
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
        height: 80px;
        background: white;
        border-bottom: 2px solid #e5e7eb;
        padding: 15px;
        z-index: 1000;
      }
      .print-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 50px;
        background: white;
        border-top: 1px solid #e5e7eb;
        padding: 10px 15px;
        font-size: 12px;
        color: #666;
        z-index: 1000;
      }
      .print-content {
        margin-top: 100px;
        margin-bottom: 70px;
      }
    }
  `;

  return (
    <div className="bg-white min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: headerFooterStyles }} />
      
      {/* Print Header */}
      <div className="print-header hidden print:block">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {mode === 'complete' ? 'Relatório Completo de Otimização' : 'Plano de Corte Simplificado'}
            </h1>
            <div className="text-sm text-gray-600 mt-1">
              Projeto: {project?.projectNumber || 'N/A'} | Cliente: {project?.client || 'N/A'}
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div>Data: {currentDate}</div>
            <div>Página: <span className="page-counter">1</span></div>
          </div>
        </div>
      </div>

      {/* Print Footer */}
      <div className="print-footer hidden print:block">
        <div className="flex justify-between items-center">
          <div>Versão do documento: {version}</div>
          <div>© Sistema de Otimização de Corte</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="print-content p-6">
        {mode === 'complete' && (
          <>
            {/* Executive Summary */}
            <div className="mb-8 pb-6 border-b">
              <h2 className="text-xl font-semibold mb-4">Resumo Executivo</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{results.totalBars}</div>
                  <div className="text-sm text-gray-600">Barras Utilizadas</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{results.efficiency.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Eficiência</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{(results.totalWaste / 1000).toFixed(2)}m</div>
                  <div className="text-sm text-gray-600">Desperdício</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{results.wastePercentage.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">% Desperdício</div>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="mb-8 pb-6 border-b">
              <h2 className="text-xl font-semibold mb-4">Detalhes do Projeto</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
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
        <div className="space-y-8">
          {results.bars.map((bar, barIndex) => (
            <div key={bar.id} className={barIndex > 0 ? 'page-break' : ''}>
              <ReportVisualization 
                results={{ 
                  ...results, 
                  bars: [bar] 
                }} 
                barLength={barLength}
                showLegend={barIndex === 0}
              />
            </div>
          ))}
        </div>

        {mode === 'complete' && (
          <div className="page-break">
            <h2 className="text-xl font-semibold mb-4">Análise de Resultados</h2>
            <div className="space-y-4 text-sm">
              <p>
                <strong>Eficiência Alcançada:</strong> {results.efficiency.toFixed(1)}% 
                ({results.efficiency >= 85 ? 'Excelente' : results.efficiency >= 75 ? 'Bom' : 'Pode melhorar'})
              </p>
              <p>
                <strong>Total de Material Utilizado:</strong> {((results.totalBars * barLength - results.totalWaste) / 1000).toFixed(2)}m
              </p>
              <p>
                <strong>Total de Material Desperdiçado:</strong> {(results.totalWaste / 1000).toFixed(2)}m
              </p>
              <p>
                <strong>Economia vs. Corte Linear:</strong> Aproximadamente {Math.max(0, 25 - results.wastePercentage).toFixed(1)}% de redução de desperdício
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
