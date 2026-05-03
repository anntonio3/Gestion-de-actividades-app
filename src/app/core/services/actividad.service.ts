import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActividadRequest, ActividadResponse } from '../models/actividad.model';

@Injectable({ providedIn: 'root' })
export class ActividadService {

  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8181/api';

  registrar(request: ActividadRequest, portada?: File): Observable<ActividadResponse> {
    const formData = new FormData();

    // Angular envía el JSON con Content-Type application/json por campo
    formData.append(
      'datos',
      new Blob([JSON.stringify(request)], { type: 'application/json' })
    );

    if (portada) {
      formData.append('portada', portada, portada.name);
    }

    return this.http.post<ActividadResponse>(`${this.base}/actividades`, formData);
  }
}