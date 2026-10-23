# Filtro de Data com Períodos

Visual do Power BI que junta o segmentador de datas **Entre** com **botões de período rápido** configuráveis (Hoje, Mês atual, Mês anterior, Geral…), sem precisar de tabela ou medida auxiliar.

![](assets/icon.png)

## Como usar

1. No Power BI Desktop: **Visualizações › … › Importar um visual de um arquivo** e escolha `dist/filtroDataPeriodoA7C31E0B5F2D4E6C9B8A.1.4.1.0.pbiviz`.
2. Arraste **a coluna de data** para o campo **Data**. Use a coluna, não a hierarquia: se aparecer Ano/Trimestre/Mês/Dia, clique na seta do campo e escolha o nome dele.
3. Configure em **Formatar › Períodos rápidos › Períodos** (e, se precisar, *Variáveis*).
4. Ligue **Formatar › Guia de configuração › Mostrar guia no visual** para ver, dentro do visual, todas as regras, as âncoras e variáveis com as datas que elas dão hoje, exemplos e os erros. O guia só aparece no modo de edição; desligue quando terminar.

O visual filtra a coluna de data do campo, como o segmentador nativo. Funciona com coluna de data e com data/hora. Os períodos rápidos usam dias completos; as caixas e o dropdown respeitam o nível do filtro escolhido.

## Caixas de data e nível do filtro

Em **Formatar › Caixas de data**:

- **Mostrar**: desligue para usar somente os períodos rápidos. O controle deslizante fica oculto e, se estiver ligado, recebe um aviso no painel de formatação.
- **Tipo de seleção**: **Entre** usa início e fim; **É** usa uma caixa e seleciona uma única unidade; **Dropdown** lista as datas do campo, sem duplicatas, em ordem cronológica, com busca. O dropdown também seleciona uma única unidade e dispensa o deslizante.
- **Nível do filtro**: ano, mês, dia, hora, minuto ou segundo. O formato da data continua configurável para os níveis que incluem dia. Mês usa `mm/aaaa` e ano usa `aaaa`.
- O ícone abre o seletor nativo do navegador, que pode ultrapassar a área do visual: data para dia/ano, mês para mês/ano e data/hora para os níveis com horário. Não há calendário HTML próprio. O navegador controla os componentes disponíveis no popup; não existe seletor nativo exclusivo de ano. Nesse nível, escolha uma data e o filtro usa o ano inteiro, ou digite diretamente o ano na caixa. Segundos podem ser digitados na caixa mesmo quando não aparecem no popup do navegador.
- Uma unidade é inclusiva: `10/2026` inclui todo outubro; `23/10/2026 14:30` inclui o minuto de 14:30:00 até antes de 14:31:00. Em **Entre**, inclui toda a última unidade escolhida.
- As setas ↑/↓ alteram uma unidade do nível escolhido. O deslizante acompanha esse nível, percorrendo os valores existentes nos dados; em **É**, apresenta uma alça.

Os períodos rápidos continuam selecionando dias completos. O dropdown com busca é uma lista HTML e permanece dentro da área do visual. O calendário usa o popup nativo, independente dessa área. A lista solicita os segmentos adicionais ao Power BI; os limites de entrega de dados do próprio host continuam aplicáveis.

## Períodos rápidos

Um período por linha:

```
Rótulo = início .. fim
```

| Forma | Significado |
|---|---|
| `Hoje = hoje` | um dia só |
| `Últimos 7 dias = hoje-6d .. hoje` | de/até (também aceita `até` ou `;` no lugar de `..`) |
| `Geral = tudo` | limpa o filtro: todas as datas, e as novas entram sozinhas |
| `* Mês atual = inicio_mes .. hoje` | o `*` marca o período aplicado ao abrir o relatório pela primeira vez |
| `# comentário` | linha ignorada |

### Âncoras

| Âncora | Data |
|---|---|
| `hoje`, `ontem`, `amanha` | o dia (também `today`, `yesterday`, `TODAY()`) |
| `inicio_semana`, `fim_semana` | segunda a domingo (ou domingo a sábado, na opção *Semana começa na*) |
| `inicio_mes`, `fim_mes` | primeiro e último dia do mês |
| `inicio_trimestre`, `fim_trimestre` | |
| `inicio_semestre`, `fim_semestre` | |
| `inicio_ano`, `fim_ano` | |
| `min`, `max` | primeira e última data **dos dados** (respeitando os outros filtros) |
| `15/01/2026` ou `2026-01-15` | data fixa |

### Deslocamentos

Some ou subtraia depois da âncora: `d` dias, `s` semanas, `m` meses, `t` trimestres, `a` anos. Sem unidade = dias. Pode encadear (`inicio_ano-1a+14d`) e escrever por extenso (`inicio mes - 2 meses`).

Semanas, meses, trimestres e anos **mudam a referência antes** da âncora; dias são **somados depois**. Por isso:

- `fim_mes-1m` = último dia do mês passado (sempre, mesmo em meses de 28/30/31 dias)
- `inicio_mes+14d` = dia 15 do mês atual

### Variáveis próprias

Em **Formatar › Períodos rápidos › Variáveis**, uma por linha. Cada variável vira uma âncora que pode ser usada nos períodos, com os mesmos deslocamentos:

| Variável | Cria | Exemplo (hoje 22/10/2026) |
|---|---|---|
| `competencia = mensal dia 26` | `inicio_competencia`, `fim_competencia` | 26/09/2026 e 25/10/2026; a partir do dia 26/10 passa a 26/10 e 25/11 |
| `ano_fiscal = anual 01/04` | `inicio_ano_fiscal`, `fim_ano_fiscal` | 01/04/2026 e 31/03/2027 |
| `fechamento = fim_competencia-2d` | `fechamento` | 23/10/2026 (qualquer expressão; pode usar variáveis de cima) |

- **Ciclo mensal:** começa no dia escolhido e termina no dia anterior do mês seguinte. Dia 31 vira o último dia em meses curtos.
- **Ciclo anual:** começa no dia/mês escolhido e termina no dia anterior, um ano depois.
- **Nomes:** letras, números e `_`. Acentos e espaços viram letras simples e `_`. Não pode repetir nem usar o nome de uma âncora pronta.

Mês da empresa de 26 a 25:

```
# Variáveis
competencia = mensal dia 26

# Períodos
Ontem = ontem
* Mês atual = inicio_competencia .. hoje
Mês anterior = inicio_competencia-1m .. fim_competencia-1m
Geral = tudo
```

### Exemplos prontos

```
Hoje = hoje
Ontem = ontem
Últimos 7 dias = hoje-6d .. hoje
Últimos 30 dias = hoje-29d .. hoje
Semana atual = inicio_semana .. hoje
Semana passada = inicio_semana-1s .. fim_semana-1s
* Mês atual = inicio_mes .. hoje
Mês anterior = inicio_mes-1m .. fim_mes-1m
Mesmo período do mês passado = inicio_mes-1m .. hoje-1m
Trimestre atual = inicio_trimestre .. hoje
Trimestre anterior = inicio_trimestre-1t .. fim_trimestre-1t
Ano atual = inicio_ano .. hoje
Ano passado = inicio_ano-1a .. fim_ano-1a
Ano passado até hoje = inicio_ano-1a .. hoje-1a
Últimos 12 meses = inicio_mes-11m .. hoje
Últimos 30 dias de dados = max-29d .. max
Desde 2026 = 01/01/2026 .. hoje
Geral = tudo
```

Linhas com erro (de períodos ou de variáveis) são ignoradas e aparecem numa faixa vermelha no rodapé do visual, **só no modo de edição**, com o número da linha e o motivo. O guia de configuração mostra os detalhes.

## Comportamento

- **O filtro é a fonte da verdade.** O nome do período vai dentro do próprio filtro (`displaySettings.displayName`). Por isso o botão certo fica marcado:
  - na outra aba, quando o visual está em *Sincronizar segmentações*;
  - ao sair e voltar da aba;
  - em indicadores e no modo leitura.

  Se o Power BI não devolver esse nome, o visual reconhece o período pelas datas: as de hoje, ou as do dia em que ele foi aplicado.
- **Sempre há um período marcado.** Visual novo, ou filtro limpo sem um botão de "todas as datas", recebe o período padrão (`*`). O que estiver marcado quando você salva e publica é o que os usuários veem ao abrir.
- **O período continua relativo.** Escolhido "Mês atual", ao abrir o relatório em outro dia o visual recalcula as datas e reaplica o filtro, como a data relativa do segmentador nativo. Isso vale também para indicadores.
- **Digitar à mão** (ou usar o calendário/deslizante) tira o destaque dos botões e grava as datas fixas.
- **Clicar no botão ativo** limpa o filtro (dá para desligar em *Clicar no botão ativo limpa o filtro*).
- **Bloquear datas com período ativo**: as caixas e o deslizante ficam só leitura enquanto um período rápido estiver ativo. Para editar, escolha um período que limpa (Geral) ou clique de novo no botão ativo.
- **Intervalo inteiro dos dados = sem filtro.** Escolher do primeiro ao último dia equivale a limpar, para que as próximas datas carregadas apareçam.
- **Clique sem piscar.** Depois de um clique o Power BI devolve o filtro e o período gravado em duas atualizações separadas, às vezes fora de ordem. O visual mantém a escolha do usuário até as duas chegarem, e só aceita um estado diferente quando ele vem de fora (indicador, outro visual sincronizado). Uma aba sincronizada nunca reaplica o período antigo dela por cima do filtro que veio da outra aba.
- **Ao passar o mouse** num botão aparecem as datas que ele vai aplicar.

## Caixas de data

- **Digitação tolerante:** `1/10/26`, `01102026`, `01.10.2026`, `1 out 2026`, `2026-10-01`, `hoje`, `ontem`.
- **Enter** aplica, **Esc** desfaz, **↑/↓** mudam um dia.
- **Data inválida** treme a caixa em vermelho e volta ao valor anterior.
- **Ícone de calendário:** abre o calendário do próprio navegador, que pode sair dos limites do visual, como no segmentador nativo. O idioma do calendário é o do navegador/Windows.
- **Datas fora dos dados:** são limitadas à primeira e à última data do campo (opção *Limitar às datas dos dados*).

## Organização dos botões

| Organização | Como fica |
|---|---|
| Automática | lado a lado quando os botões ficam acima/abaixo; um embaixo do outro nas laterais |
| Lado a lado | em linha (com *Quebrar linha* ligado, passam para a linha de baixo quando não cabem) |
| Um embaixo do outro | em coluna |
| Grade | N colunas de mesma largura (*Colunas da grade*) |

Nas laterais, o bloco de botões fica alinhado com a linha das caixas de data (a primeira fileira de botões na mesma altura das caixas). *Largura da área nas laterais (%)* define quanto do visual fica para os botões (0 = automático, até 45%). O painel mostra só as opções que valem para a organização escolhida.

## Formatação

| Cartão | Opções |
|---|---|
| Caixas de data | formato (dd/MM/aaaa, dd/MM/aa, dd mmm aaaa, dd.MM.aaaa, MM/dd/aaaa, aaaa-MM-dd), alinhamento da data (esquerda, centro, direita), fonte, cores, arredondamento, rótulos De/Até, ícone de calendário, limitar às datas dos dados |
| Períodos rápidos | lista, variáveis, posição (abaixo, acima, esquerda, direita), organização (automática, lado a lado, um embaixo do outro, grade com N colunas), alinhamento (início, centro, fim, preencher), quebrar linha, largura da área nas laterais (%), início da semana, clique desmarca, bloquear datas, botão Limpar |
| Botões | fonte, cores normal/ativo (texto, fundo, borda), arredondamento, espaçamento, preenchimento, largura mínima |
| Guia de configuração | mostrar guia no visual (só no modo de edição) |
| Controle deslizante | mostrar, cores da trilha, do intervalo e das alças |

Título, cabeçalho, fundo, borda, sombra, tamanho e posição são os cartões padrão do Power BI (*Geral* e *Visual*).

## Comparado ao segmentador nativo (modo Entre)

| | Nativo | Este visual |
|---|---|---|
| Caixas De/Até com digitação | ✔ | ✔, mais tolerante, com ↑/↓ |
| Calendário | ✔ | ✔ (o do navegador) |
| Controle deslizante | ✔ | ✔ (pode ocultar) |
| Limites pelos dados e por outros filtros | ✔ | ✔ |
| Indicadores, filtro persistente, menu de contexto, teclado | ✔ | ✔ |
| Sincronizar segmentações | ✔ | ✔ filtro e botão marcado acompanham entre as abas |
| Períodos relativos | só "Relativo", num modo separado | ✔ botões ilimitados, configuráveis, sempre relativos |
| Período padrão ao abrir | ✗ | ✔ (`*`) |
| Bloquear datas quando um período está ativo | ✗ | ✔ |
| Posição/estilo dos botões | — | ✔ |
| Modos Lista, Suspensa, Antes de, Depois de | ✔ | ✗, use o nativo para esses casos |
| Cores automáticas do tema do relatório | ✔ | ✗, as cores são definidas no próprio visual |

## Desenvolvimento

```bash
npm install
npm test          # testes da lógica de datas e períodos
npm run package   # gera dist/*.pbiviz
npm start         # servidor de desenvolvimento (precisa de certificado: npx pbiviz install-cert)
```

- `src/periodos.ts`: linguagem dos períodos rápidos e das variáveis
- `src/guia.ts`: guia de configuração mostrado no visual
- `src/datas.ts`: cálculo, formatação e leitura de datas
- `src/visual.ts`: tela e filtro
- `src/settings.ts`: painel de formatação
- `capabilities.json`: campo e propriedades

## Validação de desenvolvimento

- `npm test`: lógica dos períodos e dos seis níveis de precisão, incluindo limites, viradas e entrada inválida.
- `npx tsc --noEmit` e `npm run lint`: tipos e análise estática.
- `npm run test:browser:build`: gera `.tmp/browser/index.html`, harness de navegador com host simulado. Sirva essa pasta via HTTP local para executar as verificações de interface, filtros emitidos, persistência, calendário, dropdown, teclado e deslizante. A importação e a apresentação do aviso no Power BI devem ser verificadas no host real.
