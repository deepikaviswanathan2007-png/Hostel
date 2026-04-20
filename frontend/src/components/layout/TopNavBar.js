import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function TopNavBar({ pageTitle, brandingContent, theme = 'admin' }) {
  const { user } = useAuth();
  const initials = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="sticky top-0 z-30 border-b border-brand-border bg-white">
      <div className="flex h-14 items-center justify-between px-6 lg:px-8">
        {/* Left: Page Title */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
            Hostel Management Portal
          </div>
          <h2 className="text-[15px] font-semibold text-brand-text font-display truncate">
            {pageTitle}
          </h2>
        </div>

        {/* Right: User Info Block + Avatar */}
        <div className="flex items-center gap-3 ml-6">
          {/* User Name */}
          <div className="text-right hidden sm:block">
            <div className="text-[13px] font-medium text-brand-text">
              {user?.name || 'User'}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-6 w-px bg-brand-border" />

          {/* Avatar */}
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-white flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #1A3C6E, #2B5BA8)',
            }}
          >
            {initials}
          </div>
        </div>
      </div>
    </div>
  );
}
