export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface SolicitudListItem {
  idActividad: number;
  nombre: string;
  descripcion: string;
  nombreProfesor: string;
  correoProfesor: string;
  tipoActividad: string;
  categoria: string;
  fechaActividad: string;     // 'YYYY-MM-DD'
  horaInicio: string;         // 'HH:mm:ss'
  horaFin: string;
  estado: EstadoSolicitud;
  fechaRegistro: string;
  organizadores: string[];
  totalRecursos: number;
}

export interface RecursoDetalle {
  idRecurso: number;
  nombre: string;
  tipoRecurso: 'ESPACIO' | 'MOBILIARIO' | 'PERSONAL';
  cantidadRequerida: number;
  capacidad?: number;
  ubicacion?: string;
  cantidadInventario?: number;
}

export interface ConflictoRecurso {
  idRecurso: number;
  nombreRecurso: string;
  tipoRecurso: string;
  mensaje: string;
  cantidadSolicitada: number;
  cantidadDisponible: number;
}

export interface SolicitudDetalle {
  idActividad: number;
  nombre: string;
  descripcion: string;
  nombreProfesor: string;
  correoProfesor: string;
  tipoActividad: string;
  categoria: string;
  fechaActividad: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoSolicitud;
  fechaRegistro: string;
  motivoRechazo?: string;
  fechaRevision?: string;
  nombreVicerrector?: string;
  urlPortada?: string;
  organizadores: string[];
  recursos: RecursoDetalle[];
  conflictos: ConflictoRecurso[];
  version: number;
}

export interface AprobarRequest {
  idAdmin: number;
  comentario?: string;
}

export interface RechazarRequest {
  idAdmin: number;
  motivo: string;
}

export interface SolicitudDecidida {
  idActividad: number;
  estado: EstadoSolicitud;
  motivoRechazo?: string;
  fechaRevision: string;
  nombreVicerrector: string;
  version: number;
}

// Filtros UI -> query params
export interface FiltrosSolicitudes {
  estado?: EstadoSolicitud | 'TODOS';
  idCategoria?: number;
  idCarrera?: number;
  idDepartamento?: number;
  q?: string;
}