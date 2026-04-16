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
      { to: '/student/outpass', label: 'Leave', icon: ClipboardList },
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
        `group flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-all duration-200 ${isActive
          ? 'bg-brand-primary text-white shadow-sm'
          : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-900'
        }`
      }
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-current opacity-60 transition-transform group-hover:translate-x-0.5" />
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[292px] flex-col border-r border-slate-200 bg-slate-50 shadow-[0_10px_35px_rgba(15,23,42,0.08)] lg:flex">
        <div className="border-b border-slate-200 px-6 py-6 bg-white/70">
          <div className="flex items-center gap-2">
            <img src="/bit-hostel-logo.png" alt="Bannari Amman Institute of Technology Logo" className="h-[38px] w-[38px] object-contain drop-shadow-sm" />
            <div className="leading-tight">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-900 leading-tight">Bannari Amman Institute of Technology</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Student Portal</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-5 custom-scrollbar" aria-label="Student navigation">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx}>
              <div className="px-3 mb-2 text-[12px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
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

        <div className="p-2 border-t border-slate-200 bg-white/70">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-3 w-3" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-[292px] flex flex-col min-h-screen">
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
            <div className="relative flex w-[292px] flex-col bg-slate-50 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 bg-white/70">
                <div className="flex items-center gap-2">
                  <img src="/bit-hostel-logo.png" alt="Bannari Amman Institute of Technology Logo" className="h-[26px] w-[26px] object-contain drop-shadow-sm" />
                  <div className="font-bold text-slate-900 text-[12px]">Bannari Amman Institute of Technology</div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="rounded-xl bg-slate-100 p-2 text-slate-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-5 space-y-5" aria-label="Student mobile navigation">
                {NAV_GROUPS.map((group, idx) => (
                  <div key={idx}>
                    <div className="px-3 mb-2 text-[12px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
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
              <div className="p-2 border-t border-slate-200 bg-white/70">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-3 w-3" />
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
