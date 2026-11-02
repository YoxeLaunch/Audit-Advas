import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Building2, 
  FlaskConical, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { MedicalRecordItem, EXPEDIENTE_STAGES, EMERGENCIA_STAGES } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AnalyticsViewProps {
  records: MedicalRecordItem[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ records }) => {
  const expedientes = records.filter(r => r.type === 'EXPEDIENTE');
  const emergencias = records.filter(r => r.type === 'EMERGENCIA');

  const totalCobertura = records.reduce((acc, r) => acc + (r.cobertura || 0), 0);
  const totalGlosado = records.reduce((acc, r) => acc + (r.montoGlosado || 0), 0);
  const totalAPagar = records.reduce((acc, r) => acc + (r.aPagar || 0), 0);
  const tasaGlosa = totalCobertura > 0 ? (totalGlosado / totalCobertura) * 100 : 0;

  // Biopsia pending cases
  const biopsiaCases = records.filter(r => r.currentStage === 'BIOPSIAS');

  // Breakdown by ARS
  const arsMap: Record<string, { count: number; cobertura: number; glosa: number; aPagar: number }> = {};
  records.forEach(r => {
    const key = r.ars || 'OTRAS ARS';
    if (!arsMap[key]) {
      arsMap[key] = { count: 0, cobertura: 0, glosa: 0, aPagar: 0 };
    }
    arsMap[key].count += 1;
    arsMap[key].cobertura += r.cobertura || 0;
    arsMap[key].glosa += r.montoGlosado || 0;
    arsMap[key].aPagar += r.aPagar || 0;
  });

  const arsList = Object.entries(arsMap).sort((a, b) => b[1].aPagar - a[1].aPagar);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cobertura */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cobertura Total Bruta</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(totalCobertura)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {records.length} casos totales registrados
          </p>
        </div>

        {/* Monto Glosado */}
        <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Monto Glosado</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 font-mono">
            {formatCurrency(totalGlosado)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700 mt-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Tasa de objeción: {tasaGlosa.toFixed(1)}%
          </div>
        </div>

        {/* Monto A Pagar */}
        <div className="bg-white p-5 rounded-xl border border-sky-200 shadow-xs bg-sky-50/20">
          <div className="flex items-center justify-between text-sky-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Neto Liquidado A Pagar</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-800 font-mono">
            {formatCurrency(totalAPagar)}
          </div>
          <p className="text-[11px] text-sky-700 mt-1 font-semibold">
            {((totalAPagar / (totalCobertura || 1)) * 100).toFixed(1)}% de cobro efectivo
          </p>
        </div>

        {/* Biopsias / Casos Especiales */}
        <div className="bg-white p-5 rounded-xl border border-purple-200 shadow-xs bg-purple-50/20">
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">En Espera de Biopsias</span>
            <FlaskConical className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-900 font-mono">
            {biopsiaCases.length} casos
          </div>
          <p className="text-[11px] text-purple-700 mt-1">
            Requieren informe histopatológico
          </p>
        </div>
      </div>

      {/* Breakdown per ARS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ARS Financial Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-600" />
            Distribución por Aseguradora de Salud (ARS)
          </h3>

          <div className="space-y-4">
            {arsList.map(([arsName, data]) => {
              const pct = totalAPagar > 0 ? (data.aPagar / totalAPagar) * 100 : 0;
              return (
                <div key={arsName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{arsName}</span>
                    <span className="font-mono text-slate-600 font-semibold">
                      {formatCurrency(data.aPagar)} ({data.count} casos)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div 
                      className="bg-sky-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {data.glosa > 0 && (
                    <div className="text-[10px] text-rose-600 text-right font-mono">
                      Glosa retenida: {formatCurrency(data.glosa)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage Bottleneck Analysis */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Control de Flujo por Etapas (Expedientes Médicos)
          </h3>

          <div className="space-y-3">
            {EXPEDIENTE_STAGES.map(st => {
              const inStage = expedientes.filter(r => r.currentStage === st.id);
              const sum = inStage.reduce((acc, r) => acc + r.aPagar, 0);

              return (
                <div 
                  key={st.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center">
                      {st.order}
                    </span>
                    <div>
                      <div className="font-bold text-slate-800">{st.label}</div>
                      <div className="text-[10px] text-slate-500">{st.description}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold font-mono text-slate-900">{inStage.length} expedientes</div>
                    <div className="text-[11px] font-mono text-slate-500">{formatCurrency(sum)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
