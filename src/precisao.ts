import * as D from "./datas";

export type Nivel = "ano" | "mes" | "dia" | "hora" | "minuto" | "segundo";
const dois = (n: number) => String(n).padStart(2, "0");

export function inicio(d: Date, nivel: Nivel): Date {
    return new Date(d.getFullYear(), nivel === "ano" ? 0 : d.getMonth(),
        ["ano", "mes"].includes(nivel) ? 1 : d.getDate(),
        ["hora", "minuto", "segundo"].includes(nivel) ? d.getHours() : 0,
        ["minuto", "segundo"].includes(nivel) ? d.getMinutes() : 0, nivel === "segundo" ? d.getSeconds() : 0);
}

export function proximo(d: Date, nivel: Nivel, n = 1): Date {
    const r = inicio(d, nivel);
    if (nivel === "ano") { r.setFullYear(r.getFullYear() + n); }
    else if (nivel === "mes") { r.setMonth(r.getMonth() + n); }
    else if (nivel === "dia") { r.setDate(r.getDate() + n); }
    else if (nivel === "hora") { r.setHours(r.getHours() + n); }
    else if (nivel === "minuto") { r.setMinutes(r.getMinutes() + n); }
    else { r.setSeconds(r.getSeconds() + n); }
    return r;
}

export function iso(d: Date): string {
    return `${D.paraIso(d)}T${dois(d.getHours())}:${dois(d.getMinutes())}:${dois(d.getSeconds())}`;
}

/** Datas do modelo são valores civis, sem conversão pelo fuso da máquina. */
export function deValor(v: unknown): Date | null {
    if (typeof v === "string") {
        const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.exec(v);
        if (m) { return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)); }
    }
    if (v instanceof Date) {
        return isNaN(+v) ? null : new Date(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate(), v.getUTCHours(), v.getUTCMinutes(), v.getUTCSeconds());
    }
    return D.deValorPowerBI(v);
}

export function formatar(d: Date | null, nivel: Nivel, formato: string): string {
    if (!d) { return ""; }
    if (nivel === "ano") { return String(d.getFullYear()); }
    if (nivel === "mes") { return `${dois(d.getMonth() + 1)}/${d.getFullYear()}`; }
    const data = D.formatar(d, formato);
    if (nivel === "dia") { return data; }
    return `${data} ${dois(d.getHours())}` + (nivel !== "hora" ? `:${dois(d.getMinutes())}` : "")
        + (nivel === "segundo" ? `:${dois(d.getSeconds())}` : "");
}

export function interpretar(texto: string, nivel: Nivel, formato: string): Date | null {
    const t = texto.trim();
    if (nivel === "ano" || nivel === "mes") {
        const m = nivel === "ano" ? /^(\d{4})$/.exec(t) : /^(\d{1,2})\/(\d{4})$/.exec(t);
        if (!m) { return null; }
        const ano = +(nivel === "ano" ? m[1] : m[2]);
        const mes = nivel === "ano" ? 1 : +m[1];
        return ano >= 100 && mes >= 1 && mes <= 12 ? new Date(ano, mes - 1, 1) : null;
    }
    if (nivel === "dia") { return D.interpretar(t, formato); }
    const m = /^(.*?)\s+(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?$/.exec(t);
    if (!m || +m[2] > 23 || +(m[3] || 0) > 59 || +(m[4] || 0) > 59
        || (nivel === "hora" && m[3] !== undefined) || (nivel === "minuto" && (m[3] === undefined || m[4] !== undefined))
        || (nivel === "segundo" && m[4] === undefined)) { return null; }
    const d = D.interpretar(m[1], formato);
    if (d) { d.setHours(+m[2], +(m[3] || 0), +(m[4] || 0), 0); }
    return d;
}
