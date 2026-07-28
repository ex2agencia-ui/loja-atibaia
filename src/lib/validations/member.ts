import { z } from "zod"

export const filhoSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, "Nome obrigatório"),
  dataNascimento: z.string().optional().nullable(),
})

export const memberSchema = z.object({
  cim: z.string().min(1, "CIM obrigatório"),
  situacao: z.enum(["ATIVO", "INATIVO"]),
  nome: z.string().min(2, "Nome obrigatório"),
  posicao: z.enum(["MI", "CM", "MM", "AM"]),
  dataNascimento: z.string().optional().nullable(),
  dataIniciacao: z.string().optional().nullable(),
  dataElevacao: z.string().optional().nullable(),
  dataExaltacao: z.string().optional().nullable(),
  dataInstalacao: z.string().optional().nullable(),
  dataRegulFiliacao: z.string().optional().nullable(),
  rua: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  isWhatsapp: z.boolean().default(false),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  ocupacao: z.string().optional().nullable(),
  notasOcupacao: z.string().optional().nullable(),
  empresa: z.string().optional().nullable(),
  ramoAtuacao: z.string().optional().nullable(),
  site: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  conjuge: z.string().optional().nullable(),
  nascimentoConjuge: z.string().optional().nullable(),
  dataCasamento: z.string().optional().nullable(),
  filhos: z.array(filhoSchema).default([]),
})

export type MemberFormData = z.infer<typeof memberSchema>
