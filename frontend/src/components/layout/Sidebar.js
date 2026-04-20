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
      children={({ isActive }) => (
        <div
          className={`flex items-center gap-2 h-[38px] rounded-lg px-4 text-[13.5px] font-medium transition-all duration-150 m-0.5 mx-2 ${
            isActive
              ? 'bg-white/15 text-white border-l-3 border-blue-400 pl-[13px]'
              : 'text-white/70 hover:bg-white/8 hover:text-white'
          }`}
        >
          <Icon className="h-[15px] w-[15px] stroke-[1.75]" />
          <span>{label}</span>
        </div>
      )}
    />
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
    <div className="relative min-h-screen bg-brand-bg font-sans text-brand-text">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col bg-brand-sidebar shadow-[4px_0_20px_rgba(0,0,0,0.12)] lg:flex">
        {/* Logo Header */}
        <div className="border-b border-white/10 px-5 py-5 bg-[#152F5A]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <img src="/bit-hostel-logo.png" alt="Logo" className="h-7 w-7 object-contain" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/90 line-clamp-2">
                Bannari Amman Institute of Technology
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/50 mt-0.5">
                Admin Portal
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-0 py-4 space-y-4 scrollbar-thin" aria-label="Admin navigation">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx}>
              <div className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                {group.title}
              </div>
              <div className="space-y-0">
                {group.items.map(item => (
                  <NavItem key={item.to + item.label} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-[13px] font-medium text-white/50 transition-all hover:bg-white/7 hover:text-white/90"
          >
            <LogOut className="h-[15px] w-[15px]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-[260px] flex flex-col min-h-screen">
        <TopNavBar 
          pageTitle={pageTitle}
          theme="admin"
        />

        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-brand-sidebar px-4 py-3 flex items-center h-14">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white/70 hover:text-white transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-white text-sm font-medium ml-3">{pageTitle}</span>
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden pt-14">
            <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div className="relative flex w-[260px] flex-col bg-brand-sidebar shadow-xl">
              {/* Mobile Logo Header */}
              <div className="border-b border-white/10 px-5 py-4 bg-[#152F5A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                    <img src="/bit-hostel-logo.png" alt="Logo" className="h-6 w-6 object-contain" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-white/90">BAIT Admin</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-white/70 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 overflow-y-auto px-0 py-4 space-y-4 scrollbar-thin">
                {NAV_GROUPS.map((group, idx) => (
                  <div key={idx}>
                    <div className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                      {group.title}
                    </div>
                    <div className="space-y-0">
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

              {/* Mobile Logout */}
              <div className="border-t border-white/10 p-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-[13px] font-medium text-white/50 transition-all hover:bg-white/7 hover:text-white/90"
                >
                  <LogOut className="h-[15px] w-[15px]" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 px-6 py-5 lg:px-8 pt-16 lg:pt-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
