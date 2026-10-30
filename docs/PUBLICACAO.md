# Publicação do TempoFlex

[← README](../README.md) · [Kit AppSource](../appsource/README.md)

Repositório oficial: **[lucasmbalbinot/TempoFlex](https://github.com/lucasmbalbinot/TempoFlex)**. O código fica em `main`. GUID estável: `filtroDataPeriodoA7C31E0B5F2D4E6C9B8A`.

## 1. Conferir pelo terminal

```bash
npm ci
npm run release:prepare
```

Esse comando gera as imagens por renderização SVG, dados fictícios, executa tipos/lint/testes, compila o harness e empacota o visual. Não abre aplicativos, não faz push e não envia ofertas. Saídas da versão atual:

```text
dist/
  filtroDataPeriodoA7C31E0B5F2D4E6C9B8A.1.4.6.0.pbiviz
  TempoFlex-1.4.6-source.zip
  TempoFlex-1.4.6-publicacao.zip
  TempoFlex-1.4.6-release.json
  TempoFlex-1.4.6-SHA256SUMS.txt
```

O ZIP público contém binário, fonte correspondente, documentação, termos, mídia e um registro de pendências. Não inclui certificados, `node_modules`, `.git`, backups de recuperação ou dados reais. O arquivo de checksums permite conferir os binários que serão enviados.

`dist/` permanece ignorado pelo Git. Disponibilize os binários em Releases, mantendo o código no commit/tag correspondente.

## 2. Publicar no GitHub

As URLs do repositório já estão configuradas em `package.json` e `pbiviz.json`. Depois de revisar o commit local, o publicador pode enviar a branch:

```bash
git push origin main
```

Este comando é uma instrução para o publicador, não uma indicação de que o push já ocorreu. Confirme acesso público ao README e às URLs legais após o envio.

Para uma release da versão atual, crie uma tag no commit revisado e publique a release pelo GitHub. Use uma mensagem descritiva, por exemplo:

```bash
git tag -a v1.4.6 -m "TempoFlex 1.4.6 — kit de publicação e documentação"
git push origin v1.4.6
```

Anexe o `.pbiviz`, o ZIP de fonte correspondente, `LICENSE`, avisos de terceiros e checksums. O ZIP de publicação reúne os materiais, mas seu nome não significa que o AppSource foi aprovado.

O workflow **Preparar distribuição** pode ser iniciado manualmente na aba Actions para gerar artefatos. Ele não cria uma release, não publica no Marketplace e não aceita contratos.

## 3. URLs da oferta

| Uso | URL |
|---|---|
| Fonte | https://github.com/lucasmbalbinot/TempoFlex |
| Suporte | https://github.com/lucasmbalbinot/TempoFlex/issues |
| Manual | https://github.com/lucasmbalbinot/TempoFlex/blob/main/docs/MANUAL.md |
| Privacidade | https://github.com/lucasmbalbinot/TempoFlex/blob/main/PRIVACY.md |
| Termos e licença | https://github.com/lucasmbalbinot/TempoFlex/blob/main/TERMS.md |

Essas páginas devem estar públicas e acessíveis quando a oferta for enviada. Elas não dependem de GitHub Pages. Se o Partner Center exigir uma apresentação diferente de URL/conteúdo, ajuste o destino antes de enviar e mantenha a política coerente com o código.

## 4. Preparar o AppSource

O [kit](../appsource/README.md) contém descrições nos dois idiomas, contatos, URLs, logo e notas ao revisor. O identificador `tempoflex` em `offer.json` é uma proposta; a disponibilidade e a configuração final dependem do Partner Center.

Requisitos de mídia e configuração técnica consultados na documentação oficial em 23/10/2026:

- Logo PNG 300 × 300; de uma a cinco capturas PNG 1366 × 768, até 1024 KB por imagem. Fonte: [listagem da oferta](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/power-bi-visual-offer-listing).
- PBIX de exemplo que funcione offline e contenha a mesma versão do visual enviada no PBIVIZ. Fonte: [configuração técnica](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/power-bi-visual-technical-configuration).

As imagens `preview-*.png` são ilustrações com dimensões preparadas para revisão de layout. **Não são capturas reais e não substituem os screenshots exigidos.** O roteiro e a consulta M offline estão em [demo](../demo/README.md). Não há um PBIX falso ou um ZIP renomeado para simular o relatório.

Depois dos testes reais, preencha `appsource/validation.json` e execute:

```bash
npm run release:check -- --submission
```

O comando deve falhar enquanto faltarem PBIX, capturas e evidências do host. Ele não verifica sozinho toda a semântica interna de um PBIX; a confirmação de versão e funcionamento offline é do teste real registrado pelo publicador.

## 5. Partner Center

1. Habilite a conta de publicador no [Partner Center](https://partner.microsoft.com/dashboard).
2. Crie uma oferta do tipo Power BI visual, confira identificador, contatos, idiomas, categorias, mercados e distribuição gratuita.
3. Copie os textos dos JSONs de listagem e as URLs legais.
4. Revise a opção de contrato. Os termos do projeto mantêm GPL-3.0-only; não substitua essa licença por um contrato incompatível sem análise da escolha. Nenhum contrato padrão foi aceito automaticamente. Referência: [propriedades da oferta](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/power-bi-visual-properties).
5. Anexe PBIVIZ, PBIX, logo e capturas reais já validados.
6. Revise a prévia, salve as etapas e envie em Review and publish.
7. Acompanhe os resultados da revisão e eventuais correções.

Não há conta, oferta, submissão ou aprovação criada pelos scripts deste repositório. Não anuncie disponibilidade no AppSource antes da aprovação e da efetiva disponibilização do produto.

## 6. Publicação comum e certificação

A certificação Power BI é um processo opcional separado da publicação. Não é solicitada por este kit. Confira os [requisitos oficiais](https://learn.microsoft.com/en-us/power-bi/developer/visuals/power-bi-custom-visuals-certified) se decidir solicitá-la futuramente.

O repositório foi consolidado somente em `main`, conforme a organização adotada. Uma futura exigência de branch específica para certificação deve ser tratada separadamente; não criamos outra branch antecipadamente.

Verifique dependências com `npm audit` e registre o resultado da data da submissão. Uma auditoria sem alertas não comprova certificação. O projeto usa um override de `uuid` limitado a `sockjs` para corrigir o alerta transitivo do servidor de desenvolvimento sem rebaixar o Power BI SDK; veja o [guia de desenvolvimento](DESENVOLVIMENTO.md).

## 7. Atualizações

Preserve GUID, campos e propriedades existentes. Atualize `package.json`, `package-lock.json`, as duas versões de `pbiviz.json`, `appsource/validation.json`, changelog e exemplos de versão nos guias. Revalide o PBIX e as capturas antes de uma nova submissão. Use a oferta existente para atualizar o produto.

Fonte e binário precisam corresponder. A GPL exige cumprir as obrigações aplicáveis ao redistribuir; confira [LICENSE](../LICENSE) e os [avisos de terceiros](../THIRD_PARTY_NOTICES.md).
