import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import { useAuth } from '../../hooks/useAuth';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (!form.name || !form.email || form.password.length < 6) {
      setError('Enter your name, email, and a password with at least 6 characters.');
      return;
    }
    signIn({ access_token: 'demo-token', user: { name: form.name, email: form.email, role: 'student' } });
    navigate('/dashboard');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Register</h1>
          <p className="text-sm text-slate-500">Create your Learnify account.</p>
        </div>
        <ErrorMessage message={error} />
        <input className="w-full rounded-md border border-slate-200 px-3 py-2" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="w-full rounded-md border border-slate-200 px-3 py-2" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="w-full rounded-md border border-slate-200 px-3 py-2" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <Button type="submit" className="w-full">Register</Button>
        <p className="text-center text-sm text-slate-500">
          Already have an account? <Link className="font-semibold text-indigo-700" to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
};

export default RegisterPage;
