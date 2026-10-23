# Como contribuir

Obrigado por ajudar a melhorar o TempoFlex. Você pode contribuir com relatos de problemas, exemplos, documentação ou código.

## Reportar um problema

Abra uma [Issue](https://github.com/lucasmbalbinot/TempoFlex/issues/new/choose) com:

- versão do TempoFlex e do Power BI Desktop/Service;
- modo de seleção e nível do filtro;
- passos para reproduzir, resultado esperado e resultado obtido;
- configuração dos períodos/variáveis, se envolvida;
- exemplo mínimo com datas fictícias e imagem sem dados confidenciais.

Antes, consulte a [solução de problemas](docs/MANUAL.md#solução-de-problemas). Informe também filtros de página ou de outros visuais que alterem o contexto.

## Sugerir uma melhoria

Explique a tarefa que você quer resolver e um exemplo de uso. Para mudanças grandes, discuta a proposta em uma Issue antes de implementar.

## Enviar código

1. Faça um fork e crie uma branch para a mudança.
2. Configure o ambiente conforme [Desenvolvimento](docs/DESENVOLVIMENTO.md).
3. Faça uma alteração com escopo claro. Preserve o calendário nativo e a compatibilidade de propriedades existentes.
4. Atualize a documentação e os testes relevantes.
5. Execute tipos, lint, testes e empacotamento. Se afetar interface/filtros, valide o harness e o Power BI quando disponível.
6. Abra um pull request explicando o problema, o comportamento resultante e como foi validado. Declare o que não conseguiu testar.

Não envie certificados, senhas, tokens, `node_modules`, `dist`, relatórios com dados reais ou arquivos temporários. Não altere o GUID do produto para uma correção da versão existente.

## Licença das contribuições

Ao enviar uma contribuição para inclusão no projeto, você concorda que ela seja disponibilizada sob `GPL-3.0-only`, conforme [LICENSE](LICENSE). Preserve os avisos de autoria e as licenças de código de terceiros. Não inclua material que você não tenha direito de compartilhar sob esses termos.

Relatos de vulnerabilidade devem seguir [SECURITY.md](SECURITY.md), sem publicação antecipada em Issues abertas. Para materiais de publicação, mantenha a distinção entre prévias e capturas reais e execute `npm run release:check`.
