import React from 'react';
import { Bell, Building2, CalendarDays, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TopNavBar({ pageTitle, brandingContent, theme = 'admin' }) {
  const { user } = useAuth();
  const initials = user?.name?.charAt(0)?.toUpperCase() || 'U';
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  // Theme configurations for different roles
  const themeConfig = {
    admin: {
      text: 'text-blue-700',
      avatar: 'from-blue-400 to-blue-600',
      border: 'border-blue-300'
    },
    warden: {
      text: 'text-sky-700',
      avatar: 'from-sky-400 to-sky-600',
      border: 'border-sky-300'
    },
    student: {
      text: 'text-purple-700',
      avatar: 'from-purple-400 to-purple-600',
      border: 'border-purple-300'
    },
    caretaker: {
      text: 'text-orange-700',
      avatar: 'from-orange-400 to-orange-600',
      border: 'border-orange-300'
    }
  };

  const currentTheme = themeConfig[theme] || themeConfig.admin;
  const collegePrimary = 'var(--college-primary, #0891b2)';
  const collegeSecondary = 'var(--college-secondary, #0f172a)';
  const collegeRing = 'var(--college-ring, #cffafe)';
  const isAdminTheme = theme === 'admin';

  return (
    <div className={`sticky top-0 z-30 border-b backdrop-blur-xl ${isAdminTheme ? 'border-slate-300/60 bg-[#f4f7fb]/82' : 'border-[#F1F5F9] bg-white/90'}`}>
      <div className="flex h-[72px] items-center justify-between gap-4 px-14 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isAdminTheme ? 'bg-slate-900 text-cyan-300' : 'bg-slate-100 text-slate-600'}`}>
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isAdminTheme ? 'text-slate-500' : 'text-slate-400'}`}>Reports & Analytics</div>
            <h2 className={`truncate text-[1.05rem] font-black tracking-[-0.02em] ${isAdminTheme ? 'text-slate-900' : 'text-slate-900'}`}>{pageTitle}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`hidden items-center gap-2 rounded-xl border px-3 py-2 md:flex ${isAdminTheme ? 'border-slate-300/60 bg-white/85 text-slate-700' : 'bg-slate-100'}`}>
            <Search className={`h-4 w-4 ${isAdminTheme ? 'text-slate-500' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Search modules..."
              className={`w-48 bg-transparent text-sm focus:outline-none ${isAdminTheme ? 'text-slate-900 placeholder:text-slate-400' : 'text-slate-700 placeholder:text-slate-400'}`}
            />
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-cyan-200/70 bg-cyan-50/70 px-3 py-2 md:flex">
            <CalendarDays className="h-4 w-4 text-cyan-700" />
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-800">{today}</span>
          </div>

          <button className={`relative rounded-xl border p-2 transition-all duration-200 ease-in-out ${isAdminTheme ? 'border-slate-300/60 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
            <Bell className="h-4 w-4" />
            <span className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ${isAdminTheme ? 'bg-rose-500' : 'bg-red-500'}`} />
          </button>

          <div className={`h-8 w-px ${isAdminTheme ? 'bg-slate-300' : 'bg-slate-200'}`} />

          <div className="text-right">
            <div className={`text-sm font-semibold ${isAdminTheme ? 'text-slate-900' : 'text-slate-900'}`}>{user?.name || 'User'}</div>
            <div className={`text-[10px] uppercase tracking-[0.16em] ${isAdminTheme ? 'text-slate-500' : 'text-slate-400'}`}>Administrator</div>
          </div>

          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-bold text-white"
            style={{
              backgroundImage: isAdminTheme
                ? 'linear-gradient(135deg, #0891b2, #0e7490)'
                : `linear-gradient(135deg, ${collegePrimary}, ${collegeSecondary})`,
              borderColor: isAdminTheme ? '#a5f3fc' : collegeRing,
            }}
          >
            {initials}
          </div>
          <div className="hidden">{brandingContent || currentTheme.text}</div>
        </div>
      </div>
    </div>
  );
}
