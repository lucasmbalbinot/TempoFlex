// Cole como uma consulta em branco no Power Query. Não acessa arquivos, rede ou credenciais.
let
    Dias = List.Dates(#date(2025, 1, 1), 1095, #duration(1, 0, 0, 0)),
    Horarios = {#time(8, 0, 0), #time(14, 30, 45), #time(14, 30, 46), #time(18, 15, 0)},
    Linhas = List.Combine(List.Transform(List.Positions(Dias), (i) =>
        List.Transform(List.Positions(Horarios), (j) => {
            DateTime.From(Dias{i}) + #duration(0, Time.Hour(Horarios{j}), Time.Minute(Horarios{j}), Time.Second(Horarios{j})),
            Dias{i},
            {"Operações", "Comercial", "Tecnologia"}{Number.Mod(i + j, 3)},
            100 + Number.Mod(i * 17 + j * 43, 901),
            1 + Number.Mod(i + j, 12)
        })
    )),
    Tabela = #table(type table [DataHora = datetime, Data = date, Area = text, Valor = Int64.Type, Quantidade = Int64.Type], Linhas)
in
    Tabela
