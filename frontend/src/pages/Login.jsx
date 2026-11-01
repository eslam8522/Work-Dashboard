import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { homePathFor } from '../lib/roles';

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // api.js leaves a note here when it signs someone out (expired session / suspended account).
  useEffect(() => {
    const note = localStorage.getItem('authMessage');
    if (note) {
      setError(note);
      localStorage.removeItem('authMessage');
    }
  }, []);

  const finish = (data) => {
    login(data);
    navigate(homePathFor(data.role), { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', form);
      finish(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reach the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    setError('');
    try {
      const { data } = await api.post('/api/auth/google', { token: credentialResponse.credential });
      finish(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Google authentication failed');
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-card__lead">Sign in to your DashBoard account.</p>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="email">Email</label>
          <input id="email" className="input-field" type="email" autoComplete="email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

          <label className="field-label" htmlFor="password">Password</label>
          <input id="password" className="input-field" type="password" autoComplete="current-password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {GOOGLE_ENABLED && (
          <>
            <div className="auth-divider">or</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin onSuccess={handleGoogle} onError={() => setError('Google login window was closed or failed.')} />
            </div>
          </>
        )}

        <p className="auth-card__foot">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
