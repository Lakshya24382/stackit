import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <h2>Create Account</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>Username</label>
        <input value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })} required />
        <label>Email</label>
        <input type="email" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} required />
        <label>Password</label>
        <input type="password" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })} required />
        <button type="submit" className="btn-primary">Register</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}