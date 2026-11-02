import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  ShieldCheck, 
  UserCheck, 
  ChevronDown, 
  RefreshCw, 
  Plus,
  Users,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { User, RecordType } from '../types';

interface HeaderProps {
  activeUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  onOpenNewRecord: (type: RecordType) => void;
  onResetData: () => void;
  onOpenUsersManager: () => void;
  totalExpedientes: number;
  totalEmergencias: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeUser,
  users,
  onSelectUser,
  onOpenNewRecord,
  onResetData,
  onOpenUsersManager,
  totalExpedientes,
  totalEmergencias
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
      {/* Top institutional strip */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center gap-1.5 font-bold tracking-wider text-white uppercase text-[11px]">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            GESTION DE CALIDAD MEDICA
          </span>
          <span className="text-slate-500">|</span>
          <span className="inline-flex items-center gap-1.5 text-slate-300 text-[11px]">
            <Phone className="w-3 h-3 text-emerald-400" />
            (809) 588-1717 EXT. 1177/1178
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-[11px]">
          <span className="hidden md:inline-flex items-center gap-1 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sistema en Línea &bull; Servidor Central
          </span>
          <div className="flex items-center gap-2">
            <span className="bg-slate-800 px-2 py-0.5 rounded text-sky-300 font-mono">
              {totalExpedientes} Expedientes
            </span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-rose-300 font-mono">
              {totalEmergencias} Emergencias
            </span>
          </div>
        </div>
      </div>

      {/* Main navigation & user control bar */}
      <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center text-white shadow-sm shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                Control de Expedientes y Emergencias
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                v2.5 Oficial
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Cadena de custodia, seguimiento de glosas y relaciones de entrega oficiales
            </p>
          </div>
        </div>

        {/* Action buttons & user switcher */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Quick Add Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onOpenNewRecord('EXPEDIENTE')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Registrar nuevo expediente médico hospitalario"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Expediente</span>
            </button>

            <button
              onClick={() => onOpenNewRecord('EMERGENCIA')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Registrar nuevo caso de emergencia médica"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Emergencia</span>
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

          {/* User Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {activeUser.avatar}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-slate-800 leading-none">
                  {activeUser.name}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {activeUser.roleName}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Cambiar de Usuario y Rol
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Simula accesos para validar permisos de auditoría, recepción o facturación.
                    </p>
                  </div>

                  <div className="max-h-60 overflow-y-auto py-1">
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSelectUser(u);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                          u.id === activeUser.id ? 'bg-sky-50/70 border-l-4 border-sky-600' : ''
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {u.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {u.name}
                            </span>
                            {u.id === activeUser.id && (
                              <UserCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            )}
                          </div>
                          <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-semibold mt-0.5 border ${u.roleBadgeColor}`}>
                            {u.roleName}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="px-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenUsersManager();
                      }}
                      className="text-xs text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1 p-1"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Gestionar Roles
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        setShowConfirmReset(true);
                      }}
                      className="text-xs text-slate-400 hover:text-rose-600 font-medium inline-flex items-center gap-1 p-1"
                      title="Restablecer base de datos con datos de demostración originales"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reiniciar Datos
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation modal for data reset */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">
              ¿Reiniciar datos al estado inicial?
            </h3>
            <p className="text-xs text-slate-600 text-center mb-5">
              Se restaurarán los expedientes y emergencias de ejemplo con las cabeceras de GESTIÓN DE CALIDAD MÉDICA y ARS SENASA.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onResetData();
                  setShowConfirmReset(false);
                }}
                className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer"
              >
                Sí, reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
