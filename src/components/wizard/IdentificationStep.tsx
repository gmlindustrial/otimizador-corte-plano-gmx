
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, User, FileText } from 'lucide-react';

interface IdentificationStepProps {
  formData: any;
  setFormData: (data: any) => void;
  obras: string[];
  clients: string[];
}

export const IdentificationStep = ({ formData, setFormData, obras, clients }: IdentificationStepProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Etapa 1: Identificação do Projeto
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-medium">
              <Building className="w-4 h-4" />
              Obra *
            </Label>
            <Select value={formData.obra} onValueChange={(value) => setFormData(prev => ({ ...prev, obra: value }))}>
              <SelectTrigger className="h-12">
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
            <Label className="flex items-center gap-2 font-medium">
              <User className="w-4 h-4" />
              Cliente *
            </Label>
            <Select value={formData.client} onValueChange={(value) => setFormData(prev => ({ ...prev, client: value }))}>
              <SelectTrigger className="h-12">
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
            <Label className="font-medium">Nome do Projeto *</Label>
            <Input
              placeholder="Digite o nome do projeto"
              value={formData.projectName}
              onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Nº do Projeto *</Label>
            <Input
              placeholder="Ex: PRJ-2024-001"
              value={formData.projectNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, projectNumber: e.target.value }))}
              className="h-12"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-medium">
              <FileText className="w-4 h-4" />
              Lista *
            </Label>
            <Input
              placeholder="Ex: LISTA 01"
              value={formData.lista}
              onChange={(e) => setFormData(prev => ({ ...prev, lista: e.target.value }))}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Revisão *</Label>
            <Input
              placeholder="Ex: REV-00"
              value={formData.revisao}
              onChange={(e) => setFormData(prev => ({ ...prev, revisao: e.target.value }))}
              className="h-12"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
