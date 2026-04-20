import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  CheckSquare,
  List,
  Calendar,
  FileText,
  LogOut,
  X,
  Building2,
  MessageSquare,
  ClipboardCheck,
  ShieldAlert,
  Menu,
} from 'lucide-react';
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
        `group relative flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ease-in-out ${isActive
          ? 'bg-gradient-to-r from-cyan-400/30 via-cyan-300/20 to-sky-400/30 text-white shadow-[0_12px_25px_rgba(14,165,233,0.24)] ring-1 ring-cyan-200/35'
          : 'text-slate-300 hover:bg-white/8 hover:text-white'
        }`
      }
    >
      <span className="inline-flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
          <Icon className="h-4 w-4" />
        </span>
        <span>{label}</span>
      </span>
      <span className="text-[10px] text-slate-400 transition-colors duration-200 group-hover:text-slate-200">›</span>
    </NavLink>
  );
}

export default function Sidebar() {
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
    <div className="relative min-h-screen overflow-hidden bg-[#f4f7fb] font-sans text-slate-900">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute -left-20 top-[-80px] h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.26)_0%,rgba(45,212,191,0)_72%)]" />
        <div className="absolute right-[-90px] top-[10%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.22)_0%,rgba(56,189,248,0)_70%)]" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[292px] flex-col border-r border-slate-800/60 bg-[linear-gradient(190deg,#07152d_0%,#092041_45%,#0c274d_100%)] lg:flex">
        <div className="border-b border-slate-700/60 px-6 py-6">
          <div className="leading-tight">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300/90">Bit Campus</div>
            <div className="mt-1 text-3xl font-black tracking-[-0.04em] text-white">Admin Console</div>
          </div>
        </div>

        <div className="px-4 pt-4">
          <div className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/20 font-bold text-cyan-100 ring-1 ring-cyan-200/30">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-cyan-50">{user?.name || 'Admin'}</div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-200/80">Full Access</div>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 custom-scrollbar" aria-label="Admin navigation">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx}>
              <div className="mb-2 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
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

        <div className="border-t border-slate-700/70 p-4">
          <div className="rounded-2xl border border-cyan-100/20 bg-white/8 p-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2a1f45] px-4 py-2.5 text-sm font-semibold text-slate-100 transition-all duration-200 ease-in-out hover:bg-[#322753]"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-[292px]">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300/70 bg-white/90 text-slate-700 shadow-lg lg:hidden"
          aria-label="Open admin navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <TopNavBar 
          pageTitle={pageTitle}
          theme="admin"
        />

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="fixed inset-0 bg-black/45" onClick={() => setMobileOpen(false)} />
            <div className="relative flex w-[292px] flex-col bg-[linear-gradient(190deg,#07152d_0%,#092041_45%,#0c274d_100%)] shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-700/70 px-5 py-5">
                <div className="leading-tight">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300/90">Bit Campus</div>
                  <div className="text-xl font-black text-white">Admin Console</div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="rounded-xl bg-white/10 p-2 text-slate-200 transition-all duration-200 ease-in-out hover:bg-white/20 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Admin mobile navigation">
                {NAV_GROUPS.map((group, idx) => (
                  <div key={idx}>
                    <div className="mb-2 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
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
              <div className="border-t border-slate-700/70 p-4">
                <div className="rounded-2xl border border-cyan-100/20 bg-white/8 p-3">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2a1f45] px-4 py-2.5 text-sm font-semibold text-slate-100 transition-all duration-200 ease-in-out hover:bg-[#322753]"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="relative flex-1 px-4 py-4 md:px-6 lg:px-8 lg:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
