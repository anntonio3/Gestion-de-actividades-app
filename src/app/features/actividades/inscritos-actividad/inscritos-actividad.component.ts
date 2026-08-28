import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { InscritosService } from '../../../core/services/inscritos.service';
import { ListaInscritosResponse } from '../../../core/models/inscrito.model';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-inscritos-actividad',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './inscritos-actividad.component.html',
  styleUrls: ['./inscritos-actividad.component.css']
})
export class InscritosActividadComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly inscritosService = inject(InscritosService);

  idActividad!: number;
  datos: ListaInscritosResponse | null = null;
  cargando = true;
  error = '';

  ngOnInit(): void {
    this.idActividad = Number(this.route.snapshot.paramMap.get('idActividad'));
    this.cargarInscritos();
  }

  cargarInscritos(): void {
    this.cargando = true;
    this.error = '';

    // Ya no se manda idSolicitante/rolSolicitante: el jwtInterceptor
    // agrega el token y el backend resuelve permisos desde ahi.
    this.inscritosService.obtenerLista(this.idActividad).subscribe({
      next: (data: ListaInscritosResponse) => { this.datos = data; this.cargando = false; },
      error: () => { this.error = 'No se pudo cargar la lista de inscritos.'; this.cargando = false; }
    });
  }

  descargar(tipo: 'pdf' | 'csv'): void {
    // Fire-and-forget: el service ya maneja la descarga internamente
    if (tipo === 'pdf') this.inscritosService.descargarPdf(this.idActividad);
    else this.inscritosService.descargarCsv(this.idActividad);
  }

  tipoLabel(tipo: string): string {
    return { ALUMNO: 'Alumno', DOCENTE: 'Docente', EXTERNO: 'Externo' }[tipo] ?? tipo;
  }
}