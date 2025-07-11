# Manual do Usuário - Sistema de Otimização de Corte

## Introdução

O Sistema de Otimização de Corte é uma ferramenta profissional para maximizar a eficiência no corte de materiais, minimizando desperdícios e custos operacionais.

## Primeiros Passos

### 1. Acesso ao Sistema
- Acesse a aplicação através do navegador
- Faça login com suas credenciais
- A tela principal (Dashboard) será exibida

### 2. Configuração Inicial
Antes de usar o sistema, configure:
- **Materiais**: Cadastre os tipos de material utilizados
- **Clientes**: Registre os clientes dos projetos
- **Obras**: Configure as obras onde os materiais serão utilizados

## Funcionalidades Principais

### Dashboard
O Dashboard oferece uma visão geral dos seus projetos:
- **KPIs Operacionais**: Eficiência, desperdício, custos
- **Gráficos**: Evolução temporal dos indicadores
- **Alertas**: Notificações sobre estoque e prazos

### Gestão de Projetos

#### Criando um Novo Projeto
1. Clique em "Novo Projeto"
2. Preencha as informações:
   - Nome do projeto
   - Número do projeto
   - Cliente (opcional)
   - Obra (opcional)
3. Clique em "Salvar"

#### Importando Peças
**Método 1: Upload de Arquivo AutoCAD**
1. No projeto, clique em "Importar Arquivo"
2. Selecione arquivo .txt, .csv ou .dwg
3. O sistema extrairá automaticamente as peças
4. Revise e confirme os dados importados

**Método 2: Entrada Manual**
1. Clique em "Adicionar Peça"
2. Preencha:
   - Tag da peça
   - Comprimento (mm)
   - Quantidade
   - Perfil do material
3. Clique em "Adicionar"

### Otimização Linear (Barras)

#### Configurando a Otimização
1. Selecione as peças para otimizar
2. Escolha o perfil do material
3. Defina o comprimento da barra padrão
4. Configure parâmetros avançados (opcional):
   - Margem de segurança
   - Algoritmo de otimização
   - Prioridades

#### Executando a Otimização
1. Clique em "Otimizar"
2. Aguarde o processamento
3. Analise os resultados:
   - Número de barras necessárias
   - Eficiência alcançada
   - Desperdício total
   - Custo estimado

#### Interpretando Resultados
- **Eficiência**: Percentual de material aproveitado
- **Desperdício**: Material não utilizado por barra
- **Sequência de Corte**: Ordem otimizada para execução

### Otimização de Chapas (2D)

#### Configurando Peças
1. Defina dimensões (largura x altura)
2. Configure quantidade necessária
3. Marque se permite rotação
4. Adicione tolerâncias se necessário

#### Algoritmos Disponíveis
- **Bottom Left Fill**: Rápido, bom para peças regulares
- **Algoritmo Genético**: Mais lento, melhor eficiência
- **Multi-Objetivo**: Balanceamento automático

#### Analisando Layout
- Visualização 2D do arranjo
- Sequência de corte otimizada
- Relatório de aproveitamento

### Gestão de Estoque

#### Estoque de Sobras
- Registre sobras de cortes anteriores
- Sistema sugere reuso automático
- Controle de localização física

#### Relatórios de Estoque
- Inventário atual
- Movimentações
- Previsão de necessidades

### Relatórios e Documentação

#### Tipos de Relatório
1. **Relatório Completo**:
   - Dados do projeto
   - Lista detalhada de peças
   - Plano de corte
   - Métricas de eficiência
   - Custos estimados

2. **Plano Simplificado**:
   - Sequência de corte
   - Dimensões básicas
   - Quantidades

3. **Relatório de Sustentabilidade**:
   - Métricas ambientais
   - Redução de desperdício
   - Impacto carbono

#### Exportação
- **PDF**: Para impressão e arquivamento
- **Excel**: Para análise e processamento
- **Imagem**: Para visualização rápida

## Funcionalidades Avançadas

### Cadastros Auxiliares

#### Gestão de Materiais
- Tipos de material (aço, alumínio, etc.)
- Perfis disponíveis
- Densidades e propriedades
- Preços por kg/m²

#### Gestão de Operadores
- Cadastro de operadores de máquina
- Turnos de trabalho
- Especialidades

#### Gestão de Inspetores
- Inspetores de qualidade
- Áreas de atuação
- Certificações

### Configurações do Sistema

#### Configurações de Corte
- Margens de segurança
- Velocidades de corte
- Parâmetros de qualidade

#### Preferências de Relatório
- Templates customizados
- Logotipos da empresa
- Cabeçalhos e rodapés

### Integração e Backup

#### Exportação de Dados
- Backup completo dos projetos
- Exportação seletiva
- Formatos compatíveis

#### Importação
- Migração de sistemas antigos
- Restauração de backups
- Validação de integridade

## Dicas de Uso

### Maximizando Eficiência
1. **Agrupe peças similares** no mesmo projeto
2. **Use perfis padrão** sempre que possível
3. **Configure margens adequadas** para seu processo
4. **Mantenha estoque de sobras** atualizado

### Boas Práticas
1. **Nomeação consistente** de projetos e peças
2. **Backup regular** dos dados importantes
3. **Revisão periódica** dos parâmetros de otimização
4. **Treinamento da equipe** nas funcionalidades

### Troubleshooting

#### Problemas Comuns
**Otimização muito lenta**:
- Reduza o número de peças por lote
- Use algoritmo mais simples para testes
- Verifique recursos do computador

**Resultados ruins**:
- Verifique parâmetros de entrada
- Confirme dimensões das peças
- Revise margens de segurança

**Erro de importação**:
- Verifique formato do arquivo
- Confirme encoding (UTF-8)
- Validate dados de origem

#### Contato para Suporte
- Email: suporte@sistema.com
- Telefone: (11) 9999-9999
- Documentação: docs.sistema.com

## Glossário

**Eficiência**: Percentual de material aproveitado em relação ao total disponível

**Desperdício**: Material não utilizado, geralmente expresso em mm ou %

**NFP (No Fit Polygon)**: Região onde uma peça não pode ser posicionada sem sobrepor outra

**Kerf**: Espessura do corte, material removido durante o processo

**Tolerância**: Margem de erro aceitável nas dimensões

**Sequenciamento**: Ordem otimizada para execução dos cortes

## Atualizações

### Versão Atual: 2.0
- Otimização de chapas 2D
- Algoritmos genéticos
- Relatórios avançados
- Gestão de estoque integrada

### Próximas Funcionalidades
- Integração CAD avançada
- Aplicativo mobile
- IA para predição de demanda
- Marketplace de algoritmos