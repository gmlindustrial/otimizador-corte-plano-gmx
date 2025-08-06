
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
export * from './entities/ProjectHistoryService';

// Serra services
export * from './entities/SerraService';
export * from './entities/SerraUsoCorteService';
export * from './interfaces/serra';

// Instâncias dos services para uso direto
export { obraService } from './entities/ObraService';
export { clienteService } from './entities/ClienteService';
export { materialService } from './entities/MaterialService';
export { operadorService } from './entities/OperadorService';
export { inspetorService } from './entities/InspetorService';
export { projetoService } from './entities/ProjetoService';
export { estoqueSobrasService } from './entities/EstoqueSobrasService';
export { historicoOtimizacaoService } from './entities/HistoricoOtimizacaoService';
export { usuarioService } from './entities/UsuarioService';
export { projetoOtimizacaoService } from './entities/ProjetoOtimizacaoService';
export { projectHistoryService } from './entities/ProjectHistoryService';
export { serraService } from './entities/SerraService';
export { serraUsoCorteService } from './entities/SerraUsoCorteService';

// PDF Service
export { PDFReportService } from './PDFReportService';
