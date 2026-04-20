import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, CheckSquare, List, Calendar, FileText, LogOut, X, Building2, MessageSquare, ClipboardCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import TopNavBar from './TopNavBar';

const NAV_GROUPS = [
  {
    title: 'Reports & Analytics',
    items: [
      { to: '/', label: 'Admin Dashboard', icon: Home, end: true },
      { to: '/attendance-reports', label: 'Attendance Reports', icon: ClipboardCheck },
      { to: '/security-logs', label: 'Security Logs', icon: ShieldAlert },
    ]
  },
  {
    title: 'User Management',
    items: [
      { to: '/users', label: 'Admins & Staff', icon: Users },
      { to: '/students', label: 'All Students', icon: Users },
      { to: '/floor-wardens', label: 'Floor Wardens', icon: Users },
    ]
  },
  {
    title: 'Hostel & Room Management',
    items: [
      { to: '/hostels', label: 'Hostels', icon: Building2 },
      { to: '/rooms', label: 'Rooms Listing', icon: List },
      { to: '/allocations', label: 'Room Allocation', icon: CheckSquare },
      { to: '/mess-menu', label: 'Mess Menu', icon: List },
      { to: '/visitors', label: 'Visitors', icon: Users },
    ]
  },
  {
    title: 'Requests & Applications',
    items: [
      { to: '/applications', label: 'Hostel Applications', icon: Building2 },
      { to: '/outpasses', label: 'Leave / Outpasses', icon: CheckSquare },
    ]
  },
  {
    title: 'Complaints Management',
    items: [
      { to: '/complaints', label: 'Complaints', icon: FileText },
      { to: '/notices', label: 'Announcements', icon: Calendar },
      { to: '/messages', label: 'Warden Messages', icon: MessageSquare },
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
        `group relative flex items-center gap-3 rounded-xl border-l-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 ease-in-out ${isActive
          ? 'border-transparent bg-brand-primary text-white shadow-[0_0_20px_rgba(125,83,246,0.4)]'
          : 'border-transparent text-slate-400 hover:border-brand-primary/70 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const contentZoom = 0.95;
  const contentScaleStyle = {
    transform: `scale(${contentZoom})`,
    transformOrigin: 'top left',
    width: `${100 / contentZoom}%`,
  };
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allItems = NAV_GROUPS.flatMap(g => g.items);
  const activeItem = allItems.find(item => (item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)));
  const pageTitle = activeItem?.label || 'Administrator Dashboard';
  const initials = user?.name?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col bg-[#0F172A] lg:flex">
        <div className="border-b border-white/10 px-5 py-6">
          <div className="leading-tight">
            <div className="text-2xl font-black tracking-tight text-white">BIT</div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Hostel Management</div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 custom-scrollbar" aria-label="Admin navigation">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx}>
              <div className="mb-2 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#475569]">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map(item => (
                  <NavItem key={item.to + item.label} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{user?.name || 'Admin'}</div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Full Access</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl p-2 text-slate-400 transition-all duration-200 ease-in-out hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-[260px]">
        <TopNavBar 
          pageTitle={pageTitle}
          theme="admin"
        />

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="fixed inset-0 bg-black/45" onClick={() => setMobileOpen(false)} />
            <div className="relative flex w-[260px] flex-col bg-[#0F172A] shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
                <div className="leading-tight">
                  <div className="text-xl font-black text-white">BIT</div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Hostel Management</div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="rounded-xl bg-white/10 p-2 text-slate-300 transition-all duration-200 ease-in-out hover:bg-white/20 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Admin mobile navigation">
                {NAV_GROUPS.map((group, idx) => (
                  <div key={idx}>
                    <div className="mb-2 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#475569]">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                      {group.title}
                    </div>
                    <div className="space-y-1">
                      {group.items.map(item => (
                        <NavItem key={item.to + item.label} {...item} onClick={() => setMobileOpen(false)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 p-4">
                <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary text-sm font-bold text-white">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{user?.name || 'Admin'}</div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Full Access</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl p-2 text-slate-400 transition-all duration-200 ease-in-out hover:bg-white/10 hover:text-white"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 px-6 py-4 lg:px-8">
          <div style={contentScaleStyle}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
