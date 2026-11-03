import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.resolve(DATA_DIR, 'audit_database.sqlite');

export const db = new DatabaseSync(DB_PATH);

// Configurar modo WAL de alto rendimiento y concurrencia
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;
  PRAGMA cache_size = -64000;
  PRAGMA temp_store = MEMORY;
`);

// Inicializar tablas e índices de optimización extrema
db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    numero INTEGER,
    type TEXT NOT NULL,
    fecha_cierre TEXT,
    year_cycle INTEGER,
    fecha_recepcion TEXT,
    fecha_entrega TEXT,
    nombre_paciente TEXT NOT NULL,
    nap TEXT NOT NULL,
    ars TEXT NOT NULL,
    nota TEXT,
    cobertura REAL DEFAULT 0,
    monto_glosado REAL DEFAULT 0,
    a_pagar REAL DEFAULT 0,
    current_stage TEXT NOT NULL,
    lote_id TEXT,
    lote_codigo TEXT,
    conciliado_admin INTEGER DEFAULT 0,
    conciliado_por TEXT,
    conciliado_en TEXT,
    auditor_asignado_id TEXT,
    auditor_asignado_nombre TEXT,
    auditor_confirmado INTEGER DEFAULT 0,
    auditor_confirmado_en TEXT,
    auditoria_procesada INTEGER DEFAULT 0,
    auditoria_procesada_en TEXT,
    reporte_auditoria TEXT,
    recepcion_auditores_confirmada INTEGER DEFAULT 0,
    recepcion_auditores_por TEXT,
    recepcion_auditores_en TEXT,
    tiene_pendiente_biopsia INTEGER DEFAULT 0,
    detalle_pendiente TEXT,
    medico_tratante TEXT,
    veces_enviada_biopsia INTEGER DEFAULT 1,
    descripcion_biopsia TEXT,
    biopsia_completada INTEGER DEFAULT 0,
    biopsia_completada_en TEXT,
    biopsia_completada_por TEXT,
    entregado_ars_por TEXT,
    entregado_ars_en TEXT,
    recibido_ars_por TEXT,
    entregado_facturacion_por TEXT,
    entregado_facturacion_en TEXT,
    facturacion_confirmada INTEGER DEFAULT 0,
    facturacion_confirmada_por TEXT,
    facturacion_confirmada_en TEXT,
    notes_history TEXT DEFAULT '[]',
    stage_history TEXT DEFAULT '[]',
    created_at TEXT,
    created_by TEXT,
    updated_at TEXT,
    updated_by TEXT
  );

  -- Índices B-Tree para búsqueda instantánea en microsegundos
  CREATE INDEX IF NOT EXISTS idx_records_type_stage ON records(type, current_stage);
  CREATE INDEX IF NOT EXISTS idx_records_year ON records(year_cycle);
  CREATE INDEX IF NOT EXISTS idx_records_ars ON records(ars);
  CREATE INDEX IF NOT EXISTS idx_records_nap ON records(nap);
  CREATE INDEX IF NOT EXISTS idx_records_paciente ON records(nombre_paciente);
  CREATE INDEX IF NOT EXISTS idx_records_fecha ON records(fecha_cierre);
  CREATE INDEX IF NOT EXISTS idx_records_lote ON records(lote_id);

  CREATE TABLE IF NOT EXISTS ars_config (
    ars_name TEXT PRIMARY KEY,
    short_name TEXT NOT NULL,
    dias_vigencia INTEGER NOT NULL DEFAULT 60,
    updated_at TEXT,
    updated_by TEXT
  );

  CREATE TABLE IF NOT EXISTS batches (
    id TEXT PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    ars TEXT NOT NULL,
    etapa TEXT NOT NULL,
    fecha_ciclo TEXT NOT NULL,
    year_cycle INTEGER,
    fecha_entrega TEXT,
    estado TEXT NOT NULL,
    descripcion TEXT,
    creado_por TEXT,
    creado_en TEXT,
    entregado_por TEXT,
    recibido_por TEXT,
    notas TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_batches_tipo ON batches(tipo);
  CREATE INDEX IF NOT EXISTS idx_batches_year ON batches(year_cycle);

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    role_name TEXT,
    role_badge_color TEXT,
    department TEXT,
    avatar TEXT,
    permissions TEXT NOT NULL,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS annual_closures (
    year INTEGER PRIMARY KEY,
    closed_at TEXT,
    closed_by TEXT,
    total_records INTEGER DEFAULT 0,
    total_cobertura REAL DEFAULT 0,
    total_glosado REAL DEFAULT 0,
    total_a_pagar REAL DEFAULT 0,
    status TEXT DEFAULT 'ABIERTO',
    notes TEXT
  );
`);

// Migración segura de columnas nuevas si la base de datos ya existía
const newColumns = [
  ['medico_tratante', 'TEXT'],
  ['veces_enviada_biopsia', 'INTEGER DEFAULT 1'],
  ['descripcion_biopsia', 'TEXT'],
  ['biopsia_completada', 'INTEGER DEFAULT 0'],
  ['biopsia_completada_en', 'TEXT'],
  ['biopsia_completada_por', 'TEXT'],
  ['entregado_ars_por', 'TEXT'],
  ['entregado_ars_en', 'TEXT'],
  ['recibido_ars_por', 'TEXT'],
  ['entregado_facturacion_por', 'TEXT'],
  ['entregado_facturacion_en', 'TEXT']
];

const existingCols = new Set(
  db.prepare(`PRAGMA table_info(records)`).all().map(c => c.name)
);

for (const [colName, colType] of newColumns) {
  if (!existingCols.has(colName)) {
    try {
      db.exec(`ALTER TABLE records ADD COLUMN ${colName} ${colType};`);
    } catch (e) {
      // Ignorar si ya existe
    }
  }
}

console.log('[DB] Base de datos SQLite inicializada en:', DB_PATH);
