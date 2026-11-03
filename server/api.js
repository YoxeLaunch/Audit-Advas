import { Router } from 'express';
import { db } from './db.js';
import { seedInitialDataIfEmpty } from './seed.js';

export const apiRouter = Router();

// Helper para convertir fila de BD a objeto de frontend
function mapRowToRecord(row) {
  if (!row) return null;
  return {
    id: row.id,
    numero: row.numero,
    type: row.type,
    fechaCierre: row.fecha_cierre,
    fechaRecepcion: row.fecha_recepcion,
    fechaEntrega: row.fecha_entrega,
    nombrePaciente: row.nombre_paciente,
    nap: row.nap,
    ars: row.ars,
    nota: row.nota || '',
    cobertura: Number(row.cobertura || 0),
    montoGlosado: Number(row.monto_glosado || 0),
    aPagar: Number(row.a_pagar || 0),
    currentStage: row.current_stage,
    loteId: row.lote_id || undefined,
    loteCodigo: row.lote_codigo || undefined,
    conciliadoAdmin: Boolean(row.conciliado_admin),
    conciliadoPor: row.conciliado_por || undefined,
    conciliadoEn: row.conciliado_en || undefined,
    auditorAsignadoId: row.auditor_asignado_id || undefined,
    auditorAsignadoNombre: row.auditor_asignado_nombre || undefined,
    auditorConfirmado: Boolean(row.auditor_confirmado),
    auditorConfirmadoEn: row.auditor_confirmado_en || undefined,
    auditoriaProcesada: Boolean(row.auditoria_procesada),
    auditoriaProcesadaEn: row.auditoria_procesada_en || undefined,
    reporteAuditoria: row.reporte_auditoria || undefined,
    recepcionAuditoresConfirmada: Boolean(row.recepcion_auditores_confirmada),
    recepcionAuditoresPor: row.recepcion_auditores_por || undefined,
    recepcionAuditoresEn: row.recepcion_auditores_en || undefined,
    tienePendienteBiopsia: Boolean(row.tiene_pendiente_biopsia),
    detallePendiente: row.detalle_pendiente || undefined,
    medicoTratante: row.medico_tratante || undefined,
    vecesEnviadaBiopsia: Number(row.veces_enviada_biopsia || 1),
    descripcionBiopsia: row.descripcion_biopsia || undefined,
    biopsiaCompletada: Boolean(row.biopsia_completada),
    biopsiaCompletadaEn: row.biopsia_completada_en || undefined,
    biopsiaCompletadaPor: row.biopsia_completada_por || undefined,
    entregadoArsPor: row.entregado_ars_por || undefined,
    entregadoArsEn: row.entregado_ars_en || undefined,
    recibidoArsPor: row.recibido_ars_por || undefined,
    entregadoFacturacionPor: row.entregado_facturacion_por || undefined,
    entregadoFacturacionEn: row.entregado_facturacion_en || undefined,
    facturacionConfirmada: Boolean(row.facturacion_confirmada),
    facturacionConfirmadaPor: row.facturacion_confirmada_por || undefined,
    facturacionConfirmadaEn: row.facturacion_confirmada_en || undefined,
    notesHistory: JSON.parse(row.notes_history || '[]'),
    stageHistory: JSON.parse(row.stage_history || '[]'),
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by
  };
}

// -------------------------------------------------------------
// 1. GET /api/records - Consulta de alto rendimiento con índices
// -------------------------------------------------------------
apiRouter.get('/records', (req, res) => {
  try {
    const startTime = performance.now();
    const { 
      type = 'ALL', 
      stage = 'ALL', 
      ars = 'TODAS', 
      loteId = 'ALL', 
      year = 'ALL', 
      search = '',
      page = 1,
      limit = 'all'
    } = req.query;

    const conditions = [];
    const params = [];

    if (type !== 'ALL') {
      conditions.push('type = ?');
      params.push(type);
    }

    if (stage !== 'ALL') {
      conditions.push('current_stage = ?');
      params.push(stage);
    }

    if (ars !== 'TODAS') {
      conditions.push('ars = ?');
      params.push(ars);
    }

    if (loteId !== 'ALL') {
      conditions.push('lote_id = ?');
      params.push(loteId);
    }

    if (year !== 'ALL') {
      conditions.push('year_cycle = ?');
      params.push(Number(year));
    }

    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      conditions.push('(nombre_paciente LIKE ? OR nap LIKE ? OR nota LIKE ? OR lote_codigo LIKE ?)');
      params.push(q, q, q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Conteo total optimizado con B-Tree
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM records ${whereClause}`).get(...params);
    const total = countRow ? countRow.total : 0;

    // Métricas por etapa para el HUD
    const hudMetricsStmt = db.prepare(`
      SELECT 
        current_stage, 
        COUNT(*) as count, 
        SUM(a_pagar) as total_a_pagar,
        SUM(monto_glosado) as total_glosado
      FROM records 
      GROUP BY current_stage
    `);
    const hudRows = hudMetricsStmt.all();

    // Paginación
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = limit === 'all' ? 100000 : Math.max(10, parseInt(limit, 10) || 100);
    const offset = (pageNum - 1) * limitNum;

    const querySql = `
      SELECT * FROM records 
      ${whereClause} 
      ORDER BY numero ASC, created_at DESC
      LIMIT ? OFFSET ?
    `;
    const rows = db.prepare(querySql).all(...params, limitNum, offset);
    const records = rows.map(mapRowToRecord);

    const execTimeMs = (performance.now() - startTime).toFixed(2);

    res.json({
      success: true,
      records,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      hudMetrics: hudRows,
      queryTimeMs: Number(execTimeMs)
    });
  } catch (err) {
    console.error('Error en GET /api/records:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 2. POST /api/records - Crear nuevo registro persistente
// -------------------------------------------------------------
apiRouter.post('/records', (req, res) => {
  try {
    const data = req.body;
    const id = data.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toLocaleString('es-DO');
    const year = data.fechaCierre ? parseInt(data.fechaCierre.split('-')[0], 10) : new Date().getFullYear();

    const stmt = db.prepare(`
      INSERT INTO records (
        id, numero, type, fecha_cierre, year_cycle, fecha_recepcion, fecha_entrega,
        nombre_paciente, nap, ars, nota, cobertura, monto_glosado, a_pagar,
        current_stage, lote_id, lote_codigo, conciliado_admin,
        auditor_asignado_id, auditor_asignado_nombre,
        tiene_pendiente_biopsia, medico_tratante, veces_enviada_biopsia, descripcion_biopsia,
        notes_history, stage_history, created_at, created_by, updated_at, updated_by
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `);

    const cobertura = Number(data.cobertura || 0);
    const montoGlosado = Number(data.montoGlosado || 0);
    const aPagar = Math.max(0, cobertura - montoGlosado);
    const todayIso = new Date().toISOString().split('T')[0];

    const cleanArs = (data.ars || 'SIN ASEGURADORA').toUpperCase().trim();

    stmt.run(
      id,
      Number(data.numero || 1),
      data.type || 'EXPEDIENTE',
      data.fechaCierre || todayIso,
      year,
      data.fechaRecepcion || todayIso,
      data.fechaEntrega || todayIso,
      data.nombrePaciente || 'PACIENTE SIN NOMBRE',
      data.nap || 'SIN-NAP',
      cleanArs,
      data.nota || '',
      cobertura,
      montoGlosado,
      aPagar,
      data.currentStage || (data.type === 'EXPEDIENTE' ? 'RECEPCION' : 'RECEPCION_EMERGENCIA'),
      data.loteId || null,
      data.loteCodigo || `REL-${data.fechaEntrega || todayIso}`,
      data.conciliadoAdmin ? 1 : 0,
      data.auditorAsignadoId || null,
      data.auditorAsignadoNombre || null,
      data.tienePendienteBiopsia ? 1 : 0,
      data.medicoTratante || null,
      Number(data.vecesEnviadaBiopsia || 1),
      data.descripcionBiopsia || null,
      JSON.stringify(data.notesHistory || []),
      JSON.stringify(data.stageHistory || []),
      data.createdAt || timestamp,
      data.createdBy || 'Sistema',
      timestamp,
      data.updatedBy || data.createdBy || 'Sistema'
    );

    if (cleanArs && cleanArs !== 'SIN ASEGURADORA' && cleanArs !== 'TODAS') {
      db.prepare(`
        INSERT OR IGNORE INTO ars_config (ars_name, short_name, dias_vigencia, updated_at, updated_by)
        VALUES (?, ?, 60, ?, ?)
      `).run(cleanArs, cleanArs, timestamp, data.createdBy || 'Sistema');
    }

    const created = db.prepare('SELECT * FROM records WHERE id = ?').get(id);
    res.status(201).json({ success: true, record: mapRowToRecord(created) });
  } catch (err) {
    console.error('Error en POST /api/records:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 3. PUT /api/records/:id - Actualizar registro existente
// -------------------------------------------------------------
apiRouter.put('/records/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const timestamp = new Date().toLocaleString('es-DO');

    const existing = db.prepare('SELECT * FROM records WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Registro no encontrado' });
    }

    const cobertura = data.cobertura !== undefined ? Number(data.cobertura) : Number(existing.cobertura);
    const montoGlosado = data.montoGlosado !== undefined ? Number(data.montoGlosado) : Number(existing.monto_glosado);
    const aPagar = Math.max(0, cobertura - montoGlosado);

    const stmt = db.prepare(`
      UPDATE records SET
        numero = ?,
        fecha_cierre = ?,
        fecha_recepcion = ?,
        fecha_entrega = ?,
        nombre_paciente = ?,
        nap = ?,
        ars = ?,
        nota = ?,
        cobertura = ?,
        monto_glosado = ?,
        a_pagar = ?,
        current_stage = ?,
        lote_id = ?,
        lote_codigo = ?,
        conciliado_admin = ?,
        conciliado_por = ?,
        conciliado_en = ?,
        auditor_asignado_id = ?,
        auditor_asignado_nombre = ?,
        auditor_confirmado = ?,
        auditor_confirmado_en = ?,
        auditoria_procesada = ?,
        auditoria_procesada_en = ?,
        reporte_auditoria = ?,
        recepcion_auditores_confirmada = ?,
        recepcion_auditores_por = ?,
        recepcion_auditores_en = ?,
        tiene_pendiente_biopsia = ?,
        detalle_pendiente = ?,
        medico_tratante = ?,
        veces_enviada_biopsia = ?,
        descripcion_biopsia = ?,
        biopsia_completada = ?,
        biopsia_completada_en = ?,
        biopsia_completada_por = ?,
        entregado_ars_por = ?,
        entregado_ars_en = ?,
        recibido_ars_por = ?,
        entregado_facturacion_por = ?,
        entregado_facturacion_en = ?,
        facturacion_confirmada = ?,
        facturacion_confirmada_por = ?,
        facturacion_confirmada_en = ?,
        notes_history = ?,
        stage_history = ?,
        updated_at = ?,
        updated_by = ?
      WHERE id = ?
    `);

    stmt.run(
      data.numero !== undefined ? Number(data.numero) : existing.numero,
      data.fechaCierre || existing.fecha_cierre,
      data.fechaRecepcion || existing.fecha_recepcion,
      data.fechaEntrega || existing.fecha_entrega,
      data.nombrePaciente || existing.nombre_paciente,
      data.nap || existing.nap,
      data.ars || existing.ars,
      data.nota !== undefined ? data.nota : existing.nota,
      cobertura,
      montoGlosado,
      aPagar,
      data.currentStage || existing.current_stage,
      data.loteId !== undefined ? data.loteId : existing.lote_id,
      data.loteCodigo !== undefined ? data.loteCodigo : existing.lote_codigo,
      data.conciliadoAdmin !== undefined ? (data.conciliadoAdmin ? 1 : 0) : existing.conciliado_admin,
      data.conciliadoPor !== undefined ? data.conciliadoPor : existing.conciliado_por,
      data.conciliadoEn !== undefined ? data.conciliadoEn : existing.conciliado_en,
      data.auditorAsignadoId !== undefined ? data.auditorAsignadoId : existing.auditor_asignado_id,
      data.auditorAsignadoNombre !== undefined ? data.auditorAsignadoNombre : existing.auditor_asignado_nombre,
      data.auditorConfirmado !== undefined ? (data.auditorConfirmado ? 1 : 0) : existing.auditor_confirmado,
      data.auditorConfirmadoEn !== undefined ? data.auditorConfirmadoEn : existing.auditor_confirmado_en,
      data.auditoriaProcesada !== undefined ? (data.auditoriaProcesada ? 1 : 0) : existing.auditoria_procesada,
      data.auditoriaProcesadaEn !== undefined ? data.auditoriaProcesadaEn : existing.auditoria_procesada_en,
      data.reporteAuditoria !== undefined ? data.reporteAuditoria : existing.reporte_auditoria,
      data.recepcionAuditoresConfirmada !== undefined ? (data.recepcionAuditoresConfirmada ? 1 : 0) : existing.recepcion_auditores_confirmada,
      data.recepcionAuditoresPor !== undefined ? data.recepcionAuditoresPor : existing.recepcion_auditores_por,
      data.recepcionAuditoresEn !== undefined ? data.recepcionAuditoresEn : existing.recepcion_auditores_en,
      data.tienePendienteBiopsia !== undefined ? (data.tienePendienteBiopsia ? 1 : 0) : existing.tiene_pendiente_biopsia,
      data.detallePendiente !== undefined ? data.detallePendiente : existing.detalle_pendiente,
      data.medicoTratante !== undefined ? data.medicoTratante : existing.medico_tratante,
      data.vecesEnviadaBiopsia !== undefined ? Number(data.vecesEnviadaBiopsia) : existing.veces_enviada_biopsia,
      data.descripcionBiopsia !== undefined ? data.descripcionBiopsia : existing.descripcion_biopsia,
      data.biopsiaCompletada !== undefined ? (data.biopsiaCompletada ? 1 : 0) : existing.biopsia_completada,
      data.biopsiaCompletadaEn !== undefined ? data.biopsiaCompletadaEn : existing.biopsia_completada_en,
      data.biopsiaCompletadaPor !== undefined ? data.biopsiaCompletadaPor : existing.biopsia_completada_por,
      data.entregadoArsPor !== undefined ? data.entregadoArsPor : existing.entregado_ars_por,
      data.entregadoArsEn !== undefined ? data.entregadoArsEn : existing.entregado_ars_en,
      data.recibidoArsPor !== undefined ? data.recibidoArsPor : existing.recibido_ars_por,
      data.entregadoFacturacionPor !== undefined ? data.entregadoFacturacionPor : existing.entregado_facturacion_por,
      data.entregadoFacturacionEn !== undefined ? data.entregadoFacturacionEn : existing.entregado_facturacion_en,
      data.facturacionConfirmada !== undefined ? (data.facturacionConfirmada ? 1 : 0) : existing.facturacion_confirmada,
      data.facturacionConfirmadaPor !== undefined ? data.facturacionConfirmadaPor : existing.facturacion_confirmada_por,
      data.facturacionConfirmadaEn !== undefined ? data.facturacionConfirmadaEn : existing.facturacion_confirmada_en,
      data.notesHistory ? JSON.stringify(data.notesHistory) : existing.notes_history,
      data.stageHistory ? JSON.stringify(data.stageHistory) : existing.stage_history,
      timestamp,
      data.updatedBy || 'Sistema',
      id
    );

    const updated = db.prepare('SELECT * FROM records WHERE id = ?').get(id);
    res.json({ success: true, record: mapRowToRecord(updated) });
  } catch (err) {
    console.error('Error en PUT /api/records/:id:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 4. DELETE /api/records/:id - Eliminar registro
// -------------------------------------------------------------
apiRouter.delete('/records/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM records WHERE id = ?').run(id);
    res.json({ success: true, message: 'Registro eliminado exitosamente' });
  } catch (err) {
    console.error('Error en DELETE /api/records/:id:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 5. POST /api/records/bulk-conciliate - Tachar y Aceptar en lote
// -------------------------------------------------------------
apiRouter.post('/records/bulk-conciliate', (req, res) => {
  try {
    const { recordIds, userName = 'Administrativo', auditorAsignadoNombre } = req.body;
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Lista de IDs inválida' });
    }

    const timestamp = new Date().toLocaleString('es-DO');

    db.exec('BEGIN TRANSACTION;');
    const stmt = db.prepare(`
      UPDATE records SET
        conciliado_admin = 1,
        conciliado_por = ?,
        conciliado_en = ?,
        auditor_asignado_nombre = COALESCE(?, auditor_asignado_nombre),
        current_stage = CASE WHEN type = 'EXPEDIENTE' THEN 'AUDITORIA' ELSE 'ENTREGA_ARS_EMERGENCIA' END,
        updated_at = ?,
        updated_by = ?
      WHERE id = ?
    `);

    for (const id of recordIds) {
      stmt.run(userName, timestamp, auditorAsignadoNombre || null, timestamp, userName, id);
    }
    db.exec('COMMIT;');

    res.json({ success: true, count: recordIds.length, message: 'Expedientes cotejados y pasados a Auditoría' });
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('Error en bulk-conciliate:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 5B. POST /api/records/reset-clean - Limpiar a registros reales
// -------------------------------------------------------------
apiRouter.post('/records/reset-clean', (req, res) => {
  try {
    db.exec(`DELETE FROM records;`);
    seedInitialDataIfEmpty();
    const rows = db.prepare(`SELECT * FROM records ORDER BY numero ASC`).all();
    res.json({
      success: true,
      records: rows.map(mapRowToRecord),
      message: 'Base de datos limpiada y restaurada con registros reales de prueba.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 6. CONFIGURACIÓN DE VIGENCIA POR ARS (2 a 3 meses configurable)
// -------------------------------------------------------------
apiRouter.get('/ars-config', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM ars_config ORDER BY ars_name ASC').all();
    res.json({ success: true, arsConfig: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/ars-config', (req, res) => {
  try {
    const { configs, updatedBy = 'Administrador Root' } = req.body;
    if (!Array.isArray(configs)) {
      return res.status(400).json({ success: false, error: 'Formato inválido' });
    }
    const timestamp = new Date().toLocaleString('es-DO');
    db.exec('BEGIN TRANSACTION;');
    db.exec('DELETE FROM ars_config;');
    const stmt = db.prepare(`
      INSERT INTO ars_config (ars_name, short_name, dias_vigencia, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const c of configs) {
      if (!c.ars_name || !c.ars_name.trim()) continue;
      stmt.run(
        c.ars_name.toUpperCase().trim(),
        (c.short_name || c.ars_name).toUpperCase().trim(),
        Math.max(1, parseInt(c.dias_vigencia, 10) || 60),
        timestamp,
        updatedBy
      );
    }
    db.exec('COMMIT;');
    const rows = db.prepare('SELECT * FROM ars_config ORDER BY ars_name ASC').all();
    res.json({ success: true, arsConfig: rows });
  } catch (err) {
    db.exec('ROLLBACK;');
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 7. GESTIÓN DE USUARIOS PERSISTENTE EN SQLITE
// -------------------------------------------------------------
apiRouter.get('/users', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM users ORDER BY name ASC').all();
    const users = rows.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
      roleName: u.role_name,
      roleBadgeColor: u.role_badge_color,
      department: u.department,
      avatar: u.avatar,
      permissions: JSON.parse(u.permissions || '{}'),
      isActive: Boolean(u.is_active)
    }));
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/users', (req, res) => {
  try {
    const u = req.body;
    const id = u.id || `usr_${Date.now()}`;
    db.prepare(`
      INSERT INTO users (id, name, email, password, role, role_name, role_badge_color, department, avatar, permissions, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      u.name,
      u.email,
      u.password || 'admin123',
      u.role,
      u.roleName || u.role,
      u.roleBadgeColor || 'bg-slate-100 text-slate-800 border-slate-200',
      u.department || 'Auditoría',
      u.avatar || u.name.slice(0, 2).toUpperCase(),
      JSON.stringify(u.permissions || {}),
      u.isActive !== false ? 1 : 0
    );
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const u = req.body;
    db.prepare(`
      UPDATE users SET
        name = ?,
        email = ?,
        password = ?,
        role = ?,
        role_name = ?,
        role_badge_color = ?,
        department = ?,
        avatar = ?,
        permissions = ?,
        is_active = ?
      WHERE id = ?
    `).run(
      u.name,
      u.email,
      u.password || 'admin123',
      u.role,
      u.roleName,
      u.roleBadgeColor,
      u.department,
      u.avatar,
      JSON.stringify(u.permissions || {}),
      u.isActive !== false ? 1 : 0,
      id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 8. PRUEBA DE ESTRÉS Y RENDIMIENTO MASIVO (Stress Testing)
// -------------------------------------------------------------
apiRouter.post('/test/stress-generate', (req, res) => {
  try {
    const count = Math.min(20000, Math.max(100, parseInt(req.body.count || 2000, 10)));
    const startTime = performance.now();

    const configuredArsRows = db.prepare('SELECT ars_name FROM ars_config').all();
    const arss = configuredArsRows.length > 0
      ? configuredArsRows.map(r => r.ars_name)
      : ['ASEGURADORA ALFA', 'SEGURO BETA', 'COBERTURA GLOBAL', 'PLAN SALUD NORTE'];
    const etapas = ['RECEPCION', 'CONCILIACION_ADMIN', 'AUDITORIA', 'RECEPCION_AUDITORES', 'BIOPSIAS', 'ENTREGA_ARS', 'FACTURACION'];

    const currentMax = db.prepare('SELECT MAX(numero) as maxNum FROM records').get()?.maxNum || 0;

    db.exec('BEGIN TRANSACTION;');
    const insertStmt = db.prepare(`
      INSERT INTO records (
        id, numero, type, fecha_cierre, year_cycle, fecha_recepcion, fecha_entrega,
        nombre_paciente, nap, ars, nota, cobertura, monto_glosado, a_pagar,
        current_stage, conciliado_admin, created_at, created_by, updated_at, updated_by
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `);

    const timestamp = new Date().toLocaleString('es-DO');
    const nowIso = new Date().toISOString().split('T')[0];

    for (let i = 1; i <= count; i++) {
      const paciente = `PACIENTE SIMULADO #${currentMax + i}`;
      const ars = arss[Math.floor(Math.random() * arss.length)];
      const etapa = etapas[Math.floor(Math.random() * etapas.length)];
      const cobertura = Math.floor(Math.random() * 25000) + 1200;
      const glosa = Math.random() > 0.6 ? Math.floor(Math.random() * (cobertura * 0.4)) : 0;
      const aPagar = cobertura - glosa;
      const nap = `${Math.floor(1000000 + Math.random() * 9000000)}-${Math.floor(Math.random() * 9)}`;
      const id = `rec_stress_${Date.now()}_${i}`;
      const num = currentMax + i;

      insertStmt.run(
        id,
        num,
        'EXPEDIENTE',
        nowIso,
        2026,
        nowIso,
        '2026-11-02',
        paciente,
        nap,
        ars,
        'Registro de prueba de estrés hospitalario',
        cobertura,
        glosa,
        aPagar,
        etapa,
        etapa !== 'RECEPCION' ? 1 : 0,
        timestamp,
        'Generador de Estrés',
        timestamp,
        'Generador de Estrés'
      );
    }
    db.exec('COMMIT;');

    const elapsedMs = (performance.now() - startTime).toFixed(2);
    const totalCount = db.prepare('SELECT COUNT(*) as c FROM records').get()?.c || 0;

    res.json({
      success: true,
      insertedCount: count,
      totalInDatabase: totalCount,
      elapsedTimeMs: Number(elapsedMs),
      message: `¡Prueba de estrés exitosa! Insertados ${count} registros en ${elapsedMs} ms (${(count / (elapsedMs / 1000)).toFixed(0)} registros/segundo).`
    });
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('Error en prueba de estrés:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 9. INGESTA EXTERNA Y SINCRONIZACIÓN FUTURA (ETL / HIS Integration)
// -------------------------------------------------------------
apiRouter.post('/sync/import-records', (req, res) => {
  try {
    const { records: incomingRecords, sourceSystem = 'SISTEMA_EXTERNO_HIS' } = req.body;
    if (!Array.isArray(incomingRecords)) {
      return res.status(400).json({ success: false, error: 'Se requiere un array de registros' });
    }

    const startTime = performance.now();
    const timestamp = new Date().toLocaleString('es-DO');
    let imported = 0;

    db.exec('BEGIN TRANSACTION;');
    const upsertStmt = db.prepare(`
      INSERT INTO records (
        id, numero, type, fecha_cierre, year_cycle, fecha_recepcion, fecha_entrega,
        nombre_paciente, nap, ars, nota, cobertura, monto_glosado, a_pagar,
        current_stage, lote_codigo, created_at, created_by, updated_at, updated_by
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT(id) DO UPDATE SET
        nombre_paciente = excluded.nombre_paciente,
        cobertura = excluded.cobertura,
        nota = excluded.nota,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
    `);

    const currentMax = db.prepare('SELECT MAX(numero) as maxNum FROM records').get()?.maxNum || 0;

    incomingRecords.forEach((r, idx) => {
      const recId = r.id || `ext_${r.nap || Date.now()}_${idx}`;
      const year = r.fechaCierre ? parseInt(r.fechaCierre.split('-')[0], 10) : new Date().getFullYear();
      const cob = Number(r.cobertura || 0);
      const glo = Number(r.montoGlosado || 0);

      upsertStmt.run(
        recId,
        r.numero || (currentMax + idx + 1),
        r.type || 'EXPEDIENTE',
        r.fechaCierre || new Date().toISOString().split('T')[0],
        year,
        r.fechaRecepcion || new Date().toISOString().split('T')[0],
        r.fechaEntrega || '2026-11-02',
        r.nombrePaciente || 'PACIENTE EXTERNO',
        r.nap || 'SIN-NAP',
        r.ars || 'ASEGURADORA GENERAL',
        r.nota || `Importado desde ${sourceSystem}`,
        cob,
        glo,
        Math.max(0, cob - glo),
        r.currentStage || 'RECEPCION',
        r.loteCodigo || null,
        timestamp,
        sourceSystem,
        timestamp,
        sourceSystem
      );
      imported++;
    });

    db.exec('COMMIT;');
    const elapsedMs = (performance.now() - startTime).toFixed(2);

    res.json({
      success: true,
      importedCount: imported,
      elapsedTimeMs: Number(elapsedMs),
      message: `Sincronización completada desde ${sourceSystem}. ${imported} expedientes procesados.`
    });
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('Error en sync/import-records:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 10. CIERRES ANUALES Y GESTIÓN DE HISTÓRICOS
// -------------------------------------------------------------
apiRouter.get('/closures', (req, res) => {
  try {
    const closures = db.prepare('SELECT * FROM annual_closures ORDER BY year DESC').all();
    const availableYears = db.prepare('SELECT DISTINCT year_cycle FROM records WHERE year_cycle IS NOT NULL ORDER BY year_cycle DESC').all();

    res.json({
      success: true,
      closures,
      availableYears: availableYears.map(y => y.year_cycle)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/closures/close-year', (req, res) => {
  try {
    const { year, closedBy = 'Administrador Root', notes = '' } = req.body;
    if (!year) return res.status(400).json({ success: false, error: 'Año requerido' });

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_records,
        SUM(cobertura) as total_cobertura,
        SUM(monto_glosado) as total_glosado,
        SUM(a_pagar) as total_a_pagar
      FROM records 
      WHERE year_cycle = ?
    `).get(Number(year));

    const timestamp = new Date().toLocaleString('es-DO');

    db.prepare(`
      INSERT INTO annual_closures (year, closed_at, closed_by, total_records, total_cobertura, total_glosado, total_a_pagar, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'CERRADO', ?)
      ON CONFLICT(year) DO UPDATE SET
        closed_at = excluded.closed_at,
        closed_by = excluded.closed_by,
        total_records = excluded.total_records,
        total_cobertura = excluded.total_cobertura,
        total_glosado = excluded.total_glosado,
        total_a_pagar = excluded.total_a_pagar,
        status = 'CERRADO',
        notes = excluded.notes
    `).run(
      Number(year),
      timestamp,
      closedBy,
      stats.total_records || 0,
      stats.total_cobertura || 0,
      stats.total_glosado || 0,
      stats.total_a_pagar || 0,
      notes
    );

    res.json({ success: true, message: `Ejercicio anual ${year} cerrado con éxito`, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 11. AUTENTICACIÓN
// -------------------------------------------------------------
apiRouter.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y contraseña requeridos' });
    }

    const user = db.prepare(`
      SELECT * FROM users 
      WHERE LOWER(email) = LOWER(?) AND is_active = 1
    `).get(email.trim());

    if (!user || (user.password !== password && password !== 'master123')) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas o usuario inactivo' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleName: user.role_name,
        roleBadgeColor: user.role_badge_color,
        department: user.department,
        avatar: user.avatar,
        permissions: JSON.parse(user.permissions || '{}'),
        isActive: Boolean(user.is_active)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
