import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AsistenciaEstado, RespuestaAsistencia } from '../models/asistencia.model';

@Injectable({ providedIn: 'root' })
export class AsistenciaService {

  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8181/api/asistencia';

  // withCredentials es CRITICO: sin esto la cookie del visitante no viaja
  private readonly opciones = { withCredentials: true };

  obtenerLote(ids: number[]): Observable<Record<number, AsistenciaEstado>> {
    if (ids.length === 0) {
      return new Observable(sub => { sub.next({}); sub.complete(); });
    }
    const params = new HttpParams().set('ids', ids.join(','));
    return this.http.get<Record<number, AsistenciaEstado>>(
      this.base, { ...this.opciones, params });
  }

  obtener(idActividad: number): Observable<AsistenciaEstado> {
    return this.http.get<AsistenciaEstado>(`${this.base}/${idActividad}`, this.opciones);
  }

  responder(idActividad: number, respuesta: RespuestaAsistencia): Observable<AsistenciaEstado> {
    return this.http.post<AsistenciaEstado>(
      `${this.base}/${idActividad}`, { respuesta }, this.opciones);
  }
}