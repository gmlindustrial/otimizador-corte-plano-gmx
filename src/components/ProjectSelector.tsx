
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Project } from '@/pages/Index';
import { Building, User, MapPin, Ruler, FileText, GitBranch, Package, Users, Clock, Shield, QrCode } from 'lucide-react';

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
    projectNumber: '',
    lista: 'LISTA 01',
    revisao: 'REV-00',
    tipoMaterial: '',
    operador: '',
    turno: '1',
    aprovadorQA: '',
    validacaoQA: false,
    enviarSobrasEstoque: true
  });

  const [showNewOperatorInput, setShowNewOperatorInput] = useState(false);
  const [newOperator, setNewOperator] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);

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
  
  const operadores = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira'];
  const inspetoresQA = ['Carlos Inspetor', 'Lucia Qualidade', 'Roberto QA', 'Sandra Controle'];

  const handleAddNewOperator = () => {
    if (newOperator.trim()) {
      setFormData(prev => ({ ...prev, operador: newOperator.trim() }));
      setNewOperator('');
      setShowNewOperatorInput(false);
    }
  };

  const generateQRCode = (projectId: string, lista: string) => {
    const qrData = `${window.location.origin}/lista/${projectId}/${lista}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  };

  const handleCreateProject = () => {
    const requiredFields = ['obra', 'client', 'projectName', 'projectNumber', 'lista', 'revisao', 'tipoMaterial', 'operador', 'aprovadorQA'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      alert(`Campos obrigatórios não preenchidos: ${missingFields.join(', ')}`);
      return;
    }

    if (!formData.validacaoQA) {
      alert('A validação QA é obrigatória para criar o projeto.');
      return;
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: formData.projectName,
      projectNumber: formData.projectNumber,
      client: formData.client,
      obra: formData.obra,
      lista: formData.lista,
      revisao: formData.revisao,
      tipoMaterial: formData.tipoMaterial,
      operador: formData.operador,
      turno: formData.turno,
      aprovadorQA: formData.aprovadorQA,
      validacaoQA: formData.validacaoQA,
      enviarSobrasEstoque: formData.enviarSobrasEstoque,
      qrCode: generateQRCode(Date.now().toString(), formData.lista),
      date: new Date().toISOString()
    };
    setProject(newProject);
    setShowQRCode(true);
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
              Obra *
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
              Cliente *
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

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome do Projeto *</Label>
            <Input
              placeholder="Digite o nome do projeto"
              value={formData.projectName}
              onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Nº do Projeto *</Label>
            <Input
              placeholder="Ex: PRJ-2024-001"
              value={formData.projectNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, projectNumber: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Tipo de Material *
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
              Lista *
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
              Revisão *
            </Label>
            <Input
              placeholder="Ex: REV-00"
              value={formData.revisao}
              onChange={(e) => setFormData(prev => ({ ...prev, revisao: e.target.value }))}
            />
          </div>
        </div>

        {/* Novos Campos Obrigatórios */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-4">Controle Operacional</h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
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
                  <SelectTrigger>
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
                  />
                  <Button onClick={handleAddNewOperator} size="sm">+</Button>
                  <Button variant="outline" onClick={() => setShowNewOperatorInput(false)} size="sm">×</Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Aprovador QA *
              </Label>
              <Select value={formData.aprovadorQA} onValueChange={(value) => setFormData(prev => ({ ...prev, aprovadorQA: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o inspetor" />
                </SelectTrigger>
                <SelectContent>
                  {inspetoresQA.map(inspetor => (
                    <SelectItem key={inspetor} value={inspetor}>{inspetor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Turno *
            </Label>
            <div className="flex gap-4">
              {['1', '2', 'Central'].map((turno) => (
                <label key={turno} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="turno"
                    value={turno}
                    checked={formData.turno === turno}
                    onChange={(e) => setFormData(prev => ({ ...prev, turno: e.target.value }))}
                    className="w-4 h-4"
                  />
                  <span>{turno === 'Central' ? 'Turno Central' : `${turno}º Turno`}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="validacaoQA"
              checked={formData.validacaoQA}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, validacaoQA: !!checked }))}
            />
            <Label htmlFor="validacaoQA" className="text-sm">
              ✅ Tarefa validada pelo QA *
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enviarSobras"
              checked={formData.enviarSobrasEstoque}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enviarSobrasEstoque: !!checked }))}
            />
            <Label htmlFor="enviarSobras" className="text-sm">
              Enviar sobras automaticamente para o estoque
            </Label>
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
        >
          Criar Projeto
        </Button>

        {project && (
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>Projeto Ativo:</strong> {project.name} ({project.projectNumber})
              </p>
              <p className="text-xs text-green-600 mt-1">
                {project.lista} | {project.revisao} | {project.tipoMaterial}
              </p>
              <p className="text-xs text-green-600">
                Operador: {project.operador} | {project.turno === 'Central' ? 'Turno Central' : `${project.turno}º Turno`}
              </p>
            </div>

            {/* QR Code */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <QrCode className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">QR Code da Lista</h4>
                  <p className="text-sm text-blue-700">Escaneie para acessar o manifesto digital</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQRCode(!showQRCode)}
                >
                  {showQRCode ? 'Ocultar' : 'Mostrar'} QR
                </Button>
              </div>
              
              {showQRCode && (
                <div className="mt-4 text-center">
                  <img 
                    src={project.qrCode} 
                    alt="QR Code da Lista"
                    className="mx-auto border rounded"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Lista: {project.lista} | Projeto: {project.projectNumber}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
