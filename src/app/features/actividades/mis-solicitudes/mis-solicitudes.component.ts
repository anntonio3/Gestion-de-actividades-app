import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActualizarActividadRequest, SolicitudActividad } from '../../../core/models/actividad.model';
import { ActividadService } from '../../../core/services/actividad.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { SesionService } from '../../../core/services/sesion.service';
import { InscripcionService } from '../../../core/services/inscripcion.service';
import { ModalInscritosComponent } from './modal-inscritos/modal-inscritos.component';
import { ModalRecordatorioComponent } from './modal-recordatorio/modal-recordatorio.component';



type FiltroEstado = '' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

@Component({
  selector: 'app-mis-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, ModalInscritosComponent, ModalRecordatorioComponent],
  templateUrl: './mis-solicitudes.component.html',
  styleUrls: ['./mis-solicitudes.component.css']
})
export class MisSolicitudesComponent implements OnInit {

  todas: SolicitudActividad[] = [];
  cargando = true;
  error = '';

  filtroActivo: FiltroEstado = '';
  busqueda = '';
  detalle: SolicitudActividad | null = null;

  // Paginación
  readonly PAGE_SIZE = 10;
  paginaActual = 1;

  // Modal de edición
  modoEdicion = false;
  guardando = false;
  errorEdicion = '';
  exitoEdicion = false;

  // Imagen en edición (solo una)
  nuevasImagenes: File[] = [];
  previasImagenes: string[] = [];
  imagenActual: string | null = null;      // URL de imagen existente
  nuevaImagenPrevia: string | null = null; // preview de imagen nueva seleccionada
  imagenActualEliminada = false;           // flag para saber si se quitó la actual

  // Vista de imagen ampliada
  imagenAmpliada: string | null = null;

  formEdicion: ActualizarActividadRequest = {
    nombre: '',
    descripcion: '',
    fechaActividad: '',
    horaInicio: '',
    horaFin: ''
  };

  protected readonly sesion = inject(SesionService);

  private inscripcionService = inject(InscripcionService);
  totalInscritos: Record<number, number> = {};

   // US-pdf: modal de lista de inscritos
  modalInscritosAbierto = false;
  actividadParaInscritos: SolicitudActividad | null = null;

  abrirModalInscritos(actividad: SolicitudActividad, evento: Event): void {
    evento.stopPropagation();
    this.actividadParaInscritos = actividad;
    this.modalInscritosAbierto = true;
  }

  cerrarModalInscritos(): void {
    this.modalInscritosAbierto = false;
    this.actividadParaInscritos = null;
  }

   // US-07: modal de recordatorio
  modalRecordatorioAbierto = false;
  actividadParaRecordatorio: SolicitudActividad | null = null;

  abrirModalRecordatorio(actividad: SolicitudActividad, evento: Event): void {
    evento.stopPropagation();
    this.actividadParaRecordatorio = actividad;
    this.modalRecordatorioAbierto  = true;
  }

  cerrarModalRecordatorio(): void {
    this.modalRecordatorioAbierto  = false;
    this.actividadParaRecordatorio = null;
  }


  constructor(private actividadService: ActividadService) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.cargando = true;
    this.actividadService.getMisSolicitudes(this.sesion.getIdProfesor()).subscribe({
      next: data => { 
        this.todas = data; 
        this.cargando = false; 
        this.cargarTotalesInscritos();
      },
      error: () => { 
        this.error = 'Error al cargar las solicitudes. Intenta de nuevo.'; 
        this.cargando = false; 
      }
    });
  }

  // ── Contadores ──
  get pendientes() { return this.todas.filter(s => s.estado === 'PENDIENTE'); }
  get aprobadas()  { return this.todas.filter(s => s.estado === 'APROBADA'); }
  get rechazadas() { return this.todas.filter(s => s.estado === 'RECHAZADA'); }

  // ── Lista filtrada ──
  get listaFiltrada(): SolicitudActividad[] {
    let base = this.filtroActivo
      ? this.todas.filter(s => s.estado === this.filtroActivo)
      : this.todas;
    const q = this.busqueda.trim().toLowerCase();
    return q ? base.filter(s => s.nombre.toLowerCase().includes(q)) : base;
  }

  // ── Paginación ──
  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.listaFiltrada.length / this.PAGE_SIZE));
  }

  get listaActiva(): SolicitudActividad[] {
    const inicio = (this.paginaActual - 1) * this.PAGE_SIZE;
    return this.listaFiltrada.slice(inicio, inicio + this.PAGE_SIZE);
  }

  get rangoInicio(): number {
    return this.listaFiltrada.length === 0 ? 0 : (this.paginaActual - 1) * this.PAGE_SIZE + 1;
  }

  get rangoFin(): number {
    return Math.min(this.paginaActual * this.PAGE_SIZE, this.listaFiltrada.length);
  }

  /** Páginas visibles con ellipsis representado como -1 */
  get paginasVisibles(): number[] {
    const total = this.totalPaginas;
    const cur = this.paginaActual;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: number[] = [1];
    if (cur > 3) pages.push(-1);
    for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) {
      pages.push(p);
    }
    if (cur < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  irPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas) {
      this.paginaActual = p;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  cambiarFiltro(f: FiltroEstado): void {
    this.filtroActivo = f;
    this.busqueda = '';
    this.paginaActual = 1;
  }

  onBusqueda(): void {
    this.paginaActual = 1;
  }

  // ── Modal detalle ──
  abrirDetalle(s: SolicitudActividad): void {
    this.detalle = s;
    this.modoEdicion = false;
    this.errorEdicion = '';
    this.exitoEdicion = false;
    this.nuevasImagenes = [];
    this.previasImagenes = [];
  }

  cerrarDetalle(e?: MouseEvent): void {
    if (!e || (e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.detalle = null;
      this.modoEdicion = false;
      this.imagenAmpliada = null;
    }
  }

  abrirEdicion(): void {
    if (!this.detalle) return;
    this.formEdicion = {
      nombre: this.detalle.nombre,
      descripcion: this.detalle.descripcion ?? '',
      fechaActividad: this.detalle.fechaActividad,
      horaInicio: this.detalle.horaInicio,
      horaFin: this.detalle.horaFin
    };
    this.nuevasImagenes = [];
    this.previasImagenes = [];
    this.nuevaImagenPrevia = null;
    this.imagenActualEliminada = false;
    this.imagenActual = this.getPortada(this.detalle!);
    this.errorEdicion = '';
    this.exitoEdicion = false;
    this.modoEdicion = true;
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.errorEdicion = '';
    this.nuevasImagenes = [];
    this.previasImagenes = [];
    this.nuevaImagenPrevia = null;
    this.imagenActual = null;
    this.imagenActualEliminada = false;
  }

  // ── Imágenes ──
  onImagenesSeleccionadas(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const tiposValidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposValidos.includes(file.type)) { this.errorEdicion = 'Solo se permiten imágenes JPG, PNG o WEBP.'; return; }
    if (file.size > 5 * 1024 * 1024) { this.errorEdicion = 'La imagen no puede superar 5 MB.'; return; }
    this.nuevasImagenes = [file];
    this.errorEdicion = '';
    const reader = new FileReader();
    reader.onload = e => { this.nuevaImagenPrevia = e.target?.result as string; };
    reader.readAsDataURL(file);
    // Reset input para permitir reseleccionar el mismo archivo
    (event.target as HTMLInputElement).value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const tiposValidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposValidos.includes(file.type)) { this.errorEdicion = 'Solo se permiten imágenes JPG, PNG o WEBP.'; return; }
    if (file.size > 5 * 1024 * 1024) { this.errorEdicion = 'La imagen no puede superar 5 MB.'; return; }
    this.nuevasImagenes = [file];
    this.errorEdicion = '';
    const reader = new FileReader();
    reader.onload = e => { this.nuevaImagenPrevia = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  quitarNuevaImagen(i: number): void {
    this.nuevasImagenes = [];
    this.previasImagenes = [];
    this.nuevaImagenPrevia = null;
  }

  quitarImagenActual(): void {
    this.imagenActual = null;
    this.imagenActualEliminada = true;
  }

  verImagen(url: string): void { this.imagenAmpliada = url; }
  cerrarImagenAmpliada(): void { this.imagenAmpliada = null; }

  // ── Guardar edición ──
  guardarEdicion(): void {
    if (!this.detalle) return;
    if (!this.formEdicion.nombre.trim()) { this.errorEdicion = 'El nombre es obligatorio.'; return; }
    if (!this.formEdicion.fechaActividad || !this.formEdicion.horaInicio || !this.formEdicion.horaFin) {
      this.errorEdicion = 'La fecha y horario son obligatorios.'; return;
    }
    if (this.formEdicion.horaFin <= this.formEdicion.horaInicio) {
      this.errorEdicion = 'La hora de fin debe ser posterior a la hora de inicio.'; return;
    }

    this.guardando = true;
    this.errorEdicion = '';

    this.actividadService.editarActividad(this.detalle.idActividad, this.sesion.getIdProfesor(), this.formEdicion).subscribe({
      next: (actualizada) => {
        const idActividad = actualizada.idActividad;
        const idProfesor  = this.sesion.getIdProfesor();

        const finalizarGuardado = (final: SolicitudActividad) => {
          const idx = this.todas.findIndex(a => a.idActividad === final.idActividad);
          if (idx !== -1) this.todas[idx] = { ...this.todas[idx], ...final };
          this.detalle = this.todas[idx] ?? final;
          this.guardando = false;
          this.modoEdicion = false;
          this.exitoEdicion = true;
          this.nuevasImagenes = [];
          this.previasImagenes = [];
          this.nuevaImagenPrevia = null;
          this.imagenActual = this.getPortada(this.detalle);
          this.imagenActualEliminada = false;
          setTimeout(() => this.exitoEdicion = false, 3000);
        };

        const manejarError = (err: any) => {
          this.guardando = false;
          this.errorEdicion = 'Los datos se guardaron pero hubo un error al procesar la imagen.';
        };

        // Caso 1: hay nueva imagen → reemplazar
        if (this.nuevasImagenes.length > 0) {
          this.actividadService.reemplazarImagen(idActividad, idProfesor, this.nuevasImagenes[0])
            .subscribe({ next: finalizarGuardado, error: manejarError });

        // Caso 2: se quitó la imagen actual sin poner otra → eliminar
        } else if (this.imagenActualEliminada) {
          this.actividadService.eliminarImagen(idActividad, idProfesor)
            .subscribe({ next: finalizarGuardado, error: manejarError });

        // Caso 3: sin cambios en imagen
        } else {
          finalizarGuardado(actualizada);
        }
      },
      error: (err) => {
        this.guardando = false;
        if (err.status === 409) this.errorEdicion = 'Esta actividad ya no está en estado PENDIENTE y no puede editarse.';
        else if (err.status === 403) this.errorEdicion = 'No tienes permiso para editar esta actividad.';
        else if (err.status === 404) this.errorEdicion = 'La actividad no fue encontrada.';
        else this.errorEdicion = 'Error al guardar. Intenta de nuevo.';
      }
    });
  }

  // ── Helpers ──
  estadoLabel(estado: string): string {
    return { APROBADA: 'APROBADA', RECHAZADA: 'RECHAZADA', PENDIENTE: 'PENDIENTE' }[estado] ?? estado;
  }

  estadoClass(estado: string): string {
    return { APROBADA: 'aprobada', RECHAZADA: 'rechazada', PENDIENTE: 'pendiente' }[estado] ?? '';
  }

  private cargarTotalesInscritos(): void {
    this.aprobadas
      .filter(s => s.requiereInscripcion)
      .forEach(s => {
        this.inscripcionService.totalInscritos(s.idActividad).subscribe({
          next: res => this.totalInscritos[s.idActividad] = res.total,
          error: () => {}
        });
      });
  }


  formatBytes(b: number): string {
    return b < 1024 * 1024 ? (b / 1024).toFixed(1) + ' KB' : (b / 1024 / 1024).toFixed(1) + ' MB';
  }

  getPortada(s: SolicitudActividad): string | null {
    if (!s.imagenes || s.imagenes.length === 0) return null;
    const portada = s.imagenes.find(img => img.esPortada);
    return portada ? portada.url : (s.imagenes[0]?.url ?? null);
  }
}