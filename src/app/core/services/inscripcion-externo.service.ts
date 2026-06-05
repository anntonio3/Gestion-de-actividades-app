// src/app/core/services/inscripcion-externo.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  InscripcionExternoRequest,
  InscripcionExternoResponse,
  InscripcionExternoEstado
} from '../models/inscripcion-externo.model';

@Injectable({ providedIn: 'root' })
export class InscripcionExternoService {

  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8181/api/inscripciones/externo';

  // withCredentials es CRITICO: la cookie visitante_id debe viajar en cada peticion
  private readonly opciones = { withCredentials: true };

  /**
   * US-24: Inscribe a una persona externa en una actividad.
   */
  inscribir(
    idActividad: number,
    datos: InscripcionExternoRequest
  ): Observable<InscripcionExternoResponse> {
    return this.http.post<InscripcionExternoResponse>(
      `${this.base}/${idActividad}`,
      datos,
      this.opciones
    );
  }

  /**
   * US-24: Cancela la inscripcion del externo actual (identificado por cookie).
   */
  cancelar(idActividad: number): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/${idActividad}`,
      this.opciones
    );
  }

  /**
   * US-24: Total de externos inscritos en una actividad.
   */
  totalExternos(idActividad: number): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(
      `${this.base}/${idActividad}/total`,
      this.opciones
    );
  }

  /**
   * US-24: Consulta si el visitante actual ya esta inscrito como externo.
   */
  obtenerEstado(idActividad: number): Observable<InscripcionExternoEstado> {
    return this.http.get<InscripcionExternoEstado>(
      `${this.base}/${idActividad}/estado`,
      this.opciones
    );
  }
}