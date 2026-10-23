const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const json = p => JSON.parse(read(p));
const exists = p => fs.existsSync(path.join(root, p));

function dimensions(file, w, h) {
    const data = fs.readFileSync(path.join(root, file));
    assert.equal(data.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${file}: não é PNG`);
    assert.equal(data.readUInt32BE(16), w, `${file}: largura incorreta`);
    assert.equal(data.readUInt32BE(20), h, `${file}: altura incorreta`);
    return data.length;
}
function check(submission = false) {
    const pkg = json("package.json"), lock = json("package-lock.json"), pbi = json("pbiviz.json"), offer = json("appsource/offer.json");
    assert.equal(lock.version, pkg.version);
    assert.equal(lock.packages[""].version, pkg.version);
    assert.equal(pbi.visual.version, `${pkg.version}.0`);
    assert.equal(pbi.version, pbi.visual.version);
    assert.equal(pbi.visual.guid, "filtroDataPeriodoA7C31E0B5F2D4E6C9B8A", "GUID alterado");
    assert.equal(pkg.license, "GPL-3.0-only");
    assert.equal(lock.packages[""].license, pkg.license);
    assert.equal(pbi.visual.gitHubUrl, offer.repository);
    assert.equal(pbi.visual.supportUrl, offer.supportUrl);
    assert.equal(pkg.repository.url, `${offer.repository}.git`);
    for (const key of ["repository", "supportUrl", "documentationUrl", "privacyUrl", "termsUrl"]) {
        assert(offer[key].startsWith("https://github.com/lucasmbalbinot/TempoFlex"), `${key}: URL inesperada`);
    }
    for (const name of ["LICENSE", "PRIVACY.md", "TERMS.md", "SUPPORT.md", "THIRD_PARTY_NOTICES.md", "demo/DadosDemo.m", "demo/dados-demo.csv"]) { assert(exists(name), `Arquivo ausente: ${name}`); }
    for (const lang of offer.languages) {
        const listing = json(`appsource/listing.${lang}.json`);
        assert(listing.name.length > 0 && listing.name.length <= 50, `${lang}: nome`);
        assert(listing.summary.length > 0 && listing.summary.length <= 100, `${lang}: resumo`);
        assert(listing.description.length > 0 && listing.description.length <= 3000, `${lang}: descrição`);
        assert(listing.keywords.length > 0 && listing.keywords.length <= 3, `${lang}: palavras-chave`);
    }
    dimensions("assets/icon.png", 20, 20);
    dimensions(offer.logo, 300, 300);
    for (let i = 1; i <= 5; i++) { assert(dimensions(`appsource/media/preview-0${i}.png`, 1366, 768) <= 1024 * 1024, "Prévia maior que 1024 KB"); }
    const pending = [];
    const state = json("appsource/validation.json");
    assert.equal(state.packageVersion, pbi.visual.version, "Atualize a versão de validation.json");
    if (!exists(offer.sampleReport)) { pending.push("PBIX offline com o visual final ainda não fornecido"); }
    else {
        const file = fs.readFileSync(path.join(root, offer.sampleReport));
        assert(file.length > 1024 && file.subarray(0, 2).toString() === "PK", "O PBIX informado não é um pacote plausível");
    }
    const shots = fs.readdirSync(path.join(root, offer.screenshotsDirectory)).filter(n => /^screenshot-\d{2}\.png$/.test(n));
    if (!shots.length) { pending.push("Capturas reais do Power BI ainda não fornecidas"); }
    assert(shots.length <= 5, "No máximo cinco screenshots");
    for (const file of shots) { assert(dimensions(`${offer.screenshotsDirectory}/${file}`, 1366, 768) <= 1024 * 1024, `${file}: maior que 1024 KB`); }
    if (!state.desktop.validated) { pending.push("Validação Desktop pendente"); }
    if (!state.service.validated) { pending.push("Validação Service pendente"); }
    if (!state.sampleReport.offlineValidated || !state.sampleReport.sameVisualVersionValidated) { pending.push("Validar PBIX offline e versão incorporada"); }
    if (!state.screenshots.capturedInPowerBI) { pending.push("Confirmar origem real das capturas"); }
    if (!state.publicUrls.reachableValidated) { pending.push("Conferir URLs após publicar os arquivos no GitHub"); }
    if (submission && pending.length) { throw new Error(`Submissão bloqueada:\n- ${pending.join("\n- ")}`); }
    return { version: pbi.visual.version, guid: pbi.visual.guid, readyForSubmission: !pending.length, pending };
}
if (require.main === module) {
    try { console.log(JSON.stringify(check(process.argv.includes("--submission")), null, 2)); }
    catch (err) { console.error(err.message); process.exitCode = 1; }
}
module.exports = { check };
