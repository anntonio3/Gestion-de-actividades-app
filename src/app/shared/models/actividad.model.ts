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