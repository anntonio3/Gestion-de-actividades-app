// Modelos para administración de espacios (US-14)

export interface MapaPunto {
  idPunto: number;
  etiqueta: string;
  coordX: number;
  coordY: number;
  // Datos del espacio asignado (null si el punto está vacío)
  idEspacio: number | null;
  nombreEspacio: string | null;
  capacidad: number | null;
  activo: boolean | null;
}

export interface EspacioDetalle {
  idEspacio: number;
  nombre: string;
  descripcion?: string;
  capacidad: number;
  ubicacion: string;
  activo: boolean;
  // Datos del punto del mapa
  idPunto: number;
  etiquetaPunto: string;
  coordX: number;
  coordY: number;
  equipamiento: EquipamientoItem[];
}

export interface EquipamientoItem {
  idRecurso: number;
  nombreRecurso: string;
  cantidad: number;
  caracteristicas?: string;
}

export interface EspacioRequest {
  idPunto: number;
  nombre: string;
  descripcion?: string;
  capacidad: number;
  ubicacion: string;
  equipamiento: EquipamientoRequest[];
}

export interface EquipamientoRequest {
  idRecurso: number;
  cantidad: number;
  caracteristicas?: string;
}

export interface EspacioEstadoRequest {
  activo: boolean;
}