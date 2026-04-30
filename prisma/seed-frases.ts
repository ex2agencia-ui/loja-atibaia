import * as dotenv from "dotenv"
dotenv.config()

import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma"

const frases = [
  { texto: "A maçonaria foi a primeira apóstola da igualdade.", autor: "Albert Pike", descricaoAutor: "Advogado e escritor americano, autor de Morals and Dogma.", tema: "Igualdade" },
  { texto: "A liberdade nasce com o indivíduo e atinge o consciente coletivo dos povos.", autor: "Martin Luther King Jr. (atribuída)", descricaoAutor: "Pastor e ativista dos direitos civis nos EUA.", tema: "Liberdade" },
  { texto: "A fraternidade não é uma conquista, mas a resultante da liberdade e da igualdade.", autor: "Freemason.pt", descricaoAutor: "Portal informativo sobre cultura e história maçônica.", tema: "Fraternidade" },
  { texto: "Aqueles que podem desistir da liberdade essencial para obter um pouco de segurança temporária não merecem nem liberdade nem segurança.", autor: "Benjamin Franklin", descricaoAutor: "Político, cientista e um dos Pais Fundadores dos EUA.", tema: "Liberdade" },
  { texto: "A igualdade de direitos e obrigações dos seres sem distinguir religião, raça ou nacionalidade.", autor: "Princípios Maçônicos", descricaoAutor: "Conceitos basilares extraídos das constituições maçônicas.", tema: "Igualdade" },
  { texto: "Esteja em guerra com seus vícios, em paz com seus vizinhos, e deixe que cada ano novo o encontre um homem melhor.", autor: "Benjamin Franklin", descricaoAutor: "Político, cientista e um dos Pais Fundadores dos EUA.", tema: "Aperfeiçoamento Moral" },
  { texto: "O verdadeiro culto que se dá ao Grande Arquiteto Do Universo consiste principalmente nas boas obras.", autor: "Código Moral Maçônico", descricaoAutor: "Conjunto de preceitos éticos da tradição maçônica.", tema: "Religiosidade" },
  { texto: "A Virtude é uma disposição firme e constante de praticar o bem.", autor: "Revista Ciência & Maçonaria", descricaoAutor: "Publicação acadêmica voltada ao estudo da maçonaria.", tema: "Virtude" },
  { texto: "Conhece-te a ti mesmo: Corrige os teus defeitos e vence as tuas paixões.", autor: "Máximas Maçônicas", descricaoAutor: "Provérbios tradicionais utilizados na instrução de iniciados.", tema: "Autoconhecimento" },
  { texto: "A honra autêntica é o brilho da virtude, sua aura.", autor: "Foco Arte Real", descricaoAutor: "Plataforma de estudos sobre simbolismo e filosofia.", tema: "Honra" },
  { texto: "Trabalhe como se fosse viver cem anos; ore como se fosse morrer amanhã.", autor: "Benjamin Franklin", descricaoAutor: "Político, cientista e um dos Pais Fundadores dos EUA.", tema: "Trabalho e Fé" },
  { texto: "A ética são princípios e valores que guiam e orientam as relações humanas.", autor: "Egreóra", descricaoAutor: "Termo que designa a força espiritual de um grupo reunido.", tema: "Ética" },
  { texto: "O propósito da maçonaria reside na busca incessante pela construção de uma sociedade justa.", autor: "Essência Maçônica", descricaoAutor: "Literatura contemporânea sobre o papel social da ordem.", tema: "Sociedade" },
  { texto: "Estar e viver os princípios da maçonaria são coisas bem diferentes; é necessária a ação do tempo.", autor: "Alexandre Modesto Braune", descricaoAutor: "Escritor e estudioso da filosofia maçônica brasileira.", tema: "Prática Maçônica" },
  { texto: "A maçonaria é uma escola de moral e filosofia.", autor: "GOB", descricaoAutor: "Grande Oriente do Brasil, a mais antiga potência maçônica do país.", tema: "Educação" },
  { texto: "Oh! Quão bom e agradável vivermos unidos os irmãos!", autor: "Salmo 133", descricaoAutor: "Texto bíblico central na abertura dos trabalhos em loja.", tema: "União" },
  { texto: "Uma Loja não é mantida unida por faixas de ação, mas pelos laços de seda da irmandade.", autor: "Masonic Quotes", descricaoAutor: "Compilado de citações da tradição anglo-saxônica.", tema: "Fraternidade" },
  { texto: "Dentre todas as sociedades, nenhuma há mais nobre que aquela em que os homens estejam unidos pelo amor.", autor: "Cícero", descricaoAutor: "Filósofo e político romano (influência clássica na maçonaria).", tema: "Fraternidade" },
  { texto: "Tudo o que tende a combinar os homens por laços mais fortes é útil para a humanidade.", autor: "LaLande", descricaoAutor: "Joseph Jérôme de Lalande, astrônomo francês e maçom.", tema: "União" },
  { texto: "Ama teu semelhante como a ti mesmo.", autor: "Código Moral Maçônico", descricaoAutor: "Regra de ouro presente em diversas tradições filosóficas.", tema: "Amor Fraternal" },
  { texto: "O trabalho maçônico é puramente um trabalho de amor.", autor: "Benjamin Franklin", descricaoAutor: "Político, cientista e um dos Pais Fundadores dos EUA.", tema: "Trabalho" },
  { texto: "Ajude os fracos, atenda aos maus e não odeie ninguém.", autor: "Máximas Maçônicas", descricaoAutor: "Orientações morais para a conduta diária do maçom.", tema: "Caridade" },
  { texto: "A coesão social deve-se, em grande parte, à necessidade de uma sociedade se defender.", autor: "Henri Bergson", descricaoAutor: "Filósofo francês e diplomata, autor de \"As Duas Fontes da Moral\".", tema: "Sociedade" },
  { texto: "A verdade é a força mais poderosa e a maior arma do homem livre.", autor: "Albert Pike", descricaoAutor: "Brigadeiro e filósofo maçom de grande influência ritualística.", tema: "Verdade" },
  { texto: "A educação deve levar ao autocontrole, sujeitando a paixão à vontade racional.", autor: "Benjamin Franklin", descricaoAutor: "Político, cientista e um dos Pais Fundadores dos EUA.", tema: "Educação" },
  { texto: "A maçonaria não põe nenhum obstáculo ao esforço humano na busca da verdade.", autor: "Jornal DR1", descricaoAutor: "Veículo de comunicação que aborda temas sociais e culturais.", tema: "Busca da Verdade" },
  { texto: "O conhecimento por si só não torna ninguém independente, nem o prepara para ser livre.", autor: "Albert Pike", descricaoAutor: "Autor de textos fundamentais sobre o Rito Escocês Antigo e Aceito.", tema: "Conhecimento" },
  { texto: "Mantenha sua mente jovem; essa é a maior coisa na vida.", autor: "Henry Ford", descricaoAutor: "Industrial americano e maçom, fundador da Ford Motor Company.", tema: "Conhecimento" },
  { texto: "Diga-me e eu esquecerei. Ensine-me e eu lembrarei. Envolva-me e eu aprenderei.", autor: "Benjamin Franklin", descricaoAutor: "Político, cientista e um dos Pais Fundadores dos EUA.", tema: "Educação" },
  { texto: "A Loja deve ser uma vasta sala de aula onde todos os princípios são debatidos com total liberdade.", autor: "Manuel Azaña", descricaoAutor: "Político espanhol e último presidente da Segunda República Espanhola.", tema: "Liberdade de Pensamento" },
  { texto: "O maçom deve lutar contra as invasões da necessidade e da baixeza.", autor: "Albert Pike", descricaoAutor: "Membro influente da jurisdição sul dos Estados Unidos no séc XIX.", tema: "Dever" },
  { texto: "As leis da maçonaria são razão e equidade; seus princípios, benevolência e amor.", autor: "Reverendo T.M. Harris", descricaoAutor: "Clérigo e historiador maçom americano do século XVIII.", tema: "Justiça" },
  { texto: "Aquele que é bom em dar desculpas raramente é bom em qualquer outra coisa.", autor: "Benjamin Franklin", descricaoAutor: "Político, cientista e um dos Pais Fundadores dos EUA.", tema: "Caráter" },
  { texto: "Sempre haverá a necessidade de cultivar a honra entre os ideais e o comum dos mortais.", autor: "Foco Arte Real", descricaoAutor: "Espaço dedicado à reflexão filosófica e simbólica.", tema: "Honra" },
  { texto: "O homem é supremo sobre as instituições, e não elas sobre ele.", autor: "Albert Pike", descricaoAutor: "Pensador que defendia a liberdade individual frente ao Estado.", tema: "Humanismo" },
  { texto: "Não faças mal a ninguém, mas antes, faze o bem que puderes.", autor: "Máximas Maçônicas", descricaoAutor: "Princípio fundamental de auxílio mútuo e caridade.", tema: "Benevolência" },
  { texto: "No final, não seremos examinados pelo que pensamos, mas pelo que fizemos.", autor: "Benjamin Franklin", descricaoAutor: "Político, cientista e um dos Pais Fundadores dos EUA.", tema: "Ação" },
  { texto: "A maçonaria é uma instituição que promove a prosperidade pública através da virtude privada.", autor: "George Washington", descricaoAutor: "Primeiro presidente dos EUA e Mestre Maçom.", tema: "Virtude" },
  { texto: "Ideais são como estrelas. Você não consegue tocá-los com as mãos, mas pode segui-los.", autor: "Carl Schurz (atribuída)", descricaoAutor: "Político e reformador americano de origem alemã.", tema: "Ideais" },
  { texto: "O silêncio é o direito e o dever do aprendiz.", autor: "Fraternidade Sétima", descricaoAutor: "Referência à primeira etapa da formação maçônica.", tema: "Disciplina" },
  { texto: "Adora o Grande Arquiteto do Universo, que é Deus.", autor: "Máximas Maçônicas", descricaoAutor: "Reconhecimento de uma inteligência suprema no cosmos.", tema: "Espiritualidade" },
  { texto: "Cada pássaro que voa carrega um fio do infinito em suas garras.", autor: "Morals and Dogma", descricaoAutor: "Obra clássica de Albert Pike sobre filosofia e ritos.", tema: "Natureza" },
  { texto: "Tem sempre a tua alma em estado de pureza para que apareças diante de tua consciência.", autor: "Código Moral Maçônico", descricaoAutor: "Instrução sobre a retidão interna do indivíduo.", tema: "Consciência" },
  { texto: "Escuta sempre a voz da tua consciência: ela é um dos teus juízes.", autor: "Máximas Maçônicas", descricaoAutor: "Apelo ao julgamento ético interior.", tema: "Consciência" },
  { texto: "A influência do homem sobre o homem é uma lei da natureza.", autor: "Albert Pike", descricaoAutor: "Reflexão sobre o impacto das ações individuais na coletividade.", tema: "Influência Social" },
  { texto: "O segredo da maçonaria, como o segredo da vida, só pode ser conhecido por quem o busca.", autor: "A-Z Quotes", descricaoAutor: "Citação popular sobre a natureza iniciática da ordem.", tema: "Mistério" },
  { texto: "Nada é realmente pequeno na arquitetura do universo.", autor: "Morals and Dogma", descricaoAutor: "Visão de que cada parte da criação tem sua importância.", tema: "Universo" },
  { texto: "Deus ajuda aqueles que ajudam a si mesmos.", autor: "Benjamin Franklin", descricaoAutor: "Político, cientista e um dos Pais Fundadores dos EUA.", tema: "Esforço Próprio" },
  { texto: "A morte, o grande nivelador, reduz todos ao mesmo estado.", autor: "Masonic Proverbs", descricaoAutor: "Alusão ao símbolo do nível e à finitude humana.", tema: "Igualdade Final" },
  { texto: "O maçom é um construtor de si mesmo e um agente de transformação social.", autor: "Aurum Editora", descricaoAutor: "Editora especializada em livros de filosofia e esoterismo.", tema: "Aperfeiçoamento" },
]

async function main() {
  const dbUrl = process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"]
  if (!dbUrl) throw new Error("DATABASE_URL is not set")
  const pool = new Pool({ connectionString: dbUrl })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  console.log("Limpando frases existentes...")
  await prisma.frase.deleteMany()

  console.log(`Inserindo ${frases.length} frases...`)
  await prisma.frase.createMany({ data: frases })

  console.log("Frases inseridas com sucesso!")
  await pool.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
