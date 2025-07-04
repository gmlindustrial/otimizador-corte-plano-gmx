
export interface Project {
  id: string;
  name: string;
  projectNumber: string;
  client: string;
  obra: string;
  lista: string;
  revisao: string;
  tipoMaterial: string;
  operador: string;
  turno: string;
  aprovadorQA: string;
  validacaoQA: boolean;
  enviarSobrasEstoque: boolean;
  qrCode?: string;
  date?: string;
}
