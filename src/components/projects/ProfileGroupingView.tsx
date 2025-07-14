import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, Package } from 'lucide-react';
import { projetoPecaService } from '@/services/entities/ProjetoPecaService';
import type { ProjetoPeca } from '@/types/project';

interface ProfileGroup {
  perfil_id: string | null;
  descricao: string;
  perfil: any;
  pecas: ProjetoPeca[];
  total_quantidade: number;
  total_comprimento: number;
}

interface ProfileGroupingViewProps {
  projectId: string;
  pieces: ProjetoPeca[];
}

export const ProfileGroupingView = ({ projectId, pieces }: ProfileGroupingViewProps) => {
  const [groupedProfiles, setGroupedProfiles] = useState<ProfileGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroupedProfiles();
  }, [projectId, pieces]);

  const loadGroupedProfiles = async () => {
    setLoading(true);
    try {
      const response = await projetoPecaService.getGroupedByProfile(projectId);
      if (response.success && response.data) {
        setGroupedProfiles(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar perfis agrupados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeProfile = (profileGroup: ProfileGroup) => {
    console.log('Otimizar perfil:', profileGroup);
    // TODO: Implementar interface de otimização
  };

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
            Carregando agrupamento de perfis...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (groupedProfiles.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma peça cadastrada para agrupamento.</p>
            <p className="text-sm">Cadastre peças primeiro para visualizar os perfis agrupados.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Perfis Agrupados ({groupedProfiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Selecione os perfis que deseja otimizar. Cada perfil pode ter uma otimização independente.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groupedProfiles.map((group, index) => (
          <Card key={group.perfil_id || index} className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{group.descricao}</h3>
                  {group.perfil && (
                    <p className="text-sm text-gray-600">
                      Tipo: {group.perfil.tipo_perfil} | {group.perfil.kg_por_metro} kg/m
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <Badge variant="secondary">{group.pecas.length} peças</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total de peças:</span>
                  <p>{group.total_quantidade}</p>
                </div>
                <div>
                  <span className="font-medium">Comprimento total:</span>
                  <p>{(group.total_comprimento / 1000).toFixed(2)}m</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-medium text-sm">Peças:</span>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {group.pecas.map((peca) => (
                    <div key={peca.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                      <span>{peca.posicao}</span>
                      <span>{peca.comprimento_mm}mm x {peca.quantidade}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => handleOptimizeProfile(group)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={!group.perfil}
              >
                <Calculator className="w-4 h-4 mr-2" />
                {group.perfil ? 'Configurar Otimização' : 'Perfil não encontrado'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};