# Segurança

O projeto mantém a versão mais recente publicada. Ainda não existe uma linha de versões com manutenção prolongada ou certificação Microsoft declarada.

Não publique detalhes de uma vulnerabilidade não corrigida em Issues abertas. Envie uma descrição, versão afetada e passos mínimos para [lucas98balbinot@gmail.com](mailto:lucas98balbinot@gmail.com), sem dados pessoais ou credenciais de terceiros. O mantenedor avaliará o relato; não há SLA de segurança contratado.

O código atual não pede privilégios especiais no Power BI nem implementa chamadas a serviços externos. Isso não representa uma auditoria formal de segurança ou aprovação AppSource. Dependências e ambiente de execução também devem ser avaliados ao preparar uma versão.

Para verificar dependências pelo terminal:

```bash
npm audit
npm audit --omit=dev
```

Analise o resultado antes de aplicar correções. Evite `npm audit fix --force` sem revisar mudanças incompatíveis. O estado de uma auditoria é pontual e não deve ser apresentado como certificação permanente.
