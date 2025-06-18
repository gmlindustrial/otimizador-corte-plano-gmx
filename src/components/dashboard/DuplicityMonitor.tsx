
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Search, Download, Send } from 'lucide-react';

interface DuplicityMonitorProps {
  history: any[];
  onExport: (type: string) => void;
  onSendWhatsApp: (type: string) => void;
  onSendTelegram: (type: string) => void;
}

export const DuplicityMonitor = ({ 
  history, 
  onExport, 
  onSendWhatsApp, 
  onSendTelegram 
}: DuplicityMonitorProps) => {
  
  // Detecção de duplicidade baseada em comprimento + material + projeto
  const duplicateAnalysis = history.reduce((acc, item, historyIndex) => {
    const project = item.project;
    const pieces = item.pieces;
    
    pieces.forEach((piece, pieceIndex) => {
      const key = `${piece.length}-${project?.tipoMaterial}-${project?.projectNumber}`;
      
      if (!acc[key]) {
        acc[key] = {
          length: piece.length,
          material: project?.tipoMaterial || 'N/A',
          project: project?.projectNumber || 'N/A',
          occurrences: [],
          totalQuantity: 0
        };
      }
      
      acc[key].occurrences.push({
        date: new Date(item.date).toLocaleDateString(),
        operator: project?.operador || 'N/A',
        lista: project?.lista || 'N/A',
        quantity: piece.quantity,
        historyIndex,
        pieceIndex
      });
      
      acc[key].totalQuantity += piece.quantity;
    });
    
    return acc;
  }, {});

  // Filtrar apenas duplicatas (mais de 1 ocorrência)
  const duplicates = Object.entries(duplicateAnalysis)
    .filter(([_, data]: [string, any]) => data.occurrences.length > 1)
    .sort(([_, a]: [string, any], [__, b]: [string, any]) => b.totalQuantity - a.totalQuantity);

  const totalDuplicates = duplicates.length;
  const totalDuplicatePieces = duplicates.reduce((sum, [_, data]: [string, any]) => sum + data.totalQuantity, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Monitor de Duplicidade
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onExport('duplicity-report')}>
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => onSendWhatsApp('duplicity-report')}>
                <Send className="w-4 h-4 mr-1" />
                WhatsApp
              </Button>
              <Button size="sm" variant="outline" onClick={() => onSendTelegram('duplicity-report')}>
                <Send className="w-4 h-4 mr-1" />
                Telegram
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Resumo de Duplicidade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{totalDuplicates}</div>
              <div className="text-sm text-gray-600">Peças Duplicadas</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{totalDuplicatePieces}</div>
              <div className="text-sm text-gray-600">Total de Ocorrências</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                {history.length > 0 ? ((totalDuplicates / history.length) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-gray-600">Taxa de Duplicidade</div>
            </div>
          </div>

          {/* Critério de Duplicidade */}
          <Alert className="border-blue-200 bg-blue-50 mb-6">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Critério de Duplicidade:</strong> Comprimento + Material + Projeto
            </AlertDescription>
          </Alert>

          {/* Lista de Duplicatas */}
          {duplicates.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-semibold">Peças com Mesmas Especificações</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {duplicates.map(([key, data]: [string, any], index) => (
                  <div key={key} className="border rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-medium text-lg">
                          {data.length}mm - {data.material}
                        </h5>
                        <p className="text-sm text-gray-600">Projeto: {data.project}</p>
                      </div>
                      <Badge variant="destructive">
                        {data.occurrences.length} ocorrências
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <h6 className="font-medium text-sm">Histórico de Ocorrências:</h6>
                      <div className="grid gap-2">
                        {data.occurrences.map((occurrence, occIndex) => (
                          <div key={occIndex} className="bg-white p-3 rounded border text-sm">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div>
                                <strong>Data:</strong> {occurrence.date}
                              </div>
                              <div>
                                <strong>Operador:</strong> {occurrence.operator}
                              </div>
                              <div>
                                <strong>Lista:</strong> {occurrence.lista}
                              </div>
                              <div>
                                <strong>Qtd:</strong> {occurrence.quantity}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 p-2 bg-orange-100 rounded text-sm">
                      <strong>Total Duplicado:</strong> {data.totalQuantity} peças | 
                      <strong> Economia Potencial:</strong> {data.totalQuantity - data.occurrences[0].quantity} peças desnecessárias
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <h4 className="font-medium text-gray-600 mb-2">Nenhuma Duplicidade Detectada</h4>
              <p className="text-sm text-gray-500">
                Todas as peças têm especificações únicas baseadas no critério: Comprimento + Material + Projeto
              </p>
            </div>
          )}

          {/* Recomendações */}
          {duplicates.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Recomendações</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Revisar listas antes do processamento para evitar retrabalho</li>
                <li>• Consolidar peças idênticas em uma única lista quando possível</li>
                <li>• Verificar se peças duplicadas são realmente necessárias</li>
                <li>• Implementar checklist de validação pré-corte</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
