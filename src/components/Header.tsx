import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  ChevronDown, 
  RefreshCw, 
  Plus,
  FileSpreadsheet,
  AlertCircle,
  LogOut,
  UserCog,
  Bell,
  Moon,
  Sun,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { User, RecordType, AnyStageId } from '../types';
import { canCreateRecord } from '../utils/formatters';

export interface AreaNotificationItem {
  id: string;
  title: string;
  subtitle: string;
  sender: string;
  targetStage: AnyStageId;
  targetType: RecordType;
  count: number;
  badgeColor: string;
}

interface HeaderProps {
  activeUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  onLogout: () => void;
  onOpenNewRecord: (type: RecordType) => void;
  onResetData: () => void;
  onOpenUsersManager: () => void;
  onOpenArsConfig?: () => void;
  totalExpedientes: number;
  totalEmergencias: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  areaNotifications?: AreaNotificationItem[];
  onSelectNotificationStage?: (type: RecordType, stage: AnyStageId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeUser,
  users,
  onSelectUser,
  onLogout,
  onOpenNewRecord,
  onResetData,
  onOpenUsersManager,
  onOpenArsConfig,
  totalExpedientes,
  totalEmergencias,
  theme = 'light',
  onToggleTheme,
  areaNotifications = [],
  onSelectNotificationStage
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const isRootAdmin = activeUser.role === 'ADMIN_ROOT' || activeUser.role === 'ADMIN' || activeUser.permissions?.canManageUsers;
  const canConfigArs = isRootAdmin || activeUser.role === 'ADMINISTRATIVO';
  const canCreate = canCreateRecord(activeUser);

  const visibleNotifications = areaNotifications.filter(n => !dismissedNotifIds.includes(n.id));
  const totalUnreadCount = visibleNotifications.reduce((acc, n) => acc + n.count, 0);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
      {/* Top institutional strip (Sin número de teléfono, solo GESTION DE CALIDAD) */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center gap-1.5 font-extrabold tracking-wider text-white uppercase text-[11px]">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            GESTION DE CALIDAD
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-[11px]">
          <span className="hidden md:inline-flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sesión: <strong>{activeUser.name}</strong></span>
            <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] border ${activeUser.roleBadgeColor}`}>
              {activeUser.roleName}
            </span>
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
      <div className="px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center text-white shadow-sm shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                Control de Expedientes y Auditoría
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                v3.0 RBAC
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Cadena de custodia: Facturación &bull; Administrativo &bull; Auditor Médico &bull; Entrega ARS
            </p>
          </div>
        </div>

        {/* Action buttons & user switcher */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          
          {/* Admin Management button for Root */}
          {isRootAdmin && (
            <button
              onClick={onOpenUsersManager}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Administrar usuarios, contraseñas y permisos del sistema"
            >
              <UserCog className="w-3.5 h-3.5" />
              <span>Usuarios y Permisos</span>
            </button>
          )}

          {/* Configuración de Vigencia de ARS (2 a 3 meses por ARS) */}
          {canConfigArs && onOpenArsConfig && (
            <button
              onClick={onOpenArsConfig}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Configurar días/meses de vigencia antes de vencimiento por cada ARS"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Vigencia ARS (2-3 Meses)</span>
            </button>
          )}

          {/* Quick Add Buttons */}
          {canCreate && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenNewRecord('EXPEDIENTE')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Emitir Expediente</span>
              </button>

              <button
                onClick={() => onOpenNewRecord('EMERGENCIA')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Emitir Emergencia</span>
              </button>
            </div>
          )}

          <div className="h-6 w-px bg-slate-200 hidden sm:block mx-0.5"></div>

          {/* BOTÓN MODO OSCURO / MODO CLARO CON ANIMACIÓN DE CORTINA */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-indigo-950 text-amber-300 border-indigo-700 hover:bg-indigo-900'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
              title={theme === 'dark' ? 'Cambiar a Modo Claro (Sol)' : 'Cambiar a Modo Oscuro (Media Luna)'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden xl:inline">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-700" />
                  <span className="hidden xl:inline">Modo Oscuro</span>
                </>
              )}
            </button>
          )}

          {/* CAMPANA DE NOTIFICACIONES NO INVASIVAS POR ÁREA RECEPTORA */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              title="Bandeja de avisos de recepción para tu área (No invasiva)"
            >
              <Bell className="w-4 h-4" />
              {visibleNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-sky-600 text-white font-mono font-black text-[10px] flex items-center justify-center shadow-xs">
                  {visibleNotifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-xs font-extrabold uppercase tracking-wider">
                        Avisos de Recepción &bull; {activeUser.roleName}
                      </span>
                    </div>
                    {visibleNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setDismissedNotifIds(areaNotifications.map(n => n.id))}
                        className="text-[10px] text-slate-300 hover:text-white underline cursor-pointer"
                      >
                        Marcar leídos
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {visibleNotifications.length === 0 ? (
                      <div className="p-5 text-center text-xs text-slate-400 flex flex-col items-center gap-1.5">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        <span>Tu área está al día. Sin recepciones pendientes de revisar.</span>
                      </div>
                    ) : (
                      visibleNotifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (onSelectNotificationStage) {
                              onSelectNotificationStage(notif.targetType, notif.targetStage);
                            }
                            setShowNotifications(false);
                          }}
                          className="p-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-start justify-between gap-2"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${notif.badgeColor}`}>
                                {notif.count} {notif.count === 1 ? 'caso' : 'casos'}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {notif.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">
                              {notif.subtitle}
                            </p>
                            <p className="text-[10px] font-semibold text-sky-700">
                              Enviado por: {notif.sender}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User profile with switch or logout */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {activeUser.avatar || activeUser.name.slice(0, 2).toUpperCase()}
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
                      Usuario en Sesión
                    </p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {activeUser.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {activeUser.email} &bull; {activeUser.department}
                    </p>
                  </div>

                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">
                    Cambio Rápido de Rol:
                  </div>
                  <div className="max-h-52 overflow-y-auto py-1">
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSelectUser(u);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left flex items-start gap-2 hover:bg-slate-50 transition-colors cursor-pointer ${
                          u.id === activeUser.id ? 'bg-sky-50/70 border-l-4 border-sky-600' : ''
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {u.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {u.name}
                            </span>
                            {u.id === activeUser.id && (
                              <UserCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            )}
                          </div>
                          <span className={`inline-block text-[9px] px-1 py-0.2 rounded font-semibold border ${u.roleBadgeColor}`}>
                            {u.roleName}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="px-2 pt-2 border-t border-slate-100 space-y-1">
                    {isRootAdmin && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenUsersManager();
                        }}
                        className="w-full text-xs text-purple-700 hover:bg-purple-50 font-semibold flex items-center gap-1.5 p-1.5 rounded-lg cursor-pointer"
                      >
                        <UserCog className="w-3.5 h-3.5" />
                        <span>Gestión de Usuarios y Permisos</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        setShowConfirmReset(true);
                      }}
                      className="w-full text-xs text-slate-600 hover:text-amber-700 hover:bg-amber-50 font-medium flex items-center gap-1.5 p-1.5 rounded-lg cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                      <span>Reiniciar Base de Datos Demo</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-xs text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-1.5 p-1.5 rounded-lg cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Direct Logout Button */}
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Cerrar sesión actual"
          >
            <LogOut className="w-4 h-4" />
          </button>

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
              Se restaurarán los expedientes y emergencias iniciales en la base de datos SQLite.
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
