import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SesionService } from '../services/sesion.service';

/**
 * Interceptor global de errores HTTP.
 * US-00: maneja 401 (token expirado/inválido) y 403 (sin permiso).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const sesion = inject(SesionService);

  return next(req).pipe(
    catchError(error => {
      let mensaje = 'Error inesperado. Intenta de nuevo.';

      if (error.status === 401) {
        // Token ausente, inválido o expirado — cerrar sesión y redirigir
        sesion.cerrarSesion();
        mensaje = 'Tu sesión ha expirado. Inicia sesión de nuevo.';
      } else if (error.status === 403) {
        mensaje = 'No tienes permiso para realizar esta acción.';
        router.navigate(['/sin-permiso']);
      } else if (error.status === 400 && error.error?.errores) {
        mensaje = `Errores de validación: ${Object.values(error.error.errores).join(', ')}`;
      } else if (error.status === 400 && error.error?.mensaje) {
        mensaje = error.error.mensaje;
      } else if (error.status === 404) {
        mensaje = error.error?.mensaje ?? 'Recurso no encontrado.';
      } else if (error.status === 409) {
        mensaje = error.error?.mensaje ?? 'Conflicto al procesar la solicitud.';
      } else if (error.status === 0) {
        mensaje = 'No se pudo conectar al servidor.';
      }

      return throwError(() => ({ ...error, mensajeAmigable: mensaje }));
    })
  );
};