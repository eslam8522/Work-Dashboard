import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { homePathFor } from '../lib/roles';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: 'WORKER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/register', form);
      login(data);
      navigate(homePathFor(data.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Create an account</h1>
        <p className="auth-card__lead">Join as a participant or publish your own studies.</p>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="email">Email</label>
          <input id="email" className="input-field" type="email" autoComplete="email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

          <label className="field-label" htmlFor="password">Password (min. 6 characters)</label>
          <input id="password" className="input-field" type="password" autoComplete="new-password" minLength={6} required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

          <label className="field-label" htmlFor="role">I want to</label>
          <select id="role" className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="WORKER">Participate in studies (Worker)</option>
            <option value="ADMIN">Publish studies (Researcher)</option>
          </select>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="auth-card__foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
