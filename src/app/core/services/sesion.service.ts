import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginResponse } from '../models/auth.model';

// Clave usada en localStorage para persistir la sesion entre recargas
const SESION_KEY = 'unpa_sesion';

/**
 * Servicio de sesion.
 * Almacena el usuario autenticado en un signal reactivo y en localStorage
 * para que la sesion sobreviva a recargas de pagina.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {

  private readonly router = inject(Router);

  // Signal reactivo con el usuario actual (null = sin sesion)
  private readonly _usuario = signal<LoginResponse | null>(this.cargarDesdeStorage());

  // Computadas de solo lectura para los componentes
  readonly usuario    = this._usuario.asReadonly();
  readonly logueado   = computed(() => this._usuario() !== null);
  readonly esAdmin    = computed(() => this._usuario()?.tipo === 'ADMIN');
  readonly esProfesor = computed(() => this._usuario()?.tipo === 'PROFESOR');
  readonly esAlumno   = computed(() => this._usuario()?.tipo === 'ALUMNO');

  // ── Iniciar sesion ─────────────────────────────────────────────

  iniciarSesion(respuesta: LoginResponse): void {
    this._usuario.set(respuesta);
    localStorage.setItem(SESION_KEY, JSON.stringify(respuesta));
  }

  // ── Cerrar sesion ──────────────────────────────────────────────

  cerrarSesion(): void {
    this._usuario.set(null);
    localStorage.removeItem(SESION_KEY);
    this.router.navigate(['/auth/login']);
  }

  // ── Getters de compatibilidad (reemplazan los valores hardcodeados) ─

  getIdUsuario(): number {
    const u = this._usuario();
    if (!u) throw new Error('No hay sesion activa');
    return u.id;
  }

  /** Devuelve el id del profesor autenticado. Lanza error si no es PROFESOR. */
  getIdProfesor(): number {
    const u = this._usuario();
    if (!u || u.tipo !== 'PROFESOR') throw new Error('El usuario no es PROFESOR');
    return u.id;
  }

  /** Devuelve el id del admin autenticado. Lanza error si no es ADMIN. */
  getIdAdmin(): number {
    const u = this._usuario();
    if (!u || u.tipo !== 'ADMIN') throw new Error('El usuario no es ADMIN');
    return u.id;
  }

  getNombreAdmin(): string {
    const u = this._usuario();
    return u ? `${u.nombre} ${u.apellidos}` : 'Admin';
  }

  getNombreUsuario(): string {
    const u = this._usuario();
    return u ? `${u.nombre} ${u.apellidos}` : '';
  }

  getNombreCorto(): string {
    const u = this._usuario();
    if (!u) return '';
    // Toma solo el primer apellido para que no sea tan largo en el navbar
    const apellidoCorto = u.apellidos?.split(' ')[0] ?? '';
    return `${u.nombre} ${apellidoCorto}.`;
  }

  getInicialesAdmin(): string {
    return this._usuario()?.iniciales ?? 'AD';
  }

  getIniciales(): string {
    return this._usuario()?.iniciales ?? '';
  }

  // ── Persistencia ───────────────────────────────────────────────

  private cargarDesdeStorage(): LoginResponse | null {
    try {
      const raw = localStorage.getItem(SESION_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as LoginResponse;

      // Validacion minima: si el objeto no tiene los campos esperados
      // (por ejemplo, viene de una sesion del sistema anterior sin "tipo"),
      // lo descartamos para forzar un nuevo login limpio.
      if (!parsed.id || !parsed.tipo || !parsed.nombre) {
        localStorage.removeItem(SESION_KEY);
        return null;
      }

      return parsed;
    } catch {
      localStorage.removeItem(SESION_KEY);
      return null;
    }
  }
}