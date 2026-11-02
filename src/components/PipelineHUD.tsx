import React from 'react';
import { 
  FolderGit2, 
  Flame, 
  BarChart3, 
  ArrowRight, 
  FileCheck, 
  Stethoscope, 
  FlaskConical, 
  Send, 
  Receipt,
  Layers,
  Clock,
  DollarSign,
  Package
} from 'lucide-react';
import { 
  RecordType, 
  AnyStageId, 
  EXPEDIENTE_STAGES, 
  EMERGENCIA_STAGES, 
  MedicalRecordItem,
  DeliveryBatch 
} from '../types';
import { formatCurrency } from '../utils/formatters';

interface PipelineHUDProps {
  currentType: RecordType;
  onChangeType: (type: RecordType) => void;
  selectedStage: AnyStageId | 'ALL';
  onSelectStage: (stageId: AnyStageId | 'ALL') => void;
  records: MedicalRecordItem[];
  batches: DeliveryBatch[];
  activeView: 'RECORDS' | 'BATCHES' | 'ANALYTICS';
  onChangeView: (view: 'RECORDS' | 'BATCHES' | 'ANALYTICS') => void;
}

export const PipelineHUD: React.FC<PipelineHUDProps> = ({
  currentType,
  onChangeType,
  selectedStage,
  onSelectStage,
  records,
  batches,
  activeView,
  onChangeView
}) => {
  const currentStages = currentType === 'EXPEDIENTE' ? EXPEDIENTE_STAGES : EMERGENCIA_STAGES;
  const filteredRecordsByType = records.filter(r => r.type === currentType);

  // Helper icons for stages
  const getStageIcon = (id: AnyStageId) => {
    switch (id) {
      case 'RECEPCION':
      case 'RECEPCION_EMERGENCIA':
        return <FileCheck className="w-4 h-4" />;
      case 'AUDITORIA':
        return <Stethoscope className="w-4 h-4" />;
      case 'BIOPSIAS':
        return <FlaskConical className="w-4 h-4" />;
      case 'ENTREGA_ARS':
      case 'ENTREGA_ARS_EMERGENCIA':
        return <Send className="w-4 h-4" />;
      case 'FACTURACION':
      case 'FACTURACION_EMERGENCIA':
        return <Receipt className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  // Stage metrics calculation
  const getStageMetrics = (stageId: AnyStageId) => {
    const stageRecords = filteredRecordsByType.filter(r => r.currentStage === stageId);
    const count = stageRecords.length;
    const totalAPagar = stageRecords.reduce((acc, r) => acc + (r.aPagar || 0), 0);
    const totalGlosado = stageRecords.reduce((acc, r) => acc + (r.montoGlosado || 0), 0);
    return { count, totalAPagar, totalGlosado };
  };

  // Total summary for current type
  const totalCount = filteredRecordsByType.length;
  const totalSumAPagar = filteredRecordsByType.reduce((acc, r) => acc + (r.aPagar || 0), 0);
  const totalSumGlosas = filteredRecordsByType.reduce((acc, r) => acc + (r.montoGlosado || 0), 0);

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 shadow-xs print:hidden">
      {/* Top HUD Controls: Module Selector & View Mode */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        {/* Module Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => {
              onChangeType('EXPEDIENTE');
              onChangeView('RECORDS');
              onSelectStage('ALL');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentType === 'EXPEDIENTE' && activeView === 'RECORDS'
                ? 'bg-white text-sky-800 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FolderGit2 className="w-4 h-4 text-sky-600" />
            <span>Expedientes Médicos</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              currentType === 'EXPEDIENTE' && activeView === 'RECORDS' 
                ? 'bg-sky-100 text-sky-800' 
                : 'bg-slate-200 text-slate-700'
            }`}>
              {records.filter(r => r.type === 'EXPEDIENTE').length}
            </span>
          </button>

          <button
            onClick={() => {
              onChangeType('EMERGENCIA');
              onChangeView('RECORDS');
              onSelectStage('ALL');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentType === 'EMERGENCIA' && activeView === 'RECORDS'
                ? 'bg-white text-rose-800 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Flame className="w-4 h-4 text-rose-600" />
            <span>Emergencias</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              currentType === 'EMERGENCIA' && activeView === 'RECORDS' 
                ? 'bg-rose-100 text-rose-800' 
                : 'bg-slate-200 text-slate-700'
            }`}>
              {records.filter(r => r.type === 'EMERGENCIA').length}
            </span>
          </button>

          {/* NEW: Lotes y Relaciones por Ciclo Tab */}
          <button
            onClick={() => onChangeView('BATCHES')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'BATCHES'
                ? 'bg-white text-indigo-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Package className="w-4 h-4 text-indigo-600" />
            <span>Lotes y Relaciones por Ciclo</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeView === 'BATCHES' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {batches.length} lotes
            </span>
          </button>

          <button
            onClick={() => onChangeView('ANALYTICS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'ANALYTICS'
                ? 'bg-white text-indigo-800 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Panel de Glosas y Tiempos</span>
          </button>
        </div>

        {/* Global Financial Stats for Current Active Module */}
        <div className="flex items-center gap-3 text-xs bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Total {currentType === 'EXPEDIENTE' ? 'Expedientes' : 'Emergencias'}
            </span>
            <span className="font-extrabold text-slate-800 font-mono text-sm">
              {totalCount} casos
            </span>
          </div>

          <div className="h-7 w-px bg-slate-200"></div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Total Glosado
            </span>
            <span className="font-bold text-rose-600 font-mono text-xs">
              {formatCurrency(totalSumGlosas)}
            </span>
          </div>

          <div className="h-7 w-px bg-slate-200"></div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Total A Pagar
            </span>
            <span className="font-extrabold text-sky-700 font-mono text-xs">
              {formatCurrency(totalSumAPagar)}
            </span>
          </div>
        </div>
      </div>

      {/* Cadena de Seguimiento (Stage Workflow Cards) */}
      {activeView === 'RECORDS' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Cadena de Seguimiento y Etapas:
              </span>
              <span className="text-xs text-slate-500 hidden md:inline">
                (Haz clic en cualquier etapa para filtrar su relación correspondiente)
              </span>
            </div>

            {/* View All Button */}
            <button
              onClick={() => onSelectStage('ALL')}
              className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                selectedStage === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Mostrar Todos ({totalCount})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {currentStages.map((stage, idx) => {
              const { count, totalAPagar, totalGlosado } = getStageMetrics(stage.id);
              const isSelected = selectedStage === stage.id;

              return (
                <div
                  key={stage.id}
                  onClick={() => onSelectStage(stage.id)}
                  className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-400/20 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  {/* Step header */}
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        isSelected 
                          ? 'bg-sky-600 text-white' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {stage.order}
                      </span>
                      <span className="text-slate-400">
                        {getStageIcon(stage.id)}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                      count > 0 
                        ? isSelected 
                          ? 'bg-sky-600 text-white' 
                          : 'bg-slate-800 text-white' 
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </div>

                  {/* Stage title */}
                  <div className="mb-2">
                    <h3 className={`text-xs font-bold leading-tight ${
                      isSelected ? 'text-sky-900' : 'text-slate-800'
                    }`}>
                      {stage.label}
                    </h3>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5" title={stage.description}>
                      {stage.description}
                    </p>
                  </div>

                  {/* Stage financial totals */}
                  <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">A pagar:</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(totalAPagar)}
                    </span>
                  </div>

                  {totalGlosado > 0 && (
                    <div className="text-[10px] text-rose-600 font-mono font-semibold text-right">
                      Glosa: {formatCurrency(totalGlosado)}
                    </div>
                  )}

                  {/* Connector arrow for larger screens */}
                  {idx < currentStages.length - 1 && (
                    <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 text-slate-300">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
