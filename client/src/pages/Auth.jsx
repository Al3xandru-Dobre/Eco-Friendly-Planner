import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorBanner, Field } from '../components/Primitives';
import { Leaf } from '../components/Icons';

function AuthShell({ title, lede, children, footer }) {
  return (
    <div className="container page" style={{ maxWidth: 480 }}>
      <div className="card card-body stack" style={{ padding: 28 }}>
        <div className="brand-mark" style={{ width: 44, height: 44, borderRadius: 14 }}><Leaf width={24} height={24} /></div>
        <div><h1 style={{ fontSize: '1.9rem', marginBottom: 4 }}>{title}</h1><p className="muted" style={{ margin: 0 }}>{lede}</p></div>
        {children}
        <div className="small muted" style={{ textAlign: 'center' }}>{footer}</div>
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from || '/trips', { replace: true });
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Cannot reach the planner API. Is the server running?' : err.message);
    } finally { setBusy(false); }
  }

  return (
    <AuthShell title="Welcome back" lede="Sign in to see your trips and bookings." footer={<>New here? <Link to="/register">Create an account</Link></>}>
      <form className="stack" onSubmit={submit}>
        <Field label="Email" htmlFor="email"><input id="email" type="email" className="input" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Password" htmlFor="password"><input id="password" type="password" className="input" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <ErrorBanner error={error} />
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </AuthShell>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords must match.'); return; }
    setBusy(true); setError(null);
    try {
      await register({ ...form, email: form.email.trim() });
      navigate('/trips/new', { replace: true });
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Cannot reach the planner API. Is the server running?' : err.message);
    } finally { setBusy(false); }
  }

  return (
    <AuthShell title="Create your account" lede="One login for trip planning and bookings." footer={<>Already have an account? <Link to="/login">Sign in</Link></>}>
      <form className="stack" onSubmit={submit}>
        <Field label="Name" htmlFor="name"><input id="name" className="input" autoComplete="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Email" htmlFor="remail"><input id="remail" type="email" className="input" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <div className="form-grid">
          <Field label="Password" htmlFor="rpassword" hint="At least 6 characters"><input id="rpassword" type="password" className="input" autoComplete="new-password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Confirm" htmlFor="rconfirm"><input id="rconfirm" type="password" className="input" autoComplete="new-password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></Field>
        </div>
        <ErrorBanner error={error} />
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
}
