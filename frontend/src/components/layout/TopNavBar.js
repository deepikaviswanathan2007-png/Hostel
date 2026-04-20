import React from 'react';
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
    <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-6 lg:px-8 gap-4">
        {/* Left: Page Title */}
        <div className="flex-1">
          <h2 className="text-lg font-bold tracking-tight" style={{ color: collegePrimary }}>
            {pageTitle}
          </h2>
        </div>

        {/* Right: User Info */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-lg font-bold text-black">
              {user?.name || 'User'}
            </div>
          </div>
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white text-sm shadow-md border-2 ${currentTheme.border}`}
            style={{
              backgroundImage: `linear-gradient(135deg, ${collegePrimary}, ${collegeSecondary})`,
              borderColor: collegeRing,
            }}
          >
            {initials}
          </div>
        </div>
      </div>
    </div>
  );
}
