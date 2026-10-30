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
        cfg: { periodos: { variaveis: { value: "" }, mostrar: { value: true }, lista: { value: "Hoje = hoje\nGeral = tudo" } } },
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
