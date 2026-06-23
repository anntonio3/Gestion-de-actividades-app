import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  EventoDestacado, DestacarRequest, DestacarResponse
} from '../models/destacado.model';

@Injectable({ providedIn: 'root' })
export class DestacadoService {

  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8181/api';

  /**
   * US-27: Obtiene el evento destacado activo (publico, sin login).
   * El backend devuelve 204 si no hay; HttpClient lo entrega como null.
   */
  obtenerDestacado(): Observable<EventoDestacado | null> {
    return this.http.get<EventoDestacado>(`${this.base}/calendario/destacado`);
  }

  /**
   * US-26: Marca una actividad como destacada.
   * Si ya hay otro destacado y confirmarReemplazo=false, el back responde 409.
   */
  destacar(idActividad: number, body: DestacarRequest): Observable<DestacarResponse> {
    return this.http.post<DestacarResponse>(
      `${this.base}/vicerrectoria/solicitudes/${idActividad}/destacar`, body);
  }

  /** US-26: Quita el destacado de una actividad. */
  quitarDestacado(idActividad: number, idAdmin: number): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/vicerrectoria/solicitudes/${idActividad}/destacar`,
      { params: { idAdmin } });
  }
}