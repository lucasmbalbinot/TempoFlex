const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const less = require("less");
const dir = path.resolve(".tmp/browser");
fs.mkdirSync(dir, { recursive: true });
webpack({
    mode: "development", entry: path.resolve("test/visual.browser.ts"),
    output: { path: dir, filename: "test.js" },
    resolve: { extensions: [".ts", ".js"], alias: { "powerbi-visuals-api$": path.resolve("test/powerbi.mock.ts") } },
    module: { rules: [
        { test: /\.ts$/, use: { loader: "ts-loader", options: { transpileOnly: true } } },
        { test: /\.less$/, type: "asset/source" },
    ] },
}, async (err, stats) => {
    if (err || stats.hasErrors()) { console.error(err || stats.toString()); process.exitCode = 1; return; }
    const css = await less.render(fs.readFileSync("style/visual.less", "utf8"));
    fs.writeFileSync(path.join(dir, "index.html"), `<!doctype html><meta charset="utf-8"><title>Testes do filtro</title><style>${css.css}</style><h1>Testes do filtro</h1><pre id="resultado"></pre><script src="test.js"></script>`);
    fs.writeFileSync(path.join(dir, "frame.html"), '<!doctype html><meta charset="utf-8"><title>Calendário nativo em visual pequeno</title><p>Iframe de 400 × 65 pixels: o calendário deve ultrapassar a borda.</p><iframe title="Visual pequeno" src="index.html?compact=1" style="width:400px;height:65px;border:2px solid #2F5D8A"></iframe>');
    console.log("Harness gerado em .tmp/browser/index.html");
});
