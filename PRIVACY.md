# Política de privacidade / Privacy policy

**TempoFlex — Filtro de Datas · Vigência: 23 de outubro de 2026**

Responsável pelo projeto: Lucas Machado Balbinot. Contato: [lucas98balbinot@gmail.com](mailto:lucas98balbinot@gmail.com).

## Português

### Dados utilizados pelo visual

TempoFlex recebe do Power BI os valores da coluna de data associada ao visual, metadados do campo, filtros e configurações de apresentação. Esses dados são utilizados para mostrar datas disponíveis, calcular limites e períodos e aplicar a seleção ao relatório. Não é necessário criar uma conta no TempoFlex.

### Transmissão e serviços externos

O código do visual não faz chamadas a APIs, servidores de análise de uso ou serviços externos. Não enviamos os dados do relatório a um servidor do projeto. O arquivo `capabilities.json` declara uma lista vazia de privilégios especiais. O processamento do visual ocorre no ambiente do Power BI que o executa.

Esta declaração se refere ao TempoFlex, não às operações do Power BI, Microsoft, navegador ou ambiente corporativo. Hospedagem, atualização do conjunto de dados, autenticação, armazenamento do relatório e eventual telemetria do host são administrados pelos respectivos serviços e suas políticas.

### Estado e armazenamento

O visual utiliza as APIs do Power BI para aplicar filtros e persistir o nome do período selecionado e a data de referência em propriedades do relatório. Configurações e filtros podem ser salvos/restaurados pelo Power BI, inclusive por funcionalidades de persistência e indicadores do host. Não há banco de dados próprio, cookies próprios nem uso direto de `localStorage` ou `sessionStorage` pelo código do visual.

As datas disponíveis e a pesquisa do dropdown são processadas na instância do visual. A retenção do relatório e do seu estado é controlada pelo autor/administrador e pelo Power BI, não por um serviço TempoFlex.

### Suporte

Se você abrir uma Issue no GitHub, o conteúdo pode ser público e estará sujeito à política do GitHub. Envie apenas dados fictícios ou anonimizados; não inclua relatórios confidenciais, credenciais ou informações de clientes. Ao entrar em contato por e-mail, o mantenedor recebe os dados que você decidir fornecer para atender à solicitação.

### Controle dos dados e alterações da política

Para limpar a seleção, use Geral/Limpar ou os controles do Power BI. A exclusão ou alteração de dados do modelo, relatórios e dados mantidos pela Microsoft deve ser solicitada ao responsável por esse ambiente. Para questões relativas a informações enviadas ao suporte do projeto, use o contato acima.

Mudanças no comportamento do visual ou nesta política serão documentadas no repositório. Esta versão descreve o código disponibilizado em [TempoFlex](https://github.com/lucasmbalbinot/TempoFlex).

## English

**Effective October 23, 2026.** Project maintainer: Lucas Machado Balbinot; contact: [lucas98balbinot@gmail.com](mailto:lucas98balbinot@gmail.com).

TempoFlex processes the date-column values, field metadata, filters and presentation settings supplied by Power BI to display date choices, calculate periods and apply report filters. No TempoFlex account is required.

The visual code does not call external APIs, project servers, analytics or telemetry services. It does not transmit report data to a TempoFlex server. Its capabilities declare no special privileges. Processing takes place within the Power BI environment running the visual. Power BI, Microsoft, the browser and organizational services remain governed by their own policies.

The visual applies filters and persists the selected period name and reference date through Power BI APIs. The host may save and restore report properties, settings and filters. The visual code does not directly use cookies, localStorage, sessionStorage or a project database. Report retention is controlled by the report owner and Power BI.

GitHub Issues may be public. Share only synthetic or anonymized examples, never confidential reports or credentials. If you contact support by email, the maintainer receives the information you choose to provide to handle your request. Contact the maintainer about information sent to project support; contact your report administrator or Microsoft about data stored in their environment.

Material changes will be documented in the repository. This policy describes the software published at [TempoFlex](https://github.com/lucasmbalbinot/TempoFlex).
