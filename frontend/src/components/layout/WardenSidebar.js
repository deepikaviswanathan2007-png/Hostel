import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Home, Users, FileText, LogOut, Menu, X, List, Building2, RefreshCcw, CalendarCheck, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { to: '/warden', label: 'Dashboard', icon: Home, end: true },
    ]
  },
  {
    title: 'Student Management',
    items: [
      { to: '/warden/students', label: 'Students', icon: Users },
      { to: '/warden/applications', label: 'Applications', icon: Building2 },
      { to: '/warden/requests', label: 'Requests', icon: RefreshCcw },
    ]
  },
  {
    title: 'Operations',
    items: [
      { to: '/warden/attendance', label: 'Attendance', icon: CalendarCheck },
      { to: '/warden/outpasses', label: 'Outpass Approvals', icon: Users },
      { to: '/warden/mess-menu', label: 'Mess Menu', icon: List },
      { to: '/warden/visitors', label: 'Visitors', icon: Users },
    ]
  },
  {
    title: 'Communication',
    items: [
      { to: '/warden/complaints', label: 'Complaints', icon: FileText },
      { to: '/warden/messages', label: 'Messages', icon: MessageSquare },
    ]
  }
];

function NavItem({ to, label, icon: Icon, onClick, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center justify-between px-6 py-2.5 text-[13px] font-medium transition-all duration-200 ${isActive
          ? 'bg-sky-500/10 text-sky-500 border-l-4 border-sky-500'
          : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
        }`
      }
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-400" />
    </NavLink>
  );
}

export default function WardenSidebar({ children }) {
  const contentZoom = 0.72;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allItems = NAV_GROUPS.flatMap(g => g.items);
  const activeItem = allItems.find(item => (item.to === '/warden' ? location.pathname === '/warden' : location.pathname.startsWith(item.to)));
  const pageTitle = activeItem?.label || 'Warden Dashboard';
  const initials = user?.name?.charAt(0)?.toUpperCase() || 'W';

  return (
    <div className="min-h-screen bg-brand-surface font-sans">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-white/70 bg-white/85 shadow-[0_24px_60px_rgba(145,158,171,0.16)] backdrop-blur-xl lg:flex">
        <div className="border-b border-brand-border/70 px-6 py-6">
          <div className="flex items-center gap-2">
            <img src="/bit-hostel-logo.png" alt="BIT Logo" className="h-12 w-12 object-contain drop-shadow-sm" />
            <div className="leading-tight">
              <div className="text-[14px] font-bold text-gray-900">Warden</div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Management Portal</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 space-y-4 custom-scrollbar">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx}>
              <div className="px-6 mb-2 text-[11px] font-bold uppercase tracking-wider text-brand-muted/70">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavItem key={item.to + item.label} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-brand-border/70">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[13px] font-medium text-gray-600 transition-colors hover:bg-sky-50 hover:text-sky-600"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-[272px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 px-6 pb-2 pt-4 lg:px-8">
          <div className="flex w-full items-center justify-between rounded-[28px] border border-white/70 bg-white/80 px-6 py-4 shadow-[0_18px_44px_rgba(145,158,171,0.12)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(open => !open)}
                className="rounded-xl bg-sky-50 p-2 text-sky-600 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-brand-muted">Warden Workspace</div>
                  <span className="font-semibold text-gray-800">{pageTitle}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-[18px] border border-sky-100 bg-sky-50 px-4 py-2 sm:block">
                <div className="text-[11px] uppercase tracking-[0.16em] text-brand-muted">Warden</div>
                <div className="text-sm font-semibold text-gray-900">{user?.name || 'Warden'}</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-sm font-bold text-white shadow-md">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto" style={{ zoom: contentZoom }}>
            {children}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="warden-mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
        )}
        {mobileOpen && (
          <motion.aside
            key="warden-mobile-sidebar"
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            exit={{ x: -250 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-white shadow-lg lg:hidden"
          >
            <div className="flex h-[80px] items-center justify-between px-6 border-b border-brand-border/70">
              <div className="flex items-center gap-2">
                <img src="/bit-hostel-logo.png" alt="BIT Logo" className="h-10 w-10 object-contain drop-shadow-sm" />
                <div className="leading-tight">
                  <div className="text-[14px] font-bold text-gray-900">Warden</div>
                  <div className="text-[12px] font-semibold text-gray-600">Portal</div>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-5 space-y-4">
              {NAV_GROUPS.map((group, idx) => (
                <div key={idx}>
                  <div className="px-6 mb-2 text-[11px] font-bold uppercase tracking-wider text-brand-muted/70">
                    {group.title}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map(item => (
                      <NavItem
                        key={item.to + item.label}
                        {...item}
                        onClick={() => setMobileOpen(false)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-4 border-t border-brand-border/70">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[13px] font-medium text-gray-600 transition-colors hover:bg-sky-50 hover:text-sky-600"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
