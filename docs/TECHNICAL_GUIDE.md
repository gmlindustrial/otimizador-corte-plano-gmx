# Guia Técnico - Sistema de Otimização de Corte

## Arquitetura do Sistema

### Visão Geral
O sistema é uma aplicação React/TypeScript que implementa algoritmos avançados de otimização de corte para barras lineares e chapas 2D, com backend Supabase para persistência de dados.

### Stack Tecnológica
- **Frontend**: React 18, TypeScript, Vite
- **UI/UX**: Tailwind CSS, shadcn/ui, Lucide Icons
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: TanStack Query, React Hooks
- **Testing**: Vitest, Testing Library
- **Build**: Vite, ESBuild

## Algoritmos de Otimização

### Otimização Linear (1D)
**Arquivo**: `src/algorithms/linear/BestFitOptimizer.ts`

Implementa algoritmo Best Fit Decreasing para minimizar desperdício:
1. Ordena peças por comprimento (decrescente)
2. Para cada peça, encontra a barra com melhor ajuste
3. Se não houver espaço, cria nova barra
4. Calcula métricas de eficiência

**Complexidade**: O(n²) onde n = número de peças

### Otimização de Chapas (2D)
**Arquivos**: `src/algorithms/sheet/`

#### Bottom Left Fill (BLF)
- Posiciona peças no canto inferior esquerdo disponível
- Suporte a rotação opcional
- Complexidade: O(n²)

#### Algoritmo Genético
- População de soluções aleatórias
- Seleção, crossover e mutação
- Convergência para soluções ótimas
- Complexidade: O(g × p × n) onde g=gerações, p=população

#### Multi-Objective
- Combina múltiplos algoritmos
- Pondera eficiência vs velocidade
- Seleção automática da melhor solução

### No Fit Polygon (NFP)
**Arquivo**: `src/algorithms/sheet/NoFitPolygon.ts`

Calcula regiões onde peças não podem ser posicionadas:
- Detecção de sobreposição
- Otimização espacial
- Suporte a geometrias complexas

## Estrutura de Dados

### Projetos
```typescript
interface Project {
  id: string
  nome: string
  numero_projeto: string
  cliente_id?: string
  obra_id?: string
  created_at: string
}
```

### Peças Lineares
```typescript
interface OptimizationPiece {
  id: string
  length: number
  quantity: number
  tag: string
}
```

### Peças de Chapa
```typescript
interface SheetCutPiece {
  id: string
  width: number
  height: number
  quantity: number
  tag: string
  allowRotation: boolean
}
```

## Serviços e Integrações

### Supabase Client
**Arquivo**: `src/integrations/supabase/client.ts`

Configuração centralizada do cliente Supabase:
- Autenticação
- Queries tipadas
- Real-time subscriptions

### Services Layer
**Diretório**: `src/services/entities/`

Camada de abstração para operações de dados:
- `ProjectService`: Gestão de projetos
- `MaterialService`: Gestão de materiais
- `OptimizationHistoryService`: Histórico de otimizações

### File Upload Service
**Arquivo**: `src/components/file-upload/FileParsingService.ts`

Parser para arquivos AutoCAD:
- Extração de peças
- Validação de dados
- Mapeamento para estrutura interna

## Hooks Customizados

### useLinearOptimization
Gerencia estado e execução de otimização linear:
- Cache de resultados
- Histórico de execuções
- Métricas de performance

### useSheetOptimization
Controla otimização de chapas:
- Seleção de algoritmo
- Configurações avançadas
- Visualização de resultados

### useOptimizationHistory
Persistência e recuperação de histórico:
- Armazenamento local e remoto
- Sincronização automática
- Exportação de dados

## Componentes Principais

### Dashboard
**Arquivo**: `src/components/Dashboard.tsx`

Interface principal com métricas operacionais:
- KPIs em tempo real
- Gráficos de eficiência
- Alertas de sistema

### OptimizationResults
**Arquivo**: `src/components/OptimizationResults.tsx`

Visualização de resultados:
- Tabelas interativas
- Gráficos SVG
- Relatórios para impressão

### ReportVisualization
**Arquivo**: `src/components/ReportVisualization.tsx`

Geração de relatórios:
- Export PDF/Excel
- Gráficos customizáveis
- Templates para impressão

## Configuração e Deploy

### Variáveis de Ambiente
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Build para Produção
```bash
npm run build
npm run preview
```

### Testes
```bash
npm run test          # Executa testes
npm run test:coverage # Cobertura de testes
```

## Performance e Otimizações

### Algoritmos
- Lazy loading de algoritmos complexos
- Web Workers para processamento pesado
- Cache de resultados frequentes

### UI/UX
- Code splitting por rota
- Lazy loading de componentes
- Virtual scrolling para listas grandes

### Banco de Dados
- Índices otimizados
- Queries paginadas
- Connection pooling

## Monitoramento

### Logs Estruturados
**Arquivo**: `src/services/MonitoringService.ts`

Sistema de logging com níveis:
- ERROR: Erros críticos
- WARN: Avisos importantes
- INFO: Informações gerais
- DEBUG: Depuração detalhada

### Métricas de Performance
- Tempo de execução de algoritmos
- Latência de queries
- Métricas de UI (LCP, FID, CLS)

### Health Checks
- Status de conectividade
- Performance de algoritmos
- Integridade de dados

## Troubleshooting

### Problemas Comuns
1. **Otimização lenta**: Verificar tamanho do dataset, considerar Web Workers
2. **Memória alta**: Implementar paginação, limpar cache desnecessário
3. **Erros de parse**: Validar formato de arquivos, verificar encoding

### Debug
- Console logs estruturados
- DevTools performance profiling
- Network monitoring para queries Supabase

## Roadmap Técnico

### Curto Prazo
- [ ] Cobertura de testes 80%+
- [ ] Web Workers para algoritmos
- [ ] Cache inteligente de resultados

### Médio Prazo
- [ ] API GraphQL
- [ ] Real-time collaboration
- [ ] Mobile app (React Native)

### Longo Prazo
- [ ] Machine Learning para predições
- [ ] Integração CAD avançada
- [ ] Marketplace de algoritmos