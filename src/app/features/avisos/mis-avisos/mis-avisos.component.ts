import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { AvisoService } from '../../../core/services/aviso.service';
import { Aviso } from '../../../core/models/aviso.model';

@Component({
  selector: 'app-mis-avisos',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './mis-avisos.component.html',
  styleUrl: './mis-avisos.component.css'
})
export class MisAvisosComponent implements OnInit {

  private avisoSrv = inject(AvisoService);
  private router   = inject(Router);

  // TODO: reemplazar con id del profesor autenticado
  readonly idProfesor = 3;

  avisos: Aviso[] = [];
  cargando = true;
  error = '';
  busqueda = '';

  // Confirmacion de retiro (soft delete) inline por aviso
  confirmandoId: number | null = null;
  procesandoId: number | null = null;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.avisoSrv.misAvisos(this.idProfesor).subscribe({
      next: data => { this.avisos = data; this.cargando = false; },
      error: err => {
        this.error = err.mensajeAmigable ?? 'No se pudieron cargar tus avisos.';
        this.cargando = false;
      }
    });
  }

  // Filtro en memoria por titulo
  get avisosFiltrados(): Aviso[] {
    const q = this.busqueda.trim().toLowerCase();
    return q ? this.avisos.filter(a => a.titulo.toLowerCase().includes(q)) : this.avisos;
  }

  // ── Acciones ─────────────────────────────────────────
  nuevoAviso(): void {
    this.router.navigate(['/avisos/registrar']);
  }

  editar(aviso: Aviso): void {
    this.router.navigate(['/avisos/editar', aviso.idAviso]);
  }

  // Retiro con confirmacion inline (mismo patron sobrio del proyecto)
  confirmarRetiro(aviso: Aviso): void { this.confirmandoId = aviso.idAviso; }
  cancelarRetiro(): void { this.confirmandoId = null; }

  ejecutarRetiro(aviso: Aviso): void {
    this.procesandoId = aviso.idAviso;
    this.avisoSrv.desactivar(aviso.idAviso, this.idProfesor).subscribe({
      next: () => {
        this.avisos = this.avisos.filter(a => a.idAviso !== aviso.idAviso);
        this.procesandoId = null;
        this.confirmandoId = null;
      },
      error: err => {
        this.procesandoId = null;
        this.confirmandoId = null;
        this.error = err.mensajeAmigable ?? 'No se pudo retirar el aviso.';
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────
  formatFecha(f: string): string {
    if (!f) return '';
    const d = new Date(f + 'T00:00:00');
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }
  formatHora(h?: string | null): string {
    return h ? h.substring(0, 5) : '';
  }
}
