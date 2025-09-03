-- Migração para sincronizar peças da "Lista 2 - W310x28.3" na tabela projeto_pecas
-- As pecas_selecionadas contêm IDs que precisam ser buscados na tabela projeto_pecas

DO $$
DECLARE
    otimizacao_id uuid := '393d0cec-f878-47e2-9916-1d066e4cb857';
    pecas_ids jsonb;
    peca_id text;
BEGIN
    -- Buscar os IDs das peças selecionadas do JSON
    SELECT pecas_selecionadas INTO pecas_ids 
    FROM projeto_otimizacoes 
    WHERE id = otimizacao_id;
    
    -- Iterar sobre cada ID de peça no JSON
    FOR peca_id IN SELECT jsonb_array_elements_text(pecas_ids)
    LOOP
        -- Atualizar as peças existentes para conectá-las à otimização
        UPDATE projeto_pecas 
        SET projeto_otimizacao_id = otimizacao_id,
            status = 'otimizada'
        WHERE id = peca_id::uuid 
        AND projeto_otimizacao_id IS NULL;
        
        -- Se a peça não existe, não fazemos nada (talvez foi deletada)
    END LOOP;
    
    RAISE NOTICE 'Sincronização da Lista 2 - W310x28.3 concluída. Peças conectadas à otimização.';
END $$;