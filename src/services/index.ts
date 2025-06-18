
// Export centralizado de todos os services
export * from './base/BaseService';
export * from './base/ErrorHandler';
export * from './base/types';

export * from './interfaces';

export * from './entities/ObraService';
export * from './entities/ClienteService';
export * from './entities/MaterialService';
export * from './entities/OperadorService';
export * from './entities/InspetorService';
export * from './entities/ProjetoService';
export * from './entities/EstoqueSobrasService';
export * from './entities/HistoricoOtimizacaoService';

// Instâncias dos services para uso direto
export {
  obraService,
  clienteService,
  materialService,
  operadorService,
  inspetorService,
  projetoService,
  estoqueSobrasService,
  historicoOtimizacaoService
} from './entities/ObraService';
