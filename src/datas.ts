"use strict";

/** Utilitários de data. Todas as datas são tratadas como "dia" no fuso local, sem hora. */

const DIA_MS = 24 * 60 * 60 * 1000;

export function inicioDoDia(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function hoje(): Date {
    return inicioDoDia(new Date());
}

export function somarDias(d: Date, n: number): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** Soma meses mantendo o dia, limitado ao último dia do mês de destino (31/03 - 1 mês = 28/02). */
export function somarMeses(d: Date, n: number): Date {
    const alvo = new Date(d.getFullYear(), d.getMonth() + n, 1);
    const ultimo = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
    return new Date(alvo.getFullYear(), alvo.getMonth(), Math.min(d.getDate(), ultimo));
}

export function inicioSemana(d: Date, primeiroDia: number): Date {
    // primeiroDia: 0 = domingo, 1 = segunda
    const desloc = (d.getDay() - primeiroDia + 7) % 7;
    return somarDias(d, -desloc);
}

export function inicioMes(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function fimMes(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function inicioTrimestre(d: Date): Date {
    return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
}

export function inicioSemestre(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth() < 6 ? 0 : 6, 1);
}

export function inicioAno(d: Date): Date {
    return new Date(d.getFullYear(), 0, 1);
}

export function mesmoDia(a: Date | null, b: Date | null): boolean {
    if (!a || !b) {
        return a === b;
    }
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Número de dias entre duas datas (b - a). */
export function diferencaDias(a: Date, b: Date): number {
    return Math.round((inicioDoDia(b).getTime() - inicioDoDia(a).getTime()) / DIA_MS);
}

export function menor(a: Date, b: Date): Date {
    return a.getTime() <= b.getTime() ? a : b;
}

export function maior(a: Date, b: Date): Date {
    return a.getTime() >= b.getTime() ? a : b;
}

export function limitar(d: Date, min: Date | null, max: Date | null): Date {
    let r = d;
    if (min && r < min) {
        r = min;
    }
    if (max && r > max) {
        r = max;
    }
    return r;
}

const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function dois(n: number): string {
    return n < 10 ? "0" + n : String(n);
}

/** Formatos suportados: dd/MM/yyyy, dd/MM/yy, MM/dd/yyyy, yyyy-MM-dd, dd MMM yyyy, dd.MM.yyyy */
export function formatar(d: Date | null, formato: string): string {
    if (!d) {
        return "";
    }
    const dd = dois(d.getDate());
    const mm = dois(d.getMonth() + 1);
    const yyyy = String(d.getFullYear());
    switch (formato) {
        case "dd/MM/yy": return `${dd}/${mm}/${yyyy.slice(2)}`;
        case "MM/dd/yyyy": return `${mm}/${dd}/${yyyy}`;
        case "yyyy-MM-dd": return `${yyyy}-${mm}-${dd}`;
        case "dd MMM yyyy": return `${dd} ${MESES_ABREV[d.getMonth()]} ${yyyy}`;
        case "dd.MM.yyyy": return `${dd}.${mm}.${yyyy}`;
        default: return `${dd}/${mm}/${yyyy}`;
    }
}

/** Valor para <input type="date"> (yyyy-MM-dd). */
export function paraIso(d: Date | null): string {
    return d ? formatar(d, "yyyy-MM-dd") : "";
}

export function deIso(texto: string): Date | null {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(texto || "");
    return m ? dataValida(+m[1], +m[2], +m[3]) : null;
}

function dataValida(ano: number, mes: number, dia: number): Date | null {
    if (ano < 100) {
        ano += 2000;
    }
    const d = new Date(ano, mes - 1, dia);
    return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia ? d : null;
}

/**
 * Lê o que o usuário digitou, de forma tolerante: aceita separadores / . - e espaço,
 * ano com 2 ou 4 dígitos, dia/mês sem zero, só números (01102026 ou 011026),
 * nome do mês abreviado (01 out 2026) e "hoje"/"ontem".
 */
export function interpretar(texto: string, formato: string): Date | null {
    const t = (texto || "").trim().toLowerCase();
    if (!t) {
        return null;
    }
    if (t === "hoje" || t === "today") {
        return hoje();
    }
    if (t === "ontem" || t === "yesterday") {
        return somarDias(hoje(), -1);
    }
    const mesNome = /^(\d{1,2})\s*([a-zç]{3})[a-zç]*\.?\s*(\d{2,4})$/.exec(t);
    if (mesNome) {
        const idx = MESES_ABREV.indexOf(mesNome[2]);
        return idx < 0 ? null : dataValida(+mesNome[3], idx + 1, +mesNome[1]);
    }
    let partes: string[];
    if (/^\d{6}$|^\d{8}$/.test(t)) {
        partes = formato === "yyyy-MM-dd"
            ? [t.slice(0, 4), t.slice(4, 6), t.slice(6)]
            : [t.slice(0, 2), t.slice(2, 4), t.slice(4)];
    } else {
        partes = t.split(/[/.\-\s]+/).filter(p => p !== "");
    }
    if (partes.length !== 3 || partes.some(p => !/^\d+$/.test(p))) {
        return null;
    }
    const [a, b, c] = partes.map(p => +p);
    if (formato === "yyyy-MM-dd" || partes[0].length === 4) {
        return dataValida(a, b, c);
    }
    if (formato === "MM/dd/yyyy") {
        return dataValida(c, a, b);
    }
    return dataValida(c, b, a);
}

/** Converte qualquer valor vindo do Power BI (Date, string ISO, número) em dia local. */
export function deValorPowerBI(v: unknown): Date | null {
    if (v === null || v === undefined || v === "") {
        return null;
    }
    if (v instanceof Date) {
        return isNaN(v.getTime()) ? null : inicioDoDia(v);
    }
    if (typeof v === "string") {
        // "2026-10-01T00:00:00" (sem fuso) deve ser o dia 01/10 no fuso local
        const iso = /^(\d{4})-(\d{2})-(\d{2})(T00:00:00(\.0+)?)?$/.exec(v);
        if (iso) {
            return dataValida(+iso[1], +iso[2], +iso[3]);
        }
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : inicioDoDia(d);
    }
    if (typeof v === "number") {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : inicioDoDia(d);
    }
    return null;
}
