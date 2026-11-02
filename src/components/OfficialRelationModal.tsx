import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Building2, 
  Phone, 
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { MedicalRecordItem } from '../types';
import { formatCurrency, formatDateToDMY } from '../utils/formatters';

interface OfficialRelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: MedicalRecordItem[];
  title: string;
  ars: string;
  deliveryDate: string;
}

export const OfficialRelationModal: React.FC<OfficialRelationModalProps> = ({
  isOpen,
  onClose,
  records,
  title,
  ars,
  deliveryDate
}) => {
  if (!isOpen) return null;

  const totalCobertura = records.reduce((acc, r) => acc + (r.cobertura || 0), 0);
  const totalGlosado = records.reduce((acc, r) => acc + (r.montoGlosado || 0), 0);
  const totalAPagar = records.reduce((acc, r) => acc + (r.aPagar || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    // Generate CSV content
    const headers = ['#', 'F.CIERRE', 'NOMBRE PACIENTE', 'NAP', 'NOTA', 'COBERTURA', 'MONTO GLOSADO', 'A PAGAR'];
    const rows = records.map((r, i) => [
      r.numero || (i + 1),
      formatDateToDMY(r.fechaCierre),
      `"${r.nombrePaciente.replace(/"/g, '""')}"`,
      `"${r.nap}"`,
      `"${(r.nota || '').replace(/"/g, '""')}"`,
      r.cobertura.toFixed(2),
      r.montoGlosado.toFixed(2),
      r.aPagar.toFixed(2)
    ]);

    // Summary row
    rows.push([
      'TOTALES',
      '',
      '',
      '',
      '',
      totalCobertura.toFixed(2),
      totalGlosado.toFixed(2),
      totalAPagar.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + `GESTION DE CALIDAD MEDICA - (809) 588-1717 EXT. 1177/1178\n`
      + `${title} - ${ars} - FECHA ENTREGA: ${formatDateToDMY(deliveryDate)}\n\n`
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
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-300 overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in-95 flex flex-col max-h-[95vh]">
        {/* Modal Toolbar (hidden in print) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold">
              Vista Previa de Relación Oficial Imprimible
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
              <span>Imprimir Documento</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area / Printable Act */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-slate-100 flex-1">
          {/* Paper Canvas */}
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md border border-slate-300 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0">
            {/* Header section matching user image */}
            <div className="mb-6 space-y-2">
              <div className="font-bold text-sm tracking-wider text-black">
                GESTION DE CALIDAD MEDICA
              </div>
              <div className="font-semibold text-xs text-black">
                (809) 588-1717 EXT. 1177/1178
              </div>

              {/* Title Gray Bar */}
              <div className="mt-4 bg-slate-200 border border-slate-300 px-4 py-1.5 font-bold text-xs uppercase tracking-wider text-black">
                {title}
              </div>

              {/* Centered ARS & Fecha Entrega */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full text-center sm:text-center sm:flex-1">
                  <h1 className="text-xl sm:text-2xl font-black underline underline-offset-4 decoration-2 text-black tracking-wide">
                    {ars}
                  </h1>
                </div>

                {/* Boxed Fecha Entrega exactly like Excel */}
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

            {/* Official Data Table */}
            <table className="w-full text-left text-xs border border-black border-collapse">
              <thead>
                <tr className="bg-slate-100 font-extrabold text-black uppercase border-b border-black text-[11px]">
                  <th className="p-2 w-8 text-center border-r border-black">#</th>
                  <th className="p-2 w-24 border-r border-black">F.CIERRE</th>
                  <th className="p-2 border-r border-black">NOMBRE PACIENTE</th>
                  <th className="p-2 w-28 font-mono border-r border-black">NAP</th>
                  <th className="p-2 border-r border-black">NOTA</th>
                  <th className="p-2 w-28 text-right border-r border-black">COBERTURA</th>
                  <th className="p-2 w-28 text-right border-r border-black text-red-600">MONTO GLOSADO</th>
                  <th className="p-2 w-28 text-right text-sky-600">A PAGAR</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                      No se han seleccionado expedientes para esta relación.
                    </td>
                  </tr>
                ) : (
                  records.map((rec, idx) => (
                    <tr key={rec.id} className="border-b border-black/40 hover:bg-slate-50">
                      <td className="p-2 text-center font-bold border-r border-black/40">
                        {rec.numero || idx + 1}
                      </td>
                      <td className="p-2 font-mono border-r border-black/40 whitespace-nowrap">
                        {formatDateToDMY(rec.fechaCierre)}
                      </td>
                      <td className="p-2 font-bold uppercase border-r border-black/40">
                        {rec.nombrePaciente}
                      </td>
                      <td className="p-2 font-mono border-r border-black/40 whitespace-nowrap">
                        {rec.nap}
                      </td>
                      <td className="p-2 border-r border-black/40 text-[11px]">
                        {rec.nota || '-'}
                      </td>
                      <td className="p-2 text-right font-mono border-r border-black/40 whitespace-nowrap">
                        {formatCurrency(rec.cobertura)}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-red-600 border-r border-black/40 whitespace-nowrap">
                        {rec.montoGlosado > 0 ? formatCurrency(rec.montoGlosado) : 'RD$ 0.00'}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-sky-600 whitespace-nowrap">
                        {formatCurrency(rec.aPagar)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black text-xs border-t-2 border-black">
                  <td colSpan={5} className="p-2 text-right uppercase border-r border-black">
                    TOTAL GENERAL ({records.length} REGISTROS):
                  </td>
                  <td className="p-2 text-right font-mono border-r border-black whitespace-nowrap">
                    {formatCurrency(totalCobertura)}
                  </td>
                  <td className="p-2 text-right font-mono text-red-600 border-r border-black whitespace-nowrap">
                    {formatCurrency(totalGlosado)}
                  </td>
                  <td className="p-2 text-right font-mono text-sky-600 whitespace-nowrap">
                    {formatCurrency(totalAPagar)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Official Sign-off lines */}
            <div className="mt-16 pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-black">
              <div className="text-center">
                <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
                <div className="font-bold uppercase tracking-wider">ENTREGADO POR:</div>
                <div className="text-[11px] text-slate-600">Gestión de Calidad Médica / Auditoría</div>
                <div className="text-[10px] text-slate-400 mt-1">Firma, Sello y Fecha</div>
              </div>

              <div className="text-center">
                <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
                <div className="font-bold uppercase tracking-wider">RECIBIDO POR:</div>
                <div className="text-[11px] text-slate-600">Departamento de Facturación / Aseguradora ARS</div>
                <div className="text-[10px] text-slate-400 mt-1">Firma, Sello y Fecha</div>
              </div>
            </div>

            {/* Institutional footer */}
            <div className="mt-12 text-center text-[10px] text-slate-400 border-t border-slate-200 pt-3">
              Documento confidencial emitido por el Sistema de Calidad y Auditoría Médica &bull; Ext. 1177/1178
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
