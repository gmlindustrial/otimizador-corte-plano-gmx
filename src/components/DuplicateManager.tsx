
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Copy, RefreshCw } from 'lucide-react';
import { CutPiece } from '@/pages/Index';

interface DuplicateItem {
  existing: CutPiece;
  imported: CutPiece;
  conflicts: string[];
  material?: string;
  tag?: string;
  project?: string;
}

interface DuplicateManagerProps {
  duplicates: DuplicateItem[];
  onResolved: (action: 'update' | 'ignore' | 'duplicate', pieces: CutPiece[]) => void;
  onCancel: () => void;
}

export const DuplicateManager = ({ duplicates, onResolved, onCancel }: DuplicateManagerProps) => {
  const [selectedAction, setSelectedAction] = useState<'update' | 'ignore' | 'duplicate'>('ignore');
  const [individualActions, setIndividualActions] = useState<Record<string, 'update' | 'ignore' | 'duplicate'>>({});

  const handleIndividualAction = (duplicateIndex: number, action: 'update' | 'ignore' | 'duplicate') => {
    setIndividualActions(prev => ({
      ...prev,
      [duplicateIndex]: action
    }));
  };

  const handleBulkAction = () => {
    const resolvedPieces: CutPiece[] = [];
    
    duplicates.forEach((duplicate, index) => {
      const action = individualActions[index] || selectedAction;
      
      switch (action) {
        case 'ignore':
          // Não adiciona a peça importada
          break;
        
        case 'update':
          // Adiciona a peça importada (irá sobrescrever)
          resolvedPieces.push(duplicate.imported);
          break;
        
        case 'duplicate':
          // Adiciona com ID modificado
          resolvedPieces.push({
            ...duplicate.imported,
            id: `${duplicate.imported.id}-dup-${Date.now()}`
          });
          break;
      }
    });

    onResolved(selectedAction, resolvedPieces);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'update': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ignore': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'duplicate': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'update': return <RefreshCw className="w-3 h-3" />;
      case 'ignore': return <AlertTriangle className="w-3 h-3" />;
      case 'duplicate': return <Copy className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="w-5 h-5" />
          Prevenção de Duplicidade - {duplicates.length} Conflito(s)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-orange-200 bg-orange-100">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Critério de duplicidade:</strong> Comprimento + Material + TAG + Projeto
          </AlertDescription>
        </Alert>

        {/* Ação em massa */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Ação para todos os conflitos:</h4>
          <div className="flex gap-2">
            <Button
              variant={selectedAction === 'ignore' ? 'default' : 'outline'}
              onClick={() => setSelectedAction('ignore')}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Ignorar (Padrão)
            </Button>
            <Button
              variant={selectedAction === 'update' ? 'default' : 'outline'}
              onClick={() => setSelectedAction('update')}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
            <Button
              variant={selectedAction === 'duplicate' ? 'default' : 'outline'}
              onClick={() => setSelectedAction('duplicate')}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Duplicar
            </Button>
          </div>
        </div>

        {/* Lista de conflitos */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Conflitos detectados:</h4>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {duplicates.map((duplicate, index) => (
              <div key={index} className="bg-white border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Comprimento: {duplicate.imported.length}mm</span>
                      <Badge variant="outline">
                        Qtd: {duplicate.imported.quantity}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Existente: {duplicate.existing.quantity} unidades
                    </div>
                    {duplicate.conflicts.length > 0 && (
                      <div className="flex gap-1">
                        {duplicate.conflicts.map((conflict, i) => (
                          <Badge key={i} variant="destructive" className="text-xs">
                            {conflict}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {individualActions[index] && (
                    <Badge className={getActionColor(individualActions[index])}>
                      {getActionIcon(individualActions[index])}
                      {individualActions[index]}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleIndividualAction(index, 'ignore')}
                    className="text-xs"
                  >
                    Ignorar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleIndividualAction(index, 'update')}
                    className="text-xs"
                  >
                    Atualizar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleIndividualAction(index, 'duplicate')}
                    className="text-xs"
                  >
                    Duplicar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-orange-200">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancelar Importação
          </Button>
          <Button
            onClick={handleBulkAction}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Aplicar Ações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
