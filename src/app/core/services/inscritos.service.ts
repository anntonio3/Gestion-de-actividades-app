import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InscritoItem {
  numero: number;
  nombre: string;
  tipoParticipante: string;
  identificador: string;
  fechaInscripcion: string;
}

@Injectable({ providedIn: 'root' })
export class InscritosService {

  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8181/api/actividades';

  obtenerLista(idActividad: number, idSolicitante: number): Observable<InscritoItem[]> {
    const params = new HttpParams().set('idSolicitante', idSolicitante);
    return this.http.get<InscritoItem[]>(`${this.base}/${idActividad}/inscritos`, { params });
  }

  descargarPdf(idActividad: number, idSolicitante: number): void {
    const params = new HttpParams().set('idSolicitante', idSolicitante);
    this.http.get(`${this.base}/${idActividad}/inscritos/pdf`, {
      params,
      responseType: 'blob'
    }).subscribe(blob => {
      this.triggerDescarga(blob, `inscritos-${idActividad}.pdf`, 'application/pdf');
    });
  }

  descargarCsv(idActividad: number, idSolicitante: number): void {
    const params = new HttpParams().set('idSolicitante', idSolicitante);
    this.http.get(`${this.base}/${idActividad}/inscritos/csv`, {
      params,
      responseType: 'blob'
    }).subscribe(blob => {
      this.triggerDescarga(blob, `inscritos-${idActividad}.csv`, 'text/csv');
    });
  }

  private triggerDescarga(blob: Blob, nombreArchivo: string, tipo: string): void {
    const url = URL.createObjectURL(new Blob([blob], { type: tipo }));
    const a   = document.createElement('a');
    a.href     = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
  }
}