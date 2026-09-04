import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  BadgeAlert,
  Building2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const RegisterPage: React.FC = () => {
  const { register, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    badgeNumber: '',
    department: '',
    role: 'OFFICER',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Security passphrases do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage('Passphrase must contain at least 8 characters.');
      return;
    }

    try {
      await register({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        badgeNumber: formData.badgeNumber,
        department: formData.department,
        requestedRole: formData.role,
      });

      setIsRegistered(true);
      showToast('Registration Submitted', 'Your account is pending administrator approval.', 'success');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message || error.message || 'Registration failed.';
      setErrorMessage(msg);
      showToast('Registration Failed', msg, 'error');
    }
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen w-full bg-slate-100 flex flex-col justify-center items-center px-4 py-8">
        <div className="relative w-full max-w-md z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-amber-50 border border-amber-200 shadow-2xs mb-3 text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Registration Pending Approval
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Police Asset Management System
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-6 sm:p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>

            <h2 className="text-sm font-bold text-slate-900 mb-2">
              Account Under Review
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Your registration has been submitted and is awaiting administrator approval.
              You will be able to sign in once an administrator reviews and approves your account.
            </p>

            <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-800 text-left space-y-1">
              <div className="font-medium">What happens next:</div>
              <ul className="space-y-1 ml-4 list-disc text-blue-700">
                <li>An administrator will review your registration details</li>
                <li>Your departmental role will be assigned during approval</li>
                <li>You will receive access once approved</li>
              </ul>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                <span>Return to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="mt-4 text-center text-[11px] text-slate-400">
            CONFIDENTIAL LAW ENFORCEMENT RECORD SYSTEM
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col justify-center items-center px-4 py-8 selection:bg-blue-600 selection:text-white">
      <div className="relative w-full max-w-lg z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 shadow-2xs mb-3 text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Account Registration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Police Asset Management System
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
          <div className="mb-4 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <div className="font-medium">Administrator Approval Required</div>
            <p className="mt-1 text-amber-700">
              Your account will be reviewed by an administrator before activation. You cannot log in until approved.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-fullName" className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="reg-fullName"
                    type="text"
                    required
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Alex Rivera"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-badgeNumber" className="block text-xs font-medium text-slate-700 mb-1">
                  Badge / ID Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <BadgeAlert className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="reg-badgeNumber"
                    type="text"
                    required
                    name="badgeNumber"
                    value={formData.badgeNumber}
                    onChange={handleChange}
                    placeholder="B-9140"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-medium text-slate-700 mb-1">
                Departmental Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  id="reg-email"
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex.rivera@police.dept.gov"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-department" className="block text-xs font-medium text-slate-700 mb-1">
                Department / Unit
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <input
                  id="reg-department"
                  type="text"
                  required
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Sector 3 Patrol"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-role" className="block text-xs font-medium text-slate-700 mb-1">
                Requested Role <span className="text-rose-600">*</span>
              </label>
              <select
                id="reg-role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="OFFICER">Patrol Officer</option>
                <option value="STORE_KEEPER">Supply Officer</option>
                <option value="AUDITOR">Compliance Inspector</option>
                <option value="VIEWER">Viewer (Read Only)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Your requested role will be reviewed by an administrator.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-password" className="block text-xs font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="reg-confirmPassword" className="block text-xs font-medium text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="reg-confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Submitting Registration...</span>
                ) : (
                  <>
                    <span>Submit Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-5 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center text-[11px] text-slate-400">
          CONFIDENTIAL LAW ENFORCEMENT RECORD SYSTEM
        </div>
      </div>
    </div>
  );
};
