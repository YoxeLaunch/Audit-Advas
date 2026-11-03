import { MedicalRecordItem, User, RecordType, AnyStageId, ArsExpirationConfig } from '../types';

export interface RecordsQueryOptions {
  type?: RecordType | 'ALL';
  stage?: AnyStageId | 'ALL';
  ars?: string;
  loteId?: string;
  year?: string | number;
  search?: string;
  page?: number;
  limit?: number | 'all';
  userRole?: string;
}

export interface RecordsQueryResult {
  success?: boolean;
  records: MedicalRecordItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hudMetrics?: Array<{
    current_stage: AnyStageId;
    count: number;
    total_a_pagar: number;
    total_glosado: number;
  }>;
  queryTimeMs: number;
}

export async function apiFetchRecords(options: RecordsQueryOptions = {}): Promise<RecordsQueryResult> {
  const params = new URLSearchParams();
  if (options.type) params.append('type', options.type);
  if (options.stage) params.append('stage', options.stage);
  if (options.ars) params.append('ars', options.ars);
  if (options.loteId) params.append('loteId', options.loteId);
  if (options.year) params.append('year', String(options.year));
  if (options.search) params.append('search', options.search);
  if (options.page) params.append('page', String(options.page));
  if (options.limit) params.append('limit', String(options.limit));
  if (options.userRole) params.append('userRole', options.userRole);

  const res = await fetch(`/api/records?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Error del servidor: ${res.statusText}`);
  }
  const data = await res.json();
  return data;
}

export async function apiCreateRecord(record: Partial<MedicalRecordItem>): Promise<MedicalRecordItem> {
  const res = await fetch('/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error al crear expediente');
  return data.record;
}

export async function apiUpdateRecord(id: string, record: Partial<MedicalRecordItem>): Promise<MedicalRecordItem> {
  const res = await fetch(`/api/records/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error al actualizar expediente');
  return data.record;
}

export async function apiDeleteRecord(id: string): Promise<void> {
  const res = await fetch(`/api/records/${id}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error al eliminar expediente');
}

export async function apiBulkConciliate(recordIds: string[], userName: string, auditorAsignadoNombre?: string): Promise<number> {
  const res = await fetch('/api/records/bulk-conciliate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordIds, userName, auditorAsignadoNombre })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error en conciliación masiva');
  return data.count;
}

export async function apiResetCleanRecords(): Promise<MedicalRecordItem[]> {
  const res = await fetch('/api/records/reset-clean', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error al limpiar registros');
  return data.records;
}

export async function apiFetchArsConfig(): Promise<ArsExpirationConfig[]> {
  const res = await fetch('/api/ars-config');
  const data = await res.json();
  return data.arsConfig || [];
}

export async function apiSaveArsConfig(configs: ArsExpirationConfig[], updatedBy: string): Promise<ArsExpirationConfig[]> {
  const res = await fetch('/api/ars-config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ configs, updatedBy })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error guardando configuración de ARS');
  return data.arsConfig || [];
}

export async function apiFetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users');
  const data = await res.json();
  return data.users || [];
}

export async function apiCreateUser(user: Partial<User>): Promise<string> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error creando usuario');
  return data.id;
}

export async function apiUpdateUser(user: User): Promise<void> {
  const res = await fetch(`/api/users/${user.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error actualizando usuario');
}

export async function apiLogin(email: string, password: string): Promise<User> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Credenciales inválidas');
  }
  return data.user;
}

export async function apiRunStressTest(count: number = 2000): Promise<{
  insertedCount: number;
  totalInDatabase: number;
  elapsedTimeMs: number;
  message: string;
}> {
  const res = await fetch('/api/test/stress-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error en prueba de estrés');
  return data;
}

export async function apiImportExternal(records: any[], sourceSystem: string): Promise<{
  importedCount: number;
  elapsedTimeMs: number;
  message: string;
}> {
  const res = await fetch('/api/sync/import-records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records, sourceSystem })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error en importación');
  return data;
}

export async function apiFetchClosures(): Promise<{
  success?: boolean;
  closures: any[];
  availableYears: number[];
}> {
  const res = await fetch('/api/closures');
  const data = await res.json();
  return data;
}

export async function apiCloseYear(year: number, notes: string, closedBy: string): Promise<any> {
  const res = await fetch('/api/closures/close-year', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, notes, closedBy })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error al cerrar año');
  return data;
}
