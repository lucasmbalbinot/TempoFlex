# Publicar no GitHub

[← Voltar ao README](../README.md)

Nome sugerido do repositório: **`tempoflex-powerbi`**.

Descrição sugerida:

> Filtro de datas para Power BI com períodos rápidos, ciclos de competência, calendário nativo e precisão de ano a segundo. TypeScript • GPL-3.0.

Tópicos sugeridos: `powerbi`, `powerbi-custom-visual`, `date-filter`, `date-slicer`, `typescript`, `business-intelligence`.

## Antes do primeiro envio

1. Crie o repositório público no GitHub. Como README e LICENSE já existem localmente, evite gerar outros arquivos iniciais pelo site.
2. Configure a URL real em `package.json → repository.url` e `pbiviz.json → visual.gitHubUrl` e `visual.supportUrl` (este último pode apontar para Issues).
3. Confira os arquivos que serão enviados com `git status --short`. Dependências, builds, certificados e relatórios locais devem permanecer ignorados.
4. Confira README, manual, autoria e licença.
5. Siga os comandos de conexão e envio exibidos pelo GitHub para o seu repositório.

Nenhum endereço de repositório foi inventado: os campos dependem da URL que você criar. O nome comercial TempoFlex não muda o GUID do visual.

## Preparar uma versão

Atualize conjuntamente:

- `package.json` e as entradas do projeto no `package-lock.json`: três componentes, como `1.4.2`;
- `pbiviz.json`: `visual.version` e `version`, com quatro componentes, como `1.4.2.0`;
- README, changelog e exemplos de nome do pacote na documentação.

Execute:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run test:browser:build
npm run package
```

Abra o harness de navegador, confira o resultado e faça a validação no Power BI descrita no [guia de desenvolvimento](DESENVOLVIMENTO.md). A rotina de CI verifica tipos, lint, lógica e compilação do harness; não substitui os testes do host real.

## Criar a release

1. Faça commit do código correspondente à versão.
2. Crie uma tag, por exemplo `v1.4.2`, sobre esse commit.
3. Na aba Releases, crie a release a partir da tag e descreva mudanças, limitações e ambiente validado.
4. Anexe o `.pbiviz` produzido em `dist/`.
5. Anexe `LICENSE` e `THIRD_PARTY_NOTICES.md` e disponibilize o código-fonte correspondente e as instruções de build. Os arquivos Source code de uma tag pública ajudam a disponibilizar o fonte da versão; confirme que a tag contém todos os arquivos necessários.
6. Preserve e distribua os avisos de licença das dependências incorporadas quando exigidos por suas licenças.

`dist/` é ignorado de propósito: distribua binários nas Releases, sem colocá-los no histórico do código. Não use `git add -f` para certificados, dependências ou builds.

## O que a GPL exige

Uso e modificação privados são permitidos. Ao redistribuir uma versão modificada, cumpra as obrigações de fonte correspondente, avisos e licenciamento da GPL. O destinatário deve poder obter o código dessa versão; disponibilizar somente o binário ou apontar para um código que não corresponde a ele não basta.

Não é obrigatório mandar as mudanças ao projeto original nem publicá-las especificamente no GitHub. A GPL também não exige publicar qualquer alteração que permaneça privada. Veja o [texto integral](../LICENSE) e a [FAQ oficial da GNU](https://www.gnu.org/licenses/gpl-faq.html).
