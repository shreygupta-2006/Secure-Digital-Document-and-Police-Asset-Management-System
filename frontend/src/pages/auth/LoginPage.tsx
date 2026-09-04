import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both departmental email and password.');
      return;
    }

    try {
      await login({ email, password });
      showToast('Authentication Successful', 'Session initiated.', 'success');
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Authentication failed. Please verify credentials.';
      setErrorMessage(msg);
      showToast('Authentication Failed', msg, 'error');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col justify-center items-center px-4 py-8 selection:bg-blue-600 selection:text-white">
      <div className="relative w-full max-w-md z-10">
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 shadow-2xs mb-3 text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Police Asset Management System
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Internal Department Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Sign In with Department Account</span>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                Departmental Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer.name@police.dept.gov"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-xs font-medium text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div />
              <Link
                to="/register"
                className="text-xs text-blue-600 hover:text-blue-700 transition-colors font-medium"
              >
                Register Account
              </Link>
            </div>

            <button
              id="login-submit-button"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
            >
              {isLoading ? (
                <span>Validating Session...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-[11px] text-slate-500 space-y-0.5">
          <p>CONFIDENTIAL LAW ENFORCEMENT RECORD SYSTEM</p>
          <p className="text-slate-400">Authorized Personnel Only</p>
        </div>
      </div>
    </div>
  );
};
