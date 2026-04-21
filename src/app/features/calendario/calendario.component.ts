import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Actividad, Categoria, CATEGORIA_COLOR, CATEGORIA_EMOJI } from '../../core/models/actividad.model';
import { ActividadService } from '../../core/services/actividades.service';

 
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
  imports: [CommonModule, FormsModule],
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.css'],
  providers: [DatePipe]
})
export class CalendarioComponent implements OnInit {
 
  // ── Datos ──────────────────────────────────────────────
  actividades: Actividad[]  = [];
  categorias:  Categoria[]  = [];
  loading = true;
  error   = false;
 
  // ── Filtro ─────────────────────────────────────────────
  searchQuery          = '';
  categoriaSeleccionada?: number;
  categoriaSelNombre   = 'Todos';
 
  // ── Strip ──────────────────────────────────────────────
  stripOffset  = -1;          // offset del primer pill respecto a hoy
  STRIP_VISIBLE = 14;
  pills: DayPill[] = [];
 
  // ── Fecha seleccionada ─────────────────────────────────
  todayRef     = this.makeToday();
  selectedDate = this.makeToday();
 
  // ── Mini-cal ───────────────────────────────────────────
  miniCalOpen  = false;
  miniCalYear  = 0;
  miniCalMonth = 0;
  miniCalDays: MiniCalDay[] = [];
  readonly DAYS_HEADER = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];
  readonly MONTHS_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                          'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  readonly DAYS_SHORT  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
 
  // ── Paginación eventos ─────────────────────────────────
  eventsPage      = 0;
  EVENTS_PER_PAGE = 6;
  filteredEvents: Actividad[] = [];
  totalPages      = 0;
 
  // ── Helpers expuestos a la plantilla ──────────────────
  catEmoji  = CATEGORIA_EMOJI;
  catColor  = CATEGORIA_COLOR;
 
  constructor(
    private actividadService: ActividadService,
    private elRef: ElementRef
  ) {}
 
  ngOnInit(): void {
    this.miniCalYear  = this.todayRef.getFullYear();
    this.miniCalMonth = this.todayRef.getMonth();
 
    this.actividadService.getCategorias().subscribe({
      next: cats => this.categorias = cats,
      error: () => {}
    });
 
    this.loadActividades();
  }
 
  // ─────────────────────────────────────────────────────
  // CARGA DE DATOS
  // ─────────────────────────────────────────────────────
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
 
  // ─────────────────────────────────────────────────────
  // FILTROS
  // ─────────────────────────────────────────────────────
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
    const selKey = this.dateKey(this.selectedDate);

    this.filteredEvents = this.actividades.filter(ev => {
      const mQ = !q
        || ev.nombre.toLowerCase().includes(q)
        || ev.descripcion.toLowerCase().includes(q);
      return mQ;
    });
 
    // Ordenar: futuros/hoy primero, pasados al final
    this.filteredEvents.sort((a, b) => {
      const da = new Date(a.fechaActividad);
      const db = new Date(b.fechaActividad);
      const aF = da >= this.todayRef;
      const bF = db >= this.todayRef;
      if (aF && !bF) return -1;
      if (!aF && bF) return  1;
      return da.getTime() - db.getTime();
    });
 
    this.eventsPage  = 0;
    this.totalPages  = Math.ceil(this.filteredEvents.length / this.EVENTS_PER_PAGE);
  }
 
  get pagedEvents(): Actividad[] {
    const start = this.eventsPage * this.EVENTS_PER_PAGE;
    return this.filteredEvents.slice(start, start + this.EVENTS_PER_PAGE);
  }
 
  shiftEvents(dir: number): void {
    const next = this.eventsPage + dir;
    if (next >= 0 && next < this.totalPages) {
      this.eventsPage = next;
    }
  }
 
  isPast(ev: Actividad): boolean {
    return new Date(ev.fechaActividad) < this.todayRef;
  }
 
  occupancyClass(ev: Actividad): string {
    // No tenemos seats en el DTO real, devolvemos verde por defecto
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
 
  // ─────────────────────────────────────────────────────
  // CALENDAR STRIP
  // ─────────────────────────────────────────────────────
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
    this.stripOffset += dir * 7;
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
  }
 
  get agendaTitle(): string {
    return `Agenda — ${this.MONTHS_FULL[this.selectedDate.getMonth()]} ${this.selectedDate.getFullYear()}`;
  }
 
  // ─────────────────────────────────────────────────────
  // MINI CALENDARIO
  // ─────────────────────────────────────────────────────
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
 
  // ─────────────────────────────────────────────────────
  // UTILIDADES
  // ─────────────────────────────────────────────────────
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
}