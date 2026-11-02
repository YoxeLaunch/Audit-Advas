import React, { useState, useEffect } from 'react';
import { 
  RecordType, 
  AnyStageId, 
  MedicalRecordItem, 
  User, 
  RecordNote,
  StageHistoryItem,
  DeliveryBatch
} from './types';
import { 
  getStoredRecords, 
  saveStoredRecords, 
  getStoredBatches,
  saveStoredBatches,
  getStoredUsers, 
  saveStoredUsers, 
  getActiveUser, 
  setActiveUser as persistActiveUser,
  resetAllDataToDefault 
} from './services/storage';
import { getNextStage, getStageConfig } from './utils/formatters';
import { Header } from './components/Header';
import { PipelineHUD } from './components/PipelineHUD';
import { TableView } from './components/TableView';
import { RecordModal } from './components/RecordModal';
import { NotesModal } from './components/NotesModal';
import { OfficialRelationModal } from './components/OfficialRelationModal';
import { UsersModal } from './components/UsersModal';
import { AnalyticsView } from './components/AnalyticsView';
import { BatchesView } from './components/BatchesView';
import { CreateBatchModal } from './components/CreateBatchModal';

export default function App() {
  // Primary State
  const [records, setRecords] = useState<MedicalRecordItem[]>([]);
  const [batches, setBatches] = useState<DeliveryBatch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeUser, setActiveUserState] = useState<User | null>(null);

  // View & Filter State
  const [currentType, setCurrentType] = useState<RecordType>('EXPEDIENTE');
  const [selectedStage, setSelectedStage] = useState<AnyStageId | 'ALL'>('ALL');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string | 'ALL'>('ALL');
  const [activeView, setActiveView] = useState<'RECORDS' | 'BATCHES' | 'ANALYTICS'>('RECORDS');

  // Modals State
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecordItem | null>(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedRecordForNotes, setSelectedRecordForNotes] = useState<MedicalRecordItem | null>(null);
  const [createBatchModalOpen, setCreateBatchModalOpen] = useState(false);
  const [officialReportModalOpen, setOfficialReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState<{
    records: MedicalRecordItem[];
    title: string;
    ars: string;
    deliveryDate: string;
  }>({
    records: [],
    title: '',
    ars: 'ARS SENASA',
    deliveryDate: '2026-10-31'
  });
  const [usersModalOpen, setUsersModalOpen] = useState(false);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Initial load
  useEffect(() => {
    const loadedRecords = getStoredRecords();
    const loadedBatches = getStoredBatches();
    const loadedUsers = getStoredUsers();
    const loadedActiveUser = getActiveUser();

    setRecords(loadedRecords);
    setBatches(loadedBatches);
    setUsers(loadedUsers);
    setActiveUserState(loadedActiveUser);
  }, []);

  // Save changes to records
  const updateRecords = (newRecords: MedicalRecordItem[]) => {
    setRecords(newRecords);
    saveStoredRecords(newRecords);
  };

  // Save changes to batches
  const updateBatches = (newBatches: DeliveryBatch[]) => {
    setBatches(newBatches);
    saveStoredBatches(newBatches);
  };

  // Change active user
  const handleSelectUser = (user: User) => {
    setActiveUserState(user);
    persistActiveUser(user.id);
    showToast(`Sesión cambiada a: ${user.name} (${user.roleName})`);
  };

  // Add new user
  const handleAddUser = (newUserData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...newUserData,
      id: `usr_${Date.now()}`
    };
    const updated = [...users, newUser];
    setUsers(updated);
    saveStoredUsers(updated);
    showToast(`Usuario ${newUser.name} registrado con éxito.`);
  };

  // Reset demo data
  const handleResetData = () => {
    resetAllDataToDefault();
    const loadedRecords = getStoredRecords();
    const loadedBatches = getStoredBatches();
    const loadedUsers = getStoredUsers();
    const loadedActiveUser = getActiveUser();
    setRecords(loadedRecords);
    setBatches(loadedBatches);
    setUsers(loadedUsers);
    setActiveUserState(loadedActiveUser);
    setSelectedBatchFilter('ALL');
    showToast('Datos reiniciados con lotes y relaciones originales.');
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

  // Delete record
  const handleDeleteRecord = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este registro del sistema? Esta acción no se puede deshacer.')) {
      const updated = records.filter(r => r.id !== id);
      updateRecords(updated);
      showToast('Registro eliminado exitosamente.');
    }
  };

  // Create or Update Record
  const handleSaveRecord = (recordData: Partial<MedicalRecordItem>) => {
    const timestamp = new Date().toLocaleString('es-DO');

    if (recordData.id) {
      // Update existing
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
                  changedBy: activeUser?.name || 'Sistema'
                }
              ]
            : r.stageHistory || [];

          return {
            ...r,
            ...recordData,
            stageHistory: newStageHistory,
            updatedAt: timestamp,
            updatedBy: activeUser?.name || 'Sistema'
          } as MedicalRecordItem;
        }
        return r;
      });

      updateRecords(updated);
      showToast(`Registro de ${recordData.nombrePaciente} actualizado correctamente.`);
    } else {
      // Create new
      const nextNumero = records.filter(r => r.type === recordData.type).length + 1;
      const initialStage = recordData.currentStage || (recordData.type === 'EXPEDIENTE' ? 'RECEPCION' : 'RECEPCION_EMERGENCIA');

      const initialNote: RecordNote = {
        id: `note_${Date.now()}`,
        date: timestamp,
        author: activeUser?.name || 'Recepción',
        authorRole: activeUser?.role || 'RECEPCION',
        text: recordData.nota || 'Apertura de caso en recepción',
        stageAtNote: initialStage
      };

      const initialStageHistory: StageHistoryItem = {
        id: `sh_${Date.now()}`,
        fromStage: 'INICIO',
        toStage: initialStage,
        changedAt: timestamp,
        changedBy: activeUser?.name || 'Recepción'
      };

      const newRecord: MedicalRecordItem = {
        id: `rec_${Date.now()}`,
        numero: nextNumero,
        type: recordData.type || currentType,
        nombrePaciente: recordData.nombrePaciente || 'PACIENTE SIN NOMBRE',
        nap: recordData.nap || 'SIN-NAP',
        ars: recordData.ars || 'ARS SENASA',
        fechaCierre: recordData.fechaCierre || new Date().toISOString().split('T')[0],
        fechaRecepcion: new Date().toISOString().split('T')[0],
        fechaEntrega: recordData.fechaEntrega || '2026-10-31',
        cobertura: recordData.cobertura || 0,
        montoGlosado: recordData.montoGlosado || 0,
        aPagar: recordData.aPagar || (recordData.cobertura || 0),
        nota: recordData.nota || 'Ingresado al sistema',
        currentStage: initialStage,
        loteId: recordData.loteId,
        loteCodigo: recordData.loteCodigo,
        notesHistory: [initialNote],
        stageHistory: [initialStageHistory],
        createdAt: timestamp,
        createdBy: activeUser?.name || 'Sistema',
        updatedAt: timestamp,
        updatedBy: activeUser?.name || 'Sistema'
      };

      updateRecords([newRecord, ...records]);
      showToast(`Nuevo registro creado: ${newRecord.nombrePaciente} (#${newRecord.numero}) en lote ${newRecord.loteCodigo || 'General'}`);
    }
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

  // Bulk assign records to batch
  const handleBulkAssignBatch = (recordIds: string[], batchId: string) => {
    const targetBatch = batches.find(b => b.id === batchId);
    if (!targetBatch) return;

    const updated = records.map(r => {
      if (recordIds.includes(r.id)) {
        return {
          ...r,
          loteId: targetBatch.id,
          loteCodigo: targetBatch.codigo
        };
      }
      return r;
    });

    updateRecords(updated);
    showToast(`${recordIds.length} expedientes asignados al lote: ${targetBatch.codigo}`);
  };

  // Jump from Batches View to Table View with filter
  const handleSelectBatchToFilter = (batchId: string, batchType: RecordType) => {
    setCurrentType(batchType);
    setSelectedBatchFilter(batchId);
    setSelectedStage('ALL');
    setActiveView('RECORDS');
    const batch = batches.find(b => b.id === batchId);
    showToast(`Filtrando tabla por lote: ${batch?.codigo || batchId}`);
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

  // Add Note to Record
  const handleAddNote = (recordId: string, noteText: string) => {
    const timestamp = new Date().toLocaleString('es-DO');
    const newNote: RecordNote = {
      id: `n_${Date.now()}`,
      date: timestamp,
      author: activeUser?.name || 'Usuario',
      authorRole: activeUser?.role || 'AUDITOR',
      text: noteText,
      stageAtNote: selectedRecordForNotes?.currentStage || 'RECEPCION'
    };

    const updated = records.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          nota: noteText,
          notesHistory: [...(r.notesHistory || []), newNote],
          updatedAt: timestamp,
          updatedBy: activeUser?.name || 'Sistema'
        };
      }
      return r;
    });

    updateRecords(updated);

    const refreshed = updated.find(r => r.id === recordId);
    if (refreshed) {
      setSelectedRecordForNotes(refreshed);
    }

    showToast('Observación añadida a la línea de tiempo.');
  };

  // Advance single record stage
  const handleAdvanceStage = (record: MedicalRecordItem, targetStageId: AnyStageId) => {
    const targetStageConfig = getStageConfig(targetStageId);
    const timestamp = new Date().toLocaleString('es-DO');

    const newHistoryItem: StageHistoryItem = {
      id: `sh_${Date.now()}`,
      fromStage: record.currentStage,
      toStage: targetStageId,
      changedAt: timestamp,
      changedBy: activeUser?.name || 'Sistema'
    };

    const updated = records.map(r => {
      if (r.id === record.id) {
        return {
          ...r,
          currentStage: targetStageId,
          stageHistory: [...(r.stageHistory || []), newHistoryItem],
          updatedAt: timestamp,
          updatedBy: activeUser?.name || 'Sistema'
        };
      }
      return r;
    });

    updateRecords(updated);
    showToast(`Expediente movido a: ${targetStageConfig?.label || targetStageId}`);
  };

  // Bulk advance records
  const handleBulkAdvance = (selectedRecords: MedicalRecordItem[], targetStageId: AnyStageId) => {
    const targetStageConfig = getStageConfig(targetStageId);
    const timestamp = new Date().toLocaleString('es-DO');
    const selectedIds = selectedRecords.map(r => r.id);

    const updated = records.map(r => {
      if (selectedIds.includes(r.id)) {
        const newHistoryItem: StageHistoryItem = {
          id: `sh_${Date.now()}_${r.id}`,
          fromStage: r.currentStage,
          toStage: targetStageId,
          changedAt: timestamp,
          changedBy: activeUser?.name || 'Sistema'
        };
        return {
          ...r,
          currentStage: targetStageId,
          stageHistory: [...(r.stageHistory || []), newHistoryItem],
          updatedAt: timestamp,
          updatedBy: activeUser?.name || 'Sistema'
        };
      }
      return r;
    });

    updateRecords(updated);
    showToast(`${selectedRecords.length} expedientes transferidos a: ${targetStageConfig?.label}`);
  };

  // Open Official Report Modal
  const handleOpenOfficialReport = (
    filteredRecords: MedicalRecordItem[],
    title: string,
    ars: string,
    deliveryDate: string
  ) => {
    setReportData({
      records: filteredRecords,
      title,
      ars,
      deliveryDate
    });
    setOfficialReportModalOpen(true);
  };

  if (!activeUser) return null;

  const totalExpedientes = records.filter(r => r.type === 'EXPEDIENTE').length;
  const totalEmergencias = records.filter(r => r.type === 'EMERGENCIA').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Institutional Header with Contacts & User Switcher */}
      <Header
        activeUser={activeUser}
        users={users}
        onSelectUser={handleSelectUser}
        onOpenNewRecord={handleOpenNewRecord}
        onResetData={handleResetData}
        onOpenUsersManager={() => setUsersModalOpen(true)}
        totalExpedientes={totalExpedientes}
        totalEmergencias={totalEmergencias}
      />

      {/* Main HUD Principal (Stage Pipeline, Modules & Lotes Switcher) */}
      <PipelineHUD
        currentType={currentType}
        onChangeType={setCurrentType}
        selectedStage={selectedStage}
        onSelectStage={setSelectedStage}
        records={records}
        batches={batches}
        activeView={activeView}
        onChangeView={setActiveView}
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
            onOpenNewRecord={handleOpenNewRecord}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
            onOpenNotes={handleOpenNotes}
            onAdvanceStage={handleAdvanceStage}
            onBulkAdvance={handleBulkAdvance}
            onBulkAssignBatch={handleBulkAssignBatch}
            onOpenOfficialReport={handleOpenOfficialReport}
            onQuickAdd={handleQuickAdd}
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
        onSave={handleSaveRecord}
      />

      {/* Modal: Create New Batch / Delivery Cycle */}
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
      />

      {/* Modal: Users & Role Matrix */}
      <UsersModal
        isOpen={usersModalOpen}
        onClose={() => setUsersModalOpen(false)}
        users={users}
        activeUser={activeUser}
        onSelectUser={handleSelectUser}
        onAddUser={handleAddUser}
      />
    </div>
  );
}
