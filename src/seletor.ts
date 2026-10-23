import * as P from "./precisao";

/** Popup em top layer, sobre os outros controles do visual. */
export class Seletor {
    private popup: HTMLDivElement;
    constructor(raiz: HTMLElement) {
        this.popup = document.createElement("div");
        this.popup.className = "fdp-popup";
        this.popup.setAttribute("popover", "auto");
        raiz.appendChild(this.popup);
    }

    fechar(): void { this.popup.hidePopover(); }

    private abrir(ancora: HTMLElement): void {
        this.popup.showPopover();
        const r = ancora.getBoundingClientRect();
        this.popup.style.left = `${Math.max(0, Math.min(r.left, window.innerWidth - this.popup.offsetWidth))}px`;
        this.popup.style.top = `${Math.max(0, Math.min(r.bottom + 3, window.innerHeight - this.popup.offsetHeight))}px`;
    }

    private botao(texto: string, pai: HTMLElement, acao: () => void): HTMLButtonElement {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = texto;
        b.addEventListener("click", acao);
        pai.appendChild(b);
        return b;
    }

    calendario(ancora: HTMLElement, atual: Date, nivel: P.Nivel, min: Date | null, max: Date | null, confirmar: (d: Date) => void): void {
        this.popup.replaceChildren();
        this.popup.setAttribute("aria-label", "Selecionar data");
        const campos: Record<string, HTMLSelectElement | HTMLInputElement> = {};
        const linha = document.createElement("div");
        linha.className = "fdp-componentes";
        this.popup.appendChild(linha);
        const campo = (nome: string, valor: number, de: number, ate: number) => {
            const label = document.createElement("label");
            label.textContent = nome;
            const select = document.createElement("select");
            select.setAttribute("aria-label", nome);
            for (let i = de; i <= ate; i++) {
                const op = document.createElement("option");
                op.value = String(i);
                op.textContent = String(i).padStart(2, "0");
                select.appendChild(op);
            }
            select.value = String(valor);
            campos[nome] = select;
            label.appendChild(select);
            linha.appendChild(label);
            return select;
        };
        campo("Ano", atual.getFullYear(), Math.min(min?.getFullYear() ?? 1900, atual.getFullYear()), Math.max(max?.getFullYear() ?? 2100, atual.getFullYear()));
        if (nivel !== "ano") { campo("Mês", atual.getMonth() + 1, 1, 12); }
        const dias = document.createElement("div");
        dias.className = "fdp-dias";
        let dia = atual.getDate();
        const valor = (nome: string, padrao: number) => campos[nome] ? +campos[nome].value : padrao;
        const escolhido = () => new Date(valor("Ano", atual.getFullYear()), valor("Mês", 1) - 1,
            ["ano", "mes"].includes(nivel) ? 1 : dia, valor("Hora", 0), valor("Minuto", 0), valor("Segundo", 0));
        const permitido = (d: Date) => (!min || P.proximo(d, nivel) > min) && (!max || P.inicio(d, nivel) <= max);
        const aplicar = this.botao("Aplicar", this.popup, () => { const d = escolhido(); if (permitido(d)) { this.fechar(); confirmar(d); } });
        const redesenhar = () => {
            dias.replaceChildren();
            const ano = valor("Ano", atual.getFullYear());
            const mes = valor("Mês", 1) - 1;
            dia = Math.min(dia, new Date(ano, mes + 1, 0).getDate());
            if (!["ano", "mes"].includes(nivel)) {
                for (const nome of ["D", "S", "T", "Q", "Q", "S", "S"]) {
                    const cab = document.createElement("span"); cab.textContent = nome; dias.appendChild(cab);
                }
                for (let i = 0; i < new Date(ano, mes, 1).getDay(); i++) { dias.appendChild(document.createElement("span")); }
                for (let i = 1; i <= new Date(ano, mes + 1, 0).getDate(); i++) {
                    const b = this.botao(String(i), dias, () => { dia = i; redesenhar(); });
                    b.setAttribute("aria-pressed", String(i === dia));
                    b.setAttribute("aria-label", `${i}/${mes + 1}/${ano}`);
                    b.disabled = (!!min && P.proximo(new Date(ano, mes, i), "dia") <= min) || (!!max && new Date(ano, mes, i) > max);
                }
            }
            aplicar.disabled = !permitido(escolhido());
        };
        this.popup.insertBefore(dias, aplicar);
        if (["hora", "minuto", "segundo"].includes(nivel)) { campo("Hora", atual.getHours(), 0, 23); }
        if (["minuto", "segundo"].includes(nivel)) { campo("Minuto", atual.getMinutes(), 0, 59); }
        if (nivel === "segundo") { campo("Segundo", atual.getSeconds(), 0, 59); }
        for (const c of Object.values(campos)) { c.addEventListener("change", redesenhar); }
        redesenhar();
        this.abrir(ancora);
    }

    dropdown(ancora: HTMLElement, valores: Date[], nivel: P.Nivel, formato: string, atual: Date | null, confirmar: (d: Date) => void, aviso = ""): void {
        this.popup.replaceChildren();
        this.popup.setAttribute("aria-label", "Selecionar uma data");
        if (aviso) { const p = document.createElement("p"); p.textContent = aviso; p.setAttribute("role", "status"); this.popup.appendChild(p); }
        const busca = document.createElement("input");
        busca.type = "search"; busca.placeholder = "Buscar data…"; busca.setAttribute("aria-label", "Buscar data");
        this.popup.appendChild(busca);
        const lista = document.createElement("div");
        lista.className = "fdp-opcoes"; lista.setAttribute("role", "listbox"); lista.setAttribute("aria-label", "Datas em ordem cronológica");
        this.popup.appendChild(lista);
        const unicos = [...new Set(valores.map(d => +P.inicio(d, nivel)))].sort((a, b) => a - b)
            .map(v => ({ data: new Date(v), texto: P.formatar(new Date(v), nivel, formato) }));
        let limite = 200;
        const desenhar = () => {
            lista.replaceChildren();
            const itens = unicos.filter(v => v.texto.toLocaleLowerCase().includes(busca.value.toLocaleLowerCase()));
            for (const item of itens.slice(0, limite)) {
                const b = this.botao(item.texto, lista, () => { this.fechar(); confirmar(item.data); });
                b.setAttribute("role", "option"); b.setAttribute("aria-selected", String(!!atual && +P.inicio(atual, nivel) === +item.data));
            }
            if (itens.length > limite) { this.botao(`Mostrar mais (${itens.length - limite})`, lista, () => { limite += 200; desenhar(); }); }
            if (!itens.length) { lista.textContent = "Nenhuma data encontrada"; }
        };
        busca.addEventListener("input", () => { limite = 200; desenhar(); });
        desenhar(); this.abrir(ancora); busca.focus();
    }
}
