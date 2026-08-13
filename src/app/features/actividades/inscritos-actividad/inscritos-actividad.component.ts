import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { InscritosService } from '../../../core/services/inscritos.service';
import { SesionService } from '../../../core/services/sesion.service';
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
  private readonly sesion = inject(SesionService);

  idActividad!: number;
  datos: ListaInscritosResponse | null = null;
  cargando = true;
  error = '';
  descargando = false;

  ngOnInit(): void {
    this.idActividad = Number(this.route.snapshot.paramMap.get('idActividad'));
    this.cargarInscritos();
  }

  cargarInscritos(): void {
    this.cargando = true;
    this.error = '';
    const idSolicitante = this.sesion.getIdProfesor();
    const rolSolicitante = 'PROFESOR'; // ajustar si SesionService expone el rol real

    this.inscritosService.listar(this.idActividad, idSolicitante, rolSolicitante).subscribe({
      next: data => { this.datos = data; this.cargando = false; },
      error: () => { this.error = 'No se pudo cargar la lista de inscritos.'; this.cargando = false; }
    });
  }

  descargar(tipo: 'pdf' | 'csv'): void {
    if (this.descargando) return;
    this.descargando = true;
    const idSolicitante = this.sesion.getIdProfesor();
    const rolSolicitante = 'PROFESOR';

    const obs = tipo === 'pdf'
      ? this.inscritosService.descargarPdf(this.idActividad, idSolicitante, rolSolicitante)
      : this.inscritosService.descargarCsv(this.idActividad, idSolicitante, rolSolicitante);

    obs.subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inscritos_actividad_${this.idActividad}.${tipo}`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.descargando = false;
      },
      error: () => { this.error = `No se pudo descargar el ${tipo.toUpperCase()}.`; this.descargando = false; }
    });
  }

  tipoLabel(tipo: string): string {
    return { ALUMNO: 'Alumno', DOCENTE: 'Docente', EXTERNO: 'Externo' }[tipo] ?? tipo;
  }
}