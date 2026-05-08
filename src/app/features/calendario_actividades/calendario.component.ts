import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActividadPublica, CATEGORIA_COLOR, CATEGORIA_EMOJI } from '../../core/models/actividad.model';
import { ActividadService } from '../../core/services/calendario-actividades.service';
import { Categoria } from '../../core/models/catalogo.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ModalDetalleEventoComponent } from './modal-detalle-evento/modal-detalle-evento.component';
import { AsistenciaService } from '../../core/services/asistencia.service';
import { AsistenciaEstado, RespuestaAsistencia } from '../../core/models/asistencia.model';

interface DayPill {
  date: Date;
  dayName: string;
  dayNum: number;
  key: string;
  isToday: boolean;
  isSelected: boolean;
  eventos: string[];
}

interface MiniCalDay {
  date: Date;
  num: number;
  key: string;
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
  hasEvent: boolean;
  otherMonth: boolean;
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, ModalDetalleEventoComponent],
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.css'],
  providers: [DatePipe]
})
export class CalendarioComponent implements OnInit {

  // ... [TODAS las propiedades que ya tenías permanecen igual] ...

  actividades: ActividadPublica[]  = [];
  categorias:  Categoria[]  = [];
  loading = true;
  error   = false;

  searchQuery          = '';
  categoriaSeleccionada?: number;
  categoriaSelNombre   = 'Todos';

  stripOffset  = -1;
  STRIP_VISIBLE = 11;
  pills: DayPill[] = [];

  todayRef     = this.makeToday();
  selectedDate = this.makeToday();

  miniCalOpen  = false;
  miniCalYear  = 0;
  miniCalMonth = 0;
  miniCalDays: MiniCalDay[] = [];
  readonly DAYS_HEADER = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];
  readonly MONTHS_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                          'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  readonly DAYS_SHORT  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

  eventsPage      = 0;
  EVENTS_PER_PAGE = 8;
  filteredEvents: ActividadPublica[] = [];
  totalPages      = 0;

  paginas: ActividadPublica[][] = [];
  paginaFuturosInicio = 0;

  catEmoji  = CATEGORIA_EMOJI;
  catColor  = CATEGORIA_COLOR;

  // ─── NUEVO: Modal de detalle ───────────────────────────
  modalDetalleAbierto = false;
  idActividadDetalle: number | null = null;

  // Mapa idActividad -> estado de asistencia
  asistencias: Record<number, AsistenciaEstado> = {};

  // Para deshabilitar botones mientras se procesa una respuesta
  respondiendoIds = new Set<number>();

  constructor(
    private actividadService: ActividadService,
    private asistenciaService: AsistenciaService,   // <- AÑADIR
    private elRef: ElementRef
  ) {}

  // ... [TODOS los métodos existentes permanecen igual] ...

  ngOnInit(): void {
    this.miniCalYear  = this.todayRef.getFullYear();
    this.miniCalMonth = this.todayRef.getMonth();

    this.actividadService.getCategorias().subscribe({
      next: cats => this.categorias = cats,
      error: () => {}
    });

    this.loadActividades();
  }

  loadActividades(): void {
    this.loading = true;
    this.error   = false;
    this.actividadService.getActividadesPublicas(this.categoriaSeleccionada).subscribe({
      next: data => {
        this.actividades = data;
        this.loading     = false;
        this.applyFilter();
        this.buildStrip();
      },
      error: () => {
        this.loading = false;
        this.error   = true;
      }
    });
  }

  selectCategoria(cat?: Categoria): void {
    this.categoriaSeleccionada = cat?.idCategoria;
    this.categoriaSelNombre    = cat?.nombre ?? 'Todos';
    this.loadActividades();
  }

  onSearch(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase();
    const filtrados = this.actividades.filter(ev => {
      return !q
        || ev.nombre.toLowerCase().includes(q)
        || ev.descripcion.toLowerCase().includes(q);
    });

    filtrados.sort((a, b) => {
      const da = new Date(a.fechaActividad + 'T00:00:00').getTime();
      const db = new Date(b.fechaActividad + 'T00:00:00').getTime();
      if (da !== db) return da - db;
      return a.horaInicio.localeCompare(b.horaInicio);
    });

    this.filteredEvents = filtrados;
    this.calcularPaginas();
  }

  private calcularPaginas(): void {
    const refKey = this.dateKey(this.selectedDate);

    const pasados = this.filteredEvents.filter(ev =>
      this.dateKey(new Date(ev.fechaActividad + 'T00:00:00')) < refKey
    );
    const futuros = this.filteredEvents.filter(ev =>
      this.dateKey(new Date(ev.fechaActividad + 'T00:00:00')) >= refKey
    );

    this.paginas = [];
    for (let i = 0; i < pasados.length; i += this.EVENTS_PER_PAGE) {
      this.paginas.push(pasados.slice(i, i + this.EVENTS_PER_PAGE));
    }
    this.paginaFuturosInicio = this.paginas.length;

    for (let i = 0; i < futuros.length; i += this.EVENTS_PER_PAGE) {
      this.paginas.push(futuros.slice(i, i + this.EVENTS_PER_PAGE));
    }

    this.totalPages = this.paginas.length;
    this.eventsPage = futuros.length > 0
      ? this.paginaFuturosInicio
      : Math.max(0, this.totalPages - 1);

    this.cargarAsistenciasPagina();
  }

  get pagedEvents(): ActividadPublica[] {
    return this.paginas[this.eventsPage] ?? [];
  }

  shiftEvents(dir: number): void {
    const next = this.eventsPage + dir;
    if (next >= 0 && next < this.totalPages) {
      this.eventsPage = next;
      this.cargarAsistenciasPagina();
    }
  }

  isPast(ev: ActividadPublica): boolean {
    const finEvento = new Date(ev.fechaActividad + 'T' + ev.horaFin);
    return finEvento < new Date();
  }

  occupancyClass(ev: ActividadPublica): string {
    return 'dot-green';
  }

  getEmoji(categoria: string): string {
    return this.catEmoji[categoria] ?? '📌';
  }

  getColor(categoria: string): string {
    return this.catColor[categoria] ?? 'linear-gradient(135deg,#a8d5cc,#71B6A7)';
  }

  formatHora(h: string): string {
    return h ? h.substring(0, 5) : '';
  }

  formatFecha(f: string): string {
    if (!f) return '';
    const d = new Date(f + 'T00:00:00');
    const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
  }

  buildStrip(): void {
    const eventMap = this.buildEventMap();
    this.pills = [];

    for (let i = this.stripOffset; i < this.stripOffset + this.STRIP_VISIBLE; i++) {
      const d = new Date(this.todayRef);
      d.setDate(this.todayRef.getDate() + i);
      const key = this.dateKey(d);
      this.pills.push({
        date:       d,
        dayName:    this.DAYS_SHORT[d.getDay()],
        dayNum:     d.getDate(),
        key,
        isToday:    key === this.dateKey(this.todayRef),
        isSelected: key === this.dateKey(this.selectedDate),
        eventos:    eventMap[key] ?? []
      });
    }
  }

  shiftStrip(dir: number): void {
    this.stripOffset += dir * 3;
    this.buildStrip();
  }

  selectDay(pill: DayPill): void {
    this.selectedDate = new Date(pill.date);
    this.selectedDate.setHours(0, 0, 0, 0);

    const offset = Math.round(
      (this.selectedDate.getTime() - this.todayRef.getTime()) / 86400000
    );
    if (offset < this.stripOffset || offset >= this.stripOffset + this.STRIP_VISIBLE) {
      this.stripOffset = offset - 1;
    }

    this.miniCalYear  = this.selectedDate.getFullYear();
    this.miniCalMonth = this.selectedDate.getMonth();

    this.buildStrip();
    this.buildMiniCal();
    this.closeMiniCal();
    this.applyFilter();
  }

  get agendaTitle(): string {
    return `Agenda — ${this.MONTHS_FULL[this.selectedDate.getMonth()]} ${this.selectedDate.getFullYear()}`;
  }

  toggleMiniCal(): void {
    this.miniCalOpen = !this.miniCalOpen;
    if (this.miniCalOpen) {
      this.miniCalYear  = this.selectedDate.getFullYear();
      this.miniCalMonth = this.selectedDate.getMonth();
      this.buildMiniCal();
    }
  }

  closeMiniCal(): void {
    this.miniCalOpen = false;
  }

  shiftMonth(dir: number): void {
    this.miniCalMonth += dir;
    if (this.miniCalMonth > 11) { this.miniCalMonth = 0; this.miniCalYear++; }
    if (this.miniCalMonth < 0)  { this.miniCalMonth = 11; this.miniCalYear--; }
    this.buildMiniCal();
  }

  get miniCalTitle(): string {
    return `${this.MONTHS_FULL[this.miniCalMonth]} ${this.miniCalYear}`;
  }

  buildMiniCal(): void {
    const eventMap   = this.buildEventMap();
    const firstDay   = new Date(this.miniCalYear, this.miniCalMonth, 1).getDay();
    const daysInMonth = new Date(this.miniCalYear, this.miniCalMonth + 1, 0).getDate();
    const todayKey   = this.dateKey(this.todayRef);
    const selKey     = this.dateKey(this.selectedDate);

    this.miniCalDays = [];

    for (let i = 0; i < firstDay; i++) {
      this.miniCalDays.push({
        date: new Date(0), num: 0, key: '', isToday: false,
        isSelected: false, isPast: false, hasEvent: false, otherMonth: true
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(this.miniCalYear, this.miniCalMonth, d);
      const key  = this.dateKey(date);
      this.miniCalDays.push({
        date,
        num:        d,
        key,
        isToday:    key === todayKey,
        isSelected: key === selKey,
        isPast:     date < this.todayRef,
        hasEvent:   !!eventMap[key],
        otherMonth: false
      });
    }
  }

  selectMiniDay(day: MiniCalDay): void {
    if (day.otherMonth || day.num === 0) return;
    this.selectDay({ ...day, dayName: '', dayNum: day.num, eventos: [], isToday: day.isToday, isSelected: false });
  }

  private makeToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private dateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  private buildEventMap(): Record<string, string[]> {
    const map: Record<string, string[]> = {};
    this.actividades.forEach(ev => {
      const d = new Date(ev.fechaActividad + 'T00:00:00');
      const k = this.dateKey(d);
      if (!map[k]) map[k] = [];
      map[k].push(ev.nombre);
    });
    return map;
  }

  tooltipPos(event: MouseEvent, el: HTMLElement): void {
    const tooltip = el.querySelector('.day-tooltip') as HTMLElement;
    if (!tooltip) return;
    const rect = el.getBoundingClientRect();
    tooltip.style.top  = (rect.top + rect.height / 2 - tooltip.offsetHeight / 2) + 'px';
    tooltip.style.left = (rect.right + 12) + 'px';
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.elRef.nativeElement.querySelector('.view-toggle')?.contains(e.target)) {
      this.miniCalOpen = false;
    }
  }

  get tituloSeccion(): string {
    return this.eventsPage < this.paginaFuturosInicio
      ? 'Eventos Pasados'
      : 'Eventos Próximos';
  }

  // ═══════════════════════════════════════════════════════
  //  NUEVO: Modal de detalle
  // ═══════════════════════════════════════════════════════
  abrirDetalleEvento(ev: ActividadPublica): void {
    this.idActividadDetalle = ev.id;
    this.modalDetalleAbierto = true;
  }

  cerrarDetalleEvento(): void {
    this.modalDetalleAbierto = false;
    this.idActividadDetalle = null;
  }

  /**
   * Carga los conteos + miRespuesta para los eventos visibles en la pagina actual.
   * Se llama cada vez que cambia la pagina de eventos o el filtro.
   */
  private cargarAsistenciasPagina(): void {
    const ids = this.pagedEvents.map(ev => ev.id);
    if (ids.length === 0) return;

    this.asistenciaService.obtenerLote(ids).subscribe({
      next: data => {
        // Merge con lo que ya tenia para conservar respuestas previas
        this.asistencias = { ...this.asistencias, ...data };
      },
      error: () => {
        // Falla silenciosa: el calendario sigue funcionando sin contadores.
        // Los botones de US-12 mostraran 0 hasta que se reintente al cambiar de pagina.
      }
    });
  }

  /**
   * Maneja el click en una opcion (Voy / Tal vez / No voy).
   * Si el usuario clickea su respuesta actual, no hace nada (toggle off no soportado por ahora).
   */
  responder(ev: ActividadPublica, respuesta: RespuestaAsistencia, event: MouseEvent): void {
    event.stopPropagation();

    const estado = this.asistencias[ev.id];
    if (estado?.miRespuesta === respuesta) return;
    if (this.isPast(ev)) return;
    if (this.respondiendoIds.has(ev.id)) return;

    this.respondiendoIds.add(ev.id);
    this.asistenciaService.responder(ev.id, respuesta).subscribe({
      next: nuevoEstado => {
        this.asistencias[ev.id] = nuevoEstado;
        this.respondiendoIds.delete(ev.id);
      },
      error: () => {
        this.respondiendoIds.delete(ev.id);
      }
    });
  }

  estadoAsistencia(idActividad: number): AsistenciaEstado {
    return this.asistencias[idActividad] ?? {
      idActividad, miRespuesta: null,
      totalVoy: 0, totalTalVez: 0, totalNoVoy: 0
    };
  }

  estaRespondiendo(idActividad: number): boolean {
    return this.respondiendoIds.has(idActividad);
  }

}