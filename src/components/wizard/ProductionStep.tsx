
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Users, Clock, Ruler } from "lucide-react";
import { useState, useEffect } from "react";
import { Material, Operador } from "@/services";
import { useMaterialByTypeService } from "@/hooks/services/useMaterialByTypeService";

interface ProductionStepProps {
  formData: any;
  setFormData: (data: any) => void;
  tiposMaterial: Material[];
  operadores: Operador[];
  barLength: number;
  setBarLength: (length: number) => void;
  cuttingType?: 'linear' | 'sheet';
}

export const ProductionStep = ({
  formData,
  setFormData,
  tiposMaterial,
  operadores,
  barLength,
  setBarLength,
  cuttingType = 'linear'
}: ProductionStepProps) => {
  const [showNewOperatorInput, setShowNewOperatorInput] = useState(false);
  const [newOperator, setNewOperator] = useState("");
  
  const { 
    materiaisBarras, 
    materiaisChapas, 
    loading: materialsLoading,
    fetchMateriaisBarras,
    fetchMateriaisChapas
  } = useMaterialByTypeService();

  // Carregar materiais baseado no tipo de corte
  useEffect(() => {
    if (cuttingType === 'linear') {
      fetchMateriaisBarras();
    } else {
      fetchMateriaisChapas();
    }
  }, [cuttingType]);

  const handleAddNewOperator = () => {
    if (newOperator.trim()) {
      setFormData((prev) => ({ ...prev, operador: newOperator.trim() }));
      setNewOperator("");
      setShowNewOperatorInput(false);
    }
  };

  // Determinar quais materiais mostrar baseado no tipo de corte
  const materialsToShow = cuttingType === 'linear' ? materiaisBarras : materiaisChapas;
  const materialTypeLabel = cuttingType === 'linear' ? 'Barras' : 'Chapas';

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Etapa 2: Configuração de Produção - {materialTypeLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 font-medium">
            <Package className="w-4 h-4" />
            Tipo de Material ({materialTypeLabel}) *
          </Label>
          <Select
            value={formData.tipoMaterial}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, tipoMaterial: value }))
            }
            disabled={materialsLoading}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder={
                materialsLoading 
                  ? "Carregando materiais..." 
                  : `Selecione o material para ${materialTypeLabel.toLowerCase()}`
              } />
            </SelectTrigger>
            <SelectContent>
              {materialsToShow.map((tipo) => (
                <SelectItem key={tipo.id} value={tipo.id}>
                  {tipo.tipo} - {tipo.descricao || 'Sem descrição'}
                </SelectItem>
              ))}
              {materialsToShow.length === 0 && !materialsLoading && (
                <SelectItem value="none" disabled>
                  Nenhum material de {materialTypeLabel.toLowerCase()} cadastrado
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 font-medium">
            <Users className="w-4 h-4" />
            Operador *
          </Label>
          {!showNewOperatorInput ? (
            <Select
              value={formData.operador}
              onValueChange={(value) => {
                if (value === "new") {
                  setShowNewOperatorInput(true);
                } else {
                  setFormData((prev) => ({ ...prev, operador: value }));
                }
              }}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione o operador" />
              </SelectTrigger>
              <SelectContent>
                {operadores.filter(op => op.id && op.id.trim() !== '').map((op) => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.nome}
                  </SelectItem>
                ))}
                <SelectItem value="new">+ Criar novo operador</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Nome do novo operador"
                value={newOperator}
                onChange={(e) => setNewOperator(e.target.value)}
                className="h-12"
              />
              <Button onClick={handleAddNewOperator} size="sm" className="px-6">
                Adicionar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNewOperatorInput(false)}
                size="sm"
                className="px-4"
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2 font-medium">
            <Clock className="w-4 h-4" />
            Turno *
          </Label>
          <div className="grid grid-cols-3 gap-4">
            {["1", "2", "Central"].map((turno) => (
              <label
                key={turno}
                className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name="turno"
                  value={turno}
                  checked={formData.turno === turno}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, turno: e.target.value }))
                  }
                  className="w-5 h-5 text-blue-600"
                />
                <span className="font-medium">
                  {turno === "Central" ? "Turno Central" : `${turno}º Turno`}
                </span>
              </label>
            ))}
          </div>
        </div>

        {cuttingType === 'linear' && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-medium">
              <Ruler className="w-4 h-4" />
              Comprimento da Barra (mm)
            </Label>
            <Select
              value={barLength.toString()}
              onValueChange={(value) => setBarLength(parseInt(value))}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6000">6000mm (6 metros)</SelectItem>
                <SelectItem value="12000">12000mm (12 metros)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
