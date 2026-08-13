import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ListaInscritosResponse } from '../models/inscrito.model';

@Injectable({ providedIn: 'root' })
export class InscritosService {

  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8181/api/inscritos';

  listar(idActividad: number, idSolicitante: number, rolSolicitante: string): Observable<ListaInscritosResponse> {
    const params = new HttpParams()
      .set('idSolicitante', idSolicitante)
      .set('rolSolicitante', rolSolicitante);
    return this.http.get<ListaInscritosResponse>(`${this.base}/${idActividad}`, { params });
  }

  descargarPdf(idActividad: number, idSolicitante: number, rolSolicitante: string): Observable<Blob> {
    const params = new HttpParams()
      .set('idSolicitante', idSolicitante)
      .set('rolSolicitante', rolSolicitante);
    return this.http.get(`${this.base}/${idActividad}/pdf`, { params, responseType: 'blob' });
  }

  descargarCsv(idActividad: number, idSolicitante: number, rolSolicitante: string): Observable<Blob> {
    const params = new HttpParams()
      .set('idSolicitante', idSolicitante)
      .set('rolSolicitante', rolSolicitante);
    return this.http.get(`${this.base}/${idActividad}/csv`, { params, responseType: 'blob' });
  }
}