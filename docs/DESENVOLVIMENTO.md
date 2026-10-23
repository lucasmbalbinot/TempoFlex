# Desenvolvimento

[← Voltar ao README](../README.md)

## Ambiente

O projeto foi compilado com **Node.js 24** e npm. As versões exatas das dependências ficam em `package-lock.json`. A API do visual é 5.11.1 e o Power BI Visuals Tools utilizado é 7.2.1.

Use um clone do repositório e execute na raiz:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run package
```

`npm ci` instala o lockfile sem atualizá-lo. `npm run package` gera o `.pbiviz` em `dist/`; essa pasta não é versionada. O nome do arquivo usa o GUID técnico, que é preservado para compatibilidade:

```text
dist/filtroDataPeriodoA7C31E0B5F2D4E6C9B8A.1.4.3.0.pbiviz
```

## Comandos

| Comando | Finalidade |
|---|---|
| `npm ci` | Instalação reproduzível |
| `npm run assets:build` | Renderiza PNGs e dados de demonstração via terminal |
| `npm run release:check` | Confere metadados, mídia e pendências |
| `npm run release:prepare` | Testa, compila e gera ZIPs, fonte e checksums |
| `npm run typecheck` | Verificação TypeScript sem emitir arquivos |
| `npm run lint` | ESLint e regras de visuais Power BI |
| `npm test` | Lógica de períodos, variáveis, datas e precisão |
| `npm run test:browser:build` | Compila o harness de testes de interface |
| `npm run package` | Empacota o visual |
| `npm start` | Inicia o servidor de desenvolvimento do pbiviz |

## Testes de navegador

```bash
npm run test:browser:build
python -m http.server 8765 --bind 127.0.0.1 --directory .tmp/browser
```

O servidor de exemplo requer Python 3; pode ser substituído por outro servidor HTTP local. Abra:

- [Harness de testes](http://127.0.0.1:8765/): executa as verificações e mostra o resultado.
- [Iframe compacto](http://127.0.0.1:8765/frame.html): reduz o visual a 400 × 65 px para verificar a abertura do calendário nativo.

Encerre o servidor com Ctrl+C. Ele só escuta em `127.0.0.1`.

O harness usa os componentes reais e um host Power BI simulado. Verifica visibilidade, aviso de dependência, filtros emitidos, restauração, seletores nativos, dropdown, teclado e deslizante. Não comprova o funcionamento de toda a integração Desktop/Service. O comando `test:browser:build` apenas compila os testes: é preciso abrir a página e conferir o resultado.

O popup nativo pode não aparecer em capturas feitas apenas da superfície da página, pois pertence a outra camada do navegador. Confira-o também visualmente no host real.

## Desenvolvimento dentro do Power BI

Para `npm start`, o ambiente deve aceitar o certificado de desenvolvimento do pbiviz. As instruções oficiais estão em [Configurar o ambiente de desenvolvimento](https://learn.microsoft.com/power-bi/developer/visuals/environment-setup).

```bash
npx pbiviz install-cert
npm start
```

O comando de certificado instala confiança local e pode pedir intervenção do sistema. Não copie certificados ou senhas para o repositório. O `.gitignore` exclui chaves e certificados.

## Estrutura

```text
assets/icon.png              Ícone de importação do visual
src/visual.ts                Interface, estado e aplicação dos filtros
src/settings.ts              Painel de formatação
src/datas.ts                 Operações de dia e leitura tolerante
src/precisao.ts              Ano, mês, dia, hora, minuto e segundo
src/periodos.ts              Expressões, períodos e variáveis
src/seletor.ts               Dropdown com busca (não é calendário)
src/guia.ts                  Guia dentro do visual
style/visual.less            Estilos
test/                       Testes e host simulado
docs/                       Manual, imagens e guias
capabilities.json            Campo de data e propriedades persistidas
pbiviz.json                  Identidade técnica, autor e versão
```

## Regras de implementação

- Preserve o calendário nativo e o clique no input real. Um calendário HTML é cortado pelo iframe e não é substituto equivalente.
- Preserve o GUID ao atualizar o mesmo produto. Alterá-lo cria outra identidade de visual no Power BI.
- Novas propriedades de formatação precisam existir tanto em `settings.ts` quanto em `capabilities.json`.
- Mantenha compatibilidade com relatórios que não têm as novas propriedades gravadas.
- O limite final do filtro é exclusivo; não troque por meia-noite do último dia.
- Períodos rápidos usam dias completos; seleção manual respeita o nível configurado.
- Não adicione chamadas de rede ou novas permissões sem documentar a mudança.
- Atualize o manual e inclua testes úteis quando alterar a lógica de filtros ou a linguagem.

## Verificação no Power BI antes de uma release

Confira campo com data e com data/hora; Entre/É/Dropdown; seis níveis; caixas ocultas; slider ligado sem caixas; calendário num visual pequeno; bloqueio por período; limpeza; padrão; filtros externos; reabertura; indicadores; sincronização; tema/alto contraste e ausência de dados.

O empacotador informa recursos opcionais não declarados, incluindo bookmarks, localização e tooltips. Leia os avisos e não apresente esses cenários como certificados apenas porque o build concluiu.

## Kit de publicação por terminal

Os scripts de `scripts/` não iniciam aplicativos e não controlam a interface do computador. `@resvg/resvg-js` renderiza os vetores em PNG e `jszip` monta os arquivos de distribuição. São dependências de desenvolvimento; não são importadas pelo visual.

`release:prepare` executa a sequência de validação, gera o PBIVIZ e dois ZIPs, registra SHA-256 e lista pendências. O fonte correspondente exclui certificados, relatórios binários e arquivos locais de recuperação. Para preparar uma submissão sem pendências, use `npm run release:prepare -- --submission`; esse modo exige o PBIX e evidências do host real.

O estado auditável fica em `appsource/validation.json`. Não marque testes como concluídos sem executá-los. Não renomeie prévias ilustrativas para simular screenshots do Power BI.

## Licenças e dependências

O projeto usa `GPL-3.0-only`. As bibliotecas conservam suas licenças; os avisos das dependências diretas estão em [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). Consulte o `LICENSE`/`NOTICE` de cada dependência ao redistribuir bundles. O `package-lock.json` registra a árvore utilizada; não substitui os avisos legais que precisarem acompanhar a distribuição.

## Override do servidor de desenvolvimento

A árvore do Power BI Visuals Tools 7.2.1 usa `sockjs`, que importava `uuid` 8.3.2. O alerta [GHSA-w5hq-g745-h8pq](https://github.com/uuidjs/uuid/security/advisories/GHSA-w5hq-g745-h8pq) foi corrigido na linha 11 em 11.1.1. O override `sockjs → uuid: 11.1.1` preserva a API CommonJS `require('uuid').v4` utilizada pelo SockJS e evita o downgrade incompatível do SDK sugerido pelo audit fix forçado. A importação CommonJS e a criação do servidor SockJS foram verificadas, além do empacotamento. A alteração afeta ferramentas de desenvolvimento, não o código importado pelo visual.

Execute `npm audit` de novo antes de cada publicação; a base de alertas muda. Não remova o override sem conferir a resolução efetiva no lockfile e repetir as verificações.
