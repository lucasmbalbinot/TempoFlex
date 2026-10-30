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
function atualizar(modo: string, nivel: P.Nivel, mostrar = true, filtros: unknown[] = [], segmento = false, periodo?: string): void {
    visual.update({
        viewMode: 1, jsonFilters: filtros,
        dataViews: [{ metadata: { columns: [], ...(segmento ? { segment: {} } : {}), objects: {
            datas: { modo, nivel, mostrar }, periodos: { lista: "Hoje = hoje\nOntem = ontem\nGeral = tudo" },
            estado: periodo === undefined ? {} : { periodo, aplicadoEm: "2026-10-30" },
        } }, categorical: { categories: [{ source: { queryName: "Tabela.Data", type: { dateTime: true } }, values: datas }] } }],
    } as any);
    assert(!falha, `Erro no update: ${falha}`);
}
try {
    atualizar("entre", "dia", false);
    assert(elemento.querySelector<HTMLElement>(".fdp-datas").style.display === "none", "Ocultar caixas");
    assert(elemento.querySelector<HTMLElement>(".fdp-deslizante").style.display === "none", "Ocultar slider");
    assert(!!(visual.getFormattingModel().cards.find((c: any) => c.uid === "deslizante-card") as any).warningMessage, "Aviso no cartão");
    assert(elemento.querySelectorAll(".fdp-botao").length === 3, "Somente períodos");
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
        const nativo = elemento.querySelector<HTMLInputElement>(".fdp-nativo");
        const tipos = { ano: "date", mes: "month", dia: "date", hora: "datetime-local", minuto: "datetime-local", segundo: "datetime-local" };
        assert(nativo.type === tipos[nivel], `Seletor nativo ${nivel}`);
        assert(nativo.step === (nivel === "hora" ? "3600" : nivel === "minuto" ? "60" : "1"), `Passo nativo ${nivel}`);
        assert(!elemento.querySelector(".fdp-dias"), "Sem calendário HTML próprio");
        nativo.value = nivel === "mes" ? "2026-10" : ["ano", "dia"].includes(nivel) ? "2026-10-23" : "2026-10-23T14:30:45";
        nativo.dispatchEvent(new Event("change"));
        assert(enviado.conditions[0].value === P.iso(P.inicio(d, nivel)), `Seleção nativa ${nivel}`);
        assert(enviado.conditions[1].value === P.iso(P.proximo(d, nivel)), `Limite da seleção nativa ${nivel}`);
    }
    atualizar("entre", "minuto");
    // A edição perde o foco no mousedown: o botão precisa sobreviver ao redraw
    // para que o mouseup complete o clique no mesmo elemento.
    interno.pendente = null;
    atualizar("entre", "dia", true, [], false, "Geral");
    const botao = (rotulo: string) => [...elemento.querySelectorAll<HTMLButtonElement>(".fdp-botao")].find(b => b.dataset.rotulo === rotulo);
    const hoje = botao("Hoje");
    const editando = elemento.querySelector<HTMLInputElement>(".fdp-texto");
    editando.value = "23/10/2026";
    editando.dispatchEvent(new Event("input"));
    hoje.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    editando.dispatchEvent(new Event("blur"));
    assert(botao("Hoje") === hoje && hoje.isConnected, "Blur preserva botão pressionado");
    atualizar("entre", "dia", true, [], false, "Geral");
    assert(botao("Hoje") === hoje, "Update do host preserva botão pressionado");
    hoje.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    hoje.click();
    const filtroHoje = JSON.parse(JSON.stringify(enviado));
    assert(botao("Hoje").getAttribute("aria-pressed") === "true", "Primeiro clique marca Hoje");
    atualizar("entre", "dia", true, [filtroHoje], false, "Geral");
    atualizar("entre", "dia", true, [], false, "Geral");
    assert(botao("Hoje").getAttribute("aria-pressed") === "true", "Filtro confirmado antes da propriedade não perde seleção");
    atualizar("entre", "dia", true, [], false, "Hoje");
    assert(botao("Hoje").getAttribute("aria-pressed") === "true", "Propriedade confirmada antes do filtro não perde seleção");
    atualizar("entre", "dia", true, [filtroHoje], false, "Hoje");
    assert(interno.pendente === null, "Confirmação das duas partes conclui sincronização");
    botao("Ontem").click();
    const filtroOntem = JSON.parse(JSON.stringify(enviado));
    atualizar("entre", "dia", true, [filtroHoje], false, "Hoje");
    assert(botao("Ontem").getAttribute("aria-pressed") === "true", "Troca em um clique resiste ao estado anterior");
    atualizar("entre", "dia", true, [filtroOntem], false, "Ontem");
    botao("Geral").click();
    atualizar("entre", "dia", true, [filtroOntem], false, "Geral");
    assert(botao("Geral").getAttribute("aria-pressed") === "true", "Limpeza em um clique resiste ao filtro atrasado");
    atualizar("entre", "dia", true, [], false, "Geral");
    assert(!elemento.querySelector(".fdp-popup button:not([role=option]), .fdp-dias, .fdp-calendario, [role=grid]"), "Nenhuma grade de calendário customizado");
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
    if (location.search.includes("compact")) {
        atualizar("entre", "dia");
        elemento.style.cssText = "width:400px;height:60px";
        document.querySelector("h1").style.display = "none";
        resultado.style.display = "none";
        document.body.style.margin = "0";
    }
    resultado.textContent = `${total} verificações passaram.\nOcultação, aviso, modos, seletores nativos, filtros, roundtrip e dropdown.`;
} catch (e) { resultado.textContent = `FALHOU: ${e.stack}`; }
