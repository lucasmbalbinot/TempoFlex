/* Renderização de SVG e dados sintéticos, sem navegador ou controle de aplicativos. */
const fs = require("node:fs");
const path = require("node:path");
const { Resvg } = require("@resvg/resvg-js");
const root = path.resolve(__dirname, "..");
const media = path.join(root, "appsource/media");
fs.mkdirSync(media, { recursive: true });
const esc = s => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const text = (x, y, s, size = 22, fill = "#244A55", weight = 400) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}">${esc(s)}</text>`;
const rect = (x, y, w, h, fill = "#FFFFFF", stroke = "#CDDEDA", r = 10) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g font-family="Arial, sans-serif">${body}</g></svg>`;
function render(source, output, width) {
    const renderer = new Resvg(source, { fitTo: { mode: "width", value: width }, font: { loadSystemFonts: true, defaultFontFamily: "Arial" } });
    fs.writeFileSync(output, renderer.render().asPng());
}
const logo = svg(300, 300, `<rect width="300" height="300" rx="56" fill="#153B46"/><rect x="49" y="65" width="202" height="184" rx="24" fill="#B5EAD6"/><g fill="none" stroke="#153B46" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"><path d="M55 119h190M97 49v44M203 49v44M94 178h104m-28-28 29 28-29 28"/></g>`);
fs.writeFileSync(path.join(media, "logo.svg"), logo);
render(logo, path.join(media, "logo-300x300.png"), 300);
render(logo, path.join(root, "assets/icon.png"), 20);

const scenarios = [
    { title: "Seu período, suas regras", subtitle: "Entre: duas datas, um intervalo inclusivo", mode: "entre", note: "Períodos rápidos e calendário nativo no mesmo filtro." },
    { title: "Uma caixa. Uma competência inteira.", subtitle: "É: selecione ano, mês, dia, hora, minuto ou segundo", mode: "igual", note: "A unidade escolhida define os limites completos do filtro." },
    { title: "Encontre a data que você precisa", subtitle: "Dropdown: busca e ordem cronológica", mode: "dropdown", note: "A lista depende do contexto e dos dados recebidos pelo Power BI." },
    { title: "Atalhos que cabem no seu relatório", subtitle: "Somente períodos rápidos, com as caixas ocultas", mode: "periodos", note: "Escolha posição, organização, cores e rótulos dos botões." },
    { title: "Seu mês começa no dia 26?", subtitle: "Competências e anos fiscais configuráveis", mode: "ciclo", note: "competencia = mensal dia 26" },
];
scenarios.forEach((s, i) => {
    let body = `<rect width="1366" height="768" fill="#F2F7F5"/><rect width="1366" height="112" fill="#153B46"/>`;
    body += text(52, 70, "TempoFlex", 38, "#FFFFFF", 700) + text(950, 68, "Filtro de datas para Power BI", 23, "#B5EAD6");
    body += text(52, 177, s.title, 39, "#173D47", 700) + text(54, 221, s.subtitle, 24, "#59777F");
    body += rect(52, 261, 1262, 343) + text(84, 305, "Período de análise", 24, "#173D47", 700);
    if (s.mode === "entre" || s.mode === "ciclo") {
        const ini = s.mode === "ciclo" ? "26/09/2026" : "01/10/2026";
        body += rect(84, 334, 525, 64) + rect(757, 334, 525, 64) + text(106, 376, ini, 29) + text(677, 375, "—", 29) + text(779, 376, "23/10/2026", 29);
        body += `<path d="M100 436h1160" stroke="#DBE7E4" stroke-width="7" stroke-linecap="round"/><path d="M100 436h820" stroke="#287B68" stroke-width="7" stroke-linecap="round"/><g fill="white" stroke="#287B68" stroke-width="4"><circle cx="100" cy="436" r="13"/><circle cx="920" cy="436" r="13"/></g>`;
    } else if (s.mode === "igual") {
        body += rect(84, 334, 1198, 64) + text(106, 376, "10/2026", 29);
        body += text(86, 449, "01/10/2026 00:00  ≤  Data  <  01/11/2026 00:00", 24, "#287B68", 700);
    } else if (s.mode === "dropdown") {
        body += rect(84, 332, 730, 232) + rect(101, 347, 696, 45, "#F0F6F4") + text(119, 378, "Buscar data…", 22, "#6B858D");
        body += text(120, 426, "09/2026", 24) + rect(101, 444, 696, 45, "#287B68", "#287B68", 5) + text(120, 476, "10/2026", 24, "#FFFFFF") + text(120, 530, "11/2026", 24);
        body += text(865, 385, "Sem valores repetidos", 24) + text(865, 430, "Agrupamento pelo nível", 24) + text(865, 475, "Pesquisa no texto exibido", 24);
    }
    if (s.mode !== "dropdown") {
        const labels = s.mode === "ciclo" ? ["Competência atual", "Competência anterior", "Geral"] : ["Hoje", "Mês atual", "Mês anterior", "Geral"];
        const y = s.mode === "periodos" ? 373 : 489;
        const w = (1198 - (labels.length - 1) * 16) / labels.length;
        labels.forEach((label, j) => { const x = 84 + j * (w + 16); const active = j === (s.mode === "ciclo" ? 0 : 1); body += rect(x, y, w, 61, active ? "#287B68" : "#FFFFFF") + text(x + 20, y + 39, label, 23, active ? "#FFFFFF" : "#244A55"); });
        if (s.mode === "periodos") { body += text(86, 494, "Caixas de data desligadas · Deslizante oculto automaticamente", 24, "#59777F"); }
    }
    body += text(54, 652, s.note, 24, "#466E77");
    body += rect(52, 687, 1262, 45, "#FFF4D9", "#E8D8AA", 7) + text(68, 717, "PRÉVIA ILUSTRATIVA — não é captura do Power BI; não enviar como screenshot no AppSource.", 21, "#795F28", 600);
    const source = svg(1366, 768, body);
    const name = `preview-${String(i + 1).padStart(2, "0")}`;
    fs.writeFileSync(path.join(media, `${name}.svg`), source);
    render(source, path.join(media, `${name}.png`), 1366);
});

const rows = ["DataHora,Data,Area,Valor,Quantidade"];
const times = ["08:00:00", "14:30:45", "14:30:46", "18:15:00"];
for (let i = 0; i < 1095; i++) {
    const day = new Date(Date.UTC(2025, 0, 1) + i * 86400000).toISOString().slice(0, 10);
    times.forEach((t, j) => rows.push(`${day}T${t},${day},${["Operações", "Comercial", "Tecnologia"][(i + j) % 3]},${100 + (i * 17 + j * 43) % 901},${1 + (i + j) % 12}`));
}
fs.writeFileSync(path.join(root, "demo/dados-demo.csv"), rows.join("\n") + "\n");
console.log("Gerados: logo 300×300, ícone 20×20, cinco prévias ilustrativas e 4.380 registros fictícios. Nenhum aplicativo foi aberto.");
