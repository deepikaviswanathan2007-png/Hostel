import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Home, Users, CheckSquare, List, Calendar, FileText, LogOut, X, Building2, MessageSquare, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import TopNavBar from './TopNavBar';

const NAV_GROUPS = [
  {
    title: 'Reports & Analytics',
    items: [
      { to: '/', label: 'Admin Dashboard', icon: Home, end: true },
      { to: '/attendance-reports', label: 'Attendance Reports', icon: ClipboardCheck },
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
        `group flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-all duration-200 ${isActive
          ? 'bg-brand-primary text-white shadow-sm'
          : 'text-black hover:bg-slate-100/90 hover:text-black'
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

export default function Sidebar({ children }) {
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
  const activeItem = allItems.find(item => (item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)));
  const pageTitle = activeItem?.label || 'Administrator Dashboard';
  const initials = user?.name?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div className="min-h-screen bg-brand-surface font-sans page-shell">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[292px] flex-col border-r border-slate-200 bg-slate-50 shadow-[0_10px_35px_rgba(15,23,42,0.08)] lg:flex">
        <div className="border-b border-slate-200 px-6 py-6 bg-white/70">
          <div className="flex items-center gap-2">
            <img src="/bit-hostel-logo.png" alt="Bannari Amman Institute of Technology Logo" className="h-[38px] w-[38px] object-contain drop-shadow-sm" />
            <div className="leading-tight">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-black leading-tight">Bannari Amman Institute of Technology</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-black">Hostel Management</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-5 custom-scrollbar" aria-label="Admin navigation">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx}>
              <div className="px-3 mb-2 text-[12px] font-extrabold uppercase tracking-[0.08em] text-black">
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

        <div className="border-t border-slate-200 p-2 bg-white/70">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-red-50 hover:text-black"
          >
            <LogOut className="h-3 w-3" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-[292px]">
        <TopNavBar 
          pageTitle={pageTitle}
          theme="admin"
        />

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="fixed inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
            <div className="relative flex w-[292px] flex-col bg-slate-50 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 bg-white/70">
                <div className="flex items-center gap-2">
                  <img src="/bit-hostel-logo.png" alt="Bannari Amman Institute of Technology Logo" className="h-[26px] w-[26px] object-contain drop-shadow-sm" />
                  <div className="font-bold text-black text-[12px]">Bannari Amman Institute of Technology</div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="rounded-xl bg-slate-100 p-2 text-slate-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-6 py-5">
                <div className="rounded-[24px] border border-[#ece8ff] bg-[#f8f6ff] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary text-sm font-bold text-white">
                      {initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-brand-muted">Full access</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-5 space-y-5" aria-label="Admin mobile navigation">
                {NAV_GROUPS.map((group, idx) => (
                  <div key={idx}>
                    <div className="px-3 mb-2 text-[12px] font-extrabold uppercase tracking-[0.08em] text-black">
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
              <div className="border-t border-slate-200 p-2 bg-white/70">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-red-50 hover:text-black"
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
