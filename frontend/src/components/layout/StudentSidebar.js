import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Bell, ClipboardList, LayoutGrid, LogOut, Menu, UserRound, X, Building2, CalendarRange, RefreshCcw, Coffee, Users, UserPlus, BedDouble } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { to: '/student', label: 'Dashboard', icon: LayoutGrid, end: true },
      { to: '/student/profile', label: 'Profile', icon: UserRound },
    ]
  },
  {
    title: 'Hostel & Room',
    items: [
      { to: '/student/my-room', label: 'My Room', icon: BedDouble },
      { to: '/student/applications', label: 'Hostel Application', icon: Building2 },
      { to: '/student/mess-menu', label: 'Mess Menu', icon: Coffee },
    ]
  },
  {
    title: 'Requests & Applications',
    items: [
      { to: '/student/attendance', label: 'Attendance', icon: CalendarRange },
      { to: '/student/requests', label: 'Requests', icon: RefreshCcw },
      { to: '/student/visitors', label: 'Visitor Request', icon: UserPlus },
      { to: '/student/outpass', label: 'Outpass', icon: ClipboardList },
    ]
  },
  {
    title: 'Support & Info',
    items: [
      { to: '/student/complaints', label: 'Complaints', icon: ClipboardList },
      { to: '/student/notices', label: 'Notices', icon: Bell },
      { to: '/student/staff-directory', label: 'Staff Directory', icon: Users },
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
          ? 'bg-brand-primary/10 text-brand-primary border-l-4 border-brand-primary'
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

export default function StudentSidebar({ children }) {
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
  const activeItem = allItems.find(item => (item.to === '/student' ? location.pathname === '/student' : location.pathname.startsWith(item.to)));
  const pageTitle = activeItem?.label || 'Student Portal';
  const initials = user?.name?.charAt(0)?.toUpperCase() || 'S';

  return (
    <div className="min-h-screen bg-brand-surface font-sans">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-white/70 bg-white/85 shadow-[0_24px_60px_rgba(145,158,171,0.16)] backdrop-blur-xl lg:flex">
        <div className="border-b border-brand-border/70 px-6 py-6">
          <div className="flex items-center gap-3">
            <img src="/bit-hostel-logo.png" alt="BIT Logo" className="h-12 w-12 object-contain drop-shadow-sm" />
            <div className="leading-tight">
              <div className="text-[15px] font-bold text-gray-900">Bannari Amman</div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Student Portal</div>
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
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[13px] font-medium text-gray-600 transition-colors hover:bg-brand-primary/10 hover:text-brand-primary"
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
                className="rounded-xl bg-brand-primary/10 p-2 text-brand-primary lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                  <LayoutGrid className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-brand-muted">Student Workspace</div>
                  <span className="font-semibold text-gray-800">{pageTitle}</span>
                </div>
              </div>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <div className="rounded-[18px] border border-[#ece8ff] bg-[#f8f6ff] px-4 py-2">
                <div className="text-[11px] uppercase tracking-[0.16em] text-brand-muted">Logged in as</div>
                <div className="text-sm font-semibold text-gray-900">{user?.name || 'Student'}</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-[#7e57c2] text-sm font-bold text-white shadow-md">{initials}</div>
            </div>
          </div>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="fixed inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
            <div className="relative flex w-[272px] flex-col bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-brand-border/70 px-6 py-5">
                <div className="flex items-center gap-2">
                  <img src="/bit-hostel-logo.png" alt="BIT Logo" className="h-8 w-8 object-contain drop-shadow-sm" />
                  <div className="font-bold text-gray-800 text-sm">BIT Student Portal</div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="rounded-xl bg-gray-100 p-2 text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-5 space-y-4">
                {NAV_GROUPS.map((group, idx) => (
                  <div key={idx}>
                    <div className="px-6 mb-2 text-[11px] font-bold uppercase tracking-wider text-brand-muted/70">
                      {group.title}
                    </div>
                    <div className="space-y-0.5">
                      {group.items.map(item => (
                        <NavItem key={item.to + item.label} {...item} onClick={() => setMobileOpen(false)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-brand-border/70">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[13px] font-medium text-gray-600 transition-colors hover:bg-brand-primary/10 hover:text-brand-primary"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 px-6 py-4 lg:px-8">
          <div style={{ zoom: contentZoom }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
