import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { InscripcionService } from '../../../core/services/inscripcion.service';
import { InscripcionResponse } from '../../../core/models/inscripcion.model';
import { SesionService } from '../../../core/services/sesion.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mis-inscripciones',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './mis-inscripciones.component.html',
  styleUrl: './mis-inscripciones.component.css'
})
export class MisInscripcionesComponent implements OnInit {

  private inscripcionService = inject(InscripcionService);
  private sesion             = inject(SesionService);
  private router             = inject(Router);

  inscripciones: InscripcionResponse[] = [];
  cargando = true;
  error    = '';

  // Confirmacion de cancelacion inline
  confirmandoId: number | null = null;
  procesandoId: number | null  = null;

  ngOnInit(): void {
    const usuario = this.sesion.usuario();
    if (!usuario) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.cargar();
  }

  cargar(): void {
    const usuario = this.sesion.usuario()!;
    this.cargando = true;
    this.error = '';
    this.inscripcionService.misInscripciones(usuario.id, usuario.tipo).subscribe({
      next: data => { this.inscripciones = data; this.cargando = false; },
      error: err => {
        this.error = err.mensajeAmigable ?? 'No se pudieron cargar tus inscripciones.';
        this.cargando = false;
      }
    });
  }

  get proximas(): InscripcionResponse[] {
    return this.inscripciones.filter(i => !this.esPasada(i));
  }

  get pasadas(): InscripcionResponse[] {
    return this.inscripciones.filter(i => this.esPasada(i));
  }

  esPasada(i: InscripcionResponse): boolean {
    const fin = new Date(i.fechaActividad + 'T' + i.horaFin);
    return fin < new Date();
  }

  puedesCancelar(i: InscripcionResponse): boolean {
    const inicio = new Date(i.fechaActividad + 'T' + i.horaInicio);
    return inicio > new Date();
  }

  confirmarCancelacion(i: InscripcionResponse): void {
    this.confirmandoId = i.idInscripcion;
  }

  cancelarConfirmacion(): void {
    this.confirmandoId = null;
  }

  ejecutarCancelacion(i: InscripcionResponse): void {
    const usuario = this.sesion.usuario()!;
    this.procesandoId = i.idInscripcion;
    this.inscripcionService.cancelar(i.idActividad, {
      idActor: usuario.id,
      tipoUsuario: usuario.tipo
    }).subscribe({
      next: () => {
        this.inscripciones = this.inscripciones.filter(
          x => x.idInscripcion !== i.idInscripcion
        );
        this.procesandoId  = null;
        this.confirmandoId = null;
      },
      error: err => {
        this.procesandoId  = null;
        this.confirmandoId = null;
        this.error = err.mensajeAmigable ?? 'No se pudo cancelar la inscripcion.';
      }
    });
  }

  formatFecha(f: string): string {
    if (!f) return '';
    const d = new Date(f + 'T00:00:00');
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  formatHora(h: string): string {
    return h ? h.substring(0, 5) : '';
  }

  getColorCategoria(cat: string): string {
    const map: Record<string, string> = {
      'Tecnología': 'linear-gradient(135deg,#a8d5cc,#71B6A7)',
      'Académica':  'linear-gradient(135deg,#c8e6e2,#a8d5cc)',
      'Cultural':   'linear-gradient(135deg,#f0e6d3,#e8c99e)',
      'Deportiva':  'linear-gradient(135deg,#d4e6d3,#a8cca5)',
    };
    return map[cat] ?? 'linear-gradient(135deg,#a8d5cc,#71B6A7)';
  }

  getIconoCategoria(cat: string): string {
    const map: Record<string, string> = {
      'Tecnología': 'computer',
      'Académica':  'school',
      'Cultural':   'palette',
      'Deportiva':  'sports_soccer',
    };
    return map[cat] ?? 'event';
  }
}