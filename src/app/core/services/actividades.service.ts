import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Actividad, Categoria } from '../models/actividad.model';

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private base = 'http://localhost:8181/api/calendario';

  constructor(private http: HttpClient) {}

  getActividadesPublicas(idCategoria?: number): Observable<Actividad[]> {
    let params = new HttpParams();
    if (idCategoria !== undefined) {
      params = params.set('categoria', idCategoria.toString());
    }
    return this.http.get(`${this.base}/publico`, { params }) as unknown as Observable<Actividad[]>;
  }

  getCategorias(): Observable<Categoria[]> {
    return this.http.get(`${this.base}/categorias`) as unknown as Observable<Categoria[]>;
  }
}