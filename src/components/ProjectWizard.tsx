import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Project } from '@/types/project';
import { IdentificationStep } from "./wizard/IdentificationStep";
import { ProductionStep } from "./wizard/ProductionStep";
import { ValidationStep } from "./wizard/ValidationStep";
import { StorageStep } from "./wizard/StorageStep";
import { ChevronLeft, ChevronRight, Save, QrCode } from "lucide-react";
import {
  Cliente,
  InspetorQA,
  Material,
  Obra,
  Operador,
} from "@/services/interfaces";
import { obraService } from "@/services/entities/ObraService";
import {
  clienteService,
  inspetorService,
  materialService,
  operadorService,
} from "@/services";

interface ProjectWizardProps {
  project: Project | null;
  setProject: (project: Project) => void;
  barLength: number;
  setBarLength: (length: number) => void;
}

export const ProjectWizard = ({
  project,
  setProject,
  barLength,
  setBarLength,
}: ProjectWizardProps) => {
  const [obras, setObras] = useState<Obra[]>([]);
  const [clientes, setClieintes] = useState<Cliente[]>([]);
  const [tiposMaterial, setTiposMaterial] = useState<Material[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [inspetoresQA, setInspetoresQA] = useState<InspetorQA[]>([]); // Assuming inspetoresQA is a list of strings
  const [currentStep, setCurrentStep] = useState(1);
  const [showQRCode, setShowQRCode] = useState(false);
  const [formData, setFormData] = useState({
    obra: "",
    client: "",
    projectName: "",
    projectNumber: "",
    lista: "LISTA 01",
    revisao: "REV-00",
    tipoMaterial: "",
    operador: "",
    turno: "1",
    aprovadorQA: "",
    validacaoQA: false,
    enviarSobrasEstoque: true,
  });

  useEffect(() => {
    const carregarObras = async () => {
      const response = await obraService.getAll();
      if (response.success) {
        setObras(response.data);
      } else {
        console.error(response.error);
      }
    };

    const carregarClientes = async () => {
      const response = await clienteService.getAll(); // Assuming a similar service for clientes
      if (response.success) {
        setClieintes(response.data);
      } else {
        console.error(response.error);
      }
    };

    const carregarTiposMaterial = async () => {
      // Assuming you have a service to fetch material types
      const response = await materialService.getAll(); // Replace with your actual API endpoint
      if (response.data) {
        setTiposMaterial(response.data);
      } else {
        console.error("Erro ao carregar tipos de material");
      }
    };

    const carregarOperadores = async () => {
      // Assuming you have a service to fetch operadores
      const response = await operadorService.getAll(); // Replace with your actual API endpoint
      if (response.data) {
        setOperadores(response.data);
      } else {
        console.error("Erro ao carregar operadores");
      }
    };

    const carregarInspetoresQA = async () => {
      // Assuming you have a service to fetch QA inspectors
      const response = await inspetorService.getAll(); // Replace with your actual API endpoint
      if (response.data) {
        setInspetoresQA(response.data);
      } else {
        console.error("Erro ao carregar inspetores QA");
      }
    };

    carregarInspetoresQA();
    carregarOperadores();
    carregarTiposMaterial();
    carregarClientes();
    carregarObras();
  }, []);

  const generateQRCode = (projectId: string, lista: string) => {
    const qrData = `${window.location.origin}/lista/${projectId}/${lista}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      qrData
    )}`;
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return (
          formData.obra &&
          formData.client &&
          formData.projectName &&
          formData.projectNumber &&
          formData.lista &&
          formData.revisao
        );
      case 2:
        return formData.tipoMaterial && formData.operador && formData.turno;
      case 3:
        return formData.aprovadorQA && formData.validacaoQA;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleCreateProject = () => {
    const requiredFields = [
      "obra",
      "client",
      "projectName",
      "projectNumber",
      "lista",
      "revisao",
      "tipoMaterial",
      "operador",
      "aprovadorQA",
    ];
    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData]
    );

    if (missingFields.length > 0) {
      alert(`Campos obrigatórios não preenchidos: ${missingFields.join(", ")}`);
      return;
    }

    if (!formData.validacaoQA) {
      alert("A validação QA é obrigatória para criar o projeto.");
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
      date: new Date().toISOString(),
    };
    setProject(newProject);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <IdentificationStep
            formData={formData}
            setFormData={setFormData}
            obras={obras}
            clientes={clientes}
          />
        );
      case 2:
        return (
          <ProductionStep
            formData={formData}
            setFormData={setFormData}
            tiposMaterial={tiposMaterial}
            operadores={operadores}
            barLength={barLength}
            setBarLength={setBarLength}
          />
        );
      case 3:
        return (
          <ValidationStep
            formData={formData}
            setFormData={setFormData}
            inspetoresQA={inspetoresQA}
          />
        );
      case 4:
        return <StorageStep formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  const steps = [
    { number: 1, title: "Identificação", completed: validateStep(1) },
    { number: 2, title: "Produção", completed: validateStep(2) },
    { number: 3, title: "Validação", completed: validateStep(3) },
    { number: 4, title: "Armazenamento", completed: validateStep(4) },
  ];

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.number === currentStep
                      ? "bg-blue-600 text-white"
                      : step.completed
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step.completed && step.number !== currentStep
                    ? "✓"
                    : step.number}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    step.number === currentStep
                      ? "font-semibold text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-4 ${
                      step.completed ? "bg-green-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      {renderStep()}

      {/* Navigation */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                disabled={!validateStep(currentStep)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleCreateProject}
                disabled={!validateStep(currentStep)}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Save className="w-4 h-4" />
                Criar Projeto
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Summary */}
      {project && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              <strong>✅ Projeto Criado:</strong> {project.name} (
              {project.projectNumber})
            </p>
            <p className="text-xs text-green-600 mt-1">
              {project.lista} | {project.revisao} | {project.tipoMaterial}
            </p>
            <p className="text-xs text-green-600">
              Operador: {project.operador} |{" "}
              {project.turno === "Central"
                ? "Turno Central"
                : `${project.turno}º Turno`}
            </p>
          </div>

          {/* QR Code */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <QrCode className="w-6 h-6 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">
                  QR Code da Lista Gerado
                </h4>
                <p className="text-sm text-blue-700">
                  Escaneie para acessar o manifesto digital
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQRCode(!showQRCode)}
                className="ml-auto"
              >
                {showQRCode ? "Ocultar" : "Mostrar"} QR
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
    </div>
  );
};
