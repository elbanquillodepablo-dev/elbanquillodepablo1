import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/brand/Logo';
import { useSeo } from '@/lib/seo';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const { session, role, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  useSeo({ title: 'Acceso administración', noindex: true });

  if (session && role) return <Navigate to={from} replace />;

  const recover = async () => {
    if (!email.trim()) { setError('Escribe tu correo para solicitar el enlace.'); return; }
    setLoading(true); setError(''); setNotice('');
    try {
      const { error: failure } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin/activar` });
      if (failure) throw failure;
      setNotice('Si el correo tiene una cuenta, recibirá un enlace para establecer su contraseña. Revisa también spam.');
    } catch { setError('No se pudo enviar el enlace. Espera unos minutos e inténtalo de nuevo.'); }
    finally { setLoading(false); }
  };

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
        {notice && <p role="status" className="text-sm text-mute">{notice}</p>}
        <button disabled={loading} className="btn-primary h-12 w-full">{loading ? 'Entrando…' : 'Entrar'}</button>
        <button type="button" disabled={loading} onClick={recover} className="min-h-11 w-full text-sm text-volt underline underline-offset-4">Crear o recuperar mi contraseña</button>
      </form>
    </div>
  );
}
