
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, CheckCircle } from "lucide-react";
import { InspetorQA } from "@/services/interfaces";

interface ValidationStepProps {
  formData: any;
  setFormData: (data: any) => void;
  inspetoresQA: InspetorQA[];
}

export const ValidationStep = ({
  formData,
  setFormData,
  inspetoresQA,
}: ValidationStepProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Etapa 3: Controle de Qualidade
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 font-medium">
            <Shield className="w-4 h-4" />
            Aprovador QA *
          </Label>
          <Select
            value={formData.aprovadorQA}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, aprovadorQA: value }))
            }
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione o inspetor responsável" />
            </SelectTrigger>
            <SelectContent>
              {inspetoresQA.filter(inspetor => inspetor.id && inspetor.id.trim() !== '').map((inspetor) => (
                <SelectItem key={inspetor.id} value={inspetor.id}>
                  {inspetor.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="validacaoQA"
              checked={formData.validacaoQA}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, validacaoQA: !!checked }))
              }
              className="w-6 h-6"
            />
            <Label
              htmlFor="validacaoQA"
              className="text-lg font-medium flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5 text-green-600" />✅ Tarefa
              validada pelo QA *
            </Label>
          </div>
          <p className="text-sm text-yellow-700 mt-2 ml-9">
            Esta validação é obrigatória para liberar o envio das sobras ao
            estoque.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
