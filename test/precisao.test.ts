import * as P from "../src/precisao";

function igual(a: unknown, b: unknown): void {
    if (a !== b) { throw new Error(`Esperado ${b}; recebido ${a}`); }
}
const d = new Date(2026, 9, 23, 14, 30, 45);
for (const [nivel, texto, ini, fim] of [
    ["ano", "2026", "2026-01-01T00:00:00", "2027-01-01T00:00:00"],
    ["mes", "10/2026", "2026-10-01T00:00:00", "2026-11-01T00:00:00"],
    ["dia", "23/10/2026", "2026-10-23T00:00:00", "2026-10-24T00:00:00"],
    ["hora", "23/10/2026 14", "2026-10-23T14:00:00", "2026-10-23T15:00:00"],
    ["minuto", "23/10/2026 14:30", "2026-10-23T14:30:00", "2026-10-23T14:31:00"],
    ["segundo", "23/10/2026 14:30:45", "2026-10-23T14:30:45", "2026-10-23T14:30:46"],
] as [P.Nivel, string, string, string][]) {
    igual(P.formatar(d, nivel, "dd/MM/yyyy"), texto);
    igual(P.iso(P.interpretar(texto, nivel, "dd/MM/yyyy")), ini);
    igual(P.iso(P.inicio(d, nivel)), ini);
    igual(P.iso(P.proximo(d, nivel)), fim);
    igual(P.iso(P.proximo(P.proximo(d, nivel), nivel, -1)), ini);
}
igual(P.iso(P.proximo(new Date(2024, 1, 29), "dia")), "2024-03-01T00:00:00");
igual(P.iso(P.proximo(new Date(2026, 11, 31, 23, 59, 59), "segundo")), "2027-01-01T00:00:00");
igual(P.interpretar("13/2026", "mes", "dd/MM/yyyy"), null);
igual(P.interpretar("2026x", "ano", "dd/MM/yyyy"), null);
igual(P.interpretar("29/02/2026 14:30", "minuto", "dd/MM/yyyy"), null);
igual(P.interpretar("23/10/2026 24:00", "minuto", "dd/MM/yyyy"), null);
igual(P.interpretar("23/10/2026 14:60", "minuto", "dd/MM/yyyy"), null);
igual(P.interpretar("23/10/2026 14:30:60", "segundo", "dd/MM/yyyy"), null);
igual(P.interpretar("23/10/2026 14:30", "hora", "dd/MM/yyyy"), null);
igual(P.interpretar("23/10/2026 14", "minuto", "dd/MM/yyyy"), null);
igual(P.interpretar("23/10/2026 14:30", "segundo", "dd/MM/yyyy"), null);
igual(P.iso(P.interpretar("10/23/2026 14:30", "minuto", "MM/dd/yyyy")), "2026-10-23T14:30:00");
igual(P.iso(P.deValor("2026-10-23T14:30:45Z")), "2026-10-23T14:30:45");
igual(P.iso(P.deValor(new Date("2026-10-23T14:30:45Z"))), "2026-10-23T14:30:45");
console.log("ok - seis níveis, limites exclusivos, viradas, entrada inválida e datas do modelo");
