const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const ts = require("typescript");

// Executa a leitura/restauração real do visual sem depender de navegador ou host.
const code = ts.transpileModule(fs.readFileSync("src/visual.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const mod = { exports: {} };
const dependencias = {
    "powerbi-visuals-api": { default: { FilterAction: {} } },
    "./datas": require("../.tmp/test/src/datas.js"),
    "./precisao": require("../.tmp/test/src/precisao.js"),
    "./periodos": require("../.tmp/test/src/periodos.js"),
    "powerbi-models": require("powerbi-models"),
};
vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(name => dependencias[name] || {}, mod, mod.exports);

const hoje = new Date(2026, 9, 30);
const filtro = {
    target: { table: "Tabela", column: "Data" },
    displaySettings: { displayName: "Hoje" },
    conditions: [
        { operator: "GreaterThanOrEqual", value: "2026-10-30T00:00:00" },
        { operator: "LessThan", value: "2026-10-31T00:00:00" },
    ],
};
function criar() {
    const v = Object.create(mod.exports.Visual.prototype);
    Object.assign(v, {
        filtro: null, filtroConhecido: false, pendente: null,
        seletor: { fechar() {} }, vazio: { style: {} }, raiz: { classList: { remove() {} } },
        cfg: { periodos: { variaveis: { value: "" }, mostrar: { value: true }, lista: { value: "Hoje = hoje\nMês atual = inicio_mes .. hoje\nMês anterior = inicio_mes-1m .. fim_mes-1m\nGeral = tudo" } } },
        nivel: () => "dia", contexto: () => ({ hoje }),
    });
    return v;
}
function ler(v, options = {}, extra = {}, coluna = "Tabela.Data") {
    v.lerDados({ source: { queryName: coluna }, values: [hoje] }, {
        metadata: { objects: { estado: { periodo: "Hoje", aplicadoEm: "2026-10-30" }, ...extra } },
    }, options);
}

const v = criar();
ler(v, { jsonFilters: [filtro] });
assert.equal(v.periodoAtivo, "Hoje");
ler(v); // voltar à aba com a mesma instância, sem snapshot de filtro
assert.equal(v.periodoAtivo, "Hoje");
assert(v.filtro);

const recriado = criar();
ler(recriado, {}, { general: { filter: filtro } });
assert.equal(recriado.periodoAtivo, "Hoje");
assert(recriado.filtro);

const salvo = criar();
ler(salvo);
let restaurado;
salvo.escolherPeriodo = p => { restaurado = p.rotulo; };
salvo.aplicarPeriodoGuardado();
assert.equal(restaurado, "Hoje");

for (const [options, extra] of [[{ jsonFilters: [] }, {}], [{}, { general: { filter: null } }]]) {
    ler(v, options, extra);
    assert.equal(v.filtro, null);
    let reaplicou = false;
    v.escolherPeriodo = () => { reaplicou = true; };
    v.aplicarPeriodoGuardado();
    ler(v); // uma atualização posterior sem snapshot não desfaz a limpeza
    v.aplicarPeriodoGuardado();
    assert.equal(reaplicou, false);
}

ler(recriado, {}, {}, "OutraTabela.Data");
assert.equal(recriado.filtro, null, "Trocar o campo descarta o filtro do campo anterior");
console.log("ok - retorno à aba, nova instância, estado salvo e limpeza explícita");

// O destino não compartilha estado.periodo nem a instância DOM da origem.
const origem = criar();
ler(origem, { jsonFilters: [] });
let sincronizado;
origem.host = { persistProperties() {}, applyJsonFilter(f) { sincronizado = f; } };
origem.desenhar = () => {};
origem.escolherPeriodo(origem.periodos.find(p => p.rotulo === "Hoje"));
delete sincronizado.displaySettings;
function destino(filtros, rotulo = "Hoje") {
    const d = criar();
    ler(d, { jsonFilters: filtros }, { estado: { periodo: "#manual" } });
    // Confere o atributo usado para pintar o botão, além do estado interno.
    const val = value => ({ value });
    d.cfg.botoes = { fonte: {}, corTextoAtivo: val(val("white")), corTexto: val(val("black")),
        corFundoAtivo: val(val("blue")), corFundo: val(val("white")), corBordaAtiva: val(val("blue")),
        corBorda: val(val("gray")), raio: val(0), preenchimento: val(4), larguraMinima: val(0) };
    d.cfg.periodos.mostrarLimpar = val(false);
    d.fonteCss = () => {};
    d.formato = () => "dd/MM/yyyy";
    d.areaBotoes = { children: [], style: {} };
    d.el = () => {
        const b = { style: {}, dataset: {}, setAttribute(k, v) { this[k] = v; } };
        d.areaBotoes.children.push(b);
        return b;
    };
    d.desenharBotoes(null, null, null, false);
    return d.areaBotoes.children.find(b => b.dataset.rotulo === rotulo)["aria-pressed"];
}
assert.equal(destino([sincronizado]), "true", "Outra aba marca pelas datas sem nome nem estado local");
const inclusivo = { ...sincronizado, conditions: [sincronizado.conditions[0], { operator: "LessThanOrEqual", value: "2026-10-30T23:59:59" }] };
assert.equal(destino([inclusivo]), "true", "Final inclusivo com precisão de segundo mantém marcação");
const separado = sincronizado.conditions.map(c => ({ ...sincronizado, conditions: [c] }));
assert.equal(destino(separado), "true", "Limites sincronizados em filtros separados mantêm marcação");
const outraColuna = { ...sincronizado, target: { table: "Tabela", column: "OutraData" }, conditions: [
    { operator: "GreaterThanOrEqual", value: "2026-01-01T00:00:00" },
    { operator: "LessThan", value: "2027-01-01T00:00:00" },
] };
assert.equal(destino([sincronizado, outraColuna]), "true", "Filtro de outra coluna não sobrescreve a seleção sincronizada");
assert.equal(destino([outraColuna]), "false", "Filtro de outra coluna sozinho não marca Hoje");
assert.equal(destino([{ ...sincronizado, conditions: [
    { operator: "GreaterThanOrEqual", value: "2026-10-30T14:00:00" },
    { operator: "LessThan", value: "2026-10-30T16:00:00" },
] }]), "false", "Intervalo parcial do dia não marca o atalho de dia completo");
for (const rotulo of ["Mês atual", "Mês anterior"]) {
    origem.escolherPeriodo(origem.periodos.find(p => p.rotulo === rotulo));
    delete sincronizado.displaySettings;
    assert.equal(destino([sincronizado], rotulo), "true", `${rotulo}: outra aba marca pelas datas`);
    assert.equal(destino([{ ...sincronizado, displaySettings: { displayName: "#manual" } }], rotulo), "true", `${rotulo}: rótulo manual antigo não impede marcação pelas datas`);
    assert.equal(destino([{ ...sincronizado, displaySettings: { displayName: "Hoje" } }], rotulo), "true", `${rotulo}: datas sincronizadas prevalecem sobre nome antigo`);
    const fim = new Date(sincronizado.conditions[1].value);
    fim.setSeconds(fim.getSeconds() - 1);
    const inclusivo = { ...sincronizado, conditions: [sincronizado.conditions[0], {
        operator: "LessThanOrEqual", value: dependencias["./precisao"].iso(fim),
    }] };
    assert.equal(destino([inclusivo, outraColuna], rotulo), "true", `${rotulo}: precisão de segundo e filtro de outra coluna`);
    const partes = sincronizado.conditions.map(c => ({ ...sincronizado, conditions: [c] }));
    assert.equal(destino(partes, rotulo), "true", `${rotulo}: limites separados`);
}
console.log("ok - botão marcado entre duas instâncias, sem rótulo, limites inclusivos/separados e outros filtros");
