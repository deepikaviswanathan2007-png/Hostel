import React from 'react';
import { Bell, Building2, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TopNavBar({ pageTitle, brandingContent, theme = 'admin' }) {
  const { user } = useAuth();
  const initials = user?.name?.charAt(0)?.toUpperCase() || 'U';

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
  const collegePrimary = 'var(--college-primary, #2563EB)';
  const collegeSecondary = 'var(--college-secondary, #1D4ED8)';
  const collegeRing = 'var(--college-ring, #DBEAFE)';

  return (
    <div className="sticky top-0 z-30 h-16 border-b border-[#F1F5F9] bg-white">
      <div className="flex h-full items-center justify-between gap-4 px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Admin Panel</div>
            <h2 className="truncate text-base font-bold text-slate-900">{pageTitle}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-2 md:flex">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search..."
              className="w-44 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <button className="relative rounded-full bg-slate-100 p-2 text-slate-600 transition-all duration-200 ease-in-out hover:bg-slate-200 hover:text-slate-900">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <div className="h-7 w-px bg-slate-200" />

          <div className="hidden text-right sm:block">
            <div className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{theme}</div>
          </div>

          <div
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold text-white"
            style={{
              backgroundImage: `linear-gradient(135deg, ${collegePrimary}, ${collegeSecondary})`,
              borderColor: collegeRing,
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
