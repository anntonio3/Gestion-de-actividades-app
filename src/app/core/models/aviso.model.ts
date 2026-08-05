export interface Aviso {
  idAviso: number;
  titulo: string;
  descripcion: string;
  fechaEvento: string;        // 'YYYY-MM-DD'
  horaEvento?: string | null; // 'HH:mm:ss' o null
  fotoUrl?: string | null;

  idProfesor: number;
  nombreProfesor: string;

  fechaPublicacion: string;
  fechaActualizacion: string;
}

// Request para crear/editar (US-17/US-19)
export interface AvisoRequest {
  idProfesor: number;
  titulo: string;
  descripcion: string;
  fechaEvento: string;
  horaEvento?: string | null;
}

// ─── Paleta de "papeles" para el tablero ───
// Cada aviso recibe un color rotando por idAviso % N para que se vea
// variado pero consistente entre recargas.
export const PAPELES_PASTEL = [
  { bg: '#fff4b3', sombra: '#e6dba0' }, // amarillo post-it
  { bg: '#ffd6e0', sombra: '#e8c1ca' }, // rosa
  { bg: '#cce5ff', sombra: '#b3d1ee' }, // azul
  { bg: '#d4f5d0', sombra: '#bce0b8' }, // verde menta
  { bg: '#ffe0c2', sombra: '#e8c8a8' }, // durazno
];

// Colores de chincheta rotando para variar
export const CHINCHETAS = ['#e05c5c', '#71B6A7', '#e8a04a', '#2D5F58'];

// Estilos de cinta washi
export const CINTAS = [
  'repeating-linear-gradient(45deg,#71B6A7 0 6px,#a8d5cc 6px 12px)',
  'repeating-linear-gradient(45deg,#e8a04a 0 6px,#f5d9a8 6px 12px)',
  'repeating-linear-gradient(45deg,#e05c5c 0 6px,#f5c2c2 6px 12px)',
];