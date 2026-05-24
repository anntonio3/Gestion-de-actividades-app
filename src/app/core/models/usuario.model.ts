export type Rol = 'ADMIN' | 'PROFESOR';

export interface UsuarioResponse {
  idUsuario:     number;
  nombre:        string;
  apellidos:     string;
  correo:        string;
  rol:           Rol;
  activo:        boolean;
  fechaRegistro: string;   // ISO datetime
  iniciales:     string;   // calculadas en el backend, ej. "CH"
}

export interface UsuarioCrearRequest {
  nombre:    string;
  apellidos: string;
  correo:    string;
  rol:       Rol;
  // la contraseña la genera el backend automáticamente
}

export interface UsuarioEditarRequest {
  nombre:    string;
  apellidos: string;
  correo:    string;
  rol:       Rol;
}

export interface UsuarioEstadoRequest {
  activo: boolean;
}

export const ROL_LABEL: Record<Rol, string> = {
  ADMIN:   'Administrador',
  PROFESOR: 'Profesor',
};

export const ROL_ICONO: Record<Rol, string> = {
  ADMIN:   'shield_person',
  PROFESOR: 'school',
};