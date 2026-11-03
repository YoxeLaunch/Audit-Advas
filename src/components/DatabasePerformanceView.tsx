import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Zap, 
  Cpu, 
  HardDrive, 
  Clock, 
  Calendar, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Activity, 
  FileSpreadsheet,
  Server,
  RefreshCw,
  Play
} from 'lucide-react';
import { apiRunStressTest, apiImportExternal, apiFetchClosures, apiCloseYear } from '../services/apiService';
import { formatCurrency } from '../utils/formatters';

interface DatabasePerformanceViewProps {
  totalRecords: number;
  onRefreshRecords: () => void;
  showToast: (msg: string) => void;
}

export const DatabasePerformanceView: React.FC<DatabasePerformanceViewProps> = ({
  totalRecords,
  onRefreshRecords,
  showToast
}) => {
  const [isRunningStress, setIsRunningStress] = useState(false);
  const [stressResult, setStressResult] = useState<{
    count: number;
    timeMs: number;
    opsPerSec: number;
    total: number;
  } | null>(null);

  const [closures, setClosures] = useState<any[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([2026]);
  const [selectedYearToClose, setSelectedYearToClose] = useState<number>(2025);
  const [closeNotes, setCloseNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  // Load closures
  const loadClosures = async () => {
    try {
      const data = await apiFetchClosures();
      if (data.success) {
        setClosures(data.closures || []);
        if (data.availableYears && data.availableYears.length > 0) {
          setAvailableYears(data.availableYears);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadClosures();
  }, []);

  const handleRunStress = async (count: number) => {
    setIsRunningStress(true);
    setStressResult(null);
    try {
      const res = await apiRunStressTest(count);
      const ops = Math.round(count / (res.elapsedTimeMs / 1000));
      setStressResult({
        count,
        timeMs: res.elapsedTimeMs,
        opsPerSec: ops,
        total: res.totalInDatabase
      });
      onRefreshRecords();
      showToast(`¡Prueba exitosa! ${count} registros insertados en ${res.elapsedTimeMs} ms (${ops.toLocaleString()} reg/s).`);
    } catch (err: any) {
      showToast(`Error en prueba de estrés: ${err.message}`);
    } finally {
      setIsRunningStress(false);
    }
  };

  const handleSimulateExternalImport = async () => {
    try {
      const sampleExternal = Array.from({ length: 300 }).map((_, i) => ({
        nombrePaciente: `PACIENTE EXTERNO HIS #${i + 1}`,
        nap: `EXT-${Math.floor(100000 + Math.random() * 900000)}`,
        ars: 'ARS SENASA',
        fechaCierre: '2026-11-02',
        cobertura: 15000,
        montoGlosado: 0,
        currentStage: 'RECEPCION',
        nota: 'Ingesta automática vía API REST /api/sync/import-records'
      }));

      const res = await apiImportExternal(sampleExternal, 'HIS_HOSPITALARIO_CENTRAL');
      onRefreshRecords();
      showToast(`Sincronización simulada exitosa: ${res.importedCount} expedientes integrados.`);
    } catch (err: any) {
      showToast(`Error al simular importación: ${err.message}`);
    }
  };

  const handleCloseYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsClosing(true);
    try {
      await apiCloseYear(selectedYearToClose, closeNotes, 'Administrador Root');
      await loadClosures();
      showToast(`Ejercicio fiscal ${selectedYearToClose} cerrado con snapshot consolidado.`);
      setCloseNotes('');
    } catch (err: any) {
      showToast(`Error al cerrar año: ${err.message}`);
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-2">
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            <span>Base de Datos Interna SQLite &bull; Modo WAL &bull; Indexación B-Tree</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Motor de Base de Datos y Optimización Masiva
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Almacenamiento ACID de ultra alta velocidad, partición por cierres anuales, paginación con latencia menor a 5 ms y API de sincronización para conectar con sistemas externos a futuro.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="p-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10 text-center min-w-[120px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total en Base de Datos</span>
            <span className="text-xl font-black font-mono text-white">{totalRecords.toLocaleString()}</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">● Indexado Activo</span>
          </div>
        </div>
      </div>

      {/* Grid of 3 Main Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Stress Testing Panel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Pruebas de Estrés y Rendimiento</h3>
              <p className="text-[11px] text-slate-500">Comprobar cero lag con miles de registros</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Ejecuta inserciones masivas en una sola transacción SQLite para evaluar la respuesta de la base de datos y comprobar que las búsquedas y la interfaz responden de forma fluida.
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleRunStress(1000)}
              disabled={isRunningStress}
              className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:border-rose-300 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 text-center"
            >
              +1,000
            </button>
            <button
              onClick={() => handleRunStress(5000)}
              disabled={isRunningStress}
              className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:border-rose-300 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 text-center"
            >
              +5,000
            </button>
            <button
              onClick={() => handleRunStress(10000)}
              disabled={isRunningStress}
              className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:border-rose-300 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 text-center"
            >
              +10,000
            </button>
          </div>

          {isRunningStress && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 animate-pulse">
              <Activity className="w-4 h-4 text-amber-600" />
              <span>Ejecutando transacción masiva en SQLite...</span>
            </div>
          )}

          {stressResult && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Resultados de la Prueba:</span>
              </div>
              <div className="text-slate-700 grid grid-cols-2 gap-1 text-[11px] pt-1">
                <div>Insertados: <strong>{stressResult.count.toLocaleString()}</strong></div>
                <div>Tiempo total: <strong>{stressResult.timeMs} ms</strong></div>
                <div>Velocidad: <strong className="text-emerald-700 font-mono">{stressResult.opsPerSec.toLocaleString()} reg/s</strong></div>
                <div>Total en BD: <strong>{stressResult.total.toLocaleString()}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Cierres Anuales y Partición */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Cierres Anuales e Históricos</h3>
              <p className="text-[11px] text-slate-500">Partición para evitar sobrecarga</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Permite congelar y consolidar ejercicios fiscales pasados. Las consultas del año en curso no se ralentizan con los datos históricos.
          </p>

          <form onSubmit={handleCloseYear} className="space-y-2.5 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Año de Ejercicio a Cerrar</label>
              <select
                value={selectedYearToClose}
                onChange={(e) => setSelectedYearToClose(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>Ejercicio Fiscal {y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nota del Cierre Anual</label>
              <input
                type="text"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Ej. Cierre auditado con acta formal"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isClosing}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Cerrar Ejercicio Anual</span>
            </button>
          </form>

          {closures.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Ejercicios Consolidados:</span>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {closures.map(c => (
                  <div key={c.year} className="p-1.5 bg-slate-50 rounded border border-slate-200 text-[10px] flex items-center justify-between">
                    <span className="font-bold text-slate-800">Año {c.year}</span>
                    <span className="font-mono text-slate-600">{c.total_records} casos &bull; {formatCurrency(c.total_a_pagar)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Conexión a Sistemas Futuros (ETL / API) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Conexión con Sistemas Futuros</h3>
              <p className="text-[11px] text-slate-500">API REST de ingesta masiva (HIS/ERP)</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            AuditAdvas expone el endpoint REST <code>/api/sync/import-records</code> para jalar o recibir lotes de historias clínicas desde sistemas externos hospitalarios sin intervención manual.
          </p>

          <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-xl overflow-x-auto">
            <code>POST /api/sync/import-records</code><br />
            <span className="text-slate-400">Content-Type: application/json</span><br />
            <span className="text-slate-500">// Acepta arrays de hasta 50,000 expedientes</span>
          </div>

          <button
            onClick={handleSimulateExternalImport}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Simular Ingesta Externa (+300 Casos)</span>
          </button>
        </div>

      </div>

    </div>
  );
};

