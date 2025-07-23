import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { toast } from 'sonner';

/**
 * Componente de teste para demonstrar o uso do sistema de auditoria
 * Este componente pode ser usado como exemplo de como integrar logs em outros componentes
 */
export const AuditTestComponent: React.FC = () => {
  const { 
    logProjectAction, 
    logPieceAction, 
    logOptimizationAction, 
    logSystemActivity 
  } = useAuditLogger();

  const handleTestProjectLog = async () => {
    await logProjectAction(
      'CRIAR',
      'test-project-id',
      'Projeto de Teste',
      { origem: 'componente-teste', timestamp: new Date().toISOString() }
    );
    toast.success('Log de projeto criado!');
  };

  const handleTestPieceLog = async () => {
    await logPieceAction(
      'ADICIONAR',
      'test-piece-id',
      'Projeto de Teste',
      { comprimento: 1000, quantidade: 5, perfil: 'W310x21.0' }
    );
    toast.success('Log de peça criado!');
  };

  const handleTestOptimizationLog = async () => {
    await logOptimizationAction(
      'OTIMIZAR',
      'test-optimization-id',
      'Projeto de Teste',
      { 
        eficiencia: 85.5, 
        barras_utilizadas: 15, 
        sobras_geradas: 125.5,
        algorithm: 'BestFit'
      }
    );
    toast.success('Log de otimização criado!');
  };

  const handleTestSystemLog = async () => {
    await logSystemActivity({
      actionType: 'TESTE',
      entityType: 'SISTEMA',
      description: 'Teste do sistema de auditoria realizado',
      details: { 
        teste_id: 'audit-test-001',
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    });
    toast.success('Log de sistema criado!');
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Teste do Sistema de Auditoria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handleTestProjectLog} variant="outline">
            Testar Log de Projeto
          </Button>
          
          <Button onClick={handleTestPieceLog} variant="outline">
            Testar Log de Peça
          </Button>
          
          <Button onClick={handleTestOptimizationLog} variant="outline">
            Testar Log de Otimização
          </Button>
          
          <Button onClick={handleTestSystemLog} variant="outline">
            Testar Log de Sistema
          </Button>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Como usar nos seus componentes:</h4>
          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`// 1. Importar o hook
import { useAuditLogger } from '@/hooks/useAuditLogger';

// 2. Usar no componente
const { logProjectAction } = useAuditLogger();

// 3. Chamar ao realizar ações
await logProjectAction('CRIAR', projectId, projectName, details);`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};