-- Migração para sincronizar peças da "Lista 2 - W310x28.3" na tabela projeto_pecas
-- Esta lista tem 25 peças no JSON mas 0 peças na tabela

-- Primeiro, vamos extrair as peças do JSON da otimização e inserir na tabela projeto_pecas
DO $$
DECLARE
    otimizacao_id uuid := '393d0cec-f878-47e2-9916-1d066e4cb857';
    projeto_id_var uuid := '67018f44-2bec-4395-8530-49e44602552d';
    perfil_id_var uuid := '55766d92-d087-40e4-90ce-95f17c411b7c';
    pecas_json jsonb;
    peca jsonb;
BEGIN
    -- Buscar as peças selecionadas do JSON
    SELECT pecas_selecionadas INTO pecas_json 
    FROM projeto_otimizacoes 
    WHERE id = otimizacao_id;
    
    -- Iterar sobre cada peça no JSON e inserir na tabela projeto_pecas
    FOR peca IN SELECT * FROM jsonb_array_elements(pecas_json)
    LOOP
        INSERT INTO projeto_pecas (
            projeto_id,
            posicao,
            tag,
            fase,
            perfil_id,
            comprimento_mm,
            quantidade,
            peso,
            perfil_nao_encontrado,
            status,
            projeto_otimizacao_id
        ) VALUES (
            projeto_id_var,
            peca->>'posicao',
            peca->>'tag',
            peca->>'fase',
            perfil_id_var,
            (peca->>'length')::integer,
            COALESCE((peca->>'quantity')::integer, 1),
            (peca->>'peso')::numeric,
            false,
            'otimizada',
            otimizacao_id
        )
        ON CONFLICT DO NOTHING; -- Evita duplicatas se executado novamente
    END LOOP;
    
    RAISE NOTICE 'Sincronização da Lista 2 - W310x28.3 concluída';
END $$;