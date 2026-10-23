# Notas para revisão / Reviewer notes

Rascunho para o campo de observações do Partner Center. Substitua o estado pendente por evidências reais antes do envio.

## Product

TempoFlex is a free date-filter visual by Lucas Machado Balbinot. Source: https://github.com/lucasmbalbinot/TempoFlex. License: GPL-3.0-only. Technical GUID: `filtroDataPeriodoA7C31E0B5F2D4E6C9B8A`. This submission does not request optional Power BI certification.

## Data and permissions

The visual uses a single Date/Date-Time column, without its automatic date hierarchy. No account, external service, analytics endpoint or special Power BI privilege is required by the visual code. Filter and period state are persisted through host APIs. See the privacy policy for the scope of these statements.

## Suggested test path

1. Open the offline sample report and verify its embedded visual matches the submitted package version.
2. On the overview page, choose a quick period and verify the other visuals reflect the filter.
3. Test Between and Is with day/month/year/time precision; the final unit is inclusive.
4. Open the native calendar on a small visual. Its UI is provided by the browser; there is no custom HTML calendar.
5. Test the searchable Dropdown, then hide date fields and verify quick-period-only mode.
6. Inspect the slider dependency warning with hidden date fields or Dropdown enabled.
7. Try the monthly competence and fiscal-year examples, including the in-visual configuration guide in edit mode.
8. Review the final hints/limitations page and reopen the report to test persisted settings.

## Evidence status

Offline PBIX, screenshots and Desktop/Service validation are **pending** until `validation.json` is completed. Generated marketing previews are illustrations, not Power BI screenshots. Do not submit this draft as a claim that these tests have already passed.
