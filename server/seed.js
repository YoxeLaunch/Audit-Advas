import { db } from './db.js';

export const DEFAULT_ARS_CONFIG = [];

export function seedInitialDataIfEmpty() {
  // Limpiar cualquier registro ficticio de prueba de estrés si existiera
  try {
    db.prepare(`DELETE FROM records WHERE id LIKE 'rec_stress_%'`).run();
  } catch (e) {
    console.warn('Error verificando tabla records:', e);
  }
  // El sistema inicia 100% limpio desde cero (sin usuarios, aseguradoras ni pacientes precargados).
  // Al abrir la aplicación por primera vez, el asistente inicial permite crear el usuario
  // Administrador Root, configurar las Aseguradoras (ARS) y registrar usuarios y expedientes desde cero.
}
