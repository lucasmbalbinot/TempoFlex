import { Visual } from "../src/visual";
import * as P from "../src/precisao";

const resultado = document.getElementById("resultado");
let total = 0;
function assert(ok: boolean, msg: string): void { if (!ok) { throw new Error(msg); } total++; }
const elemento = document.createElement("div");
elemento.style.cssText = "width:600px;height:400px;border:1px solid #ccc";
document.body.appendChild(elemento);
let enviado: any;
let falha: string;
let fetches = 0;
const host: any = {
    eventService: { renderingStarted() {}, renderingFinished() {}, renderingFailed(_o: unknown, e: string) { falha = e; } },
    createSelectionManager: () => ({ showContextMenu() {} }),
    colorPalette: { isHighContrast: false }, hostCapabilities: { allowInteractions: true },
    applyJsonFilter(f: unknown) { enviado = f; }, persistProperties() {}, fetchMoreData() { fetches++; return true; },
};
const visual = new Visual({ element: elemento, host } as any);
const interno = visual as any;
const datas = ["2026-12-31T23:59:59", "2026-10-23T14:30:45", "2026-01-01T00:00:00", "2026-10-23T14:30:46"];
function atualizar(modo: string, nivel: P.Nivel, mostrar = true, filtros: unknown[] = [], segmento = false): void {
    visual.update({
        viewMode: 1, jsonFilters: filtros,
        dataViews: [{ metadata: { columns: [], ...(segmento ? { segment: {} } : {}), objects: {
            datas: { modo, nivel, mostrar }, periodos: { lista: "Hoje = hoje\nGeral = tudo" },
        } }, categorical: { categories: [{ source: { queryName: "Tabela.Data", type: { dateTime: true } }, values: datas }] } }],
    } as any);
    assert(!falha, `Erro no update: ${falha}`);
}
try {
    atualizar("entre", "dia", false);
    assert(elemento.querySelector<HTMLElement>(".fdp-datas").style.display === "none", "Ocultar caixas");
    assert(elemento.querySelector<HTMLElement>(".fdp-deslizante").style.display === "none", "Ocultar slider");
    assert(!!(visual.getFormattingModel().cards.find((c: any) => c.uid === "deslizante-card") as any).warningMessage, "Aviso no cartão");
    assert(elemento.querySelectorAll(".fdp-botao").length === 2, "Somente períodos");
    for (const nivel of ["ano", "mes", "dia", "hora", "minuto", "segundo"] as P.Nivel[]) {
        atualizar("igual", nivel);
        assert(elemento.querySelectorAll<HTMLElement>(".fdp-campo")[1].style.display === "none", "É tem só uma caixa");
        const d = new Date(2026, 9, 23, 14, 30, 45);
        interno.escolherData(true, d);
        assert(enviado.conditions[0].value === P.iso(P.inicio(d, nivel)), `Início ${nivel}`);
        assert(enviado.conditions[1].value === P.iso(P.proximo(d, nivel)), `Fim ${nivel}`);
        const guardado = JSON.parse(JSON.stringify(enviado));
        atualizar("igual", nivel, true, [guardado]);
        assert(P.formatar(interno.filtro.inicio, nivel, "dd/MM/yyyy") === P.formatar(d, nivel, "dd/MM/yyyy"), `Roundtrip ${nivel}`);
        elemento.querySelector<HTMLButtonElement>(".fdp-cal").click();
        const labels = [...elemento.querySelectorAll(".fdp-popup select")].map(e => e.getAttribute("aria-label"));
        const esperado = { ano: ["Ano"], mes: ["Ano", "Mês"], dia: ["Ano", "Mês"], hora: ["Ano", "Mês", "Hora"], minuto: ["Ano", "Mês", "Hora", "Minuto"], segundo: ["Ano", "Mês", "Hora", "Minuto", "Segundo"] };
        assert(JSON.stringify(labels) === JSON.stringify(esperado[nivel]), `Componentes do calendário ${nivel}`);
        assert(elemento.querySelectorAll(".fdp-dias button").length === (["ano", "mes"].includes(nivel) ? 0 : 31), `Dias do calendário ${nivel}`);
        interno.seletor.fechar();
    }
    atualizar("entre", "minuto");
    interno.escolherIntervalo(new Date(2026, 9, 23, 14, 30), new Date(2026, 9, 23, 14, 32));
    assert(enviado.conditions[1].value === "2026-10-23T14:33:00", "Entre inclui toda a última unidade");
    atualizar("dropdown", "mes", true, [], true);
    assert(fetches > 0, "Carregar segmentos adicionais");
    assert(elemento.querySelector<HTMLElement>(".fdp-deslizante").style.display === "none", "Dropdown oculta slider");
    elemento.querySelector<HTMLButtonElement>(".fdp-dropdown").click();
    const opcoes = () => [...elemento.querySelectorAll("[role=option]")].map(e => e.textContent);
    assert(JSON.stringify(opcoes()) === JSON.stringify(["01/2026", "10/2026", "12/2026"]), "Dropdown ordenado e sem duplicatas");
    const busca = elemento.querySelector<HTMLInputElement>("input[type=search]");
    busca.value = "10/"; busca.dispatchEvent(new Event("input"));
    assert(JSON.stringify(opcoes()) === JSON.stringify(["10/2026"]), "Busca no dropdown");
    elemento.querySelector<HTMLButtonElement>("[role=option]").click();
    assert(enviado.conditions[0].value === "2026-10-01T00:00:00" && enviado.conditions[1].value === "2026-11-01T00:00:00", "Dropdown aplica mês completo");
    atualizar("entre", "dia");
    assert(!(visual.getFormattingModel().cards.find((c: any) => c.uid === "deslizante-card") as any).warningMessage, "Aviso removido ao reativar caixas");
    atualizar("igual", "segundo");
    const texto = elemento.querySelector<HTMLInputElement>(".fdp-texto");
    texto.value = "23/10/2026 14:30:45";
    texto.dispatchEvent(new Event("input"));
    texto.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    assert(enviado.conditions[1].value === "2026-10-23T14:30:46", "Digitação com segundos");
    texto.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    texto.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    assert(enviado.conditions[0].value === "2026-10-23T14:30:46", "Setas respeitam nível");
    const range = elemento.querySelector<HTMLInputElement>(".fdp-range");
    range.value = "1"; range.dispatchEvent(new Event("input")); range.dispatchEvent(new Event("change"));
    assert(enviado.conditions[0].value === "2026-10-23T14:30:45" && enviado.conditions[1].value === "2026-10-23T14:30:46", "Deslizante no modo É");
    atualizar("entre", "minuto");
    elemento.querySelector<HTMLButtonElement>(".fdp-botao").click();
    assert(enviado.conditions[0].value.endsWith("T00:00:00") && enviado.conditions[1].value.endsWith("T00:00:00"), "Período rápido usa dias completos");
    atualizar("entre", "minuto");
    resultado.textContent = `${total} verificações passaram.\nOcultação, aviso, modos, seis calendários, filtros, roundtrip e dropdown.`;
} catch (e) { resultado.textContent = `FALHOU: ${e.stack}`; }
