
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Project } from '@/pages/Index';
import { Building, User, MapPin, Ruler, FileText, GitBranch, Package } from 'lucide-react';

interface ProjectSelectorProps {
  project: Project | null;
  setProject: (project: Project) => void;
  barLength: number;
  setBarLength: (length: number) => void;
}

export const ProjectSelector = ({ project, setProject, barLength, setBarLength }: ProjectSelectorProps) => {
  const [formData, setFormData] = useState({
    obra: '',
    client: '',
    projectName: '',
    lista: 'LISTA 01',
    revisao: 'REV-00',
    tipoMaterial: ''
  });

  const obras = ['Obra Industrial A', 'Complexo Residencial B', 'Fábrica XYZ', 'Shopping Center ABC'];
  const clients = ['Construtora Alpha', 'Engenharia Beta', 'Indústria Gamma', 'Metalúrgica Delta'];
  const tiposMaterial = [
    'Perfil W 150x13',
    'Perfil UE 100x50x17x3',
    'Perfil U 200x75x20x3',
    'Perfil L 50x50x5',
    'Perfil T 100x50x8',
    'Barra Redonda Ø 20mm',
    'Barra Quadrada 25x25mm'
  ];

  const handleCreateProject = () => {
    if (formData.obra && formData.client && formData.projectName && formData.lista && formData.revisao && formData.tipoMaterial) {
      const newProject: Project = {
        id: Date.now().toString(),
        name: formData.projectName,
        client: formData.client,
        obra: formData.obra,
        lista: formData.lista,
        revisao: formData.revisao,
        tipoMaterial: formData.tipoMaterial,
        date: new Date().toISOString()
      };
      setProject(newProject);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Configuração do Projeto
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Obra
            </Label>
            <Select value={formData.obra} onValueChange={(value) => setFormData(prev => ({ ...prev, obra: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a obra" />
              </SelectTrigger>
              <SelectContent>
                {obras.map(obra => (
                  <SelectItem key={obra} value={obra}>{obra}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Cliente
            </Label>
            <Select value={formData.client} onValueChange={(value) => setFormData(prev => ({ ...prev, client: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client} value={client}>{client}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Nome do Projeto</Label>
          <Input
            placeholder="Digite o nome do projeto"
            value={formData.projectName}
            onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Tipo de Material
          </Label>
          <Select value={formData.tipoMaterial} onValueChange={(value) => setFormData(prev => ({ ...prev, tipoMaterial: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de material" />
            </SelectTrigger>
            <SelectContent>
              {tiposMaterial.map(tipo => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Lista
            </Label>
            <Input
              placeholder="Ex: LISTA 01"
              value={formData.lista}
              onChange={(e) => setFormData(prev => ({ ...prev, lista: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Revisão
            </Label>
            <Input
              placeholder="Ex: REV-00"
              value={formData.revisao}
              onChange={(e) => setFormData(prev => ({ ...prev, revisao: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Comprimento da Barra (mm)
          </Label>
          <Select value={barLength.toString()} onValueChange={(value) => setBarLength(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6000">6000mm (6 metros)</SelectItem>
              <SelectItem value="12000">12000mm (12 metros)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleCreateProject}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          disabled={!formData.obra || !formData.client || !formData.projectName || !formData.lista || !formData.revisao || !formData.tipoMaterial}
        >
          Criar Projeto
        </Button>

        {project && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              <strong>Projeto Ativo:</strong> {project.name} - {project.client}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {project.lista} | {project.revisao} | {project.tipoMaterial}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
