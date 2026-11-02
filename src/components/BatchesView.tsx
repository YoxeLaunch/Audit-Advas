import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Calendar, 
  Search, 
  Filter, 
  Plus, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Building2, 
  DollarSign, 
  Layers, 
  FileText,
  UserCheck,
  Eye,
  Trash2,
  FolderGit2,
  Flame,
  AlertCircle
} from 'lucide-react';
import { 
  DeliveryBatch, 
  MedicalRecordItem, 
  RecordType, 
  User, 
  COMMON_ARS_LIST,
  AnyStageId,
  EXPEDIENTE_STAGES,
  EMERGENCIA_STAGES
} from '../types';
import { 
  formatCurrency, 
  formatDateToDMY, 
  getStageConfig 
} from '../utils/formatters';

interface BatchesViewProps {
  batches: DeliveryBatch[];
  records: MedicalRecordItem[];
  activeUser: User;
  onSelectBatchToFilter: (batchId: string, batchType: RecordType) => void;
  onOpenCreateBatch: () => void;
  onOpenOfficialReport: (filteredRecords: MedicalRecordItem[], title: string, ars: string, deliveryDate: string) => void;
  onDeleteBatch?: (batchId: string) => void;
}

export const BatchesView: React.FC<BatchesViewProps> = ({
  batches,
  records,
  activeUser,
  onSelectBatchToFilter,
  onOpenCreateBatch,
  onOpenOfficialReport,
  onDeleteBatch
}) => {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | RecordType>('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [arsFilter, setArsFilter] = useState('TODAS');
  const [selectedBatchDetails, setSelectedBatchDetails] = useState<DeliveryBatch | null>(null);

  // Compute records and metrics per batch
  const batchesWithMetrics = useMemo(() => {
    return batches.map(batch => {
      const batchRecords = records.filter(r => r.loteId === batch.id);
      const totalCobertura = batchRecords.reduce((acc, r) => acc + (r.cobertura || 0), 0);
      const totalGlosado = batchRecords.reduce((acc, r) => acc + (r.montoGlosado || 0), 0);
      const totalAPagar = batchRecords.reduce((acc, r) => acc + (r.aPagar || 0), 0);

      return {
        ...batch,
        batchRecords,
        count: batchRecords.length,
        totalCobertura,
        totalGlosado,
        totalAPagar
      };
    });
  }, [batches, records]);

  // Filtered Batches
  const filteredBatches = useMemo(() => {
    return batchesWithMetrics.filter(batch => {
      if (typeFilter !== 'ALL' && batch.tipo !== typeFilter) return false;
      if (arsFilter !== 'TODAS' && batch.ars !== arsFilter && batch.ars !== 'TODAS') return false;
      if (dateFilter && batch.fechaCiclo !== dateFilter && batch.fechaEntrega !== dateFilter) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchCode = batch.codigo.toLowerCase().includes(query);
        const matchName = batch.nombre.toLowerCase().includes(query);
        const matchArs = batch.ars.toLowerCase().includes(query);
        const matchDesc = (batch.descripcion || '').toLowerCase().includes(query);
        
        // Also search if any patient or NAP inside this batch matches!
        const matchInternalPatient = batch.batchRecords.some(r => 
          r.nombrePaciente.toLowerCase().includes(query) || 
          r.nap.toLowerCase().includes(query)
        );

        if (!matchCode && !matchName && !matchArs && !matchDesc && !matchInternalPatient) {
          return false;
        }
      }

      return true;
    });
  }, [batchesWithMetrics, typeFilter, arsFilter, dateFilter, searchTerm]);

  // Status badge helper
  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'ENTREGADO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Entregado</span>;
      case 'EN_AUDITORIA':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">En Auditoría</span>;
      case 'FACTURADO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Facturado</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">Abierto / En Curso</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Banner / Title Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-700 flex items-center justify-center text-white shadow-sm shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Vista General de Relaciones y Lotes de Entrega
                </h2>
                <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                  Control de Ciclos Diarios
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Agrupación formal de expedientes y emergencias por ciclos de fecha (ej. cortes diarios de 26 casos). 
                Permite auditar entregas, localizar expedientes dentro de cualquier relación y emitir actas oficiales firmadas.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCreateBatch}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Nuevo Lote / Ciclo</span>
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Universal Search (Batch code, ARS, or Patient/NAP inside) */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar lote, fecha, o paciente/NAP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 outline-hidden"
            />
          </div>

          {/* Module Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 outline-hidden font-medium text-slate-700"
            >
              <option value="ALL">Todos los Tipos (Expedientes y Emergencias)</option>
              <option value="EXPEDIENTE">📁 Expedientes Médicos</option>
              <option value="EMERGENCIA">🚨 Emergencias</option>
            </select>
          </div>

          {/* ARS Filter */}
          <div>
            <select
              value={arsFilter}
              onChange={(e) => setArsFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 outline-hidden font-medium text-slate-700"
            >
              <option value="TODAS">Todas las Aseguradoras (ARS)</option>
              {COMMON_ARS_LIST.map(ars => (
                <option key={ars} value={ars}>{ars}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 outline-hidden text-slate-700"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[11px] text-slate-500 hover:text-slate-800 px-2 py-1 bg-slate-200 rounded cursor-pointer"
                title="Limpiar fecha"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Batches Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBatches.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-xl border border-slate-200 p-8">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No se encontraron lotes de entrega</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No hay relaciones que coincidan con la búsqueda o fecha seleccionada. Intenta borrar los filtros o crear un nuevo lote.
            </p>
          </div>
        ) : (
          filteredBatches.map(batch => {
            const stageConfig = getStageConfig(batch.etapa);
            const isExpediente = batch.tipo === 'EXPEDIENTE';

            return (
              <div 
                key={batch.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Top strip */}
                <div className="p-4 pb-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      {batch.codigo}
                    </span>
                    {getStatusBadge(batch.estado)}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {batch.nombre}
                  </h3>

                  <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      {isExpediente ? (
                        <FolderGit2 className="w-3.5 h-3.5 text-sky-600" />
                      ) : (
                        <Flame className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      {isExpediente ? 'Expedientes' : 'Emergencias'}
                    </span>
                    <span>&bull;</span>
                    <span className="font-bold text-slate-800">{batch.ars}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-3 flex-1 text-xs">
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block font-semibold">Fecha Ciclo:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatDateToDMY(batch.fechaCiclo)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Fecha Entrega:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatDateToDMY(batch.fechaEntrega || batch.fechaCiclo)}
                      </span>
                    </div>
                  </div>

                  {/* Stage Info */}
                  <div className="text-[11px]">
                    <span className="text-slate-400 block font-semibold mb-0.5">Etapa / Destino:</span>
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                      {stageConfig?.label || batch.etapa}
                    </span>
                  </div>

                  {/* Financial Totals */}
                  <div className="pt-2 border-t border-slate-100 space-y-1 font-mono">
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Casos incluidos:</span>
                      <span className="font-bold text-slate-900">{batch.count} registros</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Cobertura Total:</span>
                      <span>{formatCurrency(batch.totalCobertura)}</span>
                    </div>
                    {batch.totalGlosado > 0 && (
                      <div className="flex justify-between text-rose-600 text-[11px] font-bold">
                        <span>Monto Glosado:</span>
                        <span>{formatCurrency(batch.totalGlosado)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sky-700 text-xs font-black pt-1 border-t border-dashed border-slate-200">
                      <span>Total A Pagar:</span>
                      <span>{formatCurrency(batch.totalAPagar)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between gap-2">
                  {/* View Details / Records in table */}
                  <button
                    onClick={() => onSelectBatchToFilter(batch.id, batch.tipo)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Casos ({batch.count})</span>
                  </button>

                  {/* Print Official Sheet */}
                  <button
                    onClick={() => onOpenOfficialReport(
                      batch.batchRecords,
                      stageConfig?.officialDocTitle || 'ENTREGA DE EXPEDIENTES A FACTURACION',
                      batch.ars === 'TODAS' ? 'ARS SENASA' : batch.ars,
                      batch.fechaEntrega || batch.fechaCiclo
                    )}
                    className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Imprimir Relación Oficial de este Lote"
                  >
                    <Printer className="w-4 h-4 text-sky-600" />
                  </button>

                  {/* View info modal */}
                  <button
                    onClick={() => setSelectedBatchDetails(batch)}
                    className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Ver detalles y notas de custodia"
                  >
                    <FileText className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal with Batch Custody Details */}
      {selectedBatchDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-700">
                  {selectedBatchDetails.codigo}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedBatchDetails.nombre}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBatchDetails(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold block">Aseguradora:</span>
                  <span className="font-extrabold text-slate-800">{selectedBatchDetails.ars}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Etapa:</span>
                  <span className="font-bold text-slate-800">
                    {getStageConfig(selectedBatchDetails.etapa)?.label || selectedBatchDetails.etapa}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Fecha Ciclo:</span>
                  <span className="font-mono text-slate-800">{formatDateToDMY(selectedBatchDetails.fechaCiclo)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Fecha Entrega:</span>
                  <span className="font-mono text-slate-800">{formatDateToDMY(selectedBatchDetails.fechaEntrega || selectedBatchDetails.fechaCiclo)}</span>
                </div>
              </div>

              {selectedBatchDetails.descripcion && (
                <div>
                  <span className="text-slate-500 font-bold block mb-1">Descripción / Propósito:</span>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700">
                    {selectedBatchDetails.descripcion}
                  </p>
                </div>
              )}

              {/* Custody signers */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Entregado por:</span>
                  <span className="font-bold text-slate-800">
                    {selectedBatchDetails.entregadoPor || selectedBatchDetails.creadoPor}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Recibido por:</span>
                  <span className="font-bold text-slate-800">
                    {selectedBatchDetails.recibidoPor || 'Pendiente de acuse'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedBatchDetails(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  const b = selectedBatchDetails;
                  setSelectedBatchDetails(null);
                  onSelectBatchToFilter(b.id, b.tipo);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-lg cursor-pointer"
              >
                Abrir en Tabla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
