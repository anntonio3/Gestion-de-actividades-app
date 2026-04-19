import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Actividad } from "../models/actividad.model";

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private url = 'http://localhost:8080/api/calendario/publico';

  constructor(private http: HttpClient) {}

  getActividadesPublicas(idTipo?: number): Observable<Actividad[]> {
    const params: any = idTipo ? { tipo: idTipo.toString() } : {};
    return this.http.get<Actividad[]>(this.url, { params });
  }
}