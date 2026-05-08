export type RespuestaAsistencia = 'VOY' | 'TAL_VEZ' | 'NO_VOY';

export interface AsistenciaEstado {
  idActividad: number;
  miRespuesta: RespuestaAsistencia | null;
  totalVoy: number;
  totalTalVez: number;
  totalNoVoy: number;
}