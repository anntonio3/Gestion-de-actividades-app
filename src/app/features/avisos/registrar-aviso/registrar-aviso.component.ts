import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { AvisoService } from '../../../core/services/aviso.service';
import { AvisoRequest } from '../../../core/models/aviso.model';
import { SesionService } from '../../../core/services/sesion.service';

@Component({
  selector: 'app-registrar-aviso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './registrar-aviso.component.html',
  styleUrl: './registrar-aviso.component.css'
})
export class RegistrarAvisoComponent implements OnInit {

  private fb       = inject(FormBuilder);
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private avisoSrv = inject(AvisoService);
  private sesion   = inject(SesionService);

  // TODO: reemplazar con id del profesor autenticado cuando exista login.
  // Por ahora se usa un id quemado (mismo patron que /actividades/registrar).
  readonly idProfesor = 3;

  form!: FormGroup;

  // Modo edicion
  modoEdicion = false;
  idAviso: number | null = null;

  // Estado UI
  cargando = false;        // cargando datos en modo edicion
  guardando = false;
  errorGlobal = '';
  enviado = false;

  // Foto
  archivoFoto?: File;
  previewFoto?: string;       // dataURL para vista previa local
  fotoExistente?: string;     // url de la foto ya guardada (modo edicion)

  ngOnInit(): void {
    this.construirForm();

    // Detectar modo edicion por el parametro :id de la ruta
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.modoEdicion = true;
      this.idAviso = Number(idParam);
      this.cargarAviso(this.idAviso);
    }
  }

  construirForm(): void {
    this.form = this.fb.group({
      titulo:      ['', [Validators.required, Validators.maxLength(150)]],
      descripcion: ['', [Validators.required, Validators.maxLength(5000)]],
      fechaEvento: ['', Validators.required],
      horaEvento:  ['']   // opcional
    });
  }

  // US-19: precargar datos del aviso a editar
  cargarAviso(id: number): void {
    this.cargando = true;
    this.avisoSrv.obtener(id).subscribe({
      next: aviso => {
        this.form.patchValue({
          titulo:      aviso.titulo,
          descripcion: aviso.descripcion,
          fechaEvento: aviso.fechaEvento,
          // recortar segundos: el input time usa HH:mm
          horaEvento:  aviso.horaEvento ? aviso.horaEvento.substring(0, 5) : ''
        });
        this.fotoExistente = aviso.fotoUrl ?? undefined;
        this.cargando = false;
      },
      error: err => {
        this.cargando = false;
        this.errorGlobal = err.mensajeAmigable ?? 'No se pudo cargar el aviso.';
      }
    });
  }

  // ── Foto ─────────────────────────────────────────────
  onFotoSeleccionada(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const tiposValidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposValidos.includes(file.type)) {
      this.errorGlobal = 'Solo se permiten imagenes JPG, PNG o WEBP.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorGlobal = 'La imagen no puede superar 5 MB.';
      return;
    }

    this.archivoFoto = file;
    this.errorGlobal = '';
    const reader = new FileReader();
    reader.onload = e => this.previewFoto = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  quitarFoto(): void {
    this.archivoFoto = undefined;
    this.previewFoto = undefined;
    // En edicion, quitar la preview no borra la foto existente del servidor;
    // solo significa "no subo una nueva". Para borrarla del todo haria falta
    // un endpoint extra, fuera del alcance de este ticket.
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } } as unknown as Event;
      this.onFotoSeleccionada(fakeEvent);
    }
  }

  // ── Submit ───────────────────────────────────────────
  enviar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorGlobal = 'Completa los campos obligatorios.';
      return;
    }

    const v = this.form.getRawValue();
    const request: AvisoRequest = {
      idProfesor:  this.idProfesor,
      titulo:      v.titulo.trim(),
      descripcion: v.descripcion.trim(),
      fechaEvento: v.fechaEvento,
      horaEvento:  v.horaEvento ? v.horaEvento + ':00' : undefined
    };

    this.guardando = true;
    this.errorGlobal = '';

    const op = this.modoEdicion && this.idAviso !== null
      ? this.avisoSrv.actualizar(this.idAviso, request, this.archivoFoto)
      : this.avisoSrv.crear(request, this.archivoFoto);

    op.subscribe({
      next: () => {
        this.guardando = false;
        this.enviado = true;
        // Tras un breve instante, redirigir a "mis avisos"
        setTimeout(() => this.router.navigate(['/avisos/mis-avisos']), 1200);
      },
      error: err => {
        this.guardando = false;
        this.errorGlobal = err.mensajeAmigable ?? 'Error al guardar el aviso.';
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/avisos/mis-avisos']);
  }

  // ── Helpers template ────────────────────────────────
  campo(name: string) { return this.form.get(name); }
  invalido(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && c.touched;
  }

  formatBytes(b: number): string {
    return b < 1024 * 1024
      ? (b / 1024).toFixed(1) + ' KB'
      : (b / 1024 / 1024).toFixed(1) + ' MB';
  }

  // ── Helpers para el PREVIEW en vivo ─────────────────
  // Imagen a mostrar en la nota: la nueva preview o, en edicion, la existente
  get previewImagen(): string | undefined {
    return this.previewFoto ?? this.fotoExistente;
  }

  // Fecha formateada para el preview (sin depender del backend)
  get previewFecha(): string {
    const f = this.form.get('fechaEvento')?.value;
    if (!f) return 'Fecha del evento';
    const d = new Date(f + 'T00:00:00');
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  get previewHora(): string {
    const h = this.form.get('horaEvento')?.value;
    return h ? `· ${h}` : '';
  }
}