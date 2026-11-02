import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Printer, 
  ArrowRight, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  Plus, 
  Download, 
  CheckSquare, 
  Square,
  FileSpreadsheet,
  AlertTriangle,
  History,
  Building,
  Calendar,
  Package,
  Layers,
  Tag
} from 'lucide-react';
import { 
  MedicalRecordItem, 
  User, 
  RecordType, 
  AnyStageId,
  DeliveryBatch,
  COMMON_ARS_LIST
} from '../types';
import { 
  formatCurrency, 
  formatDateToDMY, 
  getStageConfig, 
  getNextStage,
  canCreateRecord,
  canAuditRecord,
  canChangeStage,
  canDeleteRecord
} from '../utils/formatters';

interface TableViewProps {
  records: MedicalRecordItem[];
  batches: DeliveryBatch[];
  type: RecordType;
  selectedStage: AnyStageId | 'ALL';
  selectedBatchFilter: string | 'ALL';
  onChangeBatchFilter: (batchId: string | 'ALL') => void;
  activeUser: User;
  onOpenNewRecord: (type: RecordType) => void;
  onEditRecord: (record: MedicalRecordItem) => void;
  onDeleteRecord: (id: string) => void;
  onOpenNotes: (record: MedicalRecordItem) => void;
  onAdvanceStage: (record: MedicalRecordItem, targetStageId: AnyStageId) => void;
  onBulkAdvance: (records: MedicalRecordItem[], targetStageId: AnyStageId) => void;
  onBulkAssignBatch: (recordIds: string[], batchId: string) => void;
  onOpenOfficialReport: (filteredRecords: MedicalRecordItem[], title: string, ars: string, deliveryDate: string) => void;
  onQuickAdd: (record: Partial<MedicalRecordItem>) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  records,
  batches,
  type,
  selectedStage,
  selectedBatchFilter,
  onChangeBatchFilter,
  activeUser,
  onOpenNewRecord,
  onEditRecord,
  onDeleteRecord,
  onOpenNotes,
  onAdvanceStage,
  onBulkAdvance,
  onBulkAssignBatch,
  onOpenOfficialReport,
  onQuickAdd
}) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArsFilter, setSelectedArsFilter] = useState<string>('TODAS');
  const [deliveryDateFilter, setDeliveryDateFilter] = useState<string>('2026-10-31');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showQuickAddRow, setShowQuickAddRow] = useState(false);
  const [showBatchAssignModal, setShowBatchAssignModal] = useState(false);
  const [targetBatchIdForAssign, setTargetBatchIdForAssign] = useState<string>('');

  // Quick Add Form State
  const [quickPatient, setQuickPatient] = useState('');
  const [quickNap, setQuickNap] = useState('');
  const [quickArs, setQuickArs] = useState('ARS SENASA');
  const [quickFechaCierre, setQuickFechaCierre] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [quickCobertura, setQuickCobertura] = useState<string>('');
  const [quickGlosa, setQuickGlosa] = useState<string>('0');
  const [quickNota, setQuickNota] = useState('');
  const [quickBatchId, setQuickBatchId] = useState<string>('');

  // Batches for current type
  const availableBatches = useMemo(() => {
    return batches.filter(b => b.tipo === type);
  }, [batches, type]);

  // Set default quick batch
  React.useEffect(() => {
    if (availableBatches.length > 0 && !quickBatchId) {
      setQuickBatchId(availableBatches[0].id);
    }
  }, [availableBatches, quickBatchId]);

  // Determine stage display name for header
  const stageConfig = selectedStage !== 'ALL' ? getStageConfig(selectedStage) : null;
  const currentSheetTitle = stageConfig 
    ? stageConfig.officialDocTitle 
    : type === 'EXPEDIENTE' 
      ? 'ENTREGA DE EXPEDIENTES A FACTURACION' 
      : 'ENTREGA DE EMERGENCIAS A FACTURACION';

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Must match active module type
      if (r.type !== type) return false;
      
      // Stage filter
      if (selectedStage !== 'ALL' && r.currentStage !== selectedStage) return false;

      // Batch filter
      if (selectedBatchFilter !== 'ALL' && r.loteId !== selectedBatchFilter) return false;

      // ARS filter
      if (selectedArsFilter !== 'TODAS' && r.ars !== selectedArsFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = r.nombrePaciente.toLowerCase().includes(query);
        const matchNap = r.nap.toLowerCase().includes(query);
        const matchNota = (r.nota || '').toLowerCase().includes(query);
        const matchArs = (r.ars || '').toLowerCase().includes(query);
        const matchLote = (r.loteCodigo || '').toLowerCase().includes(query);
        const matchDate = (r.fechaCierre || '').includes(query) || (r.fechaEntrega || '').includes(query);

        if (!matchName && !matchNap && !matchNota && !matchArs && !matchLote && !matchDate) {
          return false;
        }
      }

      return true;
    });
  }, [records, type, selectedStage, selectedBatchFilter, selectedArsFilter, searchTerm]);

  // Aggregate totals
  const totalCobertura = useMemo(
    () => filteredRecords.reduce((acc, r) => acc + (r.cobertura || 0), 0),
    [filteredRecords]
  );
  const totalGlosado = useMemo(
    () => filteredRecords.reduce((acc, r) => acc + (r.montoGlosado || 0), 0),
    [filteredRecords]
  );
  const totalAPagar = useMemo(
    () => filteredRecords.reduce((acc, r) => acc + (r.aPagar || 0), 0),
    [filteredRecords]
  );

  // Multi-select handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map(r => r.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Submit quick inline entry
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPatient.trim() || !quickNap.trim()) {
      alert('Por favor ingrese el nombre del paciente y el NAP.');
      return;
    }

    const cobVal = parseFloat(quickCobertura) || 0;
    const gloVal = parseFloat(quickGlosa) || 0;

    const chosenBatch = batches.find(b => b.id === quickBatchId);

    onQuickAdd({
      type,
      nombrePaciente: quickPatient.trim().toUpperCase(),
      nap: quickNap.trim(),
      ars: quickArs,
      fechaCierre: quickFechaCierre,
      fechaEntrega: deliveryDateFilter,
      cobertura: cobVal,
      montoGlosado: gloVal,
      aPagar: Math.max(0, cobVal - gloVal),
      nota: quickNota.trim() || 'Ingreso regular por mesa de recepción',
      currentStage: selectedStage !== 'ALL' 
        ? selectedStage 
        : type === 'EXPEDIENTE' ? 'RECEPCION' : 'RECEPCION_EMERGENCIA',
      loteId: chosenBatch ? chosenBatch.id : undefined,
      loteCodigo: chosenBatch ? chosenBatch.codigo : undefined
    });

    // Reset inline inputs
    setQuickPatient('');
    setQuickNap('');
    setQuickCobertura('');
    setQuickGlosa('0');
    setQuickNota('');
    setShowQuickAddRow(false);
  };

  // Handle Bulk advance
  const handleBulkAdvanceNext = () => {
    if (selectedIds.length === 0) return;
    const selectedRecords = filteredRecords.filter(r => selectedIds.includes(r.id));
    
    const firstNext = getNextStage(type, selectedRecords[0].currentStage);
    if (!firstNext) {
      alert('Los registros seleccionados ya están en la etapa final.');
      return;
    }

    onBulkAdvance(selectedRecords, firstNext.id);
    setSelectedIds([]);
  };

  const handleConfirmBatchAssign = () => {
    if (!targetBatchIdForAssign || selectedIds.length === 0) return;
    onBulkAssignBatch(selectedIds, targetBatchIdForAssign);
    setShowBatchAssignModal(false);
    setSelectedIds([]);
  };

  const activeBatchObj = batches.find(b => b.id === selectedBatchFilter);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Official Header matching the User's Image */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Grey Banner with Stage Title & Active Batch Indicator */}
        <div className="bg-slate-200/90 text-slate-800 px-6 py-2.5 border-b border-slate-300 font-bold text-xs sm:text-sm uppercase tracking-wide flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
            <span>{currentSheetTitle}</span>
          </div>

          {activeBatchObj && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-black bg-indigo-700 text-white px-2.5 py-0.5 rounded shadow-2xs">
                {activeBatchObj.codigo}
              </span>
              <span className="text-[11px] font-medium text-slate-700">
                ({activeBatchObj.nombre})
              </span>
              <button
                onClick={() => onChangeBatchFilter('ALL')}
                className="text-[10px] text-slate-500 hover:text-slate-900 bg-white/80 px-1.5 py-0.5 rounded"
                title="Quitar filtro de lote"
              >
                ✕ Quitar filtro
              </button>
            </div>
          )}
        </div>

        {/* ARS title and Delivery Date box (Exact replica of image header) */}
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/40">
          <div className="text-center sm:text-left">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
              Aseguradora de Riesgos de Salud (ARS)
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 underline underline-offset-4 decoration-2 decoration-slate-900 tracking-tight">
                {selectedArsFilter === 'TODAS' ? 'ARS SENASA' : selectedArsFilter}
              </h2>
              {selectedArsFilter === 'TODAS' && (
                <span className="text-[11px] text-slate-500 italic">
                  (Mostrando todas las aseguradoras)
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Boxed Fecha Entrega like in the spreadsheet image */}
            <div className="flex items-center border-2 border-slate-800 rounded-md overflow-hidden bg-white shadow-xs">
              <div className="bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-800 uppercase tracking-wider border-r border-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                FECHA ENTREGA
              </div>
              <div className="px-3 py-1.5 font-mono font-bold text-sm text-slate-900 bg-slate-200/50">
                <input 
                  type="date" 
                  value={deliveryDateFilter}
                  onChange={(e) => setDeliveryDateFilter(e.target.value)}
                  className="bg-transparent font-mono font-bold text-sm text-slate-900 focus:outline-hidden cursor-pointer"
                />
              </div>
            </div>

            {/* Official Relation Slip Button */}
            <button
              onClick={() => onOpenOfficialReport(
                filteredRecords, 
                currentSheetTitle, 
                selectedArsFilter === 'TODAS' ? 'ARS SENASA' : selectedArsFilter,
                deliveryDateFilter
              )}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              title="Generar e imprimir el acta de entrega idéntica a la planilla oficial"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Imprimir Relación Oficial</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Lote Selector, Bulk Actions */}
        <div className="p-4 bg-white flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search Box */}
            <div className="relative min-w-[240px] flex-1 md:flex-initial">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar paciente, NAP, lote, fecha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-hidden"
              />
            </div>

            {/* Lote / Ciclo Selector */}
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              <select
                value={selectedBatchFilter}
                onChange={(e) => onChangeBatchFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:border-indigo-500 outline-hidden font-medium text-slate-700"
              >
                <option value="ALL">Todos los Lotes / Ciclos</option>
                {availableBatches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.codigo} - {b.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* ARS Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedArsFilter}
                onChange={(e) => setSelectedArsFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:border-sky-500 outline-hidden font-medium text-slate-700"
              >
                <option value="TODAS">Todas las ARS</option>
                {COMMON_ARS_LIST.map(ars => (
                  <option key={ars} value={ars}>{ars}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 px-3 py-1 rounded-lg">
                <span className="text-xs font-bold text-sky-900">
                  {selectedIds.length} seleccionados
                </span>
                
                <button
                  onClick={handleBulkAdvanceNext}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors cursor-pointer"
                  title="Avanzar registros a la siguiente etapa en la cadena"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Mover Siguiente Etapa
                </button>

                <button
                  onClick={() => setShowBatchAssignModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors cursor-pointer"
                  title="Asignar expedientes a un lote o ciclo específico"
                >
                  <Package className="w-3.5 h-3.5" />
                  Asignar a Lote
                </button>
              </div>
            )}

            {canCreateRecord(activeUser.role) && (
              <button
                onClick={() => setShowQuickAddRow(!showQuickAddRow)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                  showQuickAddRow
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showQuickAddRow ? 'Ocultar Entrada' : '+ Fila Rápida'}</span>
              </button>
            )}

            <button
              onClick={() => onOpenNewRecord(type)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Formulario</span>
            </button>
          </div>
        </div>

        {/* Quick Add Inline Row Form */}
        {showQuickAddRow && (
          <form 
            onSubmit={handleQuickAddSubmit} 
            className="p-3 bg-sky-50/70 border-b border-sky-200 animate-in fade-in duration-150 text-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sky-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                Entrada Rápida de Casilla (Estilo Hoja de Cálculo):
              </span>
              <span className="text-[11px] text-sky-700">
                Presiona Enter o haz clic en "Guardar Fila"
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-8 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                  F. Cierre
                </label>
                <input
                  type="date"
                  required
                  value={quickFechaCierre}
                  onChange={(e) => setQuickFechaCierre(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                  Nombre Paciente
                </label>
                <input
                  type="text"
                  required
                  placeholder="NOMBRE COMPLETO"
                  value={quickPatient}
                  onChange={(e) => setQuickPatient(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-sky-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                  NAP
                </label>
                <input
                  type="text"
                  required
                  placeholder="000-0000000-0"
                  value={quickNap}
                  onChange={(e) => setQuickNap(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                  Lote / Ciclo
                </label>
                <select
                  value={quickBatchId}
                  onChange={(e) => setQuickBatchId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono focus:ring-1 focus:ring-sky-500"
                >
                  {availableBatches.map(b => (
                    <option key={b.id} value={b.id}>{b.codigo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                  ARS
                </label>
                <select
                  value={quickArs}
                  onChange={(e) => setQuickArs(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-sky-500"
                >
                  {COMMON_ARS_LIST.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                  Cobertura (RD$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={quickCobertura}
                  onChange={(e) => setQuickCobertura(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-right focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                  Glosa (RD$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={quickGlosa}
                  onChange={(e) => setQuickGlosa(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-right text-rose-600 font-bold focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Nota u observaciones (opcional)..."
                value={quickNota}
                onChange={(e) => setQuickNota(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-sky-500"
              />

              <button
                type="submit"
                className="px-4 py-1 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded shadow-xs transition-colors cursor-pointer"
              >
                Guardar Fila
              </button>
            </div>
          </form>
        )}

        {/* Data Table replicating the user's Excel exactly */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-t border-slate-300 font-extrabold text-slate-800 tracking-wider uppercase text-[11px]">
                <th className="py-2.5 px-3 w-8 text-center border-r border-slate-200">
                  <input
                    type="checkbox"
                    checked={filteredRecords.length > 0 && selectedIds.length === filteredRecords.length}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200">#</th>
                <th className="py-2.5 px-3 w-28 border-r border-slate-200">F.CIERRE</th>
                <th className="py-2.5 px-4 min-w-[200px] border-r border-slate-200">NOMBRE PACIENTE</th>
                <th className="py-2.5 px-3 w-32 font-mono border-r border-slate-200">NAP</th>
                <th className="py-2.5 px-3 w-36 border-r border-slate-200">LOTE / CICLO</th>
                <th className="py-2.5 px-4 min-w-[200px] border-r border-slate-200">NOTA</th>
                <th className="py-2.5 px-4 w-32 text-right border-r border-slate-200">COBERTURA</th>
                <th className="py-2.5 px-4 w-36 text-right border-r border-slate-200 text-rose-600">
                  MONTO GLOSADO
                </th>
                <th className="py-2.5 px-4 w-36 text-right border-r border-slate-200 text-sky-600">
                  A PAGAR
                </th>
                <th className="py-2.5 px-3 w-36 text-center border-r border-slate-200">ETAPA ACTUAL</th>
                <th className="py-2.5 px-3 w-36 text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No hay registros con estos criterios de búsqueda o lote</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Verifica los filtros de ARS, fecha o lote de entrega arriba.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => {
                  const isChecked = selectedIds.includes(record.id);
                  const currentStageObj = getStageConfig(record.currentStage);
                  const nextStageObj = getNextStage(type, record.currentStage);

                  return (
                    <tr 
                      key={record.id}
                      className={`hover:bg-sky-50/40 transition-colors ${
                        isChecked ? 'bg-sky-50/70' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOne(record.id)}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </td>

                      {/* # (Correlativo) */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700 border-r border-slate-200">
                        {record.numero || index + 1}
                      </td>

                      {/* F.CIERRE */}
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap">
                        {formatDateToDMY(record.fechaCierre)}
                      </td>

                      {/* NOMBRE PACIENTE */}
                      <td className="py-2.5 px-4 font-bold text-slate-900 uppercase border-r border-slate-200">
                        <div className="flex flex-col">
                          <span>{record.nombrePaciente}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {record.ars}
                          </span>
                        </div>
                      </td>

                      {/* NAP */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                        {record.nap}
                      </td>

                      {/* LOTE / CICLO */}
                      <td className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">
                        {record.loteCodigo ? (
                          <button
                            onClick={() => onChangeBatchFilter(record.loteId || 'ALL')}
                            className="inline-flex items-center gap-1 font-mono text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            title="Filtrar por este lote de entrega"
                          >
                            <Package className="w-3 h-3 text-indigo-500" />
                            <span>{record.loteCodigo}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Sin lote asignado</span>
                        )}
                      </td>

                      {/* NOTA */}
                      <td className="py-2.5 px-4 border-r border-slate-200 text-slate-600">
                        <div className="flex items-start justify-between gap-1 group">
                          <p className="line-clamp-2 text-[11px] leading-relaxed" title={record.nota}>
                            {record.nota || '-'}
                          </p>
                          <button
                            onClick={() => onOpenNotes(record)}
                            className="shrink-0 p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-sky-600 transition-colors relative cursor-pointer"
                            title="Ver o agregar notas en la línea de tiempo"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {record.notesHistory?.length > 0 && (
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-sky-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                                {record.notesHistory.length}
                              </span>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* COBERTURA */}
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                        {formatCurrency(record.cobertura)}
                      </td>

                      {/* MONTO GLOSADO (Bold Red as in Excel image) */}
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600 border-r border-slate-200 whitespace-nowrap">
                        {record.montoGlosado > 0 ? (
                          <span className="bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            {formatCurrency(record.montoGlosado)}
                          </span>
                        ) : (
                          <span className="text-slate-400">RD$ 0.00</span>
                        )}
                      </td>

                      {/* A PAGAR (Bold Blue as in Excel image) */}
                      <td className="py-2.5 px-4 text-right font-mono font-black text-sky-700 border-r border-slate-200 whitespace-nowrap">
                        {formatCurrency(record.aPagar)}
                      </td>

                      {/* ETAPA ACTUAL */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {currentStageObj?.shortLabel || record.currentStage}
                        </span>
                      </td>

                      {/* ACCIONES */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Advance to next stage in chain */}
                          {nextStageObj && (
                            <button
                              onClick={() => onAdvanceStage(record, nextStageObj.id)}
                              disabled={!canChangeStage(activeUser.role, nextStageObj.id)}
                              className={`p-1.5 rounded transition-colors cursor-pointer ${
                                canChangeStage(activeUser.role, nextStageObj.id)
                                  ? 'hover:bg-emerald-100 text-emerald-700'
                                  : 'opacity-30 cursor-not-allowed text-slate-400'
                              }`}
                              title={`Avanzar a: ${nextStageObj.label}`}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}

                          {/* Notes */}
                          <button
                            onClick={() => onOpenNotes(record)}
                            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            title="Historial de notas"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onEditRecord(record)}
                            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            title="Editar datos de registro"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          {canDeleteRecord(activeUser.role) && (
                            <button
                              onClick={() => onDeleteRecord(record.id)}
                              className="p-1.5 rounded hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                              title="Eliminar registro (Solo Administrador)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer with Totals Row */}
            <tfoot>
              <tr className="bg-slate-200/90 font-extrabold text-slate-900 border-t-2 border-slate-300 text-xs">
                <td colSpan={6} className="py-3 px-4 uppercase tracking-wider text-right border-r border-slate-300">
                  TOTALES GENERALES ({filteredRecords.length} CASOS):
                </td>
                <td className="py-3 px-4 border-r border-slate-300 text-slate-500 text-[11px] font-normal italic">
                  Sumatoria filtrada
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold border-r border-slate-300 whitespace-nowrap">
                  {formatCurrency(totalCobertura)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-rose-600 border-r border-slate-300 whitespace-nowrap bg-rose-50/40">
                  {formatCurrency(totalGlosado)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-sky-700 border-r border-slate-300 whitespace-nowrap bg-sky-50/40">
                  {formatCurrency(totalAPagar)}
                </td>
                <td colSpan={2} className="py-3 px-3 text-center text-[10px] text-slate-500">
                  Departamento de Facturación
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal for Assigning Records to a Batch */}
      {showBatchAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                Asignar {selectedIds.length} Registros a un Lote
              </h3>
              <button onClick={() => setShowBatchAssignModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Seleccione el lote o ciclo de entrega para vincular los expedientes seleccionados:
            </p>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Lote de Destino
              </label>
              <select
                value={targetBatchIdForAssign}
                onChange={(e) => setTargetBatchIdForAssign(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">-- Seleccionar Lote --</option>
                {availableBatches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.codigo} &bull; {b.nombre} ({formatDateToDMY(b.fechaCiclo)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowBatchAssignModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!targetBatchIdForAssign}
                onClick={handleConfirmBatchAssign}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg"
              >
                Confirmar Asignación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
