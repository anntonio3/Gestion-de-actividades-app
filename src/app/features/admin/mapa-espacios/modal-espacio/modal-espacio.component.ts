import {
  Component, Input, Output, EventEmitter,
  OnInit, OnChanges, SimpleChanges, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  FormArray, Validators
} from '@angular/forms';
import { EspacioAdminService } from '../../../../core/services/espacio-admin.service';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { MobiliarioRecurso } from '../../../../core/models/catalogo.model';
import {
  EspacioRequest, EspacioDetalle
} from '../../../../core/models/espacio-admin.model';

@Component({
  selector: 'app-modal-espacio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-espacio.component.html',
  styleUrl: './modal-espacio.component.css'
})
export class ModalEspacioComponent implements OnInit, OnChanges {

  @Input() idPunto: number | null = null;       // alta o edicion
  @Input() idEspacio: number | null = null;     // solo edicion
  @Input() modoEdicion = false;

  @Output() guardado = new EventEmitter<void>();
  @Output() cerrado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private servicio = inject(EspacioAdminService);
  private catalogo = inject(CatalogoService);

  // Estado UI
  cargando = false;
  guardando = false;
  errorGlobal = '';

  // Wizard
  pasoActual: 1 | 2 = 1;

  // Catalogo de mobiliario disponible
  mobiliario: MobiliarioRecurso[] = [];

  // Formulario reactivo
  form!: FormGroup;

  // Campos que pertenecen al paso 1 (para validar antes de avanzar)
  private readonly camposPaso1 = ['nombre', 'descripcion', 'capacidad', 'ubicacion'];

  ngOnInit(): void {
    this.construirForm();
    this.cargarMobiliario();
    if (this.modoEdicion && this.idEspacio !== null) {
      this.cargarDetalle(this.idEspacio);
    }
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['idEspacio'] && this.modoEdicion && this.idEspacio !== null && this.form) {
      this.cargarDetalle(this.idEspacio);
    }
  }

  construirForm(): void {
    this.form = this.fb.group({
      nombre:      ['', [Validators.required, Validators.maxLength(150)]],
      descripcion: ['', Validators.maxLength(250)],
      capacidad:   [null, [Validators.required, Validators.min(1)]],
      ubicacion:   ['', [Validators.required, Validators.maxLength(150)]],
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
      ubicacion:   detalle.ubicacion
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

  // FormArray de equipamiento
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

  // Recursos disponibles excluyendo los ya seleccionados en otras filas
  recursosDisponibles(indiceActual: number): MobiliarioRecurso[] {
    const seleccionados = this.equipamientoArray.controls
      .map((c, i) => i !== indiceActual ? c.value.idRecurso : null)
      .filter(id => id !== null && id !== undefined);

    return this.mobiliario.filter(m => !seleccionados.includes(m.idRecurso));
  }

  // Navegacion del wizard
  siguientePaso(): void {
    if (!this.validarPaso1()) {
      this.errorGlobal = 'Completa los datos obligatorios antes de continuar.';
      return;
    }
    this.errorGlobal = '';
    this.pasoActual = 2;
  }

  pasoAnterior(): void {
    this.errorGlobal = '';
    this.pasoActual = 1;
  }

  // Marca como tocados solo los campos del paso 1 y verifica si son validos
  private validarPaso1(): boolean {
    let valido = true;
    this.camposPaso1.forEach(c => {
      const ctrl = this.form.get(c);
      ctrl?.markAsTouched();
      if (ctrl?.invalid) valido = false;
    });
    return valido;
  }

  cerrar(): void {
    this.cerrado.emit();
  }

  cerrarSiOverlay(evento: MouseEvent): void {
    const target = evento.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      this.cerrar();
    }
  }

  guardar(): void {
    this.form.markAllAsTouched();
    this.errorGlobal = '';

    // Si el paso 1 es invalido, regresar al paso 1 para que el usuario lo vea
    if (!this.validarPaso1()) {
      this.pasoActual = 1;
      this.errorGlobal = 'Revisa los datos del paso 1.';
      return;
    }

    if (this.form.invalid) {
      this.errorGlobal = 'Revisa los campos del equipamiento.';
      return;
    }

    const v = this.form.getRawValue();
    const request: EspacioRequest = {
      idPunto:     this.idPunto!,
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
        this.guardando = false;
        this.errorGlobal = err.mensajeAmigable ?? 'Error al guardar el espacio.';
      }
    });
  }

  // Helpers para template
  campo(nombre: string) { return this.form.get(nombre); }
  invalido(nombre: string): boolean {
    const c = this.form.get(nombre);
    return !!c && c.invalid && c.touched;
  }
}