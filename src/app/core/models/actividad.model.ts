export interface OrganizadorRequest {
  idCarrera?: number;
  idDepartamento?: number;
}

export interface RecursoRequest {
  idRecurso: number;
  cantidadRequerida: number;
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

export interface RecursoResumen {
  idRecurso: number;
  nombre: string;
  tipoRecurso: string;
  cantidadRequerida: number;
}

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
}