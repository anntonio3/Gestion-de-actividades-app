import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { InmobiliarioService } from '../../../core/services/inmobiliario.service';
import { InmobiliarioRequest, InmobiliarioResponse } from '../../../core/models/inmobiliario.model';

type ModoModal = 'crear' | 'editar' | 'detalle';

const FORM_VACIO: InmobiliarioRequest = {
  nombre: '', descripcion: '', codigo: '',
  numInventario: '', existencias: 0, disponibles: 0, nota: ''
};

@Component({
  selector: 'app-inmobiliario',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './inmobiliario.component.html',
  styleUrls: ['./inmobiliario.component.css']
})
export class InmobiliarioComponent implements OnInit {

  // Lista
  lista:    InmobiliarioResponse[] = [];
  cargando = true;
  error    = '';
  busqueda = '';

  // Modal
  modalAbierto = false;
  modoModal: ModoModal = 'detalle';
  seleccionado: InmobiliarioResponse | null = null;

  // Formulario
  form: InmobiliarioRequest = { ...FORM_VACIO };
  fotoArchivo: File | undefined = undefined;
  fotoPreview: string | null = null;
  guardando  = false;
  errorForm  = '';
  exitoForm  = false;

  // Confirmación de baja
  confirmandoBaja = false;

  // FIX 4: confirmación al intentar cerrar en modo editar/crear
  confirmandoCierre = false;

  constructor(private inmobiliarioService: InmobiliarioService) {}

  ngOnInit(): void { this.cargarLista(); }

  // ── Carga / búsqueda ─────────────────────────────────────

  cargarLista(): void {
    this.cargando = true;
    this.error = '';
    this.inmobiliarioService.listar(this.busqueda).subscribe({
      next:  data => { this.lista = data; this.cargando = false; },
      error: ()   => { this.error = 'No se pudo cargar el inmobiliario. Intenta de nuevo.'; this.cargando = false; }
    });
  }

  buscar(): void { this.cargarLista(); }

  limpiarBusqueda(): void { this.busqueda = ''; this.cargarLista(); }

  // ── Apertura de modal ────────────────────────────────────

  abrirCrear(): void {
    this.form             = { ...FORM_VACIO };
    this.fotoArchivo      = undefined;
    this.fotoPreview      = null;
    this.errorForm        = '';
    this.exitoForm        = false;
    this.confirmandoBaja  = false;
    this.confirmandoCierre = false;
    this.modoModal        = 'crear';
    this.modalAbierto     = true;
  }

  abrirDetalle(item: InmobiliarioResponse): void {
    this.seleccionado      = item;
    this.confirmandoBaja   = false;
    this.confirmandoCierre = false;
    this.exitoForm         = false;
    this.errorForm         = '';
    this.modoModal         = 'detalle';
    this.modalAbierto      = true;
  }

  pasarAEditar(): void {
    if (!this.seleccionado) return;
    this.form = {
      nombre:        this.seleccionado.nombre,
      descripcion:   this.seleccionado.descripcion  ?? '',
      codigo:        this.seleccionado.codigo        ?? '',
      numInventario: this.seleccionado.numInventario ?? '',
      existencias:   this.seleccionado.existencias,
      disponibles:   this.seleccionado.disponibles,
      nota:          this.seleccionado.nota          ?? ''
    };
    this.fotoArchivo       = undefined;
    this.fotoPreview       = this.seleccionado.fotoUrl ?? null;
    this.errorForm         = '';
    this.exitoForm         = false;
    this.confirmandoCierre = false;
    this.modoModal         = 'editar';
  }

  // FIX 4: overlay click — no cierra si está en formulario
  cerrarModal(e?: MouseEvent): void {
    if (e && !(e.target as HTMLElement).classList.contains('modal-overlay')) return;
    if (this.modoModal === 'crear' || this.modoModal === 'editar') return;
    this.modalAbierto = false;
    this.seleccionado = null;
  }

  // FIX 4: botón X — confirmación solo si el usuario ya escribió algo
  intentarCerrar(): void {
    if ((this.modoModal === 'crear' || this.modoModal === 'editar') && this.formTieneContenido()) {
      this.confirmandoCierre = true;
    } else {
      this.modalAbierto = false;
      this.seleccionado = null;
    }
  }

  private formTieneContenido(): boolean {
    return !!(
      this.form.nombre.trim()         ||
      this.form.descripcion?.trim()   ||
      this.form.codigo?.trim()        ||
      this.form.numInventario?.trim() ||
      this.form.nota?.trim()          ||
      this.fotoArchivo
    );
  }

  confirmarCierre(): void {
    this.confirmandoCierre = false;
    this.modalAbierto      = false;
    this.seleccionado      = null;
  }

  cancelarCierre(): void {
    this.confirmandoCierre = false;
  }

  // ── Foto ─────────────────────────────────────────────────

  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const archivo = input.files[0];
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      this.errorForm = 'Solo se permiten imágenes JPG, PNG o WEBP.'; return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      this.errorForm = 'La imagen no debe superar los 5 MB.'; return;
    }
    this.errorForm   = '';
    this.fotoArchivo = archivo;
    const reader = new FileReader();
    reader.onload = e => this.fotoPreview = e.target?.result as string;
    reader.readAsDataURL(archivo);
  }

  quitarFoto(): void { this.fotoArchivo = undefined; this.fotoPreview = null; }

  // ── Guardar ──────────────────────────────────────────────

  guardar(): void {
    if (!this.validarForm()) return;

    // FIX 1: bloquear si ya está guardando
    if (this.guardando) return;

    this.guardando = true;
    this.errorForm = '';

    const esCrear = this.modoModal === 'crear';
    const operacion = esCrear
      ? this.inmobiliarioService.crear(this.form, this.fotoArchivo)
      : this.inmobiliarioService.actualizar(this.seleccionado!.idRecurso, this.form, this.fotoArchivo);

    operacion.subscribe({
      next: resultado => {
        this.guardando = false;

        if (esCrear) {
          // FIX 1: cerrar modal y agregar a lista al registrar
          this.lista.unshift(resultado);
          this.modalAbierto = false;
          this.seleccionado = null;
        } else {
          const idx = this.lista.findIndex(i => i.idRecurso === resultado.idRecurso);
          if (idx !== -1) this.lista[idx] = resultado;
          this.seleccionado = resultado;
          this.modoModal    = 'detalle';
          this.exitoForm    = true;
          setTimeout(() => this.exitoForm = false, 3000);
        }
      },
      error: err => {
        this.guardando = false;
        this.errorForm = err.status === 400
          ? (err.error?.message ?? 'Datos inválidos. Revisa los campos.')
          : 'Error al guardar. Intenta de nuevo.';
      }
    });
  }

  // ── Baja lógica ──────────────────────────────────────────

  confirmarBaja(): void  { this.confirmandoBaja = true; }
  cancelarBaja(): void   { this.confirmandoBaja = false; }

  ejecutarBaja(): void {
    if (!this.seleccionado) return;
    this.guardando = true;
    this.inmobiliarioService.desactivar(this.seleccionado.idRecurso).subscribe({
      next: () => {
        this.lista        = this.lista.filter(i => i.idRecurso !== this.seleccionado!.idRecurso);
        this.guardando    = false;
        this.modalAbierto = false;
        this.seleccionado = null;
      },
      error: () => {
        this.guardando = false;
        this.errorForm = 'Error al dar de baja. Intenta de nuevo.';
      }
    });
  }

  // ── Validación ───────────────────────────────────────────

  private validarForm(): boolean {
    if (!this.form.nombre.trim()) {
      this.errorForm = 'El nombre del producto es obligatorio.'; return false;
    }
    if (this.form.existencias < 0) {
      this.errorForm = 'Las existencias no pueden ser negativas.'; return false;
    }
    if (this.form.disponibles < 0) {
      this.errorForm = 'Los disponibles no pueden ser negativos.'; return false;
    }
    if (this.form.disponibles > this.form.existencias) {
      this.errorForm = 'Los disponibles no pueden superar las existencias.'; return false;
    }
    return true;
  }

  // ── Helpers de UI ────────────────────────────────────────

  get totalDisponibles(): number {
    return this.lista.reduce((sum, i) => sum + i.disponibles, 0);
  }

  stockClass(item: InmobiliarioResponse): string {
    const pct = item.existencias === 0 ? 0 : item.disponibles / item.existencias;
    if (pct === 0)   return 'stock-agotado';
    if (pct <= 0.25) return 'stock-bajo';
    return 'stock-ok';
  }

  tieneNota(item: InmobiliarioResponse): boolean {
    return !!(item.nota?.trim());
  }
}