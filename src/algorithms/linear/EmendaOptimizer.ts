import { supabase } from '@/integrations/supabase/client';
import type { 
  EmendaConfiguration, 
  PecaComEmenda, 
  SegmentoEmenda, 
  EmendaInfo,
  OptimizationPiece 
} from '@/types/project';
import type { LeftoverStockItem } from '@/lib/runLinearOptimization';

export interface EmendaOptimizationResult {
  pecasComEmenda: PecaComEmenda[];
  pecasNormais: OptimizationPiece[];
  estatisticas: {
    totalEmendasCriadas: number;
    pecasComEmendaObrigatoria: number;
    sobrasTotaisUtilizadas: number;
    economiaEstimada: number;
  };
  alertas: string[];
}

export class EmendaOptimizer {
  private config: EmendaConfiguration;
  private leftovers: LeftoverStockItem[];
  private tamanhoMaximoBarra: number;

  constructor(config: EmendaConfiguration, leftovers: LeftoverStockItem[], tamanhoMaximoBarra: number) {
    this.config = config;
    this.leftovers = leftovers;
    this.tamanhoMaximoBarra = tamanhoMaximoBarra;
  }

  /**
   * Método principal para processar peças e criar emendas quando necessário
   */
  async processPieces(pieces: OptimizationPiece[]): Promise<EmendaOptimizationResult> {
    console.log('=== INICIANDO PROCESSAMENTO DE EMENDAS ===');
    console.log('Configuração:', this.config);
    console.log('Peças a processar:', pieces.length);
    console.log('Sobras disponíveis:', this.leftovers.length);

    const result: EmendaOptimizationResult = {
      pecasComEmenda: [],
      pecasNormais: [],
      estatisticas: {
        totalEmendasCriadas: 0,
        pecasComEmendaObrigatoria: 0,
        sobrasTotaisUtilizadas: 0,
        economiaEstimada: 0
      },
      alertas: []
    };

    // Fase 1: Identificar peças que precisam de emenda obrigatória
    const { pecasComEmendaObrigatoria, pecasNormais } = this.identificarEmendasObrigatorias(pieces);
    
    if (pecasComEmendaObrigatoria.length > 0) {
      result.alertas.push(
        `${pecasComEmendaObrigatoria.length} peça(s) maior(es) que ${this.tamanhoMaximoBarra}mm requer(em) emenda obrigatória`
      );
      result.estatisticas.pecasComEmendaObrigatoria = pecasComEmendaObrigatoria.length;
    }

    // Fase 2: Processar emendas obrigatórias
    for (const peca of pecasComEmendaObrigatoria) {
      try {
        const pecaComEmenda = await this.criarEmendaObrigatoria(peca);
        result.pecasComEmenda.push(pecaComEmenda);
        result.estatisticas.totalEmendasCriadas += pecaComEmenda.emendas.length;
      } catch (error) {
        console.error(`Erro ao criar emenda obrigatória para peça ${peca.tag}:`, error);
        result.alertas.push(`Erro ao processar emenda para peça ${peca.tag || peca.id}`);
      }
    }

    // Fase 3: Verificar se emendas opcionais estão habilitadas
    if (this.config.permitirEmendas && this.config.emendaObrigatoria === false) {
      // Tentar emendas opcionais para melhor aproveitamento
      const pecasParaEmendaOpcional = pecasNormais.filter(p => 
        p.length < this.tamanhoMaximoBarra && 
        p.length >= this.config.tamanhoMinimoSobra
      );

      for (const peca of pecasParaEmendaOpcional) {
        // Apenas sobras do mesmo perfil (nunca usar outros perfis)
        const sobrasDisponiveis = this.buscarSobrasCompatiiveis(peca, true);
        if (sobrasDisponiveis.length > 0) {
          try {
            const pecaComEmenda = await this.criarEmendaOpcional(peca, sobrasDisponiveis);
            if (pecaComEmenda) {
              result.pecasComEmenda.push(pecaComEmenda);
              result.estatisticas.totalEmendasCriadas += pecaComEmenda.emendas.length;
              // Remover das peças normais
              const index = result.pecasNormais.findIndex(p => p.id === peca.id);
              if (index > -1) result.pecasNormais.splice(index, 1);
            }
          } catch (error) {
            console.error(`Erro ao criar emenda opcional para peça ${peca.tag}:`, error);
          }
        }
      }
    }

    // Adicionar peças que não precisam de emenda
    result.pecasNormais.push(...pecasNormais.filter(p => 
      !result.pecasComEmenda.some(pe => pe.id === p.id)
    ));

    // Calcular estatísticas finais
    result.estatisticas.sobrasTotaisUtilizadas = this.calcularSobrasUtilizadas(result.pecasComEmenda);
    result.estatisticas.economiaEstimada = this.calcularEconomiaEstimada(result.pecasComEmenda);

    console.log('=== RESULTADO DO PROCESSAMENTO DE EMENDAS ===');
    console.log('Peças com emenda:', result.pecasComEmenda.length);
    console.log('Peças normais:', result.pecasNormais.length);
    console.log('Total de emendas criadas:', result.estatisticas.totalEmendasCriadas);

    return result;
  }

  /**
   * Identificar peças que obrigatoriamente precisam de emenda
   */
  private identificarEmendasObrigatorias(pieces: OptimizationPiece[]): {
    pecasComEmendaObrigatoria: OptimizationPiece[];
    pecasNormais: OptimizationPiece[];
  } {
    const pecasComEmendaObrigatoria: OptimizationPiece[] = [];
    const pecasNormais: OptimizationPiece[] = [];

    pieces.forEach(peca => {
      if (peca.length > this.tamanhoMaximoBarra) {
        pecasComEmendaObrigatoria.push(peca);
      } else {
        pecasNormais.push(peca);
      }
    });

    return { pecasComEmendaObrigatoria, pecasNormais };
  }

  /**
   * Criar emenda obrigatória para peça maior que a barra máxima
   */
  private async criarEmendaObrigatoria(peca: OptimizationPiece): Promise<PecaComEmenda> {
    console.log(`Criando emenda obrigatória para peça ${peca.tag} (${peca.length}mm)`);

    const segmentos: SegmentoEmenda[] = [];
    const emendas: EmendaInfo[] = [];
    let comprimentoRestante = peca.length;
    let posicaoEmenda = 0;

    // Buscar sobras do mesmo perfil primeiro
    const sobrasDoMesmoPerfil = this.buscarSobrasCompatiiveis(peca, true);
    
    // Usar sobras grandes primeiro
    for (const sobra of sobrasDoMesmoPerfil.sort((a, b) => b.comprimento - a.comprimento)) {
      if (comprimentoRestante <= 0) break;
      if (emendas.length >= this.config.maxEmendasPorPeca) break;

      const comprimentoSegmento = Math.min(sobra.comprimento, comprimentoRestante);
      
      segmentos.push({
        comprimento: comprimentoSegmento,
        origemTipo: 'sobra',
        origemId: sobra.id,
        perfilId: sobra.id_perfis_materiais || peca.perfilId || '',
        posicaoNaBarra: 0,
        estoqueId: sobra.id
      });

      comprimentoRestante -= comprimentoSegmento;
      
      if (comprimentoRestante > 0) {
        posicaoEmenda += comprimentoSegmento;
        emendas.push({
          posicao: posicaoEmenda,
          qualidadeAfetada: true,
          inspecaoObrigatoria: true
        });
      }
    }

    // Se ainda restou comprimento, usar nova barra
    if (comprimentoRestante > 0) {
      segmentos.push({
        comprimento: comprimentoRestante,
        origemTipo: 'nova_barra',
        origemId: `new-bar-${Date.now()}`,
        perfilId: peca.perfilId || '',
        posicaoNaBarra: 0
      });

      if (segmentos.length > 1) {
        posicaoEmenda += segmentos[segmentos.length - 2].comprimento;
        emendas.push({
          posicao: posicaoEmenda,
          qualidadeAfetada: true,
          inspecaoObrigatoria: true
        });
      }
    }

    return {
      id: peca.id,
      comprimentoOriginal: peca.length,
      tag: peca.tag,
      posicao: peca.posicao,
      conjunto: peca.conjunto,
      perfil: peca.perfil,
      peso: peca.peso,
      perfilId: peca.perfilId,
      quantidade: peca.quantity,
      segmentos,
      emendas,
      statusQualidade: 'pendente',
      temEmenda: true,
      observacoes: `Emenda obrigatória - peça maior que barra máxima (${this.tamanhoMaximoBarra}mm)`
    };
  }

  /**
   * Criar emenda opcional para aproveitar sobras
   */
  private async criarEmendaOpcional(peca: OptimizationPiece, sobrasDisponiveis: LeftoverStockItem[]): Promise<PecaComEmenda | null> {
    // Verificar se vale a pena fazer emenda
    const melhorCombinacao = this.encontrarMelhorCombinacaoSobras(peca, sobrasDisponiveis);
    
    if (!melhorCombinacao || melhorCombinacao.desperdicio > (peca.length * 0.3)) {
      return null; // Não vale a pena
    }

    const segmentos: SegmentoEmenda[] = [];
    const emendas: EmendaInfo[] = [];
    let posicaoEmenda = 0;

    melhorCombinacao.sobras.forEach((sobra, index) => {
      const comprimentoSegmento = Math.min(sobra.comprimento, melhorCombinacao.comprimentoNecessario);
      
      segmentos.push({
        comprimento: comprimentoSegmento,
        origemTipo: 'sobra',
        origemId: sobra.id,
        perfilId: sobra.id_perfis_materiais || peca.perfilId || '',
        posicaoNaBarra: 0,
        estoqueId: sobra.id
      });

      if (index < melhorCombinacao.sobras.length - 1) {
        posicaoEmenda += comprimentoSegmento;
        emendas.push({
          posicao: posicaoEmenda,
          qualidadeAfetada: false,
          inspecaoObrigatoria: false
        });
      }
    });

    return {
      id: peca.id,
      comprimentoOriginal: peca.length,
      tag: peca.tag,
      posicao: peca.posicao,
      conjunto: peca.conjunto,
      perfil: peca.perfil,
      peso: peca.peso,
      perfilId: peca.perfilId,
      quantidade: peca.quantity,
      segmentos,
      emendas,
      statusQualidade: 'pendente',
      temEmenda: true,
      observacoes: `Emenda opcional - aproveitamento de ${melhorCombinacao.sobras.length} sobra(s)`
    };
  }

  /**
   * Buscar sobras compatíveis com a peça
   */
  private buscarSobrasCompatiiveis(peca: OptimizationPiece, mesmoPerfil: boolean = false): LeftoverStockItem[] {
    return this.leftovers.filter(sobra => {
      // Verificar tamanho mínimo
      if (sobra.comprimento < this.config.tamanhoMinimoSobra) return false;
      
      // Verificar perfil se necessário
      if (mesmoPerfil && peca.perfilId && sobra.id_perfis_materiais !== peca.perfilId) {
        return false;
      }
      
      return true;
    }).sort((a, b) => b.comprimento - a.comprimento);
  }

  /**
   * Encontrar melhor combinação de sobras para uma peça
   */
  private encontrarMelhorCombinacaoSobras(peca: OptimizationPiece, sobras: LeftoverStockItem[]): {
    sobras: LeftoverStockItem[];
    comprimentoNecessario: number;
    desperdicio: number;
  } | null {
    const comprimentoNecessario = peca.length;
    
    // Tentar diferentes combinações (algoritmo guloso simples)
    for (let maxSobras = 2; maxSobras <= Math.min(this.config.maxEmendasPorPeca + 1, sobras.length); maxSobras++) {
      const combinacao = this.encontrarCombinacaoGulosa(sobras, comprimentoNecessario, maxSobras);
      
      if (combinacao) {
        const comprimentoTotal = combinacao.reduce((total, s) => total + s.comprimento, 0);
        const desperdicio = comprimentoTotal - comprimentoNecessario;
        
        if (desperdicio >= 0) {
          return {
            sobras: combinacao,
            comprimentoNecessario,
            desperdicio
          };
        }
      }
    }

    return null;
  }

  /**
   * Algoritmo guloso para encontrar combinação de sobras
   */
  private encontrarCombinacaoGulosa(sobras: LeftoverStockItem[], comprimentoNecessario: number, maxSobras: number): LeftoverStockItem[] | null {
    const resultado: LeftoverStockItem[] = [];
    let comprimentoAcumulado = 0;
    const sobrasDisponiveis = [...sobras].sort((a, b) => b.comprimento - a.comprimento);

    for (const sobra of sobrasDisponiveis) {
      if (resultado.length >= maxSobras) break;
      
      const comprimentoRestante = comprimentoNecessario - comprimentoAcumulado;
      if (comprimentoRestante <= 0) break;
      
      if (sobra.comprimento >= Math.min(comprimentoRestante, this.config.tamanhoMinimoSobra)) {
        resultado.push(sobra);
        comprimentoAcumulado += sobra.comprimento;
      }
    }

    return comprimentoAcumulado >= comprimentoNecessario ? resultado : null;
  }

  /**
   * Calcular total de sobras utilizadas
   */
  private calcularSobrasUtilizadas(pecasComEmenda: PecaComEmenda[]): number {
    const sobrasUnicas = new Set<string>();
    
    pecasComEmenda.forEach(peca => {
      peca.segmentos.forEach(segmento => {
        if (segmento.origemTipo === 'sobra' && segmento.estoqueId) {
          sobrasUnicas.add(segmento.estoqueId);
        }
      });
    });

    return sobrasUnicas.size;
  }

  /**
   * Calcular economia estimada
   */
  private calcularEconomiaEstimada(pecasComEmenda: PecaComEmenda[]): number {
    // Estimativa simples baseada no comprimento de sobras utilizadas
    let totalSobrasUtilizadas = 0;
    
    pecasComEmenda.forEach(peca => {
      peca.segmentos.forEach(segmento => {
        if (segmento.origemTipo === 'sobra') {
          totalSobrasUtilizadas += segmento.comprimento;
        }
      });
    });

    // Assumindo custo médio de R$ 5,50/kg e 0.5kg/metro
    return (totalSobrasUtilizadas / 1000) * 0.5 * 5.50;
  }

  /**
   * Salvar informações de emendas no banco de dados
   */
  async salvarEmendasNoBanco(optimizationId: string, pecasComEmenda: PecaComEmenda[]): Promise<void> {
    try {
      const emendasParaSalvar = pecasComEmenda.map(peca => ({
        projeto_otimizacao_id: optimizationId,
        peca_id: peca.id,
        peca_tag: peca.tag || null,
        comprimento_original: peca.comprimentoOriginal,
        quantidade_emendas: peca.emendas.length,
        segmentos: JSON.stringify(peca.segmentos),
        emendas: JSON.stringify(peca.emendas),
        status_qualidade: peca.statusQualidade,
        observacoes: peca.observacoes || null
      }));

      // Como a tabela pode não estar ainda sincronizada no types.ts, usaremos uma abordagem genérica
      const { error } = await supabase
        .from('emendas_otimizacao' as any)
        .insert(emendasParaSalvar);

      if (error) {
        console.error('Erro ao salvar emendas:', error);
        throw error;
      }

      console.log(`${emendasParaSalvar.length} emendas salvas no banco de dados`);
    } catch (error) {
      console.error('Erro ao salvar emendas no banco:', error);
      throw error;
    }
  }
}