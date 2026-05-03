import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActividadService } from '../../../core/services/actividad.service';
import { ActualizarActividadRequest, SolicitudActividad } from '../../../shared/models/actividad.model';

type TabId = 'aprobadas' | 'rechazadas' | 'pendientes';

@Component({
  selector: 'app-mis-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-solicitudes.component.html',
  styleUrls: ['./mis-solicitudes.component.css']
})
export class MisSolicitudesComponent implements OnInit {

  // TODO: reemplazar con id del profesor autenticado
  readonly idProfesor = 3;

  todas: SolicitudActividad[] = [];
  cargando = true;
  error = '';

  tabActiva: TabId = 'aprobadas';
  busqueda = '';
  detalle: SolicitudActividad | null = null;

  // --- US-05: estado del modal de edición ---
  modoEdicion = false;
  guardando = false;
  errorEdicion = '';
  exitoEdicion = false;

  formEdicion: ActualizarActividadRequest = {
    nombre: '',
    descripcion: '',
    fechaActividad: '',
    horaInicio: '',
    horaFin: ''
  };

  constructor(private actividadService: ActividadService) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.cargando = true;
    this.actividadService.getMisSolicitudes(this.idProfesor).subscribe({
      next: data => { this.todas = data; this.cargando = false; },
      error: () => { this.error = 'Error al cargar las solicitudes. Intenta de nuevo.'; this.cargando = false; }
    });
  }

  get aprobadas() { return this.todas.filter(s => s.estado === 'APROBADA'); }
  get rechazadas() { return this.todas.filter(s => s.estado === 'RECHAZADA'); }
  get pendientes() { return this.todas.filter(s => s.estado === 'PENDIENTE'); }

  get listaActiva(): SolicitudActividad[] {
    const base =
      this.tabActiva === 'aprobadas' ? this.aprobadas :
      this.tabActiva === 'rechazadas' ? this.rechazadas :
      this.pendientes;
    const q = this.busqueda.trim().toLowerCase();
    return q ? base.filter(s => s.nombre.toLowerCase().includes(q)) : base;
  }

  cambiarTab(tab: TabId): void {
    this.tabActiva = tab;
    this.busqueda = '';
  }

  abrirDetalle(s: SolicitudActividad): void {
    this.detalle = s;
    this.modoEdicion = false;
    this.errorEdicion = '';
    this.exitoEdicion = false;
  }

  cerrarDetalle(e?: MouseEvent): void {
    if (!e || (e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.detalle = null;
      this.modoEdicion = false;
    }
  }

  // US-05: Abrir formulario de edición precargado con los datos actuales
  abrirEdicion(): void {
    if (!this.detalle) return;
    this.formEdicion = {
      nombre: this.detalle.nombre,
      descripcion: this.detalle.descripcion ?? '',
      fechaActividad: this.detalle.fechaActividad,
      horaInicio: this.detalle.horaInicio,
      horaFin: this.detalle.horaFin
    };
    this.errorEdicion = '';
    this.exitoEdicion = false;
    this.modoEdicion = true;
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.errorEdicion = '';
  }

  // US-05: Guardar cambios
  guardarEdicion(): void {
    if (!this.detalle) return;

    if (!this.formEdicion.nombre.trim()) {
      this.errorEdicion = 'El nombre es obligatorio.';
      return;
    }
    if (!this.formEdicion.fechaActividad || !this.formEdicion.horaInicio || !this.formEdicion.horaFin) {
      this.errorEdicion = 'La fecha y horario son obligatorios.';
      return;
    }
    if (this.formEdicion.horaFin <= this.formEdicion.horaInicio) {
      this.errorEdicion = 'La hora de fin debe ser posterior a la hora de inicio.';
      return;
    }

    this.guardando = true;
    this.errorEdicion = '';

    this.actividadService.editarActividad(this.detalle.idActividad, this.idProfesor, this.formEdicion).subscribe({
      next: (actualizada) => {
        // Actualizar en la lista local sin recargar todo
        const idx = this.todas.findIndex(a => a.idActividad === actualizada.idActividad);
        if (idx !== -1) {
          this.todas[idx] = { ...this.todas[idx], ...actualizada };
        }
        this.detalle = this.todas[idx];
        this.guardando = false;
        this.modoEdicion = false;
        this.exitoEdicion = true;

        // Ocultar el mensaje de éxito después de 3 segundos
        setTimeout(() => this.exitoEdicion = false, 3000);
      },
      error: (err) => {
        this.guardando = false;
        if (err.status === 409) {
          this.errorEdicion = 'Esta actividad ya no está en estado PENDIENTE y no puede editarse.';
        } else if (err.status === 403) {
          this.errorEdicion = 'No tienes permiso para editar esta actividad.';
        } else if (err.status === 404) {
          this.errorEdicion = 'La actividad no fue encontrada.';
        } else {
          this.errorEdicion = 'Error al guardar. Intenta de nuevo.';
        }
      }
    });
  }

  estadoLabel(estado: string): string {
    return { APROBADA: '✅ Aprobado', RECHAZADA: '❌ Rechazado', PENDIENTE: '⏳ En revisión' }[estado] ?? estado;
  }

  estadoClass(estado: string): string {
    return { APROBADA: 'aprobada', RECHAZADA: 'rechazada', PENDIENTE: 'pendiente' }[estado] ?? '';
  }
}