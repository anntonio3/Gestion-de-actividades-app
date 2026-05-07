import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SolicitudListItem, SolicitudDetalle, SolicitudDecidida,
  AprobarRequest, RechazarRequest, FiltrosSolicitudes
} from '../models/vicerrectoria.model';

@Injectable({ providedIn: 'root' })
export class VicerrectoriaService {

  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8181/api/vicerrectoria/solicitudes';

  listar(filtros: FiltrosSolicitudes = {}): Observable<SolicitudListItem[]> {
    let params = new HttpParams();
    if (filtros.estado && filtros.estado !== 'TODOS') {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.idCategoria != null) {
      params = params.set('idCategoria', filtros.idCategoria);
    }
    if (filtros.idCarrera != null) {
      params = params.set('idCarrera', filtros.idCarrera);
    }
    if (filtros.idDepartamento != null) {
      params = params.set('idDepartamento', filtros.idDepartamento);
    }
    if (filtros.q && filtros.q.trim()) {
      params = params.set('q', filtros.q.trim());
    }
    return this.http.get<SolicitudListItem[]>(this.base, { params });
  }

  obtenerDetalle(id: number): Observable<SolicitudDetalle> {
    return this.http.get<SolicitudDetalle>(`${this.base}/${id}`);
  }

  aprobar(id: number, body: AprobarRequest): Observable<SolicitudDecidida> {
    return this.http.post<SolicitudDecidida>(`${this.base}/${id}/aprobar`, body);
  }

  rechazar(id: number, body: RechazarRequest): Observable<SolicitudDecidida> {
    return this.http.post<SolicitudDecidida>(`${this.base}/${id}/rechazar`, body);
  }
}