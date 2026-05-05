import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  MapaPunto, EspacioDetalle,
  EspacioRequest, EspacioEstadoRequest
} from '../models/espacio-admin.model';

@Injectable({ providedIn: 'root' })
export class EspacioAdminService {

  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8181/api/admin';

  // Lista de puntos del mapa con info del espacio (si tiene)
  listarPuntos(): Observable<MapaPunto[]> {
    return this.http.get<MapaPunto[]>(`${this.base}/mapa/puntos`);
  }

  // Detalle de un espacio con su equipamiento
  obtenerDetalle(idEspacio: number): Observable<EspacioDetalle> {
    return this.http.get<EspacioDetalle>(`${this.base}/espacios/${idEspacio}`);
  }

  // Registrar nuevo espacio
  registrar(request: EspacioRequest): Observable<EspacioDetalle> {
    return this.http.post<EspacioDetalle>(`${this.base}/espacios`, request);
  }

  // Editar espacio existente
  actualizar(idEspacio: number, request: EspacioRequest): Observable<EspacioDetalle> {
    return this.http.put<EspacioDetalle>(`${this.base}/espacios/${idEspacio}`, request);
  }

  // Activar / desactivar
  cambiarEstado(idEspacio: number, activo: boolean): Observable<void> {
    const body: EspacioEstadoRequest = { activo };
    return this.http.patch<void>(`${this.base}/espacios/${idEspacio}/estado`, body);
  }
}