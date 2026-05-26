import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor global de errores HTTP.
 * Ademas de construir mensajes amigables, redirige al login si el backend
 * devuelve 401 (sesion expirada o no autorizado).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError(error => {
      let mensaje = 'Error inesperado. Intenta de nuevo.';

      if (error.status === 401) {
        // Sesion expirada o no autenticado: limpiar storage y redirigir
        localStorage.removeItem('unpa_sesion');
        router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url } });
        mensaje = 'Tu sesion ha expirado. Inicia sesion de nuevo.';
      } else if (error.status === 403) {
        mensaje = 'No tienes permiso para realizar esta accion.';
      } else if (error.status === 400 && error.error?.errores) {
        const errores = Object.values(error.error.errores).join(', ');
        mensaje = `Errores de validacion: ${errores}`;
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