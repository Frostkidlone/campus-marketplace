import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractApiError } from '../api/axios';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.notice;
  const redirectTo = location.state?.from || '/dashboard';

  const handle = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(extractApiError(err, 'Could not sign in. Check your email and password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <h1 className="font-display font-bold text-[32px] tracking-tight">Welcome back</h1>
            <p className="text-sm text-zinc-500 mt-2">Log in to manage your listings and messages.</p>
          </div>

          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3 text-xs mb-6">
            <p className="font-semibold text-amber-900">Demo accounts (after seeding):</p>
            <p className="text-amber-800">Admin: admin@fupre.edu.ng / admin123</p>
            <p className="text-amber-800">Student: john@fupre.edu.ng / student123</p>
          </div>

          <form onSubmit={handle} className="space-y-4">
            {notice && (
              <div className="rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm p-3">{notice}</div>
            )}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm p-3">{error}</div>
            )}
            <div>
              <label className="text-xs font-semibold text-zinc-700" htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                autoComplete="email"
                placeholder="you@fupre.edu.ng"
                className="mt-1.5 w-full h-12 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white focus:border-zinc-200 focus:ring-4 focus:ring-brand-500/10 outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700" htmlFor="login-password">Password</label>
              <div className="relative mt-1.5">
                <input
                  id="login-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={show ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-12 px-4 pr-12 rounded-full bg-zinc-100 border border-transparent focus:bg-white focus:border-zinc-200 focus:ring-4 focus:ring-brand-500/10 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-full hover:bg-zinc-200"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              disabled={loading}
              className="w-full h-12 rounded-full bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : <><span>Sign in</span> <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-zinc-500">
            No account? <Link to="/register" className="font-semibold text-zinc-900 underline">Create one</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:block relative overflow-hidden bg-zinc-900">
        <div className="absolute inset-0 premium-gradient opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(at_20%_80%,white_0,transparent_50%)] opacity-20" />
        <div className="relative h-full flex flex-col justify-between p-12 text-white">
          <div>
            <div className="h-12 w-12 rounded-2xl bg-white text-zinc-900 grid place-items-center font-bold text-xl">F</div>
            <h2 className="font-display font-bold text-[36px] leading-[0.95] mt-10 max-w-[420px]">
              A marketplace that understands campus life.
            </h2>
            <p className="text-white/70 text-sm leading-6 mt-4 max-w-[420px]">
              Student accounts, organized listings, search and filtering, private buyer–seller messaging, and admin moderation.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/10">
              <p className="font-bold text-lg">Browse</p>
              <p className="text-xs text-white/70">Search by keyword, category, price</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/10">
              <p className="font-bold text-lg">Message</p>
              <p className="text-xs text-white/70">Contact the seller directly</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/10">
              <p className="font-bold text-lg">Moderate</p>
              <p className="text-xs text-white/70">Admin account and listing controls</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
