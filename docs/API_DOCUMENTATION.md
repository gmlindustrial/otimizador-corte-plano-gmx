# API Documentation - Sistema de Otimização

## Visão Geral

Esta documentação descreve as APIs internas e endpoints do sistema de otimização de corte.

## Serviços Base

### BaseService
**Arquivo**: `src/services/base/BaseService.ts`

Classe base para todos os serviços com funcionalidades comuns:

```typescript
class BaseService<T> {
  protected tableName: string
  
  async findAll(): Promise<T[]>
  async findById(id: string): Promise<T | null>
  async create(data: Partial<T>): Promise<T>
  async update(id: string, data: Partial<T>): Promise<T>
  async delete(id: string): Promise<void>
}
```

## APIs de Entidades

### ProjectService
**Arquivo**: `src/services/entities/ProjetoService.ts`

#### Métodos Disponíveis

```typescript
// Buscar todos os projetos
async getProjects(): Promise<Project[]>

// Buscar projeto por ID
async getProject(id: string): Promise<Project | null>

// Criar novo projeto
async createProject(data: ProjectInsert): Promise<Project>

// Atualizar projeto
async updateProject(id: string, data: ProjectUpdate): Promise<Project>

// Deletar projeto
async deleteProject(id: string): Promise<void>

// Validar dados do projeto
validateProjectData(data: any): void

// Formatar número do projeto
formatProjectNumber(number: string): string
```

#### Exemplo de Uso
```typescript
const projectService = new ProjectService()

// Criar projeto
const newProject = await projectService.createProject({
  nome: "Projeto Teste",
  numero_projeto: "P001",
  cliente_id: "uuid-cliente",
  obra_id: "uuid-obra"
})

// Buscar projetos
const projects = await projectService.getProjects()
```

### MaterialService
**Arquivo**: `src/services/entities/MaterialService.ts`

```typescript
class MaterialService extends BaseService<Material> {
  async getMaterialsByType(type: string): Promise<Material[]>
  async getStandardLengths(): Promise<number[]>
  async updatePrices(materialId: string, prices: PriceData): Promise<void>
}
```

### OptimizationHistoryService
**Arquivo**: `src/services/entities/HistoricoOtimizacaoService.ts`

```typescript
class OptimizationHistoryService extends BaseService<OptimizationHistory> {
  async saveOptimization(data: OptimizationData): Promise<void>
  async getProjectHistory(projectId: string): Promise<OptimizationHistory[]>
  async getStatistics(dateRange?: DateRange): Promise<OptimizationStats>
}
```

## APIs de Otimização

### Linear Optimization
**Arquivo**: `src/lib/runLinearOptimization.ts`

```typescript
interface OptimizationRequest {
  pieces: OptimizationPiece[]
  barLength: number
  kerf?: number
  algorithm?: 'bestfit' | 'firstfit' | 'worstfit'
}

interface OptimizationResult {
  bars: OptimizedBar[]
  totalBars: number
  totalLength: number
  totalWaste: number
  efficiency: number
  executionTime: number
}

async function runLinearOptimization(
  request: OptimizationRequest
): Promise<OptimizationResult>
```

### Sheet Optimization
**Arquivo**: `src/services/SheetOptimizationService.ts`

```typescript
interface SheetOptimizationRequest {
  pieces: SheetCutPiece[]
  sheetWidth: number
  sheetHeight: number
  algorithm: 'bottomleft' | 'genetic' | 'multiobjective'
  settings?: OptimizationSettings
}

interface SheetOptimizationResult {
  sheets: OptimizedSheet[]
  totalSheets: number
  efficiency: number
  totalWaste: number
  executionTime: number
}

class SheetOptimizationService {
  async optimize(request: SheetOptimizationRequest): Promise<SheetOptimizationResult>
  async saveResult(result: SheetOptimizationResult): Promise<void>
  async getHistory(projectId: string): Promise<SheetOptimizationResult[]>
}
```

## APIs de Relatórios

### PDFReportService
**Arquivo**: `src/services/PDFReportService.ts`

```typescript
interface ReportOptions {
  includeGraphics: boolean
  includeMetrics: boolean
  paperSize: 'A4' | 'A3' | 'Letter'
  orientation: 'portrait' | 'landscape'
}

class PDFReportService {
  async generateOptimizationReport(
    optimizationId: string, 
    options: ReportOptions
  ): Promise<Blob>
  
  async generateProjectSummary(
    projectId: string, 
    options: ReportOptions
  ): Promise<Blob>
  
  async generateCuttingPlan(
    optimizationResult: OptimizationResult, 
    options: ReportOptions
  ): Promise<Blob>
}
```

## Hooks da API

### useLinearOptimization
**Arquivo**: `src/hooks/useLinearOptimization.ts`

```typescript
interface UseLinearOptimizationReturn {
  optimize: (pieces: OptimizationPiece[], barLength: number) => Promise<void>
  result: OptimizationResult | null
  isLoading: boolean
  error: string | null
  history: OptimizationResult[]
  clearHistory: () => void
}

function useLinearOptimization(): UseLinearOptimizationReturn
```

### useSheetOptimization
**Arquivo**: `src/hooks/useSheetOptimization.ts`

```typescript
interface UseSheetOptimizationReturn {
  optimize: (request: SheetOptimizationRequest) => Promise<void>
  result: SheetOptimizationResult | null
  isLoading: boolean
  error: string | null
  settings: OptimizationSettings
  updateSettings: (settings: Partial<OptimizationSettings>) => void
}

function useSheetOptimization(): UseSheetOptimizationReturn
```

## APIs de Upload

### FileParsingService
**Arquivo**: `src/components/file-upload/FileParsingService.ts`

```typescript
interface ParseResult {
  pieces: OptimizationPiece[]
  errors: string[]
  warnings: string[]
  metadata: FileMetadata
}

class FileParsingService {
  async parseFile(file: File): Promise<ParseResult>
  async validateFormat(file: File): Promise<boolean>
  getSupportedFormats(): string[]
}
```

## Tratamento de Erros

### ErrorHandler
**Arquivo**: `src/services/base/ErrorHandler.ts`

```typescript
class ErrorHandler {
  static handle(error: any, context: string): string
  static handleSuccess(message: string): void
  static handleInfo(message: string): void
}
```

### Códigos de Erro Comuns

| Código | Descrição | Ação Recomendada |
|--------|-----------|------------------|
| `VALIDATION_ERROR` | Dados de entrada inválidos | Verificar formato dos dados |
| `OPTIMIZATION_TIMEOUT` | Timeout na otimização | Reduzir complexidade ou aumentar timeout |
| `FILE_PARSE_ERROR` | Erro ao processar arquivo | Verificar formato e encoding |
| `DATABASE_ERROR` | Erro na base de dados | Verificar conectividade |
| `INSUFFICIENT_MEMORY` | Memória insuficiente | Reduzir tamanho do dataset |

## Configuração de Performance

### Timeouts
```typescript
const CONFIG = {
  OPTIMIZATION_TIMEOUT: 30000, // 30 segundos
  DATABASE_TIMEOUT: 5000,      // 5 segundos
  FILE_UPLOAD_TIMEOUT: 60000   // 60 segundos
}
```

### Limites
```typescript
const LIMITS = {
  MAX_PIECES_PER_OPTIMIZATION: 1000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_HISTORY_ENTRIES: 100
}
```

## Monitoramento

### Métricas Disponíveis
- Tempo de execução por algoritmo
- Taxa de sucesso das otimizações
- Utilização de memória
- Latência de queries

### Logs Estruturados
```typescript
// Exemplo de log de otimização
{
  level: "info",
  message: "Optimization completed",
  context: "LinearOptimization",
  data: {
    pieces: 25,
    barLength: 6000,
    efficiency: 87.5,
    executionTime: 1250
  }
}
```

## Segurança

### Autenticação
- Todas as APIs requerem autenticação via Supabase
- Tokens JWT com expiração configurável
- Refresh automático de tokens

### Autorização
- RLS (Row Level Security) no Supabase
- Controle de acesso baseado em roles
- Auditoria de ações críticas

### Validação
- Sanitização de inputs
- Validação de tipos TypeScript
- Limites de rate limiting

## Rate Limiting

```typescript
const RATE_LIMITS = {
  OPTIMIZATION_PER_MINUTE: 10,
  FILE_UPLOAD_PER_HOUR: 100,
  REPORT_GENERATION_PER_HOUR: 50
}
```

## Versionamento

### Versão Atual: v2.0
- Breaking changes requerem incremento de major version
- Backward compatibility mantida por 2 versões
- Deprecation warnings com 6 meses de antecedência

### Headers de Versão
```http
API-Version: 2.0
Accept-Version: 2.0
```

## Exemplos de Integração

### Cliente JavaScript
```typescript
import { ProjectService, OptimizationService } from './services'

const projectService = new ProjectService()
const optimizationService = new OptimizationService()

// Criar projeto e otimizar
async function createAndOptimize() {
  const project = await projectService.createProject({
    nome: "Novo Projeto",
    numero_projeto: "P001"
  })
  
  const pieces = [
    { id: "1", length: 1500, quantity: 2, tag: "P1" },
    { id: "2", length: 2000, quantity: 1, tag: "P2" }
  ]
  
  const result = await optimizationService.optimize({
    pieces,
    barLength: 6000,
    algorithm: 'bestfit'
  })
  
  console.log(`Eficiência: ${result.efficiency}%`)
}
```

### WebHooks (Futuro)
```typescript
// Configuração de webhook para otimizações
interface WebhookConfig {
  url: string
  events: ['optimization.completed', 'project.created']
  secret: string
}
```