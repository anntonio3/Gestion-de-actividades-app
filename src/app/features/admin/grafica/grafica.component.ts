import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  HostListener,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { EstadisticasService } from '../../../core/services/estadisticas.service';
import {
  EstadisticaMes,
  EstadisticaCampus,
  EstadisticaCarrera
} from '../../../core/models/estadisticas.model';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

/** Colores fijos por campus (coinciden con nombres exactos en la BD) */
const CAMPUS_COLORES: Record<string, string> = {
  'campus loma bonita': '#71B6A7',
  'loma bonita':        '#71B6A7',
  'campus tuxtepec':    '#2D5F58',
  'tuxtepec':           '#2D5F58',
};

const COLORES = [
  '#71B6A7','#2D5F58','#4e9688','#a8d5cc',
  '#e8a04a','#e05c5c','#7b6be0','#3fa7d6',
  '#f4a261','#2a9d8f','#e9c46a','#264653'
];

const CHARTJS_CDN      = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js';
const DATALABELS_CDN   = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js';

interface AnioItem { anio: number; tieneActividad: boolean; }

@Component({
  selector: 'app-grafica',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './grafica.component.html',
  styleUrls: ['./grafica.component.css']
})
export class GraficaComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('canvasGeneral') canvasGeneral!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasCampus')  canvasCampus!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasCarrera') canvasCarrera!: ElementRef<HTMLCanvasElement>;

  cargando = true;
  error    = '';

  dataGeneral:  EstadisticaMes[]     = [];
  dataCampus:   EstadisticaCampus[]  = [];
  dataCarrera:  EstadisticaCarrera[] = [];

  /** Año actualmente seleccionado; arranca en el año presente */
  anioActual: number = new Date().getFullYear();

  /** 10 años hasta el presente, con bandera de si tienen datos */
  aniosMostrar: AnioItem[] = [];

  /** Control del picker de año */
  mostrarPickerAnio = false;

  /** Carrera seleccionada para la gráfica US-23 */
  carreraSeleccionada   = '';
  listadoCarreras:  string[] = [];
  mostrarListaCarreras  = false;

  private chartGeneral: any = null;
  private chartCampus:  any = null;
  private chartCarrera: any = null;

  private viewReady  = false;
  private dataReady  = false;
  private chartReady = false;

  constructor(
    private estadisticasService: EstadisticasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Generar los 10 años al inicio (antes de que lleguen datos)
    this.recalcularAnios([]);

    this.cargarChartJs().then(() => {
      this.chartReady = true;
      if (this.viewReady && this.dataReady) this.renderizarTodo();
    });

    forkJoin({
      general: this.estadisticasService.obtenerGeneral(),
      campus:  this.estadisticasService.obtenerPorCampus(),
      carrera: this.estadisticasService.obtenerPorCarrera()
    }).subscribe({
      next: ({ general, campus, carrera }) => {
        this.dataGeneral = general;
        this.dataCampus  = campus;
        this.dataCarrera = carrera;

        // Años que sí tienen actividad
        const conActividad = new Set([
          ...general.map(d => d.anio),
          ...campus.map(d => d.anio),
          ...carrera.map(d => d.anio)
        ]);
        this.recalcularAnios([...conActividad]);

        // Lista de carreras filtrada por año actual
        this.recalcularCarreras();

        this.cargando  = false;
        this.dataReady = true;

        // Forzar detección de cambios para que Angular cree los <canvas>
        // del bloque @if (!cargando && !error) ANTES de intentar dibujar
        this.cdr.detectChanges();

        if (this.viewReady && this.chartReady) {
          setTimeout(() => this.renderizarTodo(), 0);
        }
      },
      error: () => {
        this.error    = 'No se pudieron cargar las estadísticas. Verifica la conexión con el servidor.';
        this.cargando = false;
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.dataReady && this.chartReady) {
      this.cdr.detectChanges();
      setTimeout(() => this.renderizarTodo(), 0);
    }
  }

  ngOnDestroy(): void {
    this.chartGeneral?.destroy();
    this.chartCampus?.destroy();
    this.chartCarrera?.destroy();
  }

  /** Cierra dropdowns al hacer click fuera */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.year-picker-wrap'))    this.mostrarPickerAnio    = false;
    if (!target.closest('.carrera-picker-wrap')) this.mostrarListaCarreras = false;
  }

  // ── Años ────────────────────────────────────────────────

  private recalcularAnios(conActividad: number[]): void {
    const actual = new Date().getFullYear();
    this.aniosMostrar = Array.from({ length: 10 }, (_, i) => {
      const anio = actual - 9 + i;
      return { anio, tieneActividad: conActividad.includes(anio) };
    });
  }

  togglePickerAnio(event: MouseEvent): void {
    event.stopPropagation();
    this.mostrarPickerAnio = !this.mostrarPickerAnio;
  }

  seleccionarAnio(anio: number, event: MouseEvent): void {
    event.stopPropagation();
    this.anioActual        = anio;
    this.mostrarPickerAnio = false;
    this.recalcularCarreras();
    this.cdr.detectChanges();
    setTimeout(() => this.renderizarTodo(), 0);
  }

  // ── Carrera ──────────────────────────────────────────────

  /** Recalcula la lista de carreras y selección según el año actual */
  private recalcularCarreras(): void {
    const carrerasDelAnio = this.dataCarrera.filter(d => d.anio === this.anioActual);
    this.listadoCarreras = [...new Set(carrerasDelAnio.map(d => d.nombreCarrera))].sort();
    // Si la carrera seleccionada no existe en el nuevo año, resetear
    if (!this.listadoCarreras.includes(this.carreraSeleccionada)) {
      this.carreraSeleccionada = this.listadoCarreras[0] ?? '';
    }
  }

  toggleListaCarreras(event: MouseEvent): void {
    event.stopPropagation();
    this.mostrarListaCarreras = !this.mostrarListaCarreras;
  }

  seleccionarCarrera(carrera: string, event: MouseEvent): void {
    event.stopPropagation();
    this.carreraSeleccionada  = carrera;
    this.mostrarListaCarreras = false;
    this.dibujarCarrera();
  }

  // ── Chart.js ─────────────────────────────────────────────

  private cargarChartJs(): Promise<void> {
    return new Promise(async (resolve) => {
      try {
        if (!(window as any)['Chart']) {
          await this.cargarScript(CHARTJS_CDN);
        }
        if (!(window as any)['ChartDataLabels']) {
          await this.cargarScript(DATALABELS_CDN);
          // Registrar el plugin globalmente
          (window as any)['Chart'].register((window as any)['ChartDataLabels']);
        }
        resolve();
      } catch {
        this.error    = 'No se pudo cargar la librería de gráficas. Verifica tu conexión a internet.';
        this.cargando = false;
        resolve();
      }
    });
  }

  private cargarScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const s   = document.createElement('script');
      s.src     = src;
      s.onload  = () => resolve();
      s.onerror = () => reject(new Error(`Error cargando ${src}`));
      document.head.appendChild(s);
    });
  }

  private renderizarTodo(): void {
    this.dibujarGeneral();
    this.dibujarCampus();
    this.dibujarCarrera();
  }

  // ── Gráficas ─────────────────────────────────────────────

  private dibujarGeneral(): void {
    if (!this.canvasGeneral) return;
    const Chart   = (window as any)['Chart'];
    const filtrado = this.dataGeneral.filter(d => d.anio === this.anioActual);
    const datos    = Array(12).fill(0);
    filtrado.forEach(d => { datos[d.mes - 1] = d.cantidad; });

    this.chartGeneral?.destroy();
    this.chartGeneral = new Chart(this.canvasGeneral.nativeElement, {
      type: 'bar',
      data: {
        labels: MESES,
        datasets: [{ label: `Actividades ${this.anioActual}`, data: datos,
          backgroundColor: COLORES[0] + 'cc', borderColor: COLORES[0],
          borderWidth: 2, borderRadius: 6 }]
      },
      options: this.optsConLabels()
    });
  }

  private dibujarCampus(): void {
    if (!this.canvasCampus) return;
    const Chart   = (window as any)['Chart'];
    const filtrado = this.dataCampus.filter(d => d.anio === this.anioActual);
    const campuses = [...new Set(filtrado.map(d => d.nombreDepartamento))].sort();

    const datasets = campuses.map((campus) => {
      const datos = Array(12).fill(0);
      filtrado.filter(d => d.nombreDepartamento === campus)
              .forEach(d => { datos[d.mes - 1] = d.cantidad; });

      const key   = campus.toLowerCase().trim();
      const color = CAMPUS_COLORES[key] ?? COLORES[campuses.indexOf(campus) % COLORES.length];

      return { label: campus, data: datos,
        backgroundColor: color + 'cc', borderColor: color,
        borderWidth: 2, borderRadius: 4 };
    });

    this.chartCampus?.destroy();
    this.chartCampus = new Chart(this.canvasCampus.nativeElement, {
      type: 'bar',
      data: { labels: MESES, datasets },
      options: {
        ...this.optsConLabels(),
        plugins: {
          ...this.optsConLabels().plugins,
          legend: { display: true, position: 'bottom',
            labels: { color: '#1a2e2b', font: { family: "'DM Sans', sans-serif", size: 12 },
              padding: 20, usePointStyle: true, pointStyle: 'rectRounded' } },
          datalabels: {
            display: (ctx: any) => ctx.dataset.data[ctx.dataIndex] > 0,
            color: '#fff',
            font: { weight: 'bold', size: 11, family: "'DM Sans', sans-serif" },
            formatter: (value: number) => value > 0 ? value : '',
            anchor: 'end', align: 'start', offset: 4
          }
        }
      }
    });
  }

  /** US-23: muestra solo la carrera seleccionada */
  private dibujarCarrera(): void {
    if (!this.canvasCarrera || !this.carreraSeleccionada) return;
    const Chart = (window as any)['Chart'];

    const filtrado = this.dataCarrera.filter(
      d => d.anio === this.anioActual && d.nombreCarrera === this.carreraSeleccionada
    );
    const datos = Array(12).fill(0);
    filtrado.forEach(d => { datos[d.mes - 1] = d.cantidad; });

    this.chartCarrera?.destroy();
    this.chartCarrera = new Chart(this.canvasCarrera.nativeElement, {
      type: 'bar',
      data: {
        labels: MESES,
        datasets: [{ label: this.carreraSeleccionada, data: datos,
          backgroundColor: COLORES[2] + 'cc', borderColor: COLORES[2],
          borderWidth: 2, borderRadius: 6 }]
      },
      options: this.optsConLabels()
    });
  }

  /** Opciones base + datalabels dentro de cada barra */
  private optsConLabels(): any {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.dataset.label ?? 'Actividades'}: ${ctx.parsed.y}` } },
        datalabels: {
          display: (ctx: any) => ctx.dataset.data[ctx.dataIndex] > 0,
          color: '#fff',
          font: { weight: 'bold', size: 11, family: "'DM Sans', sans-serif" },
          formatter: (value: number) => value > 0 ? value : '',
          anchor: 'end', align: 'start', offset: 4
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#6b7c79', font: { size: 12 } } },
        y: { beginAtZero: true, ticks: { color: '#6b7c79', precision: 0, font: { size: 12 } }, grid: { color: '#e0f0ed' } }
      }
    };
  }

  totalAnio(data: EstadisticaMes[]): number {
    return data.filter(d => d.anio === this.anioActual).reduce((s, d) => s + d.cantidad, 0);
  }

  uniqueCount(data: any[], key: string): number {
    return new Set(data.filter(d => d.anio === this.anioActual).map(d => d[key])).size;
  }
}