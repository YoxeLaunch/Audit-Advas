import React, { useState, useEffect, useMemo } from 'react';
import { 
  RecordType, 
  AnyStageId, 
  MedicalRecordItem, 
  User, 
  RecordNote,
  StageHistoryItem,
  DeliveryBatch,
  ArsExpirationConfig,
  COMMON_ARS_LIST
} from './types';
import { 
  getStoredRecords, 
  saveStoredRecords, 
  getStoredBatches,
  saveStoredBatches, 
  getStoredUsers, 
  saveStoredUsers, 
  getCurrentSession,
  setCurrentSession,
  logoutUser,
  resetAllDataToDefault 
} from './services/storage';
import { getNextStage, getStageConfig, formatCurrency } from './utils/formatters';
import { Header, AreaNotificationItem } from './components/Header';
import { PipelineHUD } from './components/PipelineHUD';
import { TableView } from './components/TableView';
import { RecordModal } from './components/RecordModal';
import { NotesModal } from './components/NotesModal';
import { OfficialRelationModal } from './components/OfficialRelationModal';
import { UserManagementModal } from './components/UserManagementModal';
import { AuditProcessModal } from './components/AuditProcessModal';
import { ArsConfigModal } from './components/ArsConfigModal';
import { ThemeCurtainTransition } from './components/ThemeCurtainTransition';
import { LoginView } from './components/LoginView';
import { AnalyticsView } from './components/AnalyticsView';
import { BatchesView } from './components/BatchesView';
import { CreateBatchModal } from './components/CreateBatchModal';
import { DatabasePerformanceView } from './components/DatabasePerformanceView';
import { 
  apiFetchRecords, 
  apiCreateRecord, 
  apiUpdateRecord, 
  apiDeleteRecord, 
  apiBulkConciliate,
  apiFetchArsConfig,
  apiSaveArsConfig,
  apiFetchUsers,
  apiCreateUser,
  apiUpdateUser,
  apiResetCleanRecords
} from './services/apiService';

export default function App() {
  // Primary State inicializado de forma síncrona
  const [users, setUsers] = useState<User[]>(() => {
    try {
      return getStoredUsers();
    } catch {
      return [];
    }
  });

  const [activeUser, setActiveUserState] = useState<User | null>(() => {
    try {
      const session = getCurrentSession();
      if (session) return session;
      const loadedUsers = getStoredUsers();
      return loadedUsers[0] || null;
    } catch {
      return null;
    }
  });

  const [records, setRecords] = useState<MedicalRecordItem[]>(() => {
    try {
      return getStoredRecords();
    } catch {
      return [];
    }
  });

  const [batches, setBatches] = useState<DeliveryBatch[]>(() => {
    try {
      return getStoredBatches();
    } catch {
      return [];
    }
  });

  const [arsConfigs, setArsConfigs] = useState<ArsExpirationConfig[]>([]);

  // View & Filter State
  const [currentType, setCurrentType] = useState<RecordType>('EXPEDIENTE');
  const [selectedStage, setSelectedStage] = useState<AnyStageId | 'ALL'>('ALL');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string | 'ALL'>('ALL');
  const [activeView, setActiveView] = useState<'RECORDS' | 'BATCHES' | 'ANALYTICS' | 'DATABASE'>('RECORDS');

  // Modals State
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecordItem | null>(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedRecordForNotes, setSelectedRecordForNotes] = useState<MedicalRecordItem | null>(null);
  const [createBatchModalOpen, setCreateBatchModalOpen] = useState(false);
  const [officialReportModalOpen, setOfficialReportModalOpen] = useState(false);
  const [userManagementModalOpen, setUserManagementModalOpen] = useState(false);
  const [arsConfigModalOpen, setArsConfigModalOpen] = useState(false);
  
  // Audit Process Modal
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedRecordForAudit, setSelectedRecordForAudit] = useState<MedicalRecordItem | null>(null);

  const [reportData, setReportData] = useState<{
    records: MedicalRecordItem[];
    title: string;
    ars: string;
    deliveryDate: string;
    stage?: AnyStageId | 'ALL';
    auditorName?: string;
    deliveredBy?: string;
    receivedBy?: string;
  }>({
    records: [],
    title: '',
    ars: 'TODAS',
    deliveryDate: new Date().toISOString().split('T')[0]
  });

  // Toast Notification state (No invasiva)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [subtleAreaAlert, setSubtleAreaAlert] = useState<AreaNotificationItem | null>(null);

  // Estado de Modo Claro / Modo Oscuro y Cortina de Transición
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem('gcm_theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  const [curtainPhase, setCurtainPhase] = useState<'IDLE' | 'CLOSING' | 'HOLD' | 'OPENING'>('IDLE');
  const [targetTheme, setTargetTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', theme === 'dark');
  }, [theme]);

  const handleToggleTheme = () => {
    if (curtainPhase !== 'IDLE') return;
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTargetTheme(nextTheme);
    setCurtainPhase('CLOSING');

    setTimeout(() => {
      setCurtainPhase('HOLD');
      setTheme(nextTheme);
      try {
        localStorage.setItem('gcm_theme', nextTheme);
      } catch {}
      document.documentElement.classList.toggle('dark-mode', nextTheme === 'dark');
    }, 520);

    setTimeout(() => {
      setCurtainPhase('OPENING');
    }, 1250);

    setTimeout(() => {
      setCurtainPhase('IDLE');
    }, 1780);
  };

  // Notificaciones por Área Receptora (No Invasivas)
  const areaNotifications = useMemo<AreaNotificationItem[]>(() => {
    if (!activeUser) return [];
    const list: AreaNotificationItem[] = [];
    const role = activeUser.role;

    // 1. Área Administrativa: Recibe relaciones emitidas por Facturación y retornos de Auditores
    if (role === 'ADMINISTRATIVO' || role === 'ADMIN_ROOT' || role === 'ADMIN') {
      const recFromBilling = records.filter(
        r => r.type === 'EXPEDIENTE' && (r.currentStage === 'RECEPCION' || r.currentStage === 'CONCILIACION_ADMIN') && !r.conciliadoAdmin
      );
      if (recFromBilling.length > 0) {
        list.push({
          id: 'notif_admin_recepcion',
          title: 'Relación de Recepción (Expedientes)',
          subtitle: 'Pendientes de tachar y aceptar llegada física en Auditoría',
          sender: recFromBilling[0].createdBy || 'Facturación',
          targetStage: 'RECEPCION',
          targetType: 'EXPEDIENTE',
          count: recFromBilling.length,
          badgeColor: 'bg-sky-100 text-sky-800 border border-sky-300'
        });
      }

      const recFromAuditors = records.filter(
        r => r.type === 'EXPEDIENTE' && r.currentStage === 'RECEPCION_AUDITORES'
      );
      if (recFromAuditors.length > 0) {
        list.push({
          id: 'notif_admin_auditores',
          title: 'Retorno de Auditores Médicos',
          subtitle: 'Expedientes auditados listos para enviar a ARS o Biopsias',
          sender: recFromAuditors[0].auditorAsignadoNombre || 'Auditoría Médica',
          targetStage: 'RECEPCION_AUDITORES',
          targetType: 'EXPEDIENTE',
          count: recFromAuditors.length,
          badgeColor: 'bg-teal-100 text-teal-800 border border-teal-300'
        });
      }

      const recBiopsias = records.filter(
        r => r.type === 'EXPEDIENTE' && r.currentStage === 'BIOPSIAS' && !r.biopsiaCompletada
      );
      if (recBiopsias.length > 0) {
        list.push({
          id: 'notif_admin_biopsias',
          title: 'Seguimiento de Biopsias Activas',
          subtitle: 'Casos en espera de reporte de histopatología',
          sender: 'Administrativo / Patología',
          targetStage: 'BIOPSIAS',
          targetType: 'EXPEDIENTE',
          count: recBiopsias.length,
          badgeColor: 'bg-purple-100 text-purple-800 border border-purple-300'
        });
      }
    }

    // 2. Área Auditor Médico: Recibe expedientes asignados por Administrativo
    if (role === 'AUDITOR_MEDICO' || role === 'AUDITOR' || role === 'ADMIN_ROOT') {
      const assignedToAuditor = records.filter(
        r =>
          r.type === 'EXPEDIENTE' &&
          r.currentStage === 'AUDITORIA' &&
          !r.auditoriaProcesada &&
          (role === 'ADMIN_ROOT' || !r.auditorAsignadoNombre || r.auditorAsignadoNombre === activeUser.name)
      );
      if (assignedToAuditor.length > 0) {
        list.push({
          id: 'notif_auditor_pendientes',
          title: 'Expedientes Recibidos para Auditar',
          subtitle: 'Pendientes de revisión médica, glosas y emisión de reporte',
          sender: assignedToAuditor[0].conciliadoPor || 'Administrativo de Auditoría',
          targetStage: 'AUDITORIA',
          targetType: 'EXPEDIENTE',
          count: assignedToAuditor.length,
          badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300'
        });
      }
    }

    // 3. Área Facturación: Recibe entrega final de expedientes y emergencias desde Auditoría
    if (role === 'FACTURACION' || role === 'ADMIN_ROOT') {
      const finalBillingExp = records.filter(
        r => r.type === 'EXPEDIENTE' && r.currentStage === 'FACTURACION' && !r.facturacionConfirmada
      );
      if (finalBillingExp.length > 0) {
        list.push({
          id: 'notif_facturacion_final',
          title: 'Entrega Final a Facturación',
          subtitle: 'Expedientes auditados listos para recibir y radicar',
          sender: finalBillingExp[0].entregadoFacturacionPor || 'Administrativo de Auditoría',
          targetStage: 'FACTURACION',
          targetType: 'EXPEDIENTE',
          count: finalBillingExp.length,
          badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300'
        });
      }
    }

    return list;
  }, [activeUser, records]);

  // Al cambiar de usuario/rol, mostrar aviso sutil y no invasivo si su área tiene recepciones pendientes
  useEffect(() => {
    if (areaNotifications.length > 0) {
      setSubtleAreaAlert(areaNotifications[0]);
      const timer = setTimeout(() => {
        setSubtleAreaAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setSubtleAreaAlert(null);
    }
  }, [activeUser?.id, areaNotifications.length]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Mapa de días de vigencia por ARS
  const arsConfigMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of arsConfigs) {
      map[c.ars_name.toUpperCase()] = c.dias_vigencia;
    }
    return map;
  }, [arsConfigs]);

  // Sincronización con la Base de Datos SQLite interna (Fuente de verdad persistente)
  const loadBackendData = async () => {
    try {
      const [recData, cfgData, usrData] = await Promise.all([
        apiFetchRecords({ limit: 'all', type: 'ALL' }),
        apiFetchArsConfig(),
        apiFetchUsers()
      ]);

      if (recData && recData.success && Array.isArray(recData.records)) {
        setRecords(recData.records);
        saveStoredRecords(recData.records);
      }

      if (cfgData && Array.isArray(cfgData)) {
        setArsConfigs(cfgData);
      }

      if (usrData && Array.isArray(usrData)) {
        setUsers(usrData);
        saveStoredUsers(usrData);
      }
    } catch (e) {
      console.warn('Error sincronizando con SQLite:', e);
    }
  };

  useEffect(() => {
    loadBackendData();
  }, [activeUser?.id]);

  // Guardar y sincronizar estado local + SQLite
  const updateRecordsState = (newRecords: MedicalRecordItem[]) => {
    setRecords(newRecords);
    saveStoredRecords(newRecords);
  };

  const persistSingleRecord = async (record: MedicalRecordItem, isNew = false) => {
    try {
      if (isNew) {
        await apiCreateRecord(record);
      } else {
        await apiUpdateRecord(record.id, record);
      }
    } catch (e) {
      console.error('Error guardando registro en SQLite:', e);
    }
  };

  const updateBatches = (newBatches: DeliveryBatch[]) => {
    setBatches(newBatches);
    saveStoredBatches(newBatches);
  };

  // Guardar configuración de vigencia por ARS en SQLite
  const handleSaveArsConfigs = async (newConfigs: ArsExpirationConfig[]) => {
    try {
      const saved = await apiSaveArsConfig(newConfigs, activeUser?.name || 'Admin');
      setArsConfigs(saved);
      showToast('✓ Vigencia de meses/días por ARS actualizada en la base de datos.');
    } catch (e) {
      setArsConfigs(newConfigs);
      showToast('Vigencia de ARS actualizada.');
    }
  };

  // Login handler
  const handleLoginSuccess = (user: User) => {
    setActiveUserState(user);
    setCurrentSession(user);
    showToast(`Bienvenido al sistema: ${user.name} (${user.roleName})`);
  };

  // Logout handler
  const handleLogout = () => {
    logoutUser();
    setActiveUserState(null);
    showToast('Sesión cerrada correctamente.');
  };

  // Change active user from dropdown
  const handleSelectUser = (user: User) => {
    setActiveUserState(user);
    setCurrentSession(user);
    showToast(`Sesión cambiada a: ${user.name} (${user.roleName})`);
  };

  // Add new user from Root (Persistido en SQLite)
  const handleAddUser = async (newUserData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...newUserData,
      id: `usr_${Date.now()}`
    };
    const updated = [...users, newUser];
    setUsers(updated);
    saveStoredUsers(updated);
    try {
      await apiCreateUser(newUser);
    } catch (e) {
      console.error(e);
    }
    showToast(`✓ Usuario ${newUser.name} registrado en la base de datos.`);
  };

  // Save edited user (Persistido en SQLite)
  const handleSaveUser = async (updatedUser: User) => {
    const updated = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updated);
    saveStoredUsers(updated);
    if (activeUser?.id === updatedUser.id) {
      setActiveUserState(updatedUser);
      setCurrentSession(updatedUser);
    }
    try {
      await apiUpdateUser(updatedUser);
    } catch (e) {
      console.error(e);
    }
    showToast(`✓ Usuario ${updatedUser.name} actualizado en la base de datos.`);
  };

  // Reset demo data en SQLite y local
  const handleResetData = async () => {
    try {
      const cleanRecords = await apiResetCleanRecords();
      updateRecordsState(cleanRecords);
      showToast('✓ Base de datos limpiada y restaurada con registros hospitalarios reales.');
    } catch {
      resetAllDataToDefault();
      await loadBackendData();
      showToast('Datos restaurados.');
    }
  };

  // Open create record modal
  const handleOpenNewRecord = (type: RecordType) => {
    setCurrentType(type);
    setEditingRecord(null);
    setRecordModalOpen(true);
  };

  // Open edit record modal
  const handleEditRecord = (record: MedicalRecordItem) => {
    setEditingRecord(record);
    setRecordModalOpen(true);
  };

  // Delete record (Persistido en SQLite)
  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este registro de la base de datos?')) {
      const updated = records.filter(r => r.id !== id);
      updateRecordsState(updated);
      try {
        await apiDeleteRecord(id);
      } catch (e) {
        console.error(e);
      }
      showToast('Registro eliminado de la base de datos.');
    }
  };

  // Create or Update Record (Persistido en SQLite)
  const handleSaveRecord = async (recordData: Partial<MedicalRecordItem>) => {
    const timestamp = new Date().toLocaleString('es-DO');
    const operatorLabel = activeUser ? `${activeUser.name} (${activeUser.roleName})` : 'Sistema';

    if (recordData.id) {
      let targetUpdated: MedicalRecordItem | null = null;
      const updated = records.map(r => {
        if (r.id === recordData.id) {
          const wasStageChanged = recordData.currentStage && recordData.currentStage !== r.currentStage;
          const newStageHistory: StageHistoryItem[] = wasStageChanged
            ? [
                ...(r.stageHistory || []),
                {
                  id: `sh_${Date.now()}`,
                  fromStage: r.currentStage,
                  toStage: recordData.currentStage!,
                  changedAt: timestamp,
                  changedBy: operatorLabel
                }
              ]
            : r.stageHistory || [];

          const cob = recordData.cobertura !== undefined ? Number(recordData.cobertura) : r.cobertura;
          const glo = recordData.montoGlosado !== undefined ? Number(recordData.montoGlosado) : r.montoGlosado;

          targetUpdated = {
            ...r,
            ...recordData,
            cobertura: cob,
            montoGlosado: glo,
            aPagar: Math.max(0, cob - glo),
            stageHistory: newStageHistory,
            updatedAt: timestamp,
            updatedBy: operatorLabel
          } as MedicalRecordItem;
          return targetUpdated;
        }
        return r;
      });

      updateRecordsState(updated);
      if (targetUpdated) {
        await persistSingleRecord(targetUpdated, false);
      }
      showToast(`✓ Registro de ${recordData.nombrePaciente} guardado en base de datos.`);
    } else {
      const nextNumero = records.filter(r => r.type === (recordData.type || currentType)).length + 1;
      const initialStage =
        recordData.currentStage ||
        (selectedStage !== 'ALL'
          ? selectedStage
          : (recordData.type || currentType) === 'EXPEDIENTE'
          ? 'RECEPCION'
          : 'RECEPCION_EMERGENCIA');

      const todayIso = new Date().toISOString().split('T')[0];
      const cob = Number(recordData.cobertura || 0);
      const glo = Number(recordData.montoGlosado || 0);

      const initialNote: RecordNote = {
        id: `note_${Date.now()}`,
        date: timestamp,
        author: operatorLabel,
        authorRole: activeUser?.role || 'FACTURACION',
        text: recordData.nota || `Emitido en etapa ${initialStage} por ${operatorLabel}`,
        stageAtNote: initialStage
      };

      const initialStageHistory: StageHistoryItem = {
        id: `sh_${Date.now()}`,
        fromStage: 'INICIO',
        toStage: initialStage,
        changedAt: timestamp,
        changedBy: operatorLabel
      };

      const cleanArs = (recordData.ars || 'SIN ASEGURADORA').toUpperCase().trim();
      const newRecord: MedicalRecordItem = {
        id: `rec_${Date.now()}`,
        numero: nextNumero,
        type: recordData.type || currentType,
        nombrePaciente: (recordData.nombrePaciente || 'PACIENTE SIN NOMBRE').toUpperCase(),
        nap: recordData.nap || 'SIN-NAP',
        ars: cleanArs,
        fechaCierre: recordData.fechaCierre || todayIso,
        fechaRecepcion: todayIso,
        fechaEntrega: recordData.fechaEntrega || todayIso,
        cobertura: cob,
        montoGlosado: glo,
        aPagar: Math.max(0, cob - glo),
        nota: recordData.nota || '',
        currentStage: initialStage,
        loteId: recordData.loteId,
        loteCodigo: recordData.loteCodigo || `REL-${recordData.fechaEntrega || todayIso}`,
        auditorAsignadoNombre: recordData.auditorAsignadoNombre,
        tienePendienteBiopsia: initialStage === 'BIOPSIAS' || Boolean(recordData.tienePendienteBiopsia),
        medicoTratante: recordData.medicoTratante,
        vecesEnviadaBiopsia: recordData.vecesEnviadaBiopsia || 1,
        descripcionBiopsia: recordData.descripcionBiopsia,
        notesHistory: [initialNote],
        stageHistory: [initialStageHistory],
        createdAt: timestamp,
        createdBy: operatorLabel,
        updatedAt: timestamp,
        updatedBy: operatorLabel,
        conciliadoAdmin: false
      };

      if (
        cleanArs &&
        cleanArs !== 'SIN ASEGURADORA' &&
        cleanArs !== 'TODAS' &&
        !arsConfigs.some(c => c.ars_name.toUpperCase() === cleanArs)
      ) {
        setArsConfigs(prev => [
          ...prev,
          { ars_name: cleanArs, short_name: cleanArs, dias_vigencia: 60 }
        ]);
      }

      updateRecordsState([newRecord, ...records]);
      await persistSingleRecord(newRecord, true);
      showToast(`✓ Nuevo registro guardado en base de datos: ${newRecord.nombrePaciente} (Generado por ${operatorLabel})`);
    }
  };

  // Workflow Action 1: Tachar y Aceptar llegada (Recepción Administrativa -> Auditor)
  const handleConciliateRecord = async (record: MedicalRecordItem, auditorName?: string) => {
    const timestamp = new Date().toLocaleString('es-DO');
    const operatorLabel = activeUser ? `${activeUser.name} (${activeUser.roleName})` : 'Administrativo';
    const targetStage: AnyStageId = record.type === 'EXPEDIENTE' ? 'AUDITORIA' : 'ENTREGA_ARS_EMERGENCIA';
    const assignedAuditor = auditorName || record.auditorAsignadoNombre || 'Auditoría Médica';

    const noteItem: RecordNote = {
      id: `n_${Date.now()}`,
      date: timestamp,
      author: operatorLabel,
      authorRole: activeUser?.role || 'ADMINISTRATIVO',
      text: `Llegada física aceptada y cotejada por ${operatorLabel}. Entregado a: ${assignedAuditor}.`,
      stageAtNote: targetStage
    };

    const historyItem: StageHistoryItem = {
      id: `sh_${Date.now()}`,
      fromStage: record.currentStage,
      toStage: targetStage,
      changedAt: timestamp,
      changedBy: operatorLabel,
      notes: `Cotejado y entregado a ${assignedAuditor}`
    };

    let targetUpdated: MedicalRecordItem | null = null;
    const updated = records.map(r => {
      if (r.id === record.id) {
        targetUpdated = {
          ...r,
          conciliadoAdmin: true,
          conciliadoPor: operatorLabel,
          conciliadoEn: timestamp,
          auditorAsignadoNombre: record.type === 'EXPEDIENTE' ? assignedAuditor : undefined,
          currentStage: targetStage,
          notesHistory: [...(r.notesHistory || []), noteItem],
          stageHistory: [...(r.stageHistory || []), historyItem],
          updatedAt: timestamp,
          updatedBy: operatorLabel
        };
        return targetUpdated;
      }
      return r;
    });

    updateRecordsState(updated);
    if (targetUpdated) {
      await persistSingleRecord(targetUpdated, false);
    }
    showToast(`✓ Llegada aceptada por ${activeUser?.name} y entregada a ${assignedAuditor}.`);
  };

  // Bulk Conciliate: Tachar y Aceptar en lote (Persistido en SQLite)
  const handleBulkConciliate = async (recordIds: string[], auditorName?: string) => {
    const timestamp = new Date().toLocaleString('es-DO');
    const operatorLabel = activeUser ? `${activeUser.name} (${activeUser.roleName})` : 'Administrativo';
    const assignedAuditor = auditorName || 'Auditoría Médica';

    const updated = records.map(r => {
      if (recordIds.includes(r.id)) {
        const targetStage: AnyStageId = r.type === 'EXPEDIENTE' ? 'AUDITORIA' : 'ENTREGA_ARS_EMERGENCIA';
        return {
          ...r,
          conciliadoAdmin: true,
          conciliadoPor: operatorLabel,
          conciliadoEn: timestamp,
          auditorAsignadoNombre: r.type === 'EXPEDIENTE' ? assignedAuditor : r.auditorAsignadoNombre,
          currentStage: targetStage,
          updatedAt: timestamp,
          updatedBy: operatorLabel
        };
      }
      return r;
    });

    updateRecordsState(updated);
    try {
      await apiBulkConciliate(recordIds, operatorLabel, assignedAuditor);
    } catch (e) {
      console.error(e);
    }
    showToast(`✓ ${recordIds.length} registros cotejados por ${activeUser?.name} y entregados a ${assignedAuditor}.`);
  };

  // Open Audit Process Modal
  const handleOpenAuditModal = (record: MedicalRecordItem) => {
    setSelectedRecordForAudit(record);
    setAuditModalOpen(true);
  };

  // Workflow Action 2: Guardar Auditoría Médica y Procesar (Persistido en SQLite)
  const handleSaveAudit = async (
    recordId: string, 
    data: { 
      montoGlosado: number; 
      reporteAuditoria: string; 
      auditorConfirmado: boolean;
      auditoriaProcesada: boolean;
      advanceToNextStage?: boolean;
    }
  ) => {
    const timestamp = new Date().toLocaleString('es-DO');
    const operatorLabel = activeUser ? `${activeUser.name}` : 'Auditor Médico';
    const targetStage: AnyStageId = data.advanceToNextStage ? 'RECEPCION_AUDITORES' : 'AUDITORIA';

    let targetUpdated: MedicalRecordItem | null = null;
    const updated = records.map(r => {
      if (r.id === recordId) {
        const aPagar = Math.max(0, (r.cobertura || 0) - data.montoGlosado);
        const notes = [...(r.notesHistory || [])];
        const histories = [...(r.stageHistory || [])];

        if (data.reporteAuditoria) {
          notes.push({
            id: `n_${Date.now()}`,
            date: timestamp,
            author: operatorLabel,
            authorRole: activeUser?.role || 'AUDITOR_MEDICO',
            text: `Reporte de Auditoría (${operatorLabel}): ${data.reporteAuditoria} | Glosa: ${formatCurrency(data.montoGlosado)}`,
            stageAtNote: targetStage
          });
        }

        if (data.advanceToNextStage && r.currentStage !== targetStage) {
          histories.push({
            id: `sh_${Date.now()}`,
            fromStage: r.currentStage,
            toStage: targetStage,
            changedAt: timestamp,
            changedBy: operatorLabel,
            notes: 'Auditoría médica completada y entregada a Recepción de Auditores.'
          });
        }

        targetUpdated = {
          ...r,
          montoGlosado: data.montoGlosado,
          aPagar,
          nota: data.reporteAuditoria || r.nota,
          reporteAuditoria: data.reporteAuditoria,
          auditorConfirmado: data.auditorConfirmado,
          auditorConfirmadoEn: data.auditorConfirmado ? (r.auditorConfirmadoEn || timestamp) : undefined,
          auditorAsignadoNombre: r.auditorAsignadoNombre || operatorLabel,
          auditoriaProcesada: data.auditoriaProcesada,
          auditoriaProcesadaEn: data.auditoriaProcesada ? timestamp : undefined,
          currentStage: targetStage,
          notesHistory: notes,
          stageHistory: histories,
          updatedAt: timestamp,
          updatedBy: operatorLabel
        };
        return targetUpdated;
      }
      return r;
    });

    updateRecordsState(updated);
    if (targetUpdated) {
      await persistSingleRecord(targetUpdated, false);
    }
    showToast(
      data.advanceToNextStage
        ? `✓ Expediente auditado y marcado como Entregado por ${operatorLabel}.`
        : '✓ Avance de auditoría guardado en base de datos.'
    );
  };

  // Workflow Action 3: Derivar a Entrega ARS (Caso Completo - Persistido en SQLite)
  const handleRouteToArs = async (record: MedicalRecordItem) => {
    const timestamp = new Date().toLocaleString('es-DO');
    const operatorLabel = activeUser ? `${activeUser.name} (${activeUser.roleName})` : 'Administrativo';
    const targetStage: AnyStageId = record.type === 'EXPEDIENTE' ? 'ENTREGA_ARS' : 'ENTREGA_ARS_EMERGENCIA';

    let targetUpdated: MedicalRecordItem | null = null;
    const updated = records.map(r => {
      if (r.id === record.id) {
        targetUpdated = {
          ...r,
          currentStage: targetStage,
          recepcionAuditoresConfirmada: true,
          recepcionAuditoresPor: operatorLabel,
          recepcionAuditoresEn: timestamp,
          entregadoArsPor: operatorLabel,
          entregadoArsEn: timestamp,
          recibidoArsPor: `Valija Oficial ARS ${r.ars}`,
          updatedAt: timestamp,
          updatedBy: operatorLabel
        };
        return targetUpdated;
      }
      return r;
    });

    updateRecordsState(updated);
    if (targetUpdated) {
      await persistSingleRecord(targetUpdated, false);
    }
    showToast(`✓ Expediente de ${record.nombrePaciente} pasado a Entrega a ARS (${record.ars}).`);
  };

  // Workflow Action 4: Derivar a Biopsias u otros pendientes (Persistido en SQLite)
  const handleRouteToBiopsias = async (record: MedicalRecordItem) => {
    const timestamp = new Date().toLocaleString('es-DO');
    const operatorLabel = activeUser ? `${activeUser.name} (${activeUser.roleName})` : 'Administrativo';
    const targetStage: AnyStageId = 'BIOPSIAS';

    let targetUpdated: MedicalRecordItem | null = null;
    const updated = records.map(r => {
      if (r.id === record.id) {
        targetUpdated = {
          ...r,
          currentStage: targetStage,
          tienePendienteBiopsia: true,
          vecesEnviadaBiopsia: r.vecesEnviadaBiopsia || 1,
          medicoTratante: r.medicoTratante || r.auditorAsignadoNombre || 'DR. TRATANTE',
          descripcionBiopsia: r.descripcionBiopsia || r.nota || 'REPORTE HISTOPATOLOGICO PENDIENTE',
          recepcionAuditoresConfirmada: true,
          recepcionAuditoresPor: operatorLabel,
          recepcionAuditoresEn: timestamp,
          updatedAt: timestamp,
          updatedBy: operatorLabel
        };
        return targetUpdated;
      }
      return r;
    });

    updateRecordsState(updated);
    if (targetUpdated) {
      await persistSingleRecord(targetUpdated, false);
    }
    showToast(`✓ Expediente de ${record.nombrePaciente} enviado a Solicitud de Biopsias (Enviadas: 1).`);
  };

  // Workflow Action 4B: Incrementar contador de envíos en Biopsia (1 -> 2 -> 3...)
  const handleIncrementBiopsiaSend = async (record: MedicalRecordItem) => {
    const timestamp = new Date().toLocaleString('es-DO');
    const operatorLabel = activeUser ? `${activeUser.name} (${activeUser.roleName})` : 'Administrativo';
    const nextCount = (record.vecesEnviadaBiopsia || 1) + 1;

    let targetUpdated: MedicalRecordItem | null = null;
    const updated = records.map(r => {
      if (r.id === record.id) {
        targetUpdated = {
          ...r,
          vecesEnviadaBiopsia: nextCount,
          updatedAt: timestamp,
          updatedBy: operatorLabel
        };
        return targetUpdated;
      }
      return r;
    });

    updateRecordsState(updated);
    if (targetUpdated) {
      await persistSingleRecord(targetUpdated, false);
    }
    showToast(`✓ Biopsia de ${record.nombrePaciente} marcada con ${nextCount} envíos (Pasa a sección Biopsias Pendientes).`);
  };

  // Workflow Action 4C: Completar Biopsia, Archivar en Completadas y Pasar a Entrega ARS
  const handleCompleteBiopsia = async (record: MedicalRecordItem) => {
    const timestamp = new Date().toLocaleString('es-DO');
    const operatorLabel = activeUser ? `${activeUser.name} (${activeUser.roleName})` : 'Administrativo';

    let targetUpdated: MedicalRecordItem | null = null;
    const updated = records.map(r => {
      if (r.id === record.id) {
        targetUpdated = {
          ...r,
          tienePendienteBiopsia: false,
          biopsiaCompletada: true,
          biopsiaCompletadaEn: timestamp,
          biopsiaCompletadaPor: operatorLabel,
          currentStage: 'ENTREGA_ARS',
          entregadoArsPor: operatorLabel,
          entregadoArsEn: timestamp,
          recibidoArsPor: `ARS ${r.ars}`,
          updatedAt: timestamp,
          updatedBy: operatorLabel
        };
        return targetUpdated;
      }
      return r;
    });

    updateRecordsState(updated);
    if (targetUpdated) {
      await persistSingleRecord(targetUpdated, false);
    }
    showToast(`✓ Biopsia de ${record.nombrePaciente} archivada en Completadas y expediente enviado a Entrega ARS (${record.ars}).`);
  };

  // Workflow Action 5: Confirmar Recepción en Facturación (Radicación Final)
  const handleConfirmBillingDelivery = async (record: MedicalRecordItem) => {
    const timestamp = new Date().toLocaleString('es-DO');
    const operatorLabel = activeUser ? `${activeUser.name} (${activeUser.roleName})` : 'Facturación';

    let targetUpdated: MedicalRecordItem | null = null;
    const updated = records.map(r => {
      if (r.id === record.id) {
        targetUpdated = {
          ...r,
          facturacionConfirmada: true,
          facturacionConfirmadaPor: operatorLabel,
          facturacionConfirmadaEn: timestamp,
          updatedAt: timestamp,
          updatedBy: operatorLabel
        };
        return targetUpdated;
      }
      return r;
    });

    updateRecordsState(updated);
    if (targetUpdated) {
      await persistSingleRecord(targetUpdated, false);
    }
    showToast(`✓ Recepción final confirmada en Facturación por ${operatorLabel}.`);
  };

  // Create New Delivery Batch
  const handleCreateBatch = (batchData: Omit<DeliveryBatch, 'id'>) => {
    const newBatch: DeliveryBatch = {
      ...batchData,
      id: `lote_${Date.now()}`
    };
    const updated = [newBatch, ...batches];
    updateBatches(updated);
    showToast(`Lote ${newBatch.codigo} creado exitosamente.`);
  };

  // Jump from Batches View to Table View
  const handleSelectBatchToFilter = (batchId: string, batchType: RecordType) => {
    setCurrentType(batchType);
    setSelectedBatchFilter(batchId);
    setSelectedStage('ALL');
    setActiveView('RECORDS');
  };

  // Quick add from inline row
  const handleQuickAdd = (partialData: Partial<MedicalRecordItem>) => {
    handleSaveRecord(partialData);
  };

  // Open Notes Modal
  const handleOpenNotes = (record: MedicalRecordItem) => {
    setSelectedRecordForNotes(record);
    setNotesModalOpen(true);
  };

  // Add Note to Record (Persistido en SQLite)
  const handleAddNote = async (recordId: string, noteText: string) => {
    const timestamp = new Date().toLocaleString('es-DO');
    const operatorLabel = activeUser ? `${activeUser.name} (${activeUser.roleName})` : 'Usuario';
    const newNote: RecordNote = {
      id: `n_${Date.now()}`,
      date: timestamp,
      author: operatorLabel,
      authorRole: activeUser?.role || 'ADMINISTRATIVO',
      text: noteText,
      stageAtNote: selectedRecordForNotes?.currentStage || 'RECEPCION'
    };

    let targetUpdated: MedicalRecordItem | null = null;
    const updated = records.map(r => {
      if (r.id === recordId) {
        targetUpdated = {
          ...r,
          nota: noteText,
          notesHistory: [...(r.notesHistory || []), newNote],
          updatedAt: timestamp,
          updatedBy: operatorLabel
        };
        return targetUpdated;
      }
      return r;
    });

    updateRecordsState(updated);
    if (targetUpdated) {
      setSelectedRecordForNotes(targetUpdated);
      await persistSingleRecord(targetUpdated, false);
    }
    showToast('✓ Observación guardada en la base de datos.');
  };

  // Advance single record stage (Persistido en SQLite)
  const handleAdvanceStage = async (record: MedicalRecordItem) => {
    const nextSt = getNextStage(record.type, record.currentStage);
    const targetStageId: AnyStageId = nextSt
      ? nextSt.id
      : record.type === 'EXPEDIENTE'
      ? 'FACTURACION'
      : 'FACTURACION_EMERGENCIA';

    const targetStageConfig = getStageConfig(targetStageId);
    const timestamp = new Date().toLocaleString('es-DO');
    const operatorLabel = activeUser ? `${activeUser.name} (${activeUser.roleName})` : 'Sistema';

    let targetUpdated: MedicalRecordItem | null = null;
    const updated = records.map(r => {
      if (r.id === record.id) {
        targetUpdated = {
          ...r,
          currentStage: targetStageId,
          entregadoFacturacionPor:
            targetStageId === 'FACTURACION' || targetStageId === 'FACTURACION_EMERGENCIA'
              ? operatorLabel
              : r.entregadoFacturacionPor,
          entregadoFacturacionEn:
            targetStageId === 'FACTURACION' || targetStageId === 'FACTURACION_EMERGENCIA'
              ? timestamp
              : r.entregadoFacturacionEn,
          stageHistory: [
            ...(r.stageHistory || []),
            {
              id: `sh_${Date.now()}`,
              fromStage: r.currentStage,
              toStage: targetStageId,
              changedAt: timestamp,
              changedBy: operatorLabel
            }
          ],
          updatedAt: timestamp,
          updatedBy: operatorLabel
        };
        return targetUpdated;
      }
      return r;
    });

    updateRecordsState(updated);
    if (targetUpdated) {
      await persistSingleRecord(targetUpdated, false);
    }
    showToast(`✓ Expediente transferido por ${operatorLabel} a: ${targetStageConfig?.label || targetStageId}`);
  };

  // Bulk advance records (Persistido en SQLite)
  const handleBulkAdvance = async (selectedIds: string[], targetStageId: AnyStageId) => {
    const targetStageConfig = getStageConfig(targetStageId);
    const timestamp = new Date().toLocaleString('es-DO');
    const operatorLabel = activeUser ? `${activeUser.name} (${activeUser.roleName})` : 'Sistema';

    const toPersist: MedicalRecordItem[] = [];
    const updated = records.map(r => {
      if (selectedIds.includes(r.id)) {
        const mod: MedicalRecordItem = {
          ...r,
          currentStage: targetStageId,
          entregadoArsPor:
            targetStageId === 'ENTREGA_ARS' || targetStageId === 'ENTREGA_ARS_EMERGENCIA'
              ? operatorLabel
              : r.entregadoArsPor,
          entregadoFacturacionPor:
            targetStageId === 'FACTURACION' || targetStageId === 'FACTURACION_EMERGENCIA'
              ? operatorLabel
              : r.entregadoFacturacionPor,
          updatedAt: timestamp,
          updatedBy: operatorLabel
        };
        toPersist.push(mod);
        return mod;
      }
      return r;
    });

    updateRecordsState(updated);
    await Promise.all(toPersist.map(item => persistSingleRecord(item, false)));
    showToast(`✓ ${selectedIds.length} registros transferidos por ${operatorLabel} a: ${targetStageConfig?.label}`);
  };

  // Open Official Report Modal
  const handleOpenOfficialReport = (
    filteredRecords: MedicalRecordItem[],
    title: string,
    ars: string,
    deliveryDate: string,
    extra?: {
      stage?: AnyStageId | 'ALL';
      auditorName?: string;
      deliveredBy?: string;
      receivedBy?: string;
    }
  ) => {
    setReportData({
      records: filteredRecords,
      title,
      ars,
      deliveryDate,
      stage: extra?.stage || selectedStage,
      auditorName: extra?.auditorName,
      deliveredBy: extra?.deliveredBy,
      receivedBy: extra?.receivedBy
    });
    setOfficialReportModalOpen(true);
  };

  // Si no hay usuario logueado, mostrar pantalla de inicio de sesión o configuración desde cero
  if (!activeUser) {
    return (
      <LoginView
        users={users}
        onLoginSuccess={handleLoginSuccess}
        onUserCreated={u => setUsers(prev => [...prev, u])}
      />
    );
  }

  const totalExpedientes = records.filter(r => r.type === 'EXPEDIENTE').length;
  const totalEmergencias = records.filter(r => r.type === 'EMERGENCIA').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Cortina Animada de Transición Modo Oscuro (Media Luna) / Modo Claro (Sol Guiñando) */}
      <ThemeCurtainTransition phase={curtainPhase} targetTheme={targetTheme} />

      {/* Toast Alert Sutil */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900/95 backdrop-blur-xs text-white px-3.5 py-2 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-2 duration-200 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Aviso Sutil No Invasivo para el Área Receptora (Esquina Inferior Izquierda) */}
      {subtleAreaAlert && (
        <div className="fixed bottom-4 left-4 z-40 max-w-xs bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-700/80 text-xs flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-300">
          <div
            onClick={() => {
              setCurrentType(subtleAreaAlert.targetType);
              setSelectedStage(subtleAreaAlert.targetStage);
              setActiveView('RECORDS');
              setSubtleAreaAlert(null);
            }}
            className="cursor-pointer flex-1 min-w-0"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping shrink-0"></span>
              <span className="font-extrabold text-sky-300 truncate">
                {subtleAreaAlert.title} ({subtleAreaAlert.count})
              </span>
            </div>
            <p className="text-[10px] text-slate-300 truncate mt-0.5">
              De: {subtleAreaAlert.sender} &bull; Clic para ver
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSubtleAreaAlert(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-1 cursor-pointer"
            title="Ocultar aviso"
          >
            ✕
          </button>
        </div>
      )}

      {/* Institutional Header */}
      <Header
        activeUser={activeUser}
        users={users}
        onSelectUser={handleSelectUser}
        onLogout={handleLogout}
        onOpenNewRecord={handleOpenNewRecord}
        onResetData={handleResetData}
        onOpenUsersManager={() => setUserManagementModalOpen(true)}
        onOpenArsConfig={() => setArsConfigModalOpen(true)}
        totalExpedientes={totalExpedientes}
        totalEmergencias={totalEmergencias}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        areaNotifications={areaNotifications}
        onSelectNotificationStage={(targetType, targetStage) => {
          setCurrentType(targetType);
          setSelectedStage(targetStage);
          setActiveView('RECORDS');
        }}
      />

      {/* Main HUD Principal */}
      <PipelineHUD
        currentType={currentType}
        onChangeType={setCurrentType}
        selectedStage={selectedStage}
        onSelectStage={setSelectedStage}
        records={records}
        batches={batches}
        activeView={activeView}
        onChangeView={setActiveView}
        activeUser={activeUser}
      />

      {/* Content View */}
      <main className="flex-1">
        {activeView === 'RECORDS' && (
          <TableView
            records={records}
            batches={batches}
            type={currentType}
            selectedStage={selectedStage}
            selectedBatchFilter={selectedBatchFilter}
            onChangeBatchFilter={setSelectedBatchFilter}
            activeUser={activeUser}
            users={users}
            arsConfigs={arsConfigs}
            onOpenArsConfig={() => setArsConfigModalOpen(true)}
            onOpenNewRecord={handleOpenNewRecord}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
            onOpenNotes={handleOpenNotes}
            onAdvanceStage={handleAdvanceStage}
            onBulkAdvance={handleBulkAdvance}
            onOpenOfficialReport={handleOpenOfficialReport}
            onQuickAdd={handleQuickAdd}
            onOpenAuditModal={handleOpenAuditModal}
            onConciliateRecord={handleConciliateRecord}
            onBulkConciliate={handleBulkConciliate}
            onRouteToBiopsias={handleRouteToBiopsias}
            onRouteToArs={handleRouteToArs}
            onConfirmBillingDelivery={handleConfirmBillingDelivery}
            onIncrementBiopsiaSend={handleIncrementBiopsiaSend}
            onCompleteBiopsia={handleCompleteBiopsia}
          />
        )}

        {activeView === 'BATCHES' && (
          <BatchesView
            batches={batches}
            records={records}
            activeUser={activeUser}
            onSelectBatchToFilter={handleSelectBatchToFilter}
            onOpenCreateBatch={() => setCreateBatchModalOpen(true)}
            onOpenOfficialReport={handleOpenOfficialReport}
          />
        )}

        {activeView === 'ANALYTICS' && (
          <AnalyticsView records={records} />
        )}

        {activeView === 'DATABASE' && (
          <DatabasePerformanceView
            totalRecords={records.length}
            onRefreshRecords={loadBackendData}
            showToast={showToast}
          />
        )}
      </main>

      {/* Modal: Create/Edit Record */}
      <RecordModal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        record={editingRecord}
        batches={batches}
        defaultType={currentType}
        defaultStage={selectedStage !== 'ALL' ? selectedStage : (currentType === 'EXPEDIENTE' ? 'RECEPCION' : 'RECEPCION_EMERGENCIA')}
        activeUser={activeUser}
        users={users}
        arsConfigs={arsConfigs}
        onSave={handleSaveRecord}
      />

      {/* Modal: Create New Batch */}
      <CreateBatchModal
        isOpen={createBatchModalOpen}
        onClose={() => setCreateBatchModalOpen(false)}
        defaultType={currentType}
        defaultStage={selectedStage !== 'ALL' ? selectedStage : (currentType === 'EXPEDIENTE' ? 'RECEPCION' : 'RECEPCION_EMERGENCIA')}
        activeUser={activeUser}
        onCreateBatch={handleCreateBatch}
      />

      {/* Modal: Notes & Timeline History */}
      <NotesModal
        isOpen={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
        record={selectedRecordForNotes}
        activeUser={activeUser}
        onAddNote={handleAddNote}
      />

      {/* Modal: Official Delivery Relation (Printable Sheet) */}
      <OfficialRelationModal
        isOpen={officialReportModalOpen}
        onClose={() => setOfficialReportModalOpen(false)}
        records={reportData.records}
        title={reportData.title}
        ars={reportData.ars}
        deliveryDate={reportData.deliveryDate}
        stage={reportData.stage}
        auditorName={reportData.auditorName}
        deliveredBy={reportData.deliveredBy}
        receivedBy={reportData.receivedBy}
        arsConfigMap={arsConfigMap}
      />

      {/* Modal: User & Permissions Management (Root Admin) */}
      <UserManagementModal
        isOpen={userManagementModalOpen}
        onClose={() => setUserManagementModalOpen(false)}
        users={users}
        activeUser={activeUser}
        onSaveUser={handleSaveUser}
        onAddUser={handleAddUser}
      />

      {/* Modal: Configuración de Vigencia de ARS (2-3 Meses por ARS) */}
      <ArsConfigModal
        isOpen={arsConfigModalOpen}
        onClose={() => setArsConfigModalOpen(false)}
        configs={arsConfigs}
        activeUser={activeUser}
        onSaveConfigs={handleSaveArsConfigs}
      />

      {/* Modal: Audit Process Modal (Auditor Médico) */}
      <AuditProcessModal
        isOpen={auditModalOpen}
        onClose={() => {
          setAuditModalOpen(false);
          setSelectedRecordForAudit(null);
        }}
        record={selectedRecordForAudit}
        activeUser={activeUser}
        onSaveAudit={handleSaveAudit}
      />
    </div>
  );
}
