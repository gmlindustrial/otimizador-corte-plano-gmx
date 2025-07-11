import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import type { ProjectPieceValidation, PerfilMaterial } from '@/types/project';

interface ProjectValidationAlertProps {
  validations: ProjectPieceValidation[];
  onResolve: (validation: ProjectPieceValidation, selectedPerfil: PerfilMaterial) => void;
  onNavigateToProfileManagement?: () => void;
}

export const ProjectValidationAlert = ({ validations, onResolve, onNavigateToProfileManagement }: ProjectValidationAlertProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (validations.length === 0) return null;

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="w-4 h-4 text-orange-600" />
      <AlertDescription>
        <div className="space-y-4">
          <div>
            <p className="font-medium text-orange-800">
              {validations.length} peça(s) com perfis não encontrados
            </p>
            <p className="text-sm text-orange-700">
              Revise as peças abaixo e selecione o perfil correspondente ou crie um novo.
            </p>
          </div>

          <div className="space-y-3">
            {validations.map((validation, index) => (
              <Card key={index} className="border-orange-200 bg-white">
                <CardHeader 
                  className="pb-3 cursor-pointer"
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                >
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div>
                      <span className="font-medium">{validation.peca.tag_peca}</span>
                      <span className="ml-2 text-gray-600">
                        {validation.peca.descricao_perfil_raw}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">
                      {expandedIndex === index ? 'Ocultar' : 'Resolver'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                
                {expandedIndex === index && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="text-sm">
                        <p><strong>Comprimento:</strong> {validation.peca.comprimento_mm}mm</p>
                        <p><strong>Quantidade:</strong> {validation.peca.quantidade}</p>
                        {validation.peca.conjunto && (
                          <p><strong>Conjunto:</strong> {validation.peca.conjunto}</p>
                        )}
                      </div>

                      {validation.suggestions.length > 0 ? (
                        <div>
                          <p className="text-sm font-medium mb-2">Perfis similares encontrados:</p>
                          <div className="space-y-2">
                            {validation.suggestions.map((perfil) => (
                              <div key={perfil.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                <div>
                                  <p className="font-medium">{perfil.descricao_perfil}</p>
                                  <p className="text-sm text-gray-600">
                                    {perfil.tipo_perfil} | {perfil.kg_por_metro} kg/m
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => onResolve(validation, perfil)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Usar este
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            Nenhum perfil similar encontrado. 
                            Considere cadastrar um novo perfil no sistema.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={onNavigateToProfileManagement}
                          >
                            Cadastrar Novo Perfil
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};