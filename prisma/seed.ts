import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, Posicao, PresencaStatus } from "../src/generated/prisma"
import bcrypt from "bcryptjs"

function d(str: string | null | undefined): Date | null {
  if (!str || str.trim() === "" || str === "S/N") return null
  const parts = str.split("/")
  if (parts.length === 3) {
    const [day, month, year] = parts
    const date = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00.000Z`)
    if (!isNaN(date.getTime())) return date
  }
  return null
}

const members = [
  {
    cim: "219352", nome: "ALTEMAR DUTRA DE OLIVEIRA JUNIOR", posicao: "MI" as Posicao,
    dataNascimento: "16/04/1969", dataIniciacao: "26/04/2003", dataElevacao: "20/05/2004",
    dataExaltacao: "02/12/2004", dataInstalacao: "18/06/2011",
    rua: "Rua Angelo Nardini", numero: "60 - casa 3", bairro: "Loanda", cep: "12945-390", cidade: "Atibaia-SP",
    telefone: "995534001", email: "alt.dep@gmail.com",
    conjuge: "Itais Rachel Ferreira Dutra de Oliveira", nascimentoConjuge: "16/08/1969", dataCasamento: "23/01/1992",
    filhos: [{ nome: "Isabela Ferreira Dutra de Oliveira", dataNascimento: "04/03/1993" }, { nome: "Veridiana Ferreira Dutra de Oliveira", dataNascimento: "06/10/1998" }],
  },
  {
    cim: "340538", nome: "ALBERTO OLIVEIRA LIMA", posicao: "CM" as Posicao,
    dataNascimento: "20/10/1988", dataIniciacao: "07/10/2023", dataElevacao: "27/03/2025", dataExaltacao: "11/12/2025",
    rua: "Rua Dona Virginia", numero: "115", bairro: "Loanda", cep: "12940510", cidade: "Atibaia-SP",
    telefone: "981900889", email: "alberto_olima@gmail.com",
    conjuge: "Thaina Sanches Costa Lima", nascimentoConjuge: "07/02/1992", dataCasamento: "08/10/2022",
    filhos: [{ nome: "Theodoro Costa Lima", dataNascimento: "06/02/2025" }],
  },
  {
    cim: "258562", nome: "ANDRE GODOI LOMBA", posicao: "MM" as Posicao,
    dataNascimento: "29/12/1974", dataIniciacao: "21/11/2009", dataElevacao: "17/03/2011", dataExaltacao: "06/10/2011",
    rua: "Sitio Santa Maria", numero: "S/N", bairro: "Cachoeira", cep: "12940-000", cidade: "Atibaia-SP",
    telefone: "982489841", email: "andregodoilomba1@hotmail.com",
    conjuge: "Jaqueline Cabral de Lima", nascimentoConjuge: "08/02/1985",
    filhos: [{ nome: "Maria Luiza Cabral Godoi Lomba", dataNascimento: "30/07/2012" }, { nome: "Lucas de Azevedo Godoi Lomba", dataNascimento: "27/05/1999" }],
  },
  {
    cim: "337950", nome: "ANDRE LUIZ ELESBÃO PEDROSO", posicao: "MM" as Posicao,
    dataNascimento: "19/05/1980", dataIniciacao: "03/06/2023", dataElevacao: "15/08/2024", dataExaltacao: "31/07/2025",
    rua: "Rua Major Alvim", numero: "969 Ap 131", bairro: "Alvinopolis", cep: "12942-550", cidade: "Atibaia-SP",
    telefone: "956080433", email: "andreelesbao.pe@gmail.com",
    dataCasamento: "Divorciado",
    filhos: [{ nome: "Davi Mansur Elesbão", dataNascimento: "31/01/2013" }],
  },
  {
    cim: "321209", nome: "ARÃO CALIXTO", posicao: "MM" as Posicao,
    dataNascimento: "07/03/1971", dataIniciacao: "28/11/2019", dataElevacao: "09/03/2023", dataExaltacao: "23/05/2024",
    telefone: "", email: "",
    conjuge: "Tatiane de Souza Calixto", nascimentoConjuge: "13/03/1984",
    filhos: [{ nome: "Pedro Henrique Calixto", dataNascimento: "26/06/2007" }, { nome: "Rebeca Calixto", dataNascimento: "26/06/2012" }, { nome: "Weslei Spinasi Calixto", dataNascimento: "11/07/1994" }, { nome: "Abner Spinasi Calixto", dataNascimento: "09/10/2021" }],
  },
  {
    cim: "198683", nome: "ARY CÂNDIDO DA SILVA JÚNIOR", posicao: "MM" as Posicao,
    dataNascimento: "10/03/1964", dataIniciacao: "05/12/1998", dataElevacao: "13/04/2000", dataExaltacao: "26/04/2001",
    rua: "Rua Dona Sylvia Finco Costa", numero: "230", bairro: "Loanda", cep: "12945-080", cidade: "Atibaia-SP",
    telefone: "971335124", email: "aricandido@uol.com",
    conjuge: "Nadia Brugnara da Silva", nascimentoConjuge: "02/03/1963", dataCasamento: "17/09/1988",
    filhos: [{ nome: "Carina Brugnara Silva", dataNascimento: "21/12/1988" }, { nome: "Marcelo Brugnara Silva", dataNascimento: "09/08/1989" }, { nome: "Alessandro Grugnara Silva", dataNascimento: "14/09/1988" }],
  },
  {
    cim: "227748", nome: "BENEDITO WANDERLEY LOPES", posicao: "MI" as Posicao,
    dataNascimento: "23/12/1969", dataIniciacao: "09/10/2004", dataElevacao: "13/10/2005", dataExaltacao: "26/04/2007", dataInstalacao: "01/06/2017",
    rua: "Rua Vinícius de Morais", numero: "155", bairro: "Loanda", cep: "12945-350", cidade: "Atibaia-SP",
    telefone: "999900093", email: "nene.lopes@uol.com.br",
    conjuge: "Ligia Aparecida Turman Lopes", nascimentoConjuge: "22/02/1977", dataCasamento: "06/01/1996",
    filhos: [{ nome: "Guilherme Bruno Turman Lopes", dataNascimento: "06/03/1996" }],
  },
  {
    cim: "349463", nome: "BRUNO SOUZA OLIVEIRA", posicao: "AM" as Posicao,
    dataNascimento: "19/02/1992", dataIniciacao: "26/10/2024",
    rua: "Rua Maestro Juvencio Maciel da Fonseca", numero: "66", bairro: "Alvinopolis", cep: "12942-680", cidade: "Atibaia-SP",
    telefone: "950759494", email: "azeitefilms@hotmail.com",
    conjuge: "Tania Cristina de Oliveira", nascimentoConjuge: "06/10/1987", dataCasamento: "01/10/2017",
    filhos: [{ nome: "Breno Henrique de Oliveira", dataNascimento: "09/12/2013" }],
  },
  {
    cim: "340539", nome: "CARLOS HOLMES VELANDIA SALAZAR", posicao: "CM" as Posicao,
    dataNascimento: "07/09/1962", dataIniciacao: "07/10/2023", dataElevacao: "27/03/2025", dataExaltacao: "11/12/2025",
    rua: "Rua Eunice Ferraz Fernandes", numero: "152 ap 23", bairro: "Jardim do Lago", cep: "12914-500", cidade: "Bragança Paulista-SP",
    telefone: "970442009", email: "carloshvelandia@gmail.com",
    conjuge: "Jamile Aparecida dos Santos", nascimentoConjuge: "08/05/1994", dataCasamento: "15/06/2020",
    filhos: [{ nome: "Martin Velandia dos Santos", dataNascimento: "26/01/2022" }],
  },
  {
    cim: "203956", nome: "CÉLIO EGIDIO DA SILVA", posicao: "MM" as Posicao,
    dataNascimento: "23/11/1965", dataIniciacao: "24/11/1999", dataElevacao: "22/11/2000", dataExaltacao: "18/06/2001", dataRegulFiliacao: "13/03/2014",
    rua: "Rua das Sairas - Conjunto Porto Atibaia", numero: "300", bairro: "Guaxinduva", cep: "12945-755", cidade: "Atibaia-SP",
    telefone: "999360012", email: "celioegidio@gmail.com",
    conjuge: "Thais Ozorio Egidio", nascimentoConjuge: "18/02/1970", dataCasamento: "04/04/1998",
    filhos: [{ nome: "Thaisa Ozorio Egidio", dataNascimento: "10/07/1998" }, { nome: "Rafael Ozorio Egidio", dataNascimento: "01/07/2004" }],
  },
  {
    cim: "204340", nome: "CID AUGUSTO GRANADO SOARES", posicao: "MM" as Posicao,
    dataNascimento: "26/03/1953", dataIniciacao: "26/02/2000", dataElevacao: "08/11/2001", dataExaltacao: "28/11/2002",
    rua: "Rua Aluísio Oliveira da Costa", numero: "120", bairro: "Vila Petrópolis", cep: "12940-650", cidade: "Atibaia-SP",
    telefone: "953229953", email: "cidgranado@hotmail.com",
    conjuge: "Rosangela M. R. Granado Soares", nascimentoConjuge: "08/12/1955", dataCasamento: "04/04/1998",
    filhos: [{ nome: "Cid Augusto Granado Soares Junior", dataNascimento: "28/11/1980" }, { nome: "Janaina Rodrigues Granado Soares Junior", dataNascimento: "11/11/1984" }],
  },
  {
    cim: "289822", nome: "CLAUDIO LEANO GALVES", posicao: "MM" as Posicao,
    dataNascimento: "15/09/1958", dataIniciacao: "08/11/2014", dataElevacao: "26/11/2015", dataExaltacao: "09/06/2016",
    rua: "Rua Comendador Edson Liz Rizzo", numero: "708", bairro: "Caetetuba", cep: "12951-560", cidade: "Atibaia-SP",
    telefone: "948435629", email: "rafael.leano@uol.com.br",
    conjuge: "Ivete Lourenço Leano", nascimentoConjuge: "15/01/1967", dataCasamento: "05/04/2013",
    filhos: [{ nome: "Mariana Aline Lourenço Veloso Braga", dataNascimento: "26/03/1992" }, { nome: "Rafael Perline Leano", dataNascimento: "02/07/1984" }, { nome: "Gabriel Perline Leno", dataNascimento: "09/04/1986" }, { nome: "Arlindo Veloso Braga Junior", dataNascimento: "09/11/1996" }],
  },
  {
    cim: "212257", nome: "DANILO CINTRA", posicao: "MI" as Posicao,
    dataNascimento: "28/04/1956", dataIniciacao: "06/10/2001", dataElevacao: "07/11/2002", dataExaltacao: "12/06/2003", dataInstalacao: "01/06/2013",
    rua: "Rua Wilson Muner", numero: "65", bairro: "Jardim do Lago", cep: "12914-550", cidade: "Bragança Paulista-SP",
    telefone: "998514560", email: "danilocin@uol.com.br",
    conjuge: "Vera Lucia Luiz Afonso Dutra Cintra", nascimentoConjuge: "08/06/1962", dataCasamento: "27/10/1944",
    filhos: [{ nome: "Mariana Cintra", dataNascimento: "12/04/1987" }, { nome: "Juliana Cintra", dataNascimento: "30/09/1997" }],
  },
  {
    cim: "279771", nome: "FÁBIO COSTA JÚNIOR", posicao: "MM" as Posicao,
    dataNascimento: "09/07/1973", dataIniciacao: "13/04/2013", dataElevacao: "24/07/2014", dataExaltacao: "19/02/2015", dataInstalacao: "26/06/2025",
    rua: "Rua Augusto Simões Netto", numero: "238", bairro: "Vila dos Netos", cep: "12940-382", cidade: "Atibaia-SP",
    telefone: "999099257", email: "fabio@escritoriotomaz.com.br",
    conjuge: "Gabriela Maria Sanches Costa", nascimentoConjuge: "31/10/1974", dataCasamento: "25/04/1992",
    filhos: [{ nome: "Thaina Sanches Costa", dataNascimento: "07/02/1992" }, { nome: "Thomaz Sanches Costa", dataNascimento: "03/01/1998" }],
  },
  {
    cim: "212998", nome: "FABRICIO FERREIRA PEDROSO", posicao: "MM" as Posicao,
    dataNascimento: "26/04/1978", dataIniciacao: "25/08/2001", dataElevacao: "28/09/2002", dataExaltacao: "05/04/2003", dataRegulFiliacao: "12/09/2019",
    rua: "Rua Tenente Jose Luiz Soares", numero: "401", bairro: "Jardim Alvinopolis", cep: "12943-430", cidade: "Atibaia-SP",
    telefone: "999825200", email: "fabricio_ferreira78@hotmail.com",
    conjuge: "Mercilaine Lacerda", nascimentoConjuge: "20/02/1974", dataCasamento: "12/05/2015",
    filhos: [{ nome: "Isabela Gomes Ferreira Pedroso", dataNascimento: "15/04/1998" }, { nome: "Gabriela Gomes Ferreira Pedroso", dataNascimento: "17/03/1998" }],
  },
  {
    cim: "311968", nome: "FERNANDO SANTOS CAETANO", posicao: "MM" as Posicao,
    dataNascimento: "15/12/1979", dataIniciacao: "17/05/2018", dataElevacao: "11/11/2021", dataExaltacao: "20/10/2022",
    rua: "Rua das Açucenas", numero: "156", bairro: "Nova Atibaia", cep: "12950-602", cidade: "Atibaia-SP",
    telefone: "940359988", email: "fernandoscaetano@gmail.com",
    conjuge: "Fernanda", dataCasamento: "Viuvo",
    filhos: [{ nome: "Jose Ricardo G. S. Caetano", dataNascimento: "21/06/2006" }, { nome: "Fernanda Gabriela G. S. Caetano", dataNascimento: "15/06/2001" }],
  },
  {
    cim: "236108", nome: "FERNANDO LUÍS CAMARGO DE ARAÚJO", posicao: "MI" as Posicao,
    dataNascimento: "31/12/1965", dataIniciacao: "27/05/2006", dataElevacao: "28/06/2007", dataExaltacao: "04/04/2008", dataInstalacao: "13/06/2019",
    rua: "Alameda Edimburgo", numero: "30", bairro: "Parque das Nações", cep: "12944-373", cidade: "Atibaia-SP",
    telefone: "972018302", email: "camargoaraujo@bol.com.br",
    conjuge: "Elki Sakaki de Araujo", nascimentoConjuge: "31/01/1962", dataCasamento: "14/07/1990",
    filhos: [{ nome: "Beatriz Sakaki Camargo de Araujo", dataNascimento: "14/06/1995" }],
  },
  {
    cim: "225877", nome: "FERNANDO DA SILVA MAGALHÃES", posicao: "MM" as Posicao,
    dataNascimento: "26/01/1952", dataIniciacao: "22/09/1985", dataElevacao: "04/09/1986", dataExaltacao: "17/07/1987", dataRegulFiliacao: "18/05/2004",
    rua: "Sitio Santa Maria", numero: "S/N", bairro: "Cachoeira", cep: "12940-000", cidade: "Atibaia-SP",
    telefone: "948437302", email: "FERNANDOPUPUNHA@HOTMAIL.COM",
    conjuge: "Maria Saude Godoi", nascimentoConjuge: "16/08/1956", dataCasamento: "05/09/2001",
    filhos: [],
  },
  {
    cim: "141159", nome: "FERNANDO MIGUEL LORIANO", posicao: "MI" as Posicao,
    dataNascimento: "08/05/1949", dataIniciacao: "02/07/1983", dataElevacao: "10/02/1984", dataExaltacao: "08/06/1984", dataInstalacao: "05/06/1987", dataRegulFiliacao: "04/06/1998",
    rua: "Avenida Dona Gertrudes", numero: "272", bairro: "Alvinopolis", cep: "12942-540", cidade: "Atibaia-SP",
    telefone: "995741846", email: "fmlori-del@uol.com.br",
    dataCasamento: "Viuvo",
    filhos: [{ nome: "Fernando Henrique Logsdon Loriano", dataNascimento: "06/12/1984" }, { nome: "Ligia Paula Logsdon Loriano", dataNascimento: "09/05/1982" }],
  },
  {
    cim: "183931", nome: "GERALDINO DE FARIA", posicao: "MM" as Posicao,
    dataNascimento: "09/10/1944", dataIniciacao: "13/10/1989", dataElevacao: "07/07/1990", dataExaltacao: "29/09/1990",
    rua: "Rua Freitas", numero: "425", bairro: "Matadouro", cep: "12910-340", cidade: "Bragança Paulista-SP",
    telefone: "995382773", email: "",
    conjuge: "Darzila de Lima Faria", nascimentoConjuge: "17/07/1949", dataCasamento: "31/05/1969",
    filhos: [{ nome: "Flavia Faria", dataNascimento: "12/04/1975" }],
  },
  {
    cim: "256908", nome: "GERALDO GOMES FRIES", posicao: "MM" as Posicao,
    dataNascimento: "20/01/1956", dataIniciacao: "13/09/2009", dataElevacao: "11/11/2010", dataExaltacao: "06/10/2011",
    rua: "Rua Violetas", numero: "515", bairro: "Jd dos Pinheiros", cep: "12945-550", cidade: "Atibaia-SP",
    telefone: "981329802", email: "ranchodaviola77@gmail.com",
    dataCasamento: "Viuvo",
    filhos: [{ nome: "Lucas Scardine Fries", dataNascimento: "26/04/1990" }, { nome: "Jose Alex Scardine Fries", dataNascimento: "16/06/1999" }, { nome: "Pedro Scardine Fries", dataNascimento: "04/09/1991" }],
  },
  {
    cim: "337951", nome: "GRACILIANO BASILIO DE MORAES", posicao: "MM" as Posicao,
    dataNascimento: "09/04/1980", dataIniciacao: "03/06/2023", dataElevacao: "15/08/2024", dataExaltacao: "15/08/2024",
    rua: "Rua Rubens Paiva", numero: "582 ap 01", bairro: "Nova Gardenia", cep: "12946-290", cidade: "Atibaia-SP",
    telefone: "997116036", email: "gracilianomoraes@yahoo.com.br",
    conjuge: "Mariene Aparecida de Godoy", nascimentoConjuge: "08/05/1980", dataCasamento: "10/05/2014",
    filhos: [{ nome: "Gabriel Basilio de Moraes", dataNascimento: "26/07/2007" }],
  },
  {
    cim: "331377", nome: "HELDER DE MIRANDA RUZISKA", posicao: "CM" as Posicao,
    dataNascimento: "27/03/1984", dataIniciacao: "10/08/2022", dataElevacao: "20/09/2023", dataExaltacao: "11/12/2025", dataRegulFiliacao: "28/11/2024",
    telefone: "", email: "",
    conjuge: "Claudia Faccio de Souza Queiroz", nascimentoConjuge: "15/08/1983", dataCasamento: "07/05/2022",
    filhos: [{ nome: "Sol", dataNascimento: "29/08/2022" }, { nome: "Miguel de Souza Queiroz", dataNascimento: "30/01/2007" }],
  },
  {
    cim: "222993", nome: "JOSÉ CARLOS GARCIA FERREIRA", posicao: "MM" as Posicao,
    dataNascimento: "10/01/1955", dataIniciacao: "29/11/2003", dataElevacao: "10/02/2005", dataExaltacao: "01/09/2005",
    rua: "Alameda Joviano Alvim", numero: "115", bairro: "Gardenia", cep: "12940-000", cidade: "Atibaia-SP",
    telefone: "982022782", email: "garciaferreira@uol.com.br",
    conjuge: "Sandra Mara Sonvezzo Garcia", nascimentoConjuge: "09/06/1957", dataCasamento: "24/04/1982",
    filhos: [{ nome: "Ana Gabriela Sonvezzo Garcia", dataNascimento: "24/11/1983" }, { nome: "Ligia Liz Sonvezzo Garcia", dataNascimento: "16/07/1987" }],
  },
  {
    cim: "200475", nome: "JOSE LUIZ DE OLIVEIRA", posicao: "MI" as Posicao,
    dataNascimento: "06/04/1964", dataIniciacao: "24/05/1997", dataElevacao: "30/06/1998", dataExaltacao: "23/02/1999", dataInstalacao: "08/06/2004", dataRegulFiliacao: "04/11/2025",
    rua: "Rua Hades 106 Condominio Itapora", numero: "106", bairro: "Cond itaporã", cidade: "Atibaia-SP",
    telefone: "", email: "zeluiz@valorpedras.com.br",
    conjuge: "Valeria Aparecida Brocheta de Oliveira", nascimentoConjuge: "20/03/1965", dataCasamento: "27/01/1990",
    filhos: [{ nome: "Raul Brocheta de Oliveira", dataNascimento: "09/03/1995" }],
  },
  {
    cim: "342159", nome: "JOSE MILTON RUIZ LOPES", posicao: "MM" as Posicao,
    dataNascimento: "06/07/1963", dataIniciacao: "26/04/2019", dataElevacao: "13/12/2021", dataExaltacao: "04/11/2022", dataRegulFiliacao: "26/09/2024",
    rua: "Rua das Lantanas", numero: "235", bairro: "Jd Estancia Brasil", cep: "12949013", cidade: "Atibaia-SP",
    telefone: "971261543", email: "mlopes@hotmail.com",
    conjuge: "Luiza de Fatima de Oliveira Lopes", nascimentoConjuge: "27/04/1964", dataCasamento: "05/10/1985",
    filhos: [{ nome: "Clériton de Oliveira Lopes", dataNascimento: "13/08/1987" }, { nome: "Rafael de Oliveira Lopes", dataNascimento: "24/09/1993" }],
  },
  {
    cim: "212258", nome: "LÁZARO ZANI SOBRINHO", posicao: "MM" as Posicao,
    dataNascimento: "07/10/1965", dataIniciacao: "06/10/2001", dataElevacao: "20/05/2004", dataExaltacao: "29/08/2013", dataRegulFiliacao: "08/10/2012",
    rua: "Rua Augusto Simões Netto", numero: "230", bairro: "Vila dos Netos", cep: "12940-382", cidade: "Atibaia-SP",
    telefone: "981469965", email: "lazaro.sobrinho@uibgroup.com.br",
    conjuge: "Rosangela Martyr Moralez", nascimentoConjuge: "02/03/1967", dataCasamento: "Viuvo",
    filhos: [{ nome: "Otavio Netto Zani", dataNascimento: "23/07/1990" }, { nome: "Izabela Netto Zani", dataNascimento: "27/10/1995" }],
  },
  {
    cim: "349460", nome: "LEIVA VITOR BARBOSA", posicao: "AM" as Posicao,
    dataNascimento: "01/10/1975", dataIniciacao: "24/10/2024",
    rua: "Rua Carmelino Bertolino", numero: "401 casa 02", bairro: "Parque São Pedro", cep: "12952-267", cidade: "Atibaia-SP",
    telefone: "985663225", email: "vitorbbsa@gmail.com",
    conjuge: "Noeli Bueno Ramos Barbosa", nascimentoConjuge: "09/10/1973", dataCasamento: "19/05/2000",
    filhos: [{ nome: "Jessica Stephanie B. Lopes", dataNascimento: "29/12/1992" }, { nome: "Mayse Gabrielle R. Barbosa", dataNascimento: "21/05/2001" }],
  },
  {
    cim: "300914", nome: "LUIS ALBERTO DE AZEVEDO", posicao: "MM" as Posicao,
    dataNascimento: "14/01/1977", dataIniciacao: "18/08/2016", dataElevacao: "05/10/2017", dataExaltacao: "13/09/2018",
    rua: "Rua Maria Vicencia Ferrara", numero: "81", bairro: "Jardim Laranjeiras", cep: "12910-480", cidade: "Bragança Paulista-SP",
    telefone: "947257364", email: "bt.azevedo@hotmail.com",
    conjuge: "Daniela Aparecida de Morais", nascimentoConjuge: "14/08/1977", dataCasamento: "22/08/2020",
    filhos: [{ nome: "Rafael Morais Fonseca", dataNascimento: "19/09/2005" }, { nome: "Thais Carvalho de Azevedo", dataNascimento: "28/07/1995" }],
  },
  {
    cim: "300915", nome: "LUIS HENRIQUE LOURENCO HERNANDES", posicao: "MM" as Posicao,
    dataNascimento: "22/10/1984", dataIniciacao: "18/08/2016", dataElevacao: "05/10/2017", dataExaltacao: "13/09/2018",
    rua: "Rua Papa Paulo VI", numero: "156", bairro: "Vila Tais", cep: "12942-110", cidade: "Atibaia-SP",
    telefone: "947653437", email: "henrique@traterraplanagem.com.br",
    conjuge: "Eliane Aparecida Pires", nascimentoConjuge: "29/09/1979", dataCasamento: "07/05/2015",
    filhos: [{ nome: "Jose Vicente Pires Hernandes", dataNascimento: "10/09/2015" }],
  },
  {
    cim: "208017", nome: "LUIZ CARLOS CAMILLO", posicao: "MM" as Posicao,
    dataNascimento: "22/03/1956", dataIniciacao: "28/10/2000", dataElevacao: "04/10/2001", dataExaltacao: "13/08/2002", dataInstalacao: "28/06/2021", dataRegulFiliacao: "07/03/2024",
    rua: "Rua dos Curios", numero: "342", bairro: "Jd Flamboyant", cep: "12946-785", cidade: "Atibaia-SP",
    telefone: "999842392", email: "camillos@uol.com.br",
    conjuge: "Ana Maria Alvares Ruas Camillo", nascimentoConjuge: "16/03/1961", dataCasamento: "10/01/1987",
    filhos: [{ nome: "Carolina Alvares Camillo Raymundo", dataNascimento: "16/05/1988" }],
  },
  {
    cim: "204341", nome: "MANOEL JACINTO TEIXEIRA", posicao: "MI" as Posicao,
    dataNascimento: "17/05/1957", dataIniciacao: "26/02/2000", dataElevacao: "17/05/2001", dataExaltacao: "29/12/2001", dataInstalacao: "27/06/2009",
    rua: "Rua Yolando Malozzi", numero: "611", bairro: "Alvinopolis", cep: "12942-450", cidade: "Atibaia-SP",
    telefone: "972837010", email: "mjteixeira@terra.com.br",
    conjuge: "Giustina Brugnera Teixeira", nascimentoConjuge: "20/09/1961", dataCasamento: "17/02/1990",
    filhos: [{ nome: "Francesco Brugnera Teixeira", dataNascimento: "28/06/1990" }, { nome: "Paola Brugnera Teixeira", dataNascimento: "27/10/1993" }],
  },
  {
    cim: "272496", nome: "MARCELO APARECIDO DA SILVA", posicao: "MM" as Posicao,
    dataNascimento: "21/05/1979", dataIniciacao: "25/02/2012", dataElevacao: "19/09/2013", dataExaltacao: "11/09/2014",
    rua: "Av. Joaquim Avelino Pinheiro", numero: "1194", bairro: "Vicente Nunes", cep: "12960-000", cidade: "Nazaré Paulista-SP",
    telefone: "971221032", email: "m-sill@hotmail.com",
    conjuge: "Selma Cristina Aparecida dos Santos Silva", nascimentoConjuge: "11/05/1979", dataCasamento: "07/10/2000",
    filhos: [{ nome: "Miguel Santos Silva", dataNascimento: "03/08/2011" }, { nome: "Vinicius Santos Silva", dataNascimento: "04/10/2004" }],
  },
  {
    cim: "345682", nome: "MARCELO HELENA", posicao: "AM" as Posicao,
    dataNascimento: "23/10/1986", dataIniciacao: "08/06/2024",
    rua: "O Atibaiense", numero: "172", bairro: "Vila Rica", cep: "12940-380", cidade: "Atibaia-SP",
    telefone: "998383938", email: "marceloh86@hotmail.com",
    conjuge: "Heloisa Maria Mendes P. Helena", nascimentoConjuge: "14/02/1991", dataCasamento: "12/08/2015",
    filhos: [],
  },
  {
    cim: "349461", nome: "MARCELO ORENSTEIN BARRETO ALVIM", posicao: "AM" as Posicao,
    dataNascimento: "23/06/1960", dataIniciacao: "26/10/2024",
    rua: "Rua Papa Paulo VI", numero: "144", bairro: "Vila Thais", cep: "12942-110", cidade: "Atibaia-SP",
    telefone: "998466486", email: "marcelo.alvim@hotmail.com",
    conjuge: "Marta Cristina Garcia Alvim", nascimentoConjuge: "30/07/1960", dataCasamento: "16/01/1982",
    filhos: [{ nome: "Pedro Alvim Neto", dataNascimento: "05/11/1980" }, { nome: "Mariana Garcia Alvim", dataNascimento: "12/05/1982" }, { nome: "Deborah Garcia Alvim", dataNascimento: "18/11/1987" }, { nome: "Marcela O. Garcia Alvim", dataNascimento: "11/01/1991" }],
  },
  {
    cim: "45817", nome: "MARCOS AURELIO RISSATI", posicao: "CM" as Posicao,
    dataNascimento: "01/08/1969", dataIniciacao: "20/08/2002", dataElevacao: "19/08/2003", dataRegulFiliacao: "05/06/2025",
    rua: "Alameda Curio - Res Shambala 02", numero: "110", bairro: "Jardim Colonial", cep: "12952-495", cidade: "Atibaia-SP",
    telefone: "986904575", email: "marcosl.rissatti@hotmail.com",
    conjuge: "Luciana Pereira Ferreira Rissatti", nascimentoConjuge: "19/10/1973", dataCasamento: "24/01/1997",
    filhos: [{ nome: "Yargo Ferreira Rissatti", dataNascimento: "17/11/2000" }, { nome: "Yasmin Ferreira Rissatti", dataNascimento: "12/10/2004" }],
  },
  {
    cim: "249637", nome: "OSCAR ROBERTO SCHWEITZER", posicao: "MI" as Posicao,
    dataNascimento: "27/03/1967", dataIniciacao: "16/04/2004", dataElevacao: "26/10/2005", dataExaltacao: "23/10/2006", dataInstalacao: "26/06/2012", dataRegulFiliacao: "26/06/2012",
    rua: "Avenida dos Pinheiros", numero: "385", bairro: "Jd dos Pinheiros", cep: "12945-480", cidade: "Atibaia-SP",
    telefone: "985795223", email: "oscar@arosconsultoria.com.br",
    conjuge: "Adriana da Silva Roman", nascimentoConjuge: "12/03/1970", dataCasamento: "22/07/1999",
    filhos: [{ nome: "Douglas Roman Gonçalves", dataNascimento: "10/02/1992" }, { nome: "Ricardo André Schweitzer", dataNascimento: "18/06/1989" }, { nome: "Eduardo Roman Schweitzer", dataNascimento: "03/06/2004" }, { nome: "Guilherme Roman Schweitzer", dataNascimento: "03/06/2004" }, { nome: "Ana Luize Roman Schweitzer", dataNascimento: "27/12/2012" }],
  },
  {
    cim: "227749", nome: "OSVALDO GILBERTO MARI", posicao: "MI" as Posicao,
    dataNascimento: "19/12/1951", dataIniciacao: "09/10/2004", dataElevacao: "13/10/2005", dataExaltacao: "17/08/2006", dataInstalacao: "11/06/2015",
    rua: "Rua Maurício dos Santos", numero: "95", bairro: "Vila Petrópolis", cep: "12946-480", cidade: "Atibaia-SP",
    telefone: "994920815", email: "osvaldo@twcs.com.br",
    dataCasamento: "Viuvo",
    filhos: [{ nome: "Nicolas Mari", dataNascimento: "14/04/1981" }, { nome: "Carolina Mari", dataNascimento: "11/11/1988" }],
  },
  {
    cim: "292794", nome: "PAULO HENRIQUE RODRIGUES", posicao: "MM" as Posicao,
    dataNascimento: "27/09/1969", dataIniciacao: "14/05/2015", dataElevacao: "07/07/2016", dataExaltacao: "02/03/2017",
    rua: "Alameda Sabiá", numero: "130", bairro: "Parque das Garças", cep: "12953-618", cidade: "Atibaia-SP",
    telefone: "996690390", email: "paulinhogirassol@hotmail.com",
    conjuge: "Edilea Romanielo de Liz Rodrigues", nascimentoConjuge: "27/09/1975", dataCasamento: "04/12/1994",
    filhos: [{ nome: "Paulo Henrique Rodrigues Filho", dataNascimento: "20/09/1997" }, { nome: "Gabrielle Romanielo Rodrigues", dataNascimento: "20/01/2001" }],
  },
  {
    cim: "241750", nome: "PAULO ROBERTO BONIFACIO", posicao: "MM" as Posicao,
    dataNascimento: "26/02/1962", dataIniciacao: "17/03/2007", dataElevacao: "29/05/2009", dataExaltacao: "29/04/2010",
    rua: "Alameda das Garças", numero: "50", bairro: "Parque das Garças", cep: "12953-673", cidade: "Atibaia-SP",
    telefone: "999164740", email: "boni_engenharia@terra.com.br",
    conjuge: "Monica Sayoko Yano", nascimentoConjuge: "31/07/1961", dataCasamento: "27/02/2010",
    filhos: [{ nome: "Fabio Ken Yano", dataNascimento: "07/04/1989" }, { nome: "Fernando Monteiro Duarte", dataNascimento: "31/08/1979" }, { nome: "Paulo Eduardo Monteiro Bonifacio", dataNascimento: "14/01/1991" }, { nome: "Filipe Onji", dataNascimento: "17/01/1992" }, { nome: "Elcio Onji", dataNascimento: "08/10/1986" }],
  },
  {
    cim: "316587", nome: "PAULO SERGIO GONÇALVES MARTINS", posicao: "MM" as Posicao,
    dataNascimento: "11/03/1959", dataIniciacao: "04/04/2019", dataElevacao: "21/10/2021", dataExaltacao: "20/10/2022",
    rua: "Estrada da Cachoeira", numero: "S/N", bairro: "Cachoeira", cep: "12954-160", cidade: "Atibaia-SP",
    telefone: "972056598", email: "psgmartins@terra.com.br",
    dataCasamento: "Divorciado",
    filhos: [{ nome: "Miguel Mendes Martins", dataNascimento: "07/02/2012" }, { nome: "Leonardo Aiello Martins", dataNascimento: "06/10/1996" }, { nome: "Gabriell Mendes Martins", dataNascimento: "26/09/2006" }],
  },
  {
    cim: "311969", nome: "RAPHAEL FARIAS DE OLIVEIRA", posicao: "MM" as Posicao,
    dataNascimento: "07/02/1984", dataIniciacao: "17/05/2018", dataElevacao: "29/08/2019", dataExaltacao: "19/08/2021",
    rua: "Rua Antonio Gabriel do Amaral", numero: "234", bairro: "Jd Brasil", cep: "12940-214", cidade: "Atibaia-SP",
    telefone: "985372949", email: "rapha.oliveira@hotmail.com",
    conjuge: "Silvana Aparecida da Silva", nascimentoConjuge: "28/01/1988", dataCasamento: "28/05/1922",
    filhos: [],
  },
  {
    cim: "282821", nome: "RICARDO MARCONDES DE SOUZA", posicao: "MM" as Posicao,
    dataNascimento: "08/10/1975", dataIniciacao: "26/09/2013", dataElevacao: "30/04/2015", dataExaltacao: "05/11/2015",
    rua: "Rua Nossa Senhora de Fátima", numero: "197", bairro: "Vila Operária", cep: "12955-000", cidade: "Bom Jesus dos Perdões-SP",
    telefone: "985926042", email: "ricmarc3@gmail.com",
    conjuge: "Rosilda Aparecida Marcondes de Souza", nascimentoConjuge: "13/07/1977", dataCasamento: "30/01/1998",
    filhos: [{ nome: "João Pedro Marcondes de Souza", dataNascimento: "20/10/1994" }, { nome: "Arthur Marcondes de Souza", dataNascimento: "26/04/2001" }],
  },
  {
    cim: "253690", nome: "RICARDO BOTTINI", posicao: "MM" as Posicao,
    dataNascimento: "29/09/1973", dataIniciacao: "21/03/2009", dataElevacao: "15/06/2010", dataExaltacao: "31/05/2011", dataRegulFiliacao: "16/02/2023",
    rua: "Rua Miguel Doratioto", numero: "81", bairro: "Atibaia Jardim", cep: "12943510", cidade: "Atibaia-SP",
    telefone: "968559278", email: "ribottini@yahoo.com.br",
    conjuge: "Andreia de Lima Seixas", nascimentoConjuge: "22/06/1980", dataCasamento: "22/09/2014",
    filhos: [],
  },
  {
    cim: "232653", nome: "ROGÉRIO CAMARGO PIRES PIMENTEL", posicao: "MI" as Posicao,
    dataNascimento: "06/08/1971", dataIniciacao: "01/09/2005", dataElevacao: "19/10/2006", dataExaltacao: "26/04/2007", dataInstalacao: "01/07/2021",
    rua: "Rua São Paulo", numero: "418", bairro: "Centro", cep: "12955-000", cidade: "Bom Jesus dos Perdões-SP",
    telefone: "997435461", email: "camargopimentel@ig.com.br",
    conjuge: "Vania Cristina G.C.P. Pimentel", nascimentoConjuge: "01/09/1975", dataCasamento: "03/09/2004",
    filhos: [{ nome: "Sophia Pimentel", dataNascimento: "07/07/2010" }],
  },
  {
    cim: "336674", nome: "ROGERIO ALVES PIRES", posicao: "MM" as Posicao,
    dataNascimento: "24/05/1975", dataIniciacao: "21/08/2019", dataElevacao: "27/06/2024", dataRegulFiliacao: "16/03/2023",
    rua: "Rua Joquim Galhardo", numero: "", bairro: "Centro", cep: "12900-000", cidade: "Nazaré Paulista-SP",
    telefone: "999318213", email: "irmaos.pires@yahoo.com",
    conjuge: "Cremilda Chaves do Nascimento", dataCasamento: "Divorciado",
    filhos: [{ nome: "Pedro Miguel Lopes Pires", dataNascimento: "25/02/2014" }, { nome: "Lara Lopes Pires", dataNascimento: "11/08/2017" }, { nome: "Luiz Felipe A Pires", dataNascimento: "04/05/2006" }],
  },
  {
    cim: "345679", nome: "RODNEY ANDRADE CRUZ", posicao: "AM" as Posicao,
    dataNascimento: "04/10/1990", dataIniciacao: "08/06/2024",
    rua: "Rua Uirapuru", numero: "450 casa 10", bairro: "Santa Fe", cep: "12955-000", cidade: "Bom Jesus dos Perdões-SP",
    telefone: "943567650", email: "andradeecruz.transportes@gmail.com",
    conjuge: "Jessica Mori da Silva Andrade", nascimentoConjuge: "08/03/1991", dataCasamento: "09/03/2018",
    filhos: [{ nome: "Bernardo Mori Andrade", dataNascimento: "14/04/2022" }],
  },
  {
    cim: "307743", nome: "RODRIGO RODIGUEIRO", posicao: "MM" as Posicao,
    dataNascimento: "05/11/1981", dataIniciacao: "24/08/2017", dataElevacao: "21/10/2021", dataExaltacao: "20/10/2022",
    rua: "Rua Francisco de Assis Felix da Costa", numero: "S/N", bairro: "Country Felix", cep: "12955-000", cidade: "Bom Jesus dos Perdões-SP",
    telefone: "963900188", email: "rodigueiro@gmail.com",
    conjuge: "Fernanda Mendes Souza", nascimentoConjuge: "19/11/1983", dataCasamento: "01/12/2017",
    filhos: [{ nome: "Kaique P. Rodigueiro", dataNascimento: "26/04/2001" }],
  },
  {
    cim: "318170", nome: "RONALDO TADEU MORI", posicao: "CM" as Posicao,
    dataNascimento: "28/03/1979", dataIniciacao: "04/07/2019", dataElevacao: "27/06/2024",
    rua: "Rua Adv Zeferino Vasconcelos", numero: "160", bairro: "Vila Mota", cep: "12903-010", cidade: "Bragança Paulista-SP",
    telefone: "999807400", email: "ronaldomori@terra.com.br",
    conjuge: "Jaqueline da Silva Mori", nascimentoConjuge: "01/02/1986", dataCasamento: "04/12/2004",
    filhos: [{ nome: "Ronaldo Tadeu Mori Junior", dataNascimento: "14/05/1997" }, { nome: "Rean Pedro da Silva Moraes", dataNascimento: "16/12/2001" }, { nome: "Raul Pedro da Silva Mori", dataNascimento: "15/07/2011" }],
  },
  {
    cim: "309880", nome: "RUBENS FERREIRA GALVÃO", posicao: "MM" as Posicao,
    dataNascimento: "06/01/1982", dataIniciacao: "14/12/2017", dataElevacao: "15/08/2019", dataExaltacao: "20/02/2020", dataRegulFiliacao: "16/02/2023",
    telefone: "946360612", email: "rubensfgal@hotmail.com",
    dataCasamento: "Divorciado",
    filhos: [{ nome: "Pietro Miguel Magella Galvão", dataNascimento: "06/12/2012" }, { nome: "Maria Clara Magella Galvão", dataNascimento: "02/09/2014" }],
  },
  {
    cim: "263975", nome: "SANDRO GODOI LOMBA", posicao: "MM" as Posicao,
    dataNascimento: "09/02/1981", dataIniciacao: "19/08/2010", dataElevacao: "01/09/2011", dataExaltacao: "30/08/2012",
    rua: "Sitio Santa Maria", numero: "S/N", bairro: "Cachoeira", cep: "12940-000", cidade: "Atibaia-SP",
    telefone: "985683288", email: "dr.sandrolomba@gmail.com",
    conjuge: "Gislaine Oliveira", nascimentoConjuge: "13/07/1974", dataCasamento: "27/11/2011",
    filhos: [{ nome: "Arthur Godoi Lomba", dataNascimento: "11/01/2014" }, { nome: "Felipe Oliveira Cassalho", dataNascimento: "02/11/2002" }],
  },
  {
    cim: "349462", nome: "SILAS SANTOS DA SILVA", posicao: "AM" as Posicao,
    dataNascimento: "18/11/1974", dataIniciacao: "24/10/2024",
    rua: "Rua Dr Nestor de Oliveira", numero: "334", bairro: "Jd das Cerejeiras", cep: "12951-060", cidade: "Atibaia-SP",
    telefone: "983442030", email: "silas.ssantos74@hotmail.com",
    conjuge: "Carolina Moreno Castillo", nascimentoConjuge: "22/08/1980", dataCasamento: "26/01/2018",
    filhos: [{ nome: "Vitoria Cristalino da Silva", dataNascimento: "12/10/1999" }],
  },
]

// Sessões do 2º semestre 2024 e 1º semestre 2025 (extraído do CSV de presença)
const sessoes2024_2025 = [
  // 2º semestre 2024 - JULHO
  { data: "2024-07-04", tipo: "ORDINARIA" },
  { data: "2024-07-11", tipo: "ORDINARIA" },
  { data: "2024-07-18", tipo: "ORDINARIA" },
  { data: "2024-07-25", tipo: "ORDINARIA" },
  // AGOSTO
  { data: "2024-08-01", tipo: "ORDINARIA" },
  { data: "2024-08-08", tipo: "ORDINARIA" },
  { data: "2024-08-15", tipo: "MAGNA" },
  { data: "2024-08-22", tipo: "ORDINARIA" },
  { data: "2024-08-29", tipo: "ORDINARIA" },
  // SETEMBRO
  { data: "2024-09-05", tipo: "ORDINARIA" },
  { data: "2024-09-12", tipo: "ORDINARIA" },
  { data: "2024-09-19", tipo: "ORDINARIA" },
  { data: "2024-09-26", tipo: "ESPECIAL" }, // IND
  // OUTUBRO
  { data: "2024-10-03", tipo: "ORDINARIA" },
  { data: "2024-10-10", tipo: "ORDINARIA" },
  { data: "2024-10-24", tipo: "ESPECIAL" }, // REG
  { data: "2024-10-26", tipo: "ESPECIAL" }, // IN
  // NOVEMBRO
  { data: "2024-11-07", tipo: "ESPECIAL" }, // IN
  { data: "2024-11-21", tipo: "ORDINARIA" },
  { data: "2024-11-28", tipo: "ORDINARIA" },
  // DEZEMBRO
  { data: "2024-12-05", tipo: "ORDINARIA" },
]

async function main() {
  const dbUrl = process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"]
  if (!dbUrl) throw new Error("DATABASE_URL is not set — check your .env file")
  const pool = new Pool({ connectionString: dbUrl })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  console.log("Limpando dados existentes...")
  await prisma.presenca.deleteMany()
  await prisma.lojaSession.deleteMany()
  await prisma.filho.deleteMany()
  await prisma.member.deleteMany()
  await prisma.user.deleteMany()

  console.log("Criando usuário admin...")
  const hashedPassword = await bcrypt.hash("admin123", 12)
  await prisma.user.create({
    data: {
      name: "Administrador",
      email: "admin@loja.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  })

  console.log("Criando membros...")
  for (const m of members) {
    await prisma.member.create({
      data: {
        cim: m.cim,
        situacao: "ATIVO",
        nome: m.nome,
        posicao: m.posicao,
        dataNascimento: d(m.dataNascimento),
        dataIniciacao: d(m.dataIniciacao),
        dataElevacao: d((m as { dataElevacao?: string }).dataElevacao),
        dataExaltacao: d((m as { dataExaltacao?: string }).dataExaltacao),
        dataInstalacao: d((m as { dataInstalacao?: string }).dataInstalacao),
        dataRegulFiliacao: d((m as { dataRegulFiliacao?: string }).dataRegulFiliacao),
        rua: (m as { rua?: string }).rua ?? null,
        numero: (m as { numero?: string }).numero ?? null,
        bairro: (m as { bairro?: string }).bairro ?? null,
        cep: (m as { cep?: string }).cep ?? null,
        cidade: (m as { cidade?: string }).cidade ?? null,
        telefone: m.telefone || null,
        email: m.email || null,
        conjuge: (m as { conjuge?: string }).conjuge ?? null,
        nascimentoConjuge: d((m as { nascimentoConjuge?: string }).nascimentoConjuge),
        dataCasamento: (m as { dataCasamento?: string }).dataCasamento ?? null,
        filhos: {
          create: (m.filhos ?? []).map((f) => ({
            nome: f.nome,
            dataNascimento: d(f.dataNascimento),
          })),
        },
      },
    })
  }
  console.log(`${members.length} membros criados.`)

  console.log("Criando sessões históricas...")
  for (const s of sessoes2024_2025) {
    await prisma.lojaSession.create({
      data: {
        data: new Date(s.data + "T00:00:00.000Z"),
        tipo: s.tipo as "ORDINARIA" | "MAGNA" | "ESPECIAL",
      },
    })
  }
  console.log(`${sessoes2024_2025.length} sessões criadas.`)

  // Importar alguns dados históricos de presença para os primeiros membros
  // Mapeamento das sessões criadas
  const sessions = await prisma.lojaSession.findMany({ orderBy: { data: "asc" } })
  const allMembers = await prisma.member.findMany()
  const memberMap = Object.fromEntries(allMembers.map((m) => [m.cim, m.id]))

  // Dados de presença do CSV: 2º sem 2024 (primeiras 22 sessões)
  // Apenas algumas linhas como exemplo para demonstrar o histórico
  const presencaData: { cim: string; statuses: string[] }[] = [
    { cim: "219352", statuses: ["P","F","F","P","P","F","P","P","F","P","P","P","F","P","F","F","F","P","P","F","F","F"] },
    { cim: "227748", statuses: ["F","P","P","F","P","P","P","P","F","F","F","P","P","F","P","P","P","F","P","F","P"] },
    { cim: "212257", statuses: ["F","F","F","F","F","P","P","F","P","F","P","P","P","P","F","P","F","P","P","F","P"] },
    { cim: "279771", statuses: ["P","P","P","F","F","P","P","F","P","P","P","P","P","P","P","F","F","P","P","F","P"] },
    { cim: "183931", statuses: ["P","P","P","P","P","P","P","P","P","F","F","P","P","P","P","P","P","P","F","P","P"] },
    { cim: "292794", statuses: ["P","P","F","P","P","P","P","P","P","P","P","P","P","P","P","P","P","P","P","P","P"] },
  ]

  const statusMap: Record<string, PresencaStatus> = {
    P: "P", F: "F", N: "NV", K: "K", AB: "AB", SU: "SU",
    FM: "FM", FR: "FR", BAN: "BAN", REP: "REP", IN: "IN",
    IND: "IND", IP: "IP", EL: "EL", EX: "EX", MI: "MI",
    MM: "MM", CM: "CM", AM: "AM", REG: "REG", SM: "SM", "0": "ZERO",
  }

  for (const row of presencaData) {
    const memberId = memberMap[row.cim]
    if (!memberId) continue
    for (let i = 0; i < Math.min(row.statuses.length, sessions.length); i++) {
      const status = statusMap[row.statuses[i]] ?? "NV"
      await prisma.presenca.create({
        data: { memberId, sessionId: sessions[i].id, status },
      })
    }
  }

  console.log("Seed concluído!")
  console.log("\nCredenciais de acesso:")
  console.log("  Email: admin@loja.com")
  console.log("  Senha: admin123")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
