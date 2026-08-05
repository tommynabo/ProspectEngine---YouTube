import React, { useState } from 'react';
import { Activity, ArrowRight, Lock, Mail, User, AlertCircle } from 'lucide-react';

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
}

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        if (!fullName.trim()) {
          throw new Error('El nombre completo es obligatorio');
        }
        if (password.length < 8) {
          throw new Error('La contraseña debe tener al menos 8 caracteres');
        }
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'register', email, password, full_name: fullName }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Error al crear cuenta');
        const { token, user } = json.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_id', user.id);
        onLogin(user);
      } else {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', email, password }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Credenciales incorrectas');
        const { token, user } = json.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_id', user.id);
        onLogin(user);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || (isRegistering ? 'Error al crear cuenta. Verifica tus datos.' : 'Error al iniciar sesión. Verifica tus credenciales.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 mb-4">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Prospect Engine</h1>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email Corporativo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-secondary/50 border border-input rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-all text-gray-900 placeholder:text-gray-500"
                  placeholder="admin@empresa.com"
                />
              </div>
            </div>

            {isRegistering && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nombre Completo</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    required={isRegistering}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-secondary/50 border border-input rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-all text-gray-900 placeholder:text-gray-500"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Contraseña</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-secondary/50 border border-input rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-all text-gray-900 placeholder:text-gray-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 rounded-lg font-semibold text-sm transition-all bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'} <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-primary hover:underline"
            >
              {isRegistering ? '¿Ya tienes una cuenta? Iniciar Sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}