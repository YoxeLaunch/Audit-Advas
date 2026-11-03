export type RecordType = 'EXPEDIENTE' | 'EMERGENCIA';

export type ExpedienteStageId = 
  | 'RECEPCION'             // 1. Emisión Recepción (Facturación emite)
  | 'CONCILIACION_ADMIN'    // 2. Recepción Administrativa (Administrativo tacha y acepta)
  | 'AUDITORIA'             // 3. Relación a Auditores / Auditoría Médica
  | 'RECEPCION_AUDITORES'   // 4. Recepción de Auditores (Administrativo confirma procesado)
  | 'BIOPSIAS'              // 5B. Relación Biopsias u otros pendientes
  | 'ENTREGA_ARS'           // 5A. Relación Entrega a ARS (Completo)
  | 'FACTURACION';          // 6. Entrega a Facturación (Final)

export type EmergenciaStageId = 
  | 'RECEPCION_EMERGENCIA'        // 1. Emisión Emergencias (Facturación)
  | 'RECEPCION_ADMIN_EMERGENCIA'  // 2. Recepción Administrativa (Cotejo)
  | 'ENTREGA_ARS_EMERGENCIA'      // 3. Relación a ARS
  | 'FACTURACION_EMERGENCIA';     // 4. Entrega Final a Facturación

export type AnyStageId = ExpedienteStageId | EmergenciaStageId;

export interface StageConfig {
  id: AnyStageId;
  label: string;
  shortLabel: string;
  order: number;
  description: string;
  type: RecordType;
  officialDocTitle: string;
  color: string;
  allowedRoles?: UserRole[];
}

export type UserRole = 
  | 'ADMIN_ROOT' 
  | 'ADMINISTRATIVO' 
  | 'AUDITOR_MEDICO' 
  | 'FACTURACION'
  // Compatibilidad con registros previos:
  | 'ADMIN' 
  | 'RECEPCION' 
  | 'AUDITOR';

export interface UserPermissions {
  canEmitInitialRelation: boolean;     // Facturación: emite relación inicial
  canReceiveAndConciliate: boolean;    // Administrativo: tachar y aceptar que llegaron
  canDeliverToAuditors: boolean;       // Administrativo: hacer relación a auditores
  canAuditRecords: boolean;            // Auditor Médico: confirmar recepción, auditar, glosar
  canConfirmAuditorOutput: boolean;    // Administrativo: confirmar procesado en recepción auditores
  canManageBiopsias: boolean;          // Administrativo: relación biopsias / pendientes
  canDeliverToArs: boolean;            // Administrativo: entrega a ARS
  canDeliverToBilling: boolean;        // Administrativo: entrega a facturación
  canReceiveInBilling: boolean;        // Facturación: recibir entrega final
  canManageUsers: boolean;             // Root: gestionar usuarios y permisos
  canViewAllStages: boolean;           // Root / Superadmin: ver todo
  canDeleteRecords: boolean;           // Root: eliminar registros
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  roleName: string;
  roleBadgeColor: string;
  department: string;
  avatar: string;
  permissions?: UserPermissions;
  isActive?: boolean;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  ADMIN_ROOT: {
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
  },
  ADMIN: {
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
  },
  ADMINISTRATIVO: {
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
    canViewAllStages: false,
    canDeleteRecords: false
  },
  RECEPCION: {
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
    canViewAllStages: false,
    canDeleteRecords: false
  },
  AUDITOR_MEDICO: {
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
  },
  AUDITOR: {
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
  },
  FACTURACION: {
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
  }
};

export interface RecordNote {
  id: string;
  date: string;
  author: string;
  authorRole: UserRole;
  text: string;
  stageAtNote: string;
}

export interface StageHistoryItem {
  id: string;
  fromStage: string;
  toStage: string;
  changedAt: string;
  changedBy: string;
  notes?: string;
}

export type BatchStatus = 'ABIERTO' | 'EN_AUDITORIA' | 'ENTREGADO' | 'FACTURADO' | 'CONCILIADO';

export interface DeliveryBatch {
  id: string;
  codigo: string;          // e.g. "LOTE-2026-10-31-01"
  nombre: string;          // e.g. "Corte Diario - 26 Casos"
  tipo: RecordType;        // 'EXPEDIENTE' | 'EMERGENCIA'
  ars: string;             // Nombre de Aseguradora configurada o 'TODAS'
  etapa: AnyStageId;       // Current or target stage of the batch
  fechaCiclo: string;      // Date of the cycle (YYYY-MM-DD)
  fechaEntrega?: string;   // Date delivered
  estado: BatchStatus;
  descripcion?: string;
  creadoPor: string;
  creadoEn: string;
  entregadoPor?: string;
  recibidoPor?: string;
  notas?: string;
  recordIds?: string[];
}

export interface MedicalRecordItem {
  id: string;
  numero: number;
  type: RecordType;
  fechaCierre: string;       // F.CIERRE (e.g. 2026-10-31)
  fechaRecepcion?: string;   // Date when record entered reception
  fechaEntrega?: string;     // FECHA ENTREGA (for report)
  nombrePaciente: string;    // NOMBRE PACIENTE
  nap: string;               // NAP (Número de Autorización / Afiliado)
  ars: string;               // Aseguradora / Entidad configurada desde cero
  nota: string;              // Current main note
  cobertura: number;         // COBERTURA
  montoGlosado: number;      // MONTO GLOSADO
  aPagar: number;            // A PAGAR (= COBERTURA - MONTO GLOSADO)
  currentStage: AnyStageId;  // Current stage in the chain
  loteId?: string;           // Delivery batch / Cycle ID
  loteCodigo?: string;       // Visual code (e.g. "LOTE-2026-10-31-01")
  notesHistory: RecordNote[];
  stageHistory: StageHistoryItem[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;

  // Control de flujo y roles:
  conciliadoAdmin?: boolean;             // Administrativo tachó y aceptó
  conciliadoPor?: string;
  conciliadoEn?: string;

  auditorAsignadoId?: string;           // ID del Auditor Médico asignado
  auditorAsignadoNombre?: string;
  auditorConfirmado?: boolean;           // Auditor Médico confirmó recepción
  auditorConfirmadoEn?: string;
  auditoriaProcesada?: boolean;          // Auditor Médico emitió reporte y procesó
  auditoriaProcesadaEn?: string;
  reporteAuditoria?: string;             // Texto del reporte clínico de auditoría

  recepcionAuditoresConfirmada?: boolean; // Administrativo confirmó retorno de auditores
  recepcionAuditoresPor?: string;
  recepcionAuditoresEn?: string;

  tienePendienteBiopsia?: boolean;       // Marcado como pendiente de biopsia
  detallePendiente?: string;
  medicoTratante?: string;               // Médico en solicitud de histopatología / biopsia
  vecesEnviadaBiopsia?: number;          // 1 = Nueva del día, 2, 3+ = Pendientes recurrentes
  descripcionBiopsia?: string;           // Diagnóstico / pieza de biopsia (ej. HERNIA DISCAL LUMBAR)
  biopsiaCompletada?: boolean;           // Archivada como completada
  biopsiaCompletadaEn?: string;
  biopsiaCompletadaPor?: string;

  entregadoArsPor?: string;              // Trazabilidad entrega a ARS
  entregadoArsEn?: string;
  recibidoArsPor?: string;

  entregadoFacturacionPor?: string;      // Trazabilidad entrega a Facturación
  entregadoFacturacionEn?: string;

  facturacionConfirmada?: boolean;       // Facturación confirmó recepción final
  facturacionConfirmadaPor?: string;
  facturacionConfirmadaEn?: string;
}

export interface ArsExpirationConfig {
  ars_name: string;
  short_name: string;
  dias_vigencia: number;
  updated_at?: string;
  updated_by?: string;
}

export const EXPEDIENTE_STAGES: StageConfig[] = [
  {
    id: 'RECEPCION',
    label: '1. Emisión Recepción (Facturación)',
    shortLabel: 'Emisión Facturación',
    order: 1,
    description: 'Facturación emite la relación inicial de expedientes para auditoría.',
    type: 'EXPEDIENTE',
    officialDocTitle: 'RELACION DE EMISION DE EXPEDIENTES - FACTURACION',
    color: 'sky',
    allowedRoles: ['ADMIN_ROOT', 'FACTURACION', 'ADMIN']
  },
  {
    id: 'CONCILIACION_ADMIN',
    label: '2. Recepción Administrativa (Cotejo)',
    shortLabel: 'Cotejo Admin',
    order: 2,
    description: 'Rol Administrativo tacha y acepta que llegaron los expedientes relacionados.',
    type: 'EXPEDIENTE',
    officialDocTitle: 'ACTA DE RECEPCION Y COTEJO ADMINISTRATIVO',
    color: 'blue',
    allowedRoles: ['ADMIN_ROOT', 'ADMINISTRATIVO', 'ADMIN']
  },
  {
    id: 'AUDITORIA',
    label: '3. Relación a Auditores Médicos',
    shortLabel: 'Auditoría Médica',
    order: 3,
    description: 'Médicos auditores confirman recepción física, auditan cobertura, glosas y emiten reporte.',
    type: 'EXPEDIENTE',
    officialDocTitle: 'RELACION DE EXPEDIENTES A AUDITORES MEDICOS',
    color: 'amber',
    allowedRoles: ['ADMIN_ROOT', 'AUDITOR_MEDICO', 'ADMINISTRATIVO', 'ADMIN', 'AUDITOR']
  },
  {
    id: 'RECEPCION_AUDITORES',
    label: '4. Recepción de Auditores',
    shortLabel: 'Recepción Auditores',
    order: 4,
    description: 'Administrativo confirma expedientes procesados por auditores y deriva a ARS o Biopsias.',
    type: 'EXPEDIENTE',
    officialDocTitle: 'ACTA DE RECEPCION DE EXPEDIENTES PROCESADOS POR AUDITORIA',
    color: 'teal',
    allowedRoles: ['ADMIN_ROOT', 'ADMINISTRATIVO', 'ADMIN']
  },
  {
    id: 'BIOPSIAS',
    label: '5B. Relación de Biopsias / Casos Especiales',
    shortLabel: 'Biopsias / Pendientes',
    order: 5,
    description: 'Expedientes a la espera de resultados de biopsias, patología o informes pendientes.',
    type: 'EXPEDIENTE',
    officialDocTitle: 'RELACION DE EXPEDIENTES CON BIOPSIAS Y CASOS PENDIENTES',
    color: 'purple',
    allowedRoles: ['ADMIN_ROOT', 'ADMINISTRATIVO', 'ADMIN']
  },
  {
    id: 'ENTREGA_ARS',
    label: '5A. Relación Entrega a ARS',
    shortLabel: 'Entrega a ARS',
    order: 6,
    description: 'Expedientes completos remitidos formalmente a las aseguradoras ARS.',
    type: 'EXPEDIENTE',
    officialDocTitle: 'RELACION DE ENTREGA DE EXPEDIENTES A ARS',
    color: 'indigo',
    allowedRoles: ['ADMIN_ROOT', 'ADMINISTRATIVO', 'ADMIN']
  },
  {
    id: 'FACTURACION',
    label: '6. Entrega a Facturación (Final)',
    shortLabel: 'Entrega Facturación',
    order: 7,
    description: 'Entrega formal al departamento de Facturación para cobro, conciliación y radicación.',
    type: 'EXPEDIENTE',
    officialDocTitle: 'ENTREGA FINAL DE EXPEDIENTES A FACTURACION',
    color: 'emerald',
    allowedRoles: ['ADMIN_ROOT', 'ADMINISTRATIVO', 'FACTURACION', 'ADMIN']
  }
];

export const EMERGENCIA_STAGES: StageConfig[] = [
  {
    id: 'RECEPCION_EMERGENCIA',
    label: '1. Emisión Emergencias (Facturación)',
    shortLabel: 'Emisión Emerg.',
    order: 1,
    description: 'Facturación emite relación inicial de atenciones de emergencia.',
    type: 'EMERGENCIA',
    officialDocTitle: 'RELACION DE EMISION DE EMERGENCIAS',
    color: 'rose',
    allowedRoles: ['ADMIN_ROOT', 'FACTURACION', 'ADMIN']
  },
  {
    id: 'RECEPCION_ADMIN_EMERGENCIA',
    label: '2. Recepción Administrativa (Cotejo)',
    shortLabel: 'Cotejo Admin',
    order: 2,
    description: 'Administrativo tacha y acepta las emergencias relacionadas.',
    type: 'EMERGENCIA',
    officialDocTitle: 'ACTA DE COTEJO DE EMERGENCIAS',
    color: 'blue',
    allowedRoles: ['ADMIN_ROOT', 'ADMINISTRATIVO', 'ADMIN']
  },
  {
    id: 'ENTREGA_ARS_EMERGENCIA',
    label: '3. Relación a ARS',
    shortLabel: 'Entrega a ARS',
    order: 3,
    description: 'Envío de reclamaciones de emergencia a las aseguradoras.',
    type: 'EMERGENCIA',
    officialDocTitle: 'RELACION DE EMERGENCIAS A ARS',
    color: 'indigo',
    allowedRoles: ['ADMIN_ROOT', 'ADMINISTRATIVO', 'ADMIN']
  },
  {
    id: 'FACTURACION_EMERGENCIA',
    label: '4. Entrega Final a Facturación',
    shortLabel: 'Facturación Emerg.',
    order: 4,
    description: 'Traspaso a Facturación para cobro y conciliación final.',
    type: 'EMERGENCIA',
    officialDocTitle: 'ENTREGA FINAL DE EMERGENCIAS A FACTURACION',
    color: 'emerald',
    allowedRoles: ['ADMIN_ROOT', 'ADMINISTRATIVO', 'FACTURACION', 'ADMIN']
  }
];

// Lista inicial vacía: las aseguradoras / entidades se crean desde cero en el sistema
export const COMMON_ARS_LIST: string[] = [];
