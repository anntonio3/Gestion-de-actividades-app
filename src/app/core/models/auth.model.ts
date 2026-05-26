// Tipos para autenticacion (US-00)

export type TipoSesion = 'ALUMNO' | 'PROFESOR' | 'ADMIN';
export type RolUsuario = 'ADMIN' | 'PROFESOR';

export interface LoginRequest {
  identificador: string;   // matricula o correo
  contrasena: string;
}

export interface RegistroAlumnoRequest {
  matricula: string;
  nombre: string;
  apellidos: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
}

export interface RecuperarContrasenaRequest {
  correo: string;
}

export interface RestablecerContrasenaRequest {
  token: string;
  nuevaContrasena: string;
  confirmarContrasena: string;
}

// Respuesta del login: datos del usuario autenticado
export interface LoginResponse {
  id: number;
  nombre: string;
  apellidos: string;
  correo?: string;
  matricula?: string;
  iniciales: string;
  tipo: TipoSesion;
  rol?: RolUsuario;   // solo para PROFESOR y ADMIN
}

export interface RecuperacionResponse {
  mensaje: string;
  tokenSimulado?: string;  // solo en modo desarrollo
}