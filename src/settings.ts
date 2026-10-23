"use strict";

import powerbi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { PERIODOS_PADRAO, VARIAVEIS_PADRAO } from "./periodos";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;
import Slice = formattingSettings.Slice;

function cor(name: string, displayName: string, value: string): formattingSettings.ColorPicker {
    return new formattingSettings.ColorPicker({ name, displayName, value: { value } });
}

function chave(name: string, displayName: string, value: boolean, description?: string): formattingSettings.ToggleSwitch {
    return new formattingSettings.ToggleSwitch({ name, displayName, value, description });
}

function numero(name: string, displayName: string, value: number, min = 0, max = 100): formattingSettings.NumUpDown {
    return new formattingSettings.NumUpDown({
        name, displayName, value,
        options: {
            minValue: { type: powerbi.visuals.ValidatorType.Min, value: min },
            maxValue: { type: powerbi.visuals.ValidatorType.Max, value: max },
        },
    });
}

function lista(name: string, displayName: string, itens: [string, string][], padrao: string): formattingSettings.ItemDropdown {
    const items = itens.map(([value, displayName]) => ({ value, displayName }));
    return new formattingSettings.ItemDropdown({ name, displayName, items, value: items.find(i => i.value === padrao) });
}

function fonte(familia: string, tamanho: number): formattingSettings.FontControl {
    return new formattingSettings.FontControl({
        name: "fonte",
        displayName: "Fonte",
        fontFamily: new formattingSettings.FontPicker({ name: "fontFamily", value: familia }),
        fontSize: new formattingSettings.NumUpDown({ name: "fontSize", value: tamanho }),
        bold: new formattingSettings.ToggleSwitch({ name: "bold", value: false }),
        italic: new formattingSettings.ToggleSwitch({ name: "italic", value: false }),
        underline: new formattingSettings.ToggleSwitch({ name: "underline", value: false }),
    });
}

const FONTE_PADRAO = "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";

class PeriodosCard extends Card {
    mostrar = chave("mostrar", "Mostrar", true);
    lista = new formattingSettings.TextArea({
        name: "lista",
        displayName: "Períodos (um por linha)",
        description: "Rótulo = início .. fim. Ex.: Mês anterior = inicio_mes-1m .. fim_mes-1m. Comece a linha com * para aplicar o período ao abrir o relatório. Ligue \"Guia de configuração\" para ver todas as regras dentro do visual.",
        placeholder: "Hoje = hoje",
        value: PERIODOS_PADRAO,
    });
    variaveis = new formattingSettings.TextArea({
        name: "variaveis",
        displayName: "Variáveis (uma por linha)",
        description: "Crie suas âncoras. Ex.: competencia = mensal dia 26 cria inicio_competencia (dia 26 do mês anterior) e fim_competencia (dia 25). Também: ano_fiscal = anual 01/04, ou nome = qualquer expressão.",
        placeholder: "competencia = mensal dia 26",
        value: VARIAVEIS_PADRAO,
    });
    posicao = lista("posicao", "Posição dos botões", [["abaixo", "Abaixo"], ["acima", "Acima"], ["esquerda", "À esquerda"], ["direita", "À direita"]], "abaixo");
    alinhamento = lista("alinhamento", "Alinhamento", [["inicio", "Início"], ["centro", "Centro"], ["fim", "Fim"], ["esticar", "Preencher"]], "esticar");

    /** Mostra só as opções que fazem sentido para a organização escolhida. */
    onPreProcess(): void {
        const org = String(this.organizacao.value.value);
        const lateral = ["esquerda", "direita"].includes(String(this.posicao.value.value));
        const efetiva = org === "automatica" ? (lateral ? "coluna" : "linha") : org;
        this.colunas.visible = efetiva === "grade";
        this.quebrarLinha.visible = efetiva === "linha";
        this.tamanhoArea.visible = lateral;
    }
    organizacao = lista("organizacao", "Organização", [["automatica", "Automática"], ["linha", "Lado a lado"], ["coluna", "Um embaixo do outro"], ["grade", "Grade"]], "automatica");
    colunas = numero("colunas", "Colunas da grade", 2, 1, 12);
    tamanhoArea = numero("tamanhoArea", "Largura da área nas laterais (%)", 0, 0, 80);
    quebrarLinha = chave("quebrarLinha", "Quebrar linha", true, "Lado a lado: desligado, os botões ficam numa linha só, com rolagem.");
    primeiroDiaSemana = lista("primeiroDiaSemana", "Semana começa na", [["1", "Segunda-feira"], ["0", "Domingo"]], "1");
    cliqueDesmarca = chave("cliqueDesmarca", "Clicar no botão ativo limpa o filtro", true);
    bloquearDatas = chave("bloquearDatas", "Bloquear datas com período ativo", false,
        "Com um período rápido ativo, as datas ficam só para leitura. Para editar, escolha um período que limpa o filtro (ex.: Geral) ou clique de novo no botão ativo.");
    mostrarLimpar = chave("mostrarLimpar", "Botão Limpar", false);
    textoLimpar = new formattingSettings.TextInput({ name: "textoLimpar", displayName: "Texto do botão Limpar", value: "Limpar", placeholder: "Limpar" });

    topLevelSlice = this.mostrar;
    name = "periodos";
    displayName = "Períodos rápidos";
    slices: Slice[] = [this.lista, this.variaveis, this.posicao, this.organizacao, this.colunas, this.alinhamento, this.quebrarLinha, this.tamanhoArea, this.primeiroDiaSemana,
        this.cliqueDesmarca, this.bloquearDatas, this.mostrarLimpar, this.textoLimpar];
}

class BotoesCard extends Card {
    fonte = fonte(FONTE_PADRAO, 9);
    corTexto = cor("corTexto", "Cor do texto", "#252423");
    corFundo = cor("corFundo", "Cor de fundo", "#FFFFFF");
    corBorda = cor("corBorda", "Cor da borda", "#C8C6C4");
    corTextoAtivo = cor("corTextoAtivo", "Texto (ativo)", "#FFFFFF");
    corFundoAtivo = cor("corFundoAtivo", "Fundo (ativo)", "#2F5D8A");
    corBordaAtiva = cor("corBordaAtiva", "Borda (ativo)", "#2F5D8A");
    raio = numero("raio", "Arredondamento", 4, 0, 30);
    espacamento = numero("espacamento", "Espaço entre botões", 4, 0, 40);
    preenchimento = numero("preenchimento", "Preenchimento interno", 4, 0, 30);
    larguraMinima = numero("larguraMinima", "Largura mínima", 0, 0, 400);

    name = "botoes";
    displayName = "Botões";
    slices: Slice[] = [this.fonte, this.corTexto, this.corFundo, this.corBorda, this.corTextoAtivo, this.corFundoAtivo,
        this.corBordaAtiva, this.raio, this.espacamento, this.preenchimento, this.larguraMinima];
}

class DatasCard extends Card {
    mostrar = chave("mostrar", "Mostrar", true);
    modo = lista("modo", "Tipo de seleção", [["entre", "Entre"], ["igual", "É"], ["dropdown", "Dropdown"]], "entre");
    nivel = lista("nivel", "Nível do filtro", [["dia", "dd/mm/aaaa"], ["mes", "mm/aaaa"], ["ano", "aaaa"],
        ["hora", "dd/mm/aaaa hh"], ["minuto", "dd/mm/aaaa hh:mm"], ["segundo", "dd/mm/aaaa hh:mm:ss"]], "dia");
    topLevelSlice = this.mostrar;

    onPreProcess(): void {
        const modo = String(this.modo.value.value);
        this.formato.visible = !["ano", "mes"].includes(String(this.nivel.value.value));
        this.rotuloFim.visible = modo === "entre";
        this.mostrarCalendario.visible = modo !== "dropdown";
    }

    formato = lista("formato", "Formato da data", [
        ["dd/MM/yyyy", "dd/MM/aaaa"], ["dd/MM/yy", "dd/MM/aa"], ["dd MMM yyyy", "dd mmm aaaa"],
        ["dd.MM.yyyy", "dd.MM.aaaa"], ["MM/dd/yyyy", "MM/dd/aaaa"], ["yyyy-MM-dd", "aaaa-MM-dd"]], "dd/MM/yyyy");
    alinhamentoTexto = lista("alinhamentoTexto", "Alinhamento da data", [["left", "Esquerda"], ["center", "Centro"], ["right", "Direita"]], "left");
    fonte = fonte(FONTE_PADRAO, 10);
    corTexto = cor("corTexto", "Cor do texto", "#252423");
    corFundo = cor("corFundo", "Cor de fundo", "#FFFFFF");
    corBorda = cor("corBorda", "Cor da borda", "#C8C6C4");
    raio = numero("raio", "Arredondamento", 2, 0, 30);
    mostrarRotulos = chave("mostrarRotulos", "Mostrar rótulos", false);
    rotuloInicio = new formattingSettings.TextInput({ name: "rotuloInicio", displayName: "Rótulo do início", value: "De", placeholder: "De" });
    rotuloFim = new formattingSettings.TextInput({ name: "rotuloFim", displayName: "Rótulo do fim", value: "Até", placeholder: "Até" });
    mostrarCalendario = chave("mostrarCalendario", "Ícone de calendário", true);
    limitarAosDados = chave("limitarAosDados", "Limitar às datas dos dados", true,
        "As datas digitadas ficam entre a primeira e a última data do campo, como no segmentador nativo.");

    name = "datas";
    displayName = "Caixas de data";
    slices: Slice[] = [this.modo, this.nivel, this.formato, this.alinhamentoTexto, this.fonte, this.corTexto, this.corFundo, this.corBorda, this.raio,
        this.mostrarRotulos, this.rotuloInicio, this.rotuloFim, this.mostrarCalendario, this.limitarAosDados];
}

class DeslizanteCard extends Card {
    mostrar = chave("mostrar", "Mostrar", true);
    corTrilha = cor("corTrilha", "Cor da trilha", "#E1DFDD");
    corIntervalo = cor("corIntervalo", "Cor do intervalo", "#2F5D8A");
    corAlca = cor("corAlca", "Cor das alças", "#2F5D8A");

    topLevelSlice = this.mostrar;
    name = "deslizante";
    displayName = "Controle deslizante";
    slices: Slice[] = [this.corTrilha, this.corIntervalo, this.corAlca];
}

class GuiaCard extends Card {
    mostrar = chave("mostrar", "Mostrar guia no visual", false,
        "Mostra dentro do visual, só no modo de edição, todas as regras dos períodos, as âncoras e variáveis com as datas que elas dão hoje, exemplos e os erros encontrados. Desligue quando terminar.");

    name = "guia";
    displayName = "Guia de configuração";
    slices: Slice[] = [this.mostrar];
}

export class ConfiguracaoVisual extends Model {
    datas = new DatasCard();
    periodos = new PeriodosCard();
    guia = new GuiaCard();
    botoes = new BotoesCard();
    deslizante = new DeslizanteCard();

    cards = [this.datas, this.periodos, this.guia, this.botoes, this.deslizante];
}
