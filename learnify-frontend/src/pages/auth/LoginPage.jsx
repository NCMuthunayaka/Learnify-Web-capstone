import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import { useAuth } from '../../hooks/useAuth';
import * as authApi from '../../api/authApi';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await authApi.login({ email: form.email, password: form.password });
      if (response.success) {
        signIn({ access_token: response.token, user: response.user });
        navigate('/dashboard');
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Login</h1>
          <p className="text-sm text-slate-500">Continue to Learnify.</p>
        </div>
        <ErrorMessage message={error} />
        <input className="w-full rounded-md border border-slate-200 px-3 py-2" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} disabled={isLoading} />
        <input className="w-full rounded-md border border-slate-200 px-3 py-2" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} disabled={isLoading} />
        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Logging in...' : 'Login'}</Button>
        <p className="text-center text-sm text-slate-500">
          New here? <Link className="font-semibold text-indigo-700" to="/register">Create an account</Link>
        </p>
      </form>
    </main>
  );
};

export default LoginPage;
