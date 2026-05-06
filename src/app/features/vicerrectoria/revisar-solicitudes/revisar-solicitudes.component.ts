import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { VicerrectoriaService } from '../../../core/services/vicerrectoria.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { SesionService } from '../../../core/services/sesion.service';
import {
  SolicitudListItem, SolicitudDetalle,
  EstadoSolicitud, FiltrosSolicitudes
} from '../../../core/models/vicerrectoria.model';
import { Categoria, Carrera, Departamento } from '../../../core/models/catalogo.model';

type FiltroEstado = 'TODOS' | EstadoSolicitud;
type Decision = 'APROBADA' | 'RECHAZADA';

@Component({
  selector: 'app-revisar-solicitudes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './revisar-solicitudes.component.html',
  styleUrl: './revisar-solicitudes.component.css'
})
export class RevisarSolicitudesComponent implements OnInit {

  private readonly vicerrectoriaService = inject(VicerrectoriaService);
  private readonly catalogoService = inject(CatalogoService);
  readonly sesion = inject(SesionService);

  // Catalogos para filtros
  categorias: Categoria[] = [];
  carreras: Carrera[] = [];
  departamentos: Departamento[] = [];

  // Datos
  solicitudes: SolicitudListItem[] = [];
  cargando = true;
  error = '';

  // Filtros
  filtroEstado: FiltroEstado = 'TODOS';
  filtroCategoria: number | null = null;
  filtroCarrera: number | null = null;
  filtroDepartamento: number | null = null;
  busquedaCtrl = new FormControl<string>('', { nonNullable: true });

  // Paginacion
  readonly itemsPorPagina = 10;
  paginaActual = 1;

  // Modal de detalle
  detalle: SolicitudDetalle | null = null;
  cargandoDetalle = false;
  errorDetalle = '';

  // Modal de confirmacion
  decisionPendiente: Decision | null = null;
  motivoCtrl = new FormControl<string>('', { nonNullable: true });
  procesando = false;
  errorDecision = '';

  // Toast
  toastMensaje = '';
  toastTipo: 'exito' | 'error' = 'exito';
  toastVisible = false;

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarSolicitudes();

    this.busquedaCtrl.valueChanges
      .pipe(debounceTime(300))
      .subscribe(() => {
        this.paginaActual = 1;
        this.cargarSolicitudes();
      });
  }

  // ====================================================================
  // Catalogos
  // ====================================================================
  private cargarCatalogos(): void {
    this.catalogoService.getCategorias().subscribe({ next: c => this.categorias = c });
    this.catalogoService.getCarreras().subscribe({ next: c => this.carreras = c });
    this.catalogoService.getDepartamentos().subscribe({ next: d => this.departamentos = d });
  }

  // ====================================================================
  // Listado (US-07)
  // ====================================================================
  cargarSolicitudes(): void {
    this.cargando = true;
    this.error = '';

    const filtros: FiltrosSolicitudes = {
      estado: this.filtroEstado,
      idCategoria: this.filtroCategoria ?? undefined,
      idCarrera: this.filtroCarrera ?? undefined,
      idDepartamento: this.filtroDepartamento ?? undefined,
      q: this.busquedaCtrl.value
    };

    this.vicerrectoriaService.listar(filtros).subscribe({
      next: data => {
        this.solicitudes = data;
        this.cargando = false;
        // Si la pagina actual quedo fuera de rango, ajustar
        if (this.paginaActual > this.totalPaginas) {
          this.paginaActual = Math.max(1, this.totalPaginas);
        }
      },
      error: () => {
        this.error = 'Error al cargar las solicitudes. Intenta de nuevo.';
        this.cargando = false;
      }
    });
  }

  setEstado(estado: FiltroEstado): void {
    this.filtroEstado = estado;
    this.paginaActual = 1;
    this.cargarSolicitudes();
  }

  setCategoria(id: number | null): void {
    this.filtroCategoria = id;
    this.paginaActual = 1;
    this.cargarSolicitudes();
  }

  setCarrera(id: number | null): void {
    this.filtroCarrera = id;
    this.paginaActual = 1;
    this.cargarSolicitudes();
  }

  // Handlers para los <select> nativos
  onEstadoChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as FiltroEstado;
    this.setEstado(value);
  }

  onCategoriaChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.setCategoria(value ? +value : null);
  }

  onCarreraChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.setCarrera(value ? +value : null);
  }

  // Estadisticas en el header
  get statTotal(): number { return this.solicitudes.length; }
  get statPendientes(): number {
    return this.solicitudes.filter(s => s.estado === 'PENDIENTE').length;
  }
  get statAprobadas(): number {
    return this.solicitudes.filter(s => s.estado === 'APROBADA').length;
  }
  get statRechazadas(): number {
    return this.solicitudes.filter(s => s.estado === 'RECHAZADA').length;
  }

  // ====================================================================
  // Paginacion
  // ====================================================================
  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.solicitudes.length / this.itemsPorPagina));
  }

  get solicitudesPagina(): SolicitudListItem[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.solicitudes.slice(inicio, inicio + this.itemsPorPagina);
  }

  // Genera la lista de paginas a mostrar.
  // Estrategia: siempre la 1 y la ultima, mas 1 vecino a cada lado de la actual.
  // Inserta '...' donde haya saltos.
  get paginasVisibles(): (number | '...')[] {
    const total = this.totalPaginas;
    const actual = this.paginaActual;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const paginas: (number | '...')[] = [1];
    const inicio = Math.max(2, actual - 1);
    const fin = Math.min(total - 1, actual + 1);
    if (inicio > 2) paginas.push('...');
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    if (fin < total - 1) paginas.push('...');
    paginas.push(total);
    return paginas;
  }

  irPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas || p === this.paginaActual) return;
    this.paginaActual = p;
  }

  paginaAnterior(): void { this.irPagina(this.paginaActual - 1); }
  paginaSiguiente(): void { this.irPagina(this.paginaActual + 1); }

  get rangoInicio(): number {
    return this.solicitudes.length === 0
      ? 0
      : (this.paginaActual - 1) * this.itemsPorPagina + 1;
  }
  get rangoFin(): number {
    return Math.min(this.paginaActual * this.itemsPorPagina, this.solicitudes.length);
  }

  // ====================================================================
  // Detalle (US-10)
  // ====================================================================
  abrirDetalle(solicitud: SolicitudListItem): void {
    this.cargandoDetalle = true;
    this.errorDetalle = '';
    this.detalle = null;
    this.decisionPendiente = null;
    this.motivoCtrl.setValue('');
    this.errorDecision = '';

    this.vicerrectoriaService.obtenerDetalle(solicitud.idActividad).subscribe({
      next: d => {
        this.detalle = d;
        this.cargandoDetalle = false;
      },
      error: () => {
        this.errorDetalle = 'No se pudo cargar el detalle.';
        this.cargandoDetalle = false;
      }
    });
  }

  cerrarDetalle(event?: MouseEvent): void {
    if (event && !(event.target as HTMLElement).classList.contains('modal-overlay')) {
      return;
    }
    this.detalle = null;
    this.decisionPendiente = null;
    this.errorDecision = '';
    this.motivoCtrl.setValue('');
  }

  // ====================================================================
  // Decision (US-08 / US-09)
  // ====================================================================
  prepararDecision(decision: Decision): void {
    this.decisionPendiente = decision;
    this.errorDecision = '';
    this.motivoCtrl.setValue('');
  }

  cancelarDecision(): void {
    this.decisionPendiente = null;
    this.errorDecision = '';
    this.motivoCtrl.setValue('');
  }

  confirmarDecision(): void {
    if (!this.detalle || !this.decisionPendiente) return;

    const motivo = this.motivoCtrl.value.trim();

    if (this.decisionPendiente === 'RECHAZADA' && motivo.length < 5) {
      this.errorDecision = 'El motivo de rechazo es obligatorio (minimo 5 caracteres).';
      return;
    }

    this.procesando = true;
    this.errorDecision = '';
    const idAdmin = this.sesion.getIdAdmin();
    const idActividad = this.detalle.idActividad;

    const obs = this.decisionPendiente === 'APROBADA'
      ? this.vicerrectoriaService.aprobar(idActividad, {
          idAdmin,
          comentario: motivo || undefined
        })
      : this.vicerrectoriaService.rechazar(idActividad, {
          idAdmin,
          motivo
        });

    obs.subscribe({
      next: res => {
        this.procesando = false;
        const idx = this.solicitudes.findIndex(s => s.idActividad === idActividad);
        if (idx !== -1) {
          this.solicitudes[idx] = { ...this.solicitudes[idx], estado: res.estado };
        }
        const verbo = res.estado === 'APROBADA' ? 'aprobada' : 'rechazada';
        this.mostrarToast(`Solicitud ${verbo} correctamente.`, 'exito');
        this.detalle = null;
        this.decisionPendiente = null;
      },
      error: err => {
        this.procesando = false;
        if (err.status === 409) {
          this.errorDecision = err.error?.mensaje
            ?? 'Esta actividad fue modificada por otro usuario. Recarga e intenta de nuevo.';
        } else if (err.status === 404) {
          this.errorDecision = 'La actividad ya no existe.';
        } else if (err.status === 400) {
          this.errorDecision = err.error?.mensaje ?? 'No se pudo completar la operacion.';
        } else {
          this.errorDecision = 'Error inesperado. Intenta de nuevo.';
        }
      }
    });
  }

  // ====================================================================
  // Helpers UI
  // ====================================================================
  estadoLabel(estado: EstadoSolicitud): string {
    return { PENDIENTE: 'Pendiente', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada' }[estado];
  }

  estadoClase(estado: EstadoSolicitud): string {
    return { PENDIENTE: 'pendiente', APROBADA: 'aprobado', RECHAZADA: 'rechazado' }[estado];
  }

  iconoCategoria(categoria: string | null | undefined): string {
    const map: Record<string, string> = {
      'Tecnologia': 'computer',
      'Tecnología': 'computer',
      'Academica': 'school',
      'Académica': 'school',
      'Cultural': 'palette',
      'Deportiva': 'sports_soccer',
      'Ciencia': 'science',
      'Salud': 'local_hospital'
    };
    return map[categoria ?? ''] ?? 'event';
  }

  iconoRecurso(tipo: string): string {
    return { ESPACIO: 'meeting_room', MOBILIARIO: 'chair', PERSONAL: 'person' }[tipo] ?? 'inventory_2';
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

  private mostrarToast(mensaje: string, tipo: 'exito' | 'error'): void {
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 3000);
  }
}
