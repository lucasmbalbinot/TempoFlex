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
