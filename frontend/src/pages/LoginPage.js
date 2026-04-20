import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
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
    <div className="flex min-h-screen items-center justify-center bg-[#F0F2F5] px-4 py-8 text-[#333]">
      <div className="w-full max-w-[420px]">
        <div className="rounded-xl border border-gray-100 bg-white px-8 py-10 shadow-lg sm:px-10">
          <div className="mb-6 flex flex-col items-center gap-2">
            <img
              src="/bit-hostel-logo.png"
              alt="Bannari Amman Institute of Technology - Hostel"
              className="h-28 w-28 object-contain drop-shadow-sm"
            />
            <div className="text-center">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--college-primary, #2563EB)' }}>
                Bannari Amman Institute of Technology
              </div>
              <h1 className="mt-1 text-[18px] font-semibold tracking-wide text-gray-800">
                Hostel Management Portal
              </h1>
              <p className="mt-0.5 text-[12px] text-gray-400">Sign in to continue</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="mb-1 block text-[13px] font-medium text-gray-700 text-left">Username</label>
              <input
                id="login-username"
                type="text"
                placeholder="Enter your username"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="username"
                className="h-10 w-full rounded border border-[#e2e8f0] bg-[#f0f4f8] px-3 text-[14px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1"
                style={{ outlineColor: 'var(--college-primary, #2563EB)' }}
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1 block text-[13px] font-medium text-gray-700 text-left">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
                className="h-10 w-full rounded border border-[#e2e8f0] bg-[#f0f4f8] px-3 text-[14px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1"
                style={{ outlineColor: 'var(--college-primary, #2563EB)' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 h-10 w-full rounded text-[15px] font-medium text-white transition-colors focus:outline-none disabled:opacity-50"
              style={{ backgroundColor: 'var(--college-primary, #2563EB)' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {googleLoginEnabled && (
            <>
              <div className="my-5 text-center text-[13px] text-gray-600">Or</div>

              <div className="flex justify-center">
                <div className="overflow-hidden rounded border border-gray-200 bg-white">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                  />
                </div>
              </div>
            </>
          )}

          {!googleLoginEnabled && (
            <p className="mt-4 text-center text-[12px] text-gray-400">
              Google sign-in is disabled for this environment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
