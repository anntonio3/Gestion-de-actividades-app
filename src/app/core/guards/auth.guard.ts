import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion.service';
import { TipoSesion } from '../models/auth.model';

/**
 * Guard generico: requiere sesion activa.
 * Redirige a /auth/login si no hay usuario autenticado.
 */
export const authGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);

  if (sesion.logueado()) return true;

  router.navigate(['/auth/login']);
  return false;
};

/**
 * Guard de rol: requiere que el usuario sea ADMIN o PROFESOR.
 * Los alumnos no tienen acceso a rutas de gestion.
 */
export const profesorGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);

  const usuario = sesion.usuario();
  if (!usuario) {
    router.navigate(['/auth/login']);
    return false;
  }
  if (usuario.tipo === 'ALUMNO') {
    router.navigate(['/calendario']);
    return false;
  }
  return true;
};

/**
 * Guard de rol: solo ADMIN.
 */
export const adminGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);

  const usuario = sesion.usuario();
  if (!usuario) {
    router.navigate(['/auth/login']);
    return false;
  }
  if (usuario.tipo !== 'ADMIN') {
    router.navigate(['/calendario']);
    return false;
  }
  return true;
};
