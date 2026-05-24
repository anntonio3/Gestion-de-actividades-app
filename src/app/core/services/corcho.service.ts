import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Aviso } from '../models/aviso.model';

/**
 * Consumo del corcho publico (US-18/US-20).
 * Para crear/editar avisos del profesor se usa otro service privado.
 */
@Injectable({ providedIn: 'root' })
export class CorchoService {

  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8181/api/corcho';

  /**
   * Lista publica de avisos.
   * @param fecha   filtra por fecha exacta (YYYY-MM-DD)
   * @param desde   inicio de rango (requiere hasta)
   * @param hasta   fin de rango (requiere desde)
   */
  listar(fecha?: string, desde?: string, hasta?: string): Observable<Aviso[]> {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    if (desde && hasta) {
      params = params.set('desde', desde).set('hasta', hasta);
    }
    return this.http.get<Aviso[]>(this.base, { params });
  }

  obtener(idAviso: number): Observable<Aviso> {
    return this.http.get<Aviso>(`${this.base}/${idAviso}`);
  }
}