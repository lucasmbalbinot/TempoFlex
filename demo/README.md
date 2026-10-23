# Demonstração offline do TempoFlex

O PBIX de exemplo precisa conter dados incorporados e a mesma versão do `.pbiviz` final. **Este diretório não apresenta um PBIX fictício como concluído.**

O material foi preparado por terminal. Nenhum aplicativo precisa ser aberto pelos scripts do repositório. A montagem e o teste do PBIX no Power BI ficam como etapa explícita do publicador.

## Dados prontos

- [DadosDemo.m](DadosDemo.m): consulta Power Query autocontida, sem `File.Contents`, `Web.Contents`, serviço ou credencial.
- `dados-demo.csv`: 4.380 registros fictícios de 01/01/2025 a 31/12/2027, gerados por `npm run assets:build` para inspeção. Prefira a consulta M para que o relatório final não dependa de um caminho de arquivo.
- [configuracoes.json](configuracoes.json): períodos, variáveis e configuração sugerida por página.

Os dados incluem eventos no mesmo minuto e em segundos consecutivos para demonstrar precisão. Não representam pessoas, clientes ou operações reais.

## Montagem no Power BI pelo publicador

1. Crie um relatório vazio e uma consulta em branco. No editor avançado, cole `DadosDemo.m` e nomeie a tabela `DadosDemo`.
2. Carregue a tabela. Confira DataHora como Data/Hora e Data como Data.
3. Importe o `.pbiviz` de `dist/` da versão atual. Arraste a própria coluna DataHora ao campo Data, sem hierarquia.
4. Crie medidas para verificar os filtros:

```dax
Valor Total = SUM(DadosDemo[Valor])
Quantidade Total = SUM(DadosDemo[Quantidade])
Eventos = COUNTROWS(DadosDemo)
```

5. Monte as páginas abaixo; copie períodos/variáveis de `configuracoes.json` nos cartões correspondentes.
6. Salve como `TempoFlex-Demo.pbix` neste diretório. PBIX é ignorado pelo Git e incluído no pacote de submissão se estiver presente.
7. Teste a abertura offline, as seleções e a versão incorporada. Só então registre o resultado em `appsource/validation.json`.

## Páginas propostas

| Página | Conteúdo |
|---|---|
| 01 — Visão geral | TempoFlex Entre/dia, cartões de totais e gráfico por área |
| 02 — Modos e precisão | É/mês, Dropdown/mês e seleção com segundos; explique os limites da UI nativa |
| 03 — Competências | Ciclo mensal iniciado no dia 26 e ano fiscal iniciado em abril |
| 04 — Personalização | Botões em grade, somente períodos e aviso de dependência do deslizante |
| 05 — Como usar | Instruções, licença, suporte e limitações conhecidas; sem informações confidenciais |

Nas páginas de datas fixas, use outubro de 2026 para uma demonstração reproduzível. Os atalhos relativos usam a data atual do ambiente: após 2027, os exemplos baseados em hoje podem ficar fora da base fictícia. Use `max` para mostrar a última data da base ou atualize o intervalo da consulta em uma nova versão de demonstração.

## Por que não há conversão automática para PBIX

Um `.pbiviz`, CSV ou ZIP renomeado não é um relatório Power BI com modelo de dados incorporado. O `pbi-tools compile` documenta saída PBIX para relatórios thin e PBIT para projetos com modelo; um thin report não atende ao exemplo offline exigido. Referência: [CLI pbi-tools](https://pbi.tools/cli/usage.html#compile).

Os scripts não iniciam o Power BI, não controlam a interface, não alteram configurações do computador e não tentam simular uma aprovação que depende do host real.
