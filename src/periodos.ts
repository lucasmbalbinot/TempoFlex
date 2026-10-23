"use strict";

/**
 * Períodos rápidos configurados em texto, um por linha:
 *
 *   Rótulo = expressão                 → um dia só
 *   Rótulo = expressão .. expressão    → de/até
 *   Rótulo = tudo                      → limpa o filtro (todas as datas)
 *   * Rótulo = ...                     → período aplicado ao abrir o relatório
 *   # comentário                       → linha ignorada
 *
 * Expressão = âncora seguida de deslocamentos, ex.: hoje-6d, inicio_mes-1m, fim_ano-1a, 15/01/2026
 *   âncoras: hoje, ontem, amanha, inicio_semana, fim_semana, inicio_mes, fim_mes,
 *            inicio_trimestre, fim_trimestre, inicio_semestre, fim_semestre, inicio_ano, fim_ano,
 *            min (primeira data dos dados), max (última data dos dados), data fixa,
 *            e as variáveis criadas pelo usuário (veja lerVariaveis)
 *   unidades: d (dias), s (semanas), m (meses), t (trimestres), a (anos); sem unidade = dias
 *
 * Semanas/meses/trimestres/anos deslocam a referência ANTES da âncora;
 * dias são somados DEPOIS. Assim "fim_mes-1m" é o último dia do mês passado
 * e "inicio_mes+14d" é o dia 15 do mês atual.
 *
 * Variáveis, uma por linha:
 *   competencia = mensal dia 26     → cria inicio_competencia e fim_competencia (26 do mês anterior a 25 do mês)
 *   ano_fiscal = anual 01/04        → cria inicio_ano_fiscal e fim_ano_fiscal (01/04 a 31/03)
 *   corte = inicio_mes+9d           → cria corte (qualquer expressão, inclusive com outras variáveis)
 */

import * as D from "./datas";

type Unidade = "d" | "s" | "m" | "t" | "a";

interface Deslocamento {
    n: number;
    unidade: Unidade;
}

interface Expressao {
    ancora: string;
    dataFixa: Date | null;
    deslocamentos: Deslocamento[];
}

export interface Periodo {
    rotulo: string;
    /** linha como foi escrita, para o guia */
    texto: string;
    tudo: boolean;
    padrao: boolean;
    inicio: Expressao | null;
    fim: Expressao | null;
}

export interface ErroPeriodo {
    linha: number;
    texto: string;
    motivo: string;
}

export interface Variavel {
    nome: string;
    tipo: "mensal" | "anual" | "expressao";
    dia: number;
    mes: number;
    expressao: Expressao | null;
    texto: string;
    /** Âncoras que a variável cria (ex.: inicio_competencia, fim_competencia). */
    ancoras: string[];
}

export interface Variaveis {
    lista: Variavel[];
    /** âncora → variável e qual parte ela representa */
    ancoras: Record<string, { variavel: Variavel; parte: "inicio" | "fim" | "valor" }>;
}

export interface Contexto {
    hoje: Date;
    min: Date | null;
    max: Date | null;
    primeiroDiaSemana: number;
    variaveis?: Variaveis;
}

export interface Intervalo {
    inicio: Date;
    fim: Date;
}

export const PERIODOS_PADRAO = [
    "Hoje = hoje",
    "Ontem = ontem",
    "Últimos 7 dias = hoje-6d .. hoje",
    "Mês atual = inicio_mes .. hoje",
    "Mês anterior = inicio_mes-1m .. fim_mes-1m",
    "Ano atual = inicio_ano .. hoje",
    "Geral = tudo",
].join("\n");

export const VARIAVEIS_PADRAO = [
    "# Variáveis próprias (tire o # do começo da linha para usar):",
    "# competencia = mensal dia 26",
    "# ano_fiscal = anual 01/04",
    "# fechamento = inicio_mes+4d",
].join("\n");

const ANCORAS: Record<string, string> = {
    hoje: "hoje", today: "hoje", "today()": "hoje", "hoje()": "hoje",
    ontem: "ontem", yesterday: "ontem",
    amanha: "amanha", tomorrow: "amanha",
    inicio_semana: "inicio_semana", start_week: "inicio_semana",
    fim_semana: "fim_semana", end_week: "fim_semana",
    inicio_mes: "inicio_mes", start_month: "inicio_mes",
    fim_mes: "fim_mes", end_month: "fim_mes",
    inicio_trimestre: "inicio_trimestre", start_quarter: "inicio_trimestre",
    fim_trimestre: "fim_trimestre", end_quarter: "fim_trimestre",
    inicio_semestre: "inicio_semestre", fim_semestre: "fim_semestre",
    inicio_ano: "inicio_ano", start_year: "inicio_ano",
    fim_ano: "fim_ano", end_year: "fim_ano",
    min: "min", minimo: "min", primeira_data: "min",
    max: "max", maximo: "max", ultima_data: "max",
};

/** Âncoras prontas, na ordem e com a descrição usadas no guia. */
export const ANCORAS_GUIA: [string, string][] = [
    ["hoje", "o dia de hoje (também today ou TODAY())"],
    ["ontem", "hoje - 1 dia"],
    ["amanha", "hoje + 1 dia"],
    ["inicio_semana", "segunda-feira da semana (ou domingo, conforme \"Semana começa na\")"],
    ["fim_semana", "último dia da semana"],
    ["inicio_mes", "dia 1 do mês"],
    ["fim_mes", "último dia do mês"],
    ["inicio_trimestre", "primeiro dia do trimestre"],
    ["fim_trimestre", "último dia do trimestre"],
    ["inicio_semestre", "01/01 ou 01/07"],
    ["fim_semestre", "30/06 ou 31/12"],
    ["inicio_ano", "01/01"],
    ["fim_ano", "31/12"],
    ["min", "primeira data dos dados (respeitando os outros filtros)"],
    ["max", "última data dos dados"],
];

const UNIDADES: Record<string, Unidade> = {
    "": "d", d: "d", dia: "d", dias: "d", day: "d", days: "d",
    s: "s", sem: "s", semana: "s", semanas: "s", w: "s", week: "s", weeks: "s",
    m: "m", mes: "m", meses: "m", month: "m", months: "m",
    t: "t", tri: "t", trimestre: "t", trimestres: "t", q: "t", quarter: "t",
    a: "a", ano: "a", anos: "a", y: "a", year: "a", years: "a",
};

const DATA_BR = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
const DATA_ISO = /^\d{4}-\d{1,2}-\d{1,2}$/;

function normalizar(s: string): string {
    return s.toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function lerExpressao(texto: string, variaveis?: Variaveis): Expressao | string {
    const t = normalizar(texto).replace(/\s*([+-])\s*/g, "$1").replace(/(\d)\s+([a-z])/g, "$1$2");
    // âncora (nome, data fixa dd/mm/aaaa ou aaaa-mm-dd) + deslocamentos
    const m = /^([a-z_][a-z0-9_]*(?:\(\))?|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{1,2}-\d{1,2})((?:[+-]\d+[a-z]*)*)$/.exec(t.replace(/ /g, "_"));
    if (!m) {
        return `expressão inválida: "${texto.trim()}"`;
    }
    let ancora = m[1];
    let dataFixa: Date | null = null;
    if (DATA_BR.test(ancora) || DATA_ISO.test(ancora)) {
        dataFixa = DATA_ISO.test(ancora) ? D.deIso(ancora) : D.interpretar(ancora, "dd/MM/yyyy");
        if (!dataFixa) {
            return `data inválida: "${m[1]}"`;
        }
        ancora = "data";
    } else if (ANCORAS[ancora]) {
        ancora = ANCORAS[ancora];
    } else if (variaveis && variaveis.ancoras[ancora]) {
        ancora = "var:" + ancora;
    } else {
        return `não conheço "${m[1]}"`;
    }
    const deslocamentos: Deslocamento[] = [];
    const re = /([+-])(\d+)([a-z]*)/g;
    let p: RegExpExecArray | null;
    while ((p = re.exec(m[2])) !== null) {
        const unidade = UNIDADES[p[3]];
        if (!unidade) {
            return `unidade desconhecida: "${p[3]}" (use d, s, m, t ou a)`;
        }
        deslocamentos.push({ n: (p[1] === "-" ? -1 : 1) * +p[2], unidade });
    }
    return { ancora, dataFixa, deslocamentos };
}

function linhasUteis(texto: string): { linha: number; texto: string }[] {
    return (texto || "").split(/\r?\n/)
        .map((t, i) => ({ linha: i + 1, texto: t }))
        .filter(l => {
            const t = l.texto.trim();
            return t && !t.startsWith("#") && !t.startsWith("//");
        });
}

/**
 * Lê as variáveis do usuário. Formas aceitas:
 *   nome = mensal dia 26     (ou "mensal 26")      → inicio_nome / fim_nome
 *   nome = anual 01/04       (ou "anual dia 1/4")  → inicio_nome / fim_nome
 *   nome = expressão                               → nome
 * Uma variável pode usar as que vêm antes dela.
 */
export function lerVariaveis(texto: string): { variaveis: Variaveis; erros: ErroPeriodo[] } {
    const variaveis: Variaveis = { lista: [], ancoras: {} };
    const erros: ErroPeriodo[] = [];
    for (const { linha, texto: bruta } of linhasUteis(texto)) {
        const igual = bruta.indexOf("=");
        if (igual <= 0) {
            erros.push({ linha, texto: bruta, motivo: 'falta "nome = definição"' });
            continue;
        }
        const nome = normalizar(bruta.slice(0, igual)).replace(/ /g, "_");
        const corpo = normalizar(bruta.slice(igual + 1));
        if (!/^[a-z_][a-z0-9_]*$/.test(nome)) {
            erros.push({ linha, texto: bruta, motivo: `nome inválido "${nome}" (use letras, números e _)` });
            continue;
        }
        if (ANCORAS[nome]) {
            erros.push({ linha, texto: bruta, motivo: `"${nome}" é uma âncora pronta, escolha outro nome` });
            continue;
        }
        const mensal = /^mensal(?: dia)? (\d{1,2})$/.exec(corpo);
        const anual = /^anual(?: dia)? (\d{1,2})\/(\d{1,2})$/.exec(corpo);
        let v: Variavel;
        if (mensal) {
            const dia = +mensal[1];
            if (dia < 1 || dia > 31) {
                erros.push({ linha, texto: bruta, motivo: "o dia precisa estar entre 1 e 31" });
                continue;
            }
            v = { nome, tipo: "mensal", dia, mes: 0, expressao: null, texto: bruta.trim(), ancoras: [`inicio_${nome}`, `fim_${nome}`] };
        } else if (anual) {
            const dia = +anual[1];
            const mes = +anual[2];
            if (mes < 1 || mes > 12 || dia < 1 || dia > 31) {
                erros.push({ linha, texto: bruta, motivo: "use anual dd/mm (ex.: anual 01/04)" });
                continue;
            }
            v = { nome, tipo: "anual", dia, mes, expressao: null, texto: bruta.trim(), ancoras: [`inicio_${nome}`, `fim_${nome}`] };
        } else {
            if (/^(mensal|anual)\b/.test(corpo)) {
                erros.push({ linha, texto: bruta, motivo: "use mensal dia 26 ou anual 01/04" });
                continue;
            }
            const e = lerExpressao(corpo, variaveis);
            if (typeof e === "string") {
                erros.push({ linha, texto: bruta, motivo: e });
                continue;
            }
            v = { nome, tipo: "expressao", dia: 0, mes: 0, expressao: e, texto: bruta.trim(), ancoras: [nome] };
        }
        const conflito = v.ancoras.find(a => ANCORAS[a] || variaveis.ancoras[a]);
        if (conflito) {
            erros.push({ linha, texto: bruta, motivo: `"${conflito}" já existe` });
            continue;
        }
        variaveis.lista.push(v);
        if (v.tipo === "expressao") {
            variaveis.ancoras[nome] = { variavel: v, parte: "valor" };
        } else {
            variaveis.ancoras[`inicio_${nome}`] = { variavel: v, parte: "inicio" };
            variaveis.ancoras[`fim_${nome}`] = { variavel: v, parte: "fim" };
        }
    }
    return { variaveis, erros };
}

/** Lê o texto dos períodos. Linhas com erro são devolvidas em `erros` e ignoradas. */
export function lerPeriodos(texto: string, variaveis?: Variaveis): { periodos: Periodo[]; erros: ErroPeriodo[] } {
    const periodos: Periodo[] = [];
    const erros: ErroPeriodo[] = [];
    for (const { linha: num, texto: bruta } of linhasUteis(texto)) {
        let linha = bruta.trim();
        let padrao = false;
        if (linha.startsWith("*")) {
            padrao = true;
            linha = linha.slice(1).trim();
        }
        const igual = linha.lastIndexOf("=");
        if (igual <= 0) {
            erros.push({ linha: num, texto: bruta, motivo: 'falta "Rótulo = expressão"' });
            continue;
        }
        const rotulo = linha.slice(0, igual).trim();
        const corpo = linha.slice(igual + 1).trim();
        if (!corpo) {
            erros.push({ linha: num, texto: bruta, motivo: "expressão vazia" });
            continue;
        }
        if (["tudo", "geral", "all", "todos", "limpar"].includes(normalizar(corpo))) {
            periodos.push({ rotulo, texto: bruta.trim(), tudo: true, padrao, inicio: null, fim: null });
            continue;
        }
        const lados = corpo.split(/\s*\.\.\s*|\s+at[eé]\s+|\s*;\s*/i);
        if (lados.length > 2) {
            erros.push({ linha: num, texto: bruta, motivo: 'use no máximo um ".." entre início e fim' });
            continue;
        }
        const inicio = lerExpressao(lados[0], variaveis);
        const fim = lados.length === 2 ? lerExpressao(lados[1], variaveis) : inicio;
        if (typeof inicio === "string" || typeof fim === "string") {
            erros.push({ linha: num, texto: bruta, motivo: typeof inicio === "string" ? inicio : fim as string });
            continue;
        }
        periodos.push({ rotulo, texto: bruta.trim(), tudo: false, padrao, inicio, fim });
    }
    // Só o primeiro "*" vale
    let achou = false;
    periodos.forEach(p => {
        if (p.padrao) {
            p.padrao = !achou;
            achou = true;
        }
    });
    return { periodos, erros };
}

/** Dia `dia` do mês (limitado ao último dia: dia 31 em fevereiro vira 28/29). */
function diaDoMes(ano: number, mes: number, dia: number): Date {
    const ultimo = new Date(ano, mes + 1, 0).getDate();
    return new Date(ano, mes, Math.min(dia, ultimo));
}

function cicloMensal(ref: Date, dia: number): Intervalo {
    let inicio = diaDoMes(ref.getFullYear(), ref.getMonth(), dia);
    if (ref < inicio) {
        inicio = diaDoMes(ref.getFullYear(), ref.getMonth() - 1, dia);
    }
    const proximo = diaDoMes(inicio.getFullYear(), inicio.getMonth() + 1, dia);
    return { inicio, fim: D.somarDias(proximo, -1) };
}

function cicloAnual(ref: Date, dia: number, mes: number): Intervalo {
    let inicio = diaDoMes(ref.getFullYear(), mes - 1, dia);
    if (ref < inicio) {
        inicio = diaDoMes(ref.getFullYear() - 1, mes - 1, dia);
    }
    const proximo = diaDoMes(inicio.getFullYear() + 1, mes - 1, dia);
    return { inicio, fim: D.somarDias(proximo, -1) };
}

function avaliar(e: Expressao, ctx: Contexto, profundidade = 0): Date | null {
    let ref: Date | null;
    switch (e.ancora) {
        case "min": ref = ctx.min; break;
        case "max": ref = ctx.max; break;
        case "data": ref = e.dataFixa; break;
        default: ref = ctx.hoje;
    }
    if (!ref) {
        return null;
    }
    let dias = 0;
    for (const d of e.deslocamentos) {
        switch (d.unidade) {
            case "d": dias += d.n; break;
            case "s": ref = D.somarDias(ref, 7 * d.n); break;
            case "m": ref = D.somarMeses(ref, d.n); break;
            case "t": ref = D.somarMeses(ref, 3 * d.n); break;
            case "a": ref = D.somarMeses(ref, 12 * d.n); break;
        }
    }
    let r: Date | null;
    if (e.ancora.startsWith("var:")) {
        const ent = ctx.variaveis && ctx.variaveis.ancoras[e.ancora.slice(4)];
        if (!ent || profundidade > 20) {
            return null;
        }
        const v = ent.variavel;
        if (v.tipo === "expressao") {
            // a variável é avaliada como se "hoje" fosse a referência já deslocada
            r = v.expressao ? avaliar(v.expressao, { ...ctx, hoje: ref }, profundidade + 1) : null;
        } else {
            const c = v.tipo === "mensal" ? cicloMensal(ref, v.dia) : cicloAnual(ref, v.dia, v.mes);
            r = ent.parte === "fim" ? c.fim : c.inicio;
        }
        if (!r) {
            return null;
        }
    } else {
        switch (e.ancora) {
            case "ontem": r = D.somarDias(ref, -1); break;
            case "amanha": r = D.somarDias(ref, 1); break;
            case "inicio_semana": r = D.inicioSemana(ref, ctx.primeiroDiaSemana); break;
            case "fim_semana": r = D.somarDias(D.inicioSemana(ref, ctx.primeiroDiaSemana), 6); break;
            case "inicio_mes": r = D.inicioMes(ref); break;
            case "fim_mes": r = D.fimMes(ref); break;
            case "inicio_trimestre": r = D.inicioTrimestre(ref); break;
            case "fim_trimestre": r = D.fimMes(D.somarMeses(D.inicioTrimestre(ref), 2)); break;
            case "inicio_semestre": r = D.inicioSemestre(ref); break;
            case "fim_semestre": r = D.fimMes(D.somarMeses(D.inicioSemestre(ref), 5)); break;
            case "inicio_ano": r = D.inicioAno(ref); break;
            case "fim_ano": r = new Date(ref.getFullYear(), 11, 31); break;
            default: r = ref;
        }
    }
    return D.somarDias(r, dias);
}

/** Datas do período no contexto atual. `null` para "tudo" ou quando min/max não existem. */
export function calcular(p: Periodo, ctx: Contexto): Intervalo | null {
    if (p.tudo || !p.inicio || !p.fim) {
        return null;
    }
    const a = avaliar(p.inicio, ctx);
    const b = avaliar(p.fim, ctx);
    if (!a || !b) {
        return null;
    }
    return a <= b ? { inicio: a, fim: b } : { inicio: b, fim: a };
}

/** Valor de uma âncora (pronta ou variável) hoje, para o guia. */
export function valorAncora(nome: string, ctx: Contexto): Date | null {
    const e = lerExpressao(nome, ctx.variaveis);
    return typeof e === "string" ? null : avaliar(e, ctx);
}
