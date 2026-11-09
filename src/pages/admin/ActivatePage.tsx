import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/brand/Logo';
import { useSeo } from '@/lib/seo';

export default function ActivatePage() {
  const { session, loading, role } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  useSeo({ title: 'Establecer contraseña', noindex: true });
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return; }
    setSaving(true); setError('');
    try {
      const { error: failure } = await supabase.auth.updateUser({ password });
      if (failure) throw failure;
      setPassword(''); setConfirmation('');
      navigate(role ? '/admin' : '/admin/login', { replace: true });
    } catch { setError('No se pudo guardar. Revisa la contraseña o solicita un enlace nuevo desde el acceso.'); }
    finally { setSaving(false); }
  }
  return <main className="grid min-h-dvh place-items-center bg-ink p-5">
    <section className="panel w-full max-w-md space-y-6 p-7">
      <Logo /><h1 className="text-3xl font-bold">Tu acceso al equipo</h1>
      {loading ? <p role="status">Verificando el enlace…</p> : !session ? <><p className="text-mute">El enlace venció o ya fue utilizado. Solicita uno nuevo para establecer tu contraseña.</p><Link className="btn-primary" to="/admin/login">Ir al acceso</Link></> :
        <form className="space-y-5" onSubmit={submit}>
          <p className="text-sm text-mute">Define una contraseña de al menos 12 caracteres para volver a entrar con tu correo.</p>
          <label className="field">Nueva contraseña<input className="input" type="password" autoComplete="new-password" required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <label className="field">Repite la contraseña<input className="input" type="password" autoComplete="new-password" required minLength={12} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></label>
          {error && <p role="alert" className="text-sm text-card">{error}</p>}
          <button disabled={saving} className="btn-volt w-full">{saving ? 'Guardando…' : 'Guardar contraseña'}</button>
        </form>}
    </section>
  </main>;
}
