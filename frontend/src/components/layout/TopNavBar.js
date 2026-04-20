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
  const isAdminTheme = theme === 'admin';

  return (
    <div className={`sticky top-0 z-30 h-16 border-b ${isAdminTheme ? 'border-brand-scroll bg-brand-secondarybg' : 'border-[#F1F5F9] bg-white'}`}>
      <div className="flex h-full items-center justify-between gap-4 px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isAdminTheme ? 'bg-brand-primarybg text-brand-secondarytext' : 'bg-slate-100 text-slate-600'}`}>
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isAdminTheme ? 'text-brand-secondarytext' : 'text-slate-400'}`}>Admin Panel</div>
            <h2 className={`truncate text-base font-bold ${isAdminTheme ? 'text-brand-text' : 'text-slate-900'}`}>{pageTitle}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`hidden items-center gap-2 rounded-full px-3 py-2 md:flex ${isAdminTheme ? 'bg-brand-primarybg' : 'bg-slate-100'}`}>
            <Search className={`h-4 w-4 ${isAdminTheme ? 'text-brand-secondarytext' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Search..."
              className={`w-44 bg-transparent text-sm focus:outline-none ${isAdminTheme ? 'text-brand-text placeholder:text-brand-secondarytext' : 'text-slate-700 placeholder:text-slate-400'}`}
            />
          </div>

          <button className={`relative rounded-full p-2 transition-all duration-200 ease-in-out ${isAdminTheme ? 'bg-brand-primarybg text-brand-secondarytext hover:bg-white hover:text-brand-text' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
            <Bell className="h-4 w-4" />
            <span className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ${isAdminTheme ? 'bg-brand-red' : 'bg-red-500'}`} />
          </button>

          <div className={`h-7 w-px ${isAdminTheme ? 'bg-brand-scroll' : 'bg-slate-200'}`} />

          <div className="hidden text-right sm:block">
            <div className={`text-sm font-semibold ${isAdminTheme ? 'text-brand-text' : 'text-slate-900'}`}>{user?.name || 'User'}</div>
            <div className={`text-[11px] uppercase tracking-[0.14em] ${isAdminTheme ? 'text-brand-secondarytext' : 'text-slate-400'}`}>{theme}</div>
          </div>

          <div
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold text-white"
            style={{
              backgroundImage: isAdminTheme
                ? 'linear-gradient(135deg, #7D53F6, #9F74F7)'
                : `linear-gradient(135deg, ${collegePrimary}, ${collegeSecondary})`,
              borderColor: isAdminTheme ? '#D1D1D1' : collegeRing,
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
