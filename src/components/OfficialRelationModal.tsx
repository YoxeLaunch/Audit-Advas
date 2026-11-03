import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileSpreadsheet
} from 'lucide-react';
import { MedicalRecordItem, AnyStageId } from '../types';
import { formatCurrency, formatDateToDMY, calculateRecordSla } from '../utils/formatters';

interface OfficialRelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: MedicalRecordItem[];
  title: string;
  ars: string;
  deliveryDate: string;
  stage?: AnyStageId | 'ALL';
  auditorName?: string;
  deliveredBy?: string;
  receivedBy?: string;
  arsConfigMap?: Record<string, number>;
}

export const OfficialRelationModal: React.FC<OfficialRelationModalProps> = ({
  isOpen,
  onClose,
  records,
  title,
  ars,
  deliveryDate,
  stage = 'ALL',
  auditorName = 'TODOS LOS AUDITORES',
  deliveredBy = 'Área Emisora',
  receivedBy = 'Departamento Receptor',
  arsConfigMap = {}
}) => {
  if (!isOpen) return null;

  const isBiopsias = stage === 'BIOPSIAS' || title.toUpperCase().includes('BIOPSIA') || title.toUpperCase().includes('HISTOPATOLOGIA');
  const isAuditoria = stage === 'AUDITORIA' || stage === 'RECEPCION_AUDITORES' || title.toUpperCase().includes('AUDITOR');

  const totalCobertura = records.reduce((acc, r) => acc + (r.cobertura || 0), 0);
  const totalGlosado = records.reduce((acc, r) => acc + (r.montoGlosado || 0), 0);
  const totalAPagar = records.reduce((acc, r) => acc + (r.aPagar || 0), 0);

  // Separación de Biopsias en la misma impresión:
  // Parte 1: Enviadas 1 vez (Nuevas del día)
  // Parte 2 (Al final): Enviadas 2 o más veces (Biopsias Pendientes recurrentes)
  const biopsiasNuevas = records.filter(r => !r.biopsiaCompletada && (r.vecesEnviadaBiopsia || 1) === 1);
  const biopsiasPendientes = records.filter(r => !r.biopsiaCompletada && (r.vecesEnviadaBiopsia || 1) >= 2);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (isBiopsias) {
      const headers = ['#', 'INGRESO', 'NOMBRE PACIENTE', 'NAP', 'ARS', 'MEDICO', 'ENVIADAS', 'BIOPSIA'];
      const rows1 = biopsiasNuevas.map((r, i) => [
        i + 1,
        formatDateToDMY(r.fechaCierre),
        `"${r.nombrePaciente}"`,
        `"${r.nap}"`,
        `"${r.ars}"`,
        `"${r.medicoTratante || 'SIN ESPECIFICAR'}"`,
        r.vecesEnviadaBiopsia || 1,
        `"${(r.descripcionBiopsia || r.nota || '').replace(/"/g, '""')}"`
      ]);
      const rows2 = biopsiasPendientes.map((r, i) => [
        i + 1,
        formatDateToDMY(r.fechaCierre),
        `"${r.nombrePaciente}"`,
        `"${r.nap}"`,
        `"${r.ars}"`,
        `"${r.medicoTratante || 'SIN ESPECIFICAR'}"`,
        r.vecesEnviadaBiopsia || 2,
        `"${(r.descripcionBiopsia || r.nota || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
        + `SOLICITUD DE REPORTES DE HISTOPATOLOGIA - FECHA SOLICITUD: ${formatDateToDMY(deliveryDate)}\n`
        + headers.join(',') + '\n'
        + rows1.map(e => e.join(',')).join('\n')
        + `\n\nBIOPSIAS PENDIENTES (2 O MAS ENVIOS)\n`
        + headers.join(',') + '\n'
        + rows2.map(e => e.join(',')).join('\n');

      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csvContent));
      link.setAttribute('download', `HISTOPATOLOGIA_BIOPSIAS_${deliveryDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const headers = ['#', 'F.CIERRE', 'NOMBRE PACIENTE', 'NAP (AUTORIZACION)', 'ARS', 'NOTA', 'COBERTURA', 'MONTO GLOSADO', 'A PAGAR', 'ENTREGADO POR'];
    const rows = records.map((r, i) => [
      i + 1,
      formatDateToDMY(r.fechaCierre),
      `"${r.nombrePaciente.replace(/"/g, '""')}"`,
      `"${r.nap}"`,
      `"${r.ars}"`,
      `"${(r.nota || '').replace(/"/g, '""')}"`,
      r.cobertura.toFixed(2),
      r.montoGlosado.toFixed(2),
      r.aPagar.toFixed(2),
      `"${deliveredBy}"`
    ]);

    rows.push([
      'TOTALES', '', '', '', '', '',
      totalCobertura.toFixed(2),
      totalGlosado.toFixed(2),
      totalAPagar.toFixed(2),
      ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + `GESTION DE CALIDAD\n`
      + `${title} - ${ars} - FECHA ENTREGA: ${formatDateToDMY(deliveryDate)}\n`
      + `ENTREGADO POR: ${deliveredBy} | RECIBIDO POR: ${receivedBy}\n\n`
      + headers.join(',') + '\n'
      + rows.map(e => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RELACION_${ars.replace(/\s+/g, '_')}_${deliveryDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl border border-slate-300 overflow-hidden my-2 sm:my-6 flex flex-col max-h-[95vh]">
        {/* Modal Toolbar (hidden in print) */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold">
              Vista Previa Oficial de Impresión ({isBiopsias ? 'Histopatología y Biopsias Pendientes' : isAuditoria ? 'Entrega a Auditoría Interna' : 'Relación de Entrega'})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel (CSV)</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Relación Oficial</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 flex-1">
          <div className="bg-white p-6 rounded-lg shadow-md border border-slate-300 max-w-5xl mx-auto print:shadow-none print:border-none print:p-0 text-black">
            
            {/* ========================================================= */}
            {/* FORMATO 1: IMPRESIÓN DE BIOPSIAS (2 PARTES EN LA MISMA HOJA) */}
            {/* ========================================================= */}
            {isBiopsias ? (
              <div>
                <div className="bg-[#FDE9D9] border border-black py-1.5 px-4 text-center font-black text-sm uppercase tracking-wider mb-3">
                  SOLICITUD DE REPORTES DE HISTOPATOLOGIA
                </div>

                <div className="flex justify-end mb-3">
                  <div className="inline-flex border border-black text-xs font-bold">
                    <span className="px-3 py-1 bg-white border-r border-black uppercase">
                      FECHA SOLICITUD
                    </span>
                    <span className="px-5 py-1 bg-[#FDE9D9] font-mono font-black">
                      {formatDateToDMY(deliveryDate)}
                    </span>
                  </div>
                </div>

                {/* PARTE 1: ENVIADAS 1 VEZ (NUEVAS DEL MISMO DÍA) */}
                <div className="text-[11px] font-bold text-slate-700 mb-1 uppercase">
                  1. Nuevas Agregadas del Día (Enviadas 1 vez):
                </div>
                <table className="w-full text-left text-xs border border-black border-collapse mb-8">
                  <thead>
                    <tr className="bg-slate-100 font-black text-black uppercase border-b border-black text-[11px]">
                      <th className="py-1.5 px-2 w-8 text-center border-r border-black">#</th>
                      <th className="py-1.5 px-2 w-24 text-center border-r border-black underline">INGRESO</th>
                      <th className="py-1.5 px-2 border-r border-black underline">NOMBRE PACIENTE</th>
                      <th className="py-1.5 px-2 w-28 text-center border-r border-black underline">NAP / AUT.</th>
                      <th className="py-1.5 px-2 w-28 text-center border-r border-black underline">ARS</th>
                      <th className="py-1.5 px-2 w-44 text-center border-r border-black underline">MEDICO</th>
                      <th className="py-1.5 px-2 w-20 text-center border-r border-black underline">ENVIADAS</th>
                      <th className="py-1.5 px-2 underline">BIOPSIA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {biopsiasNuevas.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-3 text-center text-slate-500 italic">
                          No hay solicitudes nuevas (enviadas 1 vez) en esta fecha.
                        </td>
                      </tr>
                    ) : (
                      biopsiasNuevas.map((rec, idx) => (
                        <tr key={rec.id} className="border-b border-black/40 whitespace-nowrap">
                          <td className="py-1 px-2 text-center font-bold border-r border-black/40">{idx + 1}</td>
                          <td className="py-1 px-2 text-center font-mono border-r border-black/40">{formatDateToDMY(rec.fechaCierre)}</td>
                          <td className="py-1 px-2 font-bold uppercase border-r border-black/40">{rec.nombrePaciente}</td>
                          <td className="py-1 px-2 text-center font-mono border-r border-black/40">{rec.nap}</td>
                          <td className="py-1 px-2 text-center font-bold border-r border-black/40">{rec.ars}</td>
                          <td className="py-1 px-2 text-center font-semibold uppercase border-r border-black/40">{rec.medicoTratante || 'POR ASIGNAR'}</td>
                          <td className="py-1 px-2 text-center font-black border-r border-black/40">{rec.vecesEnviadaBiopsia || 1}</td>
                          <td className="py-1 px-2 font-bold uppercase">{rec.descripcionBiopsia || rec.nota || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* PARTE 2 (AL FINAL): BIOPSIAS PENDIENTES (2 O MÁS ENVÍOS) */}
                <div className="bg-[#C00000] text-white border border-black py-1.5 px-4 font-black text-xs uppercase tracking-wider mb-2 underline">
                  BIOPSIAS PENDIENTES (2 O MÁS VECES ENVIADAS - SEGUIMIENTO ACUMULADO)
                </div>
                <table className="w-full text-left text-xs border border-black border-collapse">
                  <thead>
                    <tr className="bg-slate-100 font-black text-black uppercase border-b border-black text-[11px]">
                      <th className="py-1.5 px-2 w-8 text-center border-r border-black">#</th>
                      <th className="py-1.5 px-2 w-24 text-center border-r border-black underline">INGRESO</th>
                      <th className="py-1.5 px-2 border-r border-black underline">NOMBRE PACIENTE</th>
                      <th className="py-1.5 px-2 w-28 text-center border-r border-black underline">NAP / AUT.</th>
                      <th className="py-1.5 px-2 w-28 text-center border-r border-black underline">ARS</th>
                      <th className="py-1.5 px-2 w-44 text-center border-r border-black underline">MEDICO</th>
                      <th className="py-1.5 px-2 w-20 text-center border-r border-black underline">ENVIADAS</th>
                      <th className="py-1.5 px-2 underline">BIOPSIA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {biopsiasPendientes.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-3 text-center text-slate-500 italic">
                          No hay biopsias pendientes con 2 o más envíos.
                        </td>
                      </tr>
                    ) : (
                      biopsiasPendientes.map((rec, idx) => (
                        <tr key={rec.id} className="border-b border-black/40 whitespace-nowrap">
                          <td className="py-1 px-2 text-center font-bold border-r border-black/40">{idx + 1}</td>
                          <td className="py-1 px-2 text-center font-mono border-r border-black/40">{formatDateToDMY(rec.fechaCierre)}</td>
                          <td className="py-1 px-2 font-bold uppercase border-r border-black/40 text-amber-800">{rec.nombrePaciente}</td>
                          <td className="py-1 px-2 text-center font-mono border-r border-black/40">{rec.nap}</td>
                          <td className="py-1 px-2 text-center font-bold border-r border-black/40">{rec.ars}</td>
                          <td className="py-1 px-2 text-center font-semibold uppercase border-r border-black/40">{rec.medicoTratante || 'POR ASIGNAR'}</td>
                          <td className="py-1 px-2 text-center font-black text-red-700 border-r border-black/40">{rec.vecesEnviadaBiopsia}</td>
                          <td className="py-1 px-2 font-bold uppercase">{rec.descripcionBiopsia || rec.nota || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : isAuditoria ? (
              /* ========================================================= */
              /* FORMATO 2: ENTREGA DE EXPEDIENTES A AUDITORÍA INTERNA     */
              /* ========================================================= */
              <div>
                <div className="max-w-lg border border-black mb-3">
                  <div className="bg-[#FFC000] text-black font-black text-xs text-center py-1 border-b border-black uppercase">
                    ENTREGA DE EXPEDIENTES A AUDITORIA INTERNA
                  </div>
                  <div className="bg-white text-black font-black text-xs text-center py-1 border-b border-black uppercase underline">
                    MEDICO AUDITOR
                  </div>
                  <div className="bg-[#00B050] text-black font-black text-sm text-center py-1 uppercase">
                    {auditorName}
                  </div>
                </div>

                <div className="flex justify-end mb-2">
                  <div className="inline-flex border border-black text-xs font-bold">
                    <span className="px-3 py-1 bg-white border-r border-black uppercase">
                      FECHA ENTREGA
                    </span>
                    <span className="px-5 py-1 bg-[#FFC000] font-mono font-black">
                      {formatDateToDMY(deliveryDate)}
                    </span>
                  </div>
                </div>

                <table className="w-full text-left text-[11px] border border-black border-collapse">
                  <thead>
                    <tr className="bg-[#00B0F0] font-black text-black uppercase border-b border-black">
                      <th className="py-1.5 px-2 w-8 text-center border-r border-black underline">#</th>
                      <th className="py-1.5 px-2 w-24 text-center border-r border-black underline">FECHA CIERRE</th>
                      <th className="py-1.5 px-2 border-r border-black underline">NOMBRE PACIENTE</th>
                      <th className="py-1.5 px-2 w-28 text-center border-r border-black underline">AUTORIZACION</th>
                      <th className="py-1.5 px-2 w-24 text-center border-r border-black underline">ARS</th>
                      <th className="py-1.5 px-2 w-24 text-right border-r border-black underline">COBERTURA</th>
                      <th className="py-1.5 px-2 border-r border-black underline">OBSERVACION</th>
                      <th className="py-1.5 px-2 w-28 text-center border-r border-black underline">FECHA VENCIMIENTO</th>
                      <th className="py-1.5 px-2 w-24 text-center border-r border-black bg-white underline">DIAS RESTANTES</th>
                      <th className="py-1.5 px-2 w-24 text-center bg-white underline">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec, idx) => {
                      const sla = calculateRecordSla(rec.fechaCierre, rec.ars, rec.auditoriaProcesada, arsConfigMap);
                      return (
                        <tr key={rec.id} className="border-b border-black/40 whitespace-nowrap">
                          <td className="py-1 px-2 text-center font-bold border-r border-black/40">{idx + 1}</td>
                          <td className="py-1 px-2 text-center font-mono border-r border-black/40">{formatDateToDMY(rec.fechaCierre)}</td>
                          <td className="py-1 px-2 font-bold uppercase border-r border-black/40">{rec.nombrePaciente}</td>
                          <td className="py-1 px-2 text-center font-mono border-r border-black/40">{rec.nap}</td>
                          <td className="py-1 px-2 text-center font-bold border-r border-black/40">{rec.ars}</td>
                          <td className="py-1 px-2 text-right font-mono border-r border-black/40">{formatCurrency(rec.cobertura)}</td>
                          <td className="py-1 px-2 border-r border-black/40 truncate max-w-[180px]">{rec.nota || '-'}</td>
                          <td className="py-1 px-2 text-center font-mono font-bold border-r border-black/40">{sla.fechaVencimientoDMY}</td>
                          <td className="py-1 px-2 text-center font-mono font-bold border-r border-black/40">{sla.diasRestantes}</td>
                          <td className={`py-1 px-2 text-center text-[10px] ${sla.cellClass}`}>{sla.estadoLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* ========================================================= */
              /* FORMATO 3: RELACIÓN ESTÁNDAR COMPACTA DE 1 LÍNEA          */
              /* ========================================================= */
              <div>
                <div className="mb-4 space-y-1">
                  <div className="font-bold text-sm tracking-wider text-black">
                    GESTION DE CALIDAD
                  </div>
                  <div className="bg-slate-200 border border-black px-3 py-1 font-black text-xs uppercase tracking-wider text-black">
                    {title}
                  </div>
                  <div className="pt-2 flex items-center justify-between gap-4">
                    <h1 className="text-xl font-black underline underline-offset-4 text-black">
                      {ars === 'TODAS' ? 'TODAS LAS ASEGURADORAS (ARS)' : `ARS ${ars}`}
                    </h1>
                    <div className="flex items-center border border-black text-xs font-bold shrink-0">
                      <span className="px-3 py-1 bg-slate-100 border-r border-black uppercase">
                        FECHA ENTREGA
                      </span>
                      <span className="px-4 py-1 bg-slate-200 font-mono">
                        {formatDateToDMY(deliveryDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <table className="w-full text-left text-xs border border-black border-collapse">
                  <thead>
                    <tr className="bg-slate-100 font-extrabold text-black uppercase border-b border-black text-[11px]">
                      <th className="py-1.5 px-2 w-8 text-center border-r border-black">#</th>
                      <th className="py-1.5 px-2 w-24 border-r border-black">F.CIERRE</th>
                      <th className="py-1.5 px-2 border-r border-black">NOMBRE PACIENTE</th>
                      <th className="py-1.5 px-2 w-28 font-mono border-r border-black">NAP / AUT.</th>
                      <th className="py-1.5 px-2 w-24 border-r border-black">ARS</th>
                      <th className="py-1.5 px-2 border-r border-black">OBSERVACION</th>
                      <th className="py-1.5 px-2 w-28 text-right border-r border-black">COBERTURA</th>
                      <th className="py-1.5 px-2 w-28 text-right border-r border-black text-red-600">GLOSADO</th>
                      <th className="py-1.5 px-2 w-28 text-right text-sky-700">A PAGAR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec, idx) => (
                      <tr key={rec.id} className="border-b border-black/40 whitespace-nowrap">
                        <td className="py-1 px-2 text-center font-bold border-r border-black/40">{idx + 1}</td>
                        <td className="py-1 px-2 font-mono border-r border-black/40">{formatDateToDMY(rec.fechaCierre)}</td>
                        <td className="py-1 px-2 font-bold uppercase border-r border-black/40">{rec.nombrePaciente}</td>
                        <td className="py-1 px-2 font-mono border-r border-black/40">{rec.nap}</td>
                        <td className="py-1 px-2 font-bold border-r border-black/40">{rec.ars}</td>
                        <td className="py-1 px-2 border-r border-black/40 text-[11px] truncate max-w-[200px]">{rec.nota || '-'}</td>
                        <td className="py-1 px-2 text-right font-mono border-r border-black/40">{formatCurrency(rec.cobertura)}</td>
                        <td className="py-1 px-2 text-right font-mono font-bold text-red-600 border-r border-black/40">
                          {rec.montoGlosado > 0 ? formatCurrency(rec.montoGlosado) : 'RD$ 0.00'}
                        </td>
                        <td className="py-1 px-2 text-right font-mono font-bold text-sky-700">{formatCurrency(rec.aPagar)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-xs border-t-2 border-black">
                      <td colSpan={6} className="py-1.5 px-2 text-right uppercase border-r border-black">
                        TOTAL GENERAL ({records.length} REGISTROS):
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono border-r border-black">{formatCurrency(totalCobertura)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-red-600 border-r border-black">{formatCurrency(totalGlosado)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-sky-700">{formatCurrency(totalAPagar)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Pie de Firma y Custodia tipo Excel (ENTREGADO POR / RECIBIDO POR) */}
            <div className="mt-10 pt-4 border-t-2 border-emerald-700 bg-emerald-50/40 p-3 grid grid-cols-2 gap-8 text-xs text-black">
              <div>
                <div className="font-black uppercase tracking-wider text-black">ENTREGADO POR:</div>
                <div className="font-bold text-slate-800 mt-1">{deliveredBy}</div>
                <div className="border-b border-black w-4/5 mt-6 mb-1"></div>
                <div className="text-[10px] text-slate-500">Firma y Fecha de quien genera la relación</div>
              </div>

              <div>
                <div className="font-black uppercase tracking-wider text-black">RECIBIDO POR:</div>
                <div className="font-bold text-slate-800 mt-1">{receivedBy}</div>
                <div className="border-b border-black w-4/5 mt-6 mb-1"></div>
                <div className="text-[10px] text-slate-500">Firma y Fecha del receptor</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
