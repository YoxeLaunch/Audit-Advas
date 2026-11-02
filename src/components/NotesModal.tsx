import React, { useState } from 'react';
import { 
  X, 
  Send, 
  MessageSquare, 
  History, 
  Clock, 
  User as UserIcon, 
  Tag, 
  CheckCircle2, 
  AlertTriangle,
  Stethoscope,
  Building
} from 'lucide-react';
import { MedicalRecordItem, User, RecordNote } from '../types';
import { formatCurrency, formatDateTime, formatDateToDMY, getStageConfig } from '../utils/formatters';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecordItem | null;
  activeUser: User;
  onAddNote: (recordId: string, noteText: string) => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  record,
  activeUser,
  onAddNote
}) => {
  if (!isOpen || !record) return null;

  const [newNoteText, setNewNoteText] = useState('');
  const stageConfig = getStageConfig(record.currentStage);

  const quickTags = [
    'Biopsia pendiente de patología',
    'Falta firma médico tratante',
    'Medicamento fuera de cobertura',
    'Objeción de auditoría resuelta',
    'Entregado con acuse de recibo',
    'Revisión urgente de glosa'
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddNote(record.id, newNoteText.trim());
    setNewNoteText('');
  };

  const handleAppendTag = (tag: string) => {
    setNewNoteText(prev => prev ? `${prev}. ${tag}` : tag);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">
                Cadena de Notas y Seguimiento
              </h2>
              <p className="text-xs text-slate-400">
                Historial cronológico de observaciones e incidencias
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

        {/* Patient Info Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Paciente &bull; NAP
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                {record.nombrePaciente}
              </div>
              <div className="text-xs font-mono font-bold text-sky-700">
                NAP: {record.nap} &bull; {record.ars}
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                {stageConfig?.label || record.currentStage}
              </span>
              <div className="text-xs font-mono mt-0.5">
                <span className="text-slate-500">A pagar: </span>
                <span className="font-extrabold text-slate-900">{formatCurrency(record.aPagar)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Timeline Scroll Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Main Initial Note */}
          <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-[11px] text-sky-800 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                Nota Principal / Resumen de Expediente:
              </span>
              <span className="text-slate-400 text-[10px]">{formatDateToDMY(record.fechaCierre)}</span>
            </div>
            <p className="text-xs text-slate-800 font-medium">
              {record.nota || 'Sin nota inicial registrada.'}
            </p>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Línea de Tiempo de Observaciones ({record.notesHistory?.length || 0})
            </span>

            {(!record.notesHistory || record.notesHistory.length === 0) ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No hay observaciones adicionales registradas todavía en la cadena de seguimiento.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {record.notesHistory.map((note) => (
                  <div key={note.id} className="relative group">
                    {/* Dot on line */}
                    <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-sky-500 border-2 border-white ring-1 ring-sky-300"></div>

                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">
                            {note.author}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium">
                            {note.authorRole}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {note.date}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {note.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Note Input Area */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
          {/* Quick tags */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <Tag className="w-3 h-3" /> Etiquetas:
            </span>
            {quickTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAppendTag(tag)}
                className="text-[10px] bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 text-slate-600 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
              >
                + {tag}
              </button>
            ))}
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              placeholder={`Agregar nota como ${activeUser.name}...`}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-hidden"
            />
            <button
              type="submit"
              disabled={!newNoteText.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Registrar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
