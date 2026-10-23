# Kit de publicação AppSource

Este diretório contém os materiais da oferta TempoFlex. **Não significa que a oferta foi enviada, aprovada ou certificada.**

## Arquivos

| Material | Local / situação |
|---|---|
| Campos da oferta e URLs | [offer.json](offer.json) |
| Nome, resumo, descrição e palavras-chave | [pt-BR](listing.pt-BR.json) / [en-US](listing.en-US.json) |
| Logo PNG 300 × 300 | `media/logo-300x300.png`, gerado por `npm run assets:build` |
| Prévia ilustrativa 1366 × 768 | `media/preview-01.png` a `preview-05.png` |
| Capturas reais para envio | [screenshots/README.md](screenshots/README.md), pendentes |
| Notas ao revisor | [REVIEWER_NOTES.md](REVIEWER_NOTES.md) |
| Evidências de teste no host | [validation.json](validation.json), pendentes |
| Dados e consulta M para relatório offline | [demo](../demo/README.md) |
| PBIVIZ e fonte correspondente | `dist/`, após `npm run release:prepare` |
| Checklist | [CHECKLIST.md](CHECKLIST.md) |

As prévias são ilustrações, marcadas como tal, **não capturas do Power BI**. Não devem ser enviadas no campo Screenshots do Partner Center no lugar de capturas reais.

## Comandos

```bash
npm ci
npm run assets:build
npm run release:check
npm run release:prepare
```

O último comando compila, testa, empacota e gera os ZIPs em `dist/`. Não abre aplicativos, não envia arquivos para serviços e não faz push.

Quando o relatório offline e as capturas reais estiverem prontos:

```bash
npm run release:check -- --submission
```

Essa modalidade bloqueia o envio enquanto faltarem PBIX, capturas e evidências. Um resultado positivo é uma conferência de arquivos e declarações de validação, não aprovação da Microsoft.

## Fontes oficiais verificadas em 23/10/2026

- [Listagem e mídia](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/power-bi-visual-offer-listing): logo PNG de 300 × 300; 1 a 5 capturas PNG de exatamente 1366 × 768, até 1024 KB; descrição de até 3.000 caracteres e até três palavras-chave.
- [Configuração técnica](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/power-bi-visual-technical-configuration): relatório PBIX offline com a mesma versão do visual e pacote PBIVIZ com metadados.
- [Propriedades e contratos](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/power-bi-visual-properties): URLs de privacidade, suporte e termos. O material deste projeto mantém a GPL; nenhum contrato do portal foi aceito automaticamente.
- [Testes de submissão](https://learn.microsoft.com/en-us/power-bi/developer/visuals/submission-testing): referência para testes no Desktop/Service.
- [Certificação opcional](https://learn.microsoft.com/en-us/power-bi/developer/visuals/power-bi-custom-visuals-certified): processo distinto da publicação comum.

As exigências podem mudar. Confira o Partner Center antes do envio e utilize o [guia de publicação](../docs/PUBLICACAO.md).
