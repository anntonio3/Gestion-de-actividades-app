export type TipoParticipante = 'ALUMNO' | 'DOCENTE' | 'EXTERNO';

export interface InscritoItem {
  nombre: string;
  tipoParticipante: TipoParticipante;
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