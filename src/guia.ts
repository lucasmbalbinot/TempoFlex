"use strict";

/** Guia de configuração mostrado dentro do visual (modo de edição), com as datas calculadas para hoje. */

import * as D from "./datas";
import { ANCORAS_GUIA, calcular, Contexto, ErroPeriodo, Periodo, valorAncora } from "./periodos";

export interface DadosGuia {
    periodos: Periodo[];
    errosPeriodos: ErroPeriodo[];
    errosVariaveis: ErroPeriodo[];
    contexto: Contexto;
    formato: string;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, pai: HTMLElement, texto?: string, classe?: string): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag);
    if (texto !== undefined) {
        e.textContent = texto;
    }
    if (classe) {
        e.className = classe;
    }
    pai.appendChild(e);
    return e;
}

function tabela(pai: HTMLElement, cabecalho: string[], linhas: string[][], codigoNaColuna = 0): void {
    const t = el("table", pai);
    const tr = el("tr", el("thead", t));
    cabecalho.forEach(c => el("th", tr, c));
    const corpo = el("tbody", t);
    for (const l of linhas) {
        const r = el("tr", corpo);
        l.forEach((c, i) => el("td", r, c, i === codigoNaColuna ? "fdp-guia-codigo" : undefined));
    }
}

function secao(pai: HTMLElement, titulo: string): HTMLElement {
    const s = el("section", pai);
    el("h3", s, titulo);
    return s;
}

function lista(pai: HTMLElement, itens: string[]): void {
    const ul = el("ul", pai);
    itens.forEach(i => el("li", ul, i));
}

function codigo(pai: HTMLElement, linhas: string[]): void {
    el("pre", pai, linhas.join("\n"));
}

export function montarGuia(raiz: HTMLElement, dados: DadosGuia): void {
    raiz.replaceChildren();
    const { contexto: ctx, formato } = dados;
    const f = (d: Date | null) => (d ? D.formatar(d, formato) : "—");

    const topo = el("div", raiz, undefined, "fdp-guia-topo");
    el("strong", topo, "Guia de configuração");
    el("span", topo, ` · datas calculadas para hoje (${f(ctx.hoje)}). Aparece só no modo de edição; desligue em Formatar › Guia de configuração.`);

    // ---------------------------------------------------------------- erros
    const erros = [
        ...dados.errosVariaveis.map(e => `Variáveis, linha ${e.linha}: ${e.motivo}  →  ${e.texto.trim()}`),
        ...dados.errosPeriodos.map(e => `Períodos, linha ${e.linha}: ${e.motivo}  →  ${e.texto.trim()}`),
    ];
    if (erros.length) {
        const s = secao(raiz, "Erros (linhas ignoradas)");
        s.classList.add("fdp-guia-erros");
        lista(s, erros);
    }

    // ---------------------------------------------------------------- períodos
    const sp = secao(raiz, "Seus períodos");
    if (dados.periodos.length) {
        tabela(sp, ["Como está escrito", "Datas hoje"], dados.periodos.map(p => {
            const r = calcular(p, ctx);
            const datas = p.tudo ? "todas as datas (limpa o filtro)" : r ? `${f(r.inicio)} a ${f(r.fim)}` : "sem datas (min/max sem dados)";
            return [p.texto, datas + (p.padrao ? "  · aplicado ao abrir" : "")];
        }));
    } else {
        el("p", sp, "Nenhum período válido. Escreva um por linha em Formatar › Períodos rápidos › Períodos.");
    }

    // ---------------------------------------------------------------- como escrever
    const sc = secao(raiz, "Como escrever um período");
    codigo(sc, [
        "Rótulo = início .. fim        → de/até (também aceita \"até\" ou \";\")",
        "Rótulo = expressão            → um dia só",
        "Rótulo = tudo                 → limpa o filtro (todas as datas)",
        "* Rótulo = ...                → período aplicado ao abrir o relatório",
        "# comentário                  → linha ignorada",
    ]);
    el("p", sc, "Expressão = âncora + deslocamentos. Ex.: hoje-6d, inicio_mes-1m, fim_ano-1a, 15/01/2026, inicio_competencia-1m.");

    // ---------------------------------------------------------------- âncoras prontas
    const sa = secao(raiz, "Âncoras prontas");
    tabela(sa, ["Âncora", "O que é", "Hoje"], ANCORAS_GUIA.map(([nome, desc]) => [nome, desc, f(valorAncora(nome, ctx))]));
    el("p", sa, "Data fixa: escreva a data (15/01/2026 ou 2026-01-15).");

    // ---------------------------------------------------------------- variáveis
    const sv = secao(raiz, "Suas variáveis");
    const vars = ctx.variaveis ? ctx.variaveis.lista : [];
    if (vars.length) {
        const linhas: string[][] = [];
        for (const v of vars) {
            v.ancoras.forEach((a, i) => linhas.push([a, i === 0 ? v.texto : "", f(valorAncora(a, ctx))]));
        }
        tabela(sv, ["Âncora", "Definida como", "Hoje"], linhas);
    } else {
        el("p", sv, "Nenhuma ainda. Escreva em Formatar › Períodos rápidos › Variáveis, uma por linha:");
    }
    codigo(sv, [
        "competencia = mensal dia 26   → cria inicio_competencia (dia 26 do mês anterior) e fim_competencia (dia 25)",
        "ano_fiscal = anual 01/04      → cria inicio_ano_fiscal (01/04) e fim_ano_fiscal (31/03)",
        "fechamento = fim_mes-2d       → cria fechamento (qualquer expressão; pode usar variáveis de cima)",
    ]);
    lista(sv, [
        "Ciclo mensal: começa no dia escolhido. Dia 26 → de 26 do mês anterior a 25 do mês; no dia 26 já começa o ciclo seguinte. Dia 31 vira o último dia em meses curtos.",
        "Ciclo anual: começa no dia/mês escolhido e termina no dia anterior, um ano depois.",
        "Nomes: letras, números e _ (acentos e espaços viram letras simples e _). Não pode repetir nem usar o nome de uma âncora pronta.",
        "As variáveis aceitam os mesmos deslocamentos: inicio_competencia-1m é o ciclo anterior.",
    ]);

    // ---------------------------------------------------------------- deslocamentos
    const sd = secao(raiz, "Deslocamentos");
    tabela(sd, ["Unidade", "Significa", "Exemplo"], [
        ["d (ou nada)", "dias", "hoje-6d = 6 dias atrás"],
        ["s", "semanas", "inicio_semana-1s = segunda da semana passada"],
        ["m", "meses", "inicio_mes-1m = dia 1 do mês passado"],
        ["t", "trimestres", "inicio_trimestre-1t"],
        ["a", "anos", "hoje-1a = hoje no ano passado"],
    ]);
    lista(sd, [
        "Semanas, meses, trimestres e anos mudam a data de referência ANTES da âncora; dias são somados DEPOIS.",
        "Por isso fim_mes-1m é sempre o último dia do mês passado, e inicio_mes+14d é o dia 15 do mês atual.",
        "Pode encadear e escrever por extenso: inicio_ano-1a+14d, inicio mes - 2 meses.",
    ]);

    // ---------------------------------------------------------------- exemplos
    const se = secao(raiz, "Exemplos para copiar");
    codigo(se, [
        "Hoje = hoje",
        "Ontem = ontem",
        "Últimos 7 dias = hoje-6d .. hoje",
        "Semana passada = inicio_semana-1s .. fim_semana-1s",
        "* Mês atual = inicio_mes .. hoje",
        "Mês anterior = inicio_mes-1m .. fim_mes-1m",
        "Mesmo período do mês passado = inicio_mes-1m .. hoje-1m",
        "Trimestre anterior = inicio_trimestre-1t .. fim_trimestre-1t",
        "Ano passado até hoje = inicio_ano-1a .. hoje-1a",
        "Últimos 30 dias de dados = max-29d .. max",
        "Competência atual = inicio_competencia .. hoje        (com a variável competencia)",
        "Competência anterior = inicio_competencia-1m .. fim_competencia-1m",
        "Geral = tudo",
    ]);
}
