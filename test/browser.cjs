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
    console.log("Harness gerado em .tmp/browser/index.html");
});
