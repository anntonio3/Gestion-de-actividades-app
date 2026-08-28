import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActividadInscripcionResumen, ListaInscritosResponse } from '../models/inscrito.model';

@Injectable({ providedIn: 'root' })
export class InscritosService {

  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8181/api/actividades';

  /** US-28: lista de inscritos de una actividad (profesor dueño o admin). */
  obtenerLista(idActividad: number): Observable<ListaInscritosResponse> {
    return this.http.get<ListaInscritosResponse>(`${this.base}/${idActividad}/inscritos`);
  }

  /** US-28: descarga directa del PDF, sin exponer el manejo del blob al componente. */
  descargarPdf(idActividad: number): void {
    this.http.get(`${this.base}/${idActividad}/inscritos/pdf`, { responseType: 'blob' })
      .subscribe(blob => this.triggerDescarga(blob, `inscritos-${idActividad}.pdf`, 'application/pdf'));
  }

  /** US-28: descarga directa del CSV. */
  descargarCsv(idActividad: number): void {
    this.http.get(`${this.base}/${idActividad}/inscritos/csv`, { responseType: 'blob' })
      .subscribe(blob => this.triggerDescarga(blob, `inscritos-${idActividad}.csv`, 'text/csv'));
  }

  /** NUEVO: dashboard ADMIN — todas las actividades aprobadas con inscripcion. */
  listarParaAdmin(): Observable<ActividadInscripcionResumen[]> {
    return this.http.get<ActividadInscripcionResumen[]>(`${this.base}/admin/inscripcion`);
  }

  private triggerDescarga(blob: Blob, nombreArchivo: string, tipo: string): void {
    const url = URL.createObjectURL(new Blob([blob], { type: tipo }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
  }
}