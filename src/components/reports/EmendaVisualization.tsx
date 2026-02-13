import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scissors } from 'lucide-react';

interface EmendaDetalhes {
  pecaTag?: string;
  pecaPosicao?: string;
  comprimentoTotal: number;
  sobraNome: string;
  sobraComprimento: number;
  barraOrigemSobra: string;
  comprimentoNovaBarra: number;
}

interface EmendaVisualizationProps {
  emenda: EmendaDetalhes;
  barraId: string;
  index: number;
}

export const EmendaVisualization = ({ emenda, barraId, index }: EmendaVisualizationProps) => {
  // Calcular escala para visualização (max 600 unidades para a peça completa)
  const escala = 600 / emenda.comprimentoTotal;
  const larguraSobra = emenda.sobraComprimento * escala;
  const larguraNovaBarra = emenda.comprimentoNovaBarra * escala;

  return (
    <Card className="border-l-4 border-l-purple-500 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Peça {emenda.pecaTag || `Emenda ${index + 1}`}
            </CardTitle>
            <Badge className="bg-purple-100 text-purple-800">
              <Scissors className="w-3 h-3 mr-1" />
              EMENDA
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-purple-600">
              {emenda.comprimentoTotal}mm
            </div>
            <div className="text-sm text-gray-500">
              Comprimento Total
            </div>
          </div>
        </div>
        {emenda.pecaPosicao && (
          <div className="text-sm text-gray-600 mt-1">
            Posição: {emenda.pecaPosicao}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Visualização SVG da Emenda */}
        <div className="mb-4">
          <svg width="100%" height="100" viewBox="0 0 620 100" className="border rounded bg-gray-50">
            {/* Parte da sobra */}
            <g>
              <rect
                x={10}
                y={30}
                width={larguraSobra}
                height={40}
                fill="#9333EA"
                stroke="#7C3AED"
                strokeWidth="2"
                rx="2"
              />
              <text
                x={10 + larguraSobra / 2}
                y={55}
                textAnchor="middle"
                fontSize="10"
                fill="white"
                fontWeight="bold"
              >
                {emenda.sobraNome}
              </text>
              <text
                x={10 + larguraSobra / 2}
                y={45}
                textAnchor="middle"
                fontSize="8"
                fill="white"
              >
                {emenda.sobraComprimento}mm
              </text>
            </g>

            {/* Ponto de emenda (linha tracejada) */}
            <line
              x1={10 + larguraSobra}
              y1={20}
              x2={10 + larguraSobra}
              y2={80}
              stroke="#EF4444"
              strokeWidth="3"
              strokeDasharray="6,3"
            />
            <text
              x={10 + larguraSobra}
              y={15}
              textAnchor="middle"
              fontSize="8"
              fill="#EF4444"
              fontWeight="bold"
            >
              EMENDA
            </text>

            {/* Parte da barra nova */}
            <g>
              <rect
                x={10 + larguraSobra}
                y={30}
                width={larguraNovaBarra}
                height={40}
                fill="#3B82F6"
                stroke="#2563EB"
                strokeWidth="2"
                rx="2"
              />
              <text
                x={10 + larguraSobra + larguraNovaBarra / 2}
                y={55}
                textAnchor="middle"
                fontSize="10"
                fill="white"
                fontWeight="bold"
              >
                Barra {barraId}
              </text>
              <text
                x={10 + larguraSobra + larguraNovaBarra / 2}
                y={45}
                textAnchor="middle"
                fontSize="8"
                fill="white"
              >
                {emenda.comprimentoNovaBarra}mm
              </text>
            </g>

            {/* Setas indicando origem */}
            <text x={10} y={90} fontSize="8" fill="#9333EA">
              ← De: {emenda.barraOrigemSobra}
            </text>
            <text x={10 + larguraSobra + 5} y={90} fontSize="8" fill="#3B82F6">
              ← De: {barraId}
            </text>
          </svg>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500"></div>
            <span className="text-gray-600">
              {emenda.sobraNome}: {emenda.sobraComprimento}mm ({((emenda.sobraComprimento / emenda.comprimentoTotal) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-gray-600">
              Barra Nova: {emenda.comprimentoNovaBarra}mm ({((emenda.comprimentoNovaBarra / emenda.comprimentoTotal) * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
