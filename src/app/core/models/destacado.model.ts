// US-27: Evento destacado que consume el banner publico
export interface EventoDestacado {
  id: number;
  nombre: string;
  descripcion: string;
  fechaActividad: string;   // 'YYYY-MM-DD'
  horaInicio: string;       // 'HH:mm:ss'
  horaFin: string;
  categoria: string;
  tipo: string;
  imagenPortada?: string;
  lugar?: string;
  capacidad?: number;
}

// US-26: Request para destacar manualmente
export interface DestacarRequest {
  idAdmin: number;
  confirmarReemplazo: boolean;
}

// US-26: Respuesta tras destacar
export interface DestacarResponse {
  idActividad: number;
  nombre: string;
  destacadoActivo: boolean;
  nombreAdmin: string;
  fechaDestacado: string;
}

// Datos del conflicto 409 (ya hay otro destacado activo)
export interface DestacadoConflicto {
  idDestacadoActual: number;
  nombreDestacadoActual: string;
}