import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InmobiliarioRequest, InmobiliarioResponse } from '../models/inmobiliario.model';

@Injectable({ providedIn: 'root' })
export class InmobiliarioService {

  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8181/api/admin/inmobiliario';

  /** US-14: Listar todo el inmobiliario activo (con búsqueda opcional) */
  listar(nombre?: string): Observable<InmobiliarioResponse[]> {
    let params = new HttpParams();
    if (nombre?.trim()) params = params.set('nombre', nombre.trim());
    return this.http.get<InmobiliarioResponse[]>(this.base, { params });
  }

  /** US-14: Obtener uno por ID */
  obtenerPorId(id: number): Observable<InmobiliarioResponse> {
    return this.http.get<InmobiliarioResponse>(`${this.base}/${id}`);
  }

  /** US-14: Registrar nuevo inmobiliario (multipart/form-data) */
  crear(datos: InmobiliarioRequest, foto?: File): Observable<InmobiliarioResponse> {
    return this.http.post<InmobiliarioResponse>(this.base, this.buildFormData(datos, foto));
  }

  /** US-14: Actualizar inmobiliario (foto opcional) */
  actualizar(id: number, datos: InmobiliarioRequest, foto?: File): Observable<InmobiliarioResponse> {
    return this.http.put<InmobiliarioResponse>(`${this.base}/${id}`, this.buildFormData(datos, foto));
  }

  /** US-14: Dar de baja (soft delete) */
  desactivar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // ── Construye el FormData combinando campos + foto opcional ──
  private buildFormData(datos: InmobiliarioRequest, foto?: File): FormData {
    const fd = new FormData();
    fd.append('nombre',       datos.nombre);
    fd.append('existencias',  String(datos.existencias));
    fd.append('disponibles',  String(datos.disponibles));
    if (datos.descripcion)   fd.append('descripcion',   datos.descripcion);
    if (datos.codigo)        fd.append('codigo',        datos.codigo);
    if (datos.numInventario) fd.append('numInventario', datos.numInventario);
    if (datos.nota)          fd.append('nota',          datos.nota);
    if (foto)                fd.append('foto',          foto, foto.name);
    return fd;
  }
}