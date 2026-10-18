import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractApiError } from '../api/axios';
import { ArrowRight } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', matric_no: '', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handle = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      if (!user) {
        navigate('/login', { state: { notice: 'Account created. Please sign in.' } });
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      setError(extractApiError(err, 'Registration failed. Please check your details.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[460px]">
          <h1 className="font-display font-bold text-[32px] tracking-tight">Create account</h1>
          <p className="text-sm text-zinc-500 mt-2">Join the FUPRE campus marketplace.</p>

          <form onSubmit={handle} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm p-3">{error}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold" htmlFor="register-name">Full Name</label>
                <input
                  id="register-name"
                  value={form.name}
                  onChange={update('name')}
                  required
                  className="mt-1.5 w-full h-12 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white focus:border-zinc-200 focus:ring-4 focus:ring-brand-500/10 outline-none text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold" htmlFor="register-email">Email</label>
                <input
                  id="register-email"
                  value={form.email}
                  onChange={update('email')}
                  required
                  type="email"
                  autoComplete="email"
                  className="mt-1.5 w-full h-12 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white focus:border-zinc-200 outline-none text-sm"
                  placeholder="you@fupre.edu.ng"
                />
              </div>
              <div>
                <label className="text-xs font-semibold" htmlFor="register-matric">Matric No (optional)</label>
                <input
                  id="register-matric"
                  value={form.matric_no}
                  onChange={update('matric_no')}
                  className="mt-1.5 w-full h-12 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white focus:border-zinc-200 outline-none text-sm"
                  placeholder="ENG2001234"
                />
              </div>
              <div>
                <label className="text-xs font-semibold" htmlFor="register-department">Department</label>
                <input
                  id="register-department"
                  value={form.department}
                  onChange={update('department')}
                  className="mt-1.5 w-full h-12 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white focus:border-zinc-200 outline-none text-sm"
                  placeholder="Computer Science"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold" htmlFor="register-password">Password</label>
                <input
                  id="register-password"
                  value={form.password}
                  onChange={update('password')}
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-1.5 w-full h-12 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white focus:border-zinc-200 outline-none text-sm"
                  placeholder="At least 8 characters"
                />
                <p className="text-[11px] text-zinc-500 mt-1.5">Use at least 8 characters. Common passwords are rejected.</p>
              </div>
            </div>
            <button
              disabled={loading}
              className="w-full h-12 rounded-full bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Creating...' : <>Create account <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-zinc-500">
            Have an account? <Link to="/login" className="font-semibold text-zinc-900 underline">Log in</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:block relative overflow-hidden bg-zinc-50 border-l border-zinc-100">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="relative h-full p-12 flex flex-col justify-center">
          <div className="rounded-[28px] bg-white border border-zinc-100 shadow-card p-8 max-w-[420px]">
            <div className="h-10 w-10 rounded-full premium-gradient grid place-items-center text-white font-bold mb-4">✓</div>
            <h3 className="font-display font-bold text-[20px]">Why FUPRE Market?</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-600">
              <li>• One place for campus listings instead of scattered group chats</li>
              <li>• Availability status keeps listings current</li>
              <li>• Message the seller without sharing private contact details</li>
              <li>• Admin moderation for accounts and listings</li>
              <li>• Works on phone and desktop</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
