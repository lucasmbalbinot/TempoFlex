/* Testes da lógica de datas e períodos (sem Power BI). Rodar: npm test */
const assert = {
    strictEqual(a: unknown, b: unknown, msg?: string) {
        if (a !== b) { throw new Error(`${msg || ""} esperado ${JSON.stringify(b)}, veio ${JSON.stringify(a)}`); }
    },
    deepStrictEqual(a: unknown, b: unknown) {
        if (JSON.stringify(a) !== JSON.stringify(b)) { throw new Error(`esperado ${JSON.stringify(b)}, veio ${JSON.stringify(a)}`); }
    },
};
import * as D from "../src/datas";
import { lerPeriodos, lerVariaveis, calcular, valorAncora, PERIODOS_PADRAO, VARIAVEIS_PADRAO, Contexto } from "../src/periodos";

const f = (d: Date | null) => D.formatar(d, "dd/MM/yyyy");
let ok = 0;
function caso(nome: string, fn: () => void) {
    fn();
    ok++;
    console.log("ok -", nome);
}

const ctx: Contexto = { hoje: new Date(2026, 9, 22), min: new Date(2025, 0, 1), max: new Date(2026, 9, 21), primeiroDiaSemana: 1 };
function intervalo(linha: string): string {
    const { periodos, erros } = lerPeriodos(linha);
    assert.strictEqual(erros.length, 0, JSON.stringify(erros));
    const r = calcular(periodos[0], ctx);
    return r ? `${f(r.inicio)} a ${f(r.fim)}` : "tudo";
}

caso("padrões", () => {
    const { periodos, erros } = lerPeriodos(PERIODOS_PADRAO);
    assert.strictEqual(erros.length, 0);
    assert.deepStrictEqual(periodos.map(p => p.rotulo), ["Hoje", "Ontem", "Últimos 7 dias", "Mês atual", "Mês anterior", "Ano atual", "Geral"]);
});
caso("hoje e ontem", () => {
    assert.strictEqual(intervalo("Hoje = hoje"), "22/10/2026 a 22/10/2026");
    assert.strictEqual(intervalo("Ontem = ontem"), "21/10/2026 a 21/10/2026");
    assert.strictEqual(intervalo("Dia anterior = TODAY() - 1"), "21/10/2026 a 21/10/2026");
});
caso("últimos 7 dias", () => assert.strictEqual(intervalo("X = hoje-6d .. hoje"), "16/10/2026 a 22/10/2026"));
caso("mês atual e anterior", () => {
    assert.strictEqual(intervalo("X = inicio_mes .. hoje"), "01/10/2026 a 22/10/2026");
    assert.strictEqual(intervalo("X = inicio_mes-1m .. fim_mes-1m"), "01/09/2026 a 30/09/2026");
    assert.strictEqual(intervalo("X = inicio mes - 2 meses até fim mes - 2 meses"), "01/08/2026 a 31/08/2026");
});
caso("fim do mês anterior vindo de mês de 31 dias", () => {
    const c: Contexto = { ...ctx, hoje: new Date(2026, 2, 31) };
    const { periodos } = lerPeriodos("X = inicio_mes-1m .. fim_mes-1m");
    const r = calcular(periodos[0], c)!;
    assert.strictEqual(`${f(r.inicio)} a ${f(r.fim)}`, "01/02/2026 a 28/02/2026");
});
caso("semana (segunda a domingo)", () => {
    assert.strictEqual(intervalo("X = inicio_semana .. fim_semana"), "19/10/2026 a 25/10/2026");
    assert.strictEqual(intervalo("X = inicio_semana-1s .. fim_semana-1s"), "12/10/2026 a 18/10/2026");
});
caso("trimestre, semestre e ano", () => {
    assert.strictEqual(intervalo("X = inicio_trimestre .. fim_trimestre"), "01/10/2026 a 31/12/2026");
    assert.strictEqual(intervalo("X = inicio_trimestre-1t .. fim_trimestre-1t"), "01/07/2026 a 30/09/2026");
    assert.strictEqual(intervalo("X = inicio_semestre .. fim_semestre"), "01/07/2026 a 31/12/2026");
    assert.strictEqual(intervalo("X = inicio_ano-1a .. fim_ano-1a"), "01/01/2025 a 31/12/2025");
    assert.strictEqual(intervalo("X = inicio_ano-1a .. hoje-1a"), "01/01/2025 a 22/10/2025");
});
caso("min, max e data fixa", () => {
    assert.strictEqual(intervalo("X = min .. max"), "01/01/2025 a 21/10/2026");
    assert.strictEqual(intervalo("X = max-29d .. max"), "22/09/2026 a 21/10/2026");
    assert.strictEqual(intervalo("X = 01/01/2026 .. hoje"), "01/01/2026 a 22/10/2026");
    assert.strictEqual(intervalo("X = 2026-03-15 .. 2026-03-20"), "15/03/2026 a 20/03/2026");
});
caso("tudo, padrão e comentários", () => {
    const { periodos, erros } = lerPeriodos("# comentário\n* Mês atual = inicio_mes .. hoje\n* Outro = hoje\n\nGeral = tudo");
    assert.strictEqual(erros.length, 0);
    assert.deepStrictEqual(periodos.map(p => [p.rotulo, p.padrao, p.tudo]), [["Mês atual", true, false], ["Outro", false, false], ["Geral", false, true]]);
});
caso("início depois do fim é invertido", () => assert.strictEqual(intervalo("X = hoje .. hoje-2d"), "20/10/2026 a 22/10/2026"));
caso("erros apontam a linha", () => {
    const { periodos, erros } = lerPeriodos("Bom = hoje\nRuim = depois_de_amanha\nSem igual\nUnidade = hoje-3x");
    assert.strictEqual(periodos.length, 1);
    assert.deepStrictEqual(erros.map(e => e.linha), [2, 3, 4]);
});
caso("digitação tolerante", () => {
    const F = "dd/MM/yyyy";
    assert.strictEqual(f(D.interpretar("1/10/26", F)), "01/10/2026");
    assert.strictEqual(f(D.interpretar("01102026", F)), "01/10/2026");
    assert.strictEqual(f(D.interpretar("01.10.2026", F)), "01/10/2026");
    assert.strictEqual(f(D.interpretar("1 out 2026", F)), "01/10/2026");
    assert.strictEqual(f(D.interpretar("2026-10-01", F)), "01/10/2026");
    assert.strictEqual(f(D.interpretar("10/01/2026", "MM/dd/yyyy")), "01/10/2026");
    assert.strictEqual(D.interpretar("31/02/2026", F), null);
    assert.strictEqual(D.interpretar("abc", F), null);
});
caso("valores do Power BI", () => {
    assert.strictEqual(f(D.deValorPowerBI("2026-10-01T00:00:00")), "01/10/2026");
    assert.strictEqual(f(D.deValorPowerBI(new Date(2026, 9, 1, 15, 30))), "01/10/2026");
});
function comVariaveis(vars: string, periodos: string, hoje = new Date(2026, 9, 22)): string[] {
    const v = lerVariaveis(vars);
    assert.strictEqual(v.erros.length, 0, JSON.stringify(v.erros));
    const p = lerPeriodos(periodos, v.variaveis);
    assert.strictEqual(p.erros.length, 0, JSON.stringify(p.erros));
    const c: Contexto = { ...ctx, hoje, variaveis: v.variaveis };
    return p.periodos.map(x => { const r = calcular(x, c); return r ? `${f(r.inicio)} a ${f(r.fim)}` : "tudo"; });
}
caso("mês da empresa de 26 a 25", () => {
    const vars = "competencia = mensal dia 26";
    const per = "Mês atual = inicio_competencia .. hoje\nMês anterior = inicio_competencia-1m .. fim_competencia-1m\nMês inteiro = inicio_competencia .. fim_competencia";
    // dia 22/10: o mês da empresa é 26/09 a 25/10
    assert.deepStrictEqual(comVariaveis(vars, per), ["26/09/2026 a 22/10/2026", "26/08/2026 a 25/09/2026", "26/09/2026 a 25/10/2026"]);
    // dia 27/10: já virou, o mês da empresa é 26/10 a 25/11
    assert.deepStrictEqual(comVariaveis(vars, per, new Date(2026, 9, 27)), ["26/10/2026 a 27/10/2026", "26/09/2026 a 25/10/2026", "26/10/2026 a 25/11/2026"]);
    // no próprio dia 26 começa o novo mês; dia 25 ainda é o anterior
    assert.deepStrictEqual(comVariaveis(vars, "X = inicio_competencia .. fim_competencia", new Date(2026, 9, 26)), ["26/10/2026 a 25/11/2026"]);
    assert.deepStrictEqual(comVariaveis(vars, "X = inicio_competencia .. fim_competencia", new Date(2026, 9, 25)), ["26/09/2026 a 25/10/2026"]);
    // virada de ano
    assert.deepStrictEqual(comVariaveis(vars, "X = inicio_competencia .. fim_competencia", new Date(2027, 0, 10)), ["26/12/2026 a 25/01/2027"]);
});
caso("ciclo no dia 31 respeita meses curtos", () => {
    assert.deepStrictEqual(comVariaveis("c = mensal 31", "X = inicio_c .. fim_c", new Date(2026, 2, 5)), ["28/02/2026 a 30/03/2026"]);
});
caso("ano fiscal", () => {
    const vars = "ano_fiscal = anual 01/04";
    assert.deepStrictEqual(comVariaveis(vars, "A = inicio_ano_fiscal .. fim_ano_fiscal\nB = inicio_ano_fiscal-1a .. fim_ano_fiscal-1a"),
        ["01/04/2026 a 31/03/2027", "01/04/2025 a 31/03/2026"]);
    assert.deepStrictEqual(comVariaveis(vars, "A = inicio_ano_fiscal .. fim_ano_fiscal", new Date(2026, 1, 10)), ["01/04/2025 a 31/03/2026"]);
});
caso("variável de expressão e variável que usa outra", () => {
    const vars = "competencia = mensal dia 26\nfechamento = fim_competencia-2d\ncorte = 15/03/2026";
    assert.deepStrictEqual(comVariaveis(vars, "A = fechamento\nB = fechamento-1m\nC = corte .. corte+6d"),
        ["23/10/2026 a 23/10/2026", "23/09/2026 a 23/09/2026", "15/03/2026 a 21/03/2026"]);
});
caso("erros de variáveis", () => {
    const v = lerVariaveis("ok = mensal 26\nhoje = mensal 1\n1x = anual 01/04\nruim = anual 40/13\nsem igual\nok = anual 01/01\nz = nada_aqui");
    assert.deepStrictEqual(v.erros.map(e => e.linha), [2, 3, 4, 5, 6, 7]);
    assert.deepStrictEqual(v.variaveis.lista.map(x => x.nome), ["ok"]);
    assert.strictEqual(lerPeriodos("X = inicio_competencia").erros.length, 1);
});
caso("variáveis padrão só têm comentários", () => assert.strictEqual(lerVariaveis(VARIAVEIS_PADRAO).variaveis.lista.length, 0));
caso("valor das âncoras para o guia", () => {
    const v = lerVariaveis("competencia = mensal dia 26").variaveis;
    const c: Contexto = { ...ctx, variaveis: v };
    assert.strictEqual(f(valorAncora("inicio_competencia", c)), "26/09/2026");
    assert.strictEqual(f(valorAncora("fim_trimestre", c)), "31/12/2026");
    assert.strictEqual(f(valorAncora("max", c)), "21/10/2026");
});
console.log(`\n${ok} casos ok`);
