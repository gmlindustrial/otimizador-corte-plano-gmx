# Relatório para Equipe Backend — Pendências Supabase

**Data:** 30/03/2026
**Reportado por:** Daniel (Frontend)
**Branch:** `feat/sidebar-darkmode-tooltips`

---

## 1. ERRO 400 — Salvar projeto de chapas

**Arquivo frontend:** `src/hooks/useSheetProjects.ts:150-156`
**Erro no console:** `Failed to load resource: the server responded with a status of 400`

O frontend tenta inserir na tabela `projetos` com colunas que podem não existir. Verificar se a tabela `projetos` possui **todas** estas colunas:

```sql
-- Verificar existência destas colunas na tabela projetos:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projetos';

-- Colunas esperadas pelo frontend:
-- nome              TEXT        (obrigatória)
-- numero_projeto    TEXT        (obrigatória)
-- cliente_id        UUID        (FK → clientes)
-- obra_id           UUID        (FK → obras)
-- material_id       UUID        (FK → materiais)
-- operador_id       UUID        (FK → operadores)
-- inspetor_id       UUID        (FK → inspetores_qa)
-- turno             TEXT
-- lista             TEXT
-- revisao           TEXT
-- validacao_qa      BOOLEAN
-- qr_code           TEXT
-- dados_projeto     JSONB       ← CRÍTICO: usado para diferenciar projetos linear/sheet
-- enviar_sobras_estoque BOOLEAN
```

**Se alguma coluna não existir**, criar com:

```sql
-- Exemplo (ajustar conforme necessário):
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES materiais(id);
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS operador_id UUID REFERENCES operadores(id);
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS inspetor_id UUID REFERENCES inspetores_qa(id);
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS turno TEXT;
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS lista TEXT;
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS revisao TEXT;
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS validacao_qa BOOLEAN DEFAULT FALSE;
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS dados_projeto JSONB;
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS enviar_sobras_estoque BOOLEAN DEFAULT FALSE;
```

---

## 2. ERRO 400 — Query JSONB falhando

**Arquivo frontend:** `src/hooks/useSheetProjects.ts:182`
**Query problemática:**
```
GET /rest/v1/projetos?dados_projeto->>type=eq.sheet
```

Esta query usa operador JSONB `->>`  que requer:
- Coluna `dados_projeto` do tipo JSONB na tabela `projetos`
- PostgREST versão que suporte filtro JSONB (v9+)

**Verificar:**
```sql
-- A coluna existe?
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'projetos' AND column_name = 'dados_projeto';

-- Se não existir:
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS dados_projeto JSONB;
```

---

## 3. MIGRATIONS PENDENTES (novas features)

4 migrations criadas nesta sprint que precisam ser executadas no Supabase:

### Migration 1: `20260329000000_add_max_barras_amarrado.sql`
**Propósito:** Campo para otimização em amarrado (bundle cutting)
```sql
ALTER TABLE perfis_materiais
ADD COLUMN IF NOT EXISTS max_barras_amarrado INTEGER DEFAULT 1;

ALTER TABLE perfis_materiais
ADD CONSTRAINT check_max_barras_amarrado
CHECK (max_barras_amarrado >= 1 AND max_barras_amarrado <= 20);
```

### Migration 2: `20260330000000_create_execucao_corte.sql`
**Propósito:** Registro de execução real dos cortes vs planejado
```sql
CREATE TABLE IF NOT EXISTS execucao_corte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_otimizacao_id UUID REFERENCES projeto_otimizacoes(id) ON DELETE CASCADE,
  barra_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'concluido', 'desvio', 'rejeitado')),
  observacoes TEXT,
  operador_id UUID REFERENCES operadores(id),
  data_execucao TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_execucao_corte_otimizacao ON execucao_corte(projeto_otimizacao_id);
```

### Migration 3: `20260330100000_create_inspecao_pre_corte.sql`
**Propósito:** Registro de inspeção de material antes do corte
```sql
CREATE TABLE IF NOT EXISTS inspecao_pre_corte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_otimizacao_id UUID REFERENCES projeto_otimizacoes(id) ON DELETE CASCADE,
  material_id UUID,
  inspetor_id UUID REFERENCES inspetores_qa(id),
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'aprovado', 'reprovado', 'condicional')),
  tipo_inspecao TEXT NOT NULL DEFAULT 'visual'
    CHECK (tipo_inspecao IN ('visual', 'dimensional', 'ultrassom', 'magnetica', 'completa')),
  observacoes TEXT,
  defeitos_encontrados TEXT[],
  foto_evidencia TEXT,
  data_inspecao TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inspecao_pre_corte_otimizacao ON inspecao_pre_corte(projeto_otimizacao_id);
CREATE INDEX idx_inspecao_pre_corte_status ON inspecao_pre_corte(status);
```

### Migration 4: `20260330200000_create_ocorrencias_corte.sql`
**Propósito:** Registro de ocorrências/exceções durante o corte
```sql
CREATE TABLE IF NOT EXISTS ocorrencias_corte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_otimizacao_id UUID REFERENCES projeto_otimizacoes(id) ON DELETE CASCADE,
  barra_id TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'barra_defeituosa', 'corte_errado', 'lamina_quebrou',
    'material_fora_especificacao', 'parada_emergencia',
    'desvio_dimensional', 'outro'
  )),
  severidade TEXT NOT NULL DEFAULT 'media'
    CHECK (severidade IN ('baixa', 'media', 'alta', 'critica')),
  descricao TEXT NOT NULL,
  acao_tomada TEXT,
  pecas_afetadas INTEGER DEFAULT 0,
  material_perdido_mm INTEGER DEFAULT 0,
  operador_id UUID REFERENCES operadores(id),
  resolvido BOOLEAN DEFAULT FALSE,
  resolvido_por UUID REFERENCES operadores(id),
  resolvido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ocorrencias_corte_otimizacao ON ocorrencias_corte(projeto_otimizacao_id);
CREATE INDEX idx_ocorrencias_corte_tipo ON ocorrencias_corte(tipo);
CREATE INDEX idx_ocorrencias_corte_resolvido ON ocorrencias_corte(resolvido);
```

---

## 4. ATUALIZAR types.ts (OPCIONAL)

Após rodar as migrations, regenerar os tipos do Supabase:
```bash
npx supabase gen types typescript --project-id <PROJECT_ID> > src/integrations/supabase/types.ts
```

Isso atualiza o `types.ts` para refletir o schema real do banco.

---

## Prioridade de Execução

| # | Ação | Prioridade | Impacto |
|---|------|-----------|---------|
| 1 | Verificar/criar colunas na tabela `projetos` | **CRÍTICA** | Bloqueia salvar projetos de chapas |
| 2 | Rodar Migration 1 (max_barras_amarrado) | ALTA | Feature de amarrado |
| 3 | Rodar Migrations 2-4 (execução, inspeção, ocorrências) | MÉDIA | Features operacionais |
| 4 | Regenerar types.ts | BAIXA | Melhora DX |

---

**Arquivos de migration:** `supabase/migrations/`
**Contato frontend:** Daniel
