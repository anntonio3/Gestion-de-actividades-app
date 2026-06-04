// src/app/core/services/inscripcion.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InscripcionEstado, InscripcionRequest, InscripcionResponse } from '../models/inscripcion.model';

@Injectable({ providedIn: 'root' })
export class InscripcionService {

  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8181/api/inscripciones';

  inscribir(idActividad: number, body: InscripcionRequest): Observable<InscripcionEstado> {
    return this.http.post<InscripcionEstado>(`${this.base}/${idActividad}`, body);
  }

  cancelar(idActividad: number, body: InscripcionRequest): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idActividad}`, { body });
  }

  misInscripciones(idActor: number, tipoUsuario: string): Observable<InscripcionResponse[]> {
    const params = new HttpParams()
      .set('idActor', idActor)
      .set('tipoUsuario', tipoUsuario);
    return this.http.get<InscripcionResponse[]>(`${this.base}/mis-inscripciones`, { params });
  }

  obtenerEstado(idActividad: number, idActor: number, tipoUsuario: string): Observable<InscripcionEstado> {
    const params = new HttpParams()
      .set('idActor', idActor)
      .set('tipoUsuario', tipoUsuario);
    return this.http.get<InscripcionEstado>(`${this.base}/${idActividad}/estado`, { params });
  }

  obtenerLote(
    ids: number[],
    idActor?: number,
    tipoUsuario?: string
  ): Observable<Record<number, InscripcionEstado>> {
    let params = new HttpParams().set('ids', ids.join(','));
    if (idActor != null)     params = params.set('idActor', idActor);
    if (tipoUsuario != null) params = params.set('tipoUsuario', tipoUsuario);
    return this.http.get<Record<number, InscripcionEstado>>(`${this.base}/lote`, { params });
  }

  totalInscritos(idActividad: number): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.base}/${idActividad}/total`);
  }
}