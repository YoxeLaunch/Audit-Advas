import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Printer, 
  Plus, 
  Edit2, 
  Trash2, 
  MessageSquare, 
  ArrowRight, 
  CheckSquare, 
  Square,
  Calendar,
  Zap,
  Stethoscope,
  ClipboardCheck,
  FlaskConical,
  Send,
  CheckCircle2,
  UserCheck,
  Clock,
  Archive,
  Repeat,
  Settings,
  ChevronLeft,
  ChevronRight,
  ListFilter
} from 'lucide-react';
import { 
  MedicalRecordItem, 
  RecordType, 
  AnyStageId, 
  User, 
  DeliveryBatch,
  COMMON_ARS_LIST,
  ArsExpirationConfig
} from '../types';
import { 
  formatCurrency, 
  formatDateToDMY, 
  getStageConfig, 
  getNextStage,
  canCreateRecord,
  canDeleteRecord,
  canChangeStage,
  getAllowedStagesForUser,
  normalizeArsName,
  calculateRecordSla
} from '../utils/formatters';

interface TableViewProps {
  records: MedicalRecordItem[];
  batches: DeliveryBatch[];
  type: RecordType;
  selectedStage: AnyStageId | 'ALL';
  selectedBatchFilter: string | 'ALL';
  onChangeBatchFilter: (batchId: string | 'ALL') => void;
  activeUser: User;
  users?: User[];
  arsConfigs?: ArsExpirationConfig[];
  onOpenArsConfig?: () => void;
  onOpenNewRecord: (type: RecordType) => void;
  onEditRecord: (record: MedicalRecordItem) => void;
  onDeleteRecord: (id: string) => void;
  onOpenNotes: (record: MedicalRecordItem) => void;
  onAdvanceStage: (record: MedicalRecordItem) => void;
  onBulkAdvance: (recordIds: string[], targetStageId: AnyStageId) => void;
  onBulkAssignBatch?: (recordIds: string[], batchId: string) => void;
  onOpenOfficialReport: (
    filteredRecords: MedicalRecordItem[],
    title: string,
    ars: string,
    deliveryDate: string,
    extra?: {
      stage?: AnyStageId | 'ALL';
      auditorName?: string;
      deliveredBy?: string;
      receivedBy?: string;
    }
  ) => void;
  onQuickAdd: (recordData: Partial<MedicalRecordItem>) => void;
  onOpenAuditModal?: (record: MedicalRecordItem) => void;
  onConciliateRecord?: (record: MedicalRecordItem, auditorName?: string) => void;
  onBulkConciliate?: (recordIds: string[], auditorName?: string) => void;
  onRouteToBiopsias?: (record: MedicalRecordItem) => void;
  onRouteToArs?: (record: MedicalRecordItem) => void;
  onConfirmBillingDelivery?: (record: MedicalRecordItem) => void;
  onIncrementBiopsiaSend?: (record: MedicalRecordItem) => void;
  onCompleteBiopsia?: (record: MedicalRecordItem) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  records,
  type,
  selectedStage,
  activeUser,
  users = [],
  arsConfigs = [],
  onOpenArsConfig,
  onOpenNewRecord,
  onEditRecord,
  onDeleteRecord,
  onOpenNotes,
  onAdvanceStage,
  onBulkAdvance,
  onOpenOfficialReport,
  onQuickAdd,
  onOpenAuditModal,
  onConciliateRecord,
  onBulkConciliate,
  onRouteToBiopsias,
  onRouteToArs,
  onConfirmBillingDelivery,
  onIncrementBiopsiaSend,
  onCompleteBiopsia
}) => {
  const todayIso = new Date().toISOString().split('T')[0];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArsTab, setSelectedArsTab] = useState<string>('TODAS');
  const [selectedDateRelation, setSelectedDateRelation] = useState<string>('ALL');
  const [selectedAuditorTab, setSelectedAuditorTab] = useState<string>('TODOS');
  const [biopsiaSubView, setBiopsiaSubView] = useState<'ACTIVAS' | 'COMPLETADAS'>('ACTIVAS');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assignAuditorName, setAssignAuditorName] = useState<string>('Dr. Marcos Tejada');

  // Quick Add Inline State
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickPaciente, setQuickPaciente] = useState('');
  const [quickNap, setQuickNap] = useState('');
  const [quickArs, setQuickArs] = useState('SENASA');
  const [quickCobertura, setQuickCobertura] = useState('');
  const [quickGlosado, setQuickGlosado] = useState('0');
  const [quickNota, setQuickNota] = useState('');
  const [quickFechaCierre, setQuickFechaCierre] = useState(todayIso);
  const [quickFechaEntrega, setQuickFechaEntrega] = useState(todayIso);
  const [quickMedico, setQuickMedico] = useState('');
  const [quickBiopsiaDesc, setQuickBiopsiaDesc] = useState('');
  const [quickEnviadas, setQuickEnviadas] = useState(1);

  // Mapa de días de vigencia por ARS (ej. SENASA: 60, HUMANO: 90)
  const arsConfigMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of arsConfigs) {
      map[c.ars_name.toUpperCase()] = c.dias_vigencia;
    }
    return map;
  }, [arsConfigs]);

  // Lista de pestañas ARS tipo Excel
  const arsTabsList = useMemo(() => {
    const fromConfig = arsConfigs.map(c => c.ars_name);
    const combined = Array.from(new Set([...COMMON_ARS_LIST, ...fromConfig]));
    return combined;
  }, [arsConfigs]);

  // Determinar si en la etapa actual corresponde mostrar la barra de pestañas por ARS tipo Excel:
  // REGLA DEL USUARIO: Solo en el área de Administrativos al entregar a ARS o Facturación y cuando Facturación recibe al final.
  // En la emisión inicial de Facturación a Auditoría o Cotejo no es necesario dividir por ARS.
  const showExcelArsTabs = useMemo(() => {
    if (
      selectedStage === 'ENTREGA_ARS' ||
      selectedStage === 'FACTURACION' ||
      selectedStage === 'ENTREGA_ARS_EMERGENCIA' ||
      selectedStage === 'FACTURACION_EMERGENCIA'
    ) {
      return true;
    }
    // Si el rol es Facturación y está viendo su bandeja final
    if (activeUser.role === 'FACTURACION' && selectedStage === 'ALL') {
      return true;
    }
    return false;
  }, [selectedStage, activeUser.role]);

  const isBiopsiasStage = selectedStage === 'BIOPSIAS';
  const isAuditoriaStage =
    selectedStage === 'AUDITORIA' ||
    selectedStage === 'RECEPCION_AUDITORES' ||
    activeUser.role === 'AUDITOR_MEDICO' ||
    activeUser.role === 'AUDITOR';

  // Lista de Auditores Médicos para las pestañas tipo Excel de Auditoría Interna
  const auditorTabs = useMemo(() => {
    const fromUsers = users
      .filter(u => u.role === 'AUDITOR_MEDICO' || u.role === 'AUDITOR')
      .map(u => u.name);
    const fromRecords = records
      .map(r => r.auditorAsignadoNombre)
      .filter((n): n is string => Boolean(n));
    return Array.from(new Set(['Dr. Marcos Tejada', 'Dra. Elena Valerio', ...fromUsers, ...fromRecords]));
  }, [users, records]);

  // Permisos RBAC
  const isSuperOrAdmin =
    activeUser.role === 'ADMIN_ROOT' ||
    activeUser.role === 'ADMIN' ||
    activeUser.role === 'ADMINISTRATIVO' ||
    activeUser.permissions?.canViewAllStages;

  const allowedStageIds = useMemo(() => {
    if (isSuperOrAdmin) return null;
    return new Set(getAllowedStagesForUser(activeUser, type).map(s => s.id));
  }, [activeUser, type, isSuperOrAdmin]);

  // Registros base por tipo y etapa (o archivo de biopsias completadas)
  const stageFilteredRecords = useMemo(() => {
    return records.filter(r => {
      if (r.type !== type) return false;
      if (allowedStageIds && !allowedStageIds.has(r.currentStage)) return false;

      // En vista de Biopsias:
      if (isBiopsiasStage) {
        if (biopsiaSubView === 'COMPLETADAS') {
          return Boolean(r.biopsiaCompletada);
        }
        return r.currentStage === 'BIOPSIAS' && !r.biopsiaCompletada;
      }

      if (selectedStage !== 'ALL' && r.currentStage !== selectedStage) return false;
      return true;
    });
  }, [records, type, allowedStageIds, isBiopsiasStage, biopsiaSubView, selectedStage]);

  // Relaciones Diarias por Fecha de Entrega disponibles en la vista actual (en línea, sin cajas externas)
  const availableDeliveryDates = useMemo(() => {
    const datesMap = new Map<string, { count: number; entregadoPor: string; recibidoPor: string }>();
    for (const r of stageFilteredRecords) {
      const d = r.fechaEntrega || r.fechaCierre || todayIso;
      const existing = datesMap.get(d);
      const entPor =
        r.entregadoFacturacionPor ||
        r.entregadoArsPor ||
        r.conciliadoPor ||
        r.createdBy ||
        'Roberto Santos (Facturación)';
      const recPor =
        r.facturacionConfirmadaPor ||
        r.recibidoArsPor ||
        r.auditorAsignadoNombre ||
        r.conciliadoPor ||
        'Lic. Ana Patricia Martínez (Auditoría)';
      if (existing) {
        existing.count += 1;
      } else {
        datesMap.set(d, { count: 1, entregadoPor: entPor, recibidoPor: recPor });
      }
    }
    return Array.from(datesMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, info]) => ({ date, ...info }));
  }, [stageFilteredRecords, todayIso]);

  // Conteo por ARS para las pestañas tipo Excel
  const arsCounts = useMemo(() => {
    const counts: Record<string, number> = { TODAS: 0 };
    for (const r of stageFilteredRecords) {
      if (selectedDateRelation !== 'ALL' && (r.fechaEntrega || r.fechaCierre) !== selectedDateRelation) {
        continue;
      }
      counts.TODAS = (counts.TODAS || 0) + 1;
      const norm = normalizeArsName(r.ars);
      counts[norm] = (counts[norm] || 0) + 1;
    }
    return counts;
  }, [stageFilteredRecords, selectedDateRelation]);

  // Filtrado final combinando Fecha de Relación, Pestaña ARS (si aplica), Pestaña Auditor y Búsqueda
  const filteredRecords = useMemo(() => {
    return stageFilteredRecords.filter(r => {
      if (selectedDateRelation !== 'ALL' && (r.fechaEntrega || r.fechaCierre) !== selectedDateRelation) {
        return false;
      }
      if (showExcelArsTabs && selectedArsTab !== 'TODAS') {
        if (normalizeArsName(r.ars) !== selectedArsTab) return false;
      }
      if (isAuditoriaStage && selectedAuditorTab !== 'TODOS') {
        if ((r.auditorAsignadoNombre || '') !== selectedAuditorTab) return false;
      }
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchName = r.nombrePaciente.toLowerCase().includes(q);
        const matchNap = r.nap.toLowerCase().includes(q);
        const matchArs = r.ars.toLowerCase().includes(q);
        const matchNota = (r.nota || '').toLowerCase().includes(q);
        const matchMedico = (r.medicoTratante || '').toLowerCase().includes(q);
        const matchBio = (r.descripcionBiopsia || '').toLowerCase().includes(q);
        return matchName || matchNap || matchArs || matchNota || matchMedico || matchBio;
      }
      return true;
    });
  }, [
    stageFilteredRecords,
    selectedDateRelation,
    showExcelArsTabs,
    selectedArsTab,
    isAuditoriaStage,
    selectedAuditorTab,
    searchTerm
  ]);

  // Separación de Biopsias Activas en las 2 secciones de la imagen:
  // 1. Enviadas 1 vez (Nuevas del día)
  // 2. Biopsias Pendientes (2 o más veces enviadas, van al final)
  const biopsiasNuevas1Vez = useMemo(
    () => filteredRecords.filter(r => (r.vecesEnviadaBiopsia || 1) === 1),
    [filteredRecords]
  );
  const biopsiasPendientes2Mas = useMemo(
    () => filteredRecords.filter(r => (r.vecesEnviadaBiopsia || 1) >= 2),
    [filteredRecords]
  );

  // Totales financieros
  const totals = useMemo(() => {
    return filteredRecords.reduce(
      (acc, r) => {
        acc.cobertura += r.cobertura || 0;
        acc.glosado += r.montoGlosado || 0;
        acc.aPagar += r.aPagar || 0;
        return acc;
      },
      { cobertura: 0, glosado: 0, aPagar: 0 }
    );
  }, [filteredRecords]);

  // Trazabilidad de quién entrega y quién recibe en la relación actual
  const currentCustodyInfo = useMemo(() => {
    const sample = filteredRecords[0];
    if (selectedStage === 'RECEPCION' || selectedStage === 'RECEPCION_EMERGENCIA') {
      return {
        entregadoPor: sample?.createdBy || 'Roberto Santos (Facturación)',
        recibidoPor: sample?.conciliadoPor || 'Lic. Ana Patricia Martínez (Administrativo de Auditoría)'
      };
    }
    if (selectedStage === 'CONCILIACION_ADMIN' || selectedStage === 'RECEPCION_ADMIN_EMERGENCIA') {
      return {
        entregadoPor: sample?.createdBy || 'Roberto Santos (Facturación)',
        recibidoPor: sample?.conciliadoPor || `${activeUser.name} (Administrativo)`
      };
    }
    if (selectedStage === 'AUDITORIA') {
      return {
        entregadoPor: sample?.conciliadoPor || 'Lic. Ana Patricia Martínez (Administrativo)',
        recibidoPor:
          selectedAuditorTab !== 'TODOS'
            ? `${selectedAuditorTab} (Auditor Médico)`
            : sample?.auditorAsignadoNombre || 'Auditores Médicos Internos'
      };
    }
    if (selectedStage === 'RECEPCION_AUDITORES') {
      return {
        entregadoPor: sample?.auditorAsignadoNombre || 'Dra. Elena Valerio / Dr. Marcos Tejada (Auditoría)',
        recibidoPor: sample?.recepcionAuditoresPor || 'Lic. Ana Patricia Martínez (Administrativo)'
      };
    }
    if (selectedStage === 'BIOPSIAS') {
      return {
        entregadoPor: sample?.createdBy || 'Lic. Ana Patricia Martínez (Administrativo)',
        recibidoPor: 'Departamento de Patología / Histopatología'
      };
    }
    if (selectedStage === 'ENTREGA_ARS' || selectedStage === 'ENTREGA_ARS_EMERGENCIA') {
      return {
        entregadoPor: sample?.entregadoArsPor || 'Lic. Ana Patricia Martínez (Administrativo)',
        recibidoPor:
          selectedArsTab !== 'TODAS'
            ? `Aseguradora ARS ${selectedArsTab}`
            : sample?.recibidoArsPor || 'Aseguradoras ARS Correspondientes'
      };
    }
    if (selectedStage === 'FACTURACION' || selectedStage === 'FACTURACION_EMERGENCIA') {
      return {
        entregadoPor: sample?.entregadoFacturacionPor || 'Lic. Ana Patricia Martínez (Administrativo)',
        recibidoPor: sample?.facturacionConfirmadaPor || 'Roberto Santos (Facturación Final)'
      };
    }
    return {
      entregadoPor: sample?.createdBy || activeUser.name,
      recibidoPor: sample?.updatedBy || 'Departamento Receptor'
    };
  }, [filteredRecords, selectedStage, selectedAuditorTab, selectedArsTab, activeUser.name]);

  const stageConfig = selectedStage !== 'ALL' ? getStageConfig(selectedStage) : null;
  const currentSheetTitle = stageConfig
    ? stageConfig.officialDocTitle
    : type === 'EXPEDIENTE'
    ? 'RELACION GENERAL DE EXPEDIENTES CLINICOS'
    : 'RELACION GENERAL DE ATENCIONES DE EMERGENCIA';

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map(r => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPaciente.trim() || !quickNap.trim()) return;

    const cob = parseFloat(quickCobertura) || 0;
    const glo = parseFloat(quickGlosado) || 0;
    const targetStage =
      selectedStage !== 'ALL'
        ? selectedStage
        : type === 'EXPEDIENTE'
        ? 'RECEPCION'
        : 'RECEPCION_EMERGENCIA';

    onQuickAdd({
      type,
      nombrePaciente: quickPaciente.trim().toUpperCase(),
      nap: quickNap.trim(),
      ars: showExcelArsTabs && selectedArsTab !== 'TODAS' ? selectedArsTab : quickArs,
      fechaCierre: quickFechaCierre,
      fechaEntrega: selectedDateRelation !== 'ALL' ? selectedDateRelation : quickFechaEntrega,
      cobertura: cob,
      montoGlosado: glo,
      aPagar: Math.max(0, cob - glo),
      nota: quickNota.trim() || '',
      currentStage: targetStage,
      loteCodigo: `REL-${selectedDateRelation !== 'ALL' ? selectedDateRelation : quickFechaEntrega}`,
      auditorAsignadoNombre:
        isAuditoriaStage && selectedAuditorTab !== 'TODOS' ? selectedAuditorTab : assignAuditorName,
      tienePendienteBiopsia: targetStage === 'BIOPSIAS',
      medicoTratante: quickMedico.trim().toUpperCase() || undefined,
      vecesEnviadaBiopsia: quickEnviadas || 1,
      descripcionBiopsia: quickBiopsiaDesc.trim().toUpperCase() || undefined
    });

    setQuickPaciente('');
    setQuickNap('');
    setQuickCobertura('');
    setQuickGlosado('0');
    setQuickNota('');
    setQuickMedico('');
    setQuickBiopsiaDesc('');
    setQuickEnviadas(1);
  };

  // Renderizador de barra de pestañas ARS estilo Excel (Arriba y Abajo)
  const renderExcelArsTabBar = (position: 'top' | 'bottom') => {
    if (!showExcelArsTabs) return null;
    return (
      <div
        className={`bg-[#f3f2f1] ${
          position === 'top' ? 'border-b' : 'border-t'
        } border-slate-300 px-2 py-1 flex items-center gap-1 overflow-x-auto select-none`}
      >
        <div className="flex items-center gap-1 pr-2 text-slate-500 border-r border-slate-300 shrink-0">
          <ChevronLeft className="w-3.5 h-3.5" />
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[10px] font-extrabold uppercase px-1 text-slate-600">HOJAS ARS:</span>
        </div>

        <button
          type="button"
          onClick={() => setSelectedArsTab('TODAS')}
          className={`px-3 py-1 text-xs font-extrabold uppercase tracking-wide rounded-t-md border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            selectedArsTab === 'TODAS'
              ? 'bg-white text-emerald-800 border-slate-300 border-b-2 border-b-emerald-600 shadow-2xs'
              : 'bg-[#e1dfdd] text-slate-600 border-transparent hover:bg-slate-200'
          }`}
        >
          <span>TODAS</span>
          <span className="text-[10px] font-mono bg-slate-200 text-slate-800 px-1.5 rounded-full">
            {arsCounts.TODAS || 0}
          </span>
        </button>

        {arsTabsList.map(arsName => {
          const count = arsCounts[arsName] || 0;
          const isActive = selectedArsTab === arsName;
          return (
            <button
              key={arsName}
              type="button"
              onClick={() => setSelectedArsTab(arsName)}
              className={`px-3 py-1 text-xs font-extrabold uppercase tracking-wide rounded-t-md border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-emerald-800 border-slate-300 border-b-2 border-b-emerald-600 shadow-2xs'
                  : 'bg-[#e1dfdd] text-slate-700 border-transparent hover:bg-slate-200'
              }`}
            >
              <span>{arsName}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 rounded-full ${
                    isActive ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-800'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {onOpenArsConfig && (
          <button
            type="button"
            onClick={onOpenArsConfig}
            className="ml-1 px-2 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded cursor-pointer shrink-0 flex items-center gap-1"
            title="Añadir nueva pestaña ARS o configurar meses de vencimiento"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  // Renderizador de barra de pestañas de Auditores Médicos estilo Excel (como en la Imagen 5)
  const renderExcelAuditorTabBar = (position: 'top' | 'bottom') => {
    if (!isAuditoriaStage) return null;
    return (
      <div
        className={`bg-[#f3f2f1] ${
          position === 'top' ? 'border-b' : 'border-t'
        } border-slate-300 px-2 py-1 flex items-center gap-1 overflow-x-auto select-none`}
      >
        <div className="flex items-center gap-1 pr-2 text-slate-500 border-r border-slate-300 shrink-0">
          <Stethoscope className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-[10px] font-extrabold uppercase px-1 text-slate-700">MEDICO AUDITOR:</span>
        </div>

        <button
          type="button"
          onClick={() => setSelectedAuditorTab('TODOS')}
          className={`px-3 py-1 text-xs font-extrabold uppercase tracking-wide rounded-t-md border transition-all cursor-pointer shrink-0 ${
            selectedAuditorTab === 'TODOS'
              ? 'bg-white text-amber-900 border-slate-300 border-b-2 border-b-amber-600 shadow-2xs'
              : 'bg-[#e1dfdd] text-slate-700 border-transparent hover:bg-slate-200'
          }`}
        >
          TODOS LOS AUDITORES ({stageFilteredRecords.length})
        </button>

        {auditorTabs.map(audName => {
          const count = stageFilteredRecords.filter(r => r.auditorAsignadoNombre === audName).length;
          const isActive = selectedAuditorTab === audName;
          return (
            <button
              key={audName}
              type="button"
              onClick={() => setSelectedAuditorTab(audName)}
              className={`px-3 py-1 text-xs font-extrabold uppercase tracking-wide rounded-t-md border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#00B050] text-black border-black font-black shadow-2xs'
                  : 'bg-[#e1dfdd] text-slate-700 border-transparent hover:bg-slate-200'
              }`}
            >
              <span>{audName}</span>
              <span
                className={`text-[10px] font-mono px-1.5 rounded-full ${
                  isActive ? 'bg-black text-white' : 'bg-slate-300 text-slate-800'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-5 max-w-[1650px] mx-auto">
      <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
        
        {/* 1. BARRA SUPERIOR DE RELACIONES DIARIAS DE ENTREGA (EN LÍNEA, SIN CAJAS EXTERNAS) */}
        <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-sky-400 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
              Relaciones por Día de Entrega:
            </span>

            <button
              type="button"
              onClick={() => setSelectedDateRelation('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedDateRelation === 'ALL'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todas las Fechas ({stageFilteredRecords.length})
            </button>

            {availableDeliveryDates.map(item => (
              <button
                key={item.date}
                type="button"
                onClick={() => setSelectedDateRelation(item.date)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  selectedDateRelation === item.date
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>Relación {formatDateToDMY(item.date)}</span>
                <span className="px-1.5 py-0.2 rounded bg-black/25 text-[10px] font-mono">
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          {/* Selector directo de fecha y botón de impresión oficial */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg text-xs overflow-hidden">
              <span className="px-2.5 py-1 text-[10px] font-bold text-slate-300 uppercase border-r border-slate-700">
                Filtrar Día:
              </span>
              <input
                type="date"
                value={selectedDateRelation === 'ALL' ? '' : selectedDateRelation}
                onChange={e => setSelectedDateRelation(e.target.value || 'ALL')}
                className="px-2 py-1 bg-slate-900 text-white font-mono text-xs outline-hidden"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                onOpenOfficialReport(
                  filteredRecords,
                  currentSheetTitle,
                  showExcelArsTabs ? selectedArsTab : 'TODAS',
                  selectedDateRelation !== 'ALL' ? selectedDateRelation : todayIso,
                  {
                    stage: selectedStage,
                    auditorName: selectedAuditorTab,
                    deliveredBy: currentCustodyInfo.entregadoPor,
                    receivedBy: currentCustodyInfo.recibidoPor
                  }
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Relación ({filteredRecords.length})</span>
            </button>
          </div>
        </div>

        {/* 2. TRAZABILIDAD EN LÍNEA: QUIÉN GENERA LA ENTREGA Y QUIÉN LA RECIBE */}
        <div className="bg-emerald-50/70 border-b border-emerald-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-emerald-950 uppercase tracking-wider text-[11px]">
                ENTREGADO / GENERADO POR:
              </span>
              <span className="px-2 py-0.5 bg-white border border-emerald-300 rounded font-bold text-slate-900">
                {currentCustodyInfo.entregadoPor}
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600 hidden sm:inline" />
            <div className="flex items-center gap-1.5">
              <span className="font-black text-emerald-950 uppercase tracking-wider text-[11px]">
                RECIBIDO POR:
              </span>
              <span className="px-2 py-0.5 bg-white border border-emerald-300 rounded font-bold text-slate-900">
                {currentCustodyInfo.recibidoPor}
              </span>
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-600 flex items-center gap-2">
            <span>
              Mostrando <strong>{filteredRecords.length}</strong> registros en lista compacta de 1 línea
            </span>
          </div>
        </div>

        {/* 3. BARRA DE PESTAÑAS EXCEL ARRIBA (ARS o AUDITORES según etapa) */}
        {renderExcelArsTabBar('top')}
        {renderExcelAuditorTabBar('top')}

        {/* 4. CONTROLES DE BÚSQUEDA Y FILA RÁPIDA */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar paciente, NAP/Autorización, médico, biopsia, nota..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-sky-500 outline-hidden font-medium"
            />
          </div>

          {/* Si estamos en BIOPSIAS: Selector entre Activas (1 envío + 2+ envíos) y Archivadas Completadas */}
          {isBiopsiasStage && (
            <div className="flex items-center gap-1 bg-purple-100 p-1 rounded-lg border border-purple-200">
              <button
                type="button"
                onClick={() => setBiopsiaSubView('ACTIVAS')}
                className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  biopsiaSubView === 'ACTIVAS'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-purple-900 hover:bg-purple-200'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Solicitud e Histopatología Activa</span>
              </button>
              <button
                type="button"
                onClick={() => setBiopsiaSubView('COMPLETADAS')}
                className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  biopsiaSubView === 'COMPLETADAS'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-purple-900 hover:bg-purple-200'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>
                  Archivo de Biopsias Completadas (
                  {records.filter(r => r.type === type && r.biopsiaCompletada).length})
                </span>
              </button>
            </div>
          )}

          {/* Selector de Auditor destino cuando Administrativo está en Cotejo para pasar a Auditores */}
          {(selectedStage === 'CONCILIACION_ADMIN' || selectedStage === 'RECEPCION') && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs">
              <Stethoscope className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-bold text-amber-900 text-[11px]">Asignar a Auditor:</span>
              <select
                value={assignAuditorName}
                onChange={e => setAssignAuditorName(e.target.value)}
                className="font-bold text-amber-950 bg-white border border-amber-300 rounded px-2 py-0.5 text-xs outline-hidden"
              >
                {auditorTabs.map(a => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                showQuickAdd
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>+ Fila Rápida (1 Línea)</span>
            </button>

            {canCreateRecord(activeUser) && (
              <button
                type="button"
                onClick={() => onOpenNewRecord(type)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Registro</span>
              </button>
            )}
          </div>
        </div>

        {/* BARRA DE ACCIONES MASIVAS */}
        {selectedIds.length > 0 && (
          <div className="bg-indigo-950 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-600 rounded font-mono font-bold">
                {selectedIds.length} seleccionados
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-indigo-300 hover:text-white underline text-[11px] cursor-pointer"
              >
                Desmarcar
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onBulkConciliate && (
                <button
                  type="button"
                  onClick={() => {
                    onBulkConciliate(selectedIds, assignAuditorName);
                    setSelectedIds([]);
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded flex items-center gap-1 cursor-pointer"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Tachar, Aceptar Llegada y Enviar a {assignAuditorName}</span>
                </button>
              )}

              {canChangeStage(activeUser, 'ENTREGA_ARS') && (
                <button
                  type="button"
                  onClick={() => {
                    onBulkAdvance(selectedIds, type === 'EXPEDIENTE' ? 'ENTREGA_ARS' : 'ENTREGA_ARS_EMERGENCIA');
                    setSelectedIds([]);
                  }}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Pasar Seleccionados a Entrega ARS</span>
                </button>
              )}

              {canChangeStage(activeUser, 'FACTURACION') && (
                <button
                  type="button"
                  onClick={() => {
                    onBulkAdvance(selectedIds, type === 'EXPEDIENTE' ? 'FACTURACION' : 'FACTURACION_EMERGENCIA');
                    setSelectedIds([]);
                  }}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Pasar Seleccionados a Entrega Facturación</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* FORMULARIO DE FILA RÁPIDA EN 1 LÍNEA */}
        {showQuickAdd && (
          <form
            onSubmit={handleQuickAddSubmit}
            className="bg-amber-50/90 border-b border-amber-200 p-2.5 flex flex-wrap items-center gap-2 text-xs"
          >
            <span className="font-black text-amber-900 uppercase text-[11px] px-1">
              Ingreso Rápido:
            </span>
            <input
              type="date"
              value={quickFechaCierre}
              onChange={e => setQuickFechaCierre(e.target.value)}
              className="px-2 py-1 bg-white border border-amber-300 rounded font-mono text-xs"
              title="Fecha de Cierre / Ingreso"
            />
            <input
              type="text"
              required
              placeholder="NOMBRE COMPLETO DEL PACIENTE"
              value={quickPaciente}
              onChange={e => setQuickPaciente(e.target.value)}
              className="flex-1 min-w-[200px] px-2.5 py-1 bg-white border border-amber-300 rounded font-bold uppercase text-xs"
            />
            <input
              type="text"
              required
              placeholder="NAP / AUTORIZACION"
              value={quickNap}
              onChange={e => setQuickNap(e.target.value)}
              className="w-32 px-2.5 py-1 bg-white border border-amber-300 rounded font-mono font-bold text-xs"
            />
            <select
              value={quickArs}
              onChange={e => setQuickArs(e.target.value)}
              className="px-2 py-1 bg-white border border-amber-300 rounded font-bold text-xs"
            >
              {arsTabsList.map(a => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            {isBiopsiasStage ? (
              <>
                <input
                  type="text"
                  placeholder="MEDICO TRATANTE"
                  value={quickMedico}
                  onChange={e => setQuickMedico(e.target.value)}
                  className="w-40 px-2 py-1 bg-white border border-amber-300 rounded font-bold uppercase text-xs"
                />
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={quickEnviadas}
                  onChange={e => setQuickEnviadas(parseInt(e.target.value, 10) || 1)}
                  className="w-16 px-2 py-1 bg-white border border-amber-300 rounded font-mono font-bold text-center text-xs"
                  title="Veces Enviadas (1 = Nueva, 2+ = Pendiente)"
                />
                <input
                  type="text"
                  placeholder="DESCRIPCION DE BIOPSIA"
                  value={quickBiopsiaDesc}
                  onChange={e => setQuickBiopsiaDesc(e.target.value)}
                  className="w-48 px-2 py-1 bg-white border border-amber-300 rounded font-bold uppercase text-xs"
                />
              </>
            ) : (
              <>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Cobertura RD$"
                  value={quickCobertura}
                  onChange={e => setQuickCobertura(e.target.value)}
                  className="w-28 px-2 py-1 bg-white border border-amber-300 rounded font-mono font-bold text-right text-xs"
                />
                <input
                  type="text"
                  placeholder="Observación breve..."
                  value={quickNota}
                  onChange={e => setQuickNota(e.target.value)}
                  className="w-44 px-2 py-1 bg-white border border-amber-300 rounded text-xs"
                />
              </>
            )}

            <button
              type="submit"
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded cursor-pointer"
            >
              + Guardar Fila
            </button>
          </form>
        )}

        {/* ================================================================= */}
        {/* VISTA ESPECIAL 1: BIOPSIAS E HISTOPATOLOGÍA (IMÁGENES 3 Y 4)       */}
        {/* ================================================================= */}
        {isBiopsiasStage ? (
          <div className="p-4 space-y-6">
            {biopsiaSubView === 'ACTIVAS' ? (
              <>
                {/* ENCABEZADO OFICIAL DE HISTOPATOLOGÍA */}
                <div className="border border-slate-400 rounded-lg overflow-hidden shadow-2xs">
                  <div className="bg-[#FDE9D9] border-b border-slate-400 py-2 px-4 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-black text-slate-900 text-sm tracking-wider uppercase">
                      SOLICITUD DE REPORTES DE HISTOPATOLOGIA (NUEVAS DEL DÍA - ENVIADAS 1 VEZ)
                    </span>
                    <div className="inline-flex items-center border border-black text-xs font-bold bg-white">
                      <span className="px-3 py-0.5 border-r border-black">FECHA SOLICITUD</span>
                      <span className="px-4 py-0.5 bg-[#FDE9D9] font-mono font-black">
                        {formatDateToDMY(selectedDateRelation !== 'ALL' ? selectedDateRelation : todayIso)}
                      </span>
                    </div>
                  </div>

                  {/* TABLA PARTE 1: ENVIADAS 1 VEZ */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-black uppercase text-[11px] whitespace-nowrap">
                          <th className="py-1.5 px-2.5 w-10 text-center border-r border-slate-300">#</th>
                          <th className="py-1.5 px-2.5 w-24 text-center border-r border-slate-300 underline">INGRESO</th>
                          <th className="py-1.5 px-2.5 border-r border-slate-300 underline">NOMBRE PACIENTE</th>
                          <th className="py-1.5 px-2.5 w-32 text-center border-r border-slate-300 underline">NAP (AUTORIZACION)</th>
                          <th className="py-1.5 px-2.5 w-24 text-center border-r border-slate-300 underline">ARS</th>
                          <th className="py-1.5 px-2.5 w-44 text-center border-r border-slate-300 underline">MEDICO</th>
                          <th className="py-1.5 px-2.5 w-20 text-center border-r border-slate-300 underline">ENVIADAS</th>
                          <th className="py-1.5 px-2.5 border-r border-slate-300 underline">BIOPSIA</th>
                          <th className="py-1.5 px-2.5 text-right">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {biopsiasNuevas1Vez.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-4 text-center text-slate-400 italic">
                              No hay solicitudes nuevas (enviadas 1 vez) para el filtro actual. Usa "+ Fila Rápida" arriba para agregar.
                            </td>
                          </tr>
                        ) : (
                          biopsiasNuevas1Vez.map((r, idx) => (
                            <tr key={r.id} className="hover:bg-slate-50 whitespace-nowrap">
                              <td className="py-1.5 px-2.5 text-center font-bold border-r border-slate-200">
                                {idx + 1}
                              </td>
                              <td className="py-1.5 px-2.5 text-center font-mono border-r border-slate-200">
                                {formatDateToDMY(r.fechaCierre)}
                              </td>
                              <td className="py-1.5 px-2.5 font-extrabold text-slate-900 uppercase border-r border-slate-200">
                                {r.nombrePaciente}
                              </td>
                              <td className="py-1.5 px-2.5 text-center font-mono font-bold text-slate-700 border-r border-slate-200">
                                {r.nap}
                              </td>
                              <td className="py-1.5 px-2.5 text-center font-bold text-slate-800 border-r border-slate-200">
                                {normalizeArsName(r.ars)}
                              </td>
                              <td className="py-1.5 px-2.5 text-center font-bold text-slate-800 uppercase border-r border-slate-200">
                                {r.medicoTratante || 'SIN ASIGNAR'}
                              </td>
                              <td className="py-1.5 px-2.5 text-center font-mono font-black text-sky-700 border-r border-slate-200">
                                {r.vecesEnviadaBiopsia || 1}
                              </td>
                              <td className="py-1.5 px-2.5 font-bold text-slate-900 uppercase border-r border-slate-200">
                                {r.descripcionBiopsia || r.nota || '-'}
                              </td>
                              <td className="py-1.5 px-2.5 text-right">
                                <div className="inline-flex items-center gap-1">
                                  {onIncrementBiopsiaSend && (
                                    <button
                                      type="button"
                                      onClick={() => onIncrementBiopsiaSend(r)}
                                      className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                      title="Marcar un nuevo envío (pasa a Biopsias Pendientes 2+ veces)"
                                    >
                                      <Repeat className="w-3 h-3" />
                                      <span>+1 Envío</span>
                                    </button>
                                  )}
                                  {onCompleteBiopsia && (
                                    <button
                                      type="button"
                                      onClick={() => onCompleteBiopsia(r)}
                                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                      title="Archivar como completada y pasar a Entrega ARS"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Completar → ARS</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onEditRecord(r)}
                                    className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TABLA PARTE 2 (AL FINAL): BIOPSIAS PENDIENTES (2 O MÁS VECES ENVIADAS - BARRA ROJA) */}
                <div className="border border-red-800 rounded-lg overflow-hidden shadow-2xs">
                  <div className="bg-[#C00000] text-white py-1.5 px-4 font-black text-xs tracking-wider uppercase underline">
                    BIOPSIAS PENDIENTES (ENVIADAS 2, 3 O MÁS VECES - SEGUIMIENTO ACUMULADO AL FINAL)
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-black uppercase text-[11px] whitespace-nowrap">
                          <th className="py-1.5 px-2.5 w-10 text-center border-r border-slate-300">#</th>
                          <th className="py-1.5 px-2.5 w-24 text-center border-r border-slate-300 underline">INGRESO</th>
                          <th className="py-1.5 px-2.5 border-r border-slate-300 underline">NOMBRE PACIENTE</th>
                          <th className="py-1.5 px-2.5 w-32 text-center border-r border-slate-300 underline">NAP (AUTORIZACION)</th>
                          <th className="py-1.5 px-2.5 w-24 text-center border-r border-slate-300 underline">ARS</th>
                          <th className="py-1.5 px-2.5 w-44 text-center border-r border-slate-300 underline">MEDICO</th>
                          <th className="py-1.5 px-2.5 w-20 text-center border-r border-slate-300 underline">ENVIADAS</th>
                          <th className="py-1.5 px-2.5 border-r border-slate-300 underline">BIOPSIA</th>
                          <th className="py-1.5 px-2.5 text-right">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {biopsiasPendientes2Mas.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-4 text-center text-slate-400 italic">
                              No hay biopsias recurrentes (2 o más envíos) pendientes en este momento.
                            </td>
                          </tr>
                        ) : (
                          biopsiasPendientes2Mas.map((r, idx) => (
                            <tr key={r.id} className="hover:bg-amber-50/40 whitespace-nowrap">
                              <td className="py-1.5 px-2.5 text-center font-bold border-r border-slate-200">
                                {idx + 1}
                              </td>
                              <td className="py-1.5 px-2.5 text-center font-mono border-r border-slate-200">
                                {formatDateToDMY(r.fechaCierre)}
                              </td>
                              <td className="py-1.5 px-2.5 font-extrabold text-amber-700 uppercase border-r border-slate-200">
                                {r.nombrePaciente}
                              </td>
                              <td className="py-1.5 px-2.5 text-center font-mono font-bold text-slate-700 border-r border-slate-200">
                                {r.nap}
                              </td>
                              <td className="py-1.5 px-2.5 text-center font-bold text-slate-800 border-r border-slate-200">
                                {normalizeArsName(r.ars)}
                              </td>
                              <td className="py-1.5 px-2.5 text-center font-bold text-slate-800 uppercase border-r border-slate-200">
                                {r.medicoTratante || 'SIN ASIGNAR'}
                              </td>
                              <td className="py-1.5 px-2.5 text-center font-mono font-black text-red-700 bg-red-50 border-r border-slate-200">
                                {r.vecesEnviadaBiopsia}
                              </td>
                              <td className="py-1.5 px-2.5 font-bold text-slate-900 uppercase border-r border-slate-200">
                                {r.descripcionBiopsia || r.nota || '-'}
                              </td>
                              <td className="py-1.5 px-2.5 text-right">
                                <div className="inline-flex items-center gap-1">
                                  {onIncrementBiopsiaSend && (
                                    <button
                                      type="button"
                                      onClick={() => onIncrementBiopsiaSend(r)}
                                      className="px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-900 border border-red-300 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                      title="Aumentar contador de envíos (+1)"
                                    >
                                      <Repeat className="w-3 h-3" />
                                      <span>+1 Envío ({ (r.vecesEnviadaBiopsia || 2) + 1 })</span>
                                    </button>
                                  )}
                                  {onCompleteBiopsia && (
                                    <button
                                      type="button"
                                      onClick={() => onCompleteBiopsia(r)}
                                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                      title="Culminar proceso de biopsia, archivar y enviar a Entrega ARS"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Completar → ARS</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onEditRecord(r)}
                                    className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              /* SECCIÓN 3: ARCHIVO DE BIOPSIAS COMPLETADAS / CULMINADAS */
              <div className="border border-emerald-600 rounded-lg overflow-hidden shadow-2xs">
                <div className="bg-emerald-800 text-white py-2 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                    <Archive className="w-4 h-4 text-emerald-300" />
                    <span>ARCHIVO HISTÓRICO DE BIOPSIAS COMPLETADAS (LISTAS / ENTREGADAS A ARS)</span>
                  </div>
                  <span className="text-xs font-mono bg-emerald-950 px-2.5 py-0.5 rounded">
                    {filteredRecords.length} completadas
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-emerald-50 border-b border-emerald-200 text-emerald-950 font-black uppercase text-[11px] whitespace-nowrap">
                        <th className="py-1.5 px-2.5 w-10 text-center border-r border-emerald-200">#</th>
                        <th className="py-1.5 px-2.5 w-24 text-center border-r border-emerald-200">INGRESO</th>
                        <th className="py-1.5 px-2.5 border-r border-emerald-200">NOMBRE PACIENTE</th>
                        <th className="py-1.5 px-2.5 w-28 text-center border-r border-emerald-200">NAP / AUT.</th>
                        <th className="py-1.5 px-2.5 w-24 text-center border-r border-emerald-200">ARS</th>
                        <th className="py-1.5 px-2.5 border-r border-emerald-200">MEDICO</th>
                        <th className="py-1.5 px-2.5 w-20 text-center border-r border-emerald-200">ENVIOS</th>
                        <th className="py-1.5 px-2.5 border-r border-emerald-200">BIOPSIA</th>
                        <th className="py-1.5 px-2.5 border-r border-emerald-200">CULMINADO POR / FECHA</th>
                        <th className="py-1.5 px-2.5 text-center">ETAPA ACTUAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-6 text-center text-slate-400 italic">
                            Aún no hay biopsias archivadas como completadas.
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((r, idx) => (
                          <tr key={r.id} className="hover:bg-emerald-50/30 whitespace-nowrap">
                            <td className="py-1.5 px-2.5 text-center font-bold border-r border-slate-200">{idx + 1}</td>
                            <td className="py-1.5 px-2.5 text-center font-mono border-r border-slate-200">{formatDateToDMY(r.fechaCierre)}</td>
                            <td className="py-1.5 px-2.5 font-extrabold text-slate-900 uppercase border-r border-slate-200">{r.nombrePaciente}</td>
                            <td className="py-1.5 px-2.5 text-center font-mono font-bold border-r border-slate-200">{r.nap}</td>
                            <td className="py-1.5 px-2.5 text-center font-bold border-r border-slate-200">{normalizeArsName(r.ars)}</td>
                            <td className="py-1.5 px-2.5 font-bold uppercase border-r border-slate-200">{r.medicoTratante || '-'}</td>
                            <td className="py-1.5 px-2.5 text-center font-mono font-bold border-r border-slate-200">{r.vecesEnviadaBiopsia || 1}</td>
                            <td className="py-1.5 px-2.5 font-bold uppercase border-r border-slate-200">{r.descripcionBiopsia || r.nota}</td>
                            <td className="py-1.5 px-2.5 text-[11px] font-semibold text-emerald-800 border-r border-slate-200">
                              ✓ {r.biopsiaCompletadaPor || 'Administrativo'} ({r.biopsiaCompletadaEn || '-'})
                            </td>
                            <td className="py-1.5 px-2.5 text-center">
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                                {getStageConfig(r.currentStage)?.shortLabel || r.currentStage}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================================================================= */
          /* VISTA COMPACTA DE 1 LÍNEA (AUDITORÍA INTERNA / ARS / FACTURACIÓN) */
          /* ================================================================= */
          <div>
            {/* Cabecera Amarilla/Verde estilo Excel cuando estamos en Auditoría Interna (Imagen 5) */}
            {isAuditoriaStage && (
              <div className="bg-slate-100 border-b border-slate-300 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
                <div className="border border-black shadow-2xs min-w-[320px]">
                  <div className="bg-[#FFC000] text-black font-black text-xs text-center py-0.5 px-3 border-b border-black uppercase">
                    ENTREGA DE EXPEDIENTES A AUDITORIA INTERNA
                  </div>
                  <div className="bg-white text-black font-black text-[11px] text-center py-0.5 px-3 border-b border-black uppercase underline">
                    MEDICO AUDITOR
                  </div>
                  <div className="bg-[#00B050] text-black font-black text-xs text-center py-1 px-3 uppercase">
                    {selectedAuditorTab === 'TODOS' ? 'TODOS LOS AUDITORES MEDICOS' : selectedAuditorTab}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center border border-black text-xs font-bold bg-white">
                    <span className="px-3 py-1 border-r border-black uppercase">FECHA ENTREGA</span>
                    <span className="px-4 py-1 bg-[#FFC000] font-mono font-black text-black">
                      {formatDateToDMY(selectedDateRelation !== 'ALL' ? selectedDateRelation : todayIso)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TABLA PRINCIPAL ULTRA COMPACTA DE 1 SOLA LÍNEA POR REGISTRO */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    className={`${
                      isAuditoriaStage
                        ? 'bg-[#00B0F0] text-black border-b border-black'
                        : 'bg-slate-200 text-slate-900 border-b border-slate-300'
                    } font-black uppercase text-[11px] whitespace-nowrap select-none`}
                  >
                    <th className="py-1.5 px-2 w-8 text-center border-r border-slate-300">
                      <button type="button" onClick={toggleSelectAll} className="cursor-pointer flex items-center justify-center mx-auto">
                        {selectedIds.length === filteredRecords.length && filteredRecords.length > 0 ? (
                          <CheckSquare className="w-3.5 h-3.5 text-sky-700" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </button>
                    </th>
                    <th className="py-1.5 px-2 w-9 text-center border-r border-slate-300 underline">#</th>
                    <th className="py-1.5 px-2.5 w-24 text-center border-r border-slate-300 underline">
                      FECHA CIERRE
                    </th>
                    <th className="py-1.5 px-2.5 border-r border-slate-300 underline">
                      NOMBRE PACIENTE
                    </th>
                    <th className="py-1.5 px-2.5 w-28 text-center border-r border-slate-300 underline">
                      AUTORIZACION (NAP)
                    </th>
                    <th className="py-1.5 px-2.5 w-24 text-center border-r border-slate-300 underline">
                      ARS
                    </th>
                    <th className="py-1.5 px-2.5 w-28 text-right border-r border-slate-300 underline">
                      COBERTURA
                    </th>
                    {!isAuditoriaStage && (
                      <>
                        <th className="py-1.5 px-2.5 w-24 text-right border-r border-slate-300 text-red-700 underline">
                          GLOSADO
                        </th>
                        <th className="py-1.5 px-2.5 w-28 text-right border-r border-slate-300 text-sky-800 underline">
                          A PAGAR
                        </th>
                      </>
                    )}
                    <th className="py-1.5 px-2.5 border-r border-slate-300 underline">
                      OBSERVACION
                    </th>
                    {/* Columnas de Control de Vencimiento (2 a 3 meses por ARS) visibles para Auditores y Administrativos */}
                    <th className="py-1.5 px-2.5 w-28 text-center border-r border-slate-300 underline" title="Fecha tentativa de vencimiento según plazo configurado para la ARS">
                      FECHA VENCIMIENTO
                    </th>
                    <th className="py-1.5 px-2 w-24 text-center border-r border-slate-300 bg-white text-black underline">
                      DIAS RESTANTES
                    </th>
                    <th className="py-1.5 px-2.5 w-28 text-center border-r border-slate-300 bg-white text-black underline">
                      ESTADO
                    </th>
                    <th className="py-1.5 px-2.5 w-36 border-r border-slate-300 underline">
                      AUDITOR / CUSTODIA
                    </th>
                    <th className="py-1.5 px-2.5 text-right underline">
                      ACCIONES DEL ROL
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="py-8 text-center text-slate-400 italic">
                        No hay registros en esta relación o pestaña.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r, index) => {
                      const isSelected = selectedIds.includes(r.id);
                      const isDeliveredByAuditor =
                        Boolean(r.auditoriaProcesada) ||
                        r.currentStage === 'RECEPCION_AUDITORES' ||
                        r.currentStage === 'ENTREGA_ARS' ||
                        r.currentStage === 'FACTURACION' ||
                        r.currentStage === 'ENTREGA_ARS_EMERGENCIA' ||
                        r.currentStage === 'FACTURACION_EMERGENCIA';

                      const sla = calculateRecordSla(
                        r.fechaCierre,
                        r.ars,
                        isDeliveredByAuditor,
                        arsConfigMap
                      );

                      return (
                        <tr
                          key={r.id}
                          className={`whitespace-nowrap transition-colors ${
                            isSelected ? 'bg-sky-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-1 px-2 text-center border-r border-slate-200">
                            <button
                              type="button"
                              onClick={() => toggleSelectOne(r.id)}
                              className="cursor-pointer flex items-center justify-center mx-auto"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-3.5 h-3.5 text-sky-600" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </td>

                          {/* # */}
                          <td className="py-1 px-2 text-center font-mono font-bold text-slate-700 border-r border-slate-200">
                            {index + 1}
                          </td>

                          {/* FECHA CIERRE */}
                          <td className="py-1 px-2.5 text-center font-mono text-slate-800 border-r border-slate-200">
                            {formatDateToDMY(r.fechaCierre)}
                          </td>

                          {/* NOMBRE PACIENTE (ESTRICTAMENTE 1 SOLA LÍNEA COMPACTA) */}
                          <td className="py-1 px-2.5 font-extrabold text-slate-900 uppercase border-r border-slate-200">
                            {r.nombrePaciente}
                          </td>

                          {/* AUTORIZACION (NAP) */}
                          <td className="py-1 px-2.5 text-center font-mono font-bold text-slate-800 border-r border-slate-200">
                            {r.nap}
                          </td>

                          {/* ARS */}
                          <td className="py-1 px-2.5 text-center font-bold text-slate-800 border-r border-slate-200">
                            {normalizeArsName(r.ars)}
                          </td>

                          {/* COBERTURA */}
                          <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                            {formatCurrency(r.cobertura)}
                          </td>

                          {!isAuditoriaStage && (
                            <>
                              {/* GLOSADO */}
                              <td className="py-1 px-2.5 text-right font-mono font-bold text-rose-600 border-r border-slate-200">
                                {r.montoGlosado > 0 ? formatCurrency(r.montoGlosado) : 'RD$ 0.00'}
                              </td>

                              {/* A PAGAR */}
                              <td className="py-1 px-2.5 text-right font-mono font-extrabold text-sky-700 border-r border-slate-200">
                                {formatCurrency(r.aPagar)}
                              </td>
                            </>
                          )}

                          {/* OBSERVACION (1 sola línea truncada con tooltip completo) */}
                          <td
                            className="py-1 px-2.5 text-slate-700 border-r border-slate-200 max-w-[200px] truncate"
                            title={r.nota || r.reporteAuditoria || ''}
                          >
                            {r.nota || r.reporteAuditoria || '-'}
                          </td>

                          {/* FECHA VENCIMIENTO */}
                          <td
                            className="py-1 px-2.5 text-center font-mono font-bold text-slate-900 border-r border-slate-200"
                            title={`Plazo ARS ${normalizeArsName(r.ars)}: ${sla.diasVigencia} días`}
                          >
                            {sla.fechaVencimientoDMY}
                          </td>

                          {/* DIAS RESTANTES */}
                          <td
                            className={`py-1 px-2 text-center font-mono font-black border-r border-slate-200 ${
                              sla.estado === 'VENCIDO'
                                ? 'text-red-700 bg-red-50'
                                : sla.estado === 'PROXIMO_A_VENCER'
                                ? 'text-amber-800 bg-amber-50'
                                : 'text-slate-800'
                            }`}
                          >
                            {sla.diasRestantes}
                          </td>

                          {/* ESTADO (Vigente / Próximo a Vencer / Vencido / Entregado) */}
                          <td className={`py-1 px-2.5 text-center text-[11px] border-r border-slate-200 ${sla.cellClass}`}>
                            {sla.estadoLabel}
                          </td>

                          {/* AUDITOR / CUSTODIA */}
                          <td className="py-1 px-2.5 text-[11px] font-semibold text-slate-700 border-r border-slate-200">
                            {r.auditorAsignadoNombre ? (
                              <span className="text-amber-900 font-bold">{r.auditorAsignadoNombre}</span>
                            ) : r.conciliadoPor ? (
                              <span className="text-blue-800">✓ {r.conciliadoPor}</span>
                            ) : (
                              <span className="text-slate-500">{r.createdBy || 'Facturación'}</span>
                            )}
                          </td>

                          {/* ACCIONES COMPACTAS EN 1 LÍNEA */}
                          <td className="py-1 px-2 text-right">
                            <div className="inline-flex items-center justify-end gap-1">
                              {/* 1. Administrativo en Emisión/Cotejo: Tachar, aceptar y enviar a Auditor */}
                              {(r.currentStage === 'RECEPCION' ||
                                r.currentStage === 'CONCILIACION_ADMIN' ||
                                r.currentStage === 'RECEPCION_EMERGENCIA' ||
                                r.currentStage === 'RECEPCION_ADMIN_EMERGENCIA') &&
                                onConciliateRecord &&
                                (activeUser.role === 'ADMINISTRATIVO' || activeUser.role === 'ADMIN_ROOT') && (
                                  <button
                                    type="button"
                                    onClick={() => onConciliateRecord(r, assignAuditorName)}
                                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                    title={`Tachar llegada y asignar a ${assignAuditorName}`}
                                  >
                                    <ClipboardCheck className="w-3 h-3" />
                                    <span>Tachar → Auditor</span>
                                  </button>
                                )}

                              {/* 2. Auditor Médico en Auditoría: Auditar y Emitir Reporte (Tachar como Entregado) */}
                              {r.currentStage === 'AUDITORIA' && onOpenAuditModal && (
                                <button
                                  type="button"
                                  onClick={() => onOpenAuditModal(r)}
                                  className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                  title="Confirmar recepción, auditar glosa y emitir reporte de entrega"
                                >
                                  <Stethoscope className="w-3 h-3" />
                                  <span>{r.auditoriaProcesada ? 'Entregado' : 'Auditar / Entregar'}</span>
                                </button>
                              )}

                              {/* 3. Administrativo en Recepción de Auditores: Pasar a ARS o Biopsias */}
                              {r.currentStage === 'RECEPCION_AUDITORES' && (
                                <>
                                  {onRouteToArs && (
                                    <button
                                      type="button"
                                      onClick={() => onRouteToArs(r)}
                                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                      title="Completo: Pasar a Relación de Entrega a ARS"
                                    >
                                      <Send className="w-3 h-3" />
                                      <span>A ARS</span>
                                    </button>
                                  )}
                                  {onRouteToBiopsias && (
                                    <button
                                      type="button"
                                      onClick={() => onRouteToBiopsias(r)}
                                      className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                      title="Tiene pendiente: Enviar a Solicitud de Biopsias"
                                    >
                                      <FlaskConical className="w-3 h-3" />
                                      <span>Biopsia</span>
                                    </button>
                                  )}
                                </>
                              )}

                              {/* 4. En Entrega ARS: Pasar a Entrega Final Facturación */}
                              {(r.currentStage === 'ENTREGA_ARS' || r.currentStage === 'ENTREGA_ARS_EMERGENCIA') && (
                                <button
                                  type="button"
                                  onClick={() => onAdvanceStage(r)}
                                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                  title="Enviar a Entrega Final de Facturación"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                  <span>A Facturación</span>
                                </button>
                              )}

                              {/* 5. En Facturación Final: Confirmar Recepción */}
                              {(r.currentStage === 'FACTURACION' || r.currentStage === 'FACTURACION_EMERGENCIA') &&
                                onConfirmBillingDelivery &&
                                !r.facturacionConfirmada && (
                                  <button
                                    type="button"
                                    onClick={() => onConfirmBillingDelivery(r)}
                                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Recibir</span>
                                  </button>
                                )}

                              <button
                                type="button"
                                onClick={() => onOpenNotes(r)}
                                className="p-1 text-slate-400 hover:text-sky-600 cursor-pointer"
                                title="Historial y Notas de Custodia"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onEditRecord(r)}
                                className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"
                                title="Editar fila"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {canDeleteRecord(activeUser) && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteRecord(r.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                  title="Eliminar registro"
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
                {/* PIE DE TOTALES Y FIRMAS TIPO EXCEL (COMO EN LA IMAGEN 2) */}
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-400 font-black text-xs whitespace-nowrap">
                    <td colSpan={6} className="py-1.5 px-3 text-right uppercase border-r border-slate-300">
                      TOTAL RELACIÓN ({filteredRecords.length} CASOS):
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-mono border-r border-slate-300">
                      {formatCurrency(totals.cobertura)}
                    </td>
                    {!isAuditoriaStage && (
                      <>
                        <td className="py-1.5 px-2.5 text-right font-mono text-red-700 border-r border-slate-300">
                          {formatCurrency(totals.glosado)}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-sky-800 border-r border-slate-300">
                          {formatCurrency(totals.aPagar)}
                        </td>
                      </>
                    )}
                    <td colSpan={6} className="py-1.5 px-3 bg-emerald-50/70 text-[11px] font-bold text-slate-800">
                      ENTREGADO POR: <span className="underline">{currentCustodyInfo.entregadoPor}</span> &nbsp;|&nbsp; RECIBIDO POR: <span className="underline">{currentCustodyInfo.recibidoPor}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* 5. BARRA DE PESTAÑAS EXCEL ABAJO (IGUAL QUE EN LA IMAGEN 2 Y 5 DE EXCEL) */}
        {renderExcelArsTabBar('bottom')}
        {renderExcelAuditorTabBar('bottom')}
      </div>
    </div>
  );
};
