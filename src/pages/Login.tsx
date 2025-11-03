import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login(){
  const { signIn, session, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && session) return <Navigate to="/" replace />;

  async function onSubmit(e){
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await signIn(email.trim(), password);
    if ((res as any)?.error){
      setError((res as any).error?.message || 'Login failed');
      setSubmitting(false);
      return;
    }
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 p-4">
      <div className="w-full max-w-sm card p-6">
        <div className="text-center mb-4">
          <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600" />
          <div className="text-xl font-semibold">Welcome Back</div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">Please enter login credentials.</div>
        </div>
        {error && <div className="mb-3 text-sm rounded p-2 border text-red-700 border-red-300 bg-red-50 dark:text-red-400 dark:border-red-700 dark:bg-red-950/40">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-neutral-700 dark:text-neutral-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              className="mt-1 w-full input"
              placeholder="Email address"
              required
            />
          </div>
          <div>
            <label className="text-sm text-neutral-700 dark:text-neutral-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              className="mt-1 w-full input"
              placeholder="Password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed rounded-md py-2 font-medium"
          >{submitting ? 'Logging in...' : 'Log in'}</button>
        </form>
      </div>
    </div>
  );
}
