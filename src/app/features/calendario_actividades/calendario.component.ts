import { Component, OnInit, HostListener, ElementRef, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActividadPublica, CATEGORIA_COLOR, CATEGORIA_EMOJI } from '../../core/models/actividad.model';
import { ActividadService } from '../../core/services/calendario-actividades.service';
import { Categoria } from '../../core/models/catalogo.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ModalDetalleEventoComponent } from './modal-detalle-evento/modal-detalle-evento.component';
import { AsistenciaEstado, RespuestaAsistencia } from '../../core/models/asistencia.model';
import { AsistenciaService } from '../../core/services/asistencia.service';
import { Router, RouterLink } from '@angular/router';
import { Aviso } from '../../core/models/aviso.model';
import { CorchoService } from '../../core/services/corcho.service';
import { InscripcionService } from '../../core/services/inscripcion.service';
import { InscripcionEstado } from '../../core/models/inscripcion.model';
import { SesionService } from '../../core/services/sesion.service';
import { InscripcionExternoService } from '../../core/services/inscripcion-externo.service';
import { InscripcionExternoResponse } from '../../core/models/inscripcion-externo.model';
import { ModalInscripcionTipoComponent } from './modal-inscripcion-tipo/modal-inscripcion-tipo.component';


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
  imports: [CommonModule, FormsModule, NavbarComponent, ModalDetalleEventoComponent, ModalInscripcionTipoComponent, RouterLink],
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.css'],
  providers: [DatePipe]
})
export class CalendarioComponent implements OnInit, OnDestroy {

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

  // Agrega en las propiedades del componente:
  inscripciones: Record<number, InscripcionEstado> = {};
  inscribiendoIds = new Set<number>();

  // Para deshabilitar botones mientras se procesa una respuesta
  respondiendoIds = new Set<number>();

  // US-12: id de la actividad cuyo dropdown de asistencia esta abierto
  asistenciaAbiertaId: number | null = null;

  // US-18: Carrusel de avisos en el header
  avisosPreview: Aviso[] = [];
  avisosPreviewPage = 0;
  readonly AVISOS_VISIBLES = 1;
  readonly MAX_AVISOS = 5;
  private avisosTimer?: ReturnType<typeof setInterval>;
  private readonly AVISOS_INTERVALO = 4000;  // 4 segundos
  
  // US-24: modal de seleccion de tipo (interno / externo)
  modalInscripcionTipoAbierto = false;
  actividadParaInscribir: { id: number; nombre: string } | null = null;

  cancelandoExternoIds = new Set<number>();
  
  // Mapa idActividad -> { inscrito: boolean, total: number } para externos
  estadosExternos: Record<number, { inscrito: boolean; total: number }> = {};

  private inscripcionService = inject(InscripcionService);
  public sesion = inject(SesionService);
  private router = inject(Router);
  private readonly externoService = inject(InscripcionExternoService);
  

  constructor(
    private actividadService: ActividadService,
    private asistenciaService: AsistenciaService,
    private corchoService: CorchoService,
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
    // US-18: cargar avisos para el carrusel del header
    this.cargarAvisosPreview();
  }

  ngOnDestroy(): void {
    this.detenerAutoSlide();
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

  // Mapeo categoria -> icono Material Symbols
  getIconoCategoria(categoria: string): string {
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
    return map[categoria] ?? 'event';
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

    // US-12: cerrar dropdown de asistencia si el click fue fuera de uno
    const target = e.target as HTMLElement;
    if (!target.closest('.asistencia-block')) {
      this.asistenciaAbiertaId = null;
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

    this.cargarInscripcionesPagina();
    this.cargarEstadoExternos();
  }

  // Agrega en cargarAsistenciasPagina() después de cargar asistencias:
  private cargarInscripcionesPagina(): void {
    const usuario = this.sesion.usuario();
    const ids = this.pagedEvents
      .filter(ev => ev.requiereInscripcion)
      .map(ev => ev.id);

    if (ids.length === 0) return;

    this.inscripcionService.obtenerLote(
      ids,
      usuario?.id,
      usuario?.tipo
    ).subscribe({
      next: data => { this.inscripciones = { ...this.inscripciones, ...data }; },
      error: () => {}
    });
  }

  estadoInscripcion(idActividad: number): InscripcionEstado {
    return this.inscripciones[idActividad] ?? {
      idActividad, inscrito: false, idInscripcion: null, totalInscritos: 0
    };
  }

  inscribirse(ev: ActividadPublica, event: MouseEvent): void {
    event.stopPropagation();
  
    // Si el usuario ya esta logueado, puede inscribirse directamente sin el modal de tipo.
    const usuario = this.sesion.usuario();
    if (usuario) {
      // Flujo original de usuario autenticado (alumno / profesor / admin)
      if (this.inscribiendoIds.has(ev.id)) return;
      this.inscribiendoIds.add(ev.id);
      this.inscripcionService.inscribir(ev.id, {
        idActor:      usuario.id,
        tipoUsuario:  usuario.tipo
      }).subscribe({
        next: estado => {
          this.inscripciones[ev.id] = estado;
          this.inscribiendoIds.delete(ev.id);
        },
        error: err => {
          this.inscribiendoIds.delete(ev.id);
          alert(err.mensajeAmigable ?? 'No se pudo completar la inscripcion.');
        }
      });
      return;
    }
  
    // Usuario no logueado: abrir modal de seleccion de tipo.
    // El modal preguntara si es de la UNPA (redirige al login) o externo (formulario).
    this.actividadParaInscribir = { id: ev.id, nombre: ev.nombre };
    this.modalInscripcionTipoAbierto = true;
  }

  cancelarInscripcion(ev: ActividadPublica, event: MouseEvent): void {
    event.stopPropagation();
    const usuario = this.sesion.usuario();
    if (!usuario || this.inscribiendoIds.has(ev.id)) return;

    this.inscribiendoIds.add(ev.id);
    this.inscripcionService.cancelar(ev.id, {
      idActor: usuario.id,
      tipoUsuario: usuario.tipo
    }).subscribe({
      next: () => {
        this.inscripciones[ev.id] = {
          idActividad: ev.id,
          inscrito: false,
          idInscripcion: null,
          totalInscritos: Math.max(0, (this.inscripciones[ev.id]?.totalInscritos ?? 1) - 1)
        };
        this.inscribiendoIds.delete(ev.id);
      },
      error: err => {
        this.inscribiendoIds.delete(ev.id);
        alert(err.mensajeAmigable ?? 'No se pudo cancelar la inscripcion.');
      }
    });
  }

  estaInscribiendose(idActividad: number): boolean {
    return this.inscribiendoIds.has(idActividad);
  }

  /**
   * Maneja el click en una opcion (Voy / Tal vez / No voy).
   * Si el usuario clickea su respuesta actual, no hace nada (toggle off no soportado por ahora).
   */
  responder(ev: ActividadPublica, respuesta: RespuestaAsistencia, event: MouseEvent): void {
    event.stopPropagation();

    const estado = this.asistencias[ev.id];
    if (estado?.miRespuesta === respuesta){
      this.asistenciaAbiertaId = null;   // cerrar incluso si no cambia
      return;
    } 
    if (this.isPast(ev)) return;
    if (this.respondiendoIds.has(ev.id)) return;

    this.respondiendoIds.add(ev.id);
    this.asistenciaService.responder(ev.id, respuesta).subscribe({
      next: nuevoEstado => {
        this.asistencias[ev.id] = nuevoEstado;
        this.respondiendoIds.delete(ev.id);
        this.asistenciaAbiertaId = null;   // cerrar al guardar
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

  // US-12: abre/cierra el dropdown de una actividad
  toggleAsistenciaDropdown(idActividad: number, event: MouseEvent): void {
    event.stopPropagation();
    this.asistenciaAbiertaId = this.asistenciaAbiertaId === idActividad ? null : idActividad;
  }

  // Texto del boton segun la respuesta del usuario
  asistenciaLabel(idActividad: number): string {
    const r = this.estadoAsistencia(idActividad).miRespuesta;
    if (!r) return '¿Piensas asistir?';
    const labels: Record<RespuestaAsistencia, string> = {
      VOY: 'Voy',
      TAL_VEZ: 'Tal vez',
      NO_VOY: 'No voy'
    };
    return labels[r];
  }

  // Icono del boton segun la respuesta
  asistenciaIcono(idActividad: number): string {
    const r = this.estadoAsistencia(idActividad).miRespuesta;
    if (!r) return 'how_to_reg';
    const iconos: Record<RespuestaAsistencia, string> = {
      VOY: 'check_circle',
      TAL_VEZ: 'help',
      NO_VOY: 'cancel'
    };
    return iconos[r];
  }

  // Clase CSS por respuesta (color del boton)
  asistenciaClase(idActividad: number): string {
    const r = this.estadoAsistencia(idActividad).miRespuesta;
    if (!r) return '';
    const clases: Record<RespuestaAsistencia, string> = {
      VOY: 'asis-voy',
      TAL_VEZ: 'asis-talvez',
      NO_VOY: 'asis-novoy'
    };
    return clases[r];
  }

  // Texto del conteo: solo el dato mas relevante
  asistenciaConteoTexto(idActividad: number): string {
    const e = this.estadoAsistencia(idActividad);
    // Prioridad: VOY -> TAL_VEZ -> NO_VOY -> nada
    if (e.totalVoy > 0) {
      return e.totalVoy === 1 ? '1 persona va' : `${e.totalVoy} personas van`;
    }
    if (e.totalTalVez > 0) {
      return e.totalTalVez === 1 ? '1 tal vez asista' : `${e.totalTalVez} tal vez asistan`;
    }
    if (e.totalNoVoy > 0) {
      return e.totalNoVoy === 1 ? '1 no asistira' : `${e.totalNoVoy} no asistiran`;
    }
    return 'Aun nadie ha respondido';
  }

  // ═══════════════════════════════════════════════════════
  //  US-18: Carrusel de avisos en el header del calendario
  // ═══════════════════════════════════════════════════════
  private cargarAvisosPreview(): void {
    // Trae los activos ordenados por fecha asc; tomamos como máximo MAX_AVISOS
    this.corchoService.listar().subscribe({
      next: data => {
        this.avisosPreview = data.slice(0, this.MAX_AVISOS);
        this.avisosPreviewPage = 0;
        // Solo auto-desliza si hay más de una página
        if (this.totalPaginasAvisos > 1) {
          this.iniciarAutoSlide();
        }
      },
      error: () => this.avisosPreview = []  // falla silenciosa
    });
  }

  get totalPaginasAvisos(): number {
    return Math.ceil(this.avisosPreview.length / this.AVISOS_VISIBLES);
  }

  get avisosVisibles(): Aviso[] {
    const inicio = this.avisosPreviewPage * this.AVISOS_VISIBLES;
    return this.avisosPreview.slice(inicio, inicio + this.AVISOS_VISIBLES);
  }

  // Avanza ciclicamente (vuelve al inicio tras la última página)
  private avanzarAvisos(): void {
    this.avisosPreviewPage =
      (this.avisosPreviewPage + 1) % this.totalPaginasAvisos;
  }

  // Navegacion manual (flechas/dots): reinicia el timer
  irPaginaAviso(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginasAvisos) return;
    this.avisosPreviewPage = pagina;
    this.reiniciarAutoSlide();
  }

  shiftAvisos(dir: number): void {
    const total = this.totalPaginasAvisos;
    this.avisosPreviewPage = (this.avisosPreviewPage + dir + total) % total;
    this.reiniciarAutoSlide();
  }

  // ── Control del auto-slide ──
  private iniciarAutoSlide(): void {
    this.detenerAutoSlide();
    this.avisosTimer = setInterval(() => this.avanzarAvisos(), this.AVISOS_INTERVALO);
  }
  private detenerAutoSlide(): void {
    if (this.avisosTimer) {
      clearInterval(this.avisosTimer);
      this.avisosTimer = undefined;
    }
  }
  private reiniciarAutoSlide(): void {
    if (this.totalPaginasAvisos > 1) this.iniciarAutoSlide();
  }

  // Pausa al pasar el mouse, reanuda al salir (llamados desde el template)
  pausarAvisos(): void { this.detenerAutoSlide(); }
  reanudarAvisos(): void { this.reiniciarAutoSlide(); }

  // Helpers de formato
  formatFechaAvisoPreview(f: string): string {
    if (!f) return '';
    const d = new Date(f + 'T00:00:00');
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }
  formatHoraAviso(h?: string | null): string {
    return h ? h.substring(0, 5) : '';
  }

  // Agregar al final de la clase:
 
  /** Cierra el modal de seleccion de tipo */
  cerrarModalInscripcionTipo(): void {
    this.modalInscripcionTipoAbierto = false;
    this.actividadParaInscribir      = null;
  }
  
  /**
   * Callback cuando un externo completa la inscripcion.
   * Actualiza el estado local para que el boton refleje "Ya inscrito".
   */
  onExternoInscrito(res: InscripcionExternoResponse): void {
    this.estadosExternos[res.idActividad] = {
      inscrito: true,
      total:    res.totalExternos
    };
    // El modal maneja el paso 3 (exito) internamente.
    // No cerramos aqui: el usuario cierra cuando hace click en "Cerrar" del paso exito.
    this.cargarInscripcionesPagina();
  }
  
  /**
   * Carga el estado de inscripcion de externos para los eventos de la pagina actual.
   * Usa withCredentials para enviar la cookie visitante_id.
   */
  private cargarEstadoExternos(): void {
    const ids = this.pagedEvents
      .filter(ev => ev.requiereInscripcion)
      .map(ev => ev.id);
  
    if (ids.length === 0) return;
  
    ids.forEach(id => {
      this.externoService.obtenerEstado(id).subscribe({
        next: estado => {
          // Solo sobreescribir si el usuario NO esta logueado.
          // Si esta logueado, el estado lo maneja inscripciones (el flujo existente).
          if (!this.sesion.usuario()) {
            this.estadosExternos[id] = estado;
          }
        },
        error: () => {} // falla silenciosa: el boton mostrara "Inscribirse" por defecto
      });
    });
  }
  
  /**
   * Indica si un externo (no logueado) ya esta inscrito en el evento dado.
   * Lo usa el template para mostrar el badge "Ya inscrito" en lugar del boton.
   */
  externoYaInscrito(idActividad: number): boolean {
    return this.estadosExternos[idActividad]?.inscrito ?? false;
  }

  cancelarExterna(ev: ActividadPublica, event: MouseEvent): void {
    event.stopPropagation();
  
    if (this.cancelandoExternoIds.has(ev.id)) return;
    this.cancelandoExternoIds.add(ev.id);
  
    this.externoService.cancelar(ev.id).subscribe({
      next: () => {
        // Limpiar el estado local para que el boton vuelva a "Inscribirse"
        this.estadosExternos[ev.id] = { inscrito: false, total: 0 };
        this.cancelandoExternoIds.delete(ev.id);
  
        // Recargar el conteo unificado para que el contador se actualice
        this.cargarInscripcionesPagina();
        this.cargarEstadoExternos();
      },
      error: err => {
        this.cancelandoExternoIds.delete(ev.id);
        alert(err.mensajeAmigable ?? 'No se pudo cancelar la inscripcion.');
      }
    });
  }

  // Helper para saber si se esta procesando la cancelacion de un externo
  estaCancelandoExterna(idActividad: number): boolean {
    return this.cancelandoExternoIds.has(idActividad);
  }

}