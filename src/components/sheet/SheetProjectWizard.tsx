
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SheetProject } from '@/types/sheet';
import { Square, Save } from 'lucide-react';

interface SheetProjectWizardProps {
  project: SheetProject | null;
  setProject: (project: SheetProject) => void;
}

export const SheetProjectWizard = ({ project, setProject }: SheetProjectWizardProps) => {
  const [formData, setFormData] = useState({
    name: '',
    projectNumber: '',
    client: 'GMX Estruturas',
    obra: '',
    lista: 'LISTA 01',
    revisao: 'REV-00',
    sheetWidth: 2550,
    sheetHeight: 6000,
    thickness: 6,
    kerf: 2,
    process: 'plasma' as 'plasma' | 'oxicorte' | 'both',
    material: 'A36',
    operador: '',
    turno: '1',
    aprovadorQA: '',
    validacaoQA: false
  });

  const handleCreateProject = () => {
    const newProject: SheetProject = {
      id: Date.now().toString(),
      name: formData.name,
      projectNumber: formData.projectNumber,
      client: formData.client,
      obra: formData.obra,
      lista: formData.lista,
      revisao: formData.revisao,
      sheetWidth: formData.sheetWidth,
      sheetHeight: formData.sheetHeight,
      thickness: formData.thickness,
      kerf: formData.kerf,
      process: formData.process,
      material: formData.material,
      operador: formData.operador,
      turno: formData.turno,
      aprovadorQA: formData.aprovadorQA,
      validacaoQA: true,
      date: new Date().toISOString(),
    };
    setProject(newProject);
  };

  const canCreateProject = formData.name && formData.projectNumber && formData.obra && formData.operador;

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Square className="w-5 h-5" />
          Criar Projeto - Corte de Chapas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Projeto</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Estrutura Galpão A"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="projectNumber">Número do Projeto</Label>
            <Input
              id="projectNumber"
              value={formData.projectNumber}
              onChange={(e) => setFormData({ ...formData, projectNumber: e.target.value })}
              placeholder="Ex: GMX-2024-001"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="obra">Obra</Label>
            <Input
              id="obra"
              value={formData.obra}
              onChange={(e) => setFormData({ ...formData, obra: e.target.value })}
              placeholder="Ex: Galpão Industrial"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sheetWidth">Largura Chapa (mm)</Label>
            <Input
              id="sheetWidth"
              type="number"
              value={formData.sheetWidth}
              onChange={(e) => setFormData({ ...formData, sheetWidth: parseInt(e.target.value) || 0 })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sheetHeight">Altura Chapa (mm)</Label>
            <Input
              id="sheetHeight"
              type="number"
              value={formData.sheetHeight}
              onChange={(e) => setFormData({ ...formData, sheetHeight: parseInt(e.target.value) || 0 })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="thickness">Espessura (mm)</Label>
            <Input
              id="thickness"
              type="number"
              value={formData.thickness}
              onChange={(e) => setFormData({ ...formData, thickness: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="process">Processo de Corte</Label>
            <Select value={formData.process} onValueChange={(value: 'plasma' | 'oxicorte' | 'both') => 
              setFormData({ ...formData, process: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plasma">Plasma</SelectItem>
                <SelectItem value="oxicorte">Oxicorte</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Select value={formData.material} onValueChange={(value) => 
              setFormData({ ...formData, material: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A36">A36</SelectItem>
                <SelectItem value="A572">A572</SelectItem>
                <SelectItem value="A514">A514</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="kerf">Kerf (mm)</Label>
            <Input
              id="kerf"
              type="number"
              step="0.1"
              value={formData.kerf}
              onChange={(e) => setFormData({ ...formData, kerf: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="operador">Operador</Label>
            <Input
              id="operador"
              value={formData.operador}
              onChange={(e) => setFormData({ ...formData, operador: e.target.value })}
              placeholder="Nome do operador"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="turno">Turno</Label>
            <Select value={formData.turno} onValueChange={(value) => 
              setFormData({ ...formData, turno: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1º Turno</SelectItem>
                <SelectItem value="2">2º Turno</SelectItem>
                <SelectItem value="3">3º Turno</SelectItem>
                <SelectItem value="Central">Turno Central</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            onClick={handleCreateProject}
            disabled={!canCreateProject}
            className="px-8 py-3 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
            size="lg"
          >
            <Save className="w-5 h-5 mr-2" />
            Criar Projeto
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
