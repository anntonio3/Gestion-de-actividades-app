import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActualizarActividadRequest, SolicitudActividad } from '../models/actividad.model';

@Injectable({ providedIn: 'root' })
export class ActividadService {

  private readonly api = 'http://localhost:8181/api/actividades';

  constructor(private http: HttpClient) {}

  getMisSolicitudes(idProfesor: number, estado?: string): Observable<SolicitudActividad[]> {
    let params = new HttpParams().set('idProfesor', idProfesor);
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http.get<SolicitudActividad[]>(`${this.api}/mis-solicitudes`, { params });
  }

   // US-05: Editar una actividad en estado PENDIENTE
  editarActividad(idActividad: number, idProfesor: number, datos: ActualizarActividadRequest): Observable<SolicitudActividad> {
    const params = new HttpParams().set('idProfesor', idProfesor);
    return this.http.put<SolicitudActividad>(`${this.api}/${idActividad}`, datos, { params });
  }
}