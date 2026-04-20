import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { ShieldCheck, Eye, Network } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const allowLocalGoogle = String(process.env.REACT_APP_GOOGLE_ALLOW_LOCALHOST || '').toLowerCase() === 'true';
  const googleLoginEnabled = Boolean(process.env.REACT_APP_GOOGLE_CLIENT_ID) && (!isLocalhost || allowLocalGoogle);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleRedirect = (role) => {
    if (role === 'admin') navigate('/');
    else if (role === 'caretaker') navigate('/caretaker');
    else if (role === 'warden') navigate('/warden');
    else navigate('/student');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success('Welcome back!');
      handleRedirect(data.user.role);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async credentialResponse => {
    setLoading(true);
    try {
      const data = await googleLogin(credentialResponse.credential);
      toast.success('Welcome! Signed in with Google.');
      handleRedirect(data.user.role);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google sign-in was cancelled or failed.');
  };

  return (
    <div className="flex min-h-screen bg-brand-bg">
      {/* Left Panel - Desktop Only */}
      <div className="hidden md:flex md:w-2/5 bg-brand-sidebar flex-col items-center justify-center px-12 py-12">
        <div className="max-w-sm text-center">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="h-[72px] w-[72px] rounded-full bg-white flex items-center justify-center">
              <img
                src="/bit-hostel-logo.png"
                alt="Bannari Amman Institute of Technology"
                className="h-16 w-16 object-contain"
              />
            </div>
          </div>

          {/* College Name */}
          <h1 className="text-2xl font-bold text-white font-display mb-2">
            Bannari Amman Institute of Technology
          </h1>

          {/* Tagline */}
          <p className="text-base text-white/60 mb-8">
            Hostel Management Portal
          </p>

          {/* Decorative Line */}
          <div className="h-px bg-white/15 my-8" />

          {/* Features */}
          <div className="space-y-4 text-white/60">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-white/70 flex-shrink-0" />
              <span className="text-sm">Secure role-based access</span>
            </div>
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-white/70 flex-shrink-0" />
              <span className="text-sm">Real-time room & complaint tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <Network className="h-5 w-5 text-white/70 flex-shrink-0" />
              <span className="text-sm">Managed by Hostel Administration</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full md:w-3/5 flex-col items-center justify-center px-4 py-8 md:py-0">
        <div className="w-full max-w-[380px]">
          {/* Mobile Logo */}
          <div className="md:hidden mb-8 flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-white border-2 border-brand-border flex items-center justify-center mb-4">
              <img
                src="/bit-hostel-logo.png"
                alt="Logo"
                className="h-14 w-14 object-contain"
              />
            </div>
            <h2 className="text-xl font-bold text-brand-text font-display text-center">
              Hostel Management Portal
            </h2>
          </div>

          {/* Card */}
          <div className="rounded-xl border border-brand-border bg-white shadow-sm p-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-brand-text font-display">
                Sign In
              </h1>
              <p className="text-sm text-brand-muted mt-1">
                Enter your credentials to continue
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div>
                <label htmlFor="login-username" className="block text-sm font-medium text-brand-text mb-1.5">
                  Username
                </label>
                <input
                  id="login-username"
                  type="text"
                  placeholder="Enter your username"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  autoComplete="username"
                  className="h-10 w-full rounded-lg border border-brand-border bg-white px-3.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-brand-text mb-1.5">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  className="h-10 w-full rounded-lg border border-brand-border bg-white px-3.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="h-10 w-full rounded-lg bg-brand-primary hover:bg-brand-primaryLight text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Google Login */}
            {googleLoginEnabled && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-brand-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-brand-muted">or continue with</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                  />
                </div>
              </>
            )}

            {!googleLoginEnabled && (
              <p className="mt-6 text-center text-xs text-brand-muted">
                Google sign-in is disabled for this environment.
              </p>
            )}

            {/* Footer */}
            <div className="mt-6 border-t border-brand-border pt-4 text-center text-xs text-brand-muted">
              Bannari Amman Institute of Technology © 2025
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
