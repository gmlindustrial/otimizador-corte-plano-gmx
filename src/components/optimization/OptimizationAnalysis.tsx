import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  BarChart3, 
  Target,
  Lightbulb,
  AlertCircle,
  Play
} from 'lucide-react';

interface PreAnalysisResult {
  viability: 'viable' | 'challenging' | 'impossible';
  estimatedBars: number;
  estimatedEfficiency: number;
  recommendations: string[];
  pieceDistribution: {
    small: number;
    medium: number;
    large: number;
  };
  challenges: string[];
  suggestions: string[];
}

interface OptimizationAnalysisProps {
  analysis: PreAnalysisResult | null;
  isAnalyzing: boolean;
  isOptimizing: boolean;
  onRunAnalysis: () => void;
  onRunOptimization: () => void;
  piecesCount: number;
}

export const OptimizationAnalysis = ({
  analysis,
  isAnalyzing,
  isOptimizing,
  onRunAnalysis,
  onRunOptimization,
  piecesCount
}: OptimizationAnalysisProps) => {
  const getViabilityColor = (viability: string) => {
    switch (viability) {
      case 'viable': return 'text-green-600 bg-green-50 border-green-200';
      case 'challenging': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'impossible': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getViabilityIcon = (viability: string) => {
    switch (viability) {
      case 'viable': return <CheckCircle className="w-5 h-5" />;
      case 'challenging': return <AlertTriangle className="w-5 h-5" />;
      case 'impossible': return <XCircle className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getViabilityText = (viability: string) => {
    switch (viability) {
      case 'viable': return 'Projeto Viável';
      case 'challenging': return 'Projeto Desafiador';
      case 'impossible': return 'Projeto Inviável';
      default: return 'Análise Pendente';
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Análise Inteligente de Otimização
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Botões de Ação */}
        <div className="flex gap-3">
          <Button
            onClick={onRunAnalysis}
            disabled={isAnalyzing || piecesCount === 0}
            variant="outline"
            className="flex-1"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                Analisando...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Analisar Projeto
              </>
            )}
          </Button>
          
          {analysis && analysis.viability !== 'impossible' && (
            <Button
              onClick={onRunOptimization}
              disabled={isOptimizing || !analysis}
              className="flex-1"
            >
              {isOptimizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Otimizando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Executar Otimização
                </>
              )}
            </Button>
          )}
        </div>

        {/* Resultados da Análise */}
        {analysis && (
          <div className="space-y-4">
            {/* Status de Viabilidade */}
            <div className={`p-4 rounded-lg border ${getViabilityColor(analysis.viability)}`}>
              <div className="flex items-center gap-3">
                {getViabilityIcon(analysis.viability)}
                <div>
                  <h4 className="font-semibold">{getViabilityText(analysis.viability)}</h4>
                  <p className="text-sm opacity-90">
                    {analysis.estimatedBars} barra(s) estimada(s) • {analysis.estimatedEfficiency.toFixed(1)}% eficiência esperada
                  </p>
                </div>
              </div>
            </div>

            {/* Distribuição de Peças */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analysis.pieceDistribution.small}</div>
                <div className="text-xs text-gray-600">Pequenas (&lt;1m)</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analysis.pieceDistribution.medium}</div>
                <div className="text-xs text-gray-600">Médias (1-3m)</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{analysis.pieceDistribution.large}</div>
                <div className="text-xs text-gray-600">Grandes (&gt;3m)</div>
              </div>
            </div>

            {/* Métricas Estimadas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Barras Estimadas</span>
                </div>
                <div className="text-lg font-bold text-gray-900">{analysis.estimatedBars}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Eficiência Esperada</span>
                </div>
                <div className="text-lg font-bold text-gray-900">{analysis.estimatedEfficiency.toFixed(1)}%</div>
              </div>
            </div>

            {/* Recomendações */}
            {analysis.recommendations.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Recomendações
                </h5>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <Badge key={index} variant="outline" className="block w-full text-left p-2 h-auto">
                      {rec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Desafios */}
            {analysis.challenges.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Desafios identificados:</strong>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    {analysis.challenges.map((challenge, index) => (
                      <li key={index} className="text-sm">{challenge}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Sugestões */}
            {analysis.suggestions.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Sugestões de Melhoria
                </h5>
                <div className="space-y-1">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estado Inicial */}
        {!analysis && !isAnalyzing && (
          <div className="text-center py-8 text-gray-500">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Execute a análise para obter insights sobre a otimização</p>
            <p className="text-sm mt-1">A análise prévia identifica desafios e sugere a melhor estratégia</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};