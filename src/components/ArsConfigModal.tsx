import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Clock, Save, Plus, CheckCircle2, CalendarClock } from 'lucide-react';
import { ArsExpirationConfig, User, COMMON_ARS_LIST } from '../types';

interface ArsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  configs: ArsExpirationConfig[];
  activeUser: User;
  onSaveConfigs: (newConfigs: ArsExpirationConfig[]) => Promise<void>;
}

export const ArsConfigModal: React.FC<ArsConfigModalProps> = ({
  isOpen,
  onClose,
  configs,
  activeUser,
  onSaveConfigs
}) => {
  const [localConfigs, setLocalConfigs] = useState<ArsExpirationConfig[]>([]);
  const [newArsName, setNewArsName] = useState('');
  const [newArsDays, setNewArsDays] = useState(60);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (configs && configs.length > 0) {
      setLocalConfigs(configs);
    } else {
      setLocalConfigs(
        COMMON_ARS_LIST.map(name => ({
          ars_name: name,
          short_name: name,
          dias_vigencia: name === 'PRIMERA' || name === 'HUMANO' || name === 'UNIVERSAL' ? 90 : 60
        }))
      );
    }
  }, [configs, isOpen]);

  if (!isOpen) return null;

  const handleDaysChange = (arsName: string, days: number) => {
    setLocalConfigs(prev =>
      prev.map(c => (c.ars_name === arsName ? { ...c, dias_vigencia: Math.max(1, days) } : c))
    );
  };

  const handleAddArs = () => {
    const clean = newArsName.trim().toUpperCase();
    if (!clean) return;
    if (localConfigs.some(c => c.ars_name === clean)) return;
    setLocalConfigs(prev => [
      ...prev,
      { ars_name: clean, short_name: clean, dias_vigencia: Math.max(1, newArsDays) }
    ]);
    setNewArsName('');
    setNewArsDays(60);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveConfigs(localConfigs);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide uppercase">
                Configuración de Límite de Vigencia por ARS
              </h3>
              <p className="text-xs text-slate-400">
                Define los días/meses límite desde la fecha de cierre/facturación antes de que venza el expediente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Regla de Vencimiento en Auditoría y Administración:</strong> Cada ARS tiene un plazo máximo desde la fecha de cierre/facturación (por defecto <strong>60 días / 2 meses</strong> o <strong>90 días / 3 meses</strong>). Si el auditor no ha marcado el expediente como entregado, el sistema calcula automáticamente la <strong>Fecha de Vencimiento Tentativa</strong>, los <strong>Días Restantes</strong> y alerta en color si está <strong>Vigente</strong>, <strong>Próximo a Vencer (≤15 días)</strong> o <strong>Vencido (&lt;0 días)</strong>.
            </div>
          </div>

          {/* Tabla de ARS */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200">
                  <th className="py-2.5 px-3">Pestaña / Aseguradora (ARS)</th>
                  <th className="py-2.5 px-3 text-center">Plazo Rápido</th>
                  <th className="py-2.5 px-3 text-center">Días Límite</th>
                  <th className="py-2.5 px-3 text-right">Equivalente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {localConfigs.map(cfg => {
                  const months = (cfg.dias_vigencia / 30).toFixed(1).replace('.0', '');
                  return (
                    <tr key={cfg.ars_name} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{cfg.ars_name}</td>
                      <td className="py-2 px-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDaysChange(cfg.ars_name, 30)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border cursor-pointer ${
                              cfg.dias_vigencia === 30
                                ? 'bg-sky-600 text-white border-sky-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            1 Mes (30d)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDaysChange(cfg.ars_name, 60)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border cursor-pointer ${
                              cfg.dias_vigencia === 60
                                ? 'bg-sky-600 text-white border-sky-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            2 Meses (60d)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDaysChange(cfg.ars_name, 90)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border cursor-pointer ${
                              cfg.dias_vigencia === 90
                                ? 'bg-sky-600 text-white border-sky-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            3 Meses (90d)
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={cfg.dias_vigencia}
                          onChange={e => handleDaysChange(cfg.ars_name, parseInt(e.target.value, 10) || 60)}
                          className="w-20 px-2 py-1 text-center font-mono font-bold border border-slate-300 rounded-lg focus:border-sky-500 outline-hidden"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-600">
                        ~{months} {Number(months) === 1 ? 'mes' : 'meses'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Agregar nueva ARS a la barra de pestañas */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Agregar otra ARS a las pestañas:</span>
            <input
              type="text"
              placeholder="Ej. ARS CMD, ARS YUNEN..."
              value={newArsName}
              onChange={e => setNewArsName(e.target.value)}
              className="flex-1 min-w-[160px] px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold uppercase"
            />
            <input
              type="number"
              min={1}
              max={365}
              value={newArsDays}
              onChange={e => setNewArsDays(parseInt(e.target.value, 10) || 60)}
              className="w-20 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-center"
            />
            <span className="text-xs text-slate-500">días</span>
            <button
              type="button"
              onClick={handleAddArs}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir ARS</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando en Base de Datos...' : 'Guardar Vigencias en Base de Datos'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

