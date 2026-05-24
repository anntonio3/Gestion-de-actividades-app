import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { Rol, ROL_ICONO, ROL_LABEL, UsuarioResponse } from '../../../../core/models/usuario.model';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './lista-usuarios.component.html',
  styleUrl: './lista-usuarios.component.css'
})
export class ListaUsuariosComponent implements OnInit {

  private readonly service = inject(UsuarioService);
  private readonly route   = inject(ActivatedRoute);

  // Datos
  usuarios: UsuarioResponse[] = [];
  cargando  = true;
  error     = '';

  // Filtros
  busqueda    = '';
  filtroRol   = '';
  filtroActivo = '';

  // Estado de cambio de toggle
  cambiandoEstadoId: number | null = null;

  // Toast
  toastMensaje = '';
  toastTipo: 'exito' | 'error' = 'exito';
  toastVisible = false;

  // Debounce para el buscador
  private readonly busquedaSubject = new Subject<string>();

  ngOnInit(): void {
    this.cargar();

    // Mostrar toast si viene del formulario con éxito
    const exito = this.route.snapshot.queryParamMap.get('exito');
    if (exito === 'creado') {
      this.mostrarToast('Usuario registrado correctamente', 'exito');
    } else if (exito === 'editado') {
      this.mostrarToast('Usuario actualizado correctamente', 'exito');
    }

    // Aplicar debounce al buscador para no disparar una llamada por cada tecla
    this.busquedaSubject.pipe(debounceTime(300)).subscribe(() => this.cargar());
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';

    const filtros: { rol?: Rol; activo?: boolean; q?: string } = {};
    if (this.filtroRol)    filtros.rol    = this.filtroRol as Rol;
    if (this.filtroActivo) filtros.activo = this.filtroActivo === 'true';
    if (this.busqueda)     filtros.q      = this.busqueda;

    this.service.listar(filtros).subscribe({
      next: data => {
        this.usuarios = data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la lista de usuarios. Intenta de nuevo.';
        this.cargando = false;
      }
    });
  }

  onBusqueda(): void {
    this.busquedaSubject.next(this.busqueda);
  }

  toggleEstado(usuario: UsuarioResponse): void {
    this.cambiandoEstadoId = usuario.idUsuario;
    const nuevoEstado = !usuario.activo;

    this.service.cambiarEstado(usuario.idUsuario, nuevoEstado).subscribe({
      next: () => {
        // Actualizar en memoria sin recargar toda la lista
        const idx = this.usuarios.findIndex(u => u.idUsuario === usuario.idUsuario);
        if (idx !== -1) {
          this.usuarios[idx] = { ...this.usuarios[idx], activo: nuevoEstado };
        }
        this.cambiandoEstadoId = null;
        this.mostrarToast(
          nuevoEstado
            ? `${usuario.nombre} activado correctamente`
            : `${usuario.nombre} desactivado`,
          'exito'
        );
      },
      error: err => {
        this.cambiandoEstadoId = null;
        const mensaje = err.error?.mensaje ?? 'No se pudo cambiar el estado.';
        this.mostrarToast(mensaje, 'error');
      }
    });
  }

  // ─── Stats del header ────────────────────────────────────
  get totalUsuarios():  number { return this.usuarios.length; }
  get totalActivos():   number { return this.usuarios.filter(u => u.activo).length; }
  get totalAdmins():    number { return this.usuarios.filter(u => u.rol === 'ADMIN').length; }
  get totalProfesores():number { return this.usuarios.filter(u => u.rol === 'PROFESOR').length; }

  // ─── Helpers de UI ───────────────────────────────────────
  getRolLabel(rol: Rol): string  { return ROL_LABEL[rol]; }
  getRolIcono(rol: Rol): string  { return ROL_ICONO[rol]; }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  private mostrarToast(mensaje: string, tipo: 'exito' | 'error'): void {
    this.toastMensaje  = mensaje;
    this.toastTipo     = tipo;
    this.toastVisible  = true;
    setTimeout(() => this.toastVisible = false, 3000);
  }
}
