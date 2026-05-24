import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  UsuarioResponse,
  UsuarioCrearRequest,
  UsuarioEditarRequest,
  UsuarioEstadoRequest,
  Rol,
} from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {

  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8181/api/admin/usuarios';

  /** US-01: Listar con filtros opcionales */
  listar(filtros: { rol?: Rol; activo?: boolean; q?: string } = {}): Observable<UsuarioResponse[]> {
    let params = new HttpParams();
    if (filtros.rol   != null) params = params.set('rol',    filtros.rol);
    if (filtros.activo != null) params = params.set('activo', String(filtros.activo));
    if (filtros.q?.trim())     params = params.set('q',      filtros.q.trim());
    return this.http.get<UsuarioResponse[]>(this.base, { params });
  }

  /** US-01: Obtener uno por id */
  obtener(id: number): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.base}/${id}`);
  }

  /** US-01: Crear usuario (contraseña generada automáticamente) */
  crear(request: UsuarioCrearRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(this.base, request);
  }

  /** US-01: Editar datos del usuario */
  editar(id: number, request: UsuarioEditarRequest): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.base}/${id}`, request);
  }

  /** US-01: Activar o desactivar */
  cambiarEstado(id: number, activo: boolean): Observable<void> {
    const body: UsuarioEstadoRequest = { activo };
    return this.http.patch<void>(`${this.base}/${id}/estado`, body);
  }
}