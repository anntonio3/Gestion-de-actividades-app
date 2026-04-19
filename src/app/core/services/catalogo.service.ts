import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Categoria, TipoActividad, Departamento,
  Carrera, EspacioRecurso, MobiliarioRecurso
} from '../models/catalogo.model';

@Injectable({ providedIn: 'root' })
export class CatalogoService {

  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8181/api';

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.base}/categorias`);
  }

  getTiposActividad(categoriaId: number): Observable<TipoActividad[]> {
    return this.http.get<TipoActividad[]>(
      `${this.base}/tipos-actividad?categoriaId=${categoriaId}`
    );
  }

  getDepartamentos(): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(`${this.base}/departamentos`);
  }

  getCarreras(): Observable<Carrera[]> {
    return this.http.get<Carrera[]>(`${this.base}/carreras`);
  }

  getEspacios(): Observable<EspacioRecurso[]> {
    return this.http.get<EspacioRecurso[]>(`${this.base}/recursos/espacios`);
  }

  getMobiliario(): Observable<MobiliarioRecurso[]> {
    return this.http.get<MobiliarioRecurso[]>(`${this.base}/recursos/mobiliario`);
  }
}