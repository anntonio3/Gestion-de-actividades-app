// Modelos para administración de espacios (US-14)
// Soporta espacios internos (mapa UNPA) y externos (Google Maps).

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
  esExterno: boolean;

  // Campos de ubicación interna (mapa UNPA) — presentes si !esExterno
  idPunto?: number;
  etiquetaPunto?: string;
  coordX?: number;
  coordY?: number;

  // Campos de ubicación externa (Google Maps) — presentes si esExterno
  latitud?: number;
  longitud?: number;
  urlMaps?: string;

  equipamiento: EquipamientoItem[];
}

export interface EquipamientoItem {
  idRecurso: number;
  nombreRecurso: string;
  cantidad: number;
  caracteristicas?: string;
}

/** Tipo de ubicación seleccionada en el formulario del admin. */
export type TipoUbicacion = 'interna' | 'externa';

export interface EspacioRequest {
  // Ubicación interna — presente si tipoUbicacion === 'interna'
  idPunto?: number;

  // Ubicación externa — presente si tipoUbicacion === 'externa'
  latitud?: number;
  longitud?: number;
  urlMaps?: string;

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