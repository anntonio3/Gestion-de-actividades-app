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
    if (estado) params = params.set('estado', estado);
    return this.http.get<SolicitudActividad[]>(`${this.api}/mis-solicitudes`, { params });
  }

  // US-05: Editar datos de una actividad PENDIENTE
  editarActividad(idActividad: number, idProfesor: number, datos: ActualizarActividadRequest): Observable<SolicitudActividad> {
    const params = new HttpParams().set('idProfesor', idProfesor);
    return this.http.put<SolicitudActividad>(`${this.api}/${idActividad}`, datos, { params });
  }

  // Reemplazar (o agregar) la imagen de portada — endpoint singular /imagen
  reemplazarImagen(idActividad: number, idProfesor: number, archivo: File): Observable<SolicitudActividad> {
    const formData = new FormData();
    formData.append('imagen', archivo);
    const params = new HttpParams().set('idProfesor', idProfesor);
    return this.http.post<SolicitudActividad>(`${this.api}/${idActividad}/imagen`, formData, { params });
  }

  // Eliminar la imagen de portada sin reemplazarla
  eliminarImagen(idActividad: number, idProfesor: number): Observable<SolicitudActividad> {
    const params = new HttpParams().set('idProfesor', idProfesor);
    return this.http.delete<SolicitudActividad>(`${this.api}/${idActividad}/imagen`, { params });
  }
}