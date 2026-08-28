import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SesionService } from '../services/sesion.service';

/**
 * US-00: Interceptor JWT.
 * Adjunta automáticamente el header Authorization: Bearer <token>
 * en todas las peticiones al backend cuando hay sesión activa.
 * Las rutas públicas funcionan igual — el backend las permite sin token.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const sesion  = inject(SesionService);
  const usuario = sesion.usuario();

  // Solo inyectar si hay token y la petición va al backend
  if (usuario?.token && req.url.includes('localhost:8181')) {
    const reqConToken = req.clone({
      setHeaders: { Authorization: `Bearer ${usuario.token}` }
    });
    return next(reqConToken);
  }

  return next(req);
};