"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { AdvancedFilter, IAdvancedFilter, IFilterColumnTarget } from "powerbi-models";
import "./../style/visual.less";

import * as D from "./datas";
import * as P from "./precisao";
import { Seletor } from "./seletor";
import { ConfiguracaoVisual } from "./settings";
import { calcular, lerPeriodos, lerVariaveis, ErroPeriodo, Intervalo, Periodo, Variaveis } from "./periodos";
import { montarGuia } from "./guia";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import FilterAction = powerbi.FilterAction;

/** Valor gravado em `estado.periodo` quando o filtro foi limpo ou as datas foram escolhidas à mão. */
const SEM_PERIODO = "-";
const MANUAL = "#manual";

function iconeCalendario(): SVGSVGElement {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("overflow", "visible");
    const add = (tag: string, attrs: Record<string, string>) => {
        const e = document.createElementNS(ns, tag);
        for (const [k, v] of Object.entries(attrs)) {
            e.setAttribute(k, v);
        }
        svg.appendChild(e);
    };
    // contorno com a mesma espessura nos quatro lados, dentro da área de 16x16 (sem encostar nas bordas)
    const traco = { fill: "none", stroke: "currentColor", "stroke-width": "1.3", "stroke-linecap": "round" };
    add("rect", { x: "2", y: "3", width: "12", height: "11", rx: "1.5", ...traco });
    add("path", { d: "M2 6.5h12M5 1.6v2.6M11 1.6v2.6", ...traco });
    for (const [x, y] of [[4.3, 8.3], [7.3, 8.3], [10.3, 8.3], [4.3, 11], [7.3, 11]]) {
        add("rect", { x: String(x), y: String(y), width: "1.6", height: "1.6", fill: "currentColor" });
    }
    return svg;
}

interface Caixa {
    campo: HTMLElement;
    rotulo: HTMLElement;
    texto: HTMLInputElement;
    calendario: HTMLElement;
    nativo: HTMLInputElement;
}

export class Visual implements IVisual {
    private host: IVisualHost;
    private eventos: IVisualEventService;
    private selecao: ISelectionManager;
    private servicoFormato = new FormattingSettingsService();
    private cfg: ConfiguracaoVisual;

    private raiz: HTMLElement;
    private areaDatas: HTMLElement;
    private seletor: Seletor;
    private valores: Date[] = [];
    private passosDatas: number[] = [];
    private separador: HTMLElement;
    private dropdown: HTMLButtonElement;
    private dadosIncompletos = false;
    private linhaDatas: HTMLElement;
    private caixaIni: Caixa;
    private caixaFim: Caixa;
    private deslizante: HTMLElement;
    private faixa: HTMLElement;
    private rangeIni: HTMLInputElement;
    private rangeFim: HTMLInputElement;
    private areaBotoes: HTMLElement;
    private aviso: HTMLElement;
    private vazio: HTMLElement;

    private alvo: IFilterColumnTarget | null = null;
    private min: Date | null = null;
    private max: Date | null = null;
    private filtro: Intervalo | null = null;       // o que está aplicado no relatório
    private periodoAtivo: string | undefined;       // período que está valendo (resolvido em resolverPeriodo)
    private rotuloFiltro: string | undefined;       // nome do período que veio dentro do filtro
    private estadoPeriodo: string | undefined;      // último período gravado neste visual
    private estadoData: Date | null = null;         // dia em que esse período foi aplicado
    private periodos: Periodo[] = [];
    private erros: ErroPeriodo[] = [];
    private errosVariaveis: ErroPeriodo[] = [];
    private variaveis: Variaveis | undefined;
    private guia: HTMLElement;
    private edicao = false;
    private ultimoAplicado = "";
    /**
     * Última escolha feita no visual, enquanto o Power BI ainda não devolveu o estado novo.
     * Depois de um clique chegam duas atualizações separadas (filtro e período gravado), às vezes
     * fora de ordem; sem isto, uma atualização com o estado antigo desmarcava o botão clicado.
     */
    private pendente: {
        filtro: Intervalo | null;
        periodo: string;
        filtrosAntigos: (Intervalo | null)[];      // estados anteriores ao clique (atrasados se voltarem)
        periodosAntigos: (string | undefined)[];
    } | null = null;
    private filtroHost: Intervalo | null = null;          // último estado recebido do Power BI
    private periodoHost: string | undefined;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.eventos = options.host.eventService;
        this.selecao = options.host.createSelectionManager();
        this.raiz = document.createElement("div");
        this.raiz.className = "fdp";
        options.element.appendChild(this.raiz);
        this.montar();
        this.raiz.addEventListener("contextmenu", e => {
            this.selecao.showContextMenu({}, { x: e.clientX, y: e.clientY });
            e.preventDefault();
        });
    }

    // ------------------------------------------------------------------ estrutura fixa
    private el<K extends keyof HTMLElementTagNameMap>(tag: K, classe: string, pai?: HTMLElement): HTMLElementTagNameMap[K] {
        const e = document.createElement(tag);
        e.className = classe;
        if (pai) {
            pai.appendChild(e);
        }
        return e;
    }

    private montar(): void {
        this.vazio = this.el("div", "fdp-vazio", this.raiz);
        this.areaDatas = this.el("div", "fdp-datas", this.raiz);
        this.linhaDatas = this.el("div", "fdp-linha", this.areaDatas);
        this.caixaIni = this.montarCaixa("Data inicial", true);
        this.separador = this.el("span", "fdp-sep", this.linhaDatas);
        this.separador.textContent = "–";
        this.caixaFim = this.montarCaixa("Data final", false);
        this.seletor = new Seletor(this.raiz);
        this.dropdown = this.el("button", "fdp-campo fdp-dropdown", this.linhaDatas);
        this.dropdown.type = "button";
        this.dropdown.setAttribute("aria-haspopup", "listbox");
        this.dropdown.setAttribute("aria-label", "Selecionar data");
        this.dropdown.addEventListener("click", () => this.seletor.dropdown(this.dropdown, this.valores, this.nivel(), this.formato(),
            this.filtro && this.filtro.inicio, d => this.escolherIntervalo(d, d),
            this.dadosIncompletos ? "Lista parcial: aguardando mais dados do Power BI ou limite de carregamento atingido." : ""));

        this.deslizante = this.el("div", "fdp-deslizante", this.areaDatas);
        this.el("div", "fdp-trilha", this.deslizante);
        this.faixa = this.el("div", "fdp-faixa", this.deslizante);
        this.rangeIni = this.el("input", "fdp-range", this.deslizante);
        this.rangeFim = this.el("input", "fdp-range", this.deslizante);
        for (const r of [this.rangeIni, this.rangeFim]) {
            r.type = "range";
            r.min = "0";
            r.step = "1";
            r.addEventListener("input", () => this.moverDeslizante(r === this.rangeIni));
            r.addEventListener("change", () => this.soltarDeslizante());
        }
        this.rangeIni.setAttribute("aria-label", "Data inicial");
        this.rangeFim.setAttribute("aria-label", "Data final");

        this.areaBotoes = this.el("div", "fdp-botoes", this.raiz);
        this.aviso = this.el("div", "fdp-aviso", this.raiz);
        this.guia = this.el("div", "fdp-guia", this.raiz);
    }

    private montarCaixa(nome: string, inicio: boolean): Caixa {
        const campo = this.el("div", "fdp-campo", this.linhaDatas);
        const rotulo = this.el("span", "fdp-rotulo", campo);
        const texto = this.el("input", "fdp-texto", campo);
        texto.type = "text";
        texto.setAttribute("aria-label", nome);
        texto.autocomplete = "off";
        texto.spellcheck = false;
        const calendario = this.el("span", "fdp-cal", campo);
        calendario.appendChild(iconeCalendario());
        // O input real recebe o clique: o popup do navegador pode ultrapassar o iframe do visual.
        // Não chamar showPicker(): dentro de iframe de outra origem ele pode ser bloqueado.
        const nativo = this.el("input", "fdp-nativo", calendario);
        nativo.type = "date";
        nativo.setAttribute("aria-label", `${nome} (calendário)`);
        nativo.addEventListener("change", () => {
            if (nativo.disabled || !nativo.value) { return; }
            const valor = nativo.type === "month" ? `${nativo.value}-01` : nativo.value;
            const d = P.deValor(valor);
            if (d) { this.escolherData(inicio, P.inicio(d, this.nivel())); }
        });

        texto.addEventListener("input", () => { texto.dataset.editando = "1"; });
        texto.addEventListener("keydown", e => {
            if (texto.readOnly) { return; }
            if (e.key === "Enter") {
                this.confirmarDigitacao(inicio, texto);
                texto.select();
            } else if (e.key === "Escape") {
                delete texto.dataset.editando;
                this.mostrarDatas();
                texto.select();
            } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                const atual = P.interpretar(texto.value, this.nivel(), this.formato()) || (inicio ? this.iniVisivel() : this.fimVisivel());
                if (atual) {
                    texto.value = this.formatar(P.proximo(atual, this.nivel(), e.key === "ArrowUp" ? 1 : -1));
                    texto.dataset.editando = "1";
                }
                e.preventDefault();
            }
        });
        texto.addEventListener("blur", () => this.confirmarDigitacao(inicio, texto));
        texto.addEventListener("focus", () => texto.select());
        return { campo, rotulo, texto, calendario, nativo };
    }

    // ------------------------------------------------------------------ atualização
    public update(options: VisualUpdateOptions): void {
        this.eventos.renderingStarted(options);
        try {
            const dv = options.dataViews && options.dataViews[0];
            this.cfg = this.servicoFormato.populateFormattingSettingsModel(ConfiguracaoVisual, dv);
            this.edicao = options.viewMode === powerbi.ViewMode.Edit;
            const cat = dv && dv.categorical && dv.categorical.categories && dv.categorical.categories[0];
            if (!cat) {
                this.mostrarVazio("Arraste um campo de data para o campo Data do visual.");
            } else if (!cat.source.type || !cat.source.type.dateTime) {
                this.mostrarVazio("Use um campo do tipo data. Se aparecer a hierarquia, clique na seta do campo e escolha o nome do campo.");
            } else {
                this.lerDados(cat, dv, options);
                if (!this.pendente) {
                    this.aplicarPeriodoGuardado();
                }
                this.desenhar();
            }
            this.eventos.renderingFinished(options);
        } catch (erro) {
            this.eventos.renderingFailed(options, String(erro));
        }
    }

    private lerDados(cat: powerbi.DataViewCategoryColumn, dv: powerbi.DataView, options: VisualUpdateOptions): void {
        this.seletor.fechar();
        this.vazio.style.display = "none";
        this.raiz.classList.remove("fdp-sem-dados");
        let min: Date | null = null;
        let max: Date | null = null;
        this.valores = [];
        for (const v of cat.values) {
            const d = P.deValor(v);
            if (d) { this.valores.push(d); }
            if (d) {
                min = !min || d < min ? d : min;
                max = !max || d > max ? d : max;
            }
        }
        this.passosDatas = [...new Set(this.valores.map(d => +P.inicio(d, this.nivel())))].sort((a, b) => a - b);
        this.min = min;
        this.max = max;
        this.dadosIncompletos = !!dv.metadata.segment;
        if (this.dadosIncompletos) { this.host.fetchMoreData(true); }
        this.alvo = this.alvoDoCampo(cat.source);

        this.filtro = null;
        this.rotuloFiltro = undefined;
        const filtros = options.jsonFilters || [];
        for (const f of filtros as IAdvancedFilter[]) {
            if (f && f.conditions) {
                this.rotuloFiltro = f.displaySettings && f.displaySettings.displayName || undefined;
                let ini: Date | null = null;
                let fimExclusivo: Date | null = null;
                for (const c of f.conditions) {
                    const d = P.deValor(c.value);
                    if (c.operator === "GreaterThanOrEqual" || c.operator === "GreaterThan") {
                        ini = d && c.operator === "GreaterThan" ? new Date(+d + 1) : d;
                    } else if (c.operator === "LessThan" || c.operator === "LessThanOrEqual") {
                        fimExclusivo = d && c.operator === "LessThanOrEqual" ? new Date(+d + 1) : d;
                    }
                }
                if (ini || fimExclusivo) {
                    this.filtro = {
                        inicio: ini || min || fimExclusivo,
                        fim: fimExclusivo ? new Date(+fimExclusivo - 1) : (max || ini),
                    };
                }
            }
        }

        const vars = lerVariaveis(this.cfg.periodos.variaveis.value);
        this.variaveis = vars.variaveis;
        this.errosVariaveis = vars.erros;
        const lidos = lerPeriodos(this.cfg.periodos.lista.value, this.variaveis);
        this.periodos = this.cfg.periodos.mostrar.value ? lidos.periodos : [];
        this.erros = lidos.erros;

        const objetos = dv.metadata && dv.metadata.objects;
        const estado = objetos && objetos["estado"];
        this.estadoPeriodo = estado && typeof estado["periodo"] === "string" ? estado["periodo"] as string : undefined;
        this.estadoData = estado && typeof estado["aplicadoEm"] === "string" ? D.deIso(estado["aplicadoEm"] as string) : null;
        this.periodoAtivo = this.resolverPeriodo();

        this.conciliarPendente();
    }

    /**
     * Qual período está valendo. O filtro é a fonte da verdade: ele é o que sincroniza entre abas,
     * vai nos indicadores e continua igual no modo leitura. A ordem é:
     *  1. o nome do período que veio dentro do filtro;
     *  2. um período cujas datas de hoje batem com o filtro (o gravado neste visual tem preferência);
     *  3. o período gravado, se o filtro são as datas dele no dia em que foi aplicado (ex.: "Mês atual" de ontem);
     *  4. senão, datas escolhidas à mão.
     */
    private resolverPeriodo(): string {
        const ctx = this.contexto();
        if (!this.filtro) {
            const tudo = this.periodos.filter(p => p.tudo);
            const gravado = tudo.find(p => p.rotulo === this.estadoPeriodo);
            return gravado ? gravado.rotulo : tudo.length ? tudo[0].rotulo : SEM_PERIODO;
        }
        if (this.rotuloFiltro === MANUAL) {
            return MANUAL;
        }
        const doFiltro = this.periodos.find(p => !p.tudo && p.rotulo === this.rotuloFiltro);
        if (doFiltro) {
            return doFiltro.rotulo;
        }
        const batem = this.periodos.filter(p => !p.tudo && this.mesmoPeriodo(calcular(p, ctx), this.filtro));
        if (batem.length) {
            const gravado = batem.find(p => p.rotulo === this.estadoPeriodo);
            return (gravado || batem[0]).rotulo;
        }
        const gravado = this.periodos.find(p => !p.tudo && p.rotulo === this.estadoPeriodo);
        if (gravado) {
            // dia em que foi aplicado; relatórios antigos não gravavam: procura no último ano
            const dias = this.estadoData ? [this.estadoData] : Array.from({ length: 370 }, (_, i) => D.somarDias(ctx.hoje, -1 - i));
            if (dias.some(dia => this.mesmoPeriodo(calcular(gravado, { ...ctx, hoje: dia }), this.filtro))) {
                return gravado.rotulo;
            }
        }
        return MANUAL;
    }

    /**
     * Enquanto o Power BI não confirma a última escolha, vale o que o usuário escolheu.
     * Cada parte (filtro e período) que ainda chega igual a antes do clique é considerada atrasada;
     * se chegar diferente das duas (ex.: um indicador foi aplicado), o Power BI manda.
     */
    private conciliarPendente(): void {
        this.filtroHost = this.filtro;
        this.periodoHost = this.estadoPeriodo;
        const p = this.pendente;
        if (!p) {
            return;
        }
        const filtroOk = this.mesmoIntervalo(this.filtro, p.filtro);
        // resolverPeriodo pode inferir o botão pelas datas antes de persistProperties
        // ser confirmado. Só encerra a espera quando a propriedade também chegou.
        const periodoOk = this.periodoAtivo === p.periodo && this.estadoPeriodo === p.periodo;
        if (filtroOk && periodoOk) {
            this.pendente = null;
            return;
        }
        const filtroAtrasado = !filtroOk && p.filtrosAntigos.some(f => this.mesmoIntervalo(this.filtro, f));
        const periodoAtrasado = !periodoOk && (this.estadoPeriodo === p.periodo || p.periodosAntigos.includes(this.estadoPeriodo));
        if ((filtroOk || filtroAtrasado) && (periodoOk || periodoAtrasado)) {
            this.filtro = p.filtro;
            this.periodoAtivo = p.periodo;
        } else {
            this.pendente = null;
        }
    }

    private alvoDoCampo(fonte: powerbi.DataViewMetadataColumn): IFilterColumnTarget | null {
        const nome = fonte.queryName || "";
        const ponto = nome.indexOf(".");
        if (ponto <= 0) {
            return null;
        }
        return { table: nome.slice(0, ponto), column: nome.slice(ponto + 1) };
    }

    /**
     * - Sem filtro e sem botão para "todas as datas" (ou visual novo): aplica o período padrão (*),
     *   para nunca ficar sem período marcado.
     * - Com um período ativo: recalcula as datas (ex.: "Mês atual" vira o mês corrente ao abrir em outro dia).
     */
    private aplicarPeriodoGuardado(): void {
        if (!this.filtro) {
            const padrao = this.periodos.find(p => p.padrao);
            const temTudo = this.periodos.some(p => p.tudo);
            if (padrao && !padrao.tudo && (this.estadoPeriodo === undefined || !temTudo)) {
                this.escolherPeriodo(padrao);
            }
            return;
        }
        const p = this.periodos.find(x => x.rotulo === this.periodoAtivo);
        if (!p || p.tudo) {
            return;
        }
        const r = calcular(p, this.contexto());
        if (r && !this.mesmoPeriodo(r, this.filtro)) {
            this.aplicar(r.inicio, r.fim, p.rotulo);
        }
    }

    // ------------------------------------------------------------------ filtro
    private contexto() {
        return {
            hoje: D.hoje(), min: this.min, max: this.max, variaveis: this.variaveis,
            primeiroDiaSemana: +(this.cfg.periodos.primeiroDiaSemana.value.value),
        };
    }

    private formato(): string {
        return String(this.cfg.datas.formato.value.value);
    }

    private mesmoPeriodo(a: Intervalo | null, b: Intervalo | null): boolean {
        return !!a && !!b && +D.inicioDoDia(a.inicio) === +b.inicio && +D.somarDias(a.fim, 1) - 1 === +b.fim;
    }

    private mesmoIntervalo(a: Intervalo | null, b: Intervalo | null): boolean {
        if (!a || !b) {
            return a === b;
        }
        return +a.inicio === +b.inicio && +a.fim === +b.fim;
    }

    private nivel(): P.Nivel { return String(this.cfg.datas.nivel.value.value) as P.Nivel; }

    private formatar(d: Date | null): string { return P.formatar(d, this.nivel(), this.formato()); }

    private aplicar(ini: Date, fim: Date, periodo: string): void {
        if (!this.alvo) {
            return;
        }
        if (fim < ini) {
            [ini, fim] = [fim, ini];
        }
        // Períodos rápidos continuam cobrindo dias inteiros, independentemente do nível das caixas.
        const nivel = periodo === MANUAL ? this.nivel() : "dia";
        ini = P.inicio(ini, nivel);
        const exclusivo = P.proximo(fim, nivel);
        fim = new Date(+exclusivo - 1);
        const chave = `${P.iso(ini)}|${P.iso(exclusivo)}|${periodo}`;
        if (chave === this.ultimoAplicado && this.mesmoIntervalo({ inicio: ini, fim }, this.filtro)) {
            return;
        }
        this.ultimoAplicado = chave;
        const filtro = new AdvancedFilter(this.alvo, "And",
            { operator: "GreaterThanOrEqual", value: P.iso(ini) },
            { operator: "LessThan", value: P.iso(exclusivo) }).toJSON();
        // O nome do período vai junto com o filtro: assim ele sincroniza entre abas e vai nos indicadores
        filtro.displaySettings = { displayName: periodo };
        this.rotuloFiltro = periodo;
        this.filtro = { inicio: ini, fim };
        this.periodoAtivo = periodo;
        this.marcarPendente(periodo);
        this.desenhar();
        this.gravarPeriodo(periodo);
        this.host.applyJsonFilter(filtro, "general", "filter", FilterAction.merge);
    }

    private limpar(periodo: string): void {
        this.ultimoAplicado = "";
        this.filtro = null;
        this.rotuloFiltro = undefined;
        this.periodoAtivo = periodo;
        this.marcarPendente(periodo);
        this.desenhar();
        this.gravarPeriodo(periodo);
        this.host.applyJsonFilter(null, "general", "filter", FilterAction.remove);
    }

    private marcarPendente(periodo: string): void {
        const antes = this.pendente;
        // vários cliques seguidos: todos os estados anteriores continuam valendo como "atrasados"
        const filtrosAntigos = antes ? [...antes.filtrosAntigos, antes.filtro] : [];
        const periodosAntigos = antes ? [...antes.periodosAntigos, antes.periodo] : [];
        filtrosAntigos.push(this.filtroHost);
        periodosAntigos.push(this.periodoHost);
        this.pendente = { filtro: this.filtro, periodo, filtrosAntigos, periodosAntigos };
    }

    private gravarPeriodo(periodo: string): void {
        const aplicadoEm = D.paraIso(D.hoje());
        this.periodoAtivo = periodo;
        if (this.estadoPeriodo === periodo && this.estadoData && D.paraIso(this.estadoData) === aplicadoEm) {
            return;
        }
        this.estadoPeriodo = periodo;
        this.estadoData = D.hoje();
        this.host.persistProperties({ merge: [{ objectName: "estado", selector: null, properties: { periodo, aplicadoEm } }] });
    }

    private escolherPeriodo(p: Periodo): void {
        if (p.tudo) {
            this.limpar(p.rotulo);
            return;
        }
        const r = calcular(p, this.contexto());
        if (r) {
            this.aplicar(r.inicio, r.fim, p.rotulo);
        }
    }

    /** Datas escolhidas à mão (digitação, calendário ou deslizante). */
    private escolherIntervalo(ini: Date, fim: Date): void {
        if (fim < ini) {
            [ini, fim] = [fim, ini];
        }
        if (this.cfg.datas.limitarAosDados.value) {
            ini = D.limitar(ini, this.min && P.inicio(this.min, this.nivel()), this.max && P.inicio(this.max, this.nivel()));
            fim = D.limitar(fim, this.min && P.inicio(this.min, this.nivel()), this.max && P.inicio(this.max, this.nivel()));
        }
        // Intervalo inteiro dos dados = sem filtro (novas datas entram sozinhas)
        if (this.cfg.datas.modo.value.value === "entre" && this.min && this.max && +P.inicio(ini, this.nivel()) <= +this.min && +P.proximo(fim, this.nivel()) > +this.max) {
            this.limpar(SEM_PERIODO);
            return;
        }
        this.aplicar(ini, fim, MANUAL);
    }

    private escolherData(inicio: boolean, d: Date): void {
        if (this.cfg.datas.modo.value.value !== "entre") { this.escolherIntervalo(d, d); return; }
        const ini = inicio ? d : this.iniVisivel();
        const fim = inicio ? this.fimVisivel() : d;
        if (ini && fim) {
            // Início depois do fim (ou o contrário): o outro lado acompanha
            if (inicio && d > fim) {
                this.escolherIntervalo(d, d);
            } else if (!inicio && d < ini) {
                this.escolherIntervalo(d, d);
            } else {
                this.escolherIntervalo(ini, fim);
            }
        } else {
            this.escolherIntervalo(d, d);
        }
    }

    private confirmarDigitacao(inicio: boolean, texto: HTMLInputElement): void {
        if (texto.readOnly) {
            return;
        }
        if (!texto.dataset.editando) {
            return;
        }
        delete texto.dataset.editando;
        const atual = inicio ? this.iniVisivel() : this.fimVisivel();
        const valor = texto.value.trim();
        if (valor === this.formatar(atual)) {
            this.mostrarDatas();
            return;
        }
        const d = P.interpretar(valor, this.nivel(), this.formato());
        if (!d) {
            texto.classList.add("fdp-invalido");
            window.setTimeout(() => texto.classList.remove("fdp-invalido"), 900);
            this.mostrarDatas();
            return;
        }
        this.escolherData(inicio, d);
        this.mostrarDatas();
    }

    // ------------------------------------------------------------------ deslizante
    private passos(): number[] {
        return this.passosDatas;
    }

    private diasTotais(): number { return Math.max(0, this.passos().length - 1); }

    private moverDeslizante(movendoInicio: boolean): void {
        let a = +this.rangeIni.value;
        let b = +this.rangeFim.value;
        if (a > b) {
            if (movendoInicio) {
                b = a;
                this.rangeFim.value = String(b);
            } else {
                a = b;
                this.rangeIni.value = String(a);
            }
        }
        if (this.cfg.datas.modo.value.value !== "entre") {
            if (movendoInicio) { b = a; this.rangeFim.value = String(b); }
            else { a = b; this.rangeIni.value = String(a); }
        }
        this.pintarFaixa(a, b);
        if (this.min) {
            this.caixaIni.texto.value = this.formatar(new Date(this.passos()[a]));
            this.caixaFim.texto.value = this.formatar(new Date(this.passos()[b]));
        }
    }

    private soltarDeslizante(): void {
        if (!this.min) {
            return;
        }
        this.escolherIntervalo(new Date(this.passos()[+this.rangeIni.value]), new Date(this.passos()[+this.rangeFim.value]));
    }

    private pintarFaixa(a: number, b: number): void {
        const total = this.diasTotais() || 1;
        this.faixa.style.left = `${(a / total) * 100}%`;
        this.faixa.style.width = `${((b - a) / total) * 100}%`;
    }

    // ------------------------------------------------------------------ desenho
    private iniVisivel(): Date | null {
        return this.filtro ? this.filtro.inicio : this.min;
    }

    private fimVisivel(): Date | null {
        return this.filtro ? this.filtro.fim : this.max;
    }

    private bloqueado(): boolean {
        if (!this.cfg.periodos.bloquearDatas.value || !this.filtro) {
            return false;
        }
        const p = this.periodos.find(x => x.rotulo === this.periodoAtivo);
        return !!p && !p.tudo;
    }

    private mostrarVazio(mensagem: string): void {
        this.raiz.classList.add("fdp-sem-dados");
        this.vazio.style.display = "block";
        this.vazio.replaceChildren(iconeCalendario(), this.el("div", "fdp-msg"));
        (this.vazio.lastChild as HTMLElement).textContent = mensagem;
    }

    private indicePasso(d: Date): number {
        const passos = this.passos();
        const i = passos.findIndex(v => v >= +P.inicio(d, this.nivel()));
        return i < 0 ? passos.length - 1 : i;
    }

    private configurarNativo(caixa: Caixa, data: Date | null): void {
        const nivel = this.nivel();
        const tipo = nivel === "mes" ? "month" : ["hora", "minuto", "segundo"].includes(nivel) ? "datetime-local" : "date";
        if (caixa.nativo.type !== tipo) { caixa.nativo.type = tipo; }
        const valor = (d: Date | null) => {
            if (!d) { return ""; }
            const normalizada = P.inicio(d, nivel);
            if (tipo === "month") { return D.paraIso(normalizada).slice(0, 7); }
            if (tipo === "date") { return D.paraIso(normalizada); }
            return P.iso(normalizada);
        };
        caixa.nativo.step = nivel === "hora" ? "3600" : nivel === "minuto" ? "60" : "1";
        caixa.nativo.min = this.cfg.datas.limitarAosDados.value ? valor(this.min) : "";
        // No modo ano, qualquer dia do ano limite deve continuar selecionável.
        caixa.nativo.max = this.cfg.datas.limitarAosDados.value ?
            (nivel === "ano" && this.max ? `${this.max.getFullYear()}-12-31` : valor(this.max)) : "";
        const novo = valor(data);
        if (caixa.nativo.value !== novo) { caixa.nativo.value = novo; }
    }

    private mostrarDatas(): void {
        const ini = this.iniVisivel();
        const fim = this.fimVisivel();
        // Não sobrescreve o que o usuário está digitando
        if (!this.caixaIni.texto.dataset.editando) {
            this.caixaIni.texto.value = this.formatar(ini);
        }
        if (!this.caixaFim.texto.dataset.editando) {
            this.caixaFim.texto.value = this.formatar(fim);
        }
        this.configurarNativo(this.caixaIni, ini);
        this.configurarNativo(this.caixaFim, fim);
        const total = this.diasTotais();
        for (const r of [this.rangeIni, this.rangeFim]) {
            r.max = String(total);
        }
        if (this.min && ini && fim) {
            const a = Math.min(total, Math.max(0, this.indicePasso(ini)));
            const b = Math.min(total, Math.max(0, this.indicePasso(fim)));
            this.rangeIni.value = String(a);
            this.rangeFim.value = String(b);
            this.pintarFaixa(a, b);
        }
    }

    private fonteCss(e: HTMLElement, fonte: { fontFamily: { value: string }; fontSize: { value: number }; bold?: { value: boolean }; italic?: { value: boolean }; underline?: { value: boolean } }): void {
        e.style.fontFamily = fonte.fontFamily.value;
        e.style.fontSize = `${fonte.fontSize.value}pt`;
        e.style.fontWeight = fonte.bold && fonte.bold.value ? "bold" : "normal";
        e.style.fontStyle = fonte.italic && fonte.italic.value ? "italic" : "normal";
        e.style.textDecoration = fonte.underline && fonte.underline.value ? "underline" : "none";
    }

    private desenhar(): void {
        const c = this.cfg;
        const paleta = this.host.colorPalette;
        const altoContraste = paleta.isHighContrast;
        const frente = altoContraste ? paleta.foreground.value : null;
        const fundo = altoContraste ? paleta.background.value : null;
        const destaque = altoContraste ? paleta.foregroundSelected.value : null;
        // Ex.: visual fixado num painel do serviço, onde não se pode interagir
        const semInteracao = !!this.host.hostCapabilities && this.host.hostCapabilities.allowInteractions === false;
        const bloqueado = this.bloqueado() || semInteracao;
        const r = this.raiz.style;

        // posição dos botões
        this.raiz.dataset.posicao = String(c.periodos.posicao.value.value);
        this.raiz.dataset.alinhamento = String(c.periodos.alinhamento.value.value);
        const lateral = ["esquerda", "direita"].includes(this.raiz.dataset.posicao);
        const org = String(c.periodos.organizacao.value.value);
        this.raiz.dataset.organizacao = org === "automatica" ? (lateral ? "coluna" : "linha") : org;
        this.areaBotoes.style.setProperty("--fdp-colunas", String(Math.max(1, Math.round(c.periodos.colunas.value || 1))));
        const area = c.periodos.tamanhoArea.value;
        this.raiz.dataset.area = area > 0 ? "fixa" : "auto";
        this.areaBotoes.style.setProperty("--fdp-area", area > 0 ? `${area}%` : "auto");
        this.raiz.classList.toggle("fdp-quebra", c.periodos.quebrarLinha.value);
        this.raiz.classList.toggle("fdp-bloqueado", bloqueado);
        r.setProperty("--fdp-espaco", `${c.botoes.espacamento.value}px`);

        // caixas de data
        const d = c.datas;
        const modo = String(d.modo.value.value);
        this.raiz.classList.toggle("fdp-so-periodos", !d.mostrar.value);
        this.areaDatas.style.display = d.mostrar.value ? "" : "none";
        this.caixaIni.campo.style.display = modo === "dropdown" ? "none" : "";
        this.caixaFim.campo.style.display = modo === "entre" ? "" : "none";
        this.separador.style.display = modo === "entre" ? "" : "none";
        this.dropdown.style.display = modo === "dropdown" ? "" : "none";
        this.dropdown.disabled = bloqueado;
        this.dropdown.textContent = this.filtro ? (this.formatar(this.filtro.inicio) +
            (this.formatar(this.filtro.inicio) !== this.formatar(this.filtro.fim) ? ` – ${this.formatar(this.filtro.fim)}` : "") + " ▾") : "Todas as datas ▾";
        this.fonteCss(this.dropdown, d.fonte);
        this.dropdown.style.color = frente || d.corTexto.value.value;
        this.dropdown.style.background = fundo || d.corFundo.value.value;
        this.dropdown.style.borderColor = frente || d.corBorda.value.value;
        this.dropdown.style.borderRadius = `${d.raio.value}px`;
        for (const [caixa, rotulo] of [[this.caixaIni, d.rotuloInicio.value], [this.caixaFim, d.rotuloFim.value]] as [Caixa, string][]) {
            caixa.rotulo.textContent = rotulo;
            caixa.rotulo.style.display = d.mostrarRotulos.value ? "" : "none";
            caixa.calendario.style.display = d.mostrarCalendario.value && !bloqueado ? "" : "none";
            this.fonteCss(caixa.campo, d.fonte);
            caixa.campo.style.color = frente || d.corTexto.value.value;
            caixa.texto.style.color = frente || d.corTexto.value.value;
            caixa.campo.style.background = fundo || d.corFundo.value.value;
            caixa.campo.style.borderColor = frente || d.corBorda.value.value;
            caixa.campo.style.borderRadius = `${d.raio.value}px`;
            caixa.texto.readOnly = bloqueado;
            caixa.nativo.disabled = bloqueado || !d.mostrar.value || modo === "dropdown";
            caixa.texto.style.textAlign = String(d.alinhamentoTexto.value.value);
            caixa.texto.title = bloqueado ? "Datas definidas pelo período rápido ativo" : "Digite a data e tecle Enter (↑/↓ mudam uma unidade do nível escolhido)";
        }

        // deslizante
        const s = c.deslizante;
        this.deslizante.style.display = s.mostrar.value && d.mostrar.value && modo !== "dropdown" && this.diasTotais() > 0 ? "" : "none";
        this.deslizante.style.setProperty("--fdp-trilha", frente || s.corTrilha.value.value);
        this.deslizante.style.setProperty("--fdp-intervalo", destaque || s.corIntervalo.value.value);
        this.deslizante.style.setProperty("--fdp-alca", destaque || s.corAlca.value.value);
        this.rangeIni.disabled = bloqueado || !d.mostrar.value || modo === "dropdown";
        this.rangeFim.disabled = bloqueado || !d.mostrar.value || modo === "dropdown";
        this.rangeFim.style.display = modo === "igual" ? "none" : "";

        this.mostrarDatas();
        this.desenharBotoes(frente, fundo, destaque, semInteracao);
        this.raiz.style.setProperty("--fdp-altura-linha", `${this.linhaDatas.offsetHeight}px`);

        // guia de configuração e avisos de erro: só no modo de edição
        const mostrarGuia = this.edicao && this.cfg.guia.mostrar.value;
        this.guia.style.display = mostrarGuia ? "block" : "none";
        if (mostrarGuia) {
            montarGuia(this.guia, {
                periodos: this.periodos, errosPeriodos: this.erros, errosVariaveis: this.errosVariaveis,
                contexto: this.contexto(), formato: this.formato(),
            });
        }
        const erros = [
            ...(this.dadosIncompletos ? ["Carregando mais datas do Power BI; a lista pode estar incompleta enquanto o carregamento não terminar"] : []),
            ...this.errosVariaveis.map(e => `variáveis, linha ${e.linha}: ${e.motivo}`),
            ...this.erros.map(e => `períodos, linha ${e.linha}: ${e.motivo}`),
        ];
        if (this.edicao && !mostrarGuia && erros.length) {
            this.aviso.style.display = "block";
            this.aviso.textContent = "Linhas com erro (ignoradas): " + erros.join(" · ") + ". Ligue o Guia de configuração para ver detalhes.";
        } else {
            this.aviso.style.display = "none";
        }
    }

    private desenharBotoes(frente: string | null, fundo: string | null, destaque: string | null, semInteracao: boolean): void {
        const b = this.cfg.botoes;
        // Preserve o elemento entre mousedown e mouseup, inclusive se o blur de
        // uma caixa de data ou uma atualização do host redesenhar o visual.
        const existentes = Array.from(this.areaBotoes.children) as HTMLButtonElement[];
        const itens: { rotulo: string; acao: () => void; ativo: boolean; titulo: string }[] = [];

        for (const p of this.periodos) {
            const r = calcular(p, this.contexto());
            const estaAtivo = p.rotulo === this.periodoAtivo && (p.tudo ? !this.filtro : !!this.filtro);
            const titulo = p.tudo ? "Todas as datas" : r ? `${D.formatar(r.inicio, this.formato())} a ${D.formatar(r.fim, this.formato())}` : "";
            itens.push({
                rotulo: p.rotulo,
                ativo: estaAtivo,
                titulo,
                acao: () => {
                    if (estaAtivo && this.cfg.periodos.cliqueDesmarca.value && !p.tudo) {
                        this.limpar(SEM_PERIODO);
                    } else {
                        this.escolherPeriodo(p);
                    }
                },
            });
        }
        if (this.cfg.periodos.mostrar.value && this.cfg.periodos.mostrarLimpar.value) {
            itens.push({ rotulo: this.cfg.periodos.textoLimpar.value || "Limpar", ativo: false, titulo: "Limpar o filtro de datas", acao: () => this.limpar(SEM_PERIODO) });
        }
        this.areaBotoes.style.display = itens.length ? "" : "none";

        for (const [indice, it] of itens.entries()) {
            let bt = existentes[indice];
            if (!bt) {
                bt = this.el("button", "fdp-botao", this.areaBotoes);
            }
            bt.type = "button";
            bt.textContent = it.rotulo;
            bt.title = it.titulo;
            bt.dataset.rotulo = it.rotulo;
            bt.setAttribute("aria-pressed", String(it.ativo));
            this.fonteCss(bt, b.fonte);
            bt.style.color = it.ativo ? (fundo || b.corTextoAtivo.value.value) : (frente || b.corTexto.value.value);
            bt.style.background = it.ativo ? (destaque || b.corFundoAtivo.value.value) : (fundo || b.corFundo.value.value);
            bt.style.borderColor = it.ativo ? (destaque || b.corBordaAtiva.value.value) : (frente || b.corBorda.value.value);
            bt.style.borderRadius = `${b.raio.value}px`;
            bt.style.padding = `${b.preenchimento.value}px ${b.preenchimento.value * 2}px`;
            bt.style.minWidth = b.larguraMinima.value ? `${b.larguraMinima.value}px` : "";
            bt.disabled = semInteracao;
            bt.onclick = it.acao;
        }
        for (const bt of existentes.slice(itens.length)) { bt.remove(); }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        const model = this.servicoFormato.buildFormattingModel(this.cfg);
        const card = model.cards.find(c => "uid" in c && c.uid === "deslizante-card") as powerbi.visuals.FormattingCard;
        if (card && this.cfg.deslizante.mostrar.value && (!this.cfg.datas.mostrar.value || this.cfg.datas.modo.value.value === "dropdown")) {
            card.warningMessage = {
                title: "Controle deslizante indisponível",
                message: !this.cfg.datas.mostrar.value ? "O controle deslizante não funciona sem as caixas de data." : "O controle deslizante não funciona no modo Dropdown.",
                detail: "Ative as caixas de data e selecione Entre ou É para usar o controle deslizante.",
            };
        }
        return model;
    }
}
