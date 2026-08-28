import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { InscritosService } from '../../../../core/services/inscritos.service';
import { ActividadInscripcionResumen } from '../../../../core/models/inscrito.model';


@Component({
  selector: 'app-admin-inscripciones',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './admin-inscripciones.component.html',
  styleUrls: ['./admin-inscripciones.component.css']
})
export class AdminInscripcionesComponent implements OnInit {

  private readonly inscritosService = inject(InscritosService);
  private readonly router = inject(Router);

  todas: ActividadInscripcionResumen[] = [];
  cargando = true;
  error = '';
  busqueda = '';

  ngOnInit(): void {
    this.cargarEventos();
  }

  cargarEventos(): void {
    this.cargando = true;
    this.error = '';
    this.inscritosService.listarParaAdmin().subscribe({
      next: data => {
        // Orden por fecha ascendente: los eventos mas proximos primero
        this.todas = [...data].sort((a, b) => a.fechaActividad.localeCompare(b.fechaActividad));
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el listado de eventos con inscripción.';
        this.cargando = false;
      }
    });
  }

  get listaFiltrada(): ActividadInscripcionResumen[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.todas;
    return this.todas.filter(e =>
      e.nombreEvento.toLowerCase().includes(q) ||
      e.nombreProfesor.toLowerCase().includes(q)
    );
  }

  verInscritos(idActividad: number): void {
    this.router.navigate(['/admin/inscripciones', idActividad]);
  }
}