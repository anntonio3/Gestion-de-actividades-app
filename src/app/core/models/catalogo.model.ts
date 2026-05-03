export interface Categoria {
  idCategoria: number;
  nombre: string;
  descripcion?: string;
}

export interface TipoActividad {
  idTipo: number;
  nombre: string;
  idCategoria: number;
  nombreCategoria: string;
}

export interface Departamento {
  idDepartamento: number;
  nombre: string;
}

export interface Carrera {
  idCarrera: number;
  nombre: string;
}

export interface EspacioRecurso {
  idRecurso: number;
  nombre: string;
  descripcion?: string;
  capacidad: number;
  ubicacion: string;
  disponible: boolean; // Nuevo
}

export interface MobiliarioRecurso {
  idRecurso: number;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  cantidadTotal: number;        // ← renombrado
  cantidadDisponible: number;   // ← nuevo
}