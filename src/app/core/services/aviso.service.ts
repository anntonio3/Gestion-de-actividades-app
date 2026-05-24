import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Aviso, AvisoRequest } from '../models/aviso.model';

/**
 * Service privado del profesor para gestionar sus avisos (US-17/US-19).
 * Distinto de CorchoService, que es el endpoint publico read-only.
 */
@Injectable({ providedIn: 'root' })
export class AvisoService {

  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8181/api/avisos';

  /** US-19: Lista de avisos del profesor para gestionarlos */
  misAvisos(idProfesor: number): Observable<Aviso[]> {
    const params = new HttpParams().set('idProfesor', idProfesor);
    return this.http.get<Aviso[]>(`${this.base}/mis-avisos`, { params });
  }

  /** Detalle individual (precarga del formulario en modo edicion) */
  obtener(idAviso: number): Observable<Aviso> {
    return this.http.get<Aviso>(`${this.base}/${idAviso}`);
  }

  /** US-17: Crear aviso (multipart con foto opcional) */
  crear(datos: AvisoRequest, foto?: File): Observable<Aviso> {
    return this.http.post<Aviso>(this.base, this.buildFormData(datos, foto));
  }

  /** US-19: Editar aviso (foto opcional: si no llega, se conserva) */
  actualizar(idAviso: number, datos: AvisoRequest, foto?: File): Observable<Aviso> {
    return this.http.put<Aviso>(`${this.base}/${idAviso}`, this.buildFormData(datos, foto));
  }

  /** Retirar aviso (soft delete) */
  desactivar(idAviso: number, idProfesor: number): Observable<void> {
    const params = new HttpParams().set('idProfesor', idProfesor);
    return this.http.delete<void>(`${this.base}/${idAviso}`, { params });
  }

  // Construye el FormData combinando los campos del request + foto opcional.
  // El backend recibe los campos con @ModelAttribute, asi que van planos
  // (no como Blob JSON, a diferencia de registrar-actividad).
  private buildFormData(datos: AvisoRequest, foto?: File): FormData {
    const fd = new FormData();
    fd.append('idProfesor',  String(datos.idProfesor));
    fd.append('titulo',      datos.titulo);
    fd.append('descripcion', datos.descripcion);
    fd.append('fechaEvento', datos.fechaEvento);
    if (datos.horaEvento) fd.append('horaEvento', datos.horaEvento);
    if (foto)             fd.append('foto', foto, foto.name);
    return fd;
  }
}