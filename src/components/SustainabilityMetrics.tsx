
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Leaf, Recycle, DollarSign, TrendingUp, MapPin } from 'lucide-react';

interface SustainabilityMetricsProps {
  leftoverBarsUsed: number;
  newBarsUsed: number;
  materialReused: number; // em mm
  totalEconomy: number; // em R$
  wasteReduction: number; // em %
  totalBars: number;
}

export const SustainabilityMetrics = ({
  leftoverBarsUsed,
  newBarsUsed,
  materialReused,
  totalEconomy,
  wasteReduction,
  totalBars
}: SustainabilityMetricsProps) => {
  const reusePercentage = (leftoverBarsUsed / totalBars) * 100;
  const materialReuseKm = materialReused / 1000000; // converter para km para impacto visual
  
  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Leaf className="w-5 h-5" />
          Relatório de Sustentabilidade
          <Badge variant="secondary" className="bg-green-200 text-green-800">
            Eco-Friendly
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métricas Principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-center mb-2">
              <Recycle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{leftoverBarsUsed}</div>
            <div className="text-sm text-gray-600">Sobras Reutilizadas</div>
            <div className="text-xs text-green-600 mt-1">
              {reusePercentage.toFixed(1)}% do total
            </div>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{(materialReused / 1000).toFixed(1)}m</div>
            <div className="text-sm text-gray-600">Material Reutilizado</div>
            <div className="text-xs text-blue-600 mt-1">
              {materialReuseKm > 0.001 ? `${materialReuseKm.toFixed(3)}km` : `${materialReused}mm`}
            </div>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">{totalEconomy.toFixed(0)}</div>
            <div className="text-sm text-gray-600">Economia (R$)</div>
            <div className="text-xs text-emerald-600 mt-1">
              Material não comprado
            </div>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-center mb-2">
              <Leaf className="w-6 h-6 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-teal-600">{wasteReduction.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Redução Desperdício</div>
            <div className="text-xs text-teal-600 mt-1">
              Impacto ambiental
            </div>
          </div>
        </div>

        {/* Progresso de Sustentabilidade */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Taxa de Reaproveitamento</span>
              <span className="text-green-600 font-semibold">{reusePercentage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={reusePercentage} 
              className="h-3"
            />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Eficiência Sustentável</span>
              <span className="text-blue-600 font-semibold">{Math.min(100, wasteReduction + reusePercentage).toFixed(1)}%</span>
            </div>
            <Progress 
              value={Math.min(100, wasteReduction + reusePercentage)} 
              className="h-3"
            />
          </div>
        </div>

        {/* Comparativo */}
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
          <h4 className="font-semibold text-gray-800 mb-3">Comparativo com Método Tradicional</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Sem Reaproveitamento:</div>
              <div className="font-semibold text-red-600">{totalBars} barras novas</div>
              <div className="text-xs text-gray-500">R$ {((totalBars * 6) * 8).toFixed(2)} em material</div>
            </div>
            <div>
              <div className="text-gray-600">Com Reaproveitamento:</div>
              <div className="font-semibold text-green-600">{newBarsUsed} barras novas + {leftoverBarsUsed} sobras</div>
              <div className="text-xs text-green-600">Economia de R$ {totalEconomy.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Impacto Ambiental */}
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <h4 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
            <Leaf className="w-4 h-4" />
            Impacto Ambiental Estimado
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="text-center">
              <div className="font-bold text-emerald-700">{(materialReused * 0.008).toFixed(2)}kg</div>
              <div className="text-emerald-600">CO₂ evitado</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-emerald-700">{(materialReused / 1000000 * 7.85).toFixed(2)}kg</div>
              <div className="text-emerald-600">Aço reutilizado</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-emerald-700">{leftoverBarsUsed}</div>
              <div className="text-emerald-600">Barras salvas</div>
            </div>
          </div>
        </div>

        {/* Recomendações */}
        {reusePercentage > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Recomendações</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {reusePercentage > 50 && (
                <li>• Excelente reaproveitamento! Continue priorizando sobras.</li>
              )}
              {totalEconomy > 100 && (
                <li>• Economia significativa alcançada com sustentabilidade.</li>
              )}
              {wasteReduction > 20 && (
                <li>• Redução de desperdício acima da média do setor.</li>
              )}
              <li>• Considere criar um programa de incentivo à sustentabilidade na produção.</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
