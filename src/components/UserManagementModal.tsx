import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  ShieldCheck, 
  Check, 
  Users, 
  Edit2, 
  Trash2, 
  Key, 
  UserCheck, 
  Lock, 
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { User, UserRole, UserPermissions, DEFAULT_ROLE_PERMISSIONS } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onSaveUser: (user: User) => void;
  onAddUser: (user: Omit<User, 'id'>) => void;
  activeUser: User;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  onSaveUser,
  onAddUser,
  activeUser
}) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states for creating / editing
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('ADMINISTRATIVO');
  const [formPermissions, setFormPermissions] = useState<UserPermissions>(DEFAULT_ROLE_PERMISSIONS.ADMINISTRATIVO);
  const [formIsActive, setFormIsActive] = useState(true);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormDepartment('Auditoría Médica');
    setFormRole('ADMINISTRATIVO');
    setFormPermissions(DEFAULT_ROLE_PERMISSIONS.ADMINISTRATIVO);
    setFormIsActive(true);
  };

  const handleStartEdit = (user: User) => {
    setIsCreatingNew(false);
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword(user.password || '');
    setFormDepartment(user.department);
    setFormRole(user.role);
    setFormPermissions(user.permissions || DEFAULT_ROLE_PERMISSIONS[user.role] || DEFAULT_ROLE_PERMISSIONS.ADMINISTRATIVO);
    setFormIsActive(user.isActive !== false);
  };

  const handleRoleChange = (role: UserRole) => {
    setFormRole(role);
    setFormPermissions(DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.ADMINISTRATIVO);
  };

  const handleTogglePermission = (key: keyof UserPermissions) => {
    setFormPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    let roleName = 'Administrativo de Auditoría';
    let roleBadgeColor = 'bg-blue-100 text-blue-800 border-blue-200';

    if (formRole === 'ADMIN_ROOT' || formRole === 'ADMIN') {
      roleName = 'Administrador Root';
      roleBadgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
    } else if (formRole === 'AUDITOR_MEDICO' || formRole === 'AUDITOR') {
      roleName = 'Auditor Médico Clínico';
      roleBadgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
    } else if (formRole === 'FACTURACION') {
      roleName = 'Facturación y Emisión';
      roleBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }

    const avatar = formName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    if (isCreatingNew) {
      onAddUser({
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        password: formPassword.trim() || '123456',
        department: formDepartment.trim() || 'Gestión Hospitalaria',
        role: formRole,
        roleName,
        roleBadgeColor,
        avatar,
        permissions: formPermissions,
        isActive: formIsActive
      });
      setIsCreatingNew(false);
    } else if (editingUser) {
      onSaveUser({
        ...editingUser,
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        password: formPassword.trim() || editingUser.password,
        department: formDepartment.trim() || editingUser.department,
        role: formRole,
        roleName,
        roleBadgeColor,
        avatar,
        permissions: formPermissions,
        isActive: formIsActive
      });
      setEditingUser(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Gestión de Usuarios, Roles y Permisos (Root)</h2>
              <p className="text-xs text-slate-300">
                Control de acceso basado en roles (RBAC) y privilegios granulares del sistema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6 text-xs">
          
          {/* Top Actions */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Usuarios Registrados ({users.length})
            </span>
            {!isCreatingNew && !editingUser && (
              <button
                type="button"
                onClick={handleStartCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer text-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Crear Nuevo Usuario</span>
              </button>
            )}
          </div>

          {/* Form for Create or Edit */}
          {(isCreatingNew || editingUser) && (
            <form onSubmit={handleSave} className="p-4 bg-slate-50 border border-indigo-200 rounded-xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  {isCreatingNew ? 'Registrar Nuevo Usuario' : `Editar Usuario: ${editingUser?.name}`}
                </span>
                <button
                  type="button"
                  onClick={() => { setIsCreatingNew(false); setEditingUser(null); }}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Dr. Juan Pérez"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Correo Electrónico (Login)</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="usuario@auditadvas.com"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Contraseña</label>
                  <input
                    type="text"
                    required={isCreatingNew}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Departamento / Área</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="Ej. Auditoría Médica"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Rol Principal</label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="ADMIN_ROOT">ADMIN ROOT (Superadministrador)</option>
                    <option value="ADMINISTRATIVO">ADMINISTRATIVO DE AUDITORÍA</option>
                    <option value="AUDITOR_MEDICO">AUDITOR MÉDICO</option>
                    <option value="FACTURACION">FACTURACIÓN / EMISIÓN</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Usuario Activo en el Sistema</span>
                  </label>
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-2">
                  Permisos Específicos Granulares para este Usuario:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-white p-3 rounded-lg border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={formPermissions.canEmitInitialRelation}
                      onChange={() => handleTogglePermission('canEmitInitialRelation')}
                      className="rounded text-indigo-600"
                    />
                    <span>Emitir Relación Inicial (Facturación)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={formPermissions.canReceiveAndConciliate}
                      onChange={() => handleTogglePermission('canReceiveAndConciliate')}
                      className="rounded text-indigo-600"
                    />
                    <span>Tachar y Aceptar Llegada (Cotejo)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={formPermissions.canDeliverToAuditors}
                      onChange={() => handleTogglePermission('canDeliverToAuditors')}
                      className="rounded text-indigo-600"
                    />
                    <span>Entregar Relación a Auditores</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={formPermissions.canAuditRecords}
                      onChange={() => handleTogglePermission('canAuditRecords')}
                      className="rounded text-indigo-600"
                    />
                    <span>Auditar, Glosar y Emitir Reporte</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={formPermissions.canConfirmAuditorOutput}
                      onChange={() => handleTogglePermission('canConfirmAuditorOutput')}
                      className="rounded text-indigo-600"
                    />
                    <span>Confirmar Recepción de Auditores</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={formPermissions.canManageBiopsias}
                      onChange={() => handleTogglePermission('canManageBiopsias')}
                      className="rounded text-indigo-600"
                    />
                    <span>Gestionar Biopsias y Pendientes</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={formPermissions.canDeliverToArs}
                      onChange={() => handleTogglePermission('canDeliverToArs')}
                      className="rounded text-indigo-600"
                    />
                    <span>Generar Relación Entrega a ARS</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={formPermissions.canDeliverToBilling}
                      onChange={() => handleTogglePermission('canDeliverToBilling')}
                      className="rounded text-indigo-600"
                    />
                    <span>Generar Entrega a Facturación</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={formPermissions.canReceiveInBilling}
                      onChange={() => handleTogglePermission('canReceiveInBilling')}
                      className="rounded text-indigo-600"
                    />
                    <span>Recibir y Conciliar en Facturación</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={formPermissions.canViewAllStages}
                      onChange={() => handleTogglePermission('canViewAllStages')}
                      className="rounded text-indigo-600"
                    />
                    <span>Ver Todas las Etapas del Pipeline</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={formPermissions.canManageUsers}
                      onChange={() => handleTogglePermission('canManageUsers')}
                      className="rounded text-indigo-600"
                    />
                    <span>Administrar Usuarios y Roles</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={formPermissions.canDeleteRecords}
                      onChange={() => handleTogglePermission('canDeleteRecords')}
                      className="rounded text-indigo-600"
                    />
                    <span>Eliminar Registros Definitivamente</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsCreatingNew(false); setEditingUser(null); }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-2xs cursor-pointer"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          )}

          {/* Users Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Usuario / Nombre</th>
                  <th className="py-2.5 px-3">Correo / Login</th>
                  <th className="py-2.5 px-3">Rol Asignado</th>
                  <th className="py-2.5 px-3">Departamento</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                          {u.avatar || u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          {u.id === activeUser.id && (
                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1 rounded">Sesión Actual</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {u.email}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${u.roleBadgeColor || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                        {u.roleName || u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {u.department}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.isActive !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleStartEdit(u)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                        title="Editar permisos o datos de usuario"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs shrink-0">
          <span className="text-slate-500">
            Los cambios en permisos se aplican inmediatamente al iniciar sesión con ese usuario.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  );
};

