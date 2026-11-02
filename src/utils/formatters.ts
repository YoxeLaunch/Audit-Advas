import { 
  AnyStageId, 
  EXPEDIENTE_STAGES, 
  EMERGENCIA_STAGES, 
  RecordType, 
  StageConfig,
  UserRole
} from '../types';

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'RD$ 0.00';
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount).replace('DOP', 'RD$');
}

export function formatDateToDMY(isoDate: string | undefined | null): string {
  if (!isoDate) return '-';
  // If already in DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoDate)) return isoDate;
  
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return isoDate;
}

export function formatDateTime(isoDateTime: string | undefined | null): string {
  if (!isoDateTime) return '-';
  try {
    const date = new Date(isoDateTime);
    if (isNaN(date.getTime())) return isoDateTime;
    return date.toLocaleString('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return isoDateTime;
  }
}

export function getStageConfig(stageId: AnyStageId): StageConfig | undefined {
  return [...EXPEDIENTE_STAGES, ...EMERGENCIA_STAGES].find(s => s.id === stageId);
}

export function getStagesForType(type: RecordType): StageConfig[] {
  return type === 'EXPEDIENTE' ? EXPEDIENTE_STAGES : EMERGENCIA_STAGES;
}

export function getNextStage(type: RecordType, currentStageId: AnyStageId): StageConfig | null {
  const stages = getStagesForType(type);
  const currentIndex = stages.findIndex(s => s.id === currentStageId);
  if (currentIndex >= 0 && currentIndex < stages.length - 1) {
    return stages[currentIndex + 1];
  }
  return null;
}

export function getPrevStage(type: RecordType, currentStageId: AnyStageId): StageConfig | null {
  const stages = getStagesForType(type);
  const currentIndex = stages.findIndex(s => s.id === currentStageId);
  if (currentIndex > 0) {
    return stages[currentIndex - 1];
  }
  return null;
}

export function canCreateRecord(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'RECEPCION';
}

export function canAuditRecord(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'AUDITOR';
}

export function canManageBilling(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'FACTURACION';
}

export function canDeleteRecord(role: UserRole): boolean {
  return role === 'ADMIN';
}

export function canChangeStage(role: UserRole, targetStageId: AnyStageId): boolean {
  if (role === 'ADMIN') return true;
  
  if (targetStageId === 'AUDITORIA' || targetStageId === 'RECEPCION' || targetStageId === 'RECEPCION_EMERGENCIA') {
    return role === 'RECEPCION' || role === 'AUDITOR';
  }
  
  if (targetStageId === 'BIOPSIAS') {
    return role === 'AUDITOR';
  }
  
  if (targetStageId === 'ENTREGA_ARS' || targetStageId === 'ENTREGA_ARS_EMERGENCIA') {
    return role === 'AUDITOR' || role === 'FACTURACION';
  }
  
  if (targetStageId === 'FACTURACION' || targetStageId === 'FACTURACION_EMERGENCIA') {
    return role === 'FACTURACION';
  }

  return true;
}
