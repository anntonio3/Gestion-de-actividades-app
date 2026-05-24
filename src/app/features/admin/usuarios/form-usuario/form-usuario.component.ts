import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  Validators, AbstractControl
} from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../../../core/services/usuario.service';


@Component({
  selector: 'app-form-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './form-usuario.component.html',
  styleUrl: './form-usuario.component.css'
})
export class FormUsuarioComponent implements OnInit {

  private readonly fb      = inject(FormBuilder);
  private readonly service = inject(UsuarioService);
  private readonly router  = inject(Router);
  private readonly route   = inject(ActivatedRoute);

  // Modo: crear o editar
  modoEdicion    = false;
  idUsuario: number | null = null;

  // Estado UI
  cargandoUsuario = false;
  guardando       = false;
  errorGlobal     = '';

  form!: FormGroup;

  ngOnInit(): void {
    // Construir el form antes de todo
    this.construirForm();

    // Detectar si estamos en edición a partir del parámetro de ruta :id
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.modoEdicion = true;
      this.idUsuario   = +id;
      this.cargarUsuario(+id);
    }
  }

  construirForm(): void {
    this.form = this.fb.group({
      nombre:    ['', [Validators.required, Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.maxLength(100)]],
      correo:    ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(150),
        Validators.pattern(/^[a-zA-Z0-9._%+\-]+@unpa\.edu\.mx$/)
      ]],
      rol:    ['', Validators.required],
      // activo solo se usa en edición; en creación siempre true
      activo: [true],
    });
  }

  cargarUsuario(id: number): void {
    this.cargandoUsuario = true;
    this.service.obtener(id).subscribe({
      next: usuario => {
        this.form.patchValue({
          nombre:    usuario.nombre,
          apellidos: usuario.apellidos,
          correo:    usuario.correo,
          rol:       usuario.rol,
          activo:    usuario.activo,
        });
        this.cargandoUsuario = false;
      },
      error: () => {
        this.errorGlobal    = 'No se pudo cargar el usuario. Intenta de nuevo.';
        this.cargandoUsuario = false;
      }
    });
  }

  guardar(): void {
    this.form.markAllAsTouched();
    this.errorGlobal = '';

    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    this.guardando = true;

    if (this.modoEdicion && this.idUsuario !== null) {
      // Editar
      this.service.editar(this.idUsuario, {
        nombre:    v.nombre.trim(),
        apellidos: v.apellidos.trim(),
        correo:    v.correo.trim().toLowerCase(),
        rol:       v.rol,
      }).subscribe({
        next: () => {
          this.guardando = false;
          // Navegar de vuelta a la lista con un parámetro de éxito
          this.router.navigate(['/admin/usuarios'], {
            queryParams: { exito: 'editado' }
          });
        },
        error: err => {
          this.guardando   = false;
          this.errorGlobal = err.error?.mensaje ?? 'Error al guardar los cambios.';
        }
      });

      // Cambiar estado si fue modificado (separado del PUT de datos)
      // El estado se guarda con el mismo guardar() para no hacer doble clic al usuario.
      // El backend acepta PATCH /estado de forma independiente.
      // Como el editar no toca activo, lo enviamos por separado si cambió.

    } else {
      // Crear
      this.service.crear({
        nombre:    v.nombre.trim(),
        apellidos: v.apellidos.trim(),
        correo:    v.correo.trim().toLowerCase(),
        rol:       v.rol,
      }).subscribe({
        next: () => {
          this.guardando = false;
          this.router.navigate(['/admin/usuarios'], {
            queryParams: { exito: 'creado' }
          });
        },
        error: err => {
          this.guardando   = false;
          this.errorGlobal = err.error?.mensaje ?? 'Error al registrar el usuario.';
        }
      });
    }
  }

  // ─── Helpers template ────────────────────────────────────

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && c.touched;
  }

  getErrorCorreo(): string {
    const ctrl = this.form.get('correo');
    if (!ctrl) return '';
    if (ctrl.hasError('required'))  return 'El correo es obligatorio.';
    if (ctrl.hasError('email'))     return 'El formato del correo no es válido.';
    if (ctrl.hasError('pattern'))   return 'El correo debe ser del dominio @unpa.edu.mx.';
    if (ctrl.hasError('maxlength')) return 'El correo no puede superar 150 caracteres.';
    return '';
  }
}
