-- Migração em duas etapas: 
-- 1. Corrigir associações projeto_otimizacao_id para peças órfãs
-- 2. Sincronizar coluna corte baseada nos resultados JSON

DO $$
DECLARE
    optimization_record RECORD;
    pieces_associated INTEGER := 0;
    pieces_synced INTEGER := 0;
    total_cut_pieces INTEGER := 0;
BEGIN
    RAISE NOTICE 'Iniciando correção completa das peças cortadas...';
    
    -- ETAPA 1: Corrigir associações projeto_otimizacao_id para peças órfãs
    RAISE NOTICE 'ETAPA 1: Corrigindo associações de peças órfãs...';
    
    FOR optimization_record IN 
        SELECT id, projeto_id, resultados, nome_lista
        FROM projeto_otimizacoes 
        WHERE resultados IS NOT NULL 
        AND resultados::jsonb ? 'bars'
    LOOP
        -- Associar peças órfãs usando tag e posição como chaves
        WITH pieces_to_associate AS (
            SELECT DISTINCT
                piece_data->>'tag' as piece_tag,
                piece_data->>'posicao' as piece_posicao
            FROM jsonb_array_elements(optimization_record.resultados::jsonb->'bars') as bar_data,
                 jsonb_array_elements(bar_data->'pieces') as piece_data
            WHERE piece_data ? 'tag'
            AND piece_data ? 'posicao'
            AND piece_data->>'tag' IS NOT NULL
            AND piece_data->>'posicao' IS NOT NULL
        )
        UPDATE projeto_pecas pp
        SET projeto_otimizacao_id = optimization_record.id
        FROM pieces_to_associate pta
        WHERE pp.projeto_id = optimization_record.projeto_id
        AND pp.tag = pta.piece_tag
        AND pp.posicao = pta.piece_posicao
        AND pp.projeto_otimizacao_id IS NULL;
        
        GET DIAGNOSTICS pieces_associated = ROW_COUNT;
        
        IF pieces_associated > 0 THEN
            RAISE NOTICE 'Otimização % (%) - Associadas % peças órfãs', 
                optimization_record.nome_lista, optimization_record.id, pieces_associated;
        END IF;
    END LOOP;
    
    -- ETAPA 2: Resetar todas as peças cortadas para garantir consistência
    RAISE NOTICE 'ETAPA 2: Resetando coluna corte...';
    UPDATE projeto_pecas SET corte = false;
    
    -- ETAPA 3: Sincronizar peças cortadas baseado nos resultados JSON
    RAISE NOTICE 'ETAPA 3: Sincronizando peças cortadas...';
    
    FOR optimization_record IN 
        SELECT id, projeto_id, resultados, nome_lista
        FROM projeto_otimizacoes 
        WHERE resultados IS NOT NULL 
        AND resultados::jsonb ? 'bars'
    LOOP
        -- Marcar peças como cortadas usando tag e posição
        WITH cut_pieces AS (
            SELECT DISTINCT
                piece_data->>'tag' as piece_tag,
                piece_data->>'posicao' as piece_posicao
            FROM jsonb_array_elements(optimization_record.resultados::jsonb->'bars') as bar_data,
                 jsonb_array_elements(bar_data->'pieces') as piece_data
            WHERE (piece_data->>'cortada')::boolean = true
            AND piece_data ? 'tag'
            AND piece_data ? 'posicao'
            AND piece_data->>'tag' IS NOT NULL
            AND piece_data->>'posicao' IS NOT NULL
        )
        UPDATE projeto_pecas pp
        SET corte = true
        FROM cut_pieces cp
        WHERE pp.projeto_otimizacao_id = optimization_record.id
        AND pp.tag = cp.piece_tag
        AND pp.posicao = cp.piece_posicao;
        
        GET DIAGNOSTICS pieces_synced = ROW_COUNT;
        
        RAISE NOTICE 'Otimização % (%) - Sincronizadas % peças cortadas', 
            optimization_record.nome_lista, optimization_record.id, pieces_synced;
    END LOOP;
    
    -- Mostrar estatísticas finais
    SELECT COUNT(*) INTO total_cut_pieces FROM projeto_pecas WHERE corte = true;
    
    RAISE NOTICE 'CORREÇÃO CONCLUÍDA: % peças marcadas como cortadas no total', total_cut_pieces;
    
    -- Mostrar estatísticas por otimização
    FOR optimization_record IN 
        SELECT po.nome_lista, po.id, COUNT(pp.id) as cut_count
        FROM projeto_otimizacoes po
        LEFT JOIN projeto_pecas pp ON pp.projeto_otimizacao_id = po.id AND pp.corte = true
        WHERE po.resultados IS NOT NULL
        GROUP BY po.nome_lista, po.id
        ORDER BY po.nome_lista
    LOOP
        RAISE NOTICE 'Resultado final - %: % peças cortadas', 
            optimization_record.nome_lista, optimization_record.cut_count;
    END LOOP;
END $$;