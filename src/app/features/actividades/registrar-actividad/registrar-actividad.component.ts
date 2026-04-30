import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup,
         FormArray, Validators, AbstractControl } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { ActividadService } from '../../../core/services/actividad.service';
import {
  Categoria, TipoActividad, Departamento,
  Carrera, EspacioRecurso, MobiliarioRecurso
} from '../../../core/models/catalogo.model';
import { ActividadRequest } from '../../../core/models/actividad.model';

@Component({
  selector: 'app-registrar-actividad',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './registrar-actividad.component.html',
  styleUrl: './registrar-actividad.component.css'
})
export class RegistrarActividadComponent implements OnInit {

  private fb        = inject(FormBuilder);
  private catalogo  = inject(CatalogoService);
  private actividad = inject(ActividadService);

  // Catálogos
  categorias:   Categoria[]         = [];
  tipos:        TipoActividad[]     = [];
  departamentos: Departamento[]     = [];
  carreras:     Carrera[]           = [];
  espacios:     EspacioRecurso[]    = [];
  mobiliario:   MobiliarioRecurso[] = [];

  // Estado UI
  pasoActual     = 1;
  cargando       = false;
  enviado        = false;
  errorGlobal    = '';
  actividadCreada: any = null;

  // Imagen portada
  archivoPortada?: File;
  previewPortada?: string;

  form!: FormGroup;

  mostrarInfo = false;

  ngOnInit(): void {
    this.construirForm();
    this.cargarCatalogos();
  }

  construirForm(): void {
    this.form = this.fb.group({
      // Paso 1 — Info general
      nombre:       ['', [Validators.required, Validators.maxLength(200)]],
      idCategoria:  [null, Validators.required],
      idTipo:       [{ value: null, disabled: true }, Validators.required],
      descripcion:  ['', Validators.maxLength(5000)],

      // Paso 2 — Fecha y hora
      fechaActividad: ['', Validators.required],
      horaInicio:     ['', Validators.required],
      horaFin:        ['', Validators.required],

      // Paso 3 — Organizadores (al menos uno)
      organizadores: this.fb.array([], Validators.required),

      // Paso 3 — Recursos (al menos uno)
      recursos: this.fb.array([], Validators.required),
    }, { validators: this.validarHoras });
  }

  // Validador que horaFin > horaInicio
  validarHoras(group: AbstractControl) {
    const inicio = group.get('horaInicio')?.value;
    const fin    = group.get('horaFin')?.value;
    if (inicio && fin && fin <= inicio) {
      return { horaInvalida: true };
    }
    return null;
  }

  cargarCatalogos(): void {
    this.catalogo.getCategorias().subscribe(d => this.categorias = d);
    this.catalogo.getDepartamentos().subscribe(d => this.departamentos = d);
    this.catalogo.getCarreras().subscribe(d => this.carreras = d);
  }

  onCategoriaChange(event: Event): void {
    const id = +(event.target as HTMLSelectElement).value;
    const controlTipo = this.form.get('idTipo')!;
    controlTipo.reset();

    if (id) {
      controlTipo.enable();
      this.catalogo.getTiposActividad(id).subscribe(d => this.tipos = d);
    } else {
      controlTipo.disable();
      this.tipos = [];
    }
  }

  // ── Organizadores FormArray ──────────────────────────
  get organizadoresArray(): FormArray {
    return this.form.get('organizadores') as FormArray;
  }

  agregarOrganizador(tipo: 'carrera' | 'departamento', id: number, nombre: string): void {
    const yaExiste = this.organizadoresArray.controls.some(c => {
      const v = c.value;
      return tipo === 'carrera'
        ? v.idCarrera === id
        : v.idDepartamento === id;
    });
    if (yaExiste) return;

    this.organizadoresArray.push(this.fb.group({
      idCarrera:      tipo === 'carrera'      ? id : null,
      idDepartamento: tipo === 'departamento' ? id : null,
      _nombre: nombre,
      _tipo:   tipo
    }));
  }

  quitarOrganizador(i: number): void {
    this.organizadoresArray.removeAt(i);
  }

  // ── Recursos FormArray ───────────────────────────────
  get recursosArray(): FormArray {
    return this.form.get('recursos') as FormArray;
  }

  agregarRecurso(idRecurso: number, nombre: string, tipo: string): void {
    const yaExiste = this.recursosArray.controls
      .some(c => c.value.idRecurso === idRecurso);
    if (yaExiste) return;

    this.recursosArray.push(this.fb.group({
      idRecurso:         idRecurso,
      cantidadRequerida: [1, [Validators.required, Validators.min(1)]],
      _nombre: nombre,
      _tipo:   tipo
    }));
  }

  quitarRecurso(i: number): void {
    this.recursosArray.removeAt(i);
  }

  // ── Imagen portada ───────────────────────────────────
  onPortadaSeleccionada(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const tiposValidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposValidos.includes(file.type)) {
      this.errorGlobal = 'Solo se permiten imágenes JPG, PNG o WEBP.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorGlobal = 'La imagen no puede superar 5 MB.';
      return;
    }

    this.archivoPortada = file;
    this.errorGlobal    = '';
    const reader = new FileReader();
    reader.onload = e => this.previewPortada = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  quitarPortada(): void {
    this.archivoPortada = undefined;
    this.previewPortada = undefined;
  }

  // ── Navegación por pasos ─────────────────────────────
  irPaso(paso: number): void {
    if (paso > this.pasoActual && !this.validarPasoActual()) return;
    this.pasoActual = paso;
  }

  siguiente(): void {
    if (!this.validarPasoActual()) return;
    this.pasoActual++;

    // Al entrar al paso 3, recargar recursos filtrados por horario
    if (this.pasoActual === 3) {
      this.cargarRecursosDisponibles();
    }
  }

  anterior(): void {
    if (this.pasoActual > 1) this.pasoActual--;
  }

  validarPasoActual(): boolean {
    const campos: Record<number, string[]> = {
      1: ['nombre', 'idCategoria', 'idTipo'],
      2: ['fechaActividad', 'horaInicio', 'horaFin'],
    };
    const camposPaso = campos[this.pasoActual];
    if (!camposPaso) return true;

    let valido = true;
    camposPaso.forEach(c => {
      const ctrl = this.form.get(c);
      ctrl?.markAsTouched();
      if (ctrl?.invalid) valido = false;
    });

    if (this.pasoActual === 2 && this.form.hasError('horaInvalida')) {
      valido = false;
    }
    return valido;
  }

  // ── Submit ───────────────────────────────────────────
  enviar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (this.organizadoresArray.length === 0) {
      this.errorGlobal = 'Agrega al menos un organizador.';
      return;
    }
    if (this.recursosArray.length === 0) {
      this.errorGlobal = 'Agrega al menos un recurso.';
      return;
    }

    const v = this.form.getRawValue();

    const request: ActividadRequest = {
      idProfesor:     3, // TODO: obtener del servicio de autenticación
      idTipo:         v.idTipo,
      nombre:         v.nombre,
      descripcion:    v.descripcion,
      fechaActividad: v.fechaActividad,
      horaInicio:     v.horaInicio + ':00',
      horaFin:        v.horaFin + ':00',
      organizadores:  v.organizadores.map((o: any) => ({
        idCarrera:      o.idCarrera      ?? undefined,
        idDepartamento: o.idDepartamento ?? undefined
      })),
      recursos: v.recursos.map((r: any) => ({
        idRecurso:         r.idRecurso,
        cantidadRequerida: r.cantidadRequerida
      }))
    };

    this.cargando    = true;
    this.errorGlobal = '';

    this.actividad.registrar(request, this.archivoPortada).subscribe({
      next: res => {
        this.cargando       = false;
        this.actividadCreada = res;
        this.enviado        = true;
      },
      error: err => {
        this.cargando    = false;
        this.errorGlobal = err.mensajeAmigable ?? 'Error al enviar la solicitud.';
      }
    });
  }

  nuevaSolicitud(): void {
    this.form.reset();
    this.organizadoresArray.clear();
    this.recursosArray.clear();
    this.quitarPortada();
    this.pasoActual      = 1;
    this.enviado         = false;
    this.actividadCreada = null;
    this.errorGlobal     = '';
  }

  // ── Helpers template ────────────────────────────────
  campo(name: string) { return this.form.get(name); }
  invalido(name: string) {
    const c = this.form.get(name);
    return c?.invalid && c?.touched;
  }
  formatBytes(b: number): string {
    return b < 1024 * 1024
      ? (b / 1024).toFixed(1) + ' KB'
      : (b / 1024 / 1024).toFixed(1) + ' MB';
  }


  onSelectOrganizador(event: Event, tipo: 'carrera' | 'departamento'): void {
    const val = (event.target as HTMLSelectElement).value;
    if (!val) return;
    const [id, nombre] = val.split('|');
    this.agregarOrganizador(tipo, +id, nombre);
    (event.target as HTMLSelectElement).value = '';
  }

  onSelectRecurso(event: Event, tipo: 'ESPACIO' | 'MOBILIARIO'): void {
    const val = (event.target as HTMLSelectElement).value;
    if (!val) return;
    const [id, nombre] = val.split('|');
    this.agregarRecurso(+id, nombre, tipo);
    (event.target as HTMLSelectElement).value = '';
  }

  getMobiliarioSeleccionado() {
    return this.recursosArray.controls.filter(c => c.value._tipo === 'MOBILIARIO');
  }

  cambiarCantidad(i: number, delta: number): void {
    const ctrl = this.recursosArray.at(i).get('cantidadRequerida')!;
    const nuevo = (ctrl.value ?? 1) + delta;
    if (nuevo >= 1) ctrl.setValue(nuevo);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } } as any;
      this.onPortadaSeleccionada(fakeEvent);
    }
  }

  getNombreTipo(id: any): string {
    return this.tipos.find(t => t.idTipo === +id)?.nombre ?? '—';
  }


  // NUEVO
  cargarRecursosDisponibles(): void {
    const fecha      = this.form.get('fechaActividad')?.value;
    const horaInicio = this.form.get('horaInicio')?.value;
    const horaFin    = this.form.get('horaFin')?.value;

    if (!fecha || !horaInicio || !horaFin) return;
    if (this.form.hasError('horaInvalida')) return;

    // Formato requerido: HH:mm:ss
    const inicio = horaInicio + ':00';
    const fin    = horaFin + ':00';

    this.catalogo.getEspacios(fecha, inicio, fin)
      .subscribe(d => this.espacios = d);

    this.catalogo.getMobiliario(fecha, inicio, fin)
      .subscribe(d => this.mobiliario = d);
  }


  getMaxCantidad(idRecurso: number): number {
    return this.mobiliario.find(m => m.idRecurso === idRecurso)?.cantidadDisponible ?? 1;
  }


  toggleInfo(): void {
    this.mostrarInfo = !this.mostrarInfo;
  }


}
