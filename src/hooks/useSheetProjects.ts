import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isUUID } from "@/lib/utils";
import { toast } from "sonner";
import type { SheetProject, SheetCutPiece } from "@/types/sheet";

export interface SheetProjectData {
  project: SheetProject;
  pieces: SheetCutPiece[];
}

export const useSheetProjects = () => {
  const [savedProjects, setSavedProjects] = useState<SheetProjectData[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper methods to find entity IDs by name with proper typing
  const findClienteIdByName = async (name: string): Promise<string | null> => {
    if (!name) return null;
    if (isUUID(name)) return name;
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id")
        .ilike("nome", name.trim())
        .maybeSingle();

      if (error || !data) return null;
      return data.id as string;
    } catch (error) {
      console.error(`Erro ao buscar ID de cliente:`, error);
      return null;
    }
  };

  const findObraIdByName = async (name: string): Promise<string | null> => {
    if (!name) return null;
    if (isUUID(name)) return name;
    try {
      const { data, error } = await supabase
        .from("obras")
        .select("id")
        .ilike("nome", name.trim())
        .maybeSingle();

      if (error || !data) return null;
      return data.id as string;
    } catch (error) {
      console.error(`Erro ao buscar ID de obra:`, error);
      return null;
    }
  };

  const findMaterialIdByType = async (type: string): Promise<string | null> => {
    if (!type) return null;
    if (isUUID(type)) return type;
    try {
      const { data, error } = await supabase
        .from("materiais")
        .select("id")
        .ilike("tipo", type.trim())
        .maybeSingle();

      if (error || !data) return null;
      return data.id as string;
    } catch (error) {
      console.error(`Erro ao buscar ID de material:`, error);
      return null;
    }
  };

  const findOperadorIdByName = async (name: string): Promise<string | null> => {
    if (!name) return null;
    if (isUUID(name)) return name;
    try {
      const { data, error } = await supabase
        .from("operadores")
        .select("id")
        .ilike("nome", name.trim())
        .maybeSingle();

      if (error || !data) return null;
      return data.id as string;
    } catch (error) {
      console.error(`Erro ao buscar ID de operador:`, error);
      return null;
    }
  };

  const findInspetorIdByName = async (name: string): Promise<string | null> => {
    if (!name) return null;
    if (isUUID(name)) return name;
    try {
      const { data, error } = await supabase
        .from("inspetores_qa")
        .select("id")
        .ilike("nome", name.trim())
        .maybeSingle();

      if (error || !data) return null;
      return data.id as string;
    } catch (error) {
      console.error(`Erro ao buscar ID de inspetor:`, error);
      return null;
    }
  };

  const saveProject = async (projectData: SheetProjectData) => {
    try {
      const { project, pieces } = projectData;

      // Buscar IDs das entidades pelos nomes
      const clienteId = await findClienteIdByName(project.client);
      const obraId = await findObraIdByName(project.obra);
      const materialId = await findMaterialIdByType(project.material);
      const operadorId = await findOperadorIdByName(project.operador);
      const inspetorId = await findInspetorIdByName(project.aprovadorQA);

      const insertData = {
        nome: project.name,
        numero_projeto: project.projectNumber,
        cliente_id: clienteId,
        obra_id: obraId,
        material_id: materialId,
        operador_id: operadorId,
        inspetor_id: inspetorId,
        turno: project.turno,
        lista: project.lista,
        revisao: project.revisao,
        validacao_qa: project.validacaoQA,
        qr_code: generateQRCode(project.id, project.lista),
        dados_projeto: JSON.parse(
          JSON.stringify({
            type: "sheet",
            client: project.client,
            obra: project.obra,
            sheetWidth: project.sheetWidth,
            sheetHeight: project.sheetHeight,
            thickness: project.thickness,
            kerf: project.kerf,
            process: project.process,
            material: project.material,
            operador: project.operador,
            aprovadorQA: project.aprovadorQA,
            pieces: pieces,
            originalProjectId: project.id,
          })
        ),
      };

      const { data, error } = await supabase
        .from("projetos")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      console.log("Projeto de chapas salvo com IDs mapeados:", data);
      toast.success("Projeto de chapas salvo com sucesso");
      await loadProjects();
      return data;
    } catch (error) {
      console.error("Erro ao salvar projeto de chapas:", error);
      toast.error("Erro ao salvar projeto de chapas");
      throw error;
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projetos")
        .select(
          `
          *,
          clientes:cliente_id(nome),
          obras:obra_id(nome)
        `
        )
        .eq("dados_projeto->>type", "sheet")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const convertedProjects = data
        .map(convertFromDatabase)
        .filter((project): project is SheetProjectData => project !== null);

      setSavedProjects(convertedProjects);
    } catch (error) {
      console.error("Erro ao carregar projetos de chapas:", error);
    } finally {
      setLoading(false);
    }
  };

  const convertFromDatabase = (dbProject: any): SheetProjectData | null => {
    try {
      const dadosProjeto = dbProject.dados_projeto;

      if (!dadosProjeto || dadosProjeto.type !== "sheet") {
        return null;
      }

      // Use foreign key relationships if available, fallback to JSON data
      const clientName = dbProject.clientes?.nome || dadosProjeto.client || "";
      const obraName = dbProject.obras?.nome || dadosProjeto.obra || "";
      const materialType =
        dbProject.materiais?.tipo || dadosProjeto.material || "";
      const operadorName =
        dbProject.operadores?.nome || dadosProjeto.operador || "";
      const inspetorName =
        dbProject.inspetores_qa?.nome || dadosProjeto.aprovadorQA || "";

      const project: SheetProject = {
        id: dadosProjeto.originalProjectId || dbProject.id,
        name: dbProject.nome,
        projectNumber: dbProject.numero_projeto,
        client: clientName,
        obra: obraName,
        lista: dbProject.lista,
        revisao: dbProject.revisao,
        sheetWidth: dadosProjeto.sheetWidth || 2550,
        sheetHeight: dadosProjeto.sheetHeight || 6000,
        thickness: dadosProjeto.thickness || 6,
        kerf: dadosProjeto.kerf || 2,
        process: dadosProjeto.process || "plasma",
        material: materialType,
        operador: operadorName,
        turno: dbProject.turno,
        aprovadorQA: inspetorName,
        validacaoQA: dbProject.validacao_qa,
        date: dbProject.created_at,
      };

      return {
        project,
        pieces: dadosProjeto.pieces || [],
      };
    } catch (error) {
      console.error("Erro ao converter projeto de chapas:", error);
      return null;
    }
  };

  const generateQRCode = (projectId: string, lista: string) => {
    const qrData = `${window.location.origin}/lista/${projectId}/${lista}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      qrData
    )}`;
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return {
    savedProjects,
    loading,
    saveProject,
    loadProjects,
  };
};
