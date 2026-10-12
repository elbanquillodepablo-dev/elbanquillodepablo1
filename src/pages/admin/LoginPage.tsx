import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/brand/Logo';

export default function LoginPage() {
  const { session, isAdmin, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (session && isAdmin) return <Navigate to={from} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stadium-glow grid min-h-dvh place-items-center bg-ink p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm animate-fade-up space-y-5 panel p-7 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)]">
        <Logo />
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight"><Lock className="size-6 text-volt" /> Vestuario</h1>
          <p className="text-sm text-mute">Acceso solo para administración.</p>
        </div>
        <label className="field">Correo
          <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">Contraseña
          <input className="input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p role="alert" className="text-sm font-semibold text-card">{error}</p>}
        <button disabled={loading} className="btn-primary h-12 w-full">{loading ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </div>
  );
}
