import { 
  MedicalRecordItem, 
  User, 
  DeliveryBatch,
  DEFAULT_ROLE_PERMISSIONS
} from '../types';

const STORAGE_KEY_RECORDS = 'gcm_medical_records_v4';
const STORAGE_KEY_BATCHES = 'gcm_delivery_batches_v4';
const STORAGE_KEY_USERS = 'gcm_users_v4';
const STORAGE_KEY_ACTIVE_USER = 'gcm_active_user_id_v4';
const STORAGE_KEY_AUTH_SESSION = 'gcm_auth_session_v4';

// El proyecto inicia 100% limpio sin usuarios, lotes ni expedientes precargados.
export const INITIAL_USERS: User[] = [];
export const INITIAL_BATCHES: DeliveryBatch[] = [];
export const INITIAL_RECORDS: MedicalRecordItem[] = [];

export function getStoredRecords(): MedicalRecordItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading records from localStorage', err);
    return [];
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
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading batches from localStorage', err);
    return [];
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
    if (!raw) return [];
    const parsed: User[] = JSON.parse(raw);
    return parsed.map(u => ({
      ...u,
      permissions: u.permissions || DEFAULT_ROLE_PERMISSIONS[u.role] || DEFAULT_ROLE_PERMISSIONS.FACTURACION,
      isActive: u.isActive !== undefined ? u.isActive : true
    }));
  } catch (err) {
    console.error('Error reading users from localStorage', err);
    return [];
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
    if (users.length === 0) return sessionUser;
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

  const found = users.find(
    u =>
      u.email.toLowerCase() === cleanEmail &&
      u.password === cleanPass &&
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

export function getActiveUser(): User | null {
  const session = getCurrentSession();
  if (session) return session;
  const users = getStoredUsers();
  return users[0] || null;
}

export function setActiveUser(userId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, userId);
  } catch (err) {
    console.error('Error setting active user', err);
  }
}

export function resetAllDataToDefault(): void {
  localStorage.removeItem(STORAGE_KEY_RECORDS);
  localStorage.removeItem(STORAGE_KEY_BATCHES);
  localStorage.removeItem(STORAGE_KEY_USERS);
  localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
  localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
}
