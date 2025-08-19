-- Sincronizar dados existentes: extrair peças cortadas dos JSONs de resultados
-- usando tag e posição como chaves de matching
-- e atualizar a coluna corte correspondente na tabela projeto_pecas

DO $$
DECLARE
    optimization_record RECORD;
    pieces_synced INTEGER := 0;
    pieces_unsynced INTEGER := 0;
BEGIN
    -- Primeiro, resetar todas as peças cortadas para false para garantir consistência
    UPDATE projeto_pecas SET corte = false;
    
    -- Percorrer todas as otimizações que têm resultados
    FOR optimization_record IN 
        SELECT id, projeto_id, resultados 
        FROM projeto_otimizacoes 
        WHERE resultados IS NOT NULL 
        AND resultados::jsonb ? 'bars'
    LOOP
        -- Atualizar peças cortadas usando tag e posição como chaves de matching
        WITH piece_updates AS (
            SELECT DISTINCT
                piece_data->>'tag' as piece_tag,
                piece_data->>'posicao' as piece_posicao
            FROM jsonb_array_elements(optimization_record.resultados::jsonb->'bars') as bar_data,
                 jsonb_array_elements(bar_data->'pieces') as piece_data
            WHERE (piece_data->>'cortada')::boolean = true
            AND piece_data ? 'tag'
            AND piece_data ? 'posicao'
        )
        UPDATE projeto_pecas pp
        SET corte = true
        FROM piece_updates pu
        WHERE pp.projeto_otimizacao_id = optimization_record.id
        AND pp.tag = pu.piece_tag
        AND pp.posicao = pu.piece_posicao;
        
        -- Contar peças sincronizadas para esta otimização
        GET DIAGNOSTICS pieces_synced = ROW_COUNT;
        
        RAISE NOTICE 'Otimização % - Sincronizadas % peças cortadas', optimization_record.id, pieces_synced;
    END LOOP;
    
    -- Mostrar estatísticas finais
    SELECT COUNT(*) INTO pieces_synced FROM projeto_pecas WHERE corte = true;
    SELECT COUNT(*) INTO pieces_unsynced FROM projeto_pecas WHERE corte = false;
    
    RAISE NOTICE 'Sincronização concluída: % peças cortadas, % peças não cortadas', pieces_synced, pieces_unsynced;
END $$;