import { db } from './db.js';

export const DEFAULT_ARS_CONFIG = [
  { ars_name: 'SENASA', short_name: 'SENASA', dias_vigencia: 60 },
  { ars_name: 'PRIMERA', short_name: 'PRIMERA', dias_vigencia: 90 },
  { ars_name: 'HUMANO', short_name: 'HUMANO', dias_vigencia: 90 },
  { ars_name: 'UNIVERSAL', short_name: 'UNIVERSAL', dias_vigencia: 90 },
  { ars_name: 'SEMMA', short_name: 'SEMMA', dias_vigencia: 60 },
  { ars_name: 'MONUMENTAL', short_name: 'MONUMENTAL', dias_vigencia: 60 },
  { ars_name: 'ARS RESERVAS', short_name: 'ARS RESERVAS', dias_vigencia: 60 },
  { ars_name: 'FUTURO', short_name: 'FUTURO', dias_vigencia: 60 },
  { ars_name: 'RENACER', short_name: 'RENACER', dias_vigencia: 60 },
  { ars_name: 'IDOPPRIL', short_name: 'IDOPPRIL', dias_vigencia: 60 },
  { ars_name: 'UAS', short_name: 'UAS', dias_vigencia: 60 }
];

export function seedInitialDataIfEmpty() {
  // 1. Limpiar datos escripteados de prueba de estrés si quedaron de pruebas anteriores
  try {
    const deletedStress = db.prepare(`DELETE FROM records WHERE id LIKE 'rec_stress_%'`).run();
    if (deletedStress && deletedStress.changes > 0) {
      console.log(`[SEED] Limpiados ${deletedStress.changes} registros ficticios de prueba de estrés.`);
    }
  } catch (e) {
    console.warn('Error limpiando registros de estrés:', e);
  }

  // 2. Sembrar Configuración de Vigencia por ARS
  const arsCount = db.prepare('SELECT COUNT(*) as c FROM ars_config').get()?.c || 0;
  if (arsCount === 0) {
    console.log('[SEED] Inicializando tabla de vigencia por ARS (2 a 3 meses configurable)...');
    const insertArs = db.prepare(`
      INSERT OR IGNORE INTO ars_config (ars_name, short_name, dias_vigencia, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?)
    `);
    const nowStr = new Date().toLocaleString('es-DO');
    for (const item of DEFAULT_ARS_CONFIG) {
      insertArs.run(item.ars_name, item.short_name, item.dias_vigencia, nowStr, 'Lic. Carlos Méndez (Root)');
    }
  }

  // 3. Sembrar Usuarios Oficiales (incluyendo Dra. Elena Valerio y Dr. Marcos Tejada como Auditores)
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get()?.c || 0;
  if (userCount === 0) {
    console.log('[SEED] Insertando usuarios iniciales con roles y permisos...');
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password, role, role_name, role_badge_color, department, avatar, permissions, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertUser.run(
      'usr_root',
      'Lic. Carlos Méndez (Root)',
      'admin@auditadvas.com',
      'admin123',
      'ADMIN_ROOT',
      'Administrador Root',
      'bg-purple-100 text-purple-800 border-purple-200',
      'Dirección General & Sistemas',
      'AR',
      JSON.stringify({
        canEmitInitialRelation: true,
        canReceiveAndConciliate: true,
        canDeliverToAuditors: true,
        canAuditRecords: true,
        canConfirmAuditorOutput: true,
        canManageBiopsias: true,
        canDeliverToArs: true,
        canDeliverToBilling: true,
        canReceiveInBilling: true,
        canManageUsers: true,
        canViewAllStages: true,
        canDeleteRecords: true
      })
    );

    insertUser.run(
      'usr_admin_auditoria',
      'Lic. Ana Patricia Martínez',
      'admin.auditoria@auditadvas.com',
      'admin123',
      'ADMINISTRATIVO',
      'Administrativo de Auditoría',
      'bg-blue-100 text-blue-800 border-blue-200',
      'Coordinación y Recepción de Auditoría',
      'AM',
      JSON.stringify({
        canEmitInitialRelation: false,
        canReceiveAndConciliate: true,
        canDeliverToAuditors: true,
        canAuditRecords: false,
        canConfirmAuditorOutput: true,
        canManageBiopsias: true,
        canDeliverToArs: true,
        canDeliverToBilling: true,
        canReceiveInBilling: false,
        canManageUsers: false,
        canViewAllStages: true,
        canDeleteRecords: false
      })
    );

    insertUser.run(
      'usr_auditor_medico',
      'Dra. Elena Valerio',
      'auditor.medico@auditadvas.com',
      'auditor123',
      'AUDITOR_MEDICO',
      'Auditor Médico Clínico',
      'bg-amber-100 text-amber-800 border-amber-200',
      'Auditoría Médica y Glosas',
      'EV',
      JSON.stringify({
        canEmitInitialRelation: false,
        canReceiveAndConciliate: false,
        canDeliverToAuditors: false,
        canAuditRecords: true,
        canConfirmAuditorOutput: false,
        canManageBiopsias: false,
        canDeliverToArs: false,
        canDeliverToBilling: false,
        canReceiveInBilling: false,
        canManageUsers: false,
        canViewAllStages: false,
        canDeleteRecords: false
      })
    );

    insertUser.run(
      'usr_auditor_marcos',
      'Dr. Marcos Tejada',
      'marcos.tejada@auditadvas.com',
      'auditor123',
      'AUDITOR_MEDICO',
      'Auditor Médico Clínico',
      'bg-amber-100 text-amber-800 border-amber-200',
      'Auditoría Médica Interna',
      'MT',
      JSON.stringify({
        canEmitInitialRelation: false,
        canReceiveAndConciliate: false,
        canDeliverToAuditors: false,
        canAuditRecords: true,
        canConfirmAuditorOutput: false,
        canManageBiopsias: false,
        canDeliverToArs: false,
        canDeliverToBilling: false,
        canReceiveInBilling: false,
        canManageUsers: false,
        canViewAllStages: false,
        canDeleteRecords: false
      })
    );

    insertUser.run(
      'usr_facturacion',
      'Roberto Santos',
      'facturacion@auditadvas.com',
      'factura123',
      'FACTURACION',
      'Facturación y Emisión',
      'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Facturación, Cobros y Radicación',
      'RS',
      JSON.stringify({
        canEmitInitialRelation: true,
        canReceiveAndConciliate: false,
        canDeliverToAuditors: false,
        canAuditRecords: false,
        canConfirmAuditorOutput: false,
        canManageBiopsias: false,
        canDeliverToArs: false,
        canDeliverToBilling: false,
        canReceiveInBilling: true,
        canManageUsers: false,
        canViewAllStages: false,
        canDeleteRecords: false
      })
    );
  } else {
    // Asegurar que el Dr. Marcos Tejada exista para las pestañas de auditores
    const hasMarcos = db.prepare(`SELECT id FROM users WHERE id = 'usr_auditor_marcos'`).get();
    if (!hasMarcos) {
      db.prepare(`
        INSERT OR IGNORE INTO users (id, name, email, password, role, role_name, role_badge_color, department, avatar, permissions, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(
        'usr_auditor_marcos',
        'Dr. Marcos Tejada',
        'marcos.tejada@auditadvas.com',
        'auditor123',
        'AUDITOR_MEDICO',
        'Auditor Médico Clínico',
        'bg-amber-100 text-amber-800 border-amber-200',
        'Auditoría Médica Interna',
        'MT',
        JSON.stringify({
          canEmitInitialRelation: false,
          canReceiveAndConciliate: false,
          canDeliverToAuditors: false,
          canAuditRecords: true,
          canConfirmAuditorOutput: false,
          canManageBiopsias: false,
          canDeliverToArs: false,
          canDeliverToBilling: false,
          canReceiveInBilling: false,
          canManageUsers: false,
          canViewAllStages: false,
          canDeleteRecords: false
        })
      );
    }
  }

  // Normalizar nombres de ARS antiguas a formato de pestañas si quedaron de antes
  db.exec(`
    UPDATE records SET ars = 'SENASA' WHERE ars = 'ARS SENASA';
    UPDATE records SET ars = 'PRIMERA' WHERE ars = 'PRIMERA ARS DE HUMANO';
    UPDATE records SET ars = 'HUMANO' WHERE ars = 'HUMANO SEGUROS';
    UPDATE records SET ars = 'MONUMENTAL' WHERE ars = 'ARS MONUMENTAL';
    UPDATE records SET ars = 'RENACER' WHERE ars = 'ARS RENACER';
    UPDATE records SET ars = 'UNIVERSAL' WHERE ars = 'MAPFRE SALUD ARS';
  `);

  const recordCount = db.prepare('SELECT COUNT(*) as c FROM records').get()?.c || 0;
  if (recordCount < 8) {
    console.log('[SEED] Insertando expedientes y emergencias iniciales con trazabilidad completa...');
    const insertRecord = db.prepare(`
      INSERT OR REPLACE INTO records (
        id, numero, type, fecha_cierre, year_cycle, fecha_recepcion, fecha_entrega,
        nombre_paciente, nap, ars, nota, cobertura, monto_glosado, a_pagar,
        current_stage, lote_id, lote_codigo,
        conciliado_admin, conciliado_por, conciliado_en,
        auditor_asignado_id, auditor_asignado_nombre, auditor_confirmado, auditor_confirmado_en,
        auditoria_procesada, auditoria_procesada_en, reporte_auditoria,
        recepcion_auditores_confirmada, recepcion_auditores_por, recepcion_auditores_en,
        tiene_pendiente_biopsia, medico_tratante, veces_enviada_biopsia, descripcion_biopsia,
        biopsia_completada, biopsia_completada_en, biopsia_completada_por,
        entregado_ars_por, entregado_ars_en, recibido_ars_por,
        entregado_facturacion_por, entregado_facturacion_en,
        facturacion_confirmada, facturacion_confirmada_por, facturacion_confirmada_en,
        notes_history, stage_history, created_at, created_by, updated_at, updated_by
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `);

    const samples = [
      // 1. Emisión inicial por Facturación
      {
        id: 'rec_init_01',
        numero: 1,
        type: 'EXPEDIENTE',
        fechaCierre: '2026-11-02',
        fechaEntrega: '2026-11-03',
        nombrePaciente: 'BERENICE ALTAGRACIA DIAZ',
        nap: '1249583-1',
        ars: 'SENASA',
        nota: 'Verificado soporte quirúrgico y récord de enfermería completo.',
        cobertura: 14500.00,
        montoGlosado: 0.00,
        currentStage: 'RECEPCION',
        loteCodigo: 'REL-2026-11-03',
        createdBy: 'Roberto Santos (Facturación)'
      },
      // 2. En Cotejo Administrativo
      {
        id: 'rec_init_02',
        numero: 2,
        type: 'EXPEDIENTE',
        fechaCierre: '2026-11-01',
        fechaEntrega: '2026-11-03',
        nombrePaciente: 'JOSEFINA DEL CARMEN PEREZ',
        nap: '5549201-8',
        ars: 'HUMANO',
        nota: 'Enviado por Facturación en relación matutina.',
        cobertura: 22800.00,
        montoGlosado: 0.00,
        currentStage: 'CONCILIACION_ADMIN',
        loteCodigo: 'REL-2026-11-03',
        createdBy: 'Roberto Santos (Facturación)'
      },
      // 3. En Auditoría Médica - Vigente (Dr. Marcos Tejada)
      {
        id: 'rec_init_03',
        numero: 3,
        type: 'EXPEDIENTE',
        fechaCierre: '2026-10-20',
        fechaEntrega: '2026-11-02',
        nombrePaciente: 'RAMON ANTONIO PEÑA GOMEZ',
        nap: '3849102-4',
        ars: 'SENASA',
        nota: 'Revisión de medicamentos y cargos de quirófano.',
        cobertura: 28400.00,
        montoGlosado: 1200.00,
        currentStage: 'AUDITORIA',
        loteCodigo: 'REL-2026-11-02',
        conciliadoAdmin: 1,
        conciliadoPor: 'Lic. Ana Patricia Martínez',
        conciliadoEn: '02/11/2026 09:15',
        auditorAsignadoId: 'usr_auditor_marcos',
        auditorAsignadoNombre: 'Dr. Marcos Tejada',
        auditorConfirmado: 1,
        auditorConfirmadoEn: '02/11/2026 10:00',
        createdBy: 'Roberto Santos (Facturación)'
      },
      // 4. En Auditoría Médica - Próximo a Vencer (Dr. Marcos Tejada - cierre hace 52 días para SENASA 60 días = faltan 8 días)
      {
        id: 'rec_init_04',
        numero: 4,
        type: 'EXPEDIENTE',
        fechaCierre: '2026-09-12',
        fechaEntrega: '2026-11-02',
        nombrePaciente: 'LUIS ALBERTO FERREIRA MONTES',
        nap: '6291044-2',
        ars: 'SENASA',
        nota: 'Pendiente firma de epicrisis por médico de planta.',
        cobertura: 41200.00,
        montoGlosado: 0.00,
        currentStage: 'AUDITORIA',
        loteCodigo: 'REL-2026-11-02',
        conciliadoAdmin: 1,
        conciliadoPor: 'Lic. Ana Patricia Martínez',
        conciliadoEn: '02/11/2026 09:20',
        auditorAsignadoId: 'usr_auditor_marcos',
        auditorAsignadoNombre: 'Dr. Marcos Tejada',
        auditorConfirmado: 1,
        auditorConfirmadoEn: '02/11/2026 10:05',
        createdBy: 'Roberto Santos (Facturación)'
      },
      // 5. En Auditoría Médica - VENCIDO (Dra. Elena Valerio - cierre hace 75 días para SENASA 60 días = -15 días vencido)
      {
        id: 'rec_init_05',
        numero: 5,
        type: 'EXPEDIENTE',
        fechaCierre: '2026-08-20',
        fechaEntrega: '2026-11-01',
        nombrePaciente: 'PEDRO JULIO SANTANA MEDINA',
        nap: '7182930-5',
        ars: 'SENASA',
        nota: 'Expediente demorado en archivo clínico. Prioridad máxima.',
        cobertura: 19600.00,
        montoGlosado: 0.00,
        currentStage: 'AUDITORIA',
        loteCodigo: 'REL-2026-11-01',
        conciliadoAdmin: 1,
        conciliadoPor: 'Lic. Ana Patricia Martínez',
        conciliadoEn: '01/11/2026 08:40',
        auditorAsignadoId: 'usr_auditor_medico',
        auditorAsignadoNombre: 'Dra. Elena Valerio',
        auditorConfirmado: 1,
        auditorConfirmadoEn: '01/11/2026 09:30',
        createdBy: 'Roberto Santos (Facturación)'
      },
      // 6. En Recepción de Auditores (Ya auditado y entregado por Dra. Elena Valerio)
      {
        id: 'rec_init_06',
        numero: 6,
        type: 'EXPEDIENTE',
        fechaCierre: '2026-10-28',
        fechaEntrega: '2026-11-02',
        nombrePaciente: 'ANA MERCEDES VALDEZ ROJAS',
        nap: '4829103-7',
        ars: 'PRIMERA',
        nota: 'Auditoría concluida conforme. Lista para decidir pase a ARS o Biopsia.',
        cobertura: 36500.00,
        montoGlosado: 1500.00,
        currentStage: 'RECEPCION_AUDITORES',
        loteCodigo: 'REL-2026-11-02',
        conciliadoAdmin: 1,
        conciliadoPor: 'Lic. Ana Patricia Martínez',
        conciliadoEn: '01/11/2026 10:00',
        auditorAsignadoId: 'usr_auditor_medico',
        auditorAsignadoNombre: 'Dra. Elena Valerio',
        auditorConfirmado: 1,
        auditorConfirmadoEn: '01/11/2026 11:00',
        auditoriaProcesada: 1,
        auditoriaProcesadaEn: '02/11/2026 14:20',
        reporteAuditoria: 'Glosa aplicada por material gastable no cubierto (RD$1,500). Resto conforme.',
        createdBy: 'Roberto Santos (Facturación)'
      },
      // 7. BIOPSIA NUEVA DEL DÍA (ENVIADAS = 1)
      {
        id: 'rec_bio_01',
        numero: 7,
        type: 'EXPEDIENTE',
        fechaCierre: '2026-11-02',
        fechaEntrega: '2026-11-02',
        nombrePaciente: 'CARMEN ROSA SANTOS FELIZ',
        nap: '9482014-9',
        ars: 'SENASA',
        nota: 'Solicitud de reporte de histopatología enviada por primera vez hoy.',
        cobertura: 32000.00,
        montoGlosado: 0.00,
        currentStage: 'BIOPSIAS',
        loteCodigo: 'BIO-2026-11-02',
        conciliadoAdmin: 1,
        conciliadoPor: 'Lic. Ana Patricia Martínez',
        tienePendienteBiopsia: 1,
        medicoTratante: 'DRA. ELENA VALERIO',
        vecesEnviadaBiopsia: 1,
        descripcionBiopsia: 'BIOPSIA ENDOMETRIAL / LEGRADO DIAGNOSTICO',
        createdBy: 'Lic. Ana Patricia Martínez'
      },
      // 8. BIOPSIA PENDIENTE RECURRENTE (ENVIADAS = 2 - Tal como en la imagen subida)
      {
        id: 'rec_bio_02',
        numero: 8,
        type: 'EXPEDIENTE',
        fechaCierre: '2026-10-16',
        fechaEntrega: '2026-11-02',
        nombrePaciente: 'RAMON ANTONIO RODRIGUEZ DE LOS SANTOS',
        nap: '8391042-1',
        ars: 'SENASA',
        nota: 'Segundo reclamo de reporte histopatológico a laboratorio.',
        cobertura: 54000.00,
        montoGlosado: 0.00,
        currentStage: 'BIOPSIAS',
        loteCodigo: 'BIO-2026-11-02',
        conciliadoAdmin: 1,
        conciliadoPor: 'Lic. Ana Patricia Martínez',
        tienePendienteBiopsia: 1,
        medicoTratante: 'JUAN DAVID SUAREZ',
        vecesEnviadaBiopsia: 2,
        descripcionBiopsia: 'HERNIA DISCAL LUMBAR',
        createdBy: 'Lic. Ana Patricia Martínez'
      },
      // 9. BIOPSIA PENDIENTE RECURRENTE (ENVIADAS = 3 - Tal como en la imagen subida)
      {
        id: 'rec_bio_03',
        numero: 9,
        type: 'EXPEDIENTE',
        fechaCierre: '2026-10-13',
        fechaEntrega: '2026-11-02',
        nombrePaciente: 'AQUILES OZORIA CASTILLO',
        nap: '7482910-6',
        ars: 'HUMANO',
        nota: 'Tercer reclamo de biopsia pendiente.',
        cobertura: 68500.00,
        montoGlosado: 0.00,
        currentStage: 'BIOPSIAS',
        loteCodigo: 'BIO-2026-11-02',
        conciliadoAdmin: 1,
        conciliadoPor: 'Lic. Ana Patricia Martínez',
        tienePendienteBiopsia: 1,
        medicoTratante: 'RAMON ROMAN',
        vecesEnviadaBiopsia: 3,
        descripcionBiopsia: 'PROSTATA / DIVERTICULO VESICAL',
        createdBy: 'Lic. Ana Patricia Martínez'
      },
      // 10. ENTREGA A ARS (Con Biopsia Completada y Archivada para histórico)
      {
        id: 'rec_ars_01',
        numero: 10,
        type: 'EXPEDIENTE',
        fechaCierre: '2026-10-25',
        fechaEntrega: '2026-11-02',
        nombrePaciente: 'MIGUEL ANGEL RODRIGUEZ CASTILLO',
        nap: '4958201-3',
        ars: 'PRIMERA',
        nota: 'Biopsia recibida y completada. Expediente listo en Entrega a ARS.',
        cobertura: 48900.00,
        montoGlosado: 0.00,
        currentStage: 'ENTREGA_ARS',
        loteCodigo: 'ARS-2026-11-02',
        conciliadoAdmin: 1,
        conciliadoPor: 'Lic. Ana Patricia Martínez',
        auditorAsignadoNombre: 'Dr. Marcos Tejada',
        auditoriaProcesada: 1,
        tienePendienteBiopsia: 0,
        medicoTratante: 'DR. CARLOS MENDOZA',
        vecesEnviadaBiopsia: 2,
        descripcionBiopsia: 'VESICULA BILIAR (COLECISTECTOMIA)',
        biopsiaCompletada: 1,
        biopsiaCompletadaEn: '02/11/2026 11:30',
        biopsiaCompletadaPor: 'Lic. Ana Patricia Martínez',
        entregadoArsPor: 'Lic. Ana Patricia Martínez (Administrativo)',
        entregadoArsEn: '02/11/2026 11:35',
        recibidoArsPor: 'Valija Oficial PRIMERA ARS',
        createdBy: 'Roberto Santos (Facturación)'
      },
      // 11. ENTREGA FINAL A FACTURACIÓN
      {
        id: 'rec_fac_01',
        numero: 11,
        type: 'EXPEDIENTE',
        fechaCierre: '2026-10-31',
        fechaEntrega: '2026-11-02',
        nombrePaciente: 'YUDELKA MERCEDES BATISTA',
        nap: '7583920-1',
        ars: 'SENASA',
        nota: 'Relación final entregada por Auditoría a Facturación para cobro.',
        cobertura: 45000.00,
        montoGlosado: 3500.00,
        currentStage: 'FACTURACION',
        loteCodigo: 'FAC-2026-11-02',
        conciliadoAdmin: 1,
        conciliadoPor: 'Lic. Ana Patricia Martínez',
        auditorAsignadoNombre: 'Dra. Elena Valerio',
        auditoriaProcesada: 1,
        entregadoFacturacionPor: 'Lic. Ana Patricia Martínez (Administrativo)',
        entregadoFacturacionEn: '02/11/2026 15:00',
        facturacionConfirmada: 1,
        facturacionConfirmadaPor: 'Roberto Santos (Facturación)',
        facturacionConfirmadaEn: '02/11/2026 15:40',
        createdBy: 'Roberto Santos (Facturación)'
      },
      // EMERGENCIAS
      {
        id: 'rec_emg_01',
        numero: 1,
        type: 'EMERGENCIA',
        fechaCierre: '2026-11-02',
        fechaEntrega: '2026-11-03',
        nombrePaciente: 'ESTEFANIA LUCIA CASTRO',
        nap: '1948502-3',
        ars: 'SENASA',
        nota: 'Atención de triaje y estabilización en urgencias.',
        cobertura: 5400.00,
        montoGlosado: 0.00,
        currentStage: 'RECEPCION_EMERGENCIA',
        loteCodigo: 'EMG-2026-11-03',
        createdBy: 'Roberto Santos (Facturación)'
      },
      {
        id: 'rec_emg_02',
        numero: 2,
        type: 'EMERGENCIA',
        fechaCierre: '2026-11-02',
        fechaEntrega: '2026-11-02',
        nombrePaciente: 'CARLOS MANUEL DE LOS SANTOS',
        nap: '8392014-2',
        ars: 'UNIVERSAL',
        nota: 'Relación de atenciones remitidas formalmente a Universal.',
        cobertura: 8900.00,
        montoGlosado: 0.00,
        currentStage: 'ENTREGA_ARS_EMERGENCIA',
        loteCodigo: 'EMG-2026-11-02',
        conciliadoAdmin: 1,
        conciliadoPor: 'Lic. Ana Patricia Martínez',
        conciliadoEn: '02/11/2026 10:15',
        entregadoArsPor: 'Lic. Ana Patricia Martínez (Administrativo)',
        entregadoArsEn: '02/11/2026 14:00',
        createdBy: 'Roberto Santos (Facturación)'
      }
    ];

    const timestamp = new Date().toLocaleString('es-DO');
    for (const r of samples) {
      const aPagar = Math.max(0, r.cobertura - r.montoGlosado);
      insertRecord.run(
        r.id,
        r.numero,
        r.type,
        r.fechaCierre,
        2026,
        r.fechaCierre,
        r.fechaEntrega,
        r.nombrePaciente,
        r.nap,
        r.ars,
        r.nota,
        r.cobertura,
        r.montoGlosado,
        aPagar,
        r.currentStage,
        null,
        r.loteCodigo || 'REL-2026-11-02',
        r.conciliadoAdmin || 0,
        r.conciliadoPor || null,
        r.conciliadoEn || null,
        r.auditorAsignadoId || null,
        r.auditorAsignadoNombre || null,
        r.auditorConfirmado || 0,
        r.auditorConfirmadoEn || null,
        r.auditoriaProcesada || 0,
        r.auditoriaProcesadaEn || null,
        r.reporteAuditoria || null,
        r.recepcionAuditoresConfirmada || 0,
        r.recepcionAuditoresPor || null,
        r.recepcionAuditoresEn || null,
        r.tienePendienteBiopsia || 0,
        r.medicoTratante || null,
        r.vecesEnviadaBiopsia || 1,
        r.descripcionBiopsia || null,
        r.biopsiaCompletada || 0,
        r.biopsiaCompletadaEn || null,
        r.biopsiaCompletadaPor || null,
        r.entregadoArsPor || null,
        r.entregadoArsEn || null,
        r.recibidoArsPor || null,
        r.entregadoFacturacionPor || null,
        r.entregadoFacturacionEn || null,
        r.facturacionConfirmada || 0,
        r.facturacionConfirmadaPor || null,
        r.facturacionConfirmadaEn || null,
        JSON.stringify([]),
        JSON.stringify([
          {
            id: `sh_init_${r.id}`,
            fromStage: 'INICIO',
            toStage: r.currentStage,
            changedAt: timestamp,
            changedBy: r.createdBy || 'Roberto Santos (Facturación)'
          }
        ]),
        timestamp,
        r.createdBy || 'Roberto Santos (Facturación)',
        timestamp,
        r.createdBy || 'Roberto Santos (Facturación)'
      );
    }
  }
}
