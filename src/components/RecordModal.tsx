import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  FolderGit2, 
  Flame, 
  Calculator,
  Stethoscope,
  Microscope
} from 'lucide-react';
import { 
  MedicalRecordItem, 
  RecordType, 
  AnyStageId, 
  User, 
  DeliveryBatch,
  ArsExpirationConfig,
  EXPEDIENTE_STAGES,
  EMERGENCIA_STAGES
} from '../types';
import { formatCurrency, canAuditRecord, normalizeArsName } from '../utils/formatters';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecordItem | null;
  batches: DeliveryBatch[];
  defaultType: RecordType;
  defaultStage: AnyStageId;
  activeUser: User;
  users?: User[];
  arsConfigs?: ArsExpirationConfig[];
  onSave: (recordData: Partial<MedicalRecordItem>) => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  record,
  defaultType,
  defaultStage,
  activeUser,
  users = [],
  arsConfigs = [],
  onSave
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(record);
  const todayIso = new Date().toISOString().split('T')[0];
  const configuredArsNames = arsConfigs.map(c => c.ars_name);

  const [type, setType] = useState<RecordType>(record?.type || defaultType);
  const [nombrePaciente, setNombrePaciente] = useState(record?.nombrePaciente || '');
  const [nap, setNap] = useState(record?.nap || '');
  const [ars, setArs] = useState(
    record?.ars ? normalizeArsName(record.ars) : configuredArsNames[0] || ''
  );
  const [customArs, setCustomArs] = useState(
    record?.ars && !configuredArsNames.includes(normalizeArsName(record.ars))
      ? normalizeArsName(record.ars)
      : ''
  );
  const [isCustomArs, setIsCustomArs] = useState(configuredArsNames.length === 0);
  const [fechaCierre, setFechaCierre] = useState(record?.fechaCierre || todayIso);
  const [fechaEntrega, setFechaEntrega] = useState(record?.fechaEntrega || todayIso);
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

  // Campos de Auditoría y Biopsias
  const [auditorAsignadoNombre, setAuditorAsignadoNombre] = useState(
    record?.auditorAsignadoNombre || ''
  );
  const [medicoTratante, setMedicoTratante] = useState(record?.medicoTratante || '');
  const [vecesEnviadaBiopsia, setVecesEnviadaBiopsia] = useState<number>(
    record?.vecesEnviadaBiopsia || 1
  );
  const [descripcionBiopsia, setDescripcionBiopsia] = useState(
    record?.descripcionBiopsia || ''
  );

  const availableStages = type === 'EXPEDIENTE' ? EXPEDIENTE_STAGES : EMERGENCIA_STAGES;
  const auditorUsers = users.filter(u => u.role === 'AUDITOR_MEDICO' || u.role === 'AUDITOR');

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
      alert('Por favor ingrese el número NAP / Autorización.');
      return;
    }

    const finalArs = (isCustomArs ? customArs : ars).trim().toUpperCase();
    if (!finalArs) {
      alert('Por favor ingrese o seleccione la Aseguradora / Entidad.');
      return;
    }

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
      nota: nota.trim(),
      currentStage,
      loteCodigo: `REL-${fechaEntrega}`,
      auditorAsignadoNombre: auditorAsignadoNombre.trim() || undefined,
      tienePendienteBiopsia: currentStage === 'BIOPSIAS' ? true : record?.tienePendienteBiopsia,
      medicoTratante: medicoTratante.trim().toUpperCase() || undefined,
      vecesEnviadaBiopsia: Number(vecesEnviadaBiopsia) || 1,
      descripcionBiopsia: descripcionBiopsia.trim().toUpperCase() || undefined
    });

    onClose();
  };

  const isAuditorOrAdmin = canAuditRecord(activeUser.role) || activeUser.role === 'ADMINISTRATIVO';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              {type === 'EXPEDIENTE' ? <FolderGit2 className="w-4 h-4" /> : <Flame className="w-4 h-4 text-rose-400" />}
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isEditing ? 'Editar Registro Clínico' : 'Emitir / Registrar Expediente'}
              </h2>
              <p className="text-xs text-slate-400">
                Persistido directamente en Base de Datos SQLite &bull; Generado por {activeUser.name}
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {!isEditing && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType('EXPEDIENTE');
                  setCurrentStage('RECEPCION');
                }}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  type === 'EXPEDIENTE'
                    ? 'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-400/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FolderGit2 className="w-4 h-4 text-sky-600" />
                <span>Expediente Hospitalario</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('EMERGENCIA');
                  setCurrentStage('RECEPCION_EMERGENCIA');
                }}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  type === 'EMERGENCIA'
                    ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Flame className="w-4 h-4 text-rose-600" />
                <span>Atención de Emergencia</span>
              </button>
            </div>
          )}

          {/* Paciente y NAP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre del Paciente <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="EJ. NOMBRE COMPLETO DEL PACIENTE"
                value={nombrePaciente}
                onChange={(e) => setNombrePaciente(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                NAP / Número de Autorización <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="EJ. AUT-000123-1"
                value={nap}
                onChange={(e) => setNap(e.target.value)}
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
              />
            </div>
          </div>

          {/* ARS y Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Aseguradora / Entidad <span className="text-rose-500">*</span>
              </label>
              {!isCustomArs && configuredArsNames.length > 0 ? (
                <select
                  value={ars}
                  onChange={(e) => {
                    if (e.target.value === '__OTHER__') {
                      setIsCustomArs(true);
                    } else {
                      setArs(e.target.value);
                    }
                  }}
                  className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
                >
                  {configuredArsNames.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                  <option value="__OTHER__">+ Crear / Otra Aseguradora...</option>
                </select>
              ) : (
                <div className="flex gap-1">
                  <input
                    type="text"
                    required
                    placeholder="Ej. ASEGURADORA ALFA"
                    value={customArs}
                    onChange={(e) => setCustomArs(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg uppercase font-bold"
                  />
                  {configuredArsNames.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCustomArs(false)}
                      className="text-[10px] px-2 bg-slate-200 rounded font-bold cursor-pointer"
                    >
                      Lista
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fecha Cierre / Ingreso
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
                Fecha de Relación / Entrega
              </label>
              <input
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
              />
            </div>
          </div>

          {/* Etapa y Médico Auditor Asignado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Etapa Actual del Flujo
              </label>
              <select
                value={currentStage}
                onChange={(e) => setCurrentStage(e.target.value as AnyStageId)}
                className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
              >
                {availableStages.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {type === 'EXPEDIENTE' && (
              <div>
                <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-amber-600" />
                  Médico Auditor Asignado
                </label>
                {auditorUsers.length > 0 ? (
                  <select
                    value={auditorAsignadoNombre}
                    onChange={(e) => setAuditorAsignadoNombre(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 outline-hidden text-amber-950"
                  >
                    <option value="">-- Sin asignar aún --</option>
                    {auditorUsers.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Cree un Auditor en Usuarios o escriba su nombre..."
                    value={auditorAsignadoNombre}
                    onChange={(e) => setAuditorAsignadoNombre(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 outline-hidden text-amber-950"
                  />
                )}
              </div>
            )}
          </div>

          {/* Sección de Biopsias / Histopatología (si está en BIOPSIAS o tiene datos de biopsia) */}
          {(currentStage === 'BIOPSIAS' || record?.tienePendienteBiopsia) && (
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-black text-purple-900 uppercase">
                <Microscope className="w-4 h-4 text-purple-600" />
                Datos para Solicitud de Reportes de Histopatología (Biopsias)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-purple-900 uppercase mb-1">
                    Médico Tratante / Cirujano
                  </label>
                  <input
                    type="text"
                    placeholder="EJ. DR. MEDICO TRATANTE"
                    value={medicoTratante}
                    onChange={(e) => setMedicoTratante(e.target.value)}
                    className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-purple-900 uppercase mb-1">
                    Veces Enviadas (1=Nueva, 2+=Pendiente)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={vecesEnviadaBiopsia}
                    onChange={(e) => setVecesEnviadaBiopsia(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs font-mono font-black px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-purple-900 uppercase mb-1">
                    Biopsia / Pieza Histopatológica
                  </label>
                  <input
                    type="text"
                    placeholder="EJ. PIEZA HISTOPATOLOGICA"
                    value={descripcionBiopsia}
                    onChange={(e) => setDescripcionBiopsia(e.target.value)}
                    className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Liquidación Financiera */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-sky-600" />
                Montos de Cobertura y Glosas
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
                  className="w-full text-xs font-mono font-bold px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-600 mb-1">
                  MONTO GLOSADO (RD$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={!isAuditorOrAdmin && isEditing}
                  placeholder="0.00"
                  value={montoGlosado}
                  onChange={(e) => setMontoGlosado(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-right text-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sky-700 mb-1">
                  A PAGAR (RD$ Neto)
                </label>
                <div className="w-full text-xs font-mono font-black px-3 py-1.5 bg-sky-50 border border-sky-300 rounded-lg text-right text-sky-700">
                  {formatCurrency(numAPagar)}
                </div>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Observación / Nota
            </label>
            <input
              type="text"
              placeholder="Observación breve de una línea..."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
            />
          </div>

          {/* Botones */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              Operador: <span className="font-bold text-slate-800">{activeUser.name}</span> ({activeUser.roleName})
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar en Base de Datos</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
