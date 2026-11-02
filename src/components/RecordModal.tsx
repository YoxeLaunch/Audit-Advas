import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  FolderGit2, 
  Flame, 
  AlertCircle, 
  Calculator,
  ShieldCheck,
  Stethoscope,
  Package
} from 'lucide-react';
import { 
  MedicalRecordItem, 
  RecordType, 
  AnyStageId, 
  User, 
  DeliveryBatch,
  COMMON_ARS_LIST,
  EXPEDIENTE_STAGES,
  EMERGENCIA_STAGES
} from '../types';
import { formatCurrency, canAuditRecord, canCreateRecord } from '../utils/formatters';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecordItem | null;
  batches: DeliveryBatch[];
  defaultType: RecordType;
  defaultStage: AnyStageId;
  activeUser: User;
  onSave: (recordData: Partial<MedicalRecordItem>) => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  record,
  batches,
  defaultType,
  defaultStage,
  activeUser,
  onSave
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(record);
  const [type, setType] = useState<RecordType>(record?.type || defaultType);
  const [nombrePaciente, setNombrePaciente] = useState(record?.nombrePaciente || '');
  const [nap, setNap] = useState(record?.nap || '');
  const [ars, setArs] = useState(record?.ars || 'ARS SENASA');
  const [customArs, setCustomArs] = useState('');
  const [isCustomArs, setIsCustomArs] = useState(false);
  const [fechaCierre, setFechaCierre] = useState(
    record?.fechaCierre || new Date().toISOString().split('T')[0]
  );
  const [fechaEntrega, setFechaEntrega] = useState(
    record?.fechaEntrega || '2026-10-31'
  );
  const [cobertura, setCobertura] = useState<string>(
    record?.cobertura !== undefined ? String(record.cobertura) : ''
  );
  const [montoGlosado, setMontoGlosado] = useState<string>(
    record?.montoGlosado !== undefined ? String(record.montoGlosado) : '0'
  );
  const [nota, setNota] = useState(record?.nota || '');
  const [currentStage, setCurrentStage] = useState<AnyStageId>(
    record?.currentStage || defaultStage
  );
  const [loteId, setLoteId] = useState<string>(record?.loteId || '');

  // Available stages based on type
  const availableStages = type === 'EXPEDIENTE' ? EXPEDIENTE_STAGES : EMERGENCIA_STAGES;
  const availableBatches = batches.filter(b => b.tipo === type);

  // Set default lote if none selected
  useEffect(() => {
    if (!loteId && availableBatches.length > 0) {
      setLoteId(availableBatches[0].id);
    }
  }, [availableBatches, loteId]);

  // Auto-calculated A PAGAR
  const numCobertura = parseFloat(cobertura) || 0;
  const numGlosado = parseFloat(montoGlosado) || 0;
  const numAPagar = Math.max(0, numCobertura - numGlosado);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombrePaciente.trim()) {
      alert('Por favor ingrese el nombre del paciente.');
      return;
    }
    if (!nap.trim()) {
      alert('Por favor ingrese el número NAP.');
      return;
    }

    const finalArs = isCustomArs ? (customArs.trim() || 'ARS SENASA') : ars;
    const selectedBatch = batches.find(b => b.id === loteId);

    onSave({
      ...(record ? { id: record.id } : {}),
      type,
      nombrePaciente: nombrePaciente.trim().toUpperCase(),
      nap: nap.trim(),
      ars: finalArs,
      fechaCierre,
      fechaEntrega,
      cobertura: numCobertura,
      montoGlosado: numGlosado,
      aPagar: numAPagar,
      nota: nota.trim() || 'Sin observaciones adicionales.',
      currentStage,
      loteId: selectedBatch ? selectedBatch.id : undefined,
      loteCodigo: selectedBatch ? selectedBatch.codigo : undefined
    });

    onClose();
  };

  const isAuditorOrAdmin = canAuditRecord(activeUser.role);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              {type === 'EXPEDIENTE' ? <FolderGit2 className="w-4 h-4" /> : <Flame className="w-4 h-4 text-rose-400" />}
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isEditing ? 'Editar Registro Clínico' : 'Nuevo Registro de Entrada'}
              </h2>
              <p className="text-xs text-slate-400">
                Gestión de Calidad Médica &bull; Control Documental y Glosas
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Module Type Selector (if creating) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tipo de Registro
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setType('EXPEDIENTE');
                    setCurrentStage('RECEPCION');
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    type === 'EXPEDIENTE'
                      ? 'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-400/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FolderGit2 className="w-4 h-4 text-sky-600" />
                  <span>Expediente Médico (Hospitalario)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setType('EMERGENCIA');
                    setCurrentStage('RECEPCION_EMERGENCIA');
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    type === 'EMERGENCIA'
                      ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Flame className="w-4 h-4 text-rose-600" />
                  <span>Emergencia</span>
                </button>
              </div>
            </div>
          )}

          {/* Patient and NAP row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre del Paciente <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="EJ. JUAN PEREZ ROSARIO"
                value={nombrePaciente}
                onChange={(e) => setNombrePaciente(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                NAP (Número Autorización / Afiliado) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="EJ. 8492048-1"
                value={nap}
                onChange={(e) => setNap(e.target.value)}
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
              />
            </div>
          </div>

          {/* Lote / Ciclo Assignment Row */}
          <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3">
            <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-indigo-600" />
              Lote o Ciclo de Entrega / Recepción
            </label>
            <select
              value={loteId}
              onChange={(e) => setLoteId(e.target.value)}
              className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden text-indigo-950"
            >
              <option value="">-- Sin lote específico asignado --</option>
              {availableBatches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.codigo} - {b.nombre} ({b.fechaCiclo})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-indigo-700 mt-1">
              Vincular a un lote agrupa el expediente en las relaciones de entrega por fecha.
            </p>
          </div>

          {/* ARS and Dates row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Aseguradora (ARS)
              </label>
              {!isCustomArs ? (
                <div className="space-y-1">
                  <select
                    value={ars}
                    onChange={(e) => {
                      if (e.target.value === '__OTHER__') {
                        setIsCustomArs(true);
                      } else {
                        setArs(e.target.value);
                      }
                    }}
                    className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
                  >
                    {COMMON_ARS_LIST.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                    <option value="__OTHER__">+ Otra aseguradora...</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Nombre de ARS"
                    value={customArs}
                    onChange={(e) => setCustomArs(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomArs(false)}
                    className="text-[10px] px-2 bg-slate-200 rounded"
                  >
                    Lista
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                F. CIERRE (Fecha Alta / Cierre)
              </label>
              <input
                type="date"
                required
                value={fechaCierre}
                onChange={(e) => setFechaCierre(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fecha Entrega (Relación)
              </label>
              <input
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
              />
            </div>
          </div>

          {/* Financials Row: COBERTURA, MONTO GLOSADO, A PAGAR */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-sky-600" />
                Liquidación Financiera y Glosas
              </span>
              <span className="text-[11px] text-slate-500">
                Fórmula: Cobertura - Monto Glosado = A Pagar
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  COBERTURA (RD$) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={cobertura}
                  onChange={(e) => setCobertura(e.target.value)}
                  className="w-full text-sm font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg text-right focus:ring-2 focus:ring-sky-500 outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-rose-600">
                    MONTO GLOSADO (RD$)
                  </label>
                  {!isAuditorOrAdmin && (
                    <span className="text-[9px] text-amber-600 font-semibold" title="Solo Auditores o Administradores modifican glosas">
                      [Rol Auditor]
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={!isAuditorOrAdmin && isEditing}
                  placeholder="0.00"
                  value={montoGlosado}
                  onChange={(e) => setMontoGlosado(e.target.value)}
                  className={`w-full text-sm font-mono font-bold px-3 py-2 bg-white border border-rose-200 rounded-lg text-right text-rose-600 focus:ring-2 focus:ring-rose-500 outline-hidden ${
                    !isAuditorOrAdmin && isEditing ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sky-700 mb-1">
                  A PAGAR (RD$ Líquido)
                </label>
                <div className="w-full text-sm font-mono font-black px-3 py-2 bg-sky-50 border border-sky-300 rounded-lg text-right text-sky-700">
                  {formatCurrency(numAPagar)}
                </div>
              </div>
            </div>
          </div>

          {/* Current Stage Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Etapa en la Cadena de Seguimiento
            </label>
            <select
              value={currentStage}
              onChange={(e) => setCurrentStage(e.target.value as AnyStageId)}
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
            >
              {availableStages.map(st => (
                <option key={st.id} value={st.id}>
                  {st.order}. {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* NOTA */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              NOTA / Observaciones de Entrada o Auditoría
            </label>
            <textarea
              rows={2}
              placeholder="Indique motivo de glosa, estado de biopsias, o detalles de radicación..."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              Registrado por: <span className="font-bold text-slate-700">{activeUser.name}</span> ({activeUser.roleName})
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Registro</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
