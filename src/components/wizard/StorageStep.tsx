
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { QrCode, Warehouse, AlertCircle } from 'lucide-react';

interface StorageStepProps {
  formData: any;
  setFormData: (data: any) => void;
}

export const StorageStep = ({ formData, setFormData }: StorageStepProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Warehouse className="w-5 h-5" />
          Etapa 4: Gerenciamento de Estoque
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-lg font-medium flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-blue-600" />
                Enviar sobras automaticamente para o estoque?
              </Label>
              <p className="text-sm text-blue-700 mt-1">
                As sobras serão enviadas automaticamente após a validação QA
              </p>
            </div>
            <Switch
              checked={formData.enviarSobrasEstoque}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enviarSobrasEstoque: checked }))}
              className="scale-125"
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-center">
            <QrCode className="w-12 h-12 mx-auto text-gray-600 mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">QR Code da Lista</h4>
            <p className="text-sm text-gray-600 mb-3">
              Será gerado automaticamente após a criação do projeto
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <AlertCircle className="w-4 h-4" />
              <span>Para uso em conferência e rastreabilidade</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
