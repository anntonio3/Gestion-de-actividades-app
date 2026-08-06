import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  LoginRequest, LoginResponse,
  RegistroAlumnoRequest,
  RecuperarContrasenaRequest, RecuperacionResponse,
  RestablecerContrasenaRequest
} from '../models/auth.model';
import { SesionService } from './sesion.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly http    = inject(HttpClient);
  private readonly sesion  = inject(SesionService);
  private readonly base    = 'http://localhost:8181/api/auth';

  /** Login unificado: matricula o correo */
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, request).pipe(
      tap(respuesta => this.sesion.iniciarSesion(respuesta))
    );
  }

  /** Registro exclusivo de alumnos */
  registro(request: RegistroAlumnoRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/registro`, request).pipe(
      tap(respuesta => this.sesion.iniciarSesion(respuesta))
    );
  }

  /** Solicitar correo de recuperacion */
  recuperar(request: RecuperarContrasenaRequest): Observable<RecuperacionResponse> {
    return this.http.post<RecuperacionResponse>(`${this.base}/recuperar`, request);
  }

  /** Verificar si un token sigue siendo valido */
  verificarToken(token: string): Observable<{ valido: boolean }> {
    return this.http.get<{ valido: boolean }>(`${this.base}/verificar-token/${token}`);
  }

  /** Restablecer contrasena con token */
  restablecer(request: RestablecerContrasenaRequest): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.base}/restablecer`, request);
  }

   /**
   * US-00: Logout real.
   * El jwtInterceptor adjunta automáticamente el header Authorization,
   * el backend agrega el token a la blacklist y lo invalida en BD.
   */
  logout(): void {
    this.http.post(`${this.base}/logout`, {}).subscribe({
      error: () => {} // ignorar errores de red en logout
    });
    this.sesion.cerrarSesion();
  }
}
