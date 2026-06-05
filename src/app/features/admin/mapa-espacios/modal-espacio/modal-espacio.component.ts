import {
  Component, Input, Output, EventEmitter,
  OnInit, OnChanges, SimpleChanges, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  FormArray, Validators, AbstractControl
} from '@angular/forms';
import { EspacioAdminService } from '../../../../core/services/espacio-admin.service';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { MobiliarioRecurso } from '../../../../core/models/catalogo.model';
import { EspacioRequest, EspacioDetalle, TipoUbicacion } from '../../../../core/models/espacio-admin.model';

@Component({
  selector: 'app-modal-espacio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-espacio.component.html',
  styleUrl: './modal-espacio.component.css'
})
export class ModalEspacioComponent implements OnInit, OnChanges {

  @Input() idPunto: number | null = null;
  @Input() idEspacio: number | null = null;
  @Input() modoEdicion = false;

  @Output() guardado = new EventEmitter<void>();
  @Output() cerrado  = new EventEmitter<void>();

  private fb       = inject(FormBuilder);
  private servicio = inject(EspacioAdminService);
  private catalogo = inject(CatalogoService);

  // Estado UI
  cargando    = false;
  guardando   = false;
  errorGlobal = '';

  // Wizard
  pasoActual: 1 | 2 = 1;

  // Tipo de ubicación seleccionado en el paso 1
  tipoUbicacion: TipoUbicacion = 'interna';

  // Catálogo de mobiliario disponible
  mobiliario: MobiliarioRecurso[] = [];

  // Formulario reactivo
  form!: FormGroup;

  // Campos del paso 1 (para validar antes de avanzar al paso 2)
  private camposPaso1Base     = ['nombre', 'descripcion', 'capacidad', 'ubicacion'];
  private camposUbicacionInterna  = ['idPunto'];
  private camposUbicacionExterna  = ['latitud', 'longitud', 'urlMaps'];

  ngOnInit(): void {
    this.construirForm();
    this.cargarMobiliario();

    if (this.modoEdicion && this.idEspacio !== null) {
      this.cargarDetalle(this.idEspacio);
    } else if (this.idPunto !== null) {
      // Alta desde el mapa: preseleccionar punto y forzar tipo interno
      this.tipoUbicacion = 'interna';
      this.form.get('idPunto')?.setValue(this.idPunto);
    } else {
      // Alta sin punto: forzar tipo externo directamente
      this.tipoUbicacion = 'externa';
    }
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['idEspacio'] && this.modoEdicion && this.idEspacio !== null && this.form) {
      this.cargarDetalle(this.idEspacio);
    }
  }

  construirForm(): void {
    this.form = this.fb.group({
      // Datos comunes
      nombre:      ['', [Validators.required, Validators.maxLength(150)]],
      descripcion: ['', Validators.maxLength(250)],
      capacidad:   [null, [Validators.required, Validators.min(1)]],
      ubicacion:   ['', [Validators.required, Validators.maxLength(150)]],

      // Ubicación interna
      idPunto: [null],

      // Ubicación externa
      latitud:  [null, [Validators.min(-90), Validators.max(90)]],
      longitud: [null, [Validators.min(-180), Validators.max(180)]],
      urlMaps:  ['', Validators.maxLength(1000)],

      // Equipamiento
      equipamiento: this.fb.array([])
    });
  }

  cargarMobiliario(): void {
    this.catalogo.getMobiliario().subscribe({
      next: data => this.mobiliario = data,
      error: () => this.errorGlobal = 'Error al cargar el catálogo de mobiliario'
    });
  }

  cargarDetalle(idEspacio: number): void {
    this.cargando = true;
    this.servicio.obtenerDetalle(idEspacio).subscribe({
      next: detalle => {
        this.cargando = false;
        this.tipoUbicacion = detalle.esExterno ? 'externa' : 'interna';
        this.poblarForm(detalle);
      },
      error: err => {
        this.cargando = false;
        this.errorGlobal = err.mensajeAmigable ?? 'Error al cargar el espacio';
      }
    });
  }

  poblarForm(detalle: EspacioDetalle): void {
    this.form.patchValue({
      nombre:      detalle.nombre,
      descripcion: detalle.descripcion ?? '',
      capacidad:   detalle.capacidad,
      ubicacion:   detalle.ubicacion,

      // Internos
      idPunto: detalle.esExterno ? null : (detalle.idPunto ?? null),

      // Externos
      latitud:  detalle.esExterno ? detalle.latitud  : null,
      longitud: detalle.esExterno ? detalle.longitud : null,
      urlMaps:  detalle.esExterno ? detalle.urlMaps  : ''
    });

    this.equipamientoArray.clear();
    detalle.equipamiento.forEach(e => {
      this.equipamientoArray.push(this.fb.group({
        idRecurso:       [e.idRecurso, Validators.required],
        cantidad:        [e.cantidad, [Validators.required, Validators.min(1)]],
        caracteristicas: [e.caracteristicas ?? '', Validators.maxLength(300)]
      }));
    });
  }

  // -----------------------------------------------------------------------
  // Cambio de tipo de ubicación
  // -----------------------------------------------------------------------

  seleccionarTipoUbicacion(tipo: TipoUbicacion): void {
    this.tipoUbicacion = tipo;
    // Limpiar campos del otro tipo para no enviar datos inconsistentes
    if (tipo === 'interna') {
      this.form.patchValue({ latitud: null, longitud: null, urlMaps: '' });
    } else {
      this.form.patchValue({ idPunto: null });
    }
    this.errorGlobal = '';
  }

  // -----------------------------------------------------------------------
  // FormArray equipamiento
  // -----------------------------------------------------------------------

  get equipamientoArray(): FormArray {
    return this.form.get('equipamiento') as FormArray;
  }

  agregarEquipamiento(): void {
    this.equipamientoArray.push(this.fb.group({
      idRecurso:       [null, Validators.required],
      cantidad:        [1, [Validators.required, Validators.min(1)]],
      caracteristicas: ['', Validators.maxLength(300)]
    }));
  }

  quitarEquipamiento(i: number): void {
    this.equipamientoArray.removeAt(i);
  }

  recursosDisponibles(indiceActual: number): MobiliarioRecurso[] {
    const seleccionados = this.equipamientoArray.controls
      .map((c, i) => i !== indiceActual ? c.value.idRecurso : null)
      .filter(id => id !== null && id !== undefined);
    return this.mobiliario.filter(m => !seleccionados.includes(m.idRecurso));
  }

  onRecursoChange(indice: number): void {
    const grupo = this.equipamientoArray.at(indice) as FormGroup;
    const idRecurso     = grupo.get('idRecurso')?.value;
    const cantidadCtrl  = grupo.get('cantidad');
    if (!cantidadCtrl) return;

    const recurso = this.mobiliario.find(m => m.idRecurso === idRecurso);
    const max     = recurso?.cantidadTotal ?? null;

    cantidadCtrl.setValidators(max !== null
      ? [Validators.required, Validators.min(1), Validators.max(max)]
      : [Validators.required, Validators.min(1)]
    );
    cantidadCtrl.updateValueAndValidity();
  }

  existenciasRecurso(indice: number): number | null {
    const idRecurso = this.equipamientoArray.at(indice).get('idRecurso')?.value;
    if (!idRecurso) return null;
    const recurso = this.mobiliario.find(m => m.idRecurso === idRecurso);
    return recurso?.cantidadTotal ?? null;
  }

  // -----------------------------------------------------------------------
  // Navegación del wizard
  // -----------------------------------------------------------------------

  siguientePaso(): void {
    if (!this.validarPaso1()) {
      this.errorGlobal = 'Completa los datos obligatorios antes de continuar.';
      return;
    }
    this.errorGlobal = '';
    this.pasoActual  = 2;
  }

  pasoAnterior(): void {
    this.errorGlobal = '';
    this.pasoActual  = 1;
  }

  private validarPaso1(): boolean {
    let valido = true;

    // Campos comunes
    this.camposPaso1Base.forEach(c => {
      const ctrl = this.form.get(c);
      ctrl?.markAsTouched();
      if (ctrl?.invalid) valido = false;
    });

    // Campos según tipo de ubicación
    if (this.tipoUbicacion === 'interna') {
      const idPunto = this.form.get('idPunto')?.value;
      if (!idPunto) {
        valido = false;
        this.errorGlobal = 'Selecciona un punto del mapa UNPA.';
      }
    } else {
      // Externa: latitud, longitud y URL obligatorios
      const lat    = this.form.get('latitud')?.value;
      const lng    = this.form.get('longitud')?.value;
      const urlMap = this.form.get('urlMaps')?.value;

      if (!lat || !lng || !urlMap?.trim()) {
        valido = false;
        this.errorGlobal = 'Para ubicación externa debes proporcionar latitud, longitud y URL de Google Maps.';
      }
      // Marcar los controles como tocados para mostrar errores de rango
      ['latitud', 'longitud', 'urlMaps'].forEach(c => this.form.get(c)?.markAsTouched());
    }

    return valido;
  }

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------

  cerrar(): void { this.cerrado.emit(); }

  cerrarSiOverlay(evento: MouseEvent): void {
    if ((evento.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cerrar();
    }
  }

  guardar(): void {
    this.form.markAllAsTouched();
    this.errorGlobal = '';

    if (!this.validarPaso1()) {
      this.pasoActual = 1;
      return;
    }
    if (this.form.invalid) {
      this.errorGlobal = 'Revisa los campos del equipamiento.';
      return;
    }

    const v = this.form.getRawValue();

    const request: EspacioRequest = {
      nombre:      v.nombre.trim(),
      descripcion: v.descripcion?.trim() || undefined,
      capacidad:   v.capacidad,
      ubicacion:   v.ubicacion.trim(),
      equipamiento: v.equipamiento.map((e: any) => ({
        idRecurso:       e.idRecurso,
        cantidad:        e.cantidad,
        caracteristicas: e.caracteristicas?.trim() || undefined
      }))
    };

    if (this.tipoUbicacion === 'interna') {
      request.idPunto = v.idPunto;
    } else {
      request.latitud  = parseFloat(v.latitud);
      request.longitud = parseFloat(v.longitud);
      request.urlMaps  = v.urlMaps?.trim();
    }

    this.guardando = true;

    const obs = this.modoEdicion && this.idEspacio !== null
      ? this.servicio.actualizar(this.idEspacio, request)
      : this.servicio.registrar(request);

    obs.subscribe({
      next: () => {
        this.guardando = false;
        this.guardado.emit();
      },
      error: err => {
        this.guardando  = false;
        this.errorGlobal = err.mensajeAmigable ?? 'Error al guardar el espacio.';
      }
    });
  }

  // -----------------------------------------------------------------------
  // Helpers template
  // -----------------------------------------------------------------------
  campo(nombre: string) { return this.form.get(nombre); }
  invalido(nombre: string): boolean {
    const c = this.form.get(nombre);
    return !!c && c.invalid && c.touched;
  }
}