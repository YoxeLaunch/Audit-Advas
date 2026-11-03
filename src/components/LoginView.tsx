import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  KeyRound, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  UserCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Stethoscope, 
  FileText, 
  CheckCircle2,
  Users
} from 'lucide-react';
import { User } from '../types';
import { loginUser } from '../services/storage';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const user = loginUser(email, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Credenciales incorrectas o usuario inactivo. Verifica el correo y la contraseña.');
        setIsLoading(false);
      }
    }, 300);
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const user = loginUser(demoEmail, demoPass);
      if (user) {
        onLoginSuccess(user);
      } else {
        setIsLoading(false);
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 font-sans">
      {/* Top institution tag */}
      <div className="text-center mb-6 max-w-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 text-xs font-semibold mb-3">
          <Building2 className="w-3.5 h-3.5" />
          <span>Gestión de Calidad Médica &bull; Sistema Oficial</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Control de Expedientes y Auditoría
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Cadena de custodia, asignación médica, glosas y entrega a facturación/ARS
        </p>
      </div>

      <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-slate-900 p-6 text-white text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-3 shadow-inner">
            <Lock className="w-7 h-7 text-sky-200" />
          </div>
          <h2 className="text-xl font-bold">Iniciar Sesión en el Portal</h2>
          <p className="text-xs text-sky-100/80 mt-1">
            Cada rol accederá únicamente a los módulos autorizados
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in duration-200">
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@auditadvas.com"
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-hidden transition-all text-slate-900 font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Contraseña
              </label>
              <span className="text-[11px] text-slate-400">Acceso Seguro</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

        {/* Demo Fast Login Selector */}
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Acceso Rápido por Rol (Cuentas Demo):
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Haz clic en cualquiera de los roles para autocompletar e ingresar de inmediato:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Admin Root */}
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@auditadvas.com', 'admin123')}
              className="p-2.5 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl text-left transition-all group cursor-pointer shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 group-hover:text-purple-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  ADMIN ROOT
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono">
                  admin123
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                Acceso total, usuarios y permisos
              </p>
            </button>

            {/* Administrativo */}
            <button
              type="button"
              onClick={() => handleQuickLogin('admin.auditoria@auditadvas.com', 'admin123')}
              className="p-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all group cursor-pointer shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 group-hover:text-blue-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  ADMINISTRATIVO
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                  admin123
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                Cotejo, entrega auditores y ARS
              </p>
            </button>

            {/* Auditor Médico */}
            <button
              type="button"
              onClick={() => handleQuickLogin('auditor.medico@auditadvas.com', 'auditor123')}
              className="p-2.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-left transition-all group cursor-pointer shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 group-hover:text-amber-700 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-amber-600" />
                  AUDITOR MÉDICO
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-mono">
                  auditor123
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                Recepción, glosas y reporte
              </p>
            </button>

            {/* Facturación */}
            <button
              type="button"
              onClick={() => handleQuickLogin('facturacion@auditadvas.com', 'factura123')}
              className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all group cursor-pointer shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 group-hover:text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  FACTURACIÓN
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono">
                  factura123
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                Emisión inicial y entrega final
              </p>
            </button>
          </div>
        </div>
      </div>

      <div className="text-center mt-6 text-xs text-slate-500">
        Hospital / Centro Médico &bull; Auditoría Médica Hospitalaria v3.0 &bull; República Dominicana
      </div>
    </div>
  );
};

