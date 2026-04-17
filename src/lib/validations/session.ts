import { z } from "zod"

export const sessionSchema = z.object({
  data: z.string().min(1, "Data obrigatória"),
  descricao: z.string().optional().nullable(),
  tipo: z.enum(["ORDINARIA", "MAGNA", "ESPECIAL"]).default("ORDINARIA"),
})

export type SessionFormData = z.infer<typeof sessionSchema>

export const presencaStatusValues = [
  "NV", "K", "AB", "SU", "F", "FM", "FR", "BAN", "REP",
  "IN", "IND", "IP", "EL", "EX", "MI", "MM", "CM", "AM",
  "P", "REG", "SM", "ZERO",
] as const

export const presencaStatusLabels: Record<string, string> = {
  NV:   "Não Válida",
  K:    "Kit Place",
  AB:   "Abonada/Licença",
  SU:   "Suspensão",
  F:    "Falta",
  FM:   "Férias",
  FR:   "Feriado",
  BAN:  "Bandeira",
  REP:  "República",
  IN:   "Iniciação",
  IND:  "Independência",
  IP:   "IP",
  EL:   "Elevação",
  EX:   "Exaltação",
  MI:   "Mestre Instalado",
  MM:   "Mestre",
  CM:   "Companheiro",
  AM:   "Aprendiz",
  P:    "Presença",
  REG:  "Regularização",
  SM:   "Sessão Magna",
  ZERO: "Não Contabilizado",
}
