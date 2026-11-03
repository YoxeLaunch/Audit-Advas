import React, { useState } from 'react';
import { 
  X, 
  Package, 
  Save, 
  Calendar, 
  Building2, 
  FolderGit2, 
  Flame,
  CheckCircle2
} from 'lucide-react';
import { 
  DeliveryBatch, 
  RecordType, 
  AnyStageId, 
  User, 
  COMMON_ARS_LIST,
  EXPEDIENTE_STAGES,
  EMERGENCIA_STAGES
} from '../types';

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType: RecordType;
  defaultStage: AnyStageId;
  activeUser: User;
  onCreateBatch: (batchData: Omit<DeliveryBatch, 'id'>) => void;
}

export const CreateBatchModal: React.FC<CreateBatchModalProps> = ({
  isOpen,
  onClose,
  defaultType,
  defaultStage,
  activeUser,
  onCreateBatch
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const [tipo, setTipo] = useState<RecordType>(defaultType);
  const [codigo, setCodigo] = useState(`LOTE-${tipo === 'EXPEDIENTE' ? 'EXP' : 'EMG'}-${todayStr.replace(/-/g, '')}-01`);
  const [nombre, setNombre] = useState(`Corte Diario de ${tipo === 'EXPEDIENTE' ? 'Expedientes' : 'Emergencias'} (${todayStr})`);
  const [ars, setArs] = useState('TODAS');
  const [etapa, setEtapa] = useState<AnyStageId>(
    tipo === 'EXPEDIENTE' ? 'RECEPCION' : 'RECEPCION_EMERGENCIA'
  );
  const [fechaCiclo, setFechaCiclo] = useState(todayStr);
  const [fechaEntrega, setFechaEntrega] = useState(todayStr);
  const [descripcion, setDescripcion] = useState('');
  const [entregadoPor, setEntregadoPor] = useState(activeUser.name);
  const [recibidoPor, setRecibidoPor] = useState('');

  const stages = tipo === 'EXPEDIENTE' ? EXPEDIENTE_STAGES : EMERGENCIA_STAGES;

  const handleTipoChange = (newTipo: RecordType) => {
    setTipo(newTipo);
    setCodigo(`LOTE-${newTipo === 'EXPEDIENTE' ? 'EXP' : 'EMG'}-${fechaCiclo.replace(/-/g, '')}-01`);
    setNombre(`Corte Diario de ${newTipo === 'EXPEDIENTE' ? 'Expedientes' : 'Emergencias'} (${fechaCiclo})`);
    setEtapa(newTipo === 'EXPEDIENTE' ? 'RECEPCION' : 'RECEPCION_EMERGENCIA');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !nombre.trim()) {
      alert('Por favor ingrese código y nombre del lote.');
      return;
    }

    const timestamp = new Date().toLocaleString('es-DO');

    onCreateBatch({
      codigo: codigo.trim().toUpperCase(),
      nombre: nombre.trim(),
      tipo,
      ars,
      etapa,
      fechaCiclo,
      fechaEntrega,
      estado: 'ABIERTO',
      descripcion: descripcion.trim() || `Ciclo de ${tipo.toLowerCase()} creado por ${activeUser.name}`,
      creadoPor: activeUser.name,
      creadoEn: timestamp,
      entregadoPor: entregadoPor.trim(),
      recibidoPor: recibidoPor.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Crear Nuevo Lote / Ciclo de Entrega
              </h3>
              <p className="text-xs text-slate-500">
                Agrupación formal de expedientes para recepción o entrega en fecha específica
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Tipo Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              Tipo de Casos
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTipoChange('EXPEDIENTE')}
                className={`p-2.5 rounded-lg border font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  tipo === 'EXPEDIENTE' 
                    ? 'border-sky-500 bg-sky-50 text-sky-900' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FolderGit2 className="w-4 h-4 text-sky-600" />
                <span>Expedientes Médicos</span>
              </button>
              <button
                type="button"
                onClick={() => handleTipoChange('EMERGENCIA')}
                className={`p-2.5 rounded-lg border font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  tipo === 'EMERGENCIA' 
                    ? 'border-rose-500 bg-rose-50 text-rose-900' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Flame className="w-4 h-4 text-rose-600" />
                <span>Emergencias</span>
              </button>
            </div>
          </div>

          {/* Código y Nombre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Código del Lote <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold focus:bg-white focus:ring-1 focus:ring-sky-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Nombre Descriptivo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Recepción Diaria 26 Casos"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold focus:bg-white focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* ARS y Etapa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Aseguradora (ARS)
              </label>
              <select
                value={ars}
                onChange={(e) => setArs(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-sky-500 font-medium"
              >
                <option value="TODAS">TODAS LAS ARS (Múltiple)</option>
                {COMMON_ARS_LIST.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Etapa / Tipo de Relación
              </label>
              <select
                value={etapa}
                onChange={(e) => setEtapa(e.target.value as AnyStageId)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-sky-500 font-semibold"
              >
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Fecha del Ciclo (Corte)
              </label>
              <input
                type="date"
                required
                value={fechaCiclo}
                onChange={(e) => setFechaCiclo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Fecha de Entrega Programada
              </label>
              <input
                type="date"
                required
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              Observaciones del Lote
            </label>
            <input
              type="text"
              placeholder="Detalles del corte, turno, sala o valija de mensajería..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Signers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Entregado Por (Responsable)
              </label>
              <input
                type="text"
                value={entregadoPor}
                onChange={(e) => setEntregadoPor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-sky-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Recibido Por (Destino)
              </label>
              <input
                type="text"
                placeholder="Ej. Facturación / ARS"
                value={recibidoPor}
                onChange={(e) => setRecibidoPor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-sky-500 font-semibold"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Lote</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
