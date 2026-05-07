export interface ActividadResponse {
  idActividad: number;
  nombreProfesor: string;
  tipoActividad: string;
  nombre: string;
  descripcion?: string;
  fechaActividad: string;
  horaInicio: string;
  horaFin: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  fechaRegistro: string;
  urlPortada?: string;
  organizadores: string[];
  recursos: RecursoResumen[];
  categoria: string;        // nombre de la categoría
}

export interface ActividadRequest {
  idProfesor: number;
  idTipo: number;
  nombre: string;
  descripcion?: string;
  fechaActividad: string;   // 'YYYY-MM-DD'
  horaInicio: string;       // 'HH:mm:ss'
  horaFin: string;          // 'HH:mm:ss'
  recursos: RecursoRequest[];
  organizadores: OrganizadorRequest[];
}


export interface OrganizadorRequest {
  idCarrera?: number;
  idDepartamento?: number;
}

export interface RecursoRequest {
  idRecurso: number;
  cantidadRequerida: number;
}



export interface RecursoResumen {
  idRecurso: number;
  nombre: string;
  tipoRecurso: string;
  cantidadRequerida: number;
}

//Vianey

export interface ActividadPublica {
  id: number;
  nombre: string;
  descripcion: string;
  fechaActividad: string;   // "2026-04-20"
  horaInicio: string;       // "10:00:00"
  horaFin: string;          // "12:00:00"
  tipo: string;             // nombre del tipo
  categoria: string;        // nombre de la categoría
  imagenPortada?: string;   // url opcional
}


export const CATEGORIA_EMOJI: Record<string, string> = {
  'Tecnología':  '💻',
  'Académica':   '🎓',
  'Cultural':    '🎨',
  'Deportiva':   '⚽',
  'Ciencia':     '🔬',
  'Salud':       '🏥',
};

export const CATEGORIA_COLOR: Record<string, string> = {
  'Tecnología':  'linear-gradient(135deg,#a8d5cc,#71B6A7)',
  'Académica':   'linear-gradient(135deg,#c8e6e2,#a8d5cc)',
  'Cultural':    'linear-gradient(135deg,#f0e6d3,#e8c99e)',
  'Deportiva':   'linear-gradient(135deg,#d4e6d3,#a8cca5)',
  'Ciencia':     'linear-gradient(135deg,#dde6f0,#a8bedd)',
  'Salud':       'linear-gradient(135deg,#fde8e8,#f9bbbb)',
};


// Bere

export interface SolicitudActividad {
  idActividad: number;
  nombre: string;
  descripcion: string;
  fechaActividad: string;
  horaInicio: string;
  horaFin: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  motivoRechazo: string | null;
  fechaRegistro: string;
  fechaActualizacion?: string | null;
}
 
export interface ActualizarActividadRequest {
  nombre: string;
  descripcion: string;
  fechaActividad: string;
  horaInicio: string;
  horaFin: string;
  idTipo?: number;
}

export type EstadoFiltro = '' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

// ─── Detalle público de actividad (US-04 modal de detalle) ───

export interface ActividadDetallePublica {
  id: number;
  nombre: string;
  descripcion: string;
  fechaActividad: string;
  horaInicio: string;
  horaFin: string;
  tipo: string;
  categoria: string;
  imagenPortada?: string;
  lugar: LugarPublico | null;
  organizadores: OrganizadorPublico[];
}

export interface LugarPublico {
  idEspacio: number;
  nombre: string;
  ubicacion: string;
  capacidad: number;
  idPunto?: number | null;
  etiquetaPunto?: string | null;
  coordX?: number | null;
  coordY?: number | null;
}

export interface OrganizadorPublico {
  nombre: string;
  tipo: 'CARRERA' | 'DEPARTAMENTO';
}