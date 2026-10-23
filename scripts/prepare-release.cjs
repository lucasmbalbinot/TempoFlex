const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const JSZip = require("jszip");
const { check } = require("./check-release.cjs");
const root = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const pbi = JSON.parse(fs.readFileSync(path.join(root, "pbiviz.json"), "utf8"));
const dist = path.join(root, "dist");
const npm = process.env.npm_execpath;
if (!npm) { throw new Error("Execute pelo comando npm run release:prepare."); }
const submission = process.argv.includes("--submission");
for (const script of ["assets:build", "typecheck", "lint", "test", "test:browser:build", "package"]) {
    execFileSync(process.execPath, [npm, "run", script], { cwd: root, stdio: "inherit" });
}
const state = check(submission);
fs.mkdirSync(dist, { recursive: true });
const roots = ["src", "style", "test", "assets", "docs", "scripts", "appsource", "demo", ".github"];
const topFiles = ["README.md", "LICENSE", "THIRD_PARTY_NOTICES.md", "PRIVACY.md", "TERMS.md", "SUPPORT.md", "SECURITY.md", "CONTRIBUTING.md", "CHANGELOG.md", ".gitignore", "package.json", "package-lock.json", "pbiviz.json", "capabilities.json", "tsconfig.json", "tsconfig.test.json", "eslint.config.mjs"];
const files = [];
function visit(relative) {
    const full = path.join(root, relative), info = fs.lstatSync(full);
    if (info.isSymbolicLink()) { throw new Error(`Link simbólico não permitido no pacote: ${relative}`); }
    if (info.isDirectory()) {
        for (const entry of fs.readdirSync(full).sort()) { visit(path.join(relative, entry)); }
    } else if (!/\.(pbix|pfx|pem|key|p12|pbiviz)$/i.test(relative)) { files.push(relative); }
}
for (const name of [...roots, ...topFiles]) { visit(name); }
const stamp = new Date("2026-01-01T00:00:00Z");
const add = (zip, name, data) => zip.file(name.replaceAll("\\", "/"), data, { date: stamp });
const fileName = `TempoFlex-${pkg.version}`;

(async () => {
    const source = new JSZip();
    for (const file of files) { add(source, `${fileName}/${file}`, fs.readFileSync(path.join(root, file))); }
    const sourceData = await source.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    fs.writeFileSync(path.join(dist, `${fileName}-source.zip`), sourceData);
    const bundle = new JSZip();
    add(bundle, `01_VISUAL/${pbi.visual.guid}.${pbi.visual.version}.pbiviz`, fs.readFileSync(path.join(dist, `${pbi.visual.guid}.${pbi.visual.version}.pbiviz`)));
    add(bundle, `01_VISUAL/${fileName}-source.zip`, sourceData);
    // Cópia navegável do projeto: os links relativos do README/manual continuam válidos.
    for (const file of files) { add(bundle, `04_DOCUMENTACAO/${file}`, fs.readFileSync(path.join(root, file))); }
    for (const name of ["LICENSE", "THIRD_PARTY_NOTICES.md", "PRIVACY.md", "TERMS.md", "SUPPORT.md"]) { add(bundle, `05_LEGAL/${name}`, fs.readFileSync(path.join(root, name))); }
    for (const file of files.filter(n => n.startsWith("appsource" + path.sep) || n.startsWith("demo" + path.sep))) { add(bundle, `02_MATERIAIS/${file}`, fs.readFileSync(path.join(root, file))); }
    if (fs.existsSync(path.join(root, "demo/TempoFlex-Demo.pbix"))) { add(bundle, "02_DEMONSTRACAO/TempoFlex-Demo.pbix", fs.readFileSync(path.join(root, "demo/TempoFlex-Demo.pbix"))); }
    const manifest = { ...state, repository: pkg.repository.url, files: files.map(file => ({ path: file.replaceAll("\\", "/"), sha256: crypto.createHash("sha256").update(fs.readFileSync(path.join(root, file))).digest("hex") })) };
    add(bundle, "06_CONTROLE/release.json", JSON.stringify(manifest, null, 2));
    add(bundle, "06_CONTROLE/PENDENCIAS.md", state.pending.length ? `# Submissão ainda pendente\n\n${state.pending.map(s => `- ${s}`).join("\n")}\n\nAs prévias ilustrativas não substituem capturas do Power BI.\n` : "# Materiais conferidos\n\nAprovação da Microsoft ainda depende da revisão no Partner Center.\n");
    fs.writeFileSync(path.join(dist, `${fileName}-publicacao.zip`), await bundle.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
    fs.writeFileSync(path.join(dist, `${fileName}-release.json`), JSON.stringify(manifest, null, 2) + "\n");
    const sums = [`${fileName}-source.zip`, `${fileName}-publicacao.zip`, `${pbi.visual.guid}.${pbi.visual.version}.pbiviz`].map(name => `${crypto.createHash("sha256").update(fs.readFileSync(path.join(dist, name))).digest("hex")}  ${name}`);
    fs.writeFileSync(path.join(dist, `${fileName}-SHA256SUMS.txt`), sums.join("\n") + "\n");
    console.log(`Pacotes em dist/. Pronto para submissão: ${state.readyForSubmission}. Nenhum aplicativo aberto e nenhum arquivo enviado.`);
})().catch(err => { console.error(err); process.exitCode = 1; });
