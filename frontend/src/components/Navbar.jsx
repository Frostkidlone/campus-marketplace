import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut, LayoutDashboard, MessageCircle, Heart, Search, Menu, X, Shield, User,
} from 'lucide-react';

const linkClass = 'h-9 px-4 rounded-full bg-zinc-100 text-sm font-medium inline-flex items-center gap-1.5 hover:bg-zinc-200 transition';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const close = () => setOpen(false);
  const handleLogout = () => {
    logout();
    close();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-zinc-100">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 h-[64px] flex items-center justify-between">
        <Link to="/" onClick={close} className="font-display font-bold text-xl tracking-tight">
          FUPRE Market
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/products" className={linkClass}>
            <Search className="h-4 w-4" /> Browse
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className={linkClass}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              <Link to="/messages" className={linkClass}>
                <MessageCircle className="h-4 w-4" /> Messages
              </Link>
              <Link to="/favorites" className="h-9 w-9 rounded-full bg-zinc-100 grid place-items-center hover:bg-zinc-200" aria-label="Saved listings">
                <Heart className="h-4 w-4" />
              </Link>
              {isAdmin && (
                <Link to="/admin" className="h-9 px-4 rounded-full bg-zinc-900 text-white text-sm font-medium inline-flex items-center gap-1.5">
                  <Shield className="h-4 w-4" /> Admin
                </Link>
              )}
              <Link to="/profile" className="h-9 w-9 rounded-full bg-zinc-900 text-white grid place-items-center font-bold text-sm" aria-label="Your profile">
                {user.first_name?.[0] || user.username?.[0] || <User className="h-4 w-4" />}
              </Link>
              <button onClick={handleLogout} className="h-9 w-9 rounded-full bg-zinc-100 grid place-items-center hover:bg-zinc-200" aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass}>Log in</Link>
              <Link to="/register" className="h-9 px-4 rounded-full bg-zinc-900 text-white text-sm font-medium inline-flex items-center">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden h-10 w-10 rounded-full bg-zinc-100 grid place-items-center"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile navigation */}
      {open && (
        <div className="md:hidden border-t border-zinc-100 bg-white px-4 py-4 space-y-2">
          <Link to="/products" onClick={close} className="flex items-center gap-3 h-11 px-4 rounded-xl bg-zinc-50 text-sm font-medium">
            <Search className="h-4 w-4" /> Browse marketplace
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={close} className="flex items-center gap-3 h-11 px-4 rounded-xl bg-zinc-50 text-sm font-medium">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              <Link to="/messages" onClick={close} className="flex items-center gap-3 h-11 px-4 rounded-xl bg-zinc-50 text-sm font-medium">
                <MessageCircle className="h-4 w-4" /> Messages
              </Link>
              <Link to="/favorites" onClick={close} className="flex items-center gap-3 h-11 px-4 rounded-xl bg-zinc-50 text-sm font-medium">
                <Heart className="h-4 w-4" /> Saved listings
              </Link>
              <Link to="/profile" onClick={close} className="flex items-center gap-3 h-11 px-4 rounded-xl bg-zinc-50 text-sm font-medium">
                <User className="h-4 w-4" /> Profile
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={close} className="flex items-center gap-3 h-11 px-4 rounded-xl bg-zinc-900 text-white text-sm font-medium">
                  <Shield className="h-4 w-4" /> Admin dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="flex items-center gap-3 h-11 px-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium w-full text-left">
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={close} className="flex items-center gap-3 h-11 px-4 rounded-xl bg-zinc-50 text-sm font-medium">
                Log in
              </Link>
              <Link to="/register" onClick={close} className="flex items-center gap-3 h-11 px-4 rounded-xl bg-zinc-900 text-white text-sm font-medium">
                Create account
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
