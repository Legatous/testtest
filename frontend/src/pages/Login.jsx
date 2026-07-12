import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    const ok = await login(email, password);
    setBusy(false);
    if (ok) navigate('/');
  }

  function fillDemo(role) {
    if (role === 'admin') {
      setEmail('admin@bookstore.com');
      setPassword('admin123');
    } else {
      setEmail('user@bookstore.com');
      setPassword('user123');
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Welcome back</h1>
        <p className="muted">
          Log in to browse the catalog and manage your orders.
        </p>

        {error && <div className="alert">{error}</div>}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button className="btn full" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>

        <div className="demo-row">
          <span>Try a demo account:</span>
          <button
            type="button"
            className="btn ghost small"
            onClick={() => fillDemo('admin')}
          >
            Admin
          </button>
          <button
            type="button"
            className="btn ghost small"
            onClick={() => fillDemo('user')}
          >
            User
          </button>
        </div>

        <p className="muted center">
          <Link to="/">Continue browsing as guest</Link>
        </p>

        <p className="muted center">
          No account? <Link to="/register">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
