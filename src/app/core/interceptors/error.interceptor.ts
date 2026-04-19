import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(error => {
      let mensaje = 'Error inesperado. Intenta de nuevo.';

      if (error.status === 400 && error.error?.errores) {
        const errores = Object.values(error.error.errores).join(', ');
        mensaje = `Errores de validación: ${errores}`;
      } else if (error.status === 400 && error.error?.mensaje) {
        mensaje = error.error.mensaje;
      } else if (error.status === 404) {
        mensaje = error.error?.mensaje ?? 'Recurso no encontrado.';
      } else if (error.status === 0) {
        mensaje = 'No se pudo conectar al servidor.';
      }

      return throwError(() => ({ ...error, mensajeAmigable: mensaje }));
    })
  );
};