import React, { useState } from 'react';
import { 
  X, 
  Stethoscope, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  DollarSign, 
  UserCheck, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { MedicalRecordItem, User } from '../types';
import { formatCurrency, formatDateToDMY } from '../utils/formatters';

interface AuditProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecordItem | null;
  activeUser: User;
  onSaveAudit: (
    recordId: string, 
    data: { 
      montoGlosado: number; 
      reporteAuditoria: string; 
      auditorConfirmado: boolean;
      auditoriaProcesada: boolean;
      advanceToNextStage?: boolean;
    }
  ) => void;
}

export const AuditProcessModal: React.FC<AuditProcessModalProps> = ({
  isOpen,
  onClose,
  record,
  activeUser,
  onSaveAudit
}) => {
  if (!isOpen || !record) return null;

  const [montoGlosado, setMontoGlosado] = useState<string>(record.montoGlosado ? String(record.montoGlosado) : '0');
  const [reporte, setReporte] = useState<string>(record.reporteAuditoria || record.nota || '');
  const [confirmedReception, setConfirmedReception] = useState<boolean>(record.auditorConfirmado || false);

  const cobertura = record.cobertura || 0;
  const numGlosa = parseFloat(montoGlosado) || 0;
  const aPagar = Math.max(0, cobertura - numGlosa);

  const handleConfirmReception = () => {
    setConfirmedReception(true);
    onSaveAudit(record.id, {
      montoGlosado: numGlosa,
      reporteAuditoria: reporte,
      auditorConfirmado: true,
      auditoriaProcesada: false
    });
  };

  const handleFinishAndProcess = () => {
    onSaveAudit(record.id, {
      montoGlosado: numGlosa,
      reporteAuditoria: reporte,
      auditorConfirmado: true,
      auditoriaProcesada: true,
      advanceToNextStage: true
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-base font-bold">Panel de Auditoría Médica Hospitalaria</h2>
              <p className="text-xs text-amber-100">
                Dictamen clínico, pertinencia de servicios y verificación de glosas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Patient Card */}
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Paciente:</span>
              <p className="text-sm font-extrabold text-slate-900">{record.nombrePaciente}</p>
              <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                <span>NAP: <strong className="font-mono text-slate-800">{record.nap}</strong></span>
                <span>&bull;</span>
                <span>ARS: <strong className="text-slate-800">{record.ars}</strong></span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase">F. Cierre:</span>
              <p className="font-mono font-bold text-slate-700">{formatDateToDMY(record.fechaCierre)}</p>
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Lote: {record.loteCodigo || 'General'}
              </span>
            </div>
          </div>

          {/* Reception confirmation banner */}
          <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
            confirmedReception
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            <div className="flex items-center gap-2">
              {confirmedReception ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <p className="font-bold text-xs">
                  {confirmedReception
                    ? 'Recepción física del expediente CONFIRMADA por el Auditor'
                    : 'Expediente pendiente de confirmación física'}
                </p>
                <p className="text-[11px] opacity-80">
                  {confirmedReception
                    ? `Confirmado por: ${record.auditorAsignadoNombre || activeUser.name}`
                    : 'El auditor debe confirmar que tiene el expediente en mano para auditar.'}
                </p>
              </div>
            </div>

            {!confirmedReception && (
              <button
                type="button"
                onClick={handleConfirmReception}
                className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-2xs cursor-pointer text-xs"
              >
                Confirmar Recepción
              </button>
            )}
          </div>

          {/* Financial summary calculations */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Cobertura Total</label>
              <div className="text-sm font-extrabold text-slate-800 font-mono mt-0.5">
                {formatCurrency(cobertura)}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-rose-600 uppercase">Monto Glosado (Deducible / No Cubierto)</label>
              <div className="relative mt-0.5">
                <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 font-mono text-xs">RD$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={montoGlosado}
                  onChange={(e) => setMontoGlosado(e.target.value)}
                  className="w-full pl-9 pr-2 py-1 bg-white border border-rose-300 focus:border-rose-500 rounded-lg text-xs font-mono font-bold text-rose-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-sky-700 uppercase">Monto Neto a Pagar</label>
              <div className="text-sm font-black text-sky-700 font-mono mt-0.5">
                {formatCurrency(aPagar)}
              </div>
            </div>
          </div>

          {/* Audit observations / clinical report */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Dictamen Clínico / Informe de Auditoría Médica:
            </label>
            <textarea
              rows={4}
              value={reporte}
              onChange={(e) => setReporte(e.target.value)}
              placeholder="Describa el resultado de la auditoría médica: notas de pertinencia, causas de glosa, soportes clínicos validados, firmas médicas completas..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 outline-hidden text-xs text-slate-800 leading-relaxed font-sans"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
          >
            Cerrar sin avanzar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onSaveAudit(record.id, {
                  montoGlosado: numGlosa,
                  reporteAuditoria: reporte,
                  auditorConfirmado: confirmedReception,
                  auditoriaProcesada: false
                });
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer"
            >
              Guardar Borrador
            </button>

            <button
              type="button"
              onClick={handleFinishAndProcess}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Emitir Reporte y Pasar a Recepción Auditores</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

