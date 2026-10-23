# Checklist de submissão

## Preparação local

- [x] Fonte em `main`, preservando o GUID original.
- [x] URLs reais do repositório, suporte, manual, privacidade e termos configuradas.
- [x] Nome, resumos, descrições e três palavras-chave em português e inglês.
- [x] Política de privacidade e termos compatíveis com a licença do projeto.
- [x] Gerador de logo 300 × 300 e ícone 20 × 20 por terminal.
- [x] Dados fictícios e consulta Power Query inteiramente offline.
- [x] Scripts de validação e preparação dos pacotes de distribuição.
- [ ] Registrar e conferir o resultado atual de tipos, lint, testes, auditoria e empacotamento antes do envio.

## Evidências obrigatórias ainda dependentes do ambiente de publicação

- [ ] Salvar `demo/TempoFlex-Demo.pbix` com o visual da versão indicada em `validation.json`.
- [ ] Conferir que o PBIX abre e funciona offline, com dados incorporados.
- [ ] Capturar de uma a cinco imagens reais no Power BI; não usar as prévias ilustrativas.
- [ ] Validar Desktop, Service, redimensionamento, remoção de campos, filtros externos, teclado, persistência e calendário em visual pequeno.
- [ ] Publicar os arquivos no GitHub e conferir acesso público às URLs legais e de suporte.
- [ ] Preencher `validation.json` com evidências verdadeiras.
- [ ] Executar `npm run release:check -- --submission` sem pendências.

## Partner Center — ações do publicador

- [ ] Habilitar/validar a conta de publicador e criar oferta Power BI visual.
- [ ] Conferir identificador, categorias, mercados, contatos e idiomas.
- [ ] Revisar os contratos do portal e os termos GPL do projeto antes de aceitar qualquer acordo.
- [ ] Anexar pacote, PBIX, logo e capturas finais.
- [ ] Conferir a prévia da oferta e enviar em Review and publish.
- [ ] Acompanhar eventuais correções e aprovação da Microsoft.

Nenhuma dessas etapas do portal foi executada automaticamente. Certificação adicional não foi solicitada. O repositório permanece somente na branch `main`; caso uma futura certificação exija uma branch específica, isso deverá ser decidido separadamente.
