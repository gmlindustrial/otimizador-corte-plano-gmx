
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Users, Clock, Ruler } from 'lucide-react';
import { useState } from 'react';

interface ProductionStepProps {
  formData: any;
  setFormData: (data: any) => void;
  tiposMaterial: string[];
  operadores: string[];
  barLength: number;
  setBarLength: (length: number) => void;
}

export const ProductionStep = ({ formData, setFormData, tiposMaterial, operadores, barLength, setBarLength }: ProductionStepProps) => {
  const [showNewOperatorInput, setShowNewOperatorInput] = useState(false);
  const [newOperator, setNewOperator] = useState('');

  const handleAddNewOperator = () => {
    if (newOperator.trim()) {
      setFormData(prev => ({ ...prev, operador: newOperator.trim() }));
      setNewOperator('');
      setShowNewOperatorInput(false);
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Etapa 2: Configuração de Produção
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 font-medium">
            <Package className="w-4 h-4" />
            Tipo de Material *
          </Label>
          <Select value={formData.tipoMaterial} onValueChange={(value) => setFormData(prev => ({ ...prev, tipoMaterial: value }))}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione o tipo de material" />
            </SelectTrigger>
            <SelectContent>
              {tiposMaterial.map(tipo => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 font-medium">
            <Users className="w-4 h-4" />
            Operador *
          </Label>
          {!showNewOperatorInput ? (
            <Select value={formData.operador} onValueChange={(value) => {
              if (value === 'new') {
                setShowNewOperatorInput(true);
              } else {
                setFormData(prev => ({ ...prev, operador: value }));
              }
            }}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione o operador" />
              </SelectTrigger>
              <SelectContent>
                {operadores.map(op => (
                  <SelectItem key={op} value={op}>{op}</SelectItem>
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
              <Button onClick={handleAddNewOperator} size="sm" className="px-6">Adicionar</Button>
              <Button variant="outline" onClick={() => setShowNewOperatorInput(false)} size="sm" className="px-4">Cancelar</Button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2 font-medium">
            <Clock className="w-4 h-4" />
            Turno *
          </Label>
          <div className="grid grid-cols-3 gap-4">
            {['1', '2', 'Central'].map((turno) => (
              <label key={turno} className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="turno"
                  value={turno}
                  checked={formData.turno === turno}
                  onChange={(e) => setFormData(prev => ({ ...prev, turno: e.target.value }))}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="font-medium">{turno === 'Central' ? 'Turno Central' : `${turno}º Turno`}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 font-medium">
            <Ruler className="w-4 h-4" />
            Comprimento da Barra (mm)
          </Label>
          <Select value={barLength.toString()} onValueChange={(value) => setBarLength(parseInt(value))}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6000">6000mm (6 metros)</SelectItem>
              <SelectItem value="12000">12000mm (12 metros)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
