export const NORMAS_ISO = [
  { value: "ISO_9001", label: "ISO 9001 - Gestión de Calidad" },
  { value: "ISO_17025", label: "ISO 17025 - Laboratorios de Ensayo y Calibración" },
  { value: "ISO_14001", label: "ISO 14001 - Gestión Ambiental" },
  { value: "ISO_45001", label: "ISO 45001 - Seguridad y Salud en el Trabajo" },
]

export const NORMAS_POR_DEFECTO = NORMAS_ISO.map((n) => n.value)

export interface TipoDocumentoConfig {
  value: string
  label: string
  prefijo: string
  normas: string[]
}

export const TIPOS_DOCUMENTO: TipoDocumentoConfig[] = [
  {
    value: "manual_gestion",
    label: "Manual de Gestión",
    prefijo: "MG",
    normas: ["ISO_9001", "ISO_17025", "ISO_14001", "ISO_45001"],
  },
  {
    value: "manual_funciones",
    label: "Manual de Funciones",
    prefijo: "MF",
    normas: ["ISO_9001", "ISO_17025", "ISO_14001", "ISO_45001"],
  },
  {
    value: "documento_externo",
    label: "Documento Externo",
    prefijo: "DE",
    normas: NORMAS_POR_DEFECTO,
  },
  {
    value: "procedimiento_operacion",
    label: "Procedimientos Estándar de Operación",
    prefijo: "PO",
    normas: ["ISO_9001", "ISO_17025"],
  },
  {
    value: "procedimiento_analitico",
    label: "Procedimientos Analíticos",
    prefijo: "PA",
    normas: ["ISO_17025"],
  },
  {
    value: "instruccion_trabajo",
    label: "Instrucciones de Trabajo",
    prefijo: "IT",
    normas: ["ISO_17025"],
  },
  {
    value: "sop",
    label: "SOP",
    prefijo: "SOP",
    normas: ["ISO_17025", "ISO_9001"],
  },
  {
    value: "pa",
    label: "PA",
    prefijo: "PA",
    normas: ["ISO_17025"],
  },
  {
    value: "int",
    label: "INT",
    prefijo: "INT",
    normas: ["ISO_17025"],
  },
  {
    value: "ficha_tecnica",
    label: "Fichas Técnicas",
    prefijo: "FT",
    normas: ["ISO_17025"],
  },
  {
    value: "formulario",
    label: "Formulario",
    prefijo: "FR",
    normas: NORMAS_POR_DEFECTO,
  },
  {
    value: "registro",
    label: "Registro",
    prefijo: "RG",
    normas: NORMAS_POR_DEFECTO,
  },
]

export const ESTADOS_DOCUMENTO = [
  { value: "borrador", label: "Borrador" },
  { value: "en_revision", label: "En Revisión" },
  { value: "vigente", label: "Vigente" },
  { value: "obsoleto", label: "Obsoleto" },
]

export function getTipoConfig(tipo: string): TipoDocumentoConfig | undefined {
  return TIPOS_DOCUMENTO.find((t) => t.value === tipo)
}

export function getNormasPorTipo(tipo: string): string[] {
  return getTipoConfig(tipo)?.normas || NORMAS_POR_DEFECTO
}

export function getPrefijoPorTipo(tipo: string): string {
  return getTipoConfig(tipo)?.prefijo || "DOC"
}
