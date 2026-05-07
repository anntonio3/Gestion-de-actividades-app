// ─── US-14: Registro de Inmobiliario ───────────────────────

export interface InmobiliarioResponse {
  idRecurso:     number;
  nombre:        string;
  descripcion?:  string;
  activo:        boolean;
  codigo?:       string;
  numInventario?: string;
  existencias:   number;
  disponibles:   number;
  fotoUrl?:      string;
  nota?:         string;
}

export interface InmobiliarioRequest {
  nombre:        string;
  descripcion?:  string;
  codigo?:       string;
  numInventario?: string;
  existencias:   number;
  disponibles:   number;
  nota?:         string;
  // La foto se manda como FormData, no en esta interfaz
}