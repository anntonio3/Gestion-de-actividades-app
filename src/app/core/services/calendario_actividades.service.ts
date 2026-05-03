import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActividadPublica } from '../models/actividad.model';
import { Categoria } from '../models/catalogo.model';

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private base = 'http://localhost:8181/api/calendario';

  constructor(private http: HttpClient) {}

  getActividadesPublicas(idCategoria?: number): Observable<ActividadPublica[]> {
    let params = new HttpParams();
    if (idCategoria !== undefined) {
      params = params.set('categoria', idCategoria.toString());
    }
    return this.http.get(`${this.base}/publico`, { params }) as unknown as Observable<ActividadPublica[]>;
  }

  getCategorias(): Observable<Categoria[]> {
    return this.http.get(`${this.base}/categorias`) as unknown as Observable<Categoria[]>;
  }
}