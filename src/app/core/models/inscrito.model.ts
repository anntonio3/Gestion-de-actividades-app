export type TipoParticipante = 'ALUMNO' | 'DOCENTE' | 'EXTERNO';

export interface InscritoItem {
  numero: number;
  nombre: string;
  tipoParticipante: TipoParticipante;
  identificador: string;
  fechaInscripcion: string;
}

export interface ListaInscritosResponse {
  idActividad: number;
  nombreEvento: string;
  fechaEvento: string;
  horaInicio: string;
  horaFin: string;
  totalInscritos: number;
  inscritos: InscritoItem[];
}

// NUEVO: para el dashboard de ADMIN (listado de actividades con inscripcion)
export interface ActividadInscripcionResumen {
  idActividad: number;
  nombreEvento: string;
  nombreProfesor: string;
  fechaActividad: string;
  horaInicio: string;
  horaFin: string;
  totalInscritos: number;
}