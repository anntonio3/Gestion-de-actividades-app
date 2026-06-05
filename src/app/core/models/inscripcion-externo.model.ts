// US-24: Inscripcion de personas externas a la institucion
export type Sexo = 'MASCULINO' | 'FEMENINO' | 'OTRO';

export interface InscripcionExternoRequest {
  nombre:      string;
  edad:        number;
  sexo:        Sexo;
  procedencia: string;
  correo?:     string;   // opcional
  telefono?:   string;   // opcional
}

export interface InscripcionExternoResponse {
  idInscripcionExterno: number;
  idActividad:          number;
  nombreActividad:      string;
  nombre:               string;
  edad:                 number;
  sexo:                 Sexo;
  procedencia:          string;
  correo?:              string;
  telefono?:            string;
  fechaInscripcion:     string;
  totalExternos:        number;
}

// Respuesta del endpoint GET /estado
export interface InscripcionExternoEstado {
  inscrito: boolean;
  total:    number;
}