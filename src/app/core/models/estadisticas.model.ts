// ── Modelos para US-21, US-22, US-23 ─────────────────────

/** US-21: estadística general por mes y año */
export interface EstadisticaMes {
  anio:     number;
  mes:      number;
  cantidad: number;
}

/** US-22: estadística por campus (departamento) */
export interface EstadisticaCampus {
  anio:               number;
  mes:                number;
  idDepartamento:     number;
  nombreDepartamento: string;
  cantidad:           number;
}

/** US-23: estadística por carrera */
export interface EstadisticaCarrera {
  anio:         number;
  mes:          number;
  idCarrera:    number;
  nombreCarrera: string;
  cantidad:     number;
}