import { describe, it, expect } from 'vitest';
import { FileParsingService } from '@/components/file-upload/FileParsingService';

describe('FileParsingService', () => {
  describe('parseInventorReport', () => {
    const sampleInventorContent = `Projeto: MANGOTTEAUX – FORNO HTM01 – CALDEIRARIA
Código: 109
Módulo: 01
Lista Principal: Projeto - MB-USB-HTM1-001-1001

| Item | Módulo | Projeto Número       | Área  | Qtde | Descrição                | Material  | Dimensão / Modelo | Peso Unit. (kg) | Peso Total (kg) | Observação           |
| ---- | ------ | -------------------- | ----- | ---- | ------------------------ | --------- | ----------------- | --------------- | --------------- | -------------------- |
| 1    | 01     | MB-USB-HTM1-001-1001 | Geral | 1    | Caldeiraria Módulo 01    | SOLDADO   | —                 | 1747,2          | 1747,2          | MB-USB-HTM1-001-1002 |
| 2    | 01     | MB-USB-HTM1-001-1001 | Geral | 2    | Perfil W150 x 18,0       | ASTM A572 | 3150              | 57,7            | 115,4           | MB-USB-HTM1-001-1013 |
| 3    | 01     | MB-USB-HTM1-001-1001 | Geral | 1    | Quadro 01                | SOLDADO   | —                 | 209,7           | 209,7           | MB-USB-HTM1-001-1014 |
| 4    | 01     | MB-USB-HTM1-001-1001 | Geral | 2    | Chapa 6,4                | ASTM A36  | 101,6 × 3140      | 15,9            | 31,8            | —                    |
| 5    | 01     | MB-USB-HTM1-001-1001 | Geral | 16   | DIN 126 – 13,5           | AÇO       | —                 | 0,0             | 1,0             | —                    |
| 6    | 01     | MB-USB-HTM1-001-1001 | Geral | 16   | DIN 934 – M12            | C.L 12    | —                 | 0,0             | 0,3             | —                    |
| 7    | 01     | MB-USB-HTM1-001-1001 | Geral | 1    | Perfil U 6Pol. (3º Alma) | ASTM A572 | 1677              | 32,4            | 32,4            | MB-USB-HTM1-001-1023 |
`;

    it('deve importar perfis lineares corretamente', () => {
      const pieces = FileParsingService.parseInventorReport(sampleInventorContent);

      // Deve ter apenas 2 peças (Perfil W150 e Perfil U)
      expect(pieces.length).toBe(2);

      // Verificar primeira peça (Perfil W150)
      const perfilW = pieces.find(p => p.perfil?.includes('W150'));
      expect(perfilW).toBeDefined();
      expect(perfilW!.length).toBe(3150);
      expect(perfilW!.quantity).toBe(2);
      expect(perfilW!.material).toBe('ASTM A572');

      // Verificar segunda peça (Perfil U)
      const perfilU = pieces.find(p => p.perfil?.includes('U 6Pol'));
      expect(perfilU).toBeDefined();
      expect(perfilU!.length).toBe(1677);
      expect(perfilU!.quantity).toBe(1);
    });

    it('deve ignorar itens com material SOLDADO', () => {
      const pieces = FileParsingService.parseInventorReport(sampleInventorContent);

      // Não deve conter itens SOLDADO
      const soldados = pieces.filter(p => p.material?.toUpperCase() === 'SOLDADO');
      expect(soldados.length).toBe(0);
    });

    it('deve ignorar parafusos/arruelas DIN', () => {
      const pieces = FileParsingService.parseInventorReport(sampleInventorContent);

      // Não deve conter itens DIN
      const dins = pieces.filter(p => p.perfil?.includes('DIN'));
      expect(dins.length).toBe(0);
    });

    it('deve ignorar itens com múltiplas dimensões (chapas)', () => {
      const pieces = FileParsingService.parseInventorReport(sampleInventorContent);

      // Não deve conter chapas (têm 2 dimensões separadas por ×)
      const chapas = pieces.filter(p => p.perfil?.toLowerCase().includes('chapa'));
      expect(chapas.length).toBe(0);
    });

    it('deve ignorar itens com material C.L (classe de resistência)', () => {
      const pieces = FileParsingService.parseInventorReport(sampleInventorContent);

      // Não deve conter itens com material C.L
      const classeLote = pieces.filter(p => p.material?.includes('C.L'));
      expect(classeLote.length).toBe(0);
    });

    it('deve extrair módulo como fase', () => {
      const pieces = FileParsingService.parseInventorReport(sampleInventorContent);

      // Todas as peças devem ter fase = módulo
      pieces.forEach(p => {
        expect(p.fase).toBe('01');
      });
    });

    it('deve extrair projeto número como tag', () => {
      const pieces = FileParsingService.parseInventorReport(sampleInventorContent);

      // Todas as peças devem ter tag = projeto número
      pieces.forEach(p => {
        expect(p.tag).toBe('MB-USB-HTM1-001-1001');
      });
    });

    it('deve lançar erro se nenhuma peça válida for encontrada', () => {
      const contentSemPecas = `Projeto: Teste
Módulo: 01

| Item | Módulo | Projeto Número | Área | Qtde | Descrição | Material | Dimensão / Modelo | Peso Unit. | Peso Total | Observação |
| ---- | ------ | -------------- | ---- | ---- | --------- | -------- | ----------------- | ---------- | ---------- | ---------- |
| 1    | 01     | TESTE-001      | Geral| 1    | Conjunto  | SOLDADO  | —                 | 100,0      | 100,0      | —          |
`;

      expect(() => FileParsingService.parseInventorReport(contentSemPecas)).toThrow(
        'Nenhuma peça linear válida foi encontrada'
      );
    });

    it('deve validar range de comprimento (100-50000mm)', () => {
      const contentComComprimentoInvalido = `Projeto: Teste
Módulo: 01

| Item | Módulo | Projeto Número | Área | Qtde | Descrição | Material | Dimensão / Modelo | Peso Unit. | Peso Total | Observação |
| ---- | ------ | -------------- | ---- | ---- | --------- | -------- | ----------------- | ---------- | ---------- | ---------- |
| 1    | 01     | TESTE-001      | Geral| 1    | Perfil    | ASTM A36 | 50                | 10,0       | 10,0       | —          |
| 2    | 01     | TESTE-001      | Geral| 1    | Perfil    | ASTM A36 | 60000             | 100,0      | 100,0      | —          |
| 3    | 01     | TESTE-001      | Geral| 1    | Perfil OK | ASTM A36 | 2000              | 20,0       | 20,0       | —          |
`;

      const pieces = FileParsingService.parseInventorReport(contentComComprimentoInvalido);

      // Deve ter apenas 1 peça válida (2000mm)
      expect(pieces.length).toBe(1);
      expect(pieces[0].length).toBe(2000);
    });

    it('deve normalizar perfis com x e × para o mesmo formato', () => {
      const contentComVariacoes = `Projeto: Teste
Módulo: 01

| Item | Módulo | Projeto Número | Área | Qtde | Descrição          | Material  | Dimensão / Modelo | Peso Unit. | Peso Total | Observação |
| ---- | ------ | -------------- | ---- | ---- | ------------------ | --------- | ----------------- | ---------- | ---------- | ---------- |
| 1    | 01     | TESTE-001      | Geral| 1    | Perfil W150 x 18,0 | ASTM A572 | 3000              | 50,0       | 50,0       | —          |
| 2    | 01     | TESTE-001      | Geral| 1    | Perfil W150 × 18,0 | ASTM A572 | 2500              | 45,0       | 45,0       | —          |
| 3    | 01     | TESTE-001      | Geral| 1    | Perfil W150× 18,0  | ASTM A572 | 2000              | 40,0       | 40,0       | —          |
`;

      const pieces = FileParsingService.parseInventorReport(contentComVariacoes);

      // Deve ter 3 peças
      expect(pieces.length).toBe(3);

      // Todos os perfis devem estar normalizados para o mesmo formato
      const perfisUnicos = [...new Set(pieces.map(p => p.perfil))];
      expect(perfisUnicos.length).toBe(1);
      expect(perfisUnicos[0]).toBe('Perfil W150x18,0');
    });
  });

  describe('isInventorFile', () => {
    it('deve detectar arquivo Inventor corretamente', () => {
      const inventorContent = `| Item | Módulo | Projeto Número | Área | Qtde | Descrição | Material | Dimensão / Modelo | Peso Unit. (kg) | Peso Total (kg) |`;

      expect(FileParsingService.isInventorFile(inventorContent)).toBe(true);
    });

    it('deve retornar false para arquivo Tekla', () => {
      const teklaContent = `MARCA;ITEM;QT.;DESCRIÇÃO;MATERIAL;PESO
CE-17;189;1;W200X35.9X10186;A572-50;365.7`;

      expect(FileParsingService.isInventorFile(teklaContent)).toBe(false);
    });
  });
});
