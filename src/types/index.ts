export type RecordType = 'EXPEDIENTE' | 'EMERGENCIA';

export type ExpedienteStageId = 
  | 'RECEPCION' 
  | 'AUDITORIA' 
  | 'BIOPSIAS' 
  | 'ENTREGA_ARS' 
  | 'FACTURACION';

export type EmergenciaStageId = 
  | 'RECEPCION_EMERGENCIA' 
  | 'ENTREGA_ARS_EMERGENCIA' 
  | 'FACTURACION_EMERGENCIA';

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
}

export type UserRole = 'ADMIN' | 'RECEPCION' | 'AUDITOR' | 'FACTURACION';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleName: string;
  roleBadgeColor: string;
  department: string;
  avatar: string;
}

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
  codigo: string;          // e.g. "LOTE-2026-10-31-SENASA-01"
  nombre: string;          // e.g. "Corte Diario SeNaSa - 26 Casos"
  tipo: RecordType;        // 'EXPEDIENTE' | 'EMERGENCIA'
  ars: string;             // 'ARS SENASA', 'PRIMERA ARS', 'TODAS'
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
  ars: string;               // e.g. ARS SENASA, PRIMERA ARS, etc.
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
}

export const EXPEDIENTE_STAGES: StageConfig[] = [
  {
    id: 'RECEPCION',
    label: 'Recepción de Expedientes',
    shortLabel: 'Recepción',
    order: 1,
    description: 'Ingreso inicial, verificación de cierre clínico y documentación física.',
    type: 'EXPEDIENTE',
    officialDocTitle: 'RECEPCION DE EXPEDIENTES MEDICOS',
    color: 'sky'
  },
  {
    id: 'AUDITORIA',
    label: 'Relación a Auditores',
    shortLabel: 'Auditoría',
    order: 2,
    description: 'Revisión técnica y médica, asignación de glosas y verificación de pertinencia.',
    type: 'EXPEDIENTE',
    officialDocTitle: 'RELACION DE EXPEDIENTES A AUDITORES',
    color: 'amber'
  },
  {
    id: 'BIOPSIAS',
    label: 'Relación de Biopsias (u otra cuestión)',
    shortLabel: 'Biopsias / Especiales',
    order: 3,
    description: 'Expedientes a la espera de resultados de patología, biopsias o informes pendientes.',
    type: 'EXPEDIENTE',
    officialDocTitle: 'RELACION DE EXPEDIENTES CON BIOPSIAS Y CASOS ESPECIALES',
    color: 'purple'
  },
  {
    id: 'ENTREGA_ARS',
    label: 'Relación Entrega a ARS',
    shortLabel: 'Entrega a ARS',
    order: 4,
    description: 'Preparación de expedientes y remisión física/digital a las ARS aseguradoras.',
    type: 'EXPEDIENTE',
    officialDocTitle: 'RELACION DE ENTREGA DE EXPEDIENTES A ARS',
    color: 'indigo'
  },
  {
    id: 'FACTURACION',
    label: 'Relación Entrega Facturación',
    shortLabel: 'Facturación',
    order: 5,
    description: 'Entrega formal al departamento de facturación y cobros para radicación definitiva.',
    type: 'EXPEDIENTE',
    officialDocTitle: 'ENTREGA DE EXPEDIENTES A FACTURACION',
    color: 'emerald'
  }
];

export const EMERGENCIA_STAGES: StageConfig[] = [
  {
    id: 'RECEPCION_EMERGENCIA',
    label: 'Recepción de Emergencias',
    shortLabel: 'Recepción Emerg.',
    order: 1,
    description: 'Registro de atenciones de urgencia y triaje concluidas con soporte médico.',
    type: 'EMERGENCIA',
    officialDocTitle: 'RECEPCION DE EMERGENCIAS',
    color: 'rose'
  },
  {
    id: 'ENTREGA_ARS_EMERGENCIA',
    label: 'Relación a ARS',
    shortLabel: 'Relación a ARS',
    order: 2,
    description: 'Envío de reclamaciones y expedientes de emergencia a las aseguradoras.',
    type: 'EMERGENCIA',
    officialDocTitle: 'RELACION DE EMERGENCIAS A ARS',
    color: 'indigo'
  },
  {
    id: 'FACTURACION_EMERGENCIA',
    label: 'Relación Entrega a Facturación',
    shortLabel: 'Facturación Emerg.',
    order: 3,
    description: 'Traspaso a facturación médica para cobro y conciliación.',
    type: 'EMERGENCIA',
    officialDocTitle: 'ENTREGA DE EMERGENCIAS A FACTURACION',
    color: 'emerald'
  }
];

export const COMMON_ARS_LIST = [
  'ARS SENASA',
  'PRIMERA ARS DE HUMANO',
  'MAPFRE SALUD ARS',
  'HUMANO SEGUROS',
  'ARS MONUMENTAL',
  'ARS RENACER',
  'ARS SIMAG',
  'ARS YUNEN',
  'ARS CMD',
  'PRIVADO / PARTICULAR'
];
