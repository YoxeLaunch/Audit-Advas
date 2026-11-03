import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  KeyRound, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus,
  User as UserIcon,
  Briefcase
} from 'lucide-react';
import { User, DEFAULT_ROLE_PERMISSIONS } from '../types';
import { loginUser, setCurrentSession, saveStoredUsers } from '../services/storage';
import { apiCreateUser, apiLogin } from '../services/apiService';

interface LoginViewProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
  onUserCreated?: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  onLoginSuccess,
  onUserCreated
}) => {
  const isFirstRunSetup = users.length === 0;

  // Estados de Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Estados de Configuración Inicial desde Cero (Crear Admin Root)
  const [rootName, setRootName] = useState('');
  const [rootEmail, setRootEmail] = useState('');
  const [rootPassword, setRootPassword] = useState('');
  const [rootDepartment, setRootDepartment] = useState('Dirección / Gestión de Calidad');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const authenticated = await apiLogin(email.trim(), password.trim());
      setCurrentSession(authenticated);
      onLoginSuccess(authenticated);
    } catch {
      const localMatch = loginUser(email, password);
      if (localMatch) {
        onLoginSuccess(localMatch);
      } else {
        setError('Credenciales incorrectas o usuario inactivo. Verifica el correo y la contraseña.');
        setIsLoading(false);
      }
    }
  };

  const handleFirstRunCreateRoot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootName.trim() || !rootEmail.trim() || !rootPassword.trim()) {
      setError('Por favor completa el nombre, correo y contraseña del Administrador Root.');
      return;
    }
    setError(null);
    setIsLoading(true);

    const avatar = rootName
      .trim()
      .split(/\s+/)
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AR';

    const newRootUser: User = {
      id: `usr_root_${Date.now()}`,
      name: rootName.trim(),
      email: rootEmail.trim().toLowerCase(),
      password: rootPassword.trim(),
      role: 'ADMIN_ROOT',
      roleName: 'Administrador Root',
      roleBadgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      department: rootDepartment.trim() || 'Dirección General',
      avatar,
      permissions: DEFAULT_ROLE_PERMISSIONS.ADMIN_ROOT,
      isActive: true
    };

    try {
      const createdId = await apiCreateUser(newRootUser);
      newRootUser.id = createdId || newRootUser.id;
    } catch (err) {
      console.error('Error guardando usuario inicial en SQLite:', err);
    }

    saveStoredUsers([newRootUser]);
    setCurrentSession(newRootUser);
    if (onUserCreated) {
      onUserCreated(newRootUser);
    }
    onLoginSuccess(newRootUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 font-sans">
      {/* Encabezado institucional */}
      <div className="text-center mb-6 max-w-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 text-xs font-semibold mb-3">
          <Building2 className="w-3.5 h-3.5" />
          <span>GESTION DE CALIDAD &bull; SISTEMA INTERNO</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Control de Expedientes y Auditoría
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Cadena de custodia, asignación médica, glosas, biopsias y entrega por aseguradora
        </p>
      </div>

      <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {isFirstRunSetup ? (
          <>
            {/* Encabezado: Configuración desde Cero */}
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 p-6 text-white text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-3 shadow-inner">
                <UserPlus className="w-7 h-7 text-purple-200" />
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-[10px] font-black uppercase tracking-wider mb-1">
                Instalación Limpia &bull; Sin Datos Precargados
              </span>
              <h2 className="text-lg font-bold">Configuración Inicial desde Cero</h2>
              <p className="text-xs text-purple-100/80 mt-1">
                Crea la primera cuenta <strong>Administrador Root</strong> para empezar a configurar usuarios, aseguradoras y expedientes.
              </p>
            </div>

            <form onSubmit={handleFirstRunCreateRoot} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre Completo del Administrador <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={rootName}
                    onChange={e => setRootName(e.target.value)}
                    placeholder="Ej. Administrador Principal"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-hidden text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Correo Electrónico de Acceso <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={rootEmail}
                    onChange={e => setRootEmail(e.target.value)}
                    placeholder="admin@institucion.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-hidden text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contraseña <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={rootPassword}
                      onChange={e => setRootPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 outline-hidden text-slate-900 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Departamento
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={rootDepartment}
                      onChange={e => setRootDepartment(e.target.value)}
                      placeholder="Gestión de Calidad"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 outline-hidden text-slate-900 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  Pasos siguientes al iniciar el sistema:
                </div>
                <p>1. Desde <strong>Usuarios y Permisos</strong> podrás crear las cuentas de cada rol (<em>Facturación</em>, <em>Administrativo</em> y <em>Auditores Médicos</em>).</p>
                <p>2. Desde <strong>Vigencias ARS (+)</strong> podrás registrar desde cero las Aseguradoras / Entidades y sus días límite de vencimiento.</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Inicializando Sistema...</span>
                ) : (
                  <>
                    <span>Crear Administrador Root e Iniciar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Encabezado de Login Estándar */}
            <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-slate-900 p-6 text-white text-center relative">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-3 shadow-inner">
                <Lock className="w-7 h-7 text-sky-200" />
              </div>
              <h2 className="text-xl font-bold">Iniciar Sesión en el Portal</h2>
              <p className="text-xs text-sky-100/80 mt-1">
                Cada rol accederá únicamente a las etapas autorizadas
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="usuario@institucion.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-hidden transition-all text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <span className="text-[11px] text-slate-400">Acceso por Rol</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-hidden transition-all text-slate-900 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="animate-pulse">Validando credenciales...</span>
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>

      <div className="text-center mt-6 text-xs text-slate-500">
        GESTION DE CALIDAD &bull; Control y Auditoría de Expedientes
      </div>
    </div>
  );
};
