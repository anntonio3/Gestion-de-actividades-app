import { Injectable } from '@angular/core';

/**
 * Servicio de sesion temporal mientras no exista autenticacion real.
 * Reemplazar cuando se implemente login + JWT.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {

  // Datos quemados del admin para pruebas
  private readonly admin = {
    idUsuario: 1,
    nombre: 'Administrador',
    apellidos: 'Sistema',
    iniciales: 'AS',
    rol: 'ADMIN' as const
  };

  getIdAdmin(): number {
    return this.admin.idUsuario;
  }

  getNombreAdmin(): string {
    return `${this.admin.nombre} ${this.admin.apellidos}`;
  }

  getInicialesAdmin(): string {
    return this.admin.iniciales;
  }
}