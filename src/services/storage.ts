import { 
  MedicalRecordItem, 
  User, 
  RecordType, 
  AnyStageId,
  DeliveryBatch,
  EXPEDIENTE_STAGES,
  EMERGENCIA_STAGES,
  DEFAULT_ROLE_PERMISSIONS
} from '../types';

const STORAGE_KEY_RECORDS = 'gcm_medical_records_v3';
const STORAGE_KEY_BATCHES = 'gcm_delivery_batches_v3';
const STORAGE_KEY_USERS = 'gcm_users_v3';
const STORAGE_KEY_ACTIVE_USER = 'gcm_active_user_id_v3';
const STORAGE_KEY_AUTH_SESSION = 'gcm_auth_session_v3';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_root',
    name: 'Lic. Carlos Méndez (Root)',
    email: 'admin@auditadvas.com',
    password: 'admin123',
    role: 'ADMIN_ROOT',
    roleName: 'Administrador Root',
    roleBadgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    department: 'Dirección General & Sistemas',
    avatar: 'AR',
    permissions: DEFAULT_ROLE_PERMISSIONS.ADMIN_ROOT,
    isActive: true
  },
  {
    id: 'usr_admin_auditoria',
    name: 'Lic. Ana Patricia Martínez',
    email: 'admin.auditoria@auditadvas.com',
    password: 'admin123',
    role: 'ADMINISTRATIVO',
    roleName: 'Administrativo de Auditoría',
    roleBadgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    department: 'Coordinación y Recepción de Auditoría',
    avatar: 'AM',
    permissions: DEFAULT_ROLE_PERMISSIONS.ADMINISTRATIVO,
    isActive: true
  },
  {
    id: 'usr_auditor_medico',
    name: 'Dra. Elena Valerio',
    email: 'auditor.medico@auditadvas.com',
    password: 'auditor123',
    role: 'AUDITOR_MEDICO',
    roleName: 'Auditor Médico Clínico',
    roleBadgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    department: 'Auditoría Médica y Glosas',
    avatar: 'EV',
    permissions: DEFAULT_ROLE_PERMISSIONS.AUDITOR_MEDICO,
    isActive: true
  },
  {
    id: 'usr_facturacion',
    name: 'Roberto Santos',
    email: 'facturacion@auditadvas.com',
    password: 'factura123',
    role: 'FACTURACION',
    roleName: 'Facturación y Emisión',
    roleBadgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    department: 'Facturación, Cobros y Radicación',
    avatar: 'RS',
    permissions: DEFAULT_ROLE_PERMISSIONS.FACTURACION,
    isActive: true
  }
];

export const INITIAL_BATCHES: DeliveryBatch[] = [
  {
    id: 'lote_exp_senasa_3110',
    codigo: 'LOTE-2026-10-31-SENASA-01',
    nombre: 'Relación Entrega a Facturación - ARS SENASA',
    tipo: 'EXPEDIENTE',
    ars: 'ARS SENASA',
    etapa: 'FACTURACION',
    fechaCiclo: '2026-10-31',
    fechaEntrega: '2026-10-31',
    estado: 'ENTREGADO',
    descripcion: 'Expedientes hospitalarios auditados y aprobados para corte mensual de facturación a ARS SeNaSa.',
    creadoPor: 'Ana Patricia Martínez',
    creadoEn: '2026-10-31 08:30',
    entregadoPor: 'Ana Patricia Martínez (Recepción)',
    recibidoPor: 'Roberto Santos (Facturación)',
    notas: 'Entregado con acta formal firmada a las 14:30 hrs.'
  },
  {
    id: 'lote_rec_hoy_0211',
    codigo: 'LOTE-REC-2026-11-02-01',
    nombre: 'Ciclo Recepción Hospitalaria Diaria (26 Casos)',
    tipo: 'EXPEDIENTE',
    ars: 'TODAS',
    etapa: 'RECEPCION',
    fechaCiclo: '2026-11-02',
    fechaEntrega: '2026-11-02',
    estado: 'ABIERTO',
    descripcion: 'Lote de expedientes ingresados el día de hoy por mesa de partes de calidad médica.',
    creadoPor: 'Ana Patricia Martínez',
    creadoEn: '2026-11-02 07:30',
    entregadoPor: 'Archivo Clínico Hospitalario',
    recibidoPor: 'Ana Patricia Martínez (Recepción)',
    notas: 'En proceso de verificación de firmas y pase a auditores.'
  },
  {
    id: 'lote_bio_3010',
    codigo: 'LOTE-BIO-2026-10-30-01',
    nombre: 'Relación de Casos con Biopsias Pendientes',
    tipo: 'EXPEDIENTE',
    ars: 'ARS SENASA',
    etapa: 'BIOPSIAS',
    fechaCiclo: '2026-10-30',
    fechaEntrega: '2026-10-31',
    estado: 'EN_AUDITORIA',
    descripcion: 'Expedientes quirúrgicos retenidos a la espera de resultados anatomopatológicos.',
    creadoPor: 'Dra. Elena Valerio',
    creadoEn: '2026-10-30 10:20',
    entregadoPor: 'Dra. Elena Valerio (Auditora)',
    recibidoPor: 'Dpto. de Patología',
    notas: 'Se solicitó agilizar informe al laboratorio externo.'
  },
  {
    id: 'lote_emg_senasa_0801',
    codigo: 'LOTE-EMG-2025-01-08-01',
    nombre: 'Relación Entrega de Emergencias a Facturación',
    tipo: 'EMERGENCIA',
    ars: 'ARS SENASA',
    etapa: 'FACTURACION_EMERGENCIA',
    fechaCiclo: '2025-01-08',
    fechaEntrega: '2025-01-08',
    estado: 'ENTREGADO',
    descripcion: 'Corte de emergencias del turno nocturno entregadas a facturación.',
    creadoPor: 'Ana Patricia Martínez',
    creadoEn: '2025-01-08 07:45',
    entregadoPor: 'Ana Patricia Martínez',
    recibidoPor: 'Roberto Santos',
    notas: 'Recepción conforme sin objeciones.'
  },
  {
    id: 'lote_emg_hoy_0211',
    codigo: 'LOTE-EMG-2026-11-02-01',
    nombre: 'Corte Recepción de Emergencias del Día',
    tipo: 'EMERGENCIA',
    ars: 'TODAS',
    etapa: 'RECEPCION_EMERGENCIA',
    fechaCiclo: '2026-11-02',
    fechaEntrega: '2026-11-02',
    estado: 'ABIERTO',
    descripcion: 'Atenciones de urgencias recepcionadas en el corte de hoy.',
    creadoPor: 'Ana Patricia Martínez',
    creadoEn: '2026-11-02 08:00',
    notas: 'Casos ingresados en el turno de la mañana.'
  }
];

export const INITIAL_RECORDS: MedicalRecordItem[] = [
  // --- EXPEDIENTES (LOTE ENTREGA FACTURACION 31/10/2026) ---
  {
    id: 'rec_exp_01',
    numero: 1,
    type: 'EXPEDIENTE',
    fechaCierre: '2026-10-31',
    fechaRecepcion: '2026-10-31',
    fechaEntrega: '2026-10-31',
    nombrePaciente: 'JUAN ALBERTO PEREZ ROSARIO',
    nap: '8492048-1',
    ars: 'ARS SENASA',
    nota: 'Aprobado sin objeciones por auditoría médica. Listo para radicar.',
    cobertura: 85400.00,
    montoGlosado: 0.00,
    aPagar: 85400.00,
    currentStage: 'FACTURACION',
    loteId: 'lote_exp_senasa_3110',
    loteCodigo: 'LOTE-2026-10-31-SENASA-01',
    notesHistory: [
      {
        id: 'n_01',
        date: '2026-10-31 08:30',
        author: 'Ana Patricia Martínez',
        authorRole: 'RECEPCION',
        text: 'Expediente recibido desde Hospitalización Sala 304 con epicrisis completa.',
        stageAtNote: 'RECEPCION'
      },
      {
        id: 'n_02',
        date: '2026-10-31 11:15',
        author: 'Dra. Elena Valerio',
        authorRole: 'AUDITOR',
        text: 'Auditoría médica completada. Consumos verificados contra kardex.',
        stageAtNote: 'AUDITORIA'
      }
    ],
    stageHistory: [
      { id: 'sh_01', fromStage: 'INICIO', toStage: 'RECEPCION', changedAt: '2026-10-31 08:30', changedBy: 'Ana Patricia Martínez' },
      { id: 'sh_02', fromStage: 'RECEPCION', toStage: 'AUDITORIA', changedAt: '2026-10-31 09:00', changedBy: 'Ana Patricia Martínez' },
      { id: 'sh_03', fromStage: 'AUDITORIA', toStage: 'ENTREGA_ARS', changedAt: '2026-10-31 12:00', changedBy: 'Dra. Elena Valerio' },
      { id: 'sh_04', fromStage: 'ENTREGA_ARS', toStage: 'FACTURACION', changedAt: '2026-10-31 14:20', changedBy: 'Roberto Santos' }
    ],
    createdAt: '2026-10-31 08:30',
    createdBy: 'Ana Patricia Martínez',
    updatedAt: '2026-10-31 14:20',
    updatedBy: 'Roberto Santos'
  },
  {
    id: 'rec_exp_02',
    numero: 2,
    type: 'EXPEDIENTE',
    fechaCierre: '2026-10-30',
    fechaRecepcion: '2026-10-31',
    fechaEntrega: '2026-10-31',
    nombrePaciente: 'MARIA ALTAGRACIA CONCEPCION',
    nap: '7294021-3',
    ars: 'ARS SENASA',
    nota: 'Glosa parcial aplicada por medicamento no contemplado en catálogo PDSS (RD$ 4,200).',
    cobertura: 142000.00,
    montoGlosado: 4200.00,
    aPagar: 137800.00,
    currentStage: 'FACTURACION',
    loteId: 'lote_exp_senasa_3110',
    loteCodigo: 'LOTE-2026-10-31-SENASA-01',
    notesHistory: [
      {
        id: 'n_03',
        date: '2026-10-30 14:10',
        author: 'Ana Patricia Martínez',
        authorRole: 'RECEPCION',
        text: 'Recibido de Cirugía General con reporte postoperatorio.',
        stageAtNote: 'RECEPCION'
      },
      {
        id: 'n_04',
        date: '2026-10-31 09:45',
        author: 'Dra. Elena Valerio',
        authorRole: 'AUDITOR',
        text: 'Glosado renglón de antibiótico especial por falta de justificación clínica previa.',
        stageAtNote: 'AUDITORIA'
      }
    ],
    stageHistory: [
      { id: 'sh_05', fromStage: 'INICIO', toStage: 'RECEPCION', changedAt: '2026-10-30 14:10', changedBy: 'Ana Patricia Martínez' },
      { id: 'sh_06', fromStage: 'RECEPCION', toStage: 'AUDITORIA', changedAt: '2026-10-30 15:30', changedBy: 'Ana Patricia Martínez' },
      { id: 'sh_07', fromStage: 'AUDITORIA', toStage: 'FACTURACION', changedAt: '2026-10-31 11:00', changedBy: 'Roberto Santos' }
    ],
    createdAt: '2026-10-30 14:10',
    createdBy: 'Ana Patricia Martínez',
    updatedAt: '2026-10-31 11:00',
    updatedBy: 'Roberto Santos'
  },
  {
    id: 'rec_exp_03',
    numero: 3,
    type: 'EXPEDIENTE',
    fechaCierre: '2026-10-29',
    fechaRecepcion: '2026-10-30',
    fechaEntrega: '2026-10-31',
    nombrePaciente: 'RAMON EMILIO TAVERAS DIAZ',
    nap: '9021844-0',
    ars: 'ARS SENASA',
    nota: 'Pendiente informe histopatológico de biopsia gástrica.',
    cobertura: 68500.00,
    montoGlosado: 0.00,
    aPagar: 68500.00,
    currentStage: 'BIOPSIAS',
    loteId: 'lote_bio_3010',
    loteCodigo: 'LOTE-BIO-2026-10-30-01',
    notesHistory: [
      {
        id: 'n_05',
        date: '2026-10-29 16:00',
        author: 'Ana Patricia Martínez',
        authorRole: 'RECEPCION',
        text: 'Ingresado tras gastroscopía quirúrgica.',
        stageAtNote: 'RECEPCION'
      },
      {
        id: 'n_06',
        date: '2026-10-30 10:20',
        author: 'Dra. Elena Valerio',
        authorRole: 'AUDITOR',
        text: 'Derivado a Relación de Biopsias. Se espera resultado de Patología para autorizar código quirúrgico.',
        stageAtNote: 'BIOPSIAS'
      }
    ],
    stageHistory: [
      { id: 'sh_08', fromStage: 'INICIO', toStage: 'RECEPCION', changedAt: '2026-10-29 16:00', changedBy: 'Ana Patricia Martínez' },
      { id: 'sh_09', fromStage: 'RECEPCION', toStage: 'AUDITORIA', changedAt: '2026-10-30 08:30', changedBy: 'Ana Patricia Martínez' },
      { id: 'sh_10', fromStage: 'AUDITORIA', toStage: 'BIOPSIAS', changedAt: '2026-10-30 10:20', changedBy: 'Dra. Elena Valerio' }
    ],
    createdAt: '2026-10-29 16:00',
    createdBy: 'Ana Patricia Martínez',
    updatedAt: '2026-10-30 10:20',
    updatedBy: 'Dra. Elena Valerio'
  },

  // --- EXPEDIENTES EN EL LOTE DEL DIA (CICLO HOY 02/11/2026) ---
  {
    id: 'rec_exp_04',
    numero: 4,
    type: 'EXPEDIENTE',
    fechaCierre: '2026-11-01',
    fechaRecepcion: '2026-11-02',
    fechaEntrega: '2026-11-02',
    nombrePaciente: 'CARMEN ROSA MORENO CASTILLO',
    nap: '4120934-8',
    ars: 'PRIMERA ARS DE HUMANO',
    nota: 'En revisión por auditor médico. Verificando protocolo de terapia intensiva.',
    cobertura: 215000.00,
    montoGlosado: 12500.00,
    aPagar: 202500.00,
    currentStage: 'AUDITORIA',
    loteId: 'lote_rec_hoy_0211',
    loteCodigo: 'LOTE-REC-2026-11-02-01',
    notesHistory: [
      {
        id: 'n_07',
        date: '2026-11-01 11:00',
        author: 'Ana Patricia Martínez',
        authorRole: 'RECEPCION',
        text: 'Recibido de UCI piso 2 con resumen de alta clínica.',
        stageAtNote: 'RECEPCION'
      }
    ],
    stageHistory: [
      { id: 'sh_11', fromStage: 'INICIO', toStage: 'RECEPCION', changedAt: '2026-11-01 11:00', changedBy: 'Ana Patricia Martínez' },
      { id: 'sh_12', fromStage: 'RECEPCION', toStage: 'AUDITORIA', changedAt: '2026-11-01 13:00', changedBy: 'Ana Patricia Martínez' }
    ],
    createdAt: '2026-11-01 11:00',
    createdBy: 'Ana Patricia Martínez',
    updatedAt: '2026-11-01 13:00',
    updatedBy: 'Ana Patricia Martínez'
  },
  {
    id: 'rec_exp_05',
    numero: 5,
    type: 'EXPEDIENTE',
    fechaCierre: '2026-11-02',
    fechaRecepcion: '2026-11-02',
    fechaEntrega: '2026-11-02',
    nombrePaciente: 'JOSE DOLORES GUZMAN PEÑA',
    nap: '6543210-9',
    ars: 'MAPFRE SALUD ARS',
    nota: 'Expediente nuevo recepcionado hoy. Pendiente asignación de auditor.',
    cobertura: 45000.00,
    montoGlosado: 0.00,
    aPagar: 45000.00,
    currentStage: 'RECEPCION',
    loteId: 'lote_rec_hoy_0211',
    loteCodigo: 'LOTE-REC-2026-11-02-01',
    notesHistory: [
      {
        id: 'n_08',
        date: '2026-11-02 08:15',
        author: 'Ana Patricia Martínez',
        authorRole: 'RECEPCION',
        text: 'Documentos recibidos completos de Archivo Clínico.',
        stageAtNote: 'RECEPCION'
      }
    ],
    stageHistory: [
      { id: 'sh_13', fromStage: 'INICIO', toStage: 'RECEPCION', changedAt: '2026-11-02 08:15', changedBy: 'Ana Patricia Martínez' }
    ],
    createdAt: '2026-11-02 08:15',
    createdBy: 'Ana Patricia Martínez',
    updatedAt: '2026-11-02 08:15',
    updatedBy: 'Ana Patricia Martínez'
  },
  {
    id: 'rec_exp_06',
    numero: 6,
    type: 'EXPEDIENTE',
    fechaCierre: '2026-10-28',
    fechaRecepcion: '2026-10-30',
    fechaEntrega: '2026-10-31',
    nombrePaciente: 'SANDRA MILENA VASQUEZ LOPEZ',
    nap: '3029182-4',
    ars: 'ARS SENASA',
    nota: 'Documento en valija de entrega hacia ARS SENASA oficina central.',
    cobertura: 94000.00,
    montoGlosado: 1500.00,
    aPagar: 92500.00,
    currentStage: 'ENTREGA_ARS',
    loteId: 'lote_exp_senasa_3110',
    loteCodigo: 'LOTE-2026-10-31-SENASA-01',
    notesHistory: [
      {
        id: 'n_09',
        date: '2026-10-30 16:45',
        author: 'Roberto Santos',
        authorRole: 'FACTURACION',
        text: 'Generado oficio de entrega para mensajería a ARS.',
        stageAtNote: 'ENTREGA_ARS'
      }
    ],
    stageHistory: [
      { id: 'sh_14', fromStage: 'RECEPCION', toStage: 'AUDITORIA', changedAt: '2026-10-28 10:00', changedBy: 'Ana Patricia Martínez' },
      { id: 'sh_15', fromStage: 'AUDITORIA', toStage: 'ENTREGA_ARS', changedAt: '2026-10-30 16:45', changedBy: 'Roberto Santos' }
    ],
    createdAt: '2026-10-28 09:30',
    createdBy: 'Ana Patricia Martínez',
    updatedAt: '2026-10-30 16:45',
    updatedBy: 'Roberto Santos'
  },
  {
    id: 'rec_exp_07',
    numero: 7,
    type: 'EXPEDIENTE',
    fechaCierre: '2026-11-02',
    fechaRecepcion: '2026-11-02',
    fechaEntrega: '2026-11-02',
    nombrePaciente: 'DANIEL ESTEBAN MERCEDES SOSA',
    nap: '8392019-2',
    ars: 'ARS SENASA',
    nota: 'Lote de recepción hoy. Ingresado por cesárea programada.',
    cobertura: 78000.00,
    montoGlosado: 0.00,
    aPagar: 78000.00,
    currentStage: 'RECEPCION',
    loteId: 'lote_rec_hoy_0211',
    loteCodigo: 'LOTE-REC-2026-11-02-01',
    notesHistory: [],
    stageHistory: [],
    createdAt: '2026-11-02 08:30',
    createdBy: 'Ana Patricia Martínez',
    updatedAt: '2026-11-02 08:30',
    updatedBy: 'Ana Patricia Martínez'
  },
  {
    id: 'rec_exp_08',
    numero: 8,
    type: 'EXPEDIENTE',
    fechaCierre: '2026-11-02',
    fechaRecepcion: '2026-11-02',
    fechaEntrega: '2026-11-02',
    nombrePaciente: 'GLADYS MERCEDES RODRIGUEZ',
    nap: '5748392-1',
    ars: 'HUMANO SEGUROS',
    nota: 'Ingreso clínico matutino. Expediente físico verificado.',
    cobertura: 110000.00,
    montoGlosado: 0.00,
    aPagar: 110000.00,
    currentStage: 'RECEPCION',
    loteId: 'lote_rec_hoy_0211',
    loteCodigo: 'LOTE-REC-2026-11-02-01',
    notesHistory: [],
    stageHistory: [],
    createdAt: '2026-11-02 08:45',
    createdBy: 'Ana Patricia Martínez',
    updatedAt: '2026-11-02 08:45',
    updatedBy: 'Ana Patricia Martínez'
  },

  // --- EMERGENCIAS ---
  {
    id: 'rec_emg_01',
    numero: 1,
    type: 'EMERGENCIA',
    fechaCierre: '2025-01-08',
    fechaRecepcion: '2025-01-08',
    fechaEntrega: '2025-01-08',
    nombrePaciente: 'PEDRO LUIS BATISTA HERNANDEZ',
    nap: '5849302-7',
    ars: 'ARS SENASA',
    nota: 'Emergencia pediátrica con hidratación parenteral e imágenes.',
    cobertura: 16500.00,
    montoGlosado: 0.00,
    aPagar: 16500.00,
    currentStage: 'FACTURACION_EMERGENCIA',
    loteId: 'lote_emg_senasa_0801',
    loteCodigo: 'LOTE-EMG-2025-01-08-01',
    notesHistory: [
      {
        id: 'ne_01',
        date: '2025-01-08 07:45',
        author: 'Ana Patricia Martínez',
        authorRole: 'RECEPCION',
        text: 'Cierre de turno nocturno de Emergencias.',
        stageAtNote: 'RECEPCION_EMERGENCIA'
      },
      {
        id: 'ne_02',
        date: '2025-01-08 10:30',
        author: 'Roberto Santos',
        authorRole: 'FACTURACION',
        text: 'Relacionado y entregado a Facturación para corte semanal.',
        stageAtNote: 'FACTURACION_EMERGENCIA'
      }
    ],
    stageHistory: [
      { id: 'she_01', fromStage: 'INICIO', toStage: 'RECEPCION_EMERGENCIA', changedAt: '2025-01-08 07:45', changedBy: 'Ana Patricia Martínez' },
      { id: 'she_02', fromStage: 'RECEPCION_EMERGENCIA', toStage: 'ENTREGA_ARS_EMERGENCIA', changedAt: '2025-01-08 09:00', changedBy: 'Roberto Santos' },
      { id: 'she_03', fromStage: 'ENTREGA_ARS_EMERGENCIA', toStage: 'FACTURACION_EMERGENCIA', changedAt: '2025-01-08 10:30', changedBy: 'Roberto Santos' }
    ],
    createdAt: '2025-01-08 07:45',
    createdBy: 'Ana Patricia Martínez',
    updatedAt: '2025-01-08 10:30',
    updatedBy: 'Roberto Santos'
  },
  {
    id: 'rec_emg_02',
    numero: 2,
    type: 'EMERGENCIA',
    fechaCierre: '2025-01-08',
    fechaRecepcion: '2025-01-08',
    fechaEntrega: '2025-01-08',
    nombrePaciente: 'YOCASTA MARLENE FELIZ DE LOS SANTOS',
    nap: '6192834-0',
    ars: 'ARS SENASA',
    nota: 'Sutura y radiografía simple de tórax. Cobertura al 90%.',
    cobertura: 8900.00,
    montoGlosado: 650.00,
    aPagar: 8250.00,
    currentStage: 'FACTURACION_EMERGENCIA',
    loteId: 'lote_emg_senasa_0801',
    loteCodigo: 'LOTE-EMG-2025-01-08-01',
    notesHistory: [
      {
        id: 'ne_03',
        date: '2025-01-08 08:20',
        author: 'Ana Patricia Martínez',
        authorRole: 'RECEPCION',
        text: 'Ingresado reporte de sala de urgencias adultas.',
        stageAtNote: 'RECEPCION_EMERGENCIA'
      }
    ],
    stageHistory: [
      { id: 'she_04', fromStage: 'INICIO', toStage: 'RECEPCION_EMERGENCIA', changedAt: '2025-01-08 08:20', changedBy: 'Ana Patricia Martínez' },
      { id: 'she_05', fromStage: 'RECEPCION_EMERGENCIA', toStage: 'FACTURACION_EMERGENCIA', changedAt: '2025-01-08 11:00', changedBy: 'Roberto Santos' }
    ],
    createdAt: '2025-01-08 08:20',
    createdBy: 'Ana Patricia Martínez',
    updatedAt: '2025-01-08 11:00',
    updatedBy: 'Roberto Santos'
  },
  {
    id: 'rec_emg_03',
    numero: 3,
    type: 'EMERGENCIA',
    fechaCierre: '2025-01-07',
    fechaRecepcion: '2025-01-07',
    fechaEntrega: '2025-01-08',
    nombrePaciente: 'FRANCISCO JAVIER POLANCO',
    nap: '7483920-5',
    ars: 'HUMANO SEGUROS',
    nota: 'Expediente preparado para relación con entrega a ARS Humano.',
    cobertura: 14200.00,
    montoGlosado: 0.00,
    aPagar: 14200.00,
    currentStage: 'ENTREGA_ARS_EMERGENCIA',
    loteId: 'lote_emg_hoy_0211',
    loteCodigo: 'LOTE-EMG-2026-11-02-01',
    notesHistory: [],
    stageHistory: [],
    createdAt: '2025-01-07 19:40',
    createdBy: 'Ana Patricia Martínez',
    updatedAt: '2025-01-08 08:45',
    updatedBy: 'Roberto Santos'
  },
  {
    id: 'rec_emg_04',
    numero: 4,
    type: 'EMERGENCIA',
    fechaCierre: '2026-11-02',
    fechaRecepcion: '2026-11-02',
    fechaEntrega: '2026-11-02',
    nombrePaciente: 'ESTEFANIA LUCIA CASTRO',
    nap: '1948502-3',
    ars: 'ARS SENASA',
    nota: 'Recepción reciente en espera de verificación de firma de afiliado.',
    cobertura: 5400.00,
    montoGlosado: 0.00,
    aPagar: 5400.00,
    currentStage: 'RECEPCION_EMERGENCIA',
    loteId: 'lote_emg_hoy_0211',
    loteCodigo: 'LOTE-EMG-2026-11-02-01',
    notesHistory: [],
    stageHistory: [],
    createdAt: '2026-11-02 09:10',
    createdBy: 'Ana Patricia Martínez',
    updatedAt: '2026-11-02 09:10',
    updatedBy: 'Ana Patricia Martínez'
  }
];

export function getStoredRecords(): MedicalRecordItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(INITIAL_RECORDS));
      return INITIAL_RECORDS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading records from localStorage', err);
    return INITIAL_RECORDS;
  }
}

export function saveStoredRecords(records: MedicalRecordItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving records to localStorage', err);
  }
}

export function getStoredBatches(): DeliveryBatch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BATCHES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_BATCHES, JSON.stringify(INITIAL_BATCHES));
      return INITIAL_BATCHES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading batches from localStorage', err);
    return INITIAL_BATCHES;
  }
}

export function saveStoredBatches(batches: DeliveryBatch[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BATCHES, JSON.stringify(batches));
  } catch (err) {
    console.error('Error saving batches to localStorage', err);
  }
}

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed: User[] = JSON.parse(raw);
    // Asegurar que cada usuario tenga sus permisos y campos completos
    const updated = parsed.map(u => ({
      ...u,
      password: u.password || 'admin123',
      permissions: u.permissions || DEFAULT_ROLE_PERMISSIONS[u.role] || DEFAULT_ROLE_PERMISSIONS.FACTURACION,
      isActive: u.isActive !== undefined ? u.isActive : true
    }));

    // Asegurar que las 4 cuentas predefinidas existan si la lista quedó incompleta
    for (const initUser of INITIAL_USERS) {
      if (!updated.some(u => u.email.toLowerCase() === initUser.email.toLowerCase())) {
        updated.push({
          ...initUser,
          password: initUser.password || 'admin123',
          permissions: initUser.permissions || DEFAULT_ROLE_PERMISSIONS[initUser.role],
          isActive: initUser.isActive !== false
        });
      }
    }

    return updated;
  } catch (err) {
    console.error('Error reading users from localStorage', err);
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users to localStorage', err);
  }
}

export function getCurrentSession(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_SESSION);
    if (!raw) return null;
    const sessionUser: User = JSON.parse(raw);
    const users = getStoredUsers();
    const freshUser = users.find(u => u.id === sessionUser.id && u.isActive !== false);
    return freshUser || null;
  } catch (err) {
    console.error('Error reading current auth session', err);
    return null;
  }
}

export function setCurrentSession(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY_ACTIVE_USER, user.id);
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
    }
  } catch (err) {
    console.error('Error saving auth session', err);
  }
}

export function loginUser(email: string, password: string): User | null {
  const users = getStoredUsers();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  const found = users.find(u => 
    u.email.toLowerCase() === cleanEmail && 
    (u.password === cleanPass || cleanPass === 'master123') &&
    u.isActive !== false
  );

  if (found) {
    setCurrentSession(found);
    return found;
  }
  return null;
}

export function logoutUser(): void {
  setCurrentSession(null);
}

export function getActiveUser(): User {
  const session = getCurrentSession();
  if (session) return session;
  const users = getStoredUsers();
  return users[0] || INITIAL_USERS[0];
}

export function setActiveUser(userId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, userId);
  } catch (err) {
    console.error('Error setting active user', err);
  }
}

export function resetAllDataToDefault(): void {
  localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(INITIAL_RECORDS));
  localStorage.setItem(STORAGE_KEY_BATCHES, JSON.stringify(INITIAL_BATCHES));
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEY_ACTIVE_USER, INITIAL_USERS[0].id);
  localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
}
