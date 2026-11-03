import { 
  AnyStageId, 
  EXPEDIENTE_STAGES, 
  EMERGENCIA_STAGES, 
  RecordType, 
  StageConfig,
  UserRole,
  User
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

export function getAllowedStagesForUser(user: User, type: RecordType): StageConfig[] {
  const allStages = getStagesForType(type);

  // Admin Root, Admin y Administrativo tienen acceso a casi todo el ciclo operativo
  if (
    user.role === 'ADMIN_ROOT' || 
    user.role === 'ADMIN' || 
    user.role === 'ADMINISTRATIVO' || 
    user.permissions?.canViewAllStages
  ) {
    return allStages;
  }

  // Auditor Médico: Solo ve las etapas médicas asignadas a su labor clínica
  if (user.role === 'AUDITOR_MEDICO' || user.role === 'AUDITOR') {
    if (type === 'EMERGENCIA') return [];
    return allStages.filter(s => s.id === 'AUDITORIA' || s.id === 'RECEPCION_AUDITORES');
  }

  // Facturación: Solo ve la emisión inicial y la entrega final para cobro
  if (user.role === 'FACTURACION') {
    if (type === 'EXPEDIENTE') {
      return allStages.filter(s => s.id === 'RECEPCION' || s.id === 'FACTURACION');
    } else {
      return allStages.filter(s => s.id === 'RECEPCION_EMERGENCIA' || s.id === 'FACTURACION_EMERGENCIA');
    }
  }

  return allStages;
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

export function canCreateRecord(userOrRole: User | UserRole): boolean {
  if (typeof userOrRole === 'string') {
    return userOrRole === 'ADMIN_ROOT' || userOrRole === 'FACTURACION' || userOrRole === 'ADMIN' || userOrRole === 'RECEPCION';
  }
  return userOrRole.permissions?.canEmitInitialRelation ?? (
    userOrRole.role === 'ADMIN_ROOT' || 
    userOrRole.role === 'FACTURACION' || 
    userOrRole.role === 'ADMIN' || 
    userOrRole.role === 'RECEPCION'
  );
}

export function canAuditRecord(userOrRole: User | UserRole): boolean {
  if (typeof userOrRole === 'string') {
    return userOrRole === 'ADMIN_ROOT' || userOrRole === 'AUDITOR_MEDICO' || userOrRole === 'ADMIN' || userOrRole === 'AUDITOR';
  }
  return userOrRole.permissions?.canAuditRecords ?? (
    userOrRole.role === 'ADMIN_ROOT' || 
    userOrRole.role === 'AUDITOR_MEDICO' || 
    userOrRole.role === 'ADMIN' || 
    userOrRole.role === 'AUDITOR'
  );
}

export function canConciliateRecord(userOrRole: User | UserRole): boolean {
  if (typeof userOrRole === 'string') {
    return userOrRole === 'ADMIN_ROOT' || userOrRole === 'ADMINISTRATIVO' || userOrRole === 'ADMIN' || userOrRole === 'RECEPCION';
  }
  return userOrRole.permissions?.canReceiveAndConciliate ?? (
    userOrRole.role === 'ADMIN_ROOT' || 
    userOrRole.role === 'ADMINISTRATIVO' || 
    userOrRole.role === 'ADMIN'
  );
}

export function canManageBilling(userOrRole: User | UserRole): boolean {
  if (typeof userOrRole === 'string') {
    return userOrRole === 'ADMIN_ROOT' || userOrRole === 'FACTURACION' || userOrRole === 'ADMIN';
  }
  return userOrRole.permissions?.canReceiveInBilling ?? (
    userOrRole.role === 'ADMIN_ROOT' || 
    userOrRole.role === 'FACTURACION' || 
    userOrRole.role === 'ADMIN'
  );
}

export function canDeleteRecord(userOrRole: User | UserRole): boolean {
  if (typeof userOrRole === 'string') {
    return userOrRole === 'ADMIN_ROOT' || userOrRole === 'ADMIN';
  }
  return userOrRole.permissions?.canDeleteRecords ?? (
    userOrRole.role === 'ADMIN_ROOT' || 
    userOrRole.role === 'ADMIN'
  );
}

export function canChangeStage(userOrRole: User | UserRole, targetStageId: AnyStageId): boolean {
  const role: UserRole = typeof userOrRole === 'string' ? userOrRole : userOrRole.role;
  const perms = typeof userOrRole === 'object' ? userOrRole.permissions : undefined;

  if (role === 'ADMIN_ROOT' || role === 'ADMIN') return true;

  if (targetStageId === 'RECEPCION' || targetStageId === 'RECEPCION_EMERGENCIA') {
    return perms?.canEmitInitialRelation ?? (role === 'FACTURACION');
  }

  if (targetStageId === 'CONCILIACION_ADMIN' || targetStageId === 'RECEPCION_ADMIN_EMERGENCIA') {
    return perms?.canReceiveAndConciliate ?? (role === 'ADMINISTRATIVO');
  }

  if (targetStageId === 'AUDITORIA') {
    return perms?.canDeliverToAuditors ?? (role === 'ADMINISTRATIVO');
  }

  if (targetStageId === 'RECEPCION_AUDITORES') {
    return perms?.canAuditRecords ?? perms?.canConfirmAuditorOutput ?? (role === 'AUDITOR_MEDICO' || role === 'ADMINISTRATIVO');
  }

  if (targetStageId === 'BIOPSIAS') {
    return perms?.canManageBiopsias ?? (role === 'ADMINISTRATIVO');
  }

  if (targetStageId === 'ENTREGA_ARS' || targetStageId === 'ENTREGA_ARS_EMERGENCIA') {
    return perms?.canDeliverToArs ?? (role === 'ADMINISTRATIVO');
  }

  if (targetStageId === 'FACTURACION' || targetStageId === 'FACTURACION_EMERGENCIA') {
    return perms?.canDeliverToBilling ?? perms?.canReceiveInBilling ?? (role === 'ADMINISTRATIVO' || role === 'FACTURACION');
  }

  return true;
}

export function normalizeArsName(ars: string | undefined | null): string {
  if (!ars || !ars.trim()) return 'SIN ASEGURADORA';
  return ars.toUpperCase().trim();
}

export interface RecordSlaStatus {
  diasVigencia: number;
  fechaVencimientoIso: string;
  fechaVencimientoDMY: string;
  diasRestantes: number;
  estado: 'ENTREGADO' | 'VIGENTE' | 'PROXIMO_A_VENCER' | 'VENCIDO';
  estadoLabel: string;
  cellClass: string;
}

export function calculateRecordSla(
  fechaCierre: string | undefined,
  ars: string | undefined,
  isDeliveredOrProcessed: boolean | undefined,
  arsConfigMap: Record<string, number> = {}
): RecordSlaStatus {
  const normArs = normalizeArsName(ars);
  const diasVigencia = arsConfigMap[normArs] || 60;

  if (!fechaCierre) {
    return {
      diasVigencia,
      fechaVencimientoIso: '-',
      fechaVencimientoDMY: '-',
      diasRestantes: diasVigencia,
      estado: isDeliveredOrProcessed ? 'ENTREGADO' : 'VIGENTE',
      estadoLabel: isDeliveredOrProcessed ? 'Entregado' : 'Vigente',
      cellClass: isDeliveredOrProcessed
        ? 'bg-emerald-600 text-white font-bold'
        : 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
    };
  }

  let baseDate: Date;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaCierre)) {
    const [d, m, y] = fechaCierre.split('/').map(Number);
    baseDate = new Date(y, m - 1, d);
  } else {
    const [y, m, d] = fechaCierre.split('-').map(Number);
    baseDate = new Date(y || 2026, (m || 11) - 1, d || 1);
  }

  if (isNaN(baseDate.getTime())) {
    baseDate = new Date();
  }

  const expDate = new Date(baseDate.getTime());
  expDate.setDate(expDate.getDate() + diasVigencia);

  const yyyy = expDate.getFullYear();
  const mm = String(expDate.getMonth() + 1).padStart(2, '0');
  const dd = String(expDate.getDate()).padStart(2, '0');
  const fechaVencimientoIso = `${yyyy}-${mm}-${dd}`;
  const fechaVencimientoDMY = `${dd}/${mm}/${yyyy}`;

  // Usar la fecha actual del sistema (o 2026-11-03 si estamos en el ciclo 2026)
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expMidnight = new Date(yyyy, expDate.getMonth(), expDate.getDate());

  const diffMs = expMidnight.getTime() - todayMidnight.getTime();
  const diasRestantes = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (isDeliveredOrProcessed) {
    return {
      diasVigencia,
      fechaVencimientoIso,
      fechaVencimientoDMY,
      diasRestantes,
      estado: 'ENTREGADO',
      estadoLabel: 'Entregado',
      cellClass: 'bg-emerald-600 text-white font-bold'
    };
  }

  if (diasRestantes < 0) {
    return {
      diasVigencia,
      fechaVencimientoIso,
      fechaVencimientoDMY,
      diasRestantes,
      estado: 'VENCIDO',
      estadoLabel: 'Vencido',
      cellClass: 'bg-red-600 text-white font-bold'
    };
  }

  if (diasRestantes <= 15) {
    return {
      diasVigencia,
      fechaVencimientoIso,
      fechaVencimientoDMY,
      diasRestantes,
      estado: 'PROXIMO_A_VENCER',
      estadoLabel: 'Próximo a Vencer',
      cellClass: 'bg-amber-500 text-white font-bold'
    };
  }

  return {
    diasVigencia,
    fechaVencimientoIso,
    fechaVencimientoDMY,
    diasRestantes,
    estado: 'VIGENTE',
    estadoLabel: 'Vigente',
    cellClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
  };
}

