import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  EstadisticaMes,
  EstadisticaCampus,
  EstadisticaCarrera
} from '../models/estadisticas.model';

@Injectable({ providedIn: 'root' })
export class EstadisticasService {

  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8181/api/admin/estadisticas';

  /** US-21: total general por mes y año */
  obtenerGeneral(): Observable<EstadisticaMes[]> {
    return this.http.get<EstadisticaMes[]>(`${this.base}/general`);
  }

  /** US-22: por campus (departamento) */
  obtenerPorCampus(): Observable<EstadisticaCampus[]> {
    return this.http.get<EstadisticaCampus[]>(`${this.base}/por-campus`);
  }

  /** US-23: por carrera */
  obtenerPorCarrera(): Observable<EstadisticaCarrera[]> {
    return this.http.get<EstadisticaCarrera[]>(`${this.base}/por-carrera`);
  }
}