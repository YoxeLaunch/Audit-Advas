import React, { useState } from 'react';
import { 
  X, 
  Users, 
  ShieldCheck, 
  Check, 
  UserPlus, 
  Key, 
  Briefcase, 
  Lock, 
  Info,
  UserCheck
} from 'lucide-react';
import { User, UserRole } from '../types';

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  activeUser: User;
  onSelectUser: (user: User) => void;
  onAddUser: (user: Omit<User, 'id'>) => void;
}

export const UsersModal: React.FC<UsersModalProps> = ({
  isOpen,
  onClose,
  users,
  activeUser,
  onSelectUser,
  onAddUser
}) => {
  if (!isOpen) return null;

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('AUDITOR');
  const [newDept, setNewDept] = useState('Auditoría Médica');

  const roleDefinitions: Record<UserRole, { title: string; desc: string; permissions: string[] }> = {
    ADMIN: {
      title: 'Administrador General',
      desc: 'Control absoluto del sistema de expedientes, permisos de usuarios y eliminación de datos.',
      permissions: [
        'Crear y editar cualquier expediente y emergencia',
        'Gestionar montos glosados y coberturas',
        'Avanzar y retroceder cualquier etapa',
        'Eliminar registros del sistema',
        'Cambiar perfiles de usuario'
      ]
    },
    AUDITOR: {
      title: 'Auditor Médico Principal',
      desc: 'Encargado del análisis técnico de historias clínicas, kardex, pertinencia y objeciones.',
      permissions: [
        'Revisar expedientes en etapa de auditoría',
        'Modificar MONTO GLOSADO y registrar motivo clínico',
        'Derivar expedientes a Relación de Biopsias',
        'Autorizar pase hacia Entrega a ARS',
        'Agregar notas de auditoría médica'
      ]
    },
    RECEPCION: {
      title: 'Recepción y Entrada / Salida',
      desc: 'Responsable del ingreso físico de historias clínicas y turnos de urgencia.',
      permissions: [
        'Crear nuevos registros de Expedientes y Emergencias',
        'Ingresar F. Cierre, Paciente, NAP y ARS inicial',
        'Generar actas de recepción inicial',
        'Asignar casos a la bandeja de Auditores'
      ]
    },
    FACTURACION: {
      title: 'Facturación y Entrega ARS',
      desc: 'Gestor del trámite financiero, valijas de entrega hacia aseguradoras y liquidación de cobro.',
      permissions: [
        'Gestionar entregas a ARS y a Facturación',
        'Generar e imprimir relaciones oficiales con firmas',
        'Verificar balances de A PAGAR',
        'Cerrar expedientes facturados'
      ]
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const initials = newName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('') || 'US';

    const roleInfo = roleDefinitions[newRole];

    const roleColors: Record<UserRole, string> = {
      ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
      AUDITOR: 'bg-amber-100 text-amber-800 border-amber-200',
      RECEPCION: 'bg-blue-100 text-blue-800 border-blue-200',
      FACTURACION: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    };

    onAddUser({
      name: newName.trim(),
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '.')}@calidadmedica.gob.do`,
      role: newRole,
      roleName: roleInfo.title,
      roleBadgeColor: roleColors[newRole],
      department: newDept.trim() || 'Servicio Hospitalario',
      avatar: initials
    });

    setNewName('');
    setNewEmail('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                Gestión de Usuarios y Matriz de Roles
              </h2>
              <p className="text-xs text-slate-400">
                Control de acceso basado en roles (RBAC) para el hospital
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

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active User Highlight */}
          <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-extrabold text-base flex items-center justify-center shadow-sm">
                {activeUser.avatar}
              </div>
              <div>
                <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
                  Usuario Activo en esta sesión
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeUser.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeUser.email} &bull; {activeUser.department}
                </p>
              </div>
            </div>

            <div>
              <span className={`inline-block text-xs px-2.5 py-1 rounded-md font-bold border ${activeUser.roleBadgeColor}`}>
                {activeUser.roleName}
              </span>
            </div>
          </div>

          {/* User List with Switch Action */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-4 h-4 text-slate-500" />
                Personal Registrado (Haz clic para alternar sesión de prueba)
              </h4>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs text-sky-600 hover:text-sky-700 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {showAddForm ? 'Cerrar Formulario' : '+ Agregar Nuevo Usuario'}
              </button>
            </div>

            {/* Optional New User Form */}
            {showAddForm && (
              <form onSubmit={handleCreateUser} className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Registrar Nuevo Funcionario:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Dr. Marcos Peralta"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                      Rol en el Sistema
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => {
                        const r = e.target.value as UserRole;
                        setNewRole(r);
                        if (r === 'AUDITOR') setNewDept('Auditoría Médica y Glosas');
                        else if (r === 'RECEPCION') setNewDept('Admisión y Recepción');
                        else if (r === 'FACTURACION') setNewDept('Facturación y Entrega ARS');
                        else setNewDept('Dirección Hospitalaria');
                      }}
                      className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="ADMIN">Administrador General</option>
                      <option value="AUDITOR">Auditor Médico</option>
                      <option value="RECEPCION">Recepción y Admisión</option>
                      <option value="FACTURACION">Facturación y Entrega ARS</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1 text-xs text-slate-600 bg-slate-200 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-bold text-white bg-sky-600 rounded"
                  >
                    Crear y Guardar
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {users.map(u => {
                const isSelected = u.id === activeUser.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => onSelectUser(u)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-400/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {u.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {u.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {u.department}
                        </div>
                        <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded font-semibold mt-1 border ${u.roleBadgeColor}`}>
                          {u.roleName}
                        </span>
                      </div>
                    </div>

                    <div>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                          <Check className="w-3 h-3" /> Activo
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="text-[11px] font-semibold text-slate-500 hover:text-sky-700 px-2 py-0.5 rounded border border-slate-200 hover:border-sky-300 bg-slate-50"
                        >
                          Usar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role Permissions Matrix */}
          <div className="border-t border-slate-200 pt-5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              Matriz de Permisos por Rol Institucional
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {(Object.keys(roleDefinitions) as UserRole[]).map(roleKey => {
                const info = roleDefinitions[roleKey];
                return (
                  <div key={roleKey} className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900 text-xs">
                        {info.title}
                      </span>
                      <span className="text-[9px] font-mono font-bold uppercase text-slate-500">
                        [{roleKey}]
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-2">
                      {info.desc}
                    </p>
                    <ul className="space-y-1">
                      {info.permissions.map((perm, i) => (
                        <li key={i} className="text-[10px] text-slate-600 flex items-start gap-1.5">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{perm}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
