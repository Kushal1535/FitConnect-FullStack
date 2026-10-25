import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Server,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useApiConfig } from '../context/ApiConfigContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'STAFF'>('ADMIN');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { isMockMode, apiBaseUrl, openApiGuide } = useApiConfig();
  const navigate = useNavigate();

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await login(email, password);
      showSuccess('Welcome Back', 'Authentication successful. Redirecting to dashboard...');
      navigate('/dashboard');
    } catch (err: any) {
      showError('Authentication Failed', err.message || 'Invalid credentials or server unavailable.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white mx-auto shadow-sm">
          <Dumbbell className="w-6 h-6" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Fit Connect
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Fitness Operations & Client Communication Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200 rounded-xl shadow-sm">
          {/* Spring Boot Connection Banner */}
          <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2.5">
            <Server className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-slate-800">
                Spring Boot JWT Contract:
              </span>{' '}
              Sends <code className="text-[11px] font-mono bg-slate-200 px-1 py-0.5 rounded">POST /api/auth/login</code>.
              Mode: <span className="font-semibold text-emerald-700">{isMockMode ? 'Mock Prototype' : `Live (${apiBaseUrl})`}</span>.
              <button
                type="button"
                onClick={openApiGuide}
                className="ml-1 text-emerald-700 hover:text-emerald-800 underline font-medium"
              >
                Inspect Contract
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email Address</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@fitconnect.com"
                  className={`block w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${formErrors.email
                    ? 'border-rose-300 focus:ring-rose-500 text-rose-900'
                    : 'border-slate-300 focus:ring-emerald-500 text-slate-900'
                    }`}
                />
              </div>
              {formErrors.email && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`block w-full pl-9 pr-10 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${formErrors.password
                    ? 'border-rose-300 focus:ring-rose-500 text-rose-900'
                    : 'border-slate-300 focus:ring-emerald-500 text-slate-900'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Authenticating with Spring Boot...</span>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>

            <div className="mt-5">
              <p className="text-xs font-semibold text-slate-500 text-center mb-3">
                SELECT YOUR ROLE
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('ADMIN');
                    setEmail('');
                    setPassword('');
                    setFormErrors({});
                    setShowPassword(false);
                  }}
                  aria-pressed={selectedRole === 'ADMIN'}
                  className={`py-2.5 px-4 rounded-lg border text-sm font-semibold transition-colors ${selectedRole === 'ADMIN'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-700 ring-1 ring-emerald-600'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  ADMIN
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('STAFF');
                    setEmail('');
                    setPassword('');
                    setFormErrors({});
                    setShowPassword(false);
                  }}
                  aria-pressed={selectedRole === 'STAFF'}
                  className={`py-2.5 px-4 rounded-lg border text-sm font-semibold transition-colors ${selectedRole === 'STAFF'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-700 ring-1 ring-emerald-600'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  STAFF
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
