// src/app/core/models/inscripcion.model.ts
export interface InscripcionEstado {
  idActividad: number;
  inscrito: boolean;
  idInscripcion: number | null;
  totalInscritos: number;
  aforo?: number | null;
  lugaresDisponibles?: number | null;
  cupoLleno?: boolean;
}

export interface InscripcionResponse {
  idInscripcion: number;
  idActividad: number;
  nombreActividad: string;
  categoria: string;
  tipo: string;
  fechaActividad: string;   // 'YYYY-MM-DD'
  horaInicio: string;       // 'HH:mm:ss'
  horaFin: string;
  campus: string;
  imagenPortada?: string;
  fechaInscripcion: string; // ISO datetime
}

export interface InscripcionRequest {
  idActor: number;
  tipoUsuario: 'ALUMNO' | 'PROFESOR' | 'ADMIN';
}